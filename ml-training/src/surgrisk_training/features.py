from __future__ import annotations

import math
import re
from collections import Counter
import numpy as np
import pandas as pd

NUMERIC_FEATURES = [
    "age", "bmi", "asa_class", "comorbidity_active_count", "comorbidity_mild_count",
    "comorbidity_moderate_count", "comorbidity_severe_count", "systolic_bp", "diastolic_bp",
    "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl",
    "lab_hgb", "lab_creatinine", "lab_sodium", "lab_potassium", "lab_albumin", "lab_platelets", "lab_wbc", "lab_inr",
]
CATEGORICAL_FEATURES = ["sex_at_birth", "urgency", "specialty", "procedure_code", "anesthesia_type"]
VITAL_FEATURES = ["systolic_bp", "diastolic_bp", "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl"]
LAB_ALIASES = {
    "HGB": "lab_hgb", "HB": "lab_hgb", "HEMOGLOBIN": "lab_hgb",
    "CREATININE": "lab_creatinine", "CREAT": "lab_creatinine",
    "SODIUM": "lab_sodium", "NA": "lab_sodium",
    "POTASSIUM": "lab_potassium", "K": "lab_potassium",
    "ALBUMIN": "lab_albumin", "PLATELETS": "lab_platelets", "PLT": "lab_platelets",
    "WBC": "lab_wbc", "WHITE_BLOOD_CELL_COUNT": "lab_wbc", "INR": "lab_inr",
}
EXPECTED_LAB_UNITS = {
    "lab_hgb": {"g/dl", "g/dL"}, "lab_creatinine": {"mg/dl", "mg/dL"},
    "lab_sodium": {"mmol/l", "mmol/L"}, "lab_potassium": {"mmol/l", "mmol/L"},
    "lab_albumin": {"g/dl", "g/dL"}, "lab_platelets": {"10^9/l", "10^9/L", "10^3/µl", "10^3/uL"},
    "lab_wbc": {"10^9/l", "10^9/L", "10^3/µl", "10^3/uL"}, "lab_inr": {"ratio", "INR", ""},
}
SEVERITIES = ["MILD", "MODERATE", "SEVERE", "UNKNOWN"]


def _is_present(value) -> bool:
    return value is not None and not (isinstance(value, float) and math.isnan(value)) and str(value).strip() not in {"", "nan", "None"}


def _text(value, default="__MISSING__"):
    return str(value).strip() if _is_present(value) else default


def _as_float(value):
    if not _is_present(value):
        return np.nan
    try:
        return float(value)
    except (TypeError, ValueError):
        return np.nan


def _case_sidecar(frame: pd.DataFrame, case_id: str, case_time, time_column: str) -> pd.DataFrame:
    if frame.empty:
        return frame
    rows = frame.loc[frame["case_id"].astype(str) == str(case_id)].copy()
    if rows.empty:
        return rows
    return rows.loc[rows[time_column] <= case_time].copy()


