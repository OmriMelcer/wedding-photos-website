"""Unit tests for pipeline/embed.py — covers PIPE-03."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import numpy as np
import pytest
import torch

from pipeline.embed import embed_image


def test_embedding_shape_normalized(tiny_jpeg: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    # Build mock model/preprocess that returns a 512-dim tensor
    mock_preprocess = MagicMock(return_value=torch.zeros(1, 3, 224, 224))
    mock_model = MagicMock()
    mock_model.encode_image.return_value = torch.ones(1, 512)

    result = embed_image(tiny_jpeg, mock_model, mock_preprocess)

    assert result.shape == (512,)
    assert abs(np.linalg.norm(result) - 1.0) < 1e-4
