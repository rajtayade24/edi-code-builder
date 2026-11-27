from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pandas as pd


def main() -> None:
    parser = argparse.ArgumentParser(description="Export a stratified sample of de-identified Méderi Cardiac Surgery cases for MongoDB seeding.")
    parser.add_argument("--data-dir", default="ml-training/data/processed/mederi-cardiac")
    parser.add_argument("--output", default="backend/data/mederi-cardiac-seed.json")
    parser.add_argument("--count", type=int, default=15)
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    cases = pd.read_csv(data_dir / "cases.csv")
    comorbs = pd.read_csv(data_dir / "comorbidities.csv")
    labs = pd.read_csv(data_dir / "labs.csv")
    notes = pd.read_csv(data_dir / "notes.csv")
    benchmarks = pd.read_csv(data_dir / "benchmarks.csv")
    raw_val = pd.read_csv("ml-training/data/raw/mederi/22797059/Mederi_CardiacSurgery_HighAltitude_Validation_Data.csv", low_memory=False)
    raw_val = raw_val.loc[raw_val["edad"] > 0].reset_index(drop=True).copy()
    raw_val["case_id"] = raw_val["id"].astype(int).map(lambda cid: f"mederi-{cid:04d}")

    merged = cases.merge(benchmarks, on="case_id", how="left").merge(
        raw_val[["case_id", "peso_kg", "talla_cm"]], on="case_id", how="left"
    )

    # Pick a representative, diverse cardiac surgery cohort: high-risk + moderate + low-risk across CABG/Valve/Aorta.
    targets = []
    for proc_prefix in ["ISOLATED_CABG", "ISOLATED_AVR", "ISOLATED_MVR", "AVR_CABG", "MVR_CABG", "ASCENDING_AORTA", "MV_REPAIR"]:
        sub = merged.loc[merged["procedure_code"].str.startswith(proc_prefix, na=False)]
        if not sub.empty:
            hi = sub.sort_values("euroscore2_prob", ascending=False).head(1)
            lo = sub.sort_values("euroscore2_prob", ascending=True).head(1)
            targets.extend([hi, lo])
    selected = pd.concat(targets, ignore_index=True).drop_duplicates("case_id").head(args.count)
    if len(selected) < args.count:
        extra = merged.loc[~merged["case_id"].isin(selected["case_id"])].head(args.count - len(selected))
        selected = pd.concat([selected, extra], ignore_index=True)

    records = []
    for _, row in selected.iterrows():
        cid = str(row["case_id"])
        rec_num = cid.split("-")[1]
        patient_num = f"MEDERI-{rec_num}"
        year = int(row["surgery_year"]) if pd.notna(row["surgery_year"]) else 2024
        age = round(float(row["age"]))
        dob_year = max(1920, min(2020, year - age))
        dob = f"{dob_year:04d}-01-15"

        c_rows = comorbs.loc[comorbs["case_id"] == cid]
        l_rows = labs.loc[labs["case_id"] == cid]
        n_rows = notes.loc[notes["case_id"] == cid]

        planned_dt = (datetime.now(UTC) + timedelta(days=7)).strftime("%Y-%m-%dT09:00:00Z")
        es2_pct = round(float(row["euroscore2_prob"]) * 100, 2) if pd.notna(row["euroscore2_prob"]) else None
        sts_pct = round(float(row["sts_prom_prob"]) * 100, 2) if pd.notna(row["sts_prom_prob"]) else None
        lvef = round(float(row["lvef_pct"]), 1) if pd.notna(row["lvef_pct"]) else None

        note_text = str(n_rows.iloc[0]["text"]) if not n_rows.empty else ""
        bench_note = (
            f"{note_text} Reference baseline risk calculators (Méderi CC BY 4.0): "
            f"EuroSCORE II={es2_pct if es2_pct is not None else 'N/A'}%, "
            f"STS-PROM={sts_pct if sts_pct is not None else 'N/A'}%, "
            f"LVEF={lvef if lvef is not None else 'N/A'}%."
        )

        records.append(
            {
                "patientNumber": patient_num,
                "firstName": "CardiacCohort",
                "lastName": f"Case {rec_num}",
                "dateOfBirth": dob,
                "sexAtBirth": str(row["sex_at_birth"]),
                "country": "Colombia",
                "city": "Bogota",
                "surgicalCase": {
                    "procedureName": str(row["procedure_name"]),
                    "procedureCode": str(row["procedure_code"]),
                    "specialty": "Cardiac Surgery",
                    "urgency": str(row["urgency"]),
                    "status": "PLANNED",
                    "plannedAt": planned_dt,
                    "anesthesiaType": str(row["anesthesia_type"]),
                    "notes": bench_note[:4900],
                },
                "vitals": {
                    "weightKg": round(float(row["peso_kg"]), 1) if pd.notna(row["peso_kg"]) else None,
                    "heightCm": round(float(row["talla_cm"]), 1) if pd.notna(row["talla_cm"]) else None,
                    "notes": "Baseline anthropometrics from Méderi CC BY 4.0 cardiac surgery validation cohort.",
                },
                "comorbidities": [
                    {
                        "conditionName": str(c["condition_name"]),
                        "conditionCode": str(c["condition_code"]),
                        "severity": str(c["severity"]),
                        "status": str(c["status"]),
                    }
                    for _, c in c_rows.iterrows()
                ],
                "labs": [
                    {
                        "labCode": str(lab["lab_code"]),
                        "testName": str(lab["test_name"]),
                        "numericValue": float(lab["numeric_value"]),
                        "unit": str(lab["unit"]),
                        "resultStatus": str(lab["result_status"]),
                    }
                    for _, lab in l_rows.iterrows()
                ],
                "history": {
                    "category": "OTHER",
                    "title": f"Zenodo Méderi Benchmark Profile ({cid})",
                    "description": bench_note[:4900],
                    "status": "ACTIVE",
                },
            }
        )

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "source": "Mederi Adult Cardiac Surgery Registry (Zenodo 22797059 + 19220755, CC BY 4.0)",
                "count": len(records),
                "patients": records,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Exported {len(records)} de-identified cardiac cases to {out_path}")


if __name__ == "__main__":
    main()
