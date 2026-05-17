# Phase 6: Pipeline Code Changes - Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 4 (2 modified, 2 test files — 1 extended, 1 new)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `pipeline/resize.py` | utility (image transform) | file-I/O | `pipeline/resize.py` itself | self (targeted edit) |
| `pipeline/upload.py` | utility (file upload) | file-I/O | `pipeline/upload.py` itself | self (targeted edit) |
| `pipeline/tests/test_resize.py` | test | — | `pipeline/tests/test_resize.py` itself | self (extend existing) |
| `pipeline/tests/test_upload.py` | test | — | `pipeline/tests/test_ingest.py` | role-match |

---

## Pattern Assignments

### `pipeline/resize.py` — EXIF stripping (targeted edit, lines 59 and 63)

**Analog:** The file itself; both `.save()` calls are the only touch points.

**Current core pattern** (`pipeline/resize.py`, lines 57–63):
```python
web = img.copy()
web.thumbnail((WEB_MAX, WEB_MAX), Image.Resampling.LANCZOS)
web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE)

thumb = img.copy()
thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.Resampling.LANCZOS)
thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE)
```

**Modified pattern — add `exif=b""` to both `.save()` calls:**
```python
web = img.copy()
web.thumbnail((WEB_MAX, WEB_MAX), Image.Resampling.LANCZOS)
# exif=b"" strips all EXIF from the output; exif_transpose() above already
# corrected orientation, so no metadata survives to the guest-facing file.
web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")

thumb = img.copy()
thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.Resampling.LANCZOS)
thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")
```

**Critical ordering constraint** (`pipeline/resize.py`, lines 44–49 — do not change):
```python
img = Image.open(src)
# Correct orientation BEFORE resize — without this, portrait phone photos
# render sideways.
img = ImageOps.exif_transpose(img)
# Strip alpha channel (JPEG cannot save RGBA); normalises palette/grayscale/CMYK.
img = img.convert("RGB")
```
`exif_transpose()` must remain before both `.save()` calls. It reads orientation from source EXIF — but `exif=b""` at save time is what prevents any EXIF bytes from entering the output file.

---

### `pipeline/upload.py` — Cache-Control headers (targeted edits)

**Analog:** The file itself; three touch points.

**Touch point 1 — `_upload_file()` helper** (`pipeline/upload.py`, lines 91–96):

Current:
```python
def _upload_file(s3, bucket: str, local_path: Path, key: str) -> None:
    """Upload a single file to R2.

    No retry logic — one-shot pipeline philosophy. Exceptions propagate to caller.
    """
    s3.upload_file(str(local_path), bucket, key)
```

Modified (add `extra_args` parameter):
```python
def _upload_file(s3, bucket: str, local_path: Path, key: str, extra_args: dict | None = None) -> None:
    """Upload a single file to R2.

    No retry logic — one-shot pipeline philosophy. Exceptions propagate to caller.
    """
    s3.upload_file(str(local_path), bucket, key, ExtraArgs=extra_args or {})
```

**Touch point 2 — photo and thumbnail `executor.submit()` calls** (`pipeline/upload.py`, lines 172–187):

Current:
```python
photo_future = executor.submit(
    _upload_file,
    s3,
    bucket,
    _PHOTOS_DIR / photo["filename"],
    f"photos/{photo['id']}.jpg",
)
thumb_future = executor.submit(
    _upload_file,
    s3,
    bucket,
    _THUMBS_DIR / photo["filename"],
    f"thumbs/{photo['id']}.jpg",
)
```

Modified (add `extra_args` dict as fifth positional argument):
```python
photo_future = executor.submit(
    _upload_file,
    s3,
    bucket,
    _PHOTOS_DIR / photo["filename"],
    f"photos/{photo['id']}.jpg",
    {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
)
thumb_future = executor.submit(
    _upload_file,
    s3,
    bucket,
    _THUMBS_DIR / photo["filename"],
    f"thumbs/{photo['id']}.jpg",
    {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
)
```

