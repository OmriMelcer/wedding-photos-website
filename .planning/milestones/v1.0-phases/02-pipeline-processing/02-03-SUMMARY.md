---
phase: "02"
plan: "03"
subsystem: pipeline
tags: [clip, embeddings, open-clip, torch, numpy]
dependency_graph:
  requires: [02-02]
  provides: [pipeline/output/embeddings.npy]
  affects: [02-04-cluster]
tech_stack:
  added: [open-clip-torch, torch, Pillow.ImageFilter.GaussianBlur]
  patterns: [CLIP ViT-B/32 L2-normalized embeddings, CPU-only batch inference, pre-downscale thumbnail before preprocess]
key_files:
  created: []
  modified:
    - pipeline/embed.py
decisions:
  - "Pre-downscale to 512×512 with LANCZOS before CLIP preprocessing reduces CPU time on large JPEGs"
  - "GaussianBlur(radius=1) applied after thumbnail to reduce film scan noise before embedding"
  - "No module-level model singleton (CLAUDE.md constraint); model created only inside load_clip_model()"
  - "EMBED_DEVICE env var allows future GPU override without code changes"
metrics:
  duration: "~3 minutes 20 seconds (wall-clock, CPU-only, 1327 photos)"
  completed: "2026-05-16"
---

# Phase 02 Plan 03: CLIP Embeddings Summary

Implemented `pipeline/embed.py` — Stage 2 of the pipeline. Computes CLIP ViT-B/32 L2-normalized embeddings for every photo in `catalog.json` and saves the result to `pipeline/output/embeddings.npy` (N×512 float32).

## Outcome

- **embeddings.npy shape:** (1327, 512) float32
- **Wall-clock time:** ~3 minutes 20 seconds (CPU-only, M-series Mac)
- **Failed embeds (zero-vector rows):** 0 — all 1327 photos embedded successfully
- **Catalog row order match:** confirmed — `embed_index` assertion in main() verifies each catalog row's `embed_index == i` before embedding
- **L2-norm validation:** all 1327 vectors have `|norm - 1.0| < 1e-3`

## What Was Built

`pipeline/embed.py` now provides:

- `load_clip_model()` — loads ViT-B/32 (openai pretrained) via `open_clip.create_model_and_transforms`, sets eval mode, returns `(model, preprocess)`. First call downloads ~350MB to `~/.cache/huggingface/hub/`.
- `embed_image(img_path, model, preprocess, device="cpu")` — opens image, pre-downscales to 512×512 max (LANCZOS), applies `GaussianBlur(radius=1)`, runs CLIP preprocessing, encodes with `torch.no_grad()`, L2-normalizes, returns `float32` ndarray of shape (512,).
- `main()` — reads `pipeline/output/catalog.json`, pre-allocates `(N, 512)` zero matrix, iterates in catalog order with `embed_index` assertion, catches per-image exceptions without aborting, saves to `pipeline/output/embeddings.npy`, prints shape/dtype/zero-row summary.

## Verification Passed

```
uv run pytest pipeline/tests/test_embed.py -v
# 1 passed
```

```python
e.shape == (1327, 512)
e.dtype == float32
all(|norm - 1.0| < 1e-3)  # for all non-zero rows
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `pipeline/embed.py` exists and is fully implemented
- `pipeline/output/embeddings.npy` produced (not committed — covered by .gitignore via `pipeline/output/`)
- Unit test `test_embedding_shape_normalized` passes
- Post-embed validation assertion script passes
