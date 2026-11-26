import numpy as np
from surgrisk_training.calibration import fit_platt_calibrator, apply_calibrator


def test_platt_calibrator_returns_probabilities():
    raw = np.asarray([0.05, 0.1, 0.2, 0.3, 0.6, 0.7, 0.8, 0.95])
    y = np.asarray([0, 0, 0, 0, 1, 1, 1, 1])
    calibrator = fit_platt_calibrator(raw, y)
    calibrated = apply_calibrator(raw, calibrator)
    assert np.all(np.isfinite(calibrated))
    assert np.all((calibrated >= 0) & (calibrated <= 1))
    assert calibrator["calibration_status"] == "PENDING_EXTERNAL_REVIEW"


def test_calibrator_rejects_single_class():
    try:
        fit_platt_calibrator([0.1, 0.2, 0.3, 0.4], [0, 0, 0, 0])
    except ValueError:
        return
    raise AssertionError("single-class calibration should be rejected")