def build_tabular_record(bundle, case: pd.Series) -> dict:
    case_id = str(case["case_id"])
    index_time = case["index_time"]
    record = {
        "age": _as_float(case.get("age")), "bmi": _as_float(case.get("bmi")),
        "asa_class": _as_float(case.get("asa_class")),
        "sex_at_birth": _text(case.get("sex_at_birth"), "UNKNOWN").upper(),
        "urgency": _text(case.get("urgency"), "UNKNOWN").upper(),
        "specialty": _text(case.get("specialty")).upper(),
        "procedure_code": _text(case.get("procedure_code")).upper(),
        "anesthesia_type": _text(case.get("anesthesia_type")).upper(),
    }
    comorbs = _case_sidecar(bundle.comorbidities, case_id, index_time, "observed_at")
    if not comorbs.empty:
        active = comorbs.loc[comorbs["status"].astype(str).str.upper() == "ACTIVE"]
    else:
        active = comorbs
    record["comorbidity_active_count"] = float(len(active))
    severity_counts = active["severity"].astype(str).str.upper().value_counts() if not active.empty else {}
    for severity in SEVERITIES:
        record[f"comorbidity_{severity.lower()}_count"] = float(severity_counts.get(severity, 0))

    vitals = _case_sidecar(bundle.vitals, case_id, index_time, "measured_at")
    if not vitals.empty:
        vitals = vitals.sort_values("measured_at")
        latest = vitals.iloc[-1]
    else:
        latest = {}
    for feature in VITAL_FEATURES:
        record[feature] = _as_float(latest.get(feature) if hasattr(latest, "get") else None)

    for feature in LAB_ALIASES.values():
        record[feature] = np.nan
    labs = _case_sidecar(bundle.labs, case_id, index_time, "collected_at")
    if not labs.empty:
        labs = labs.sort_values("collected_at")
        for _, lab in labs.iterrows():
            code = _text(lab.get("lab_code"), "").upper()
            feature = LAB_ALIASES.get(code)
            if not feature or str(lab.get("result_status") or "FINAL").upper() not in {"FINAL", "CORRECTED"}:
                continue
            unit = _text(lab.get("unit"), "")
            if unit and unit.lower() not in {u.lower() for u in EXPECTED_LAB_UNITS[feature]}:
                continue
            record[feature] = _as_float(lab.get("numeric_value"))
    return record


def build_tabular_records(bundle, cases: pd.DataFrame) -> list[dict]:
    return [build_tabular_record(bundle, row) for _, row in cases.iterrows()]


def fit_tabular_schema(records: list[dict], max_categories: int = 100) -> dict:
    medians = {}
    for name in NUMERIC_FEATURES:
        values = np.asarray([_as_float(row.get(name)) for row in records], dtype=float)
        valid = values[np.isfinite(values)]
        medians[name] = float(np.median(valid)) if len(valid) else 0.0
    categories = {}
    for name in CATEGORICAL_FEATURES:
        counts = Counter(str(row.get(name) or "__MISSING__") for row in records)
        kept = [value for value, _ in counts.most_common(max_categories) if value != "__OTHER__"]
        if "__MISSING__" not in kept:
            kept.append("__MISSING__")
        if "__OTHER__" not in kept:
            kept.append("__OTHER__")
        categories[name] = kept
    feature_names = NUMERIC_FEATURES.copy()
    for name in CATEGORICAL_FEATURES:
        feature_names.extend([f"{name}={value}" for value in categories[name]])
    return {"numeric_features": NUMERIC_FEATURES, "categorical_features": CATEGORICAL_FEATURES, "medians": medians, "categories": categories, "feature_names": feature_names}


def transform_tabular(records: list[dict], schema: dict) -> np.ndarray:
    matrix = []
    for row in records:
        values = []
        for name in schema["numeric_features"]:
            value = _as_float(row.get(name))
            if not np.isfinite(value):
                value = float(schema["medians"][name])
            values.append(value)
        for name in schema["categorical_features"]:
            value = str(row.get(name) or "__MISSING__")
            categories = schema["categories"][name]
            if value not in categories:
                value = "__OTHER__"
            values.extend(1.0 if value == category else 0.0 for category in categories)
        matrix.append(values)
    return np.asarray(matrix, dtype=np.float32)


def build_vital_sequences(bundle, cases: pd.DataFrame) -> list[list[list[float]]]:
    output = []
    for _, case in cases.iterrows():
        frame = _case_sidecar(bundle.vitals, str(case["case_id"]), case["index_time"], "measured_at")
        if frame.empty:
            output.append([])
            continue
        frame = frame.sort_values("measured_at")
        sequence = []
        for _, row in frame.iterrows():
            sequence.append([_as_float(row.get(name)) for name in VITAL_FEATURES])
        output.append(sequence)
    return output


