"""
Download all photos from the pic-time gallery to sources/pic_time/.

gallery-dl discovers the pic-time gallery structure automatically from the URL;
no cookies or authentication are needed for open-access galleries.

Usage:
    uv run python pipeline/acquire_pictime.py [--fallback]

Options:
    --fallback   Use requests+BeautifulSoup fallback instead of gallery-dl.
                 The fallback is also triggered automatically when gallery-dl
                 produces zero downloaded files.
"""

import sys
import subprocess
from pathlib import Path

PICTIME_URL = "https://justsmile.pic-time.com/gallery"
OUTPUT_DIR = Path(__file__).parent.parent / "sources" / "pic_time"

# Glob pattern that matches common image extensions (jpg, jpeg, png, gif)
IMAGE_GLOB = "*.[jJpPgG][pPeEnNiI][gGfFfF]*"


def count_images(directory: Path) -> int:
    """Return the number of image files in *directory*."""
    return len(list(directory.glob(IMAGE_GLOB)))


def download_with_gallery_dl() -> bool:
    """
    Invoke gallery-dl to download all photos from PICTIME_URL into OUTPUT_DIR.

    Returns True if gallery-dl ran successfully AND produced at least one file.
    Returns False if gallery-dl fails or produces zero files (triggers fallback).
    """
    result = subprocess.run(
        [
            "gallery-dl",
            "--dest",
            str(OUTPUT_DIR),
            "--filename",
            "{filename}",
            PICTIME_URL,
        ],
        stderr=subprocess.PIPE,
    )

    if result.returncode != 0:
        print(
            f"gallery-dl exited with code {result.returncode}:\n"
            f"{result.stderr.decode(errors='replace')}",
            file=sys.stderr,
        )
        return False

    return count_images(OUTPUT_DIR) > 0


def download_with_fallback() -> None:
    """
    Fallback downloader using requests + BeautifulSoup.

    Fetches the gallery HTML page, parses all <img> src attributes that
    reference pic-time.com, and downloads each image into OUTPUT_DIR.
    """
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        print(
            "Fallback requires 'requests' and 'beautifulsoup4'. "
            "Install them with: uv add requests beautifulsoup4",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Using requests+BeautifulSoup fallback to download from pic-time...")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; wedding-album-downloader/1.0)"
        )
    }

    response = requests.get(PICTIME_URL, headers=headers, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Collect all image URLs from src and data-src attributes that belong to pic-time
    img_urls: list[str] = []
    for tag in soup.find_all("img"):
        for attr in ("src", "data-src", "data-original"):
            url = tag.get(attr, "")
            if url and "pic-time.com" in url:
                if not url.startswith("http"):
                    url = "https:" + url if url.startswith("//") else PICTIME_URL + "/" + url
                img_urls.append(url)

    if not img_urls:
        print(
            "Fallback: no pic-time.com image URLs found on the gallery page. "
            "The gallery may require JavaScript rendering.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Fallback: found {len(img_urls)} image URLs. Downloading...")

    for i, url in enumerate(img_urls, start=1):
        filename = url.split("/")[-1].split("?")[0] or f"photo_{i:04d}.jpg"
        dest = OUTPUT_DIR / filename
        if dest.exists():
            continue
        img_response = requests.get(url, headers=headers, timeout=60)
        img_response.raise_for_status()
        dest.write_bytes(img_response.content)
        if i % 50 == 0:
            print(f"  Downloaded {i}/{len(img_urls)}...")

    print(f"Fallback download complete: {count_images(OUTPUT_DIR)} images in {OUTPUT_DIR}")


def main(use_fallback: bool = False) -> None:
    """Main entry point for the pic-time gallery downloader."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if use_fallback:
        download_with_fallback()
        return

    # Try gallery-dl first; fall back automatically if it produces zero files
    success = download_with_gallery_dl()
    if not success:
        print(
            "gallery-dl produced no files; switching to requests+BeautifulSoup fallback...",
            file=sys.stderr,
        )
        download_with_fallback()
        return

    count = count_images(OUTPUT_DIR)
    print(f"pic-time download complete: {count} images in {OUTPUT_DIR}")


if __name__ == "__main__":
    use_fallback = "--fallback" in sys.argv
    main(use_fallback=use_fallback)
