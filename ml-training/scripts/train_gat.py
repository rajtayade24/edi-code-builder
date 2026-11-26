from __future__ import annotations
import argparse
from pathlib import Path
from collections import Counter
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from surgrisk_training.pipeline import load_run, read_config
from surgrisk_training.features import build_comorbidity_graph_records, SEVERITIES
from surgrisk_training.networks import ComorbidityGraphAttention
from surgrisk_training.calibration import fit_platt_calibrator, apply_calibrator
from surgrisk_training.metrics import evaluate_probabilities
from surgrisk_training.artifacts import save_json, write_branch_release


def fit_vocab(graphs):
    counts = Counter(node["condition_code"] for graph in graphs for node in graph)
    tokens = ["__PAD__", "__UNK__", "__NO_COMORBIDITY__"] + sorted(token for token in counts if token not in {"__NO_COMORBIDITY__", "__PAD__", "__UNK__"})
    return {token: idx for idx, token in enumerate(tokens)}


def encode_graphs(graphs, vocab, max_nodes):
    condition_ids = np.zeros((len(graphs), max_nodes), dtype=np.int64)
    severity_ids = np.zeros((len(graphs), max_nodes), dtype=np.int64)
    active_values = np.zeros((len(graphs), max_nodes), dtype=np.float32)
    lengths = np.ones(len(graphs), dtype=np.int64)
    severity_map = {"MILD": 1, "MODERATE": 2, "SEVERE": 3, "UNKNOWN": 0}
    truncated = 0
    for row_idx, graph in enumerate(graphs):
        nodes = sorted(graph, key=lambda x: (x["condition_code"], x["severity"]))[:max_nodes]
        if len(graph) > max_nodes: truncated += 1
        lengths[row_idx] = max(1, len(nodes))
        for col_idx, node in enumerate(nodes):
            condition_ids[row_idx, col_idx] = vocab.get(node["condition_code"], vocab["__UNK__"])
            severity_ids[row_idx, col_idx] = severity_map.get(node["severity"], 0)
            active_values[row_idx, col_idx] = float(node["active"])
    return condition_ids, severity_ids, active_values, lengths, truncated


def predict(model, encoded, device):
    model.eval(); outputs = []
    dataset = TensorDataset(*(torch.tensor(arr) for arr in encoded))
    with torch.no_grad():
        for ids, sev, active, lengths in DataLoader(dataset, batch_size=64, shuffle=False):
            logits = model(ids.to(device), sev.to(device), active.to(device), lengths.to(device))
            outputs.extend(torch.sigmoid(logits).cpu().numpy().tolist())
    return np.asarray(outputs, dtype=float)


def main():
    parser = argparse.ArgumentParser(description="Train the comorbidity graph-attention branch using patient-specific co-occurrence graphs.")
    parser.add_argument("--data-dir", required=True); parser.add_argument("--run-dir", required=True)
    parser.add_argument("--config", default="configs/training.json"); parser.add_argument("--model-version", default="gat-dev-0.1.0")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    args = parser.parse_args()
    bundle, splits = load_run(args.data_dir, args.run_dir); config = read_config(args.config)
    graph_records = {name: build_comorbidity_graph_records(bundle, frame) for name, frame in splits.items()}
    vocab = fit_vocab(graph_records["train"])
    settings = config.get("training", {}).get("gat", {})
    max_nodes = int(settings.get("max_nodes", 64))
    encoded = {name: encode_graphs(graph_records[name], vocab, max_nodes) for name in splits}
    X = {name: value[:4] for name, value in encoded.items()}
    truncated = {name: int(value[4]) for name, value in encoded.items()}
    labels = {name: splits[name]["outcome_30d_mortality"].to_numpy(dtype=np.float32) for name in splits}
    device = torch.device("cuda" if args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available()) else "cpu")
    torch.manual_seed(int(config.get("random_seed", 42)))
    model = ComorbidityGraphAttention(len(vocab), int(settings.get("embedding_dim", 24)), int(settings.get("hidden_size", 64)), int(settings.get("num_heads", 4))).to(device)
    train_tensors = TensorDataset(*(torch.tensor(arr) for arr in X["train"]), torch.tensor(labels["train"]))
    loader = DataLoader(train_tensors, batch_size=int(settings.get("batch_size", 32)), shuffle=True)
    pos = max(1.0, float(labels["train"].sum())); neg = max(1.0, float(len(labels["train"]) - pos))
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([neg / pos], device=device))
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(settings.get("learning_rate", 0.001)))
    for epoch in range(int(settings.get("epochs", 40))):
        model.train(); total = 0.0
        for ids, sev, active, lengths, y in loader:
            ids, sev, active, lengths, y = ids.to(device), sev.to(device), active.to(device), lengths.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True); logits = model(ids, sev, active, lengths); loss = criterion(logits, y)
            loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0); optimizer.step(); total += float(loss.item())
        print(f"epoch={epoch + 1} train_loss={total / max(1, len(loader)):.5f}")
    raw_cal = predict(model, X["calibration"], device); raw_test = predict(model, X["test"], device)
    calibrator = fit_platt_calibrator(raw_cal, labels["calibration"])
    calibrated_test = apply_calibrator(raw_test, calibrator)
    metrics = evaluate_probabilities(labels["test"], calibrated_test, splits["test"]["sex_at_birth"].fillna("UNKNOWN").astype(str))
    metrics.update({"endpoint": "30_DAY_MORTALITY", "test_split_only": True, "branch": "gat", "graph_definition": "active comorbidity nodes per case with dense within-case attention", "truncated_graph_counts": truncated})
    output = Path(args.run_dir) / "artifacts" / "gat"; output.mkdir(parents=True, exist_ok=True)
    torch.save(model.cpu().state_dict(), output / "model.pt")
    save_json(output / "graph-schema.json", {"condition_vocab": vocab, "severity_map": {"MILD": 1, "MODERATE": 2, "SEVERE": 3, "UNKNOWN": 0}, "max_nodes": max_nodes, "embedding_dim": int(settings.get("embedding_dim", 24)), "hidden_size": int(settings.get("hidden_size", 64)), "num_heads": int(settings.get("num_heads", 4)), "graph_definition": "Each patient's active comorbidities form one fully connected attention graph; this is not an externally curated ontology."})
    save_json(output / "calibrator.json", calibrator); save_json(output / "evaluation.json", metrics)
    write_branch_release(output, "gat", args.model_version, "evaluation.json")
    print(f"GAT artifacts saved to {output.resolve()}"); print(metrics)
    print("Release status: PENDING_EXTERNAL_REVIEW; not approved for clinical use.")

if __name__ == "__main__": main()
