import json
import math
from pathlib import Path

from app.core.config import settings
from app.models.base import ModelAdapter
from app.schemas.assessment import RiskAssessmentInput

EXPECTED_MODELS = {
    'xgboost': 'Tabular preoperative baseline model',
    'bilstm': 'Longitudinal vital-sign and laboratory sequence model',
    'gat': 'Comorbidity graph attention model',
    'biobert': 'Clinical-text NLP model',
}

class ModelNotReadyError(Exception):
    def __init__(self, message: str, models: list[dict]):
        super().__init__(message)
        self.models = models

class EnsembleNotApprovedError(Exception):
    pass

class ModelRegistry:
    def __init__(self):
        self._adapters: dict[str, ModelAdapter] = {}

    def register(self, adapter: ModelAdapter) -> None:
        if adapter.branch_id not in EXPECTED_MODELS:
            raise ValueError(f'Unsupported model branch: {adapter.branch_id}')
        if adapter.branch_id in self._adapters:
            raise ValueError(f'Model branch already registered: {adapter.branch_id}')
        self._adapters[adapter.branch_id] = adapter

    def statuses(self) -> list[dict]:
        rows = []
        for model_id, description in EXPECTED_MODELS.items():
            adapter = self._adapters.get(model_id)
            rows.append({
                'id': model_id,
                'name': model_id.upper(),
                'description': description,
                'status': (
                    'READY'
                    if adapter
                    and getattr(adapter, 'calibration_status', None) == 'VALIDATED'
                    and bool(getattr(adapter, 'validation_reference', None))
                    and bool(getattr(adapter, 'model_version', None))
                    else ('LOADED_PENDING_VALIDATION' if adapter else 'NOT_CONFIGURED')
                ),
                'model_version': getattr(adapter, 'model_version', None),
                'calibration_status': getattr(adapter, 'calibration_status', None),
                'validation_reference': getattr(adapter, 'validation_reference', None),
            })
        return rows

    def _approved_weights(self) -> tuple[dict[str, float], str, str]:
        manifest_path: Path = settings.model_artifact_dir / 'ensemble-config.json'
        if not manifest_path.is_file():
            raise EnsembleNotApprovedError('A reviewed ensemble-config.json has not been installed.')
        try:
            config = json.loads(manifest_path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError) as exc:
            raise EnsembleNotApprovedError('The ensemble configuration is unreadable.') from exc
        if not isinstance(config, dict):
            raise EnsembleNotApprovedError('The ensemble configuration must be a JSON object.')
        weights = config.get('weights')
        reference = config.get('validation_reference')
        approved = config.get('approved_for_use') is True
        if not approved or not isinstance(reference, str) or len(reference.strip()) < 3:
            raise EnsembleNotApprovedError('The ensemble has no recorded approval and validation reference.')
        if not isinstance(weights, dict) or set(weights) != set(EXPECTED_MODELS):
            raise EnsembleNotApprovedError('The ensemble must define a weight for each of the four model branches.')
        try:
            if any(isinstance(value, bool) for value in weights.values()):
                raise ValueError('Boolean values are not valid ensemble weights.')
            normalized = {key: float(value) for key, value in weights.items()}
        except (TypeError, ValueError) as exc:
            raise EnsembleNotApprovedError('Ensemble weights must be numeric.') from exc
        if any(not math.isfinite(value) or value < 0 or value > 1 for value in normalized.values()) or abs(sum(normalized.values()) - 1.0) > 1e-6:
            raise EnsembleNotApprovedError('Ensemble weights must be between 0 and 1 and sum to 1.')
        return (
            normalized,
            str(config.get('manifest_version', 'unversioned')),
            reference.strip(),
        )

    def ensemble_status(self) -> dict:
        try:
            _, version, validation_reference = self._approved_weights()
            return {
                'status': 'APPROVED',
                'manifest_version': version,
                'validation_reference': validation_reference,
            }
        except EnsembleNotApprovedError as exc:
            return {'status': 'NOT_APPROVED', 'message': str(exc)}

    def assess(self, payload: RiskAssessmentInput) -> dict:
        missing = [model_id for model_id in EXPECTED_MODELS if model_id not in self._adapters]
        if missing:
            raise ModelNotReadyError(
                'One or more trained model branches have not been installed.', self.statuses()
            )

        weights, manifest_version, ensemble_validation_reference = self._approved_weights()
        predictions = []
        for model_id in EXPECTED_MODELS:
            adapter = self._adapters[model_id]
            if getattr(adapter, 'calibration_status', None) != 'VALIDATED':
                raise EnsembleNotApprovedError(f'{model_id} has not passed probability-calibration review.')
            if not getattr(adapter, 'validation_reference', None):
                raise EnsembleNotApprovedError(f'{model_id} has no validation reference.')
            output = adapter.predict(payload)
            if (
                output.id != model_id
                or output.calibration_status != 'VALIDATED'
                or output.model_version != adapter.model_version
                or output.validation_reference != adapter.validation_reference
            ):
                raise EnsembleNotApprovedError(f'{model_id} returned an invalid or unvalidated result.')
            predictions.append(output)

        probability = sum(weights[item.id] * item.probability for item in predictions)
        return {
            'outcome': '30_DAY_MORTALITY',
            'probability': round(probability, 8),
            'model_manifest_version': manifest_version,
            'ensemble_validation_reference': ensemble_validation_reference,
            'branches': [item.model_dump(mode='json') for item in predictions],
            'explainability': {
                'shap_drivers': [driver.model_dump(mode='json') for item in predictions for driver in item.shap_drivers],
                'gat_nodes': [node.model_dump(mode='json') for item in predictions if item.id == 'gat' for node in item.gat_nodes],
            },
        }

model_registry = ModelRegistry()
