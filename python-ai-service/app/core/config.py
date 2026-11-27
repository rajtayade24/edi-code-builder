import os
from dataclasses import dataclass, field
from pathlib import Path


def _load_local_env() -> None:
    env_path = Path(__file__).resolve().parents[2] / '.env'
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_local_env()


def _default_artifact_dir() -> Path:
    return Path(os.getenv('MODEL_ARTIFACT_DIR', './model-artifacts')).resolve()


@dataclass(frozen=True)
class Settings:
    service_token: str = os.getenv('SURGRISK_AI_SERVICE_TOKEN', '')
    model_artifact_dir: Path = field(default_factory=_default_artifact_dir)
    host: str = os.getenv('HOST', '127.0.0.1')
    port: int = int(os.getenv('PORT', '8100'))


settings = Settings()
