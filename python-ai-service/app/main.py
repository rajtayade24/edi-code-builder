import hmac

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.models.adapters.common import MissingModalityError
from app.models.register_adapters import register_available_adapters
from app.models.registry import (
    EnsembleNotApprovedError,
    ModelNotReadyError,
    model_registry,
)
from app.schemas.assessment import RiskAssessmentInput

register_available_adapters(model_registry)
app = FastAPI(
    title="SurgRisk-AI Model Service",
    version="0.5.0",
    description="Private inference boundary for reviewed SurgRisk-AI model artifacts.",
    docs_url=None,
    redoc_url=None,
)


def require_internal_token(x_ai_service_token: str | None = Header(default=None)):
    expected = settings.service_token
    if not expected or len(expected) < 32:
        raise HTTPException(status_code=503, detail={
            "code": "AI_SERVICE_TOKEN_NOT_CONFIGURED",
            "message": "The internal service token is not configured.",
        })
    if not x_ai_service_token or not hmac.compare_digest(x_ai_service_token, expected):
        raise HTTPException(status_code=401, detail={
            "code": "AI_SERVICE_UNAUTHORIZED",
            "message": "Internal service authentication failed.",
        })


@app.get("/health")
def health():
    statuses = model_registry.statuses()
    ready = sum(1 for item in statuses if item["status"] == "READY")
    ensemble = model_registry.ensemble_status()
    return {
        "success": True,
        "service": "surgrisk-ai-model-service",
        "inference_ready": ready == len(statuses) and ensemble["status"] == "APPROVED",
        "ready_branches": ready,
        "required_branches": len(statuses),
        "ensemble_status": ensemble["status"],
    }


@app.get("/v1/models", dependencies=[Depends(require_internal_token)])
def get_models():
    return {"success": True, "data": {
        "models": model_registry.statuses(),
        "ensemble": model_registry.ensemble_status(),
    }}


@app.post("/v1/risk-assessments", dependencies=[Depends(require_internal_token)])
def create_risk_assessment(payload: RiskAssessmentInput):
    try:
        result = model_registry.assess(payload)
        return {"success": True, "data": result}
    except ModelNotReadyError as exc:
        return JSONResponse(status_code=503, content={"detail": {
            "code": "MODEL_ARTIFACTS_MISSING",
            "message": str(exc),
            "models": exc.models,
        }})
    except EnsembleNotApprovedError as exc:
        return JSONResponse(status_code=503, content={"detail": {
            "code": "ENSEMBLE_NOT_APPROVED",
            "message": str(exc),
            "models": model_registry.statuses(),
            "ensemble": model_registry.ensemble_status(),
        }})
    except MissingModalityError as exc:
        return JSONResponse(status_code=422, content={"detail": {
            "code": "REQUIRED_MODALITY_MISSING",
            "message": str(exc),
        }})
