import os
from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class Settings:
    service_token: str = os.getenv('SURGRISK_AI_SERVICE_TOKEN', '')
    model_artifact_dir: Path = Path(os.getenv('MODEL_ARTIFACT_DIR', './model-artifacts')).resolve()
    host: str = os.getenv('HOST', '127.0.0.1')
    port: int = int(os.getenv('PORT', '8100'))

settings = Settings()
