from app.models.registry import ModelRegistry, ModelNotReadyError
from app.schemas.assessment import RiskAssessmentInput


def test_registry_reports_all_expected_models_as_not_configured():
    registry = ModelRegistry()
    statuses = registry.statuses()
    assert {item['id'] for item in statuses} == {'xgboost', 'bilstm', 'gat', 'biobert'}
    assert all(item['status'] == 'NOT_CONFIGURED' for item in statuses)


def test_registry_never_returns_a_demo_prediction_when_models_are_missing():
    registry = ModelRegistry()
    payload = RiskAssessmentInput(
        correlation_id='test-only',
        patient={'age': 57, 'sex_at_birth': 'UNKNOWN'},
        procedure={'name': 'Test procedure', 'urgency': 'ELECTIVE'},
    )
    try:
        registry.assess(payload)
    except ModelNotReadyError as exc:
        assert len(exc.models) == 4
    else:
        raise AssertionError('An assessment must not run without configured model artifacts.')
