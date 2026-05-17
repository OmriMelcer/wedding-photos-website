"""pipeline/resize.py

Resize photos to web quality and generate thumbnails.
Reads pipeline/output/metadata.json for photo IDs and filenames, joins to
pipeline/output/catalog.json to locate each source image, and writes:
  pipeline/output/photos/{id}.jpg  (longest edge ≤ 2000px)
  pipeline/output/thumbs/{id}.jpg  (longest edge ≤ 400px)

Usage:
    uv run python pipeline/resize.py

Dependencies:
    pillow  (EXIF transpose, resize, JPEG save)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageOps


# Resolve paths relative to this script so the script works from any cwd.
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
_CATALOG_PATH = _PROJECT_ROOT / "pipeline" / "output" / "catalog.json"
_METADATA_PATH = _PROJECT_ROOT / "pipeline" / "output" / "metadata.json"
_PHOTOS_DIR = _PROJECT_ROOT / "pipeline" / "output" / "photos"
_THUMBS_DIR = _PROJECT_ROOT / "pipeline" / "output" / "thumbs"

WEB_MAX = 2000
THUMB_MAX = 400
JPEG_QUALITY = 82
JPEG_OPTIMIZE = True


def resize_photo(src: Path, web_out: Path, thumb_out: Path) -> None:
    """Resize src image to web (max 2000px) and thumb (max 400px) outputs.

    EXIF orientation is corrected before resizing so that portrait phone photos
    render upright. Both outputs are saved as JPEG with RGB colour space.
    """
    img = Image.open(src)
    # Correct orientation BEFORE resize — without this, portrait phone photos
    # render sideways.
    img = ImageOps.exif_transpose(img)
    # Strip alpha channel (JPEG cannot save RGBA); normalises palette/grayscale/CMYK.
    img = img.convert("RGB")

    web_out.parent.mkdir(parents=True, exist_ok=True)
    thumb_out.parent.mkdir(parents=True, exist_ok=True)

    # img.copy() is mandatory — Image.thumbnail() modifies in-place.
    # Without copying, the thumbnail call destroys the high-res image before
    # the web save.
    web = img.copy()
    web.thumbnail((WEB_MAX, WEB_MAX), Image.Resampling.LANCZOS)
    # exif=b"" strips all EXIF from output; exif_transpose() above already
    # corrected orientation, so no metadata survives to the guest-facing file.
    web.save(web_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")

    thumb = img.copy()
    thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.Resampling.LANCZOS)
    thumb.save(thumb_out, format="JPEG", quality=JPEG_QUALITY, optimize=JPEG_OPTIMIZE, exif=b"")


def main() -> None:
    # 1. Verify inputs exist
    if not _METADATA_PATH.exists():
        print(
            f"Error: {_METADATA_PATH} not found — run pipeline/cluster.py first.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not _CATALOG_PATH.exists():
        print(
            f"Error: {_CATALOG_PATH} not found — run pipeline/ingest.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 2. Load metadata
    with _METADATA_PATH.open(encoding="utf-8") as fh:
        metadata = json.load(fh)
    photos = metadata.get("photos", [])
    if not photos:
        print("Error: no photos found in metadata.json.", file=sys.stderr)
        sys.exit(1)

    # 3. Load catalog — build id → source_path lookup
    with _CATALOG_PATH.open(encoding="utf-8") as fh:
        catalog = json.load(fh)
    src_by_id: dict[str, str] = {e["id"]: e["source_path"] for e in catalog}

    # 4. Create output directories
    _PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    _THUMBS_DIR.mkdir(parents=True, exist_ok=True)

    # 5. Process each photo
    n_done = 0
    n_failed = 0
    total = len(photos)

    for photo in photos:
        photo_id: str = photo["id"]
        filename: str = photo["filename"]

        # Security check — reject filenames with path-traversal characters
        if "/" in filename or ".." in filename:
            print(
                f"Warning: skipping photo {photo_id!r} — filename {filename!r} "
                "contains path-traversal characters.",
                file=sys.stderr,
            )
            n_failed += 1
            continue

        # Locate source file via catalog lookup
        src_rel = src_by_id.get(photo_id)
        if src_rel is None:
            print(
                f"Warning: photo {photo_id!r} not found in catalog — skipping.",
                file=sys.stderr,
            )
            n_failed += 1
            continue

        src = _PROJECT_ROOT / src_rel
        if not src.exists():
            print(
                f"Warning: source file missing for {photo_id!r}: {src} — skipping.",
                file=sys.stderr,
            )
            n_failed += 1
            continue

        web_out = _PHOTOS_DIR / filename
        thumb_out = _THUMBS_DIR / filename

        try:
            resize_photo(src, web_out, thumb_out)
            n_done += 1
        except Exception as exc:
            print(
                f"Warning: failed to resize {photo_id!r} ({src}): {exc}",
                file=sys.stderr,
            )
            n_failed += 1
            continue

        if n_done % 25 == 0:
            print(f"  Resized {n_done}/{total}: {photo_id}")

    # 6. Summary
    print(
        f"Resize complete: {n_done} photo(s) → pipeline/output/photos/\n"
        f"                 {n_done} thumb(s) → pipeline/output/thumbs/\n"
        f"Skipped/failed:  {n_failed}"
    )


if __name__ == "__main__":
    main()
