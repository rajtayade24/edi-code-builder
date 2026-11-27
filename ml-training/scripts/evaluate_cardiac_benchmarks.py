from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from surgrisk_training.artifacts import save_json
from surgrisk_training.calibration import apply_calibrator
from surgrisk_training.features import build_tabular_records, transform_tabular
from surgrisk_training.metrics import evaluate_probabilities
from surgrisk_training.pipeline import load_run
from xgboost import XGBClassifier


def _expected_calibration_error(y_true: np.ndarray, probs: np.ndarray, n_bins: int = 10) -> float:
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    if n == 0:
        return 0.0
    for idx in range(n_bins):
        low, high = bins[idx], bins[idx + 1]
        if idx == n_bins - 1:
            mask = (probs >= low) & (probs <= high)
        else:
            mask = (probs >= low) & (probs < high)
        count = int(mask.sum())
        if count == 0:
            continue
        acc = float(y_true[mask].mean())
        conf = float(probs[mask].mean())
        ece += (count / n) * abs(acc - conf)
    return float(ece)


def _classification_metrics(y_cal: np.ndarray, p_cal: np.ndarray, y_test: np.ndarray, p_test: np.ndarray) -> dict[str, float]:
    # Select threshold on calibration split only (no test-set leakage).
    best_thr = 0.1
    best_j = -1.0
    for thr in np.linspace(0.02, 0.50, 97):
        preds = (p_cal >= thr).astype(int)
        tp = int(((preds == 1) & (y_cal == 1)).sum())
        fn = int(((preds == 0) & (y_cal == 1)).sum())
        tn = int(((preds == 0) & (y_cal == 0)).sum())
        fp = int(((preds == 1) & (y_cal == 0)).sum())
        sens = tp / max(1, tp + fn)
        spec = tn / max(1, tn + fp)
        j = sens + spec - 1.0
        if j > best_j:
            best_j = j
            best_thr = float(thr)

    t_preds = (p_test >= best_thr).astype(int)
    tp = int(((t_preds == 1) & (y_test == 1)).sum())
    fn = int(((t_preds == 0) & (y_test == 1)).sum())
    tn = int(((t_preds == 0) & (y_test == 0)).sum())
    fp = int(((t_preds == 1) & (y_test == 0)).sum())
    sens = tp / max(1, tp + fn)
    spec = tn / max(1, tn + fp)
    ppv = tp / max(1, tp + fp)
    npv = tn / max(1, tn + fn)
    f1 = (2 * tp) / max(1, (2 * tp) + fp + fn)
    return {
        "threshold": round(best_thr, 4),
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "ppv": round(ppv, 4),
        "npv": round(npv, 4),
        "f1": round(f1, 4),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark trained CardiacRisk-AI XGBoost branch against EuroSCORE II and STS-PROM on Méderi held-out test cases.")
    parser.add_argument("--data-dir", default="ml-training/data/processed/mederi-cardiac")
    parser.add_argument("--run-dir", default="ml-training/runs/mederi-cardiac-baseline")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    run_dir = Path(args.run_dir)
    xgb_dir = run_dir / "artifacts" / "xgboost"

    bundle, splits = load_run(data_dir, run_dir, min_followup_days=0)
    benchmarks = pd.read_csv(data_dir / "benchmarks.csv")

    schema = json.loads((xgb_dir / "feature-schema.json").read_text(encoding="utf-8"))
    calibrator = json.loads((xgb_dir / "calibrator.json").read_text(encoding="utf-8"))
    model = XGBClassifier()
    model.load_model(str(xgb_dir / "model.json"))

    X_cal = transform_tabular(build_tabular_records(bundle, splits["calibration"]), schema)
    X_test = transform_tabular(build_tabular_records(bundle, splits["test"]), schema)
    p_cal_xgb = apply_calibrator(model.predict_proba(X_cal)[:, 1], calibrator)
    p_test_xgb = apply_calibrator(model.predict_proba(X_test)[:, 1], calibrator)

    y_cal = splits["calibration"]["outcome_30d_mortality"].to_numpy(dtype=int)
    y_test = splits["test"]["outcome_30d_mortality"].to_numpy(dtype=int)

    cal_merged = splits["calibration"].merge(benchmarks, on="case_id", how="left")
    test_merged = splits["test"].merge(benchmarks, on="case_id", how="left")
    test_merged["xgb_prob"] = p_test_xgb
    cal_merged["xgb_prob"] = p_cal_xgb

    models_full = [
        ("Additive EuroSCORE", "additive_euroscore_prob"),
        ("EuroSCORE II", "euroscore2_prob"),
        ("MederiScore", "mederiscore_prob"),
        ("XGBoost (Calibrated)", "xgb_prob"),
    ]

    full_results = {}
    for label, col in models_full:
        p_c = cal_merged[col].to_numpy(dtype=float)
        p_t = test_merged[col].to_numpy(dtype=float)
        base = evaluate_probabilities(y_test, p_t)
        cls = _classification_metrics(y_cal, p_c, y_test, p_t)
        base["ece"] = round(_expected_calibration_error(y_test, p_t), 4)
        base.update(cls)
        full_results[label] = base

    sts_cal = cal_merged.loc[cal_merged["sts_eligible"] == 1].dropna(subset=["sts_prom_prob"])
    sts_test = test_merged.loc[test_merged["sts_eligible"] == 1].dropna(subset=["sts_prom_prob"])
    sts_results = {}
    if len(sts_test) > 0 and sts_test["outcome_30d_mortality"].nunique() == 2:
        y_sts_c = sts_cal["outcome_30d_mortality"].to_numpy(dtype=int)
        y_sts_t = sts_test["outcome_30d_mortality"].to_numpy(dtype=int)
        for label, col in [
            ("EuroSCORE II (STS-eligible)", "euroscore2_prob"),
            ("STS-PROM v2.9 (STS-eligible)", "sts_prom_prob"),
            ("XGBoost (Calibrated, STS-eligible)", "xgb_prob"),
        ]:
            p_c = sts_cal[col].to_numpy(dtype=float)
            p_t = sts_test[col].to_numpy(dtype=float)
            base = evaluate_probabilities(y_sts_t, p_t)
            cls = _classification_metrics(y_sts_c, p_c, y_sts_t, p_t)
            base["ece"] = round(_expected_calibration_error(y_sts_t, p_t), 4)
            base.update(cls)
            sts_results[label] = base

    feature_names = schema["feature_names"]
    importances = sorted(
        [{"feature": name, "importance": round(float(score), 5)} for name, score in zip(feature_names, model.feature_importances_, strict=True) if score > 0],
        key=lambda item: item["importance"],
        reverse=True,
    )[:15]

    report = {
        "dataset": "Mederi Adult Cardiac Surgery (Zenodo 22797059 + 19220755, CC BY 4.0)",
        "endpoint": "IN_HOSPITAL_MORTALITY",
        "test_split": {"cases": len(test_merged), "events": int(y_test.sum())},
        "sts_eligible_test_split": {"cases": len(sts_test), "events": int(sts_test["outcome_30d_mortality"].sum())},
        "full_test_comparison": full_results,
        "sts_eligible_comparison": sts_results,
        "top_xgboost_features": importances,
    }
    save_json(run_dir / "benchmark-comparison.json", report)

    lines = [
        "# Méderi Cardiac Surgery Held-Out Test Benchmark",
        "",
        f"- **Full held-out test set:** `n = {len(test_merged)}` (`{int(y_test.sum())}` events)",
        f"- **STS-eligible held-out test subset:** `n = {len(sts_test)}` (`{int(sts_test['outcome_30d_mortality'].sum())}` events)",
        "",
        "## Full Held-Out Test Split Comparison",
        "",
        "| Model / Risk Score | AUROC | AUPRC | Brier | ECE | Sensitivity | Specificity | F1 |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for name, m in full_results.items():
        lines.append(
            f"| {name} | {m['auroc']:.4f} | {m['average_precision']:.4f} | {m['brier_score']:.4f} | {m['ece']:.4f} | {m['sensitivity']:.4f} | {m['specificity']:.4f} | {m['f1']:.4f} |"
        )
    if sts_results:
        lines.extend([
            "",
            "## STS-PROM Eligible Held-Out Test Subset Comparison",
            "",
            "| Model / Risk Score | AUROC | AUPRC | Brier | ECE | Sensitivity | Specificity | F1 |",
            "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
        ])
        for name, m in sts_results.items():
            lines.append(
                f"| {name} | {m['auroc']:.4f} | {m['average_precision']:.4f} | {m['brier_score']:.4f} | {m['ece']:.4f} | {m['sensitivity']:.4f} | {m['specificity']:.4f} | {m['f1']:.4f} |"
            )
    lines.extend(["", "## Top XGBoost Feature Importances", ""])
    for item in importances:
        lines.append(f"- `{item['feature']}`: `{item['importance']:.5f}`")
    (run_dir / "benchmark-comparison.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
