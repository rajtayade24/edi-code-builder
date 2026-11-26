from __future__ import annotations
from pathlib import Path
import time
import torch
from app.models.base import ModelAdapter
from app.models.adapters.common import verify_release, load_json, value, calibrated_probability, make_prediction, slug
from app.models.adapters.net_models import ComorbidityGraphAttention

SEVERITY_MAP = {"MILD": 1, "MODERATE": 2, "SEVERE": 3, "UNKNOWN": 0}

class GATAdapter(ModelAdapter):
    branch_id = "gat"

    def __init__(self, branch_dir: Path):
        self.branch_dir = branch_dir
        self.release = verify_release(branch_dir, self.branch_id)
        if not self.release: raise ValueError("GAT release approval/checksum verification failed.")
        self.schema = load_json(branch_dir / "graph-schema.json")
        self.calibrator = load_json(branch_dir / "calibrator.json")
        self.vocab = self.schema["condition_vocab"]
        self.max_nodes = int(self.schema["max_nodes"])
        self.model = ComorbidityGraphAttention(
            len(self.vocab), self.schema["embedding_dim"], self.schema["hidden_size"], self.schema["num_heads"]
        )
        state = torch.load(branch_dir / "model.pt", map_location="cpu", weights_only=True)
        self.model.load_state_dict(state); self.model.eval()
        self.model_version = self.release["model_version"]
        self.calibration_status = self.release["calibration_status"]
        self.validation_reference = self.release["validation_reference"]

    def predict(self, payload):
        started = time.perf_counter()
        nodes = []
        for item in payload.comorbidities:
            if str(value(item, "status", "ACTIVE")).upper() != "ACTIVE": continue
            code = value(item, "code") or slug(value(item, "name", "UNKNOWN"))
            severity = str(value(item, "severity", "UNKNOWN")).upper()
            if severity not in SEVERITY_MAP: severity = "UNKNOWN"
            nodes.append((str(code).strip().upper(), severity, 1.0))
        if not nodes: nodes = [("__NO_COMORBIDITY__", "UNKNOWN", 0.0)]
        nodes = sorted(nodes)[:self.max_nodes]
        ids = torch.zeros((1, self.max_nodes), dtype=torch.long)
        severity_ids = torch.zeros((1, self.max_nodes), dtype=torch.long)
        active = torch.zeros((1, self.max_nodes), dtype=torch.float32)
        for idx, (code, severity, is_active) in enumerate(nodes):
            ids[0, idx] = int(self.vocab.get(code, self.vocab.get("__UNK__", 1)))
            severity_ids[0, idx] = SEVERITY_MAP[severity]
            active[0, idx] = is_active
        lengths = torch.tensor([len(nodes)], dtype=torch.long)
        with torch.no_grad():
            logits = self.model(ids, severity_ids, active, lengths)
            raw = float(torch.sigmoid(logits)[0].item())
        probability = calibrated_probability(raw, self.calibrator)
        return make_prediction(self.branch_id, probability, self.release, (time.perf_counter() - started) * 1000, len(nodes))
