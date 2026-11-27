from __future__ import annotations

import numpy as np
from scipy.special import logit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    log_loss,
    roc_auc_score,
)


def evaluate_probabilities(labels, probabilities, subgroup_values=None, min_subgroup_n: int = 30) -> dict:
    y = np.asarray(labels, dtype=int)
    p = np.clip(np.asarray(probabilities, dtype=float), 1e-7, 1 - 1e-7)
    if len(y) != len(p) or len(y) == 0 or len(np.unique(y)) != 2:
        raise ValueError("Evaluation requires non-empty labels containing both classes and matching probabilities.")
    try:
        cal = LogisticRegression(C=1e6, solver="lbfgs", max_iter=2000)
        cal.fit(logit(p).reshape(-1, 1), y)
        cal_intercept = float(cal.intercept_[0])
        cal_slope = float(cal.coef_[0][0])
    except (ValueError, TypeError, ArithmeticError):
        cal_intercept, cal_slope = None, None
    result = {
        "n": len(y),
        "events": int(y.sum()),
        "non_events": int((1 - y).sum()),
        "auroc": float(roc_auc_score(y, p)),
        "average_precision": float(average_precision_score(y, p)),
        "brier_score": float(brier_score_loss(y, p)),
        "log_loss": float(log_loss(y, p, labels=[0, 1])),
        "calibration_intercept": cal_intercept,
        "calibration_slope": cal_slope,
    }
    if subgroup_values is not None:
        groups = np.asarray(subgroup_values, dtype=object)
        subgroup_report = {}
        for group in sorted({str(x) for x in groups}):
            mask = np.asarray([str(x) == group for x in groups])
            sy = y[mask]
            if int(mask.sum()) < min_subgroup_n:
                subgroup_report[group] = {"n": int(mask.sum()), "status": "INSUFFICIENT_N"}
            elif len(np.unique(sy)) < 2:
                subgroup_report[group] = {"n": int(mask.sum()), "status": "ONE_CLASS_ONLY"}
            else:
                subgroup_report[group] = {
                    "n": int(mask.sum()), "events": int(sy.sum()),
                    "auroc": float(roc_auc_score(sy, p[mask])),
                    "average_precision": float(average_precision_score(sy, p[mask])),
                    "brier_score": float(brier_score_loss(sy, p[mask])),
                    "status": "DESCRIPTIVE_ONLY",
                }
        result["subgroups"] = subgroup_report
    return result
