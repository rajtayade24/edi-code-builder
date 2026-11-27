from __future__ import annotations

import argparse
import gzip
import re
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pandas as pd

VITALDB_CASES_URL = "https://api.vitaldb.net/cases"
VITALDB_LABS_URL = "https://api.vitaldb.net/labs"
BASE_EPOCH = datetime(2020, 1, 1, 0, 0, 0, tzinfo=UTC)

LAB_MAP = {
    "hb": ("HGB", "Hemoglobin", "g/dL"),
    "cr": ("CREATININE", "Creatinine", "mg/dL"),
    "na": ("SODIUM", "Sodium", "mmol/L"),
    "k": ("POTASSIUM", "Potassium", "mmol/L"),
    "alb": ("ALBUMIN", "Albumin", "g/dL"),
    "plt": ("PLATELETS", "Platelets", "10^3/uL"),
    "wbc": ("WBC", "White Blood Cell Count", "10^3/uL"),
    "ptinr": ("INR", "Prothrombin Time INR", "ratio"),
}


def _read_maybe_gzip_csv(path: Path) -> pd.DataFrame:
    with path.open("rb") as handle:
        magic = handle.read(2)
    if magic == b"\x1f\x8b":
        with gzip.open(path, mode="rt", encoding="utf-8", errors="replace") as gz:
            return pd.read_csv(gz, low_memory=False)
    return pd.read_csv(path, low_memory=False)


