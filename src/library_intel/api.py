"""FastAPI service exposing the clustering + retrieval model.

This is the production-shaped serving surface. It loads the persisted artifacts
once at startup and answers three things:

* GET /health            — liveness + what's loaded
* GET /metrics           — model + data metrics
* GET /search?q=...      — semantic free-text retrieval (RAG retriever)
* GET /similar/{book_id} — item-to-item retrieval

Run locally:  uvicorn library_intel.api:app --reload
"""
from __future__ import annotations

import json
import logging

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import config, embeddings
from .search import VectorIndex

log = logging.getLogger(__name__)
app = FastAPI(title="Library Circulation Intelligence", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_STATE: dict = {}


@app.on_event("startup")
def _load() -> None:
    art = config.ARTIFACTS_DIR
    try:
        catalog = pd.read_parquet(art / "catalog.parquet")
        vectors = np.load(art / "catalog_vectors.npy")
        encoder = embeddings.get_encoder()
        # Re-fit the encoder on the same docs so query vectors share the space.
        from .embeddings import book_document

        docs = [book_document(r.title, r.creator, r.subjects) for r in catalog.itertuples()]
        encoder.fit(docs)
        _STATE["index"] = VectorIndex(encoder, vectors, catalog)
        with open(art / "metrics.json", encoding="utf-8") as f:
            _STATE["metrics"] = json.load(f)
        log.info("Loaded %d catalogue vectors", len(catalog))
    except FileNotFoundError:
        log.warning("Artifacts not found — run `python -m library_intel.pipeline` first")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "index_loaded": "index" in _STATE}


@app.get("/metrics")
def metrics() -> dict:
    if "metrics" not in _STATE:
        raise HTTPException(503, "metrics not loaded")
    return _STATE["metrics"]


@app.get("/search")
def search(q: str = Query(..., min_length=1), k: int = 10) -> dict:
    if "index" not in _STATE:
        raise HTTPException(503, "index not loaded")
    hits = _STATE["index"].search(q, k=k)
    return {"query": q, "results": [h.__dict__ for h in hits]}


@app.get("/similar/{book_id}")
def similar(book_id: int, k: int = 10) -> dict:
    if "index" not in _STATE:
        raise HTTPException(503, "index not loaded")
    index = _STATE["index"]
    if not 0 <= book_id < len(index.meta):
        raise HTTPException(404, "book_id out of range")
    hits = index.similar(book_id, k=k)
    seed = index.meta.iloc[book_id]
    return {
        "book": {"book_id": book_id, "title": str(seed["title"]), "creator": str(seed["creator"])},
        "results": [h.__dict__ for h in hits],
    }