**Touch point 3 — metadata.json upload** (`pipeline/upload.py`, lines 201–207):

Current:
```python
s3.upload_file(
    str(_METADATA_PATH),
    bucket,
    "metadata.json",
    ExtraArgs={"ContentType": "application/json"},
)
```

Modified (add `CacheControl` key to existing `ExtraArgs` dict):
```python
s3.upload_file(
    str(_METADATA_PATH),
    bucket,
    "metadata.json",
    ExtraArgs={"ContentType": "application/json", "CacheControl": "public, max-age=86400"},
)
```

---

### `pipeline/tests/test_resize.py` — extend with EXIF stripping tests

**Analog:** The file itself (3 existing tests); new tests follow the same pattern.

**Existing test structure to copy** (`pipeline/tests/test_resize.py`, lines 38–54):
```python
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
```

**New tests to append — copy pattern (create source JPEG with EXIF, call `resize_photo`, assert on re-opened output file):**
```python
def test_exif_stripped_web(tmp_path: Path) -> None:
    src = tmp_path / "exif_src.jpg"
    img = Image.new("RGB", (200, 100))
    e = img.getexif()
    e[271] = "Canon"                    # Make
    e[306] = "2025:06:14 17:32:00"     # DateTime
    img.save(src, format="JPEG", exif=e.tobytes())

    web_out = tmp_path / "web.jpg"
    thumb_out = tmp_path / "thumb.jpg"
    resize_photo(src, web_out, thumb_out)

    with Image.open(web_out) as result:
        assert dict(result.getexif()) == {}


def test_exif_stripped_thumb(tmp_path: Path) -> None:
    src = tmp_path / "exif_src2.jpg"
    img = Image.new("RGB", (200, 100))
    e = img.getexif()
    e[271] = "Canon"
    e[306] = "2025:06:14 17:32:00"
    img.save(src, format="JPEG", exif=e.tobytes())

    web_out = tmp_path / "web2.jpg"
    thumb_out = tmp_path / "thumb2.jpg"
    resize_photo(src, web_out, thumb_out)

    with Image.open(thumb_out) as result:
        assert dict(result.getexif()) == {}


def test_sources_untouched(tmp_path: Path) -> None:
    src = tmp_path / "src_immutable.jpg"
    img = Image.new("RGB", (200, 100))
    e = img.getexif()
    e[271] = "Canon"
    img.save(src, format="JPEG", exif=e.tobytes())
    original_bytes = src.read_bytes()

    web_out = tmp_path / "web3.jpg"
    thumb_out = tmp_path / "thumb3.jpg"
    resize_photo(src, web_out, thumb_out)

    assert src.read_bytes() == original_bytes
```

**Key pattern note:** Always assert on the re-opened output file (`Image.open(web_out)`), not on the in-memory object. `image.info.get("exif")` on the in-memory object reflects source data; `result.getexif()` on the re-opened output file reflects what was actually written to disk.

---

### `pipeline/tests/test_upload.py` — new file

**Analog:** `pipeline/tests/test_ingest.py` (same test role: import a single function from the module, use `tmp_path`, assert on behavior)

**Imports pattern** from `pipeline/tests/test_ingest.py` (lines 1–10):
```python
"""Unit tests for pipeline/ingest.py — covers PIPE-01, PIPE-02."""
from __future__ import annotations

from pathlib import Path

import pytest
from PIL import Image

from pipeline.ingest import assign_photographer_label, extract_timestamp
```

**New file imports pattern** (adapted for upload.py with MagicMock):
```python
"""Unit tests for pipeline/upload.py — covers SEC-02, SEC-03."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from pipeline.upload import _upload_file
```

