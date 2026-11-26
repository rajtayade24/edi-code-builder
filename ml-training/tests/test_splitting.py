import pandas as pd
from surgrisk_training.splitting import make_patient_splits


def test_patient_groups_do_not_overlap():
    cases = pd.DataFrame({
        "case_id": [f"c{i}" for i in range(120)],
        "patient_id": [f"p{i // 2}" for i in range(120)],
        "outcome_30d_mortality": [1 if i % 4 == 0 else 0 for i in range(120)],
    })
    split = make_patient_splits(cases, seed=77)
    id_to_patient = cases.set_index("case_id")["patient_id"]
    patient_sets = {name: {id_to_patient.loc[cid] for cid in split["case_ids"][name]} for name in ("train", "calibration", "test")}
    assert not patient_sets["train"] & patient_sets["calibration"]
    assert not patient_sets["train"] & patient_sets["test"]
    assert not patient_sets["calibration"] & patient_sets["test"]
