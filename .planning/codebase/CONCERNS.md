# Codebase Concerns

**Analysis Date:** 2026-05-16

---

> **Context:** The repository is in a pre-implementation state. No pipeline code or React site exists yet. All concerns below are either (a) risks surfaced by the spec that must be addressed during implementation, or (b) structural gaps between the current repo state and the planned structure. There is no existing code to audit for bugs or runtime errors.

---

## Tech Debt

**Stub entry point masquerading as a real module:**
- Issue: `main.py` contains only `print("Hello from wedding-photos-website!")` with no actual logic. The planned pipeline lives in `pipeline/` subdirectories that do not yet exist.
- Files: `main.py`
- Impact: Running `uv run python main.py` gives a false sense of progress; nothing in the planned pipeline (`pipeline/ingest.py`, `pipeline/embed.py`, etc.) is wired up.
- Fix approach: Either delete `main.py` or convert it into a CLI entrypoint that delegates to the pipeline stage modules.

**`pyproject.toml` has no dependencies declared:**
- Issue: `pyproject.toml` lists `dependencies = []` and has no description. The pipeline requires at minimum `open-clip` (or `clip`), `Pillow`, `scikit-learn`, `boto3`/`cloudflare`/`rclone`-compatible S3 client, and a YAML parser.
- Files: `pyproject.toml`
- Impact: Any developer (or future-Omri) who clones the repo and runs `uv sync` gets an empty environment and a silent failure when any import is attempted.
- Fix approach: Populate dependencies when each pipeline module is written. Pin versions to avoid silent breakage on CPU-only CLIP installs.

**No `pipeline/config.yaml` exists:**
- Issue: The spec requires `pipeline/config.yaml` to hold event time windows and photographer label names. These are unresolved open questions as of the spec (`wedding_album_spec.md` lines 191–194).
- Files: `wedding_album_spec.md`
- Impact: `pipeline/cluster.py` cannot be written or tested until time windows are collected from the user. This is the critical path blocker for the entire pipeline.
- Fix approach: Collect exact event timestamps before starting `cluster.py`. Document them in `pipeline/config.yaml` with inline comments so they are reproducible.

**Planned directory structure does not exist:**
- Issue: `pipeline/` and `site/` directories are absent. The repo contains only root-level files.
- Files: (none yet — `pipeline/ingest.py`, `pipeline/embed.py`, `pipeline/cluster.py`, `pipeline/resize.py`, `pipeline/upload.py`, `site/src/App.jsx`, etc. are all missing)
- Impact: All CLAUDE.md commands (`uv run python pipeline/ingest.py`, `cd site && npm run dev`) will fail with "No such file or directory".
- Fix approach: Follow the implementation order in `wedding_album_spec.md` lines 171–186 strictly, creating directories as each module is scaffolded.

---

## Security Considerations

