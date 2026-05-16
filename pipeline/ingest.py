"""pipeline/ingest.py — walks source folders, extracts EXIF, tags photographer.

Stub module. Implementation added in Phase 2 Plan 02.
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any


def extract_timestamp(path: Path) -> datetime:
    """Extract and return timezone-aware datetime from JPEG EXIF data."""
    raise NotImplementedError("extract_timestamp not yet implemented")


def assign_photographer_label(file_path: str, config_sources: list[dict[str, Any]]) -> str:
    """Return photographer label for the given file path based on config sources."""
    raise NotImplementedError("assign_photographer_label not yet implemented")
