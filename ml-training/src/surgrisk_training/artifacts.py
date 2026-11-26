from __future__ import annotations
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import platform
import sys


def save_json(path: str | Path, payload: dict) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str), encoding="utf-8")


def sha256_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_branch_release(branch_dir: str | Path, branch_id: str, model_version: str, validation_report: str) -> None:
    directory = Path(branch_dir)
    files = {}
    for path in sorted(directory.rglob("*")):
        if path.is_file() and path.name != "release.json":
            files[path.relative_to(directory).as_posix()] = sha256_file(path)
    save_json(directory / "release.json", {
        "branch_id": branch_id,
        "model_version": model_version,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_for_use": False,
        "calibration_status": "PENDING_EXTERNAL_REVIEW",
        "validation_reference": None,
        "internal_evaluation_report": validation_report,
        "artifact_sha256": files,
        "runtime_compatibility": {"python": sys.version.split()[0], "platform": platform.platform()},
        "release_note": "Training artifact only. Independent clinical validation and explicit governance approval are required before inference activation.",
    })
