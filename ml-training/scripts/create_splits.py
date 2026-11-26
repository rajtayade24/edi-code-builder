from __future__ import annotations
import argparse
from pathlib import Path
from surgrisk_training.data import load_dataset, write_json
from surgrisk_training.splitting import make_patient_splits


def main():
    parser = argparse.ArgumentParser(description="Create patient-disjoint train/calibration/test splits.")
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--train-fraction", type=float, default=0.70)
    parser.add_argument("--calibration-fraction", type=float, default=0.15)
    parser.add_argument("--test-fraction", type=float, default=0.15)
    args = parser.parse_args()
    bundle = load_dataset(args.data_dir)
    splits = make_patient_splits(bundle.cases, args.seed, args.train_fraction, args.calibration_fraction, args.test_fraction)
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    write_json(output / "splits.json", splits)
    write_json(output / "dataset-report.json", bundle.report)
    print(f"Created patient-disjoint splits at {output.resolve()}")
    print({name: {"cases": splits["case_counts"][name], "patients": splits["patient_counts"][name], "outcomes": splits["outcome_counts"][name]} for name in ("train", "calibration", "test")})

if __name__ == "__main__":
    main()
