from __future__ import annotations
import argparse
import json
from pathlib import Path
from surgrisk_training.data import load_dataset


def main():
    parser = argparse.ArgumentParser(description="Validate SurgRisk-AI training CSV contracts without fitting models.")
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--require-deidentified-notes", action="store_true")
    parser.add_argument("--report", default="dataset-validation.json")
    args = parser.parse_args()
    bundle = load_dataset(args.data_dir, require_deidentified_notes=args.require_deidentified_notes)
    report = {"status": "STRUCTURE_VALIDATION_PASSED", "limitations": ["This report does not validate clinical correctness, source provenance, label accuracy, representativeness or regulatory suitability."], **bundle.report}
    Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
