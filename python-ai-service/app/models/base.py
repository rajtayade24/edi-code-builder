from abc import ABC, abstractmethod
from app.schemas.assessment import RiskAssessmentInput, BranchPrediction

class ModelAdapter(ABC):
    """Adapter contract for a locally hosted, trained and independently validated model.

    Implementations must not log request payloads, patient notes, or raw model features.
    """
    branch_id: str
    model_version: str
    calibration_status: str
    validation_reference: str

    @abstractmethod
    def predict(self, payload: RiskAssessmentInput) -> BranchPrediction:
        raise NotImplementedError
