from __future__ import annotations

import time
from pathlib import Path

import numpy as np

from app.models.adapters.common import (
    as_float,
    calibrated_probability,
    load_json,
    make_prediction,
    parse_time,
    value,
    verify_release,
)
from app.models.adapters.net_models import VitalBiLSTM
from app.models.base import ModelAdapter

FEATURES = ["systolic_bp", "diastolic_bp", "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl"]

class BiLSTMAdapter(ModelAdapter):
    branch_id = "bilstm"

    def __init__(self, branch_dir: Path):
        import torch
        self.torch = torch
        self.branch_dir = branch_dir
        self.release = verify_release(branch_dir, self.branch_id)
        if not self.release: raise ValueError("BiLSTM release approval/checksum verification failed.")
        self.schema = load_json(branch_dir / "sequence-schema.json")
        self.calibrator = load_json(branch_dir / "calibrator.json")
        self.model = VitalBiLSTM(
            len(self.schema["features"]), self.schema["hidden_size"], self.schema["num_layers"], self.schema["dropout"]
        )
        state = torch.load(branch_dir / "model.pt", map_location="cpu", weights_only=True)
        self.model.load_state_dict(state); self.model.eval()
        self.model_version = self.release["model_version"]
        self.calibration_status = self.release["calibration_status"]
        self.validation_reference = self.release["validation_reference"]

    def predict(self, payload):
        torch = self.torch; started = time.perf_counter()
        ordered = sorted(payload.vitals, key=lambda x: parse_time(value(x, "measured_at")))
        ordered = ordered[-int(self.schema["max_length"]):]
        medians = np.asarray(self.schema["scaler"]["medians"], dtype=np.float32)
        means = np.asarray(self.schema["scaler"]["means"], dtype=np.float32)
        scales = np.asarray(self.schema["scaler"]["scales"], dtype=np.float32)
        if not ordered:
            arr = np.zeros((1, len(FEATURES)), dtype=np.float32); length = 1
        else:
            arr = np.asarray([[as_float(row, name) for name in FEATURES] for row in ordered], dtype=np.float32)
            arr = np.where(np.isfinite(arr), arr, medians)
            arr = (arr - means) / scales
            length = len(arr)
        X = np.zeros((1, int(self.schema["max_length"]), len(FEATURES)), dtype=np.float32)
        X[0, :length, :] = arr
        with torch.no_grad():
            logits = self.model(torch.tensor(X), torch.tensor([length], dtype=torch.long))
            raw = float(torch.sigmoid(logits)[0].item())
        probability = calibrated_probability(raw, self.calibrator)
        return make_prediction(self.branch_id, probability, self.release, (time.perf_counter() - started) * 1000, int(len(ordered) * len(FEATURES)))
