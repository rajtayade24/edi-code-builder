from app.main import app, require_internal_token
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health_does_not_claim_inference_is_ready():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['inference_ready'] is False

def test_model_status_requires_internal_dependency():
    response = client.get('/v1/models')
    assert response.status_code == 503

def test_model_status_lists_four_unconfigured_branches():
    app.dependency_overrides[require_internal_token] = lambda: None
    try:
        response = client.get('/v1/models')
        assert response.status_code == 200
        data = response.json()['data']
        assert len(data['models']) == 4
        assert all(item['status'] == 'NOT_CONFIGURED' for item in data['models'])
        assert data['ensemble']['status'] == 'NOT_APPROVED'
    finally:
        app.dependency_overrides.clear()

def test_risk_assessment_never_generates_fallback_score():
    app.dependency_overrides[require_internal_token] = lambda: None
    payload = {
        'correlation_id': 'test-001',
        'patient': {'age': 57, 'sex_at_birth': 'UNKNOWN'},
        'procedure': {'name': 'Test procedure', 'urgency': 'ELECTIVE'},
    }
    try:
        response = client.post('/v1/risk-assessments', json=payload)
        assert response.status_code == 503
        assert response.json()['detail']['code'] == 'MODEL_ARTIFACTS_MISSING'
    finally:
        app.dependency_overrides.clear()
