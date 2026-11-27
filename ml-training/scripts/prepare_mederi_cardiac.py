from __future__ import annotations

import argparse
import json
import re
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pandas as pd

ZENODO_VALIDATION_RECORD = "22797059"
ZENODO_MEDERISCORE_V2_RECORD = "19220755"

VALIDATION_CSV_NAME = "Mederi_CardiacSurgery_HighAltitude_Validation_Data.csv"
CODEBOOK_CSV_NAME = "Codebook.csv"
MEDERISCORE_CSV_NAME = "MederiScore_Dataset_v2.csv"
MEDERISCORE_CODEBOOK_NAME = "MederiScore_Codebook_v2.csv"

URGENCY_MAP = {
    1: "URGENT",
    2: "ELECTIVE",
    3: "EMERGENCY",
    4: "EMERGENCY",
}

PROCEDURE_FLAGS = [
    ("proc_cabg_aislada", "ISOLATED_CABG", "Isolated Coronary Artery Bypass Grafting (CABG)"),
    ("proc_rva_mas_cabg", "AVR_CABG", "Aortic Valve Replacement + CABG"),
    ("proc_rvm_mas_cabg", "MVR_CABG", "Mitral Valve Replacement + CABG"),
    ("proc_reparacion_mitral_mas_cabg", "MV_REPAIR_CABG", "Mitral Valve Repair + CABG"),
    ("proc_rva_aislado", "ISOLATED_AVR", "Isolated Aortic Valve Replacement"),
    ("proc_rvm_aislado", "ISOLATED_MVR", "Isolated Mitral Valve Replacement"),
    ("proc_reparacion_mitral", "MV_REPAIR", "Mitral Valve Repair"),
    ("proc_reemplazo_tricuspide", "TVR", "Tricuspid Valve Replacement"),
    ("proc_aorta_ascendente", "ASCENDING_AORTA", "Ascending Thoracic Aorta Surgery"),
    ("proc_rvp_aislado", "PVR", "Pulmonary Valve Replacement"),
    ("proc_maze", "MAZE", "Surgical Maze Ablation"),
    ("proc_pericardiectomia", "PERICARDIECTOMY", "Pericardiectomy"),
    ("proc_cierre_cia", "ASD_CLOSURE", "Atrial Septal Defect Closure"),
]

PROC_5CAT_FALLBACK = {
    1: ("CABG_COMBINED", "Coronary Artery Bypass Grafting (CABG)"),
    2: ("AORTIC_VALVE", "Aortic Valve Surgery"),
    3: ("MITRAL_VALVE", "Mitral Valve Surgery"),
    4: ("THORACIC_AORTA", "Thoracic Aorta Surgery"),
    5: ("CARDIAC_OTHER", "Other Adult Cardiac Surgery"),
}


