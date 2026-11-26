from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import pandas as pd

CASE_COLUMNS = [
    "case_id", "patient_id", "index_time", "outcome_30d_mortality", "outcome_observed",
    "followup_days", "age", "sex_at_birth", "bmi", "procedure_name", "procedure_code",
    "specialty", "urgency", "asa_class", "anesthesia_type",
]
SIDECAR_COLUMNS = {
    "comorbidities": ["case_id", "condition_code", "condition_name", "severity", "status", "observed_at"],
    "vitals": ["case_id", "measured_at", "systolic_bp", "diastolic_bp", "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl"],
    "labs": ["case_id", "collected_at", "lab_code", "test_name", "numeric_value", "unit", "result_status"],
    "notes": ["case_id", "authored_at", "is_deidentified", "note_type", "text"],
}

@dataclass
class DatasetBundle:
    cases: pd.DataFrame
    comorbidities: pd.DataFrame
    vitals: pd.DataFrame
    labs: pd.DataFrame
    notes: pd.DataFrame
    report: dict


def _read_csv(path: Path, required: list[str], optional: bool = False) -> pd.DataFrame:
    if not path.exists():
        if optional:
            return pd.DataFrame(columns=required)
        raise FileNotFoundError(f"Required dataset file is missing: {path}")
    frame = pd.read_csv(path)
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise ValueError(f"{path.name} is missing required columns: {', '.join(missing)}")
    return frame


