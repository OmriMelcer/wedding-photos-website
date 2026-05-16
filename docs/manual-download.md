# Manual Photo Download Guide

## When to Use This Guide

Use this guide when `uv run python pipeline/acquire_google.py` or `uv run python pipeline/acquire_pictime.py` fails and you need to download photos manually to continue the pipeline. The automated scripts use `gallery-dl` to download photos; if gallery-dl cannot handle a particular source or encounters an authentication issue, the steps below produce the same folder structure as the scripts — so all subsequent pipeline stages (ingest, embed, cluster, resize, upload) will run identically.

## Source Folder Structure

The pipeline expects photos to be in these folders at the project root:

| Folder | Contents |
|---|---|
| `sources/photographer_a/` | Google Photos album 1 — Photographer A |
| `sources/photographer_b/` | Google Photos album 2 — Photographer B |
| `sources/photographer_c/` | Google Photos album 3 — Photographer C (film scans) |
| `sources/pic_time/` | pic-time gallery photos |

These folder names are read by subsequent pipeline steps via `pipeline/config.yaml`. Do not rename them — renaming will cause `pipeline/ingest.py` and downstream scripts to fail silently or exit with an error.

## Google Photos Manual Download

The `album_url` values for each photographer are defined in `pipeline/config.yaml` under `sources.google_photos`. Each entry has a `label` (e.g., `photographer_a`) and an `album_url` field. Replace the `PLACEHOLDER` values with real Google Photos shared album URLs before following these steps.

### Steps for each album

1. Open the album URL from `pipeline/config.yaml` (`sources.google_photos[*].album_url`) in a browser. You do not need a Google account if the album is shared with "Anyone with the link".

2. Select all photos in the album. Click the first photo thumbnail, then Shift+click the last thumbnail. On some album views a "Select all" button appears in the top toolbar — use it if available.

3. Click the download button (the cloud icon with a downward arrow, usually in the top-right toolbar) to download a ZIP file containing all selected photos.

4. Extract the ZIP contents into the correct `sources/` folder, matching album to label per `pipeline/config.yaml`:
   - Photographer A album → extract into `sources/photographer_a/`
   - Photographer B album → extract into `sources/photographer_b/`
   - Photographer C album → extract into `sources/photographer_c/`

5. Verify that each folder contains `.jpg` or `.JPG` files directly at the folder root (not nested in subfolders). Google Photos sometimes creates date-based subfolders inside the ZIP. If that happens, move all `.jpg` files up to the folder root:

```bash
find sources/photographer_a -mindepth 2 -name "*.jpg" -exec mv {} sources/photographer_a/ \;
find sources/photographer_b -mindepth 2 -name "*.jpg" -exec mv {} sources/photographer_b/ \;
find sources/photographer_c -mindepth 2 -name "*.jpg" -exec mv {} sources/photographer_c/ \;
```

Repeat the download and extraction for each of the three photographer albums before continuing.

## pic-time Manual Download

The pic-time gallery URL is `https://justsmile.pic-time.com/gallery`. All photos should be downloaded into `sources/pic_time/`.

### Steps

1. Open `https://justsmile.pic-time.com/gallery` in a browser.

2. Look for a "Download all" or bulk download button in the gallery toolbar (usually in the top-right area of the page). pic-time galleries typically include a bulk download option that packages all photos into a ZIP.

3. Download the ZIP and extract all images into `sources/pic_time/`.

4. If no bulk download button is available, note the total image count shown on the gallery page, then download individual photos:
   - Right-click each image and choose "Save image as..."
   - Save each file to `sources/pic_time/`
   - Compare the number of saved files against the gallery count to verify completeness

### Alternative: wget from browser DevTools

If the gallery renders images dynamically (loaded via JavaScript), you can capture the direct image URLs using browser DevTools:

1. Open browser DevTools (F12), go to the Network tab, and filter by image type (`Img` or `Media`).
2. Reload the gallery page and scroll through all photos to trigger image loads.
3. Copy each image URL and download with `wget`:

```bash
wget -P sources/pic_time/ <image_url>
```

Repeat for each image URL visible in the Network tab. The URL list will reflect the actual number of photos loaded by the gallery.

## Verification After Manual Download

Run the following commands from the project root to confirm the folder contents are populated and the pipeline can proceed:

```bash
find sources/ -name "*.jpg" -o -name "*.JPG" | wc -l
# Expected: total count across all folders should match the number of photos from all sources

ls sources/photographer_a/ | wc -l
ls sources/photographer_b/ | wc -l
ls sources/photographer_c/ | wc -l
ls sources/pic_time/ | wc -l
```

Each folder count should match the number of photos in the corresponding album or gallery. If any count is zero, the download for that source did not complete — repeat the steps for that source before continuing.

Once photos are in the correct folders, the rest of the pipeline (Phase 2 onwards — `ingest.py`, `embed.py`, `cluster.py`, `resize.py`, `upload.py`) runs identically whether photos were downloaded automatically or manually.
