"""pipeline/acquire_google.py

Download photos from all Google Photos shared albums defined in pipeline/config.yaml.

Usage:
    uv run python pipeline/acquire_google.py

Before running:
    Replace every PLACEHOLDER album_url in pipeline/config.yaml with a real
    Google Photos shared album link for that photographer.

Dependencies:
    gallery-dl  (handles Google Photos shared album downloads)
    pyyaml      (config parsing)
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import yaml


# Resolve paths relative to this script so the script works from any cwd.
_SCRIPT_DIR = Path(__file__).resolve().parent
_CONFIG_PATH = _SCRIPT_DIR / "config.yaml"
_PROJECT_ROOT = _SCRIPT_DIR.parent


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


def _count_images(directory: Path) -> int:
    """Return the number of image files in *directory* (non-recursive)."""
    image_files = list(directory.glob("*.[jJpPgG][pPeEnNiI][gGfFfF]*"))
    return len(image_files)


def main() -> None:
    config = _load_config()

    albums: list[dict] = config.get("sources", {}).get("google_photos", [])
    if not albums:
        print("Error: no entries found under sources.google_photos in config.yaml", file=sys.stderr)
        sys.exit(1)

    # --- Validate that all album_url values have been filled in ---
    placeholder_found = False
    for entry in albums:
        label: str = entry.get("label", "<unknown>")
        album_url: str = entry.get("album_url", "")
        if "PLACEHOLDER" in album_url:
            print(
                f"Error: album_url for '{label}' still contains PLACEHOLDER. "
                f"Replace it with a real Google Photos shared album URL in "
                f"pipeline/config.yaml (key: sources.google_photos[{label}].album_url).",
                file=sys.stderr,
            )
            placeholder_found = True

    if placeholder_found:
        print(
            "\nAborted: update all PLACEHOLDER album_url values in pipeline/config.yaml "
            "before running this script.",
            file=sys.stderr,
        )
        sys.exit(1)

    # --- Download each album ---
    processed: list[tuple[str, Path]] = []
    for entry in albums:
        label: str = entry["label"]
        album_url: str = entry["album_url"]
        output_dir: Path = _resolve_output_dir(entry["output_dir"])

        print(f"Downloading album for {label} → {output_dir} ...")
        output_dir.mkdir(parents=True, exist_ok=True)

        result = subprocess.run(
            [
                "gallery-dl",
                "--dest", str(output_dir),
                "--filename", "{filename}",
                album_url,
            ],
            stderr=subprocess.PIPE,
        )

        if result.returncode != 0:
            stderr_text = result.stderr.decode(errors="replace")
            print(
                f"Error: gallery-dl failed for album '{label}' (exit code {result.returncode}).",
                file=sys.stderr,
            )
            print(f"gallery-dl stderr:\n{stderr_text}", file=sys.stderr)
            sys.exit(1)

        processed.append((label, output_dir))
        print(f"  Done: {label}")

    # --- Summary ---
    print(f"\nSummary: {len(processed)} album(s) downloaded.")
    for label, output_dir in processed:
        count = _count_images(output_dir)
        print(f"  {label}: {count} image file(s) in {output_dir}")


if __name__ == "__main__":
    main()