def _download_zenodo_record(record_id: str, dest_dir: Path) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    api_url = f"https://zenodo.org/api/records/{record_id}"
    req = urllib.request.Request(api_url, headers={"User-Agent": "CardiacRisk-AI-DatasetPrep/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    for entry in payload.get("files", []):
        target = dest_dir / entry["key"]
        if target.exists() and target.stat().st_size > 0:
            continue
        file_req = urllib.request.Request(entry["links"]["self"], headers={"User-Agent": "CardiacRisk-AI-DatasetPrep/1.0"})
        with urllib.request.urlopen(file_req, timeout=120) as file_resp:
            target.write_bytes(file_resp.read())


def _iso_utc(dt: datetime) -> str:
    return dt.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def _as_float(value) -> float | None:
    if pd.isna(value):
        return None
    try:
        num = float(value)
        return num if pd.notna(num) else None
    except (TypeError, ValueError):
        return None


def _as_int(value) -> int | None:
    num = _as_float(value)
    return round(num) if num is not None else None


def _derive_procedure(row: pd.Series) -> tuple[str, str]:
    matched = [
        (code, name)
        for col, code, name in PROCEDURE_FLAGS
        if _as_int(row.get(col)) == 1
    ]
    if matched:
        if len(matched) == 1:
            return matched[0]
        codes = "+".join(code for code, _ in matched[:2])
        names = " + ".join(name for _, name in matched[:2])
        return re.sub(r"[^A-Z0-9_+]+", "_", codes)[:40], names[:200]
    cat = _as_int(row.get("proc_tipo_5cat")) or 5
    return PROC_5CAT_FALLBACK.get(cat, ("CARDIAC_OTHER", "Adult Cardiac Surgery"))


def _add_comorb(rows: list[dict], case_id: str, observed_at: str, code: str, name: str, severity: str) -> None:
    rows.append(
        {
            "case_id": case_id,
            "condition_code": code,
            "condition_name": name,
            "severity": severity,
            "status": "ACTIVE",
            "observed_at": observed_at,
        }
    )


def _write_dataset_card(output_dir: Path, case_count: int, event_count: int, sts_count: int) -> None:
    rate = round(event_count / max(1, case_count), 6)
    card = f"""dataset_name: mederi-adult-cardiac-surgery-benchmark
source: Hospital Universitario Mayor-Mederi Adult Cardiac Surgery Registry (Zenodo Open Access, CC BY 4.0)
source_records:
  - https://zenodo.org/records/22797059
  - https://zenodo.org/records/19220755
citation: >
  Rodriguez Lima, D. R. et al. (2025/2026). External Validation of EuroSCORE II,
  Additive EuroSCORE, and the STS Predicted Risk of Mortality at 2,600 Meters Above Sea Level;
  and MederiScore Public Dataset v2. Zenodo. CC BY 4.0.
license: CC BY 4.0
endpoint: IN_HOSPITAL_MORTALITY
endpoint_source_column: out_muerte_hospitalaria / inhospital_death
case_count: {case_count}
unique_patients: {case_count}
positive_events: {event_count}
positive_event_rate: {rate}
sts_prom_eligible_cases: {sts_count}
baseline_calculators_included:
  - EuroSCORE II (phat_euroscore2)
  - Additive EuroSCORE (phat_add_euroscore)
  - STS-PROM v2.9 (phat_sts_prom, n={sts_count})
  - MederiScore (phat_mederiscore)
pre_index_boundary: >
  All variables retained from 22797059 and 19220755 represent preoperative risk factors,
  echocardiography measurements (LVEF, valvular lesions, PASP), coronary angiography counts,
  preoperative labs (creatinine, hemoglobin, WBC, platelets), and planned surgical category.
  Records with age == 0 (n=1 data-entry error documented in Codebook.csv) are excluded.
known_limitations:
  - Primary outcome is in-hospital mortality (out_muerte_hospitalaria), not post-discharge 30-day mortality or the 4 secondary multi-task ICU endpoints in the CardiacRisk-AI paper (prolonged ventilation, AKI-dialysis, stroke, deep sternal wound infection).
  - Preoperative high-frequency telemetry / longitudinal 48h vital waveforms are absent from this tabular registry; vitals.csv is kept empty rather than synthesizing measurements.
  - Each record corresponds to one procedure identifier (1..1,486) with calendar year only (exact timestamps removed for de-identification).
  - notes.csv contains deterministic de-identified preoperative cardiac summaries generated strictly from pre-index clinical fields.
"""
    (output_dir / "DATASET_CARD.yaml").write_text(card, encoding="utf-8")


def prepare_mederi_cardiac(raw_dir: Path, output_dir: Path, download: bool = False) -> dict[str, int]:
    rec1_dir = raw_dir / ZENODO_VALIDATION_RECORD
    rec2_dir = raw_dir / ZENODO_MEDERISCORE_V2_RECORD
    if download:
        _download_zenodo_record(ZENODO_VALIDATION_RECORD, rec1_dir)
        _download_zenodo_record(ZENODO_MEDERISCORE_V2_RECORD, rec2_dir)

    val_path = rec1_dir / VALIDATION_CSV_NAME
    ms_path = rec2_dir / MEDERISCORE_CSV_NAME
    if not val_path.exists() or not ms_path.exists():
        raise FileNotFoundError(
            f"Missing Méderi raw CSVs in {raw_dir}. Re-run with --download."
        )

    raw_val = pd.read_csv(val_path, low_memory=False)
    raw_ms = pd.read_csv(ms_path, low_memory=False)

    # Per Codebook.csv line 5: one record has age 0 (data entry error) and is excluded in v2.
    val_clean = raw_val.loc[raw_val["edad"] > 0].reset_index(drop=True)
    ms_clean = raw_ms.reset_index(drop=True)
    if len(val_clean) != len(ms_clean):
        raise ValueError(f"Expected 1,486 aligned rows across Méderi v1/v2, got {len(val_clean)} vs {len(ms_clean)}.")
    if not (val_clean["out_muerte_hospitalaria"].astype(int) == ms_clean["inhospital_death"].astype(int)).all():
        raise ValueError("Row alignment mismatch on mortality outcome between Zenodo 22797059 and 19220755.")

    case_rows: list[dict] = []
    comorbidity_rows: list[dict] = []
    lab_rows: list[dict] = []
    note_rows: list[dict] = []
    benchmark_rows: list[dict] = []

    for idx in range(len(val_clean)):
        row = val_clean.iloc[idx]
        ms_row = ms_clean.iloc[idx]
        rec_id = int(row["id"])
        year = _as_int(row["anio_cirugia"]) or _as_int(ms_row["surgery_year"]) or 2023

        case_id = f"mederi-{rec_id:04d}"
        patient_id = f"mederi-pt-{rec_id:04d}"
        # Deterministic chronological ordering preserving surgery year and record sequence.
        index_dt = datetime(year, 1, 1, 8, 0, 0, tzinfo=UTC) + timedelta(hours=rec_id % 8000)
        index_iso = _iso_utc(index_dt)
        comorb_iso = _iso_utc(index_dt - timedelta(hours=1))
        lab_iso = _iso_utc(index_dt - timedelta(hours=2))
        note_iso = _iso_utc(index_dt - timedelta(minutes=30))

        age = _as_float(row["edad"])
        if age is None or not (0 < age <= 120):
            continue
        sex_code = _as_int(row["sexo"])
        sex_at_birth = {1: "MALE", 2: "FEMALE"}.get(sex_code, "UNKNOWN")

        weight_kg = _as_float(row["peso_kg"])
        height_cm = _as_float(row["talla_cm"])
        bmi = None
        if weight_kg and height_cm and height_cm > 50:
            calc_bmi = weight_kg / ((height_cm / 100.0) ** 2)
            if 5.0 <= calc_bmi <= 100.0:
                bmi = round(calc_bmi, 2)

        proc_code, proc_name = _derive_procedure(row)
        urgency = URGENCY_MAP.get(_as_int(row["es2_urgencia"]) or 2, "ELECTIVE")
        death = int(row["out_muerte_hospitalaria"])

        case_rows.append(
            {
                "case_id": case_id,
                "patient_id": patient_id,
                "index_time": index_iso,
                "outcome_30d_mortality": death,
                "outcome_observed": 1,
                "followup_days": 0.0,
                "age": round(age, 1),
                "sex_at_birth": sex_at_birth,
                "bmi": bmi if bmi is not None else "",
                "procedure_name": proc_name,
                "procedure_code": proc_code,
                "specialty": "Cardiac Surgery",
                "urgency": urgency,
                "asa_class": "",
                "anesthesia_type": "General Cardiac",
            }
        )

        # Cardiac-specific comorbidities aligned to CardiacRisk-AI GAT nodes
        summary_flags: list[str] = []
        lvef = _as_float(row.get("es2_fevi_preop_pct"))
        if lvef is not None:
            if lvef < 30.0:
                _add_comorb(comorbidity_rows, case_id, comorb_iso, "LVEF_SEVERELY_REDUCED", "Severely Reduced LVEF (<30%)", "SEVERE")
                summary_flags.append(f"LVEF {lvef:.0f}% (severely reduced)")
            elif lvef < 40.0:
                _add_comorb(comorbidity_rows, case_id, comorb_iso, "LVEF_MODERATELY_REDUCED", "Moderately Reduced LVEF (30-39%)", "MODERATE")
                summary_flags.append(f"LVEF {lvef:.0f}% (moderately reduced)")
            elif lvef < 50.0:
                _add_comorb(comorbidity_rows, case_id, comorb_iso, "LVEF_MILDLY_REDUCED", "Mildly Reduced LVEF (40-49%)", "MILD")
                summary_flags.append(f"LVEF {lvef:.0f}% (mildly reduced)")
            else:
                summary_flags.append(f"LVEF {lvef:.0f}% (preserved)")

        nyha = _as_int(row.get("es2_nyha_clase"))
        if nyha in {2, 3, 4}:
            sev = {2: "MILD", 3: "MODERATE", 4: "SEVERE"}[nyha]
            _add_comorb(comorbidity_rows, case_id, comorb_iso, f"NYHA_CLASS_{nyha}", f"NYHA Functional Class {nyha}", sev)
            summary_flags.append(f"NYHA class {nyha}")

        if _as_int(row.get("es2_dm_insulina")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "DM_INSULIN", "Insulin-Treated Diabetes Mellitus", "MODERATE")
            summary_flags.append("insulin-dependent diabetes")

        dialysis = _as_int(row.get("es2_dialisis"))
        ckd_cat = _as_int(row.get("tfg_ckd_cat"))
        if dialysis == 2:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "CKD_DIALYSIS", "End-Stage Renal Disease on Dialysis", "SEVERE")
            summary_flags.append("chronic dialysis")
        elif dialysis == 1 or ckd_cat == 3:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "CKD_SEVERE", "Chronic Kidney Disease (eGFR <= 50 mL/min)", "MODERATE")
            summary_flags.append("moderate-severe CKD")
        elif ckd_cat == 2:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "CKD_MILD", "Mild Renal Impairment (eGFR 51-85 mL/min)", "MILD")

        pasp = _as_float(row.get("papse_valor_cat"))
        if pasp is not None and pasp > 55.0:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "PULMONARY_HYPERTENSION", "Severe Pulmonary Hypertension (PASP > 55 mmHg)", "SEVERE")
            summary_flags.append(f"severe pulmonary hypertension (PASP {pasp:.0f} mmHg)")
        elif pasp is not None and pasp >= 31.0:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "PULMONARY_HYPERTENSION", "Moderate Pulmonary Hypertension (PASP 31-55 mmHg)", "MODERATE")
            summary_flags.append(f"moderate pulmonary hypertension (PASP {pasp:.0f} mmHg)")

        if _as_int(row.get("es2_cx_previa_ninguna")) == 0:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "PRIOR_CARDIAC_SURGERY", "Previous Cardiac Surgery / Redo Sternotomy", "SEVERE")
            summary_flags.append("prior cardiac surgery")

        if _as_int(row.get("arteriopatia_periferica")) == 1 or _as_int(row.get("es2_art_excar_aorta")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "PVD", "Peripheral Vascular / Extracardiac Arteriopathy", "MODERATE")
            summary_flags.append("peripheral vascular disease")

        if _as_int(row.get("es2_art_excar_carotida_50")) == 1 or (_as_int(row.get("enfermedad_carotidea")) or 0) > 0:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "CAROTID_DISEASE", "Carotid Artery Stenosis", "MODERATE")

        if _as_int(row.get("arritmia_fa_flutter")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "ATRIAL_FIBRILLATION", "Atrial Fibrillation / Flutter", "MODERATE")
            summary_flags.append("atrial fibrillation/flutter")

        if _as_int(row.get("arritmia_tv")) == 1 or _as_int(row.get("arritmia_fv")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "VENTRICULAR_ARRHYTHMIA", "Ventricular Tachycardia / Fibrillation", "SEVERE")

        if _as_int(row.get("hipertension")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "HTN", "Arterial Hypertension", "MILD")

        if _as_int(row.get("epoc")) == 1:
            epoc_sev = {1: "MILD", 2: "MODERATE", 3: "SEVERE"}.get(_as_int(row.get("epoc_grado")) or 0, "UNKNOWN")
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "COPD", "Chronic Obstructive Pulmonary Disease", epoc_sev)
            summary_flags.append("COPD")

        if _as_int(row.get("shock_cardiogenico")) == 1 or _as_int(row.get("es2_critico_ninguno")) == 0:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "CRITICAL_PREOP_STATE", "Critical Preoperative State / Cardiogenic Shock", "SEVERE")
            summary_flags.append("critical preoperative hemodynamic state")

        if _as_int(row.get("iam_90d")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "RECENT_MI", "Myocardial Infarction within 90 Days", "SEVERE")
            summary_flags.append("recent MI (<90d)")

        if _as_int(row.get("es2_endocarditis_activa")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "ACTIVE_ENDOCARDITIS", "Active Infective Endocarditis", "SEVERE")
            summary_flags.append("active endocarditis")

        if _as_int(row.get("acv_mayor_90d")) == 1 or _as_int(row.get("acv_reciente_90d")) == 1:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "PRIOR_STROKE", "Prior Cerebrovascular Accident / Stroke", "MODERATE")

        if _as_int(row.get("falla_cardiaca_tipo")) in {1, 2, 3}:
            _add_comorb(comorbidity_rows, case_id, comorb_iso, "HEART_FAILURE", "Heart Failure", "MODERATE")

        # Preoperative laboratories (creatinine, hemoglobin, WBC, platelets)
        cr = _as_float(row.get("creatinina_preop"))
        if cr is not None and 0.1 <= cr <= 25.0:
            lab_rows.append({"case_id": case_id, "collected_at": lab_iso, "lab_code": "CREATININE", "test_name": "Serum Creatinine", "numeric_value": round(cr, 3), "unit": "mg/dL", "result_status": "FINAL"})
        hb = _as_float(row.get("hb_preop"))
        if hb is not None and 2.0 <= hb <= 25.0:
            lab_rows.append({"case_id": case_id, "collected_at": lab_iso, "lab_code": "HGB", "test_name": "Hemoglobin", "numeric_value": round(hb, 2), "unit": "g/dL", "result_status": "FINAL"})
        wbc = _as_float(row.get("leucocitos_preop"))
        if wbc is not None and 100.0 <= wbc <= 200000.0:
            lab_rows.append({"case_id": case_id, "collected_at": lab_iso, "lab_code": "WBC", "test_name": "White Blood Cell Count", "numeric_value": round(wbc / 1000.0, 2), "unit": "10^3/uL", "result_status": "FINAL"})
        plt = _as_float(row.get("plaquetas_preop"))
        if plt is not None and 1000.0 <= plt <= 2000000.0:
            lab_rows.append({"case_id": case_id, "collected_at": lab_iso, "lab_code": "PLATELETS", "test_name": "Platelets", "numeric_value": round(plt / 1000.0, 1), "unit": "10^3/uL", "result_status": "FINAL"})

        # Echo & coronary anatomy summary for BioBERT structured cardiac text
        cad_vessels = _as_int(row.get("enfermedad_coronaria")) or 0
        echo_parts: list[str] = []
        if cad_vessels > 0:
            echo_parts.append(f"{cad_vessels}-vessel CAD")
        if (_as_int(row.get("tronco_arterial_izq")) or 0) >= 2:
            echo_parts.append("left main coronary stenosis >=50%")
        if _as_int(row.get("eco_estenosis_ao")) == 1:
            echo_parts.append("aortic stenosis")
        if (_as_int(row.get("eco_insuf_ao")) or 0) >= 3:
            echo_parts.append("moderate-severe aortic regurgitation")
        if (_as_int(row.get("eco_insuf_mitral")) or 0) >= 3:
            echo_parts.append("moderate-severe mitral regurgitation")
        if _as_int(row.get("eco_estenosis_mitral")) == 1:
            echo_parts.append("mitral stenosis")

        bmi_txt = f"BMI {bmi:.1f}" if bmi is not None else "BMI unrecorded"
        cr_txt = f"Cr {cr:.2f} mg/dL" if cr is not None else "Cr unrecorded"
        hb_txt = f"Hb {hb:.1f} g/dL" if hb is not None else "Hb unrecorded"
        echo_txt = ", ".join(echo_parts) if echo_parts else "no major valvular or multivessel lesion documented"
        comorb_txt = "; ".join(summary_flags) if summary_flags else "no major documented cardiac comorbidity flags"
        note_text = (
            f"Preoperative cardiac surgery evaluation: {age:.0f}-year-old {sex_at_birth.lower()} ({bmi_txt}) "
            f"scheduled for {urgency.lower()} {proc_name}. "
            f"Echocardiography & angiography: {echo_txt}. "
            f"Preoperative labs: {cr_txt}, {hb_txt}. "
            f"Comorbidity profile: {comorb_txt}."
        )
        note_rows.append(
            {
                "case_id": case_id,
                "authored_at": note_iso,
                "is_deidentified": "true",
                "note_type": "PREOP_CARDIAC_EVALUATION",
                "text": note_text,
            }
        )

        benchmark_rows.append(
            {
                "case_id": case_id,
                "surgery_year": year,
                "euroscore2_prob": _as_float(ms_row.get("phat_euroscore2")),
                "additive_euroscore_prob": _as_float(ms_row.get("phat_add_euroscore")),
                "sts_prom_prob": _as_float(ms_row.get("phat_sts_prom")),
                "sts_eligible": _as_int(ms_row.get("sts_eligible")) or 0,
                "mederiscore_prob": _as_float(ms_row.get("phat_mederiscore")),
                "lvef_pct": lvef,
                "nyha_class": nyha,
                "coronary_vessels": cad_vessels,
                "weight_intervention": _as_int(row.get("es2_peso_procedimiento")),
                "creatinine_mgdl": cr,
                "hb_gdL": hb,
                "pasp_mmhg": pasp,
                "shock_cardiogenico": _as_int(row.get("shock_cardiogenico")) or 0,
                "dialysis": dialysis or 0,
                "prior_cardiac_surgery": 1 if _as_int(row.get("es2_cx_previa_ninguna")) == 0 else 0,
                "af_flutter": _as_int(row.get("arritmia_fa_flutter")) or 0,
                "proc_tipo_5cat": _as_int(row.get("proc_tipo_5cat")) or 5,
            }
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    cases_df = pd.DataFrame(case_rows)
    comorb_df = pd.DataFrame(comorbidity_rows, columns=["case_id", "condition_code", "condition_name", "severity", "status", "observed_at"])
    vitals_df = pd.DataFrame(columns=["case_id", "measured_at", "systolic_bp", "diastolic_bp", "heart_rate", "respiratory_rate", "temperature_c", "oxygen_saturation", "blood_glucose_mg_dl"])
    labs_df = pd.DataFrame(lab_rows, columns=["case_id", "collected_at", "lab_code", "test_name", "numeric_value", "unit", "result_status"])
    notes_df = pd.DataFrame(note_rows, columns=["case_id", "authored_at", "is_deidentified", "note_type", "text"])
    bench_df = pd.DataFrame(benchmark_rows)

    cases_df.to_csv(output_dir / "cases.csv", index=False)
    comorb_df.to_csv(output_dir / "comorbidities.csv", index=False)
    vitals_df.to_csv(output_dir / "vitals.csv", index=False)
    labs_df.to_csv(output_dir / "labs.csv", index=False)
    notes_df.to_csv(output_dir / "notes.csv", index=False)
    bench_df.to_csv(output_dir / "benchmarks.csv", index=False)

    event_count = int(cases_df["outcome_30d_mortality"].sum())
    sts_count = int(bench_df["sts_eligible"].sum())
    _write_dataset_card(output_dir, len(cases_df), event_count, sts_count)

    return {
        "cases": len(cases_df),
        "positive_events": event_count,
        "sts_eligible": sts_count,
        "comorbidities": len(comorb_df),
        "labs": len(labs_df),
        "notes": len(notes_df),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare the Méderi open-access Adult Cardiac Surgery dataset in SurgRisk-AI format.")
    parser.add_argument("--raw-dir", default="ml-training/data/raw/mederi")
    parser.add_argument("--output-dir", default="ml-training/data/processed/mederi-cardiac")
    parser.add_argument("--download", action="store_true", help="Download Méderi datasets from Zenodo if not cached locally.")
    args = parser.parse_args()

    summary = prepare_mederi_cardiac(Path(args.raw_dir), Path(args.output_dir), download=args.download)
    print(f"Prepared Méderi cardiac surgery dataset in {Path(args.output_dir).resolve()}")
    print(summary)


if __name__ == "__main__":
    main()
