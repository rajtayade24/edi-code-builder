from __future__ import annotations

import time
from pathlib import Path

import numpy as np
from xgboost import XGBClassifier

from app.models.adapters.common import (
    as_float,
    calibrated_probability,
    load_json,
    make_prediction,
    parse_time,
    value,
    verify_release,
)
from app.models.base import ModelAdapter

LAB_ALIASES = {
    "HGB": "lab_hgb", "HB": "lab_hgb", "HEMOGLOBIN": "lab_hgb", "CREATININE": "lab_creatinine", "CREAT": "lab_creatinine",
    "SODIUM": "lab_sodium", "NA": "lab_sodium", "POTASSIUM": "lab_potassium", "K": "lab_potassium", "ALBUMIN": "lab_albumin",
    "PLATELETS": "lab_platelets", "PLT": "lab_platelets", "WBC": "lab_wbc", "WHITE_BLOOD_CELL_COUNT": "lab_wbc", "INR": "lab_inr",
}
LAB_UNITS = {
    "lab_hgb": {"g/dl"}, "lab_creatinine": {"mg/dl"}, "lab_sodium": {"mmol/l"}, "lab_potassium": {"mmol/l"},
    "lab_albumin": {"g/dl"}, "lab_platelets": {"10^9/l", "10^3/µl", "10^3/ul"}, "lab_wbc": {"10^9/l", "10^3/µl", "10^3/ul"}, "lab_inr": {"ratio", "inr", ""},
}


def make_record(payload):
    patient, procedure = payload.patient, payload.procedure
    record = {
        "age": as_float(patient, "age"), "bmi": as_float(patient, "bmi"), "asa_class": as_float(procedure, "asa_class"),
        "sex_at_birth": str(value(patient, "sex_at_birth", "UNKNOWN") or "UNKNOWN").upper(),
        "urgency": str(value(procedure, "urgency", "UNKNOWN") or "UNKNOWN").upper(),
        "specialty": str(value(procedure, "specialty", "__MISSING__") or "__MISSING__").upper(),
        "procedure_code": str(value(procedure, "code", "__MISSING__") or "__MISSING__").upper(),
        "anesthesia_type": str(value(procedure, "anesthesia_type", "__MISSING__") or "__MISSING__").upper(),
    }
    active = [item for item in payload.comorbidities if str(value(item, "status", "ACTIVE")).upper() == "ACTIVE"]
    record["comorbidity_active_count"] = float(len(active))
    for severity in ("MILD", "MODERATE", "SEVERE", "UNKNOWN"):
        record[f"comorbidity_{severity.lower()}_count"] = float(sum(str(value(item, "severity", "UNKNOWN")).upper() == severity for item in active))
    vitals = sorted(payload.vitals, key=lambda x: parse_time(value(x, "measured_at")))
    latest = vitals[-1] if vitals else None
    for feature in ("systolic_bp", "diastolic_bp", "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl"):
        record[feature] = as_float(latest, feature)
    for feature in set(LAB_ALIASES.values()): record[feature] = float("nan")
    labs = sorted(payload.lab_results, key=lambda x: parse_time(value(x, "collected_at")))
    for lab in labs:
        code = str(value(lab, "code", "") or "").strip().upper()
        feature = LAB_ALIASES.get(code)
        if not feature: continue
        unit = str(value(lab, "unit", "") or "").strip().lower()
        if unit and unit not in LAB_UNITS[feature]: continue
        record[feature] = as_float(lab, "numeric_value")
    return record


class XGBoostAdapter(ModelAdapter):
    branch_id = "xgboost"

    def __init__(self, branch_dir: Path):
        self.branch_dir = branch_dir
        self.release = verify_release(branch_dir, self.branch_id)
        if not self.release: raise ValueError("XGBoost release approval/checksum verification failed.")
        self.model = XGBClassifier(); self.model.load_model(str(branch_dir / "model.json"))
        self.schema = load_json(branch_dir / "feature-schema.json")
        self.calibrator = load_json(branch_dir / "calibrator.json")
        self.model_version = self.release["model_version"]
        self.calibration_status = self.release["calibration_status"]
        self.validation_reference = self.release["validation_reference"]

    def predict(self, payload):
        started = time.perf_counter()
        record = make_record(payload); values = []
        for name in self.schema["numeric_features"]:
            raw = record.get(name, float("nan"))
            if not np.isfinite(raw): raw = self.schema["medians"][name]
            values.append(float(raw))
        for name in self.schema["categorical_features"]:
            raw = str(record.get(name) or "__MISSING__")
            categories = self.schema["categories"][name]
            if raw not in categories: raw = "__OTHER__"
            values.extend(1.0 if raw == category else 0.0 for category in categories)
        raw_probability = float(self.model.predict_proba(np.asarray([values], dtype=np.float32))[0, 1])
        probability = calibrated_probability(raw_probability, self.calibrator)
        elapsed = (time.perf_counter() - started) * 1000
        return make_prediction(self.branch_id, probability, self.release, elapsed, len(values))
