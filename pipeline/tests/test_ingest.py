"""Unit tests for pipeline/ingest.py — covers PIPE-01, PIPE-02."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from PIL import Image

from pipeline.ingest import assign_photographer_label, extract_timestamp


def test_exif_normalization(tmp_path: Path) -> None:
    img = Image.new("RGB", (10, 10), color=(128, 128, 128))
    exif = img.getexif()
    # Tag 36867 = DateTimeOriginal, Tag 36881 = OffsetTimeOriginal
    exif[36867] = "2026:05:01 18:30:00"
    exif[36881] = "+02:00"
    out = tmp_path / "test.jpg"
    img.save(out, format="JPEG", exif=exif.tobytes())

    result = extract_timestamp(out)

    expected = datetime(2026, 5, 1, 18, 30, 0, tzinfo=timezone(timedelta(hours=2)))
    assert result == expected


def test_zero_offset_treated_as_local(tmp_path: Path) -> None:
    # Per RESEARCH.md Pitfall #1: +00:00 in these camera files means Israel local time, NOT UTC.
    img = Image.new("RGB", (10, 10), color=(64, 64, 64))
    exif = img.getexif()
    exif[36867] = "2026:05:01 18:30:00"
    exif[36881] = "+00:00"
    out = tmp_path / "test_zero.jpg"
    img.save(out, format="JPEG", exif=exif.tobytes())

    result = extract_timestamp(out)

    assert result.hour == 18
    assert result.tzinfo is not None
    assert result.utcoffset() == timedelta(hours=2)


def test_photographer_label(fixture_config: dict) -> None:
    config_sources_list = [
        {"label": "abir_sultan", "output_dir": "sources/abir_sultan"},
        {"label": "abir_sultan", "output_dir": "sources/abir_sultan_film"},
        {"label": "inbal_zeldin", "output_dir": "sources/inbal_zeldin"},
        {"label": "magnate_images", "output_dir": "sources/magnate_images"},
    ]
    label = assign_photographer_label("sources/abir_sultan/IMG.JPG", config_sources_list)
    assert label == "abir_sultan"
