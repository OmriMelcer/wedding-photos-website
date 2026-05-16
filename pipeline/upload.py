"""pipeline/upload.py

Upload compressed photos, thumbnails, and metadata.json to Cloudflare R2.
Reads config from pipeline/config.yaml; credentials from env vars.

Steps:
  1. Validate inputs (metadata.json, photos/, thumbs/)
  2. Mutate r2_url / thumb_url fields in metadata.json in-place
  3. Write updated metadata.json to disk
  4. Upload photos + thumbs concurrently (ThreadPoolExecutor, 16 workers)
  5. Upload metadata.json last (sequential, with ContentType header)

Usage:
    R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... uv run python pipeline/upload.py

Dependencies:
    boto3   (S3-compatible upload client)
    pyyaml  (config parsing)
"""
from __future__ import annotations

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
import yaml


# Resolve paths relative to this script so the script works from any cwd.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"
_PROJECT_ROOT = _SCRIPT_DIR.parent
_METADATA_PATH = _PROJECT_ROOT / "pipeline" / "output" / "metadata.json"
_PHOTOS_DIR    = _PROJECT_ROOT / "pipeline" / "output" / "photos"
_THUMBS_DIR    = _PROJECT_ROOT / "pipeline" / "output" / "thumbs"

MAX_WORKERS = 16


def _load_config() -> dict:
    """Load and return the parsed pipeline/config.yaml."""
    if not _CONFIG_PATH.exists():
        print(f"Error: config file not found at {_CONFIG_PATH}", file=sys.stderr)
        sys.exit(1)
    with _CONFIG_PATH.open() as fh:
        return yaml.safe_load(fh)


def _make_s3_client(config: dict):
    """Build and return a boto3 S3 client configured for Cloudflare R2.

    Reads R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY from environment variables.
    Exits with code 1 if either variable is missing.
    """
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")

    if not access_key:
        print(
            "Error: R2_ACCESS_KEY_ID environment variable is not set.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not secret_key:
        print(
            "Error: R2_SECRET_ACCESS_KEY environment variable is not set.",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        return boto3.client(
            "s3",
            endpoint_url=config["r2"]["endpoint"],
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="auto",
        )
    except ValueError as exc:
        print(
            f"Error: could not create R2 client — {exc}\n"
            "Check that pipeline/config.yaml r2.endpoint is set to your real account URL.",
            file=sys.stderr,
        )
        sys.exit(1)


def _upload_file(s3, bucket: str, local_path: Path, key: str) -> None:
    """Upload a single file to R2.

    No retry logic — one-shot pipeline philosophy. Exceptions propagate to caller.
    """
    s3.upload_file(str(local_path), bucket, key)


def main() -> None:
    # 1. Verify metadata.json exists
    if not _METADATA_PATH.exists():
        print(
            f"Error: {_METADATA_PATH} not found — run pipeline/cluster.py and "
            "pipeline/resize.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 2. Verify photos directory is non-empty
    if not _PHOTOS_DIR.exists() or not list(_PHOTOS_DIR.glob("*.jpg")):
        print(
            f"Error: {_PHOTOS_DIR} is missing or contains no .jpg files — "
            "run pipeline/resize.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 3. Verify thumbs directory is non-empty
    if not _THUMBS_DIR.exists() or not list(_THUMBS_DIR.glob("*.jpg")):
        print(
            f"Error: {_THUMBS_DIR} is missing or contains no .jpg files — "
            "run pipeline/resize.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 4. Load config
    config = _load_config()
    bucket = config["r2"]["bucket"]
    r2_public_url = config["r2"]["r2_public_url"].rstrip("/")

    # 5. Build S3 client (credentials from env vars)
    s3 = _make_s3_client(config)

    # 6. Load metadata.json
    with _METADATA_PATH.open(encoding="utf-8") as fh:
        metadata = json.load(fh)
    photos = metadata.get("photos", [])

    # 7. Mutate r2_url / thumb_url in-place; apply security guard
    skipped: list[str] = []
    safe_photos: list[dict] = []

    for photo in photos:
        filename: str = photo["filename"]

        # Security guard: reject filenames with path-traversal characters
        if "/" in filename or ".." in filename:
            print(
                f"Warning: skipping photo {photo['id']!r} — filename {filename!r} "
                "contains path-traversal characters.",
                file=sys.stderr,
            )
            skipped.append(photo["id"])
            continue

        # Construct public URLs using photo id (resize.py writes {id}.jpg)
        photo["r2_url"]    = f"{r2_public_url}/photos/{photo['id']}.jpg"
        photo["thumb_url"] = f"{r2_public_url}/thumbs/{photo['id']}.jpg"
        # All other fields (cluster, cluster_confidence, sort_key, etc.) are preserved.
        safe_photos.append(photo)

    # 8. Write updated metadata.json back to disk
    with _METADATA_PATH.open("w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2, ensure_ascii=False)
    print(f"Updated r2_url / thumb_url in {_METADATA_PATH} ({len(safe_photos)} photos)")

    # 9. Upload photos + thumbs concurrently
    futures = {}
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for photo in safe_photos:
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
            futures[photo_future] = f"photos/{photo['id']}.jpg"
            futures[thumb_future] = f"thumbs/{photo['id']}.jpg"

        n_completed = 0
        for future in as_completed(futures):
            # Propagate exceptions — do not swallow failures silently.
            future.result()
            n_completed += 1
            if n_completed % 100 == 0:
                print(f"  Uploaded {n_completed}/{len(futures)} files...")

    n_photos = len(safe_photos)
    n_thumbs = len(safe_photos)

    # 10. Upload metadata.json last (sequential, after all image futures complete)
    print("Uploading metadata.json...")
    s3.upload_file(
        str(_METADATA_PATH),
        bucket,
        "metadata.json",
        ExtraArgs={"ContentType": "application/json"},
    )

    # 11. Summary
    print(
        f"\nUpload complete:\n"
        f"  Photos uploaded:     {n_photos}\n"
        f"  Thumbs uploaded:     {n_thumbs}\n"
        f"  metadata.json:       uploaded\n"
        f"  Skipped (security):  {len(skipped)}"
    )
    if skipped:
        print(f"  Skipped IDs: {', '.join(skipped)}", file=sys.stderr)


if __name__ == "__main__":
    main()