def _download_if_missing(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "CardiacRisk-AI-DatasetPrep/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response, dest.open("wb") as out:
        out.write(response.read())


def _clean_token(text: str, prefix: str = "") -> str:
    token = re.sub(r"[^A-Z0-9]+", "_", str(text).strip().upper()).strip("_")
    if not token:
        token = "UNKNOWN"
    return f"{prefix}{token}" if prefix else token


def _iso_utc(dt: datetime) -> str:
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clean_str(value) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def _valid_num(value, low: float, high: float) -> float | None:
    if pd.isna(value):
        return None
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    if low <= num <= high:
        return num
    return None


def _pft_severity(label: str) -> str:
    upper = label.upper()
    if "SEVERE" in upper:
        return "SEVERE"
    if "MODERATE" in upper:
        return "MODERATE"
    if "MILD" in upper or "BORDERLINE" in upper:
        return "MILD"
    return "UNKNOWN"


def _write_dataset_card(output_dir: Path, case_count: int, patient_count: int, event_count: int) -> None:
    event_rate = round(event_count / max(1, case_count), 6)
    content = f"""dataset_name: vitaldb-cardiacrisk-prepared
source: VitalDB Open Dataset (Seoul National University Hospital, CC BY 4.0)
source_urls:
  - https://vitaldb.net/dataset/
  - https://api.vitaldb.net/cases
  - https://api.vitaldb.net/labs
citation: >
  Lee, H.-C., Park, Y., Yoon, S. B., Yang, S. M., Park, D., & Jung, C.-W. (2022).
  VitalDB, a high-fidelity multi-parameter vital signs database in surgical patients.
  Scientific Data, 9(1), 279.
license: CC BY 4.0
endpoint: IN_HOSPITAL_MORTALITY
endpoint_source_column: death_inhosp
case_count: {case_count}
unique_patients: {patient_count}
positive_events: {event_count}
positive_event_rate: {event_rate}
pre_index_boundary: >
  All laboratory timestamps (labs.csv dt <= 0), pre-operative comorbidities (observed_at = index_time - 1h),
  pre-operative vitals/glucose/SpO2, and structured pre-operative notes are strictly <= index_time.
  All intra-operative and post-operative columns (intraop_*, icu_days, opend, aneend, dis) are excluded
  from feature inputs.
known_limitations:
  - Target label is VitalDB in-hospital surgical mortality (death_inhosp), not 30-day post-discharge mortality.
  - VitalDB covers multi-specialty surgeries (General, Thoracic, Gynecology, Urology); it is not cardiac-surgery-only.
  - VitalDB clinical tables provide pre-op SpO2 and blood glucose rather than pre-op ward BP/HR/RR/Temp time series.
  - notes.csv contains deterministic de-identified pre-op structured summaries (no post-op fields) because VitalDB omits free-text notes.
"""
    (output_dir / "DATASET_CARD.yaml").write_text(content, encoding="utf-8")


def prepare_vitaldb(raw_dir: Path, output_dir: Path, download: bool = False) -> dict[str, int]:
    cases_raw_path = raw_dir / "cases.csv"
    labs_raw_path = raw_dir / "labs.csv"
    if download:
        _download_if_missing(VITALDB_CASES_URL, cases_raw_path)
        _download_if_missing(VITALDB_LABS_URL, labs_raw_path)

    if not cases_raw_path.exists() or not labs_raw_path.exists():
        raise FileNotFoundError(
            f"Missing raw VitalDB files in {raw_dir}. Re-run with --download or place cases.csv and labs.csv there."
        )

    raw_cases = _read_maybe_gzip_csv(cases_raw_path).sort_values("caseid").reset_index(drop=True)
    raw_labs = _read_maybe_gzip_csv(labs_raw_path)

    case_rows: list[dict] = []
    comorbidity_rows: list[dict] = []
    vital_rows: list[dict] = []
    lab_rows: list[dict] = []
    note_rows: list[dict] = []

    index_times: dict[int, datetime] = {}
    preop_lab_seen: set[tuple[int, str]] = set()

    for row in raw_cases.itertuples(index=False):
        caseid = int(row.caseid)
        subjectid = int(row.subjectid)
        case_id = f"vitaldb-{caseid:04d}"
        patient_id = f"subject-{subjectid:05d}"

        # Deterministic chronological timestamp preserving caseid order without colliding subject dates.
        index_dt = BASE_EPOCH + timedelta(hours=caseid)
        index_times[caseid] = index_dt
        index_iso = _iso_utc(index_dt)
        comorb_iso = _iso_utc(index_dt - timedelta(hours=1))
        note_iso = _iso_utc(index_dt - timedelta(minutes=30))
        baseline_vital_iso = _iso_utc(index_dt - timedelta(hours=2))

        age = _valid_num(row.age, 0.0, 120.0)
        if age is None:
            continue
        bmi = _valid_num(row.bmi, 5.0, 100.0)
        asa_num = _valid_num(row.asa, 1.0, 6.0)
        asa_val = int(asa_num) if asa_num is not None else ""

        sex_raw = _clean_str(row.sex).upper()
        sex_at_birth = {"M": "MALE", "F": "FEMALE"}.get(sex_raw, "UNKNOWN")

        dis_sec = _valid_num(row.dis, -1e9, 1e9)
        casestart_sec = _valid_num(row.casestart, -1e9, 1e9)
        if dis_sec is not None and casestart_sec is not None and dis_sec >= casestart_sec:
            followup_days = round((dis_sec - casestart_sec) / 86400.0, 2)
        else:
            followup_days = 0.0

        opname = _clean_str(row.opname) or _clean_str(row.dx) or "Unspecified surgical procedure"
        optype = _clean_str(row.optype) or _clean_str(row.department) or "SURG"
        approach = _clean_str(row.approach)
        proc_code = _clean_token(f"{optype}_{approach}" if approach else optype)
        specialty = _clean_str(row.department) or "General surgery"
        urgency = "EMERGENCY" if _valid_num(row.emop, 0.0, 1.0) == 1.0 else "ELECTIVE"
        anesthesia_type = _clean_str(row.ane_type) or "General"
        death_inhosp = 1 if _valid_num(row.death_inhosp, 0.0, 1.0) == 1.0 else 0

        case_rows.append(
            {
                "case_id": case_id,
                "patient_id": patient_id,
                "index_time": index_iso,
                "outcome_30d_mortality": death_inhosp,
                "outcome_observed": 1,
                "followup_days": followup_days,
                "age": round(age, 2),
                "sex_at_birth": sex_at_birth,
                "bmi": round(bmi, 2) if bmi is not None else "",
                "procedure_name": opname,
                "procedure_code": proc_code,
                "specialty": specialty,
                "urgency": urgency,
                "asa_class": asa_val,
                "anesthesia_type": anesthesia_type,
            }
        )

        active_conditions: list[str] = []
        if _valid_num(row.preop_htn, 0.0, 1.0) == 1.0:
            comorbidity_rows.append(
                {
                    "case_id": case_id,
                    "condition_code": "HTN",
                    "condition_name": "Hypertension",
                    "severity": "MODERATE",
                    "status": "ACTIVE",
                    "observed_at": comorb_iso,
                }
            )
            active_conditions.append("Hypertension")

        if _valid_num(row.preop_dm, 0.0, 1.0) == 1.0:
            comorbidity_rows.append(
                {
                    "case_id": case_id,
                    "condition_code": "DM",
                    "condition_name": "Diabetes mellitus",
                    "severity": "MODERATE",
                    "status": "ACTIVE",
                    "observed_at": comorb_iso,
                }
            )
            active_conditions.append("Diabetes mellitus")

        ecg = _clean_str(row.preop_ecg)
        if ecg and ecg.lower() != "normal sinus rhythm":
            for finding in [part.strip() for part in ecg.split(",") if part.strip()]:
                comorbidity_rows.append(
                    {
                        "case_id": case_id,
                        "condition_code": _clean_token(finding, prefix="ECG_"),
                        "condition_name": f"ECG: {finding}",
                        "severity": "MODERATE",
                        "status": "ACTIVE",
                        "observed_at": comorb_iso,
                    }
                )
                active_conditions.append(f"ECG {finding}")

        pft = _clean_str(row.preop_pft)
        if pft and pft.lower() != "normal":
            comorbidity_rows.append(
                {
                    "case_id": case_id,
                    "condition_code": _clean_token(pft, prefix="PFT_"),
                    "condition_name": f"Pulmonary function: {pft}",
                    "severity": _pft_severity(pft),
                    "status": "ACTIVE",
                    "observed_at": comorb_iso,
                }
            )
            active_conditions.append(f"PFT {pft}")

        spo2 = _valid_num(row.preop_sao2, 0.0, 100.0)
        gluc = _valid_num(row.preop_gluc, 1.0, 2000.0)
        if spo2 is not None or gluc is not None:
            vital_rows.append(
                {
                    "case_id": case_id,
                    "measured_at": baseline_vital_iso,
                    "systolic_bp": "",
                    "diastolic_bp": "",
                    "heart_rate": "",
                    "respiratory_rate": "",
                    "temperature_c": "",
                    "oxygen_saturation": round(spo2, 2) if spo2 is not None else "",
                    "blood_glucose_mg_dl": round(gluc, 2) if gluc is not None else "",
                }
            )

        dx_text = _clean_str(row.dx) or "Unspecified diagnosis"
        bmi_text = f"{bmi:.1f}" if bmi is not None else "unknown"
        asa_text = f"ASA {asa_val}" if asa_val != "" else "ASA unknown"
        comorb_text = ", ".join(active_conditions) if active_conditions else "no documented pre-op HTN/DM/ECG/PFT abnormalities"
        note_text = (
            f"Preoperative assessment for {age:.1f}-year-old {sex_at_birth.lower()} patient "
            f"(BMI {bmi_text}, {asa_text}) scheduled for {urgency.lower()} {opname} "
            f"under {specialty} with {anesthesia_type.lower()} anesthesia. "
            f"Preoperative indication: {dx_text}. "
            f"Active preoperative findings: {comorb_text}."
        )
        note_rows.append(
            {
                "case_id": case_id,
                "authored_at": note_iso,
                "is_deidentified": "true",
                "note_type": "PREOP_STRUCTURED_SUMMARY",
                "text": note_text,
            }
        )

    preop_labs = raw_labs.loc[raw_labs["dt"].notna() & (raw_labs["dt"] <= 0)].copy()
    preop_labs["name_lower"] = preop_labs["name"].astype(str).str.strip().str.lower()

    # Include time-stamped pre-op labs strictly <= index_time.
    for row in preop_labs.itertuples(index=False):
        caseid = int(row.caseid)
        if caseid not in index_times:
            continue
        case_id = f"vitaldb-{caseid:04d}"
        measured_at = _iso_utc(index_times[caseid] + timedelta(seconds=float(row.dt)))
        lab_key = row.name_lower
        val = _valid_num(row.result, 0.0, 100000.0)
        if val is None:
            continue

        if lab_key in LAB_MAP:
            code, test_name, unit = LAB_MAP[lab_key]
            lab_rows.append(
                {
                    "case_id": case_id,
                    "collected_at": measured_at,
                    "lab_code": code,
                    "test_name": test_name,
                    "numeric_value": round(val, 4),
                    "unit": unit,
                    "result_status": "FINAL",
                }
            )
            preop_lab_seen.add((caseid, code))
        elif lab_key == "sao2" and 0.0 <= val <= 100.0:
            vital_rows.append(
                {
                    "case_id": case_id,
                    "measured_at": measured_at,
                    "systolic_bp": "",
                    "diastolic_bp": "",
                    "heart_rate": "",
                    "respiratory_rate": "",
                    "temperature_c": "",
                    "oxygen_saturation": round(val, 2),
                    "blood_glucose_mg_dl": "",
                }
            )
        elif lab_key == "gluc" and 1.0 <= val <= 2000.0:
            vital_rows.append(
                {
                    "case_id": case_id,
                    "measured_at": measured_at,
                    "systolic_bp": "",
                    "diastolic_bp": "",
                    "heart_rate": "",
                    "respiratory_rate": "",
                    "temperature_c": "",
                    "oxygen_saturation": "",
                    "blood_glucose_mg_dl": round(val, 2),
                }
            )

    # Backfill baseline pre-op labs from cases.csv when absent in labs.csv (strictly pre-index at -2h).
    baseline_col_map = {
        "preop_hb": ("HGB", "Hemoglobin", "g/dL"),
        "preop_cr": ("CREATININE", "Creatinine", "mg/dL"),
        "preop_na": ("SODIUM", "Sodium", "mmol/L"),
        "preop_k": ("POTASSIUM", "Potassium", "mmol/L"),
        "preop_alb": ("ALBUMIN", "Albumin", "g/dL"),
        "preop_plt": ("PLATELETS", "Platelets", "10^3/uL"),
    }
    for row in raw_cases.itertuples(index=False):
        caseid = int(row.caseid)
        if caseid not in index_times:
            continue
        case_id = f"vitaldb-{caseid:04d}"
        baseline_iso = _iso_utc(index_times[caseid] - timedelta(hours=2))
        for col, (code, test_name, unit) in baseline_col_map.items():
            if (caseid, code) in preop_lab_seen:
                continue
            val = _valid_num(getattr(row, col), 0.0, 100000.0)
            if val is not None:
                lab_rows.append(
                    {
                        "case_id": case_id,
                        "collected_at": baseline_iso,
                        "lab_code": code,
                        "test_name": test_name,
                        "numeric_value": round(val, 4),
                        "unit": unit,
                        "result_status": "FINAL",
                    }
                )

    output_dir.mkdir(parents=True, exist_ok=True)
    cases_df = pd.DataFrame(case_rows)
    comorb_df = pd.DataFrame(comorbidity_rows, columns=["case_id", "condition_code", "condition_name", "severity", "status", "observed_at"])
    vitals_df = pd.DataFrame(vital_rows, columns=["case_id", "measured_at", "systolic_bp", "diastolic_bp", "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl"]).sort_values(["case_id", "measured_at"])
    labs_df = pd.DataFrame(lab_rows, columns=["case_id", "collected_at", "lab_code", "test_name", "numeric_value", "unit", "result_status"]).sort_values(["case_id", "collected_at"])
    notes_df = pd.DataFrame(note_rows, columns=["case_id", "authored_at", "is_deidentified", "note_type", "text"])

    cases_df.to_csv(output_dir / "cases.csv", index=False)
    comorb_df.to_csv(output_dir / "comorbidities.csv", index=False)
    vitals_df.to_csv(output_dir / "vitals.csv", index=False)
    labs_df.to_csv(output_dir / "labs.csv", index=False)
    notes_df.to_csv(output_dir / "notes.csv", index=False)

    patient_count = int(cases_df["patient_id"].nunique())
    event_count = int(cases_df["outcome_30d_mortality"].sum())
    _write_dataset_card(output_dir, len(cases_df), patient_count, event_count)

    return {
        "cases": len(cases_df),
        "unique_patients": patient_count,
        "positive_events": event_count,
        "comorbidities": len(comorb_df),
        "vitals": len(vitals_df),
        "labs": len(labs_df),
        "notes": len(notes_df),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare the open-access VitalDB dataset in SurgRisk-AI training CSV format.")
    parser.add_argument("--raw-dir", default="ml-training/data/raw/vitaldb")
    parser.add_argument("--output-dir", default="ml-training/data/processed/vitaldb")
    parser.add_argument("--download", action="store_true", help="Download VitalDB cases and labs tables if not already cached locally.")
    args = parser.parse_args()

    summary = prepare_vitaldb(Path(args.raw_dir), Path(args.output_dir), download=args.download)
    print(f"Prepared VitalDB dataset in {Path(args.output_dir).resolve()}")
    print(summary)


if __name__ == "__main__":
    main()
