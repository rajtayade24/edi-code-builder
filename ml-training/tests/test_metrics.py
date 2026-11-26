import numpy as np
from surgrisk_training.metrics import evaluate_probabilities


def test_evaluation_metrics_are_finite():
    report = evaluate_probabilities([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9])
    assert 0 <= report["auroc"] <= 1
    assert 0 <= report["brier_score"] <= 1
    assert report["n"] == 4
