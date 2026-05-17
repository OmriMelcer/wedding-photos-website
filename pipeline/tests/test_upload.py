"""Unit tests for pipeline/upload.py — covers SEC-02, SEC-03."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

from pipeline.upload import _upload_file


def test_upload_file_passes_extra_args(tmp_path: Path) -> None:
    local = tmp_path / "test.jpg"
    local.write_bytes(b"fake")
    s3 = MagicMock()

    _upload_file(
        s3,
        "bucket",
        local,
        "photos/test.jpg",
        {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
    )

    s3.upload_file.assert_called_once_with(
        str(local),
        "bucket",
        "photos/test.jpg",
        ExtraArgs={"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
    )


def test_upload_file_no_extra_args_uses_empty_dict(tmp_path: Path) -> None:
    local = tmp_path / "test.jpg"
    local.write_bytes(b"fake")
    s3 = MagicMock()

    _upload_file(s3, "bucket", local, "photos/test.jpg")

    s3.upload_file.assert_called_once_with(
        str(local),
        "bucket",
        "photos/test.jpg",
        ExtraArgs={},
    )


def test_upload_file_metadata_cache_control(tmp_path: Path) -> None:
    local = tmp_path / "metadata.json"
    local.write_bytes(b'{"photos":[]}')
    s3 = MagicMock()

    _upload_file(
        s3,
        "bucket",
        local,
        "metadata.json",
        {"ContentType": "application/json", "CacheControl": "public, max-age=86400"},
    )

    s3.upload_file.assert_called_once_with(
        str(local),
        "bucket",
        "metadata.json",
        ExtraArgs={"ContentType": "application/json", "CacheControl": "public, max-age=86400"},
    )
