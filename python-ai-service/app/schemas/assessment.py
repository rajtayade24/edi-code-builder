from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SexAtBirth = Literal['FEMALE', 'MALE', 'INTERSEX', 'UNKNOWN']
Severity = Literal['MILD', 'MODERATE', 'SEVERE', 'UNKNOWN']

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

class PatientFeatures(StrictModel):
    age: int | None = Field(default=None, ge=0, le=120)
    sex_at_birth: SexAtBirth = 'UNKNOWN'
    bmi: float | None = Field(default=None, ge=5, le=100)

class ProcedureFeatures(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    code: str | None = Field(default=None, max_length=60)
    specialty: str | None = Field(default=None, max_length=120)
    urgency: Literal['ELECTIVE', 'URGENT', 'EMERGENCY']
    asa_class: int | None = Field(default=None, ge=1, le=6)
    anesthesia_type: str | None = Field(default=None, max_length=100)

class ComorbidityFeature(StrictModel):
    name: str = Field(min_length=1, max_length=160)
    code: str | None = Field(default=None, max_length=60)
    severity: Severity = 'UNKNOWN'
    status: Literal['ACTIVE', 'RESOLVED'] = 'ACTIVE'

class VitalFeature(StrictModel):
    measured_at: datetime | None = None
    systolic_bp: int | None = Field(default=None, ge=40, le=300)
    diastolic_bp: int | None = Field(default=None, ge=20, le=200)
    heart_rate: int | None = Field(default=None, ge=20, le=250)
    respiratory_rate: int | None = Field(default=None, ge=4, le=80)
    temperature_c: float | None = Field(default=None, ge=25, le=45)
    oxygen_saturation: float | None = Field(default=None, ge=0, le=100)
    blood_glucose_mg_dl: float | None = Field(default=None, ge=1, le=2000)

class LabFeature(StrictModel):
    code: str | None = Field(default=None, max_length=60)
    test_name: str = Field(min_length=1, max_length=180)
    numeric_value: float | None = None
    result_text: str | None = Field(default=None, max_length=2000)
    unit: str | None = Field(default=None, max_length=50)
    collected_at: datetime | None = None

class RiskAssessmentInput(StrictModel):
    correlation_id: str = Field(min_length=1, max_length=80)
    patient: PatientFeatures
    procedure: ProcedureFeatures
    comorbidities: list[ComorbidityFeature] = Field(default_factory=list, max_length=200)
    vitals: list[VitalFeature] = Field(default_factory=list, max_length=100)
    lab_results: list[LabFeature] = Field(default_factory=list, max_length=200)
    clinical_notes: str | None = Field(default=None, max_length=12000)

class ShapDriver(StrictModel):
    feature_name: str = Field(min_length=1, max_length=180)
    attribution: float
    unit: str | None = None
    impact_level: Literal['CRITICAL', 'MODERATE', 'FAVORABLE', 'UNKNOWN'] = 'UNKNOWN'

class GatNode(StrictModel):
    node_id: str
    label: str
    code: str | None = None
    attention_weight: float = Field(ge=0, le=1)
    severity: Literal['LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'UNKNOWN'] = 'UNKNOWN'
    connected_node_ids: list[str] = Field(default_factory=list)

class BranchPrediction(StrictModel):
    id: Literal['xgboost', 'bilstm', 'gat', 'biobert']
    status: Literal['COMPLETED'] = 'COMPLETED'
    probability: float = Field(ge=0, le=1)
    model_version: str = Field(min_length=1, max_length=100)
    calibration_status: Literal['VALIDATED']
    validation_reference: str = Field(min_length=3, max_length=200)
    latency_ms: float = Field(ge=0)
    feature_count: int = Field(ge=0)
    key_insights: list[str] = Field(default_factory=list, max_length=30)
    shap_drivers: list[ShapDriver] = Field(default_factory=list, max_length=100)
    gat_nodes: list[GatNode] = Field(default_factory=list, max_length=100)

    @model_validator(mode='after')
    def branch_specific_payload(self):
        if self.id == 'gat' and self.gat_nodes and len(self.gat_nodes) > 100:
            raise ValueError('Too many graph nodes.')
        return self
