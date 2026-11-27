from __future__ import annotations

import numpy as np
from scipy.special import expit, logit
from sklearn.linear_model import LogisticRegression


def fit_platt_calibrator(raw_probabilities, labels) -> dict:
    raw = np.asarray(raw_probabilities, dtype=float).reshape(-1)
    y = np.asarray(labels, dtype=int).reshape(-1)
    if len(raw) != len(y) or len(y) < 4 or len(np.unique(y)) != 2:
        raise ValueError("Calibration split must contain at least four rows and both outcome classes.")
    logits = logit(np.clip(raw, 1e-6, 1 - 1e-6)).reshape(-1, 1)
    model = LogisticRegression(C=1e6, solver="lbfgs", max_iter=2000)
    model.fit(logits, y)
    return {
        "method": "platt_scaling",
        "intercept": float(model.intercept_[0]),
        "slope": float(model.coef_[0][0]),
        "calibration_status": "PENDING_EXTERNAL_REVIEW",
        "fitted_on": "calibration_split_only",
        "note": "Internal calibration fit; this does not constitute independent or clinical validation.",
    }


def apply_calibrator(raw_probabilities, calibrator: dict):
    raw = np.asarray(raw_probabilities, dtype=float)
    logits = logit(np.clip(raw, 1e-6, 1 - 1e-6))
    return expit(float(calibrator["intercept"]) + float(calibrator["slope"]) * logits)
