# Roadmap: Wedding Photo Album

## Overview

The project builds in three horizontal layers: first the Python pipeline that acquires, processes, and uploads photos; then the React site that displays and filters them; finally the infrastructure that hosts everything on Cloudflare. Each layer delivers a complete, independently verifiable capability before the next begins.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Photo Acquisition** - Automated download of all photo sources to local folders with manual fallback (completed 2026-05-16)
- [x] **Phase 2: Pipeline Processing** - EXIF extraction, photographer tagging, CLIP embeddings, event cluster assignment, confidence scoring, and resize (completed 2026-05-16)
- [x] **Phase 3: Pipeline Upload** - Compressed images and metadata.json pushed to Cloudflare R2 via config-driven upload script (completed 2026-05-16)
- [ ] **Phase 4: React Site** - Masonry gallery, lightbox, photographer/phase filters, Hebrew RTL UI, and face-filter gating
- [ ] **Phase 5: Infrastructure & Deployment** - R2 bucket public access, Cloudflare Pages deploy, end-to-end live site

## Phase Details

### Phase 1: Photo Acquisition

**Goal**: All wedding photos are downloaded to local folders, organized by source, ready for the pipeline
**Depends on**: Nothing (first phase)
**Requirements**: ACQN-01, ACQN-02, ACQN-03
**Success Criteria** (what must be TRUE):

  1. Running the acquisition script downloads all photos from all 3 Google Photos shared albums into source folders
  2. Running the acquisition script downloads all photos from the pic-time gallery into a source folder
  3. A documented manual download path exists and works when auto-download fails for either source
  4. Source folders are organized so the pipeline can identify which photos belong to which photographer

**Plans**: 3 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Config skeleton + Google Photos downloader (pipeline/config.yaml, pipeline/acquire_google.py)
- [x] 01-02-PLAN.md — pic-time gallery downloader (pipeline/acquire_pictime.py)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Manual download fallback documentation (docs/manual-download.md)

### Phase 2: Pipeline Processing

**Goal**: Every photo has a cluster assignment, confidence score, resized web image, and thumbnail — ready to upload
**Depends on**: Phase 1
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07
**Success Criteria** (what must be TRUE):

  1. Every digital photo has an EXIF timestamp normalized to GMT+02:00 and is assigned to one of the five event clusters (prep, photoshooting, dining, hupa, dancing) based on config.yaml time windows
  2. Every photo carries a photographer tag (A, B, or C) derived from its source folder via config.yaml
  3. Every film photo (no EXIF) is assigned a cluster via KNN on CLIP ViT-B/32 embeddings, with a cluster_confidence score
  4. Photos below the confidence threshold are flagged in a review list before upload proceeds
  5. Web-quality resized images and per-photo thumbnails exist on disk for all photos

**Plans**: 5 plans

Plans:
**Wave 1** *(test infrastructure + config + deps)*

- [x] 02-01-PLAN.md — Wave 0 foundation: install open-clip-torch/scikit-learn/pytest, scaffold pipeline/tests/, add events.time_windows to config.yaml, write RED test stubs for every PIPE-0X requirement

**Wave 2** *(blocked on Wave 1 — needs tests + config)*

- [x] 02-02-PLAN.md — pipeline/ingest.py: EXIF + photographer tagging → pipeline/output/catalog.json (PIPE-01, PIPE-02)

**Wave 3** *(blocked on Wave 2 — needs catalog.json)*

- [ ] 02-03-PLAN.md — pipeline/embed.py: CLIP ViT-B/32 embeddings for all photos → pipeline/output/embeddings.npy (PIPE-03)

**Wave 4** *(blocked on Wave 3 — needs catalog + embeddings)*

- [ ] 02-04-PLAN.md — pipeline/cluster.py: time-window + KNN assignment + confidence + low-conf review → metadata.json + low_confidence.txt (PIPE-04, PIPE-05, PIPE-06)

**Wave 5** *(blocked on Wave 4 — needs metadata.json)*

- [ ] 02-05-PLAN.md — pipeline/resize.py: web (≤2000px) + thumbnail (≤400px) JPEGs with EXIF orientation correction (PIPE-07)

### Phase 3: Pipeline Upload

**Goal**: All compressed photos, thumbnails, and a valid metadata.json are live on Cloudflare R2
**Depends on**: Phase 2
**Requirements**: UPLD-01, UPLD-02, UPLD-03
**Success Criteria** (what must be TRUE):

  1. Running the upload script pushes all compressed photos and thumbnails to the R2 bucket
  2. metadata.json is generated with correct schema (id, filename, r2_url, thumb_url, photographer, timestamp, cluster, cluster_confidence, faces, people) and uploaded to R2
  3. All R2 credentials, event time windows, photographer names, and confidence threshold are read from pipeline/config.yaml — no hard-coded values in upload scripts

**Plans**: 2 plans

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Add r2: block to config.yaml (bucket, endpoint, r2_public_url) and add boto3 to pyproject.toml (UPLD-03)

**Wave 2** *(blocked on Wave 1 — needs r2: config block and boto3)*

- [x] 03-02-PLAN.md — pipeline/upload.py: concurrent upload of photos/thumbs to R2, URL writeback into metadata.json, metadata.json upload (UPLD-01, UPLD-02)

### Phase 4: React Site

**Goal**: Guests can browse all wedding photos filtered by photographer and phase, with Hebrew RTL UI and a lightbox
**Depends on**: Phase 3
**Requirements**: GALL-01, GALL-02, GALL-03, GALL-04, FILT-01, FILT-02, FILT-03, FILT-04, DSGN-01, I18N-01, I18N-02, I18N-03
**Success Criteria** (what must be TRUE):

  1. Opening the site fetches metadata.json once; subsequent filter actions produce no network requests
  2. Photos appear in a responsive masonry grid grouped into labeled Hebrew-titled sections by wedding phase
  3. Clicking a photo opens a lightbox showing the full-resolution image with previous/next navigation through the current filtered set
  4. The filter bar lets guests multi-select any combination of photographers and wedding phases; a clear button resets to all photos
  5. All UI text, filter labels, and phase headings are in Hebrew with RTL layout; phase key-to-Hebrew mapping is a config entry, not hard-coded
  6. The face filter control is absent from the page when people.length === 0

**Plans**: TBD
**UI hint**: yes

### Phase 5: Infrastructure & Deployment

**Goal**: The site is live on Cloudflare Pages, served from R2, accessible to guests at a public URL
**Depends on**: Phase 4
**Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):

  1. The R2 bucket has CORS configured so the React site can fetch metadata.json and image URLs from any origin
  2. The Vite build runs clean and wrangler deploys the dist/ folder to Cloudflare Pages without errors
  3. A guest can open the public Cloudflare Pages URL in a browser, see the gallery load, and use all filters

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Photo Acquisition | 3/3 | Complete   | 2026-05-16 |
| 2. Pipeline Processing | 2/5 | In Progress|  |
| 3. Pipeline Upload | 2/2 | Complete   | 2026-05-16 |
| 4. React Site | 0/TBD | Not started | - |
| 5. Infrastructure & Deployment | 0/TBD | Not started | - |
