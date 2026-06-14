"""A tiny in-memory vector index: the retrieval core of the RAG pattern.

Cosine similarity over L2-normalized vectors == dot product. For catalogue
sizes here (thousands of titles) an exact NumPy matmul is faster and simpler
than an ANN library, and it keeps the artifact portable to the browser.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np
import pandas as pd

from .embeddings import Encoder, book_document

log = logging.getLogger(__name__)


@dataclass
class SearchResult:
    book_id: int
    title: str
    creator: str
    score: float


class VectorIndex:
    def __init__(self, encoder: Encoder, vectors: np.ndarray, meta: pd.DataFrame):
        self.encoder = encoder
        self.vectors = vectors.astype(np.float32)
        self.meta = meta.reset_index(drop=True)

    # -- construction --------------------------------------------------------
    @classmethod
    def build(cls, encoder: Encoder, catalog: pd.DataFrame) -> VectorIndex:
        docs = [
            book_document(r.title, r.creator, r.subjects)
            for r in catalog.itertuples()
        ]
        encoder.fit(docs)
        vectors = encoder.encode(docs)
        log.info("Built vector index: %d items x %d dims", *vectors.shape)
        return cls(encoder, vectors, catalog)

    # -- queries -------------------------------------------------------------
    def _top(self, query_vec: np.ndarray, k: int, skip: int | None = None) -> list[SearchResult]:
        sims = self.vectors @ query_vec
        order = np.argsort(-sims)
        out: list[SearchResult] = []
        for i in order:
            if skip is not None and i == skip:
                continue
            row = self.meta.iloc[int(i)]
            out.append(
                SearchResult(int(i), str(row["title"]), str(row["creator"]), round(float(sims[i]), 4))
            )
            if len(out) >= k:
                break
        return out

    def search(self, query: str, k: int = 10) -> list[SearchResult]:
        """Free-text semantic search: embed the query, return nearest titles."""
        qv = self.encoder.encode([query])[0]
        return self._top(qv, k)

    def similar(self, book_id: int, k: int = 10) -> list[SearchResult]:
        """Item-to-item retrieval: books most similar to a given title."""
        qv = self.vectors[book_id]
        return self._top(qv, k, skip=book_id)
