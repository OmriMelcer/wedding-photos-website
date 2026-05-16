"""Unit tests for pipeline/cluster.py — covers PIPE-04, PIPE-05, PIPE-06."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pytest

from pipeline.cluster import (
    assign_cluster_by_time,
    assign_film_photos,
    compute_centroids,
    write_low_confidence_report,
)


def test_time_window_assignment(fixture_config: dict) -> None:
    time_windows = fixture_config["pipeline"]["events"]["time_windows"]

    cases = [
        (datetime(2026, 5, 1, 8, 30), "prep"),
        (datetime(2026, 5, 1, 15, 0), "photoshooting"),
        (datetime(2026, 5, 1, 17, 0), "dining"),
        (datetime(2026, 5, 1, 18, 15), "hupa"),
        (datetime(2026, 5, 1, 20, 0), "dancing"),
    ]

    for dt, expected_cluster in cases:
        cluster, confidence = assign_cluster_by_time(dt, time_windows)
        assert cluster == expected_cluster, f"Expected {expected_cluster} for {dt.strftime('%H:%M')}"
        assert confidence == 1.0


def test_knn_assignment(fixture_embeddings: np.ndarray) -> None:
    anchor_embeddings = fixture_embeddings[:3]
    anchor_labels = ["prep", "photoshooting", "dining"]
    film_embeddings = fixture_embeddings[3:]

    centroids = compute_centroids(anchor_embeddings, anchor_labels)
    results = assign_film_photos(film_embeddings, centroids)

    valid_labels = {"prep", "photoshooting", "dining"}
    for label, confidence in results:
        assert label in valid_labels
        assert 0.0 <= confidence <= 1.0


def test_exif_confidence_is_one(fixture_config: dict) -> None:
    time_windows = fixture_config["pipeline"]["events"]["time_windows"]
    dt = datetime(2026, 5, 1, 18, 15)
    _, confidence = assign_cluster_by_time(dt, time_windows)
    assert confidence == 1.0


def test_low_confidence_flagged(tmp_path: Path, fixture_config: dict) -> None:
    threshold = fixture_config["pipeline"]["confidence_threshold"]
    entries = [
        {"photo_id": "img_001", "cluster": "hupa", "cluster_confidence": 0.55},
        {"photo_id": "img_002", "cluster": "dining", "cluster_confidence": 0.85},
    ]
    report_path = tmp_path / "low_confidence.txt"

    write_low_confidence_report(entries, report_path, threshold)

    content = report_path.read_text()
    assert "img_001" in content
    assert content.lstrip().startswith("#")
