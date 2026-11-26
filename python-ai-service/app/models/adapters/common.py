from __future__ import annotations
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import math
import re
import time

from app.schemas.assessment import BranchPrediction


class MissingModalityError(Exception):
    """Required model modality was not provided in the approved inference payload."""


def value(item, key, default=None):
    if item is None:
        return default
    if isinstance(item, dict):
        return item.get(key, default)
    return getattr(item, key, default)


def as_float(item, key, default=float("nan")):
    raw = value(item, key, None)
    if raw is None:
        return default
    try:
        number = float(raw)
        return number if math.isfinite(number) else default
    except (TypeError, ValueError):
        return default


def verify_release(branch_dir: Path, expected_branch: str) -> dict | None:
    release_path = branch_dir / "release.json"
    if not release_path.is_file():
        return None
    try:
        release = json.loads(release_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if release.get("branch_id") != expected_branch:
        return None
    if release.get("approved_for_use") is not True:
        return None
    if release.get("calibration_status") != "VALIDATED":
        return None
    reference = release.get("validation_reference")
    approver = release.get("approved_by")
    evidence = release.get("approval_evidence")
    approved_at = release.get("approved_at")
    if not isinstance(reference, str) or len(reference.strip()) < 3:
        return None
    if not isinstance(approver, str) or len(approver.strip()) < 2:
        return None
    if not isinstance(evidence, str) or len(evidence.strip()) < 3:
        return None
    if not isinstance(approved_at, str) or len(approved_at.strip()) < 10:
        return None
    checksums = release.get("artifact_sha256")
    if not isinstance(checksums, dict) or not checksums:
        return None
    for relative, expected in checksums.items():
        if not isinstance(relative, str):
            return None
        candidate = (branch_dir / relative.replace("\\", "/")).resolve()
        try:
            candidate.relative_to(branch_dir.resolve())
        except ValueError:
            return None
        if not candidate.is_file():
            return None
        digest = hashlib.sha256()
        with candidate.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        if not isinstance(expected, str) or digest.hexdigest() != expected:
            return None
    return release


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def calibrated_probability(raw_probability: float, calibrator: dict) -> float:
    clipped = min(max(float(raw_probability), 1e-6), 1 - 1e-6)
    raw_logit = math.log(clipped / (1 - clipped))
    result = 1.0 / (1.0 + math.exp(-max(min(float(calibrator["intercept"]) + float(calibrator["slope"]) * raw_logit, 40), -40)))
    return min(max(result, 0.0), 1.0)


def make_prediction(branch_id: str, probability: float, release: dict, latency_ms: float, feature_count: int) -> BranchPrediction:
    return BranchPrediction(
        id=branch_id,
        probability=float(probability),
        model_version=str(release["model_version"]),
        calibration_status="VALIDATED",
        validation_reference=str(release["validation_reference"]),
        latency_ms=max(0.0, float(latency_ms)),
        feature_count=max(0, int(feature_count)),
    )


def parse_time(raw):
    if raw is None:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        parsed = raw if isinstance(raw, datetime) else datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return datetime.min.replace(tzinfo=timezone.utc)


def slug(value_text: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "_", str(value_text or "UNKNOWN").upper()).strip("_") or "UNKNOWN"
