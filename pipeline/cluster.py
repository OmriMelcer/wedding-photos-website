"""pipeline/cluster.py — EXIF-anchor + KNN assignment to event clusters.

Stub module. Implementation added in Phase 2 Plan 03.
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np


def assign_cluster_by_time(
    dt: datetime, time_windows: dict[str, dict[str, str]]
) -> tuple[str, float]:
    """Return (cluster_name, confidence) for a datetime using config time windows."""
    raise NotImplementedError("assign_cluster_by_time not yet implemented")


def compute_centroids(
    embeddings: np.ndarray, labels: list[str]
) -> dict[str, np.ndarray]:
    """Compute per-cluster centroids from anchor embeddings and their labels."""
    raise NotImplementedError("compute_centroids not yet implemented")


def assign_film_photos(
    film_embeddings: np.ndarray, centroids: dict[str, np.ndarray]
) -> list[tuple[str, float]]:
    """Assign each film embedding to nearest centroid; return list of (label, confidence)."""
    raise NotImplementedError("assign_film_photos not yet implemented")


def write_low_confidence_report(
    entries: list[dict[str, Any]], path: Path, threshold: float
) -> None:
    """Write flagged low-confidence photo entries to a report file."""
    raise NotImplementedError("write_low_confidence_report not yet implemented")
