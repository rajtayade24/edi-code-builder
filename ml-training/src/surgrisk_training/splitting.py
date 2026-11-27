from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.model_selection import GroupShuffleSplit


def make_patient_splits(cases, seed: int = 42, train_fraction: float = 0.70, calibration_fraction: float = 0.15, test_fraction: float = 0.15) -> dict:
    total = train_fraction + calibration_fraction + test_fraction
    if abs(total - 1.0) > 1e-8 or min(train_fraction, calibration_fraction, test_fraction) <= 0:
        raise ValueError("Split fractions must be positive and sum to 1.0.")
    y = cases["outcome_30d_mortality"].to_numpy(dtype=int)
    groups = cases["patient_id"].astype(str).to_numpy()
    indices = np.arange(len(cases))
    test_size = test_fraction
    calibration_relative = calibration_fraction / (train_fraction + calibration_fraction)

    for attempt in range(100):
        random_state = seed + attempt
        outer = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
        train_cal_idx, test_idx = next(outer.split(indices, y, groups))
        inner = GroupShuffleSplit(n_splits=1, test_size=calibration_relative, random_state=random_state + 1000)
        train_rel, calibration_rel = next(inner.split(train_cal_idx, y[train_cal_idx], groups[train_cal_idx]))
        train_idx = train_cal_idx[train_rel]
        calibration_idx = train_cal_idx[calibration_rel]
        split_indices = {"train": train_idx, "calibration": calibration_idx, "test": test_idx}
        if all(len(np.unique(y[idx])) == 2 for idx in split_indices.values()):
            patient_sets = {k: set(groups[idx]) for k, idx in split_indices.items()}
            if not (patient_sets["train"] & patient_sets["calibration"] or patient_sets["train"] & patient_sets["test"] or patient_sets["calibration"] & patient_sets["test"]):
                return {
                    "seed": random_state,
                    "strategy": "GroupShuffleSplit by patient_id; no patient appears in more than one split",
                    "fractions_requested": {"train": train_fraction, "calibration": calibration_fraction, "test": test_fraction},
                    "case_ids": {k: cases.iloc[idx]["case_id"].astype(str).tolist() for k, idx in split_indices.items()},
                    "patient_counts": {k: len(patient_sets[k]) for k in patient_sets},
                    "case_counts": {k: len(split_indices[k]) for k in split_indices},
                    "outcome_counts": {k: {str(v): int((y[idx] == v).sum()) for v in (0, 1)} for k, idx in split_indices.items()},
                }
    raise ValueError("Could not create patient-disjoint train/calibration/test splits containing both outcome classes. More eligible patients/events or a different prespecified split ratio may be required.")


def load_splits(path: str | Path, cases) -> dict[str, list[str]]:
    obj = json.loads(Path(path).read_text(encoding="utf-8"))
    split_ids = obj.get("case_ids", {})
    required = {"train", "calibration", "test"}
    if set(split_ids) != required:
        raise ValueError("splits.json must define train, calibration and test case_ids.")
    all_ids = [str(case_id) for values in split_ids.values() for case_id in values]
    if len(all_ids) != len(set(all_ids)):
        raise ValueError("A case_id appears in more than one split.")
    known = set(cases["case_id"].astype(str))
    if set(all_ids) != known:
        raise ValueError("splits.json case IDs do not exactly match the currently loaded eligible dataset; recreate splits.")
    patient_by_case = cases.set_index("case_id")["patient_id"].astype(str)
    patients = {name: {patient_by_case.loc[case_id] for case_id in values} for name, values in split_ids.items()}
    if any(patients[a] & patients[b] for a, b in (("train", "calibration"), ("train", "test"), ("calibration", "test"))):
        raise ValueError("Patient leakage detected: a patient appears in multiple splits.")
    return {name: [str(v) for v in values] for name, values in split_ids.items()}