def load_dataset(data_dir: str | Path, require_deidentified_notes: bool = False) -> DatasetBundle:
    root = Path(data_dir)
    cases = _read_csv(root / "cases.csv", CASE_COLUMNS)
    sidecars = {
        name: _read_csv(root / f"{name}.csv", cols, optional=True)
        for name, cols in SIDECAR_COLUMNS.items()
    }
    if cases.empty:
        raise ValueError("cases.csv contains headers but no case records. Add governed, de-identified data first.")
    if cases["case_id"].isna().any() or cases["patient_id"].isna().any():
        raise ValueError("case_id and patient_id must be populated for every case.")
    if cases["case_id"].astype(str).duplicated().any():
        duplicates = cases.loc[cases["case_id"].astype(str).duplicated(), "case_id"].astype(str).tolist()[:10]
        raise ValueError(f"cases.csv has duplicate case_id values, examples: {duplicates}")
    cases["case_id"] = cases["case_id"].astype(str)
    cases["patient_id"] = cases["patient_id"].astype(str)
    cases["index_time"] = pd.to_datetime(cases["index_time"], errors="coerce", utc=True)
    if cases["index_time"].isna().any():
        raise ValueError("Every cases.csv index_time must be a parseable ISO-8601 timestamp.")

    for name, frame in sidecars.items():
        if frame.empty:
            continue
        frame["case_id"] = frame["case_id"].astype(str)
        unknown = sorted(set(frame["case_id"]) - set(cases["case_id"]))
        if unknown:
            raise ValueError(f"{name}.csv contains case_id values not found in cases.csv: {unknown[:10]}")
        time_col = {"comorbidities": "observed_at", "vitals": "measured_at", "labs": "collected_at", "notes": "authored_at"}[name]
        frame[time_col] = pd.to_datetime(frame[time_col], errors="coerce", utc=True)
        if frame[time_col].isna().any():
            raise ValueError(f"{name}.csv has missing/invalid {time_col} values.")
    vital_ranges = {
        "systolic_bp": (40, 300), "diastolic_bp": (20, 200), "heart_rate": (20, 250),
        "respiratory_rate": (4, 80), "temperature_c": (25, 45),
        "oxygen_saturation": (0, 100), "blood_glucose_mg_dl": (1, 2000),
    }
    vitals = sidecars["vitals"]
    for column, (lower, upper) in vital_ranges.items():
        if not vitals.empty:
            numeric = pd.to_numeric(vitals[column], errors="coerce")
            invalid = numeric.notna() & ~numeric.between(lower, upper)
            if invalid.any():
                raise ValueError(f"vitals.csv {column} contains values outside {lower}–{upper}.")
    if not sidecars["comorbidities"].empty:
        severity_values = sidecars["comorbidities"]["severity"].astype(str).str.upper()
        status_values = sidecars["comorbidities"]["status"].astype(str).str.upper()
        if not severity_values.isin(["MILD", "MODERATE", "SEVERE", "UNKNOWN"]).all():
            raise ValueError("comorbidities.csv severity must use MILD, MODERATE, SEVERE or UNKNOWN.")
        if not status_values.isin(["ACTIVE", "RESOLVED"]).all():
            raise ValueError("comorbidities.csv status must use ACTIVE or RESOLVED.")

    notes = sidecars["notes"]
    if require_deidentified_notes and not notes.empty:
        values = notes["is_deidentified"].astype(str).str.strip().str.lower()
        approved = values.isin(["1", "true", "yes", "y"])
        if not approved.all():
            raise ValueError("BioBERT training requires every notes.csv row to have is_deidentified=1/true.")

    # Exclude incomplete 30-day follow-up; an unobserved outcome is not a negative label.
    cases["age"] = pd.to_numeric(cases["age"], errors="coerce")
    if cases["age"].isna().any() or (~cases["age"].between(0, 120)).any():
        raise ValueError("age must be present and between 0 and 120 years at index_time.")
    cases["bmi"] = pd.to_numeric(cases["bmi"], errors="coerce")
    if cases["bmi"].dropna().size and (~cases["bmi"].dropna().between(5, 100)).any():
        raise ValueError("Non-missing BMI values must be between 5 and 100 kg/m².")
    cases["asa_class"] = pd.to_numeric(cases["asa_class"], errors="coerce")
    if cases["asa_class"].dropna().size and (~cases["asa_class"].dropna().between(1, 6)).any():
        raise ValueError("Non-missing ASA class values must be between 1 and 6.")
    sex_values = cases["sex_at_birth"].astype(str).str.upper()
    if not sex_values.isin(["FEMALE", "MALE", "INTERSEX", "UNKNOWN"]).all():
        raise ValueError("sex_at_birth must use FEMALE, MALE, INTERSEX or UNKNOWN.")
    urgency_values = cases["urgency"].astype(str).str.upper()
    if not urgency_values.isin(["ELECTIVE", "URGENT", "EMERGENCY"]).all():
        raise ValueError("urgency must use ELECTIVE, URGENT or EMERGENCY.")
    cases["outcome_30d_mortality"] = pd.to_numeric(cases["outcome_30d_mortality"], errors="coerce")
    cases["outcome_observed"] = pd.to_numeric(cases["outcome_observed"], errors="coerce").fillna(0)
    cases["followup_days"] = pd.to_numeric(cases["followup_days"], errors="coerce")
    observed_label = cases["outcome_30d_mortality"].isin([0, 1])
    eligible = (cases["outcome_observed"] == 1) & (cases["followup_days"] >= 30) & observed_label
    excluded_count = int((~eligible).sum())
    cases = cases.loc[eligible].copy().reset_index(drop=True)
    if cases.empty:
        raise ValueError("No eligible cases: require outcome_observed=1, followup_days>=30 and a 0/1 30-day label.")
    cases["outcome_30d_mortality"] = cases["outcome_30d_mortality"].astype(int)
    if cases["outcome_30d_mortality"].nunique() != 2:
        raise ValueError("Eligible cases must contain both 30-day outcome classes; no single-class training is allowed.")

    eligible_ids = set(cases["case_id"])
    future_rows: dict[str, int] = {}
    index_by_case = cases.set_index("case_id")["index_time"]
    for name, frame in sidecars.items():
        if frame.empty:
            future_rows[name] = 0
            continue
        frame = frame.loc[frame["case_id"].isin(eligible_ids)].copy()
        time_col = {"comorbidities": "observed_at", "vitals": "measured_at", "labs": "collected_at", "notes": "authored_at"}[name]
        future_rows[name] = int((frame[time_col] > frame["case_id"].map(index_by_case)).sum())
        sidecars[name] = frame.reset_index(drop=True)

    if not sidecars["comorbidities"].empty:
        sidecars["comorbidities"] = sidecars["comorbidities"].loc[sidecars["comorbidities"]["case_id"].isin(eligible_ids)].reset_index(drop=True)
    if not sidecars["vitals"].empty:
        sidecars["vitals"] = sidecars["vitals"].loc[sidecars["vitals"]["case_id"].isin(eligible_ids)].reset_index(drop=True)
    if not sidecars["labs"].empty:
        sidecars["labs"] = sidecars["labs"].loc[sidecars["labs"]["case_id"].isin(eligible_ids)].reset_index(drop=True)
    if not sidecars["notes"].empty:
        sidecars["notes"] = sidecars["notes"].loc[sidecars["notes"]["case_id"].isin(eligible_ids)].reset_index(drop=True)

    report = {
        "eligible_cases": int(len(cases)),
        "excluded_incomplete_outcomes": excluded_count,
        "unique_patients": int(cases["patient_id"].nunique()),
        "outcome_counts": {str(k): int(v) for k, v in cases["outcome_30d_mortality"].value_counts().sort_index().items()},
        "sidecar_rows": {name: int(len(frame)) for name, frame in sidecars.items()},
        "post_index_rows_excluded_by_feature_builders": future_rows,
        "notes_all_deidentified": bool(sidecars["notes"].empty or sidecars["notes"]["is_deidentified"].astype(str).str.strip().str.lower().isin(["1", "true", "yes", "y"]).all()),
    }
    return DatasetBundle(cases, sidecars["comorbidities"], sidecars["vitals"], sidecars["labs"], sidecars["notes"], report)


def write_json(path: str | Path, value: dict) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, indent=2, sort_keys=True, default=str), encoding="utf-8")
