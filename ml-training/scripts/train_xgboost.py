from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
from xgboost import XGBClassifier
from surgrisk_training.pipeline import load_run, read_config
from surgrisk_training.features import build_tabular_records, fit_tabular_schema, transform_tabular
from surgrisk_training.calibration import fit_platt_calibrator, apply_calibrator
from surgrisk_training.metrics import evaluate_probabilities
from surgrisk_training.artifacts import save_json, write_branch_release


def main():
    parser = argparse.ArgumentParser(description="Train the XGBoost preoperative tabular branch.")
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--config", default="configs/training.json")
    parser.add_argument("--model-version", default="xgboost-dev-0.1.0")
    args = parser.parse_args()
    bundle, splits = load_run(args.data_dir, args.run_dir)
    config = read_config(args.config)
    train_records = build_tabular_records(bundle, splits["train"])
    calibration_records = build_tabular_records(bundle, splits["calibration"])
    test_records = build_tabular_records(bundle, splits["test"])
    schema = fit_tabular_schema(train_records)
    X_train = transform_tabular(train_records, schema)
    X_cal = transform_tabular(calibration_records, schema)
    X_test = transform_tabular(test_records, schema)
    y_train = splits["train"]["outcome_30d_mortality"].to_numpy(dtype=int)
    y_cal = splits["calibration"]["outcome_30d_mortality"].to_numpy(dtype=int)
    y_test = splits["test"]["outcome_30d_mortality"].to_numpy(dtype=int)
    params = dict(config.get("training", {}).get("xgboost", {}))
    params.update({"objective": "binary:logistic", "eval_metric": "logloss", "n_jobs": -1, "random_state": int(config.get("random_seed", 42))})
    params["scale_pos_weight"] = max(1.0, float((y_train == 0).sum()) / max(1, int((y_train == 1).sum())))
    model = XGBClassifier(**params)
    model.fit(X_train, y_train, verbose=False)
    raw_cal = model.predict_proba(X_cal)[:, 1]
    calibrator = fit_platt_calibrator(raw_cal, y_cal)
    calibrated_test = apply_calibrator(model.predict_proba(X_test)[:, 1], calibrator)
    metrics = evaluate_probabilities(y_test, calibrated_test, splits["test"]["sex_at_birth"].fillna("UNKNOWN").astype(str))
    metrics.update({"endpoint": "30_DAY_MORTALITY", "test_split_only": True, "calibration_split_case_count": int(len(y_cal)), "branch": "xgboost"})
    output = Path(args.run_dir) / "artifacts" / "xgboost"
    output.mkdir(parents=True, exist_ok=True)
    model.save_model(str(output / "model.json"))
    save_json(output / "feature-schema.json", schema)
    save_json(output / "calibrator.json", calibrator)
    save_json(output / "evaluation.json", metrics)
    save_json(output / "training.json", {"parameters": params, "training_cases": len(y_train), "features": schema["feature_names"], "pre_index_features_only": True})
    write_branch_release(output, "xgboost", args.model_version, "evaluation.json")
    print(f"XGBoost artifacts saved to {output.resolve()}")
    print(metrics)
    print("Release status: PENDING_EXTERNAL_REVIEW; not approved for clinical use.")

if __name__ == "__main__":
    main()
