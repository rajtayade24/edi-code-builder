from __future__ import annotations
from pathlib import Path
import json
from .data import load_dataset
from .splitting import load_splits


def load_run(data_dir: str | Path, run_dir: str | Path, require_notes: bool = False):
    bundle = load_dataset(data_dir, require_deidentified_notes=require_notes)
    splits_path = Path(run_dir) / "splits.json"
    if not splits_path.exists():
        raise FileNotFoundError(f"{splits_path} not found; run scripts/create_splits.py first.")
    splits = load_splits(splits_path, bundle.cases)
    case_index = bundle.cases.set_index("case_id", drop=False)
    split_frames = {name: case_index.loc[ids].reset_index(drop=True) for name, ids in splits.items()}
    return bundle, split_frames


def read_config(path: str | Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))