def fit_sequence_scaler(sequences: list[list[list[float]]]) -> dict:
    flattened = [row for seq in sequences for row in seq]
    matrix = np.asarray(flattened, dtype=float) if flattened else np.empty((0, len(VITAL_FEATURES)))
    medians, means, scales = [], [], []
    for idx in range(len(VITAL_FEATURES)):
        column = matrix[:, idx] if len(matrix) else np.asarray([])
        valid = column[np.isfinite(column)]
        median = float(np.median(valid)) if len(valid) else 0.0
        filled = np.where(np.isfinite(column), column, median) if len(column) else np.asarray([median])
        mean = float(np.mean(filled))
        scale = float(np.std(filled))
        medians.append(median)
        means.append(mean)
        scales.append(scale if scale > 1e-8 else 1.0)
    return {"features": VITAL_FEATURES, "medians": medians, "means": means, "scales": scales}


def transform_vital_sequences(sequences, scaler: dict, max_length: int = 64):
    features = scaler["features"]
    medians = np.asarray(scaler["medians"], dtype=np.float32)
    means = np.asarray(scaler["means"], dtype=np.float32)
    scales = np.asarray(scaler["scales"], dtype=np.float32)
    X = np.zeros((len(sequences), max_length, len(features)), dtype=np.float32)
    lengths = np.ones(len(sequences), dtype=np.int64)
    for idx, seq in enumerate(sequences):
        if not seq:
            X[idx, 0, :] = 0.0
            lengths[idx] = 1
            continue
        arr = np.asarray(seq[-max_length:], dtype=np.float32)
        arr = np.where(np.isfinite(arr), arr, medians)
        arr = (arr - means) / scales
        lengths[idx] = len(arr)
        X[idx, :len(arr), :] = arr
    return X, lengths


def build_comorbidity_graph_records(bundle, cases: pd.DataFrame) -> list[list[dict]]:
    graphs = []
    for _, case in cases.iterrows():
        frame = _case_sidecar(bundle.comorbidities, str(case["case_id"]), case["index_time"], "observed_at")
        if not frame.empty:
            frame = frame.loc[frame["status"].astype(str).str.upper() == "ACTIVE"]
        nodes = []
        if not frame.empty:
            for _, row in frame.iterrows():
                code = _text(row.get("condition_code"), "").upper()
                if not code:
                    code = re.sub(r"[^A-Z0-9]+", "_", _text(row.get("condition_name"), "UNKNOWN").upper()).strip("_") or "UNKNOWN"
                severity = _text(row.get("severity"), "UNKNOWN").upper()
                if severity not in SEVERITIES:
                    severity = "UNKNOWN"
                nodes.append({"condition_code": code, "severity": severity, "active": 1})
        if not nodes:
            nodes = [{"condition_code": "__NO_COMORBIDITY__", "severity": "UNKNOWN", "active": 0}]
        graphs.append(nodes)
    return graphs


def build_case_notes(bundle, cases: pd.DataFrame, require_deidentified: bool = True) -> list[str]:
    notes = bundle.notes
    result = []
    if not notes.empty and require_deidentified:
        deidentified = notes["is_deidentified"].astype(str).str.strip().str.lower().isin(["1", "true", "yes", "y"])
        if not deidentified.all():
            raise ValueError("BioBERT note text must all be explicitly marked de-identified.")
    by_case = {case_id: [] for case_id in cases["case_id"].astype(str)}
    index_times = cases.set_index("case_id")["index_time"]
    if not notes.empty:
        for _, row in notes.iterrows():
            case_id = str(row["case_id"])
            if case_id not in by_case or row["authored_at"] > index_times.loc[case_id]:
                continue
            text = _text(row.get("text"), "").strip()
            if text:
                by_case[case_id].append(text)
    for case_id in cases["case_id"].astype(str):
        result.append("\n[NOTE]\n".join(by_case[case_id]))
    return result
