from types import SimpleNamespace
import pandas as pd
from surgrisk_training.features import build_tabular_record


def test_post_index_vitals_are_not_used():
    index = pd.Timestamp("2025-01-01T12:00:00Z")
    bundle = SimpleNamespace(
        comorbidities=pd.DataFrame(columns=["case_id", "observed_at", "status", "severity"]),
        vitals=pd.DataFrame([
            {"case_id": "c1", "measured_at": pd.Timestamp("2025-01-01T11:00:00Z"), "heart_rate": 70},
            {"case_id": "c1", "measured_at": pd.Timestamp("2025-01-01T13:00:00Z"), "heart_rate": 150},
        ]),
        labs=pd.DataFrame(columns=["case_id", "collected_at", "lab_code", "result_status", "unit", "numeric_value"]),
    )
    case = pd.Series({
        "case_id": "c1", "index_time": index, "age": 55, "bmi": 26, "asa_class": 2,
        "sex_at_birth": "FEMALE", "urgency": "ELECTIVE", "specialty": "GENERAL",
        "procedure_code": "P1", "anesthesia_type": "GENERAL",
    })
    record = build_tabular_record(bundle, case)
    assert record["heart_rate"] == 70
