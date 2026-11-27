from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch
from surgrisk_training.artifacts import save_json, write_branch_release
from surgrisk_training.calibration import apply_calibrator, fit_platt_calibrator
from surgrisk_training.features import build_case_notes
from surgrisk_training.metrics import evaluate_probabilities
from surgrisk_training.pipeline import load_run, read_config
from torch import nn
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def encode_texts(tokenizer, texts, max_length):
    encoded = tokenizer(texts, padding="max_length", truncation=True, max_length=max_length, return_tensors="pt")
    return encoded["input_ids"], encoded["attention_mask"]


def predict(model, dataset, device):
    model.eval(); outputs = []
    with torch.no_grad():
        for input_ids, attention_mask in DataLoader(dataset, batch_size=16, shuffle=False):
            logits = model(input_ids=input_ids.to(device), attention_mask=attention_mask.to(device)).logits.squeeze(-1)
            outputs.extend(torch.sigmoid(logits).cpu().numpy().tolist())
    return np.asarray(outputs, dtype=float)


def main():
    parser = argparse.ArgumentParser(description="Fine-tune BioBERT on approved, de-identified preoperative notes.")
    parser.add_argument("--data-dir", required=True); parser.add_argument("--run-dir", required=True)
    parser.add_argument("--config", default="configs/training.json")
    parser.add_argument("--base-model", default="dmis-lab/biobert-base-cased-v1.2")
    parser.add_argument("--model-version", default="biobert-dev-0.1.0")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    parser.add_argument("--min-followup-days", type=int, default=30)
    parser.add_argument("--endpoint", default="30_DAY_MORTALITY")
    args = parser.parse_args()
    bundle, splits = load_run(args.data_dir, args.run_dir, require_notes=True, min_followup_days=args.min_followup_days)
    notes = {name: build_case_notes(bundle, frame, require_deidentified=True) for name, frame in splits.items()}
    for name, texts in notes.items():
        missing = [idx for idx, text in enumerate(texts) if not text.strip()]
        if missing:
            raise ValueError(f"BioBERT branch requires an approved pre-index de-identified note for every {name} case; {len(missing)} cases have no usable note. Do not silently impute blank text.")
    config = read_config(args.config); settings = config.get("training", {}).get("biobert", {})
    max_length = int(settings.get("max_length", 384))
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    model = AutoModelForSequenceClassification.from_pretrained(args.base_model, num_labels=1, ignore_mismatched_sizes=True)
    device = torch.device("cuda" if args.device == "cuda" or (args.device == "auto" and torch.cuda.is_available()) else "cpu")
    model.to(device); torch.manual_seed(int(config.get("random_seed", 42)))
    encoded = {name: encode_texts(tokenizer, notes[name], max_length) for name in splits}
    labels = {name: torch.tensor(splits[name]["outcome_30d_mortality"].to_numpy(dtype=np.float32)) for name in splits}
    train_dataset = TensorDataset(encoded["train"][0], encoded["train"][1], labels["train"])
    loader = DataLoader(train_dataset, batch_size=int(settings.get("batch_size", 8)), shuffle=True)
    pos = max(1.0, float(labels["train"].sum())); neg = max(1.0, float(len(labels["train"]) - pos))
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([neg / pos], device=device))
    optimizer = torch.optim.AdamW(model.parameters(), lr=float(settings.get("learning_rate", 2e-5)), weight_decay=float(settings.get("weight_decay", 0.01)))
    for epoch in range(int(settings.get("epochs", 3))):
        model.train(); total = 0.0
        for input_ids, attention_mask, y in loader:
            input_ids, attention_mask, y = input_ids.to(device), attention_mask.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(input_ids=input_ids, attention_mask=attention_mask).logits.squeeze(-1)
            loss = criterion(logits, y); loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0); optimizer.step(); total += float(loss.item())
        print(f"epoch={epoch + 1} train_loss={total / max(1, len(loader)):.5f}")
    calibration_ds = TensorDataset(*encoded["calibration"])
    test_ds = TensorDataset(*encoded["test"])
    raw_cal = predict(model, calibration_ds, device); raw_test = predict(model, test_ds, device)
    calibrator = fit_platt_calibrator(raw_cal, labels["calibration"].numpy())
    calibrated_test = apply_calibrator(raw_test, calibrator)
    metrics = evaluate_probabilities(labels["test"].numpy(), calibrated_test, splits["test"]["sex_at_birth"].fillna("UNKNOWN").astype(str))
    metrics.update({"endpoint": args.endpoint, "test_split_only": True, "branch": "biobert", "base_model": args.base_model, "max_length": max_length, "notes_deidentified": True})
    output = Path(args.run_dir) / "artifacts" / "biobert"; output.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(output / "model"); tokenizer.save_pretrained(output / "model")
    save_json(output / "calibrator.json", calibrator); save_json(output / "evaluation.json", metrics)
    save_json(output / "text-schema.json", {"base_model": args.base_model, "max_length": max_length, "requires_nonempty_deidentified_pre_index_notes": True})
    write_branch_release(output, "biobert", args.model_version, "evaluation.json")
    print(f"BioBERT artifacts saved to {output.resolve()}"); print(metrics)
    print("Release status: PENDING_EXTERNAL_REVIEW; not approved for clinical use.")

if __name__ == "__main__": main()
