"""pipeline/embed.py

Compute CLIP ViT-B/32 embeddings for all photos in pipeline/output/catalog.json.
Writes pipeline/output/embeddings.npy (N×512 float32, L2-normalized).

Usage:
    uv run python pipeline/embed.py

Dependencies:
    open-clip-torch  (CLIP model + preprocessing)
    torch            (inference)
    numpy            (array save)
    pillow           (image open + downscale + blur)
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import open_clip
import torch
import yaml
from PIL import Image, ImageFilter


# Resolve paths relative to this script so the script works from any cwd.
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
_CATALOG_PATH = _PROJECT_ROOT / "pipeline" / "output" / "catalog.json"
_EMBEDDINGS_PATH = _PROJECT_ROOT / "pipeline" / "output" / "embeddings.npy"


def load_clip_model() -> tuple:
    """Load CLIP ViT-B/32 model and preprocessing transforms.

    First call downloads ~350MB weights to ~/.cache/huggingface/hub/.
    Returns (model, preprocess) — model is set to eval mode.
    """
    # CLAUDE.md: no module-level singletons — only create model inside this function.
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
    model.eval()
    return model, preprocess


def embed_image(img_path: Path, model, preprocess, device: str = "cpu") -> np.ndarray:
    """Compute normalized 512-dim CLIP embedding for a single image.

    Steps:
        1. Open and convert to RGB.
        2. Pre-downscale to 512×512 max (speeds preprocessing on large JPEGs).
        3. Apply mild GaussianBlur to reduce noise in film scans.
        4. Run CLIP preprocessing and encode via model.encode_image.
        5. L2-normalize and return as float32 ndarray of shape (512,).
    """
    img = Image.open(img_path).convert("RGB")
    # Pre-downscale before CLIP preprocessing — speeds up preprocess on large JPEGs.
    img.thumbnail((512, 512), Image.Resampling.LANCZOS)
    # Reduce noise in film scans.
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    tensor = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        features = model.encode_image(tensor)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()[0].astype(np.float32)


def main() -> None:
    # 1. Verify catalog exists
    if not _CATALOG_PATH.exists():
        print(
            f"Error: {_CATALOG_PATH} not found — run pipeline/ingest.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 2. Load catalog
    with _CATALOG_PATH.open() as fh:
        catalog = json.load(fh)

    if not catalog:
        print("Error: catalog.json is empty — nothing to embed.", file=sys.stderr)
        sys.exit(1)

    # 3. Determine device
    device = os.environ.get("EMBED_DEVICE", "cpu")

    # 4. Load model
    print("Loading CLIP ViT-B/32 ... (first run downloads ~350MB to ~/.cache/huggingface/hub/)")
    model, preprocess = load_clip_model()

    # 5. Pre-allocate embedding matrix
    n = len(catalog)
    embeddings = np.zeros((n, 512), dtype=np.float32)

    # 6. Embed each photo in catalog order
    failed = 0
    for i, entry in enumerate(catalog):
        assert entry["embed_index"] == i, (
            f"embed_index mismatch at position {i}: expected {i}, got {entry['embed_index']}"
        )
        src = _PROJECT_ROOT / entry["source_path"]
        try:
            vec = embed_image(src, model, preprocess, device=device)
            embeddings[i] = vec
        except Exception as exc:
            print(
                f"Warning: failed to embed {entry['id']}: {exc}",
                file=sys.stderr,
            )
            failed += 1
            continue

        if (i + 1) % 25 == 0:
            print(f"  Embedded {i+1}/{n}: {entry['id']}")

    # 7. Save embeddings.npy
    _EMBEDDINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.save(_EMBEDDINGS_PATH, embeddings)

    # 8. Summary
    zero_rows = int((embeddings == 0).all(axis=1).sum())
    print(f"\nEmbed complete: shape={embeddings.shape} dtype={embeddings.dtype}")
    print(f"  Saved → {_EMBEDDINGS_PATH}")
    if zero_rows:
        print(
            f"  Warning: {zero_rows} zero-vector row(s) (failed embeds) in output.",
            file=sys.stderr,
        )
    else:
        print(f"  All {n} embeddings are non-zero.")


if __name__ == "__main__":
    main()
