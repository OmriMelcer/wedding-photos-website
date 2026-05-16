"""Shared pytest fixtures for pipeline tests."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from PIL import Image


@pytest.fixture
def tiny_jpeg(tmp_path: Path) -> Path:
    img = Image.new("RGB", (10, 10), color=(255, 255, 255))
    out = tmp_path / "fixture.jpg"
    img.save(out, format="JPEG")
    return out


@pytest.fixture
def fixture_embeddings() -> np.ndarray:
    rng = np.random.default_rng(42)
    arr = rng.standard_normal((5, 512)).astype(np.float32)
    arr = arr / np.linalg.norm(arr, axis=1, keepdims=True)
    return arr


@pytest.fixture
def fixture_config() -> dict:
    return {
        "pipeline": {
            "confidence_threshold": 0.7,
            "events": {
                "time_windows": {
                    "prep": {"start": "08:00", "end": "14:00"},
                    "photoshooting": {"start": "14:00", "end": "16:10"},
                    "dining": {"start": "16:10", "end": "18:00"},
                    "hupa": {"start": "18:00", "end": "18:40"},
                    "dancing": {"start": "18:40", "end": "23:59"},
                }
            },
        }
    }
