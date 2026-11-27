import logging

from app.core.config import settings
from app.models.adapters.common import verify_release
from app.models.registry import ModelRegistry

logger = logging.getLogger(__name__)


def register_available_adapters(registry: ModelRegistry) -> None:
    """Load only checksum-verified model artifacts with explicit external approval.

    Phase 5 training artifacts are always pending review and are intentionally skipped.
    Each optional branch dependency is imported lazily so a missing ML package does not
    prevent the FastAPI service from starting with all branches marked NOT_CONFIGURED.
    """
    branch_specs = (
        ("xgboost", "app.models.adapters.xgboost_adapter", "XGBoostAdapter"),
        ("bilstm", "app.models.adapters.bilstm_adapter", "BiLSTMAdapter"),
        ("gat", "app.models.adapters.gat_adapter", "GATAdapter"),
        ("biobert", "app.models.adapters.biobert_adapter", "BioBERTAdapter"),
    )
    for branch_id, module_name, class_name in branch_specs:
        branch_dir = settings.model_artifact_dir / branch_id
        if not verify_release(branch_dir, branch_id):
            continue
        try:
            module = __import__(module_name, fromlist=[class_name])
            adapter_class = getattr(module, class_name)
            adapter = adapter_class(branch_dir)
            registry.register(adapter)
            logger.info("Approved %s model adapter loaded.", branch_id)
        except (ImportError, OSError, ValueError, RuntimeError, KeyError, TypeError) as exc:
            # Never log payloads or model input values. This message is deployment metadata only.
            logger.warning("%s adapter remains NOT_CONFIGURED (%s).", branch_id, type(exc).__name__)
