from __future__ import annotations
from pathlib import Path
import time
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.models.base import ModelAdapter
from app.models.adapters.common import verify_release, load_json, calibrated_probability, make_prediction, MissingModalityError

class BioBERTAdapter(ModelAdapter):
    branch_id = "biobert"

    def __init__(self, branch_dir: Path):
        self.branch_dir = branch_dir
        self.release = verify_release(branch_dir, self.branch_id)
        if not self.release: raise ValueError("BioBERT release approval/checksum verification failed.")
        self.schema = load_json(branch_dir / "text-schema.json")
        self.calibrator = load_json(branch_dir / "calibrator.json")
        model_dir = branch_dir / "model"
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir, local_files_only=True)
        self.model.eval()
        self.model_version = self.release["model_version"]
        self.calibration_status = self.release["calibration_status"]
        self.validation_reference = self.release["validation_reference"]

    def predict(self, payload):
        notes = str(payload.clinical_notes or "").strip()
        if not notes:
            raise MissingModalityError("BioBERT requires approved preoperative clinical notes; no prediction was generated.")
        started = time.perf_counter()
        encoded = self.tokenizer(notes, truncation=True, max_length=int(self.schema["max_length"]), return_tensors="pt")
        with torch.no_grad():
            logits = self.model(**encoded).logits.reshape(-1)
            raw = float(torch.sigmoid(logits)[0].item())
        probability = calibrated_probability(raw, self.calibrator)
        count = int(encoded["attention_mask"].sum().item())
        return make_prediction(self.branch_id, probability, self.release, (time.perf_counter() - started) * 1000, count)
