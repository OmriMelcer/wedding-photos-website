"""Unit tests for pipeline/resize.py — covers PIPE-07."""
from __future__ import annotations

from pathlib import Path

import pytest
from PIL import Image

from pipeline.resize import resize_photo


def test_web_image_max_dimension(tmp_path: Path) -> None:
    src = tmp_path / "large.jpg"
    img = Image.new("RGB", (4000, 3000), color=(200, 100, 50))
    img.save(src, format="JPEG")

    web_out = tmp_path / "web.jpg"
    thumb_out = tmp_path / "thumb.jpg"
    resize_photo(src, web_out, thumb_out)

    with Image.open(web_out) as result:
        assert max(result.width, result.height) <= 2000


def test_thumb_max_dimension(tmp_path: Path) -> None:
    src = tmp_path / "large2.jpg"
    img = Image.new("RGB", (4000, 3000), color=(100, 200, 150))
    img.save(src, format="JPEG")

    web_out = tmp_path / "web2.jpg"
    thumb_out = tmp_path / "thumb2.jpg"
    resize_photo(src, web_out, thumb_out)

    with Image.open(thumb_out) as result:
        assert max(result.width, result.height) <= 400


def test_exif_orientation_corrected(tmp_path: Path) -> None:
    src = tmp_path / "oriented.jpg"
    img = Image.new("RGB", (400, 300), color=(80, 120, 180))
    exif = img.getexif()
    # Tag 274 = Orientation; 6 = 90 degrees CW rotation needed
    exif[274] = 6
    img.save(src, format="JPEG", exif=exif.tobytes())

    web_out = tmp_path / "web_oriented.jpg"
    thumb_out = tmp_path / "thumb_oriented.jpg"
    resize_photo(src, web_out, thumb_out)

    with Image.open(web_out) as result:
        out_exif = result.getexif()
        # After correction, orientation tag should be 1 (normal) or absent
        orientation = out_exif.get(274, 1)
        assert orientation == 1