**R2 credentials will be needed at pipeline run time:**
- Risk: `pipeline/upload.py` must authenticate to Cloudflare R2 via AWS-compatible S3 credentials. If credentials are stored in `pipeline/config.yaml` or any committed file, they will be leaked.
- Files: `pipeline/config.yaml` (planned), `pipeline/upload.py` (planned)
- Current mitigation: None — no code exists yet.
- Recommendations: Store R2 credentials exclusively in environment variables (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT_URL`). Ensure `pipeline/config.yaml` contains only non-secret config (time windows, bucket name, photographer labels). Add `*.env` and any credential file patterns to `.gitignore` before first commit of pipeline code.

**Public R2 bucket exposure:**
- Risk: The spec serves photos directly from R2 with no authentication. The R2 bucket must be configured as public-read. This means anyone with a URL can access full-resolution images — the site is intentionally public, but there is no access control.
- Files: `pipeline/upload.py` (planned), `pipeline/config.yaml` (planned)
- Current mitigation: The spec acknowledges the site is public. No guests-only access mechanism is planned.
- Recommendations: If wedding photos should be semi-private (shared link only), consider Cloudflare Access in front of the Pages site, or at minimum keep the R2 bucket URL out of public search indexes via `robots.txt` in the site's `public/` directory.

---

## Performance Bottlenecks

**`metadata.json` size is not enforced:**
- Problem: The spec says "keep `metadata.json` under 1MB" but there is no validation step in the pipeline.
- Files: `pipeline/upload.py` (planned)
- Cause: 1200 photos × a verbose schema (with future face embedding vectors) could easily exceed 1MB.
- Improvement path: Add a size check in `pipeline/upload.py` that aborts and prints a warning if `metadata.json` exceeds the budget. For Phase 2 face data, store face embedding vectors in a separate `faces.json` fetched lazily, rather than embedding them in the main manifest.

**CLIP embedding run time is unbounded:**
- Problem: `pipeline/embed.py` runs ViT-B/32 embeddings on up to 1200 photos CPU-only. On a slow machine this could take 30–60+ minutes.
- Files: `pipeline/embed.py` (planned)
- Cause: No caching or resumability is planned. If the process crashes mid-run, all embeddings must be recomputed.
- Improvement path: Write embeddings to a local `.npy` or `.pkl` cache keyed by filename+mtime. On re-run, skip photos whose cache entry is fresh.

---

## Fragile Areas

**EXIF-based cluster assignment depends on camera clock accuracy:**
- Files: `pipeline/cluster.py` (planned), `pipeline/ingest.py` (planned)
- Why fragile: Photographer cameras may have incorrect system clocks (wrong timezone, drifted time). A single photographer with an uncorrected clock will produce an entire batch of photos assigned to the wrong cluster.
- Safe modification: Add a per-photographer clock-offset correction field to `pipeline/config.yaml`. Apply the offset during EXIF extraction in `pipeline/ingest.py` before cluster assignment.
- Test coverage: No tests exist yet. A unit test comparing raw EXIF timestamps against expected clusters using known sample photos would catch this.

**KNN cluster assignment for film photos depends on EXIF-labeled photo quality:**
- Files: `pipeline/cluster.py` (planned), `pipeline/embed.py` (planned)
- Why fragile: The KNN centroid for each cluster is computed from EXIF-labeled digital photos. If a cluster has very few digital photos (e.g., `prep` was shot mostly on film), the centroid will be noisy and film photo assignments unreliable.
- Safe modification: Log the centroid quality (number of anchor photos per cluster) during `pipeline/cluster.py` and warn when any cluster has fewer than ~10 anchors. Plan a manual correction pass as described in the spec.
- Test coverage: None planned.

**Pipeline is explicitly one-shot and non-incremental:**
- Files: All `pipeline/` modules (planned)
- Why fragile: If a source photo folder changes (new photos added, filenames corrected) the entire pipeline must re-run. R2 upload will overwrite all images.
- Safe modification: This is an accepted design constraint per the spec. Document it clearly in `README.md`. Add a `--dry-run` flag to `pipeline/upload.py` so the upload step can be previewed before overwriting.

---

## Missing Critical Features

**No `.gitignore` for pipeline artifacts:**
- Problem: When the pipeline runs it will produce large binary outputs: compressed `.jpg` files, CLIP embedding cache files (`.npy`/`.pkl`), and potentially a local copy of `metadata.json`. None of these should be committed.
- Blocks: First commit of any pipeline code risks accidentally committing gigabytes of images or model cache files.
- Fix: Create `.gitignore` before writing any pipeline code. Entries needed: `*.npy`, `*.pkl`, `output/`, `dist/`, `node_modules/`, `.env*`, any R2 credential file.

**No error handling strategy for the pipeline:**
- Problem: The spec defines no error handling for pipeline failures (missing EXIF, unreadable images, R2 upload failures, malformed photographer folder names).
- Blocks: The pipeline will silently skip or crash on bad input without actionable output.
- Fix: Define a consistent logging approach (e.g., Python `logging` module, writing a `pipeline.log`) and explicit exit codes for each stage before writing stage modules.

**Open questions from the spec are unresolved:**
- Problem: Three blocking questions remain open in `wedding_album_spec.md` lines 191–194:
  1. Exact time windows for each event phase (needed before `pipeline/cluster.py` can be written)
  2. Format and location of the 4 photo sources (needed before `pipeline/ingest.py` can be written)
  3. Preferred photographer label names (needed before `pipeline/ingest.py` can be written)
- Blocks: Implementation cannot proceed past scaffolding until these are answered.
- Fix: Resolve with the user before starting any pipeline work.

---

## Test Coverage Gaps

**No tests of any kind exist:**
- What's not tested: All planned functionality — pipeline stages, metadata schema correctness, cluster assignment logic, React filtering, metadata.json size constraint.
- Files: Entire `pipeline/` and `site/src/` (planned)
- Risk: Silent cluster mislabeling, broken filter UI, oversized metadata.json, malformed R2 uploads — none would be caught automatically.
- Priority: High for `pipeline/cluster.py` (cluster assignment correctness is invisible without tests); Medium for site filtering logic; Low for `pipeline/resize.py` and `pipeline/upload.py` which are thin wrappers.

---

*Concerns audit: 2026-05-16*
