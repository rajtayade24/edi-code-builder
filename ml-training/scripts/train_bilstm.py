from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
from surgrisk_training.artifacts import save_json, write_branch_release
from surgrisk_training.calibration import apply_calibrator, fit_platt_calibrator
from surgrisk_training.features import (
    VITAL_FEATURES,
    build_vital_sequences,
    fit_sequence_scaler,
    transform_vital_sequences,
)
from surgrisk_training.metrics import evaluate_probabilities
from surgrisk_training.networks import VitalBiLSTM
from surgrisk_training.pipeline import load_run, read_config
from torch import nn
from torch.utils.data import DataLoader, TensorDataset


def predict(model, X, lengths, device, batch_size=64):
    model.eval(); outputs = []
    dataset = TensorDataset(torch.tensor(X, dtype=torch.float32), torch.tensor(lengths, dtype=torch.long))
    with torch.no_grad():
        for xb, lb in DataLoader(dataset, batch_size=batch_size, shuffle=False):
            logits = model(xb.to(device), lb.to(device))
            outputs.extend(torch.sigmoid(logits).cpu().numpy().tolist())
    return np.asarray(outputs, dtype=float)


def main():
    parser = argparse.ArgumentParser(description="Train the BiLSTM preoperative vital-sign sequence branch.")
    parser.add_argument("--data-dir", required=True); parser.add_argument("--run-dir", required=True)
    parser.add_argument("--config", default="configs/training.json"); parser.add_argument("--model-version", default="bilstm-dev-0.1.0")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    parser.add_argument("--min-followup-days", type=int, default=30)
    parser.add_argument("--endpoint", default="30_DAY_MORTALITY")
    args = parser.parse_args()
    bundle, splits = load_run(args.data_dir, args.run_dir, min_followup_days=args.min_followup_days); config = read_config(args.config)
    seqs = {name: build_vital_sequences(bundle, frame) for name, frame in splits.items()}
    scaler = fit_sequence_scaler(seqs["train"])
    max_length = int(config["sequence"]["max_length"])
    arrays = {name: transform_vital_sequences(seqs[name], scaler, max_length) for name in splits}
    labels = {name: splits[name]["outcome_30d_mortality"].to_numpy(dtype=np.float32) for name in splits}
    settings = config.get("training", {}).get("bilstm", {})
    device = torch.device("cuda" if args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available()) else "cpu")
    torch.manual_seed(int(config.get("random_seed", 42)))
    model = VitalBiLSTM(len(VITAL_FEATURES), int(settings.get("hidden_size", 64)), int(settings.get("num_layers", 1)), float(settings.get("dropout", 0.1))).to(device)
    X_train, L_train = arrays["train"]
    dataset = TensorDataset(torch.tensor(X_train), torch.tensor(L_train), torch.tensor(labels["train"]))
    loader = DataLoader(dataset, batch_size=int(settings.get("batch_size", 32)), shuffle=True)
    positives = max(1.0, float(labels["train"].sum())); negatives = max(1.0, float(len(labels["train"]) - positives))
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([negatives / positives], device=device))
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(settings.get("learning_rate", 0.001)))
    for epoch in range(int(settings.get("epochs", 40))):
        model.train(); total = 0.0
        for xb, lb, yb in loader:
            xb, lb, yb = xb.to(device), lb.to(device), yb.to(device)
            optimizer.zero_grad(set_to_none=True); logits = model(xb, lb); loss = criterion(logits, yb)
            loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0); optimizer.step(); total += float(loss.item())
        print(f"epoch={epoch + 1} train_loss={total / max(1, len(loader)):.5f}")
    raw_cal = predict(model, *arrays["calibration"], device)
    raw_test = predict(model, *arrays["test"], device)
    calibrator = fit_platt_calibrator(raw_cal, labels["calibration"])
    calibrated_test = apply_calibrator(raw_test, calibrator)
    metrics = evaluate_probabilities(labels["test"], calibrated_test, splits["test"]["sex_at_birth"].fillna("UNKNOWN").astype(str))
    metrics.update({"endpoint": args.endpoint, "test_split_only": True, "branch": "bilstm", "sequence_features": VITAL_FEATURES})
    output = Path(args.run_dir) / "artifacts" / "bilstm"; output.mkdir(parents=True, exist_ok=True)
    torch.save(model.cpu().state_dict(), output / "model.pt")
    save_json(output / "sequence-schema.json", {"features": VITAL_FEATURES, "scaler": scaler, "max_length": max_length, "hidden_size": int(settings.get("hidden_size", 64)), "num_layers": int(settings.get("num_layers", 1)), "dropout": float(settings.get("dropout", 0.1))})
    save_json(output / "calibrator.json", calibrator); save_json(output / "evaluation.json", metrics)
    write_branch_release(output, "bilstm", args.model_version, "evaluation.json")
    print(f"BiLSTM artifacts saved to {output.resolve()}"); print(metrics)
    print("Release status: PENDING_EXTERNAL_REVIEW; not approved for clinical use.")

if __name__ == "__main__": main()
