"""pipeline/ingest.py

Walk source folders from config.yaml, extract EXIF metadata, assign photographer
labels, and write pipeline/output/catalog.json.

Usage:
    uv run python pipeline/ingest.py

Dependencies:
    pillow   (EXIF extraction, image open)
    pyyaml   (config parsing)
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml
from PIL import Image
from PIL.ExifTags import TAGS


# Resolve paths relative to this script so the script works from any cwd.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"
_PROJECT_ROOT = _SCRIPT_DIR.parent
_OUTPUT_DIR = _PROJECT_ROOT / "pipeline" / "output"
_CATALOG_PATH = _OUTPUT_DIR / "catalog.json"

ISRAEL_TZ = timezone(timedelta(hours=2))
EXIF_DATETIME_FORMAT = "%Y:%m:%d %H:%M:%S"
IMAGE_GLOB = "*.[jJpPgG][pPeEnNiI][gGfFfF]*"
TAG_MAP = {v: k for k, v in TAGS.items()}
DT_ORIGINAL_TAG = TAG_MAP["DateTimeOriginal"]
OFFSET_ORIGINAL_TAG = TAG_MAP["OffsetTimeOriginal"]


def _load_config() -> dict:
    """Load and return the parsed pipeline/config.yaml."""
    if not _CONFIG_PATH.exists():
        print(f"Error: config file not found at {_CONFIG_PATH}", file=sys.stderr)
        sys.exit(1)
    with _CONFIG_PATH.open() as fh:
        return yaml.safe_load(fh)


def _resolve_output_dir(output_dir_str: str) -> Path:
    """Resolve output_dir to an absolute path anchored at the project root.

    Applies path traversal mitigation (T-01-02): asserts the resolved path is
    a descendant of the project root before use.
    """
    resolved = (_PROJECT_ROOT / output_dir_str).resolve()
    project_root_resolved = _PROJECT_ROOT.resolve()
    if resolved != project_root_resolved and not str(resolved).startswith(
        str(project_root_resolved) + "/"
    ):
        print(
            f"Error: output_dir '{output_dir_str}' resolves outside the project root "
            f"({project_root_resolved}). Refusing to use it (path traversal guard).",
            file=sys.stderr,
        )
        sys.exit(1)
    return resolved


def extract_timestamp(img_path: Path, camera_utc_offset_hours: int = 2) -> datetime | None:
    """Extract and return timezone-aware datetime from JPEG EXIF data.

    Uses camera_utc_offset_hours (from config.yaml) to set the correct UTC offset
    for DateTimeOriginal — OffsetTimeOriginal is ignored because it is unreliable
    across the three camera systems used at this wedding (abir_sultan=+02:00/IST,
    inbal_zeldin=+03:00/IDT, magnate=+00:00 tag but actual IDT).

    Returns None if DateTimeOriginal is missing or blank (e.g. film scans).
    """
    with Image.open(img_path) as img:
        exif_data = img._getexif() or {}

    raw_dt = exif_data.get(DT_ORIGINAL_TAG)
    if not raw_dt or not raw_dt.strip():
        # Pitfall #3: film scans have blank DateTimeOriginal — return None.
        return None

    dt_naive = datetime.strptime(raw_dt.strip(), EXIF_DATETIME_FORMAT)
    camera_tz = timezone(timedelta(hours=camera_utc_offset_hours))
    return dt_naive.replace(tzinfo=camera_tz)


def assign_photographer_label(source_path: str | Path, local_sources: list[dict]) -> str:
    """Return photographer label for the given file path based on config sources.

    Matches by checking if source_path starts with the entry's output_dir
    or if the parent directory name matches the last segment of output_dir.

    Raises ValueError if no match is found.
    """
    source_path = Path(source_path)
    source_path_str = str(source_path)

    for entry in local_sources:
        output_dir = entry["output_dir"]
        # Match by prefix (absolute or relative path starting with output_dir)
        if source_path_str.startswith(output_dir):
            return entry["label"]
        # Match by parent directory name against the last segment of output_dir
        if source_path.parent.name == Path(output_dir).name:
            return entry["label"]

    raise ValueError(f"No photographer label found for path: {source_path}")


def main() -> None:
    config = _load_config()

    local_sources: list[dict] = config.get("sources", {}).get("local_sources", [])
    if not local_sources:
        print(
            "Error: no entries found under sources.local_sources in config.yaml",
            file=sys.stderr,
        )
        sys.exit(1)

    # Resolve and create output directory
    output_dir = _resolve_output_dir(_OUTPUT_DIR.relative_to(_PROJECT_ROOT).as_posix())
    output_dir.mkdir(parents=True, exist_ok=True)

    catalog: list[dict] = []
    embed_index = 0

    for entry in local_sources:
        label: str = entry["label"]
        output_dir_rel: str = entry["output_dir"]
        has_exif: bool = entry.get("has_exif", False)
        camera_utc_offset_hours: int = entry.get("camera_utc_offset_hours", 2)

        source_dir = _resolve_output_dir(output_dir_rel)

        if not source_dir.exists():
            print(
                f"Warning: source directory does not exist, skipping: {source_dir}",
                file=sys.stderr,
            )
            continue

        for img_path in sorted(source_dir.glob(IMAGE_GLOB)):
            # Pitfall #4 (RESEARCH.md): use label prefix to avoid ID collisions
            # across photographers who may share filenames like IMG_0001.
            photo_id = f"{label}_{img_path.stem}"
            ts = extract_timestamp(img_path, camera_utc_offset_hours) if has_exif else None

            catalog_entry = {
                "id": photo_id,
                "source_path": str(img_path.relative_to(_PROJECT_ROOT)),
                "photographer": label,
                "has_exif": has_exif and ts is not None,
                "timestamp": ts.isoformat() if ts else None,
                "embed_index": embed_index,
            }
            catalog.append(catalog_entry)
            embed_index += 1

            if embed_index % 50 == 0:
                print(f"  Processed {embed_index} photos so far...")

    # Write catalog.json
    catalog_path = output_dir / "catalog.json"
    with catalog_path.open("w", encoding="utf-8") as fh:
        json.dump(catalog, fh, indent=2, ensure_ascii=False)

    # Summary
    total = len(catalog)
    print(f"\nIngest complete: {total} photo(s) cataloged → {catalog_path}")
    per_photographer: dict[str, int] = {}
    for entry in catalog:
        per_photographer[entry["photographer"]] = (
            per_photographer.get(entry["photographer"], 0) + 1
        )
    for photographer, count in sorted(per_photographer.items()):
        print(f"  {photographer}: {count} photo(s)")


if __name__ == "__main__":
    main()
