"""pipeline/embed.py — CLIP embeddings for all photos.

Stub module. Implementation added in Phase 2 Plan 02.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np


def embed_image(path: Path, model: Any, preprocess: Any) -> np.ndarray:
    """Compute normalized 512-dim CLIP embedding for a single image."""
    raise NotImplementedError("embed_image not yet implemented")