**Core test pattern — MagicMock for boto3 client:**
```python
def test_upload_file_passes_extra_args(tmp_path: Path) -> None:
    local = tmp_path / "test.jpg"
    local.write_bytes(b"fake")
    s3 = MagicMock()

    _upload_file(s3, "bucket", local, "photos/test.jpg",
                 {"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"})

    s3.upload_file.assert_called_once_with(
        str(local), "bucket", "photos/test.jpg",
        ExtraArgs={"ContentType": "image/jpeg", "CacheControl": "public, max-age=31536000, immutable"},
    )


def test_upload_file_no_extra_args_uses_empty_dict(tmp_path: Path) -> None:
    local = tmp_path / "test.jpg"
    local.write_bytes(b"fake")
    s3 = MagicMock()

    _upload_file(s3, "bucket", local, "photos/test.jpg")

    s3.upload_file.assert_called_once_with(
        str(local), "bucket", "photos/test.jpg",
        ExtraArgs={},
    )
```

---

## Shared Patterns

### Module header convention
**Source:** `pipeline/resize.py` lines 1–14; `pipeline/upload.py` lines 1–19
**Apply to:** All pipeline files (already established)
```python
"""pipeline/<module>.py

<one-line summary>
<blank line>
<detail sentences>

Usage:
    uv run python pipeline/<module>.py

Dependencies:
    <library>  (<what it's used for>)
"""
from __future__ import annotations
```

### `if __name__ == "__main__"` entry point
**Source:** `pipeline/resize.py` line 161; `pipeline/upload.py` line 221
**Apply to:** All pipeline scripts (already established)
```python
if __name__ == "__main__":
    main()
```

### Path-traversal security guard
**Source:** `pipeline/resize.py` lines 108–115; `pipeline/upload.py` lines 148–155
**Apply to:** Do NOT remove from either file during Phase 6 edits
```python
# Security guard: reject filenames with path-traversal characters
if "/" in filename or ".." in filename:
    print(
        f"Warning: skipping photo {photo['id']!r} — filename {filename!r} "
        "contains path-traversal characters.",
        file=sys.stderr,
    )
    ...
    continue
```

### One-shot pipeline error propagation
**Source:** `pipeline/upload.py` lines 91–96 (docstring); `pipeline/resize.py` lines 139–148
**Apply to:** `_upload_file()` — the "no retry" philosophy is preserved as `extra_args` is added
```python
# No retry logic — one-shot pipeline philosophy. Exceptions propagate to caller.
```

### Test file structure
**Source:** `pipeline/tests/test_resize.py`; `pipeline/tests/test_ingest.py`
**Apply to:** `pipeline/tests/test_upload.py` (new file)
- Module docstring citing requirement IDs: `"""Unit tests for pipeline/upload.py — covers SEC-02, SEC-03."""`
- `from __future__ import annotations` at top
- `from pathlib import Path` always imported
- `tmp_path: Path` fixture used for all temp file creation
- No `conftest.py` fixtures needed for upload tests (uses `MagicMock` instead of shared PIL fixtures)

---

## No Analog Found

All files have direct analogs (self or near-match). No files require falling back to RESEARCH.md patterns only.

---

## Key Anti-Patterns (from RESEARCH.md — do not introduce)

| Anti-Pattern | Why Prohibited |
|--------------|----------------|
| `image.info.pop("exif", None)` before save | Does not control JPEG encoder output; `exif=b""` kwarg is authoritative |
| Passing `ExtraArgs=None` to `s3.upload_file()` | boto3 requires a dict; raises `TypeError` — use `extra_args or {}` |
| `"Cache-Control"` (hyphen) as boto3 ExtraArgs key | boto3 requires `"CacheControl"` (camelCase); hyphen form is silently ignored or raises `ParamValidationError` |
| Writing to `src` (source path) | Source paths resolve into `sources/` — must remain byte-for-byte unchanged (D-03, SEC-01) |
| Asserting `image.info.get("exif")` on in-memory object in tests | Must re-open the output file and call `result.getexif()` to verify what was actually written |

---

## Metadata

**Analog search scope:** `pipeline/` and `pipeline/tests/`
**Files scanned:** 6 (`resize.py`, `upload.py`, `tests/test_resize.py`, `tests/test_ingest.py`, `tests/test_upload.py` (absent), `tests/conftest.py`)
**Pattern extraction date:** 2026-05-17
