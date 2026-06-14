"""Text embeddings for semantic retrieval over the catalogue.

Two interchangeable backends behind one interface:

* ``DenseEncoder``  — sentence-transformers (all-MiniLM-L6-v2). Real dense
  embeddings, used automatically when torch + sentence-transformers import.
* ``LsaEncoder``    — TF-IDF + TruncatedSVD. Pure scikit-learn, deterministic,
  no heavy deps. Used for CI and the committed web artifacts so anyone can
  reproduce them on a laptop with no GPU.

``get_encoder()`` returns the best available backend. Both expose ``fit`` and
``encode`` and produce L2-normalized vectors, so cosine similarity is a dot
product.
"""
from __future__ import annotations

import logging
from typing import Protocol

import numpy as np

from . import config

log = logging.getLogger(__name__)


def book_document(title: str, creator: str, subjects: str) -> str:
    """The text we embed for each catalogue item."""
    parts = [str(title)]
    if creator and str(creator).lower() != "unknown":
        parts.append(f"by {creator}")
    if subjects:
        parts.append(str(subjects))
    return ". ".join(parts)


def _l2_normalize(X: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return X / norms


class Encoder(Protocol):
    name: str
    dim: int

    def fit(self, docs: list[str]) -> Encoder: ...
    def encode(self, docs: list[str]) -> np.ndarray: ...


class LsaEncoder:
    """Deterministic TF-IDF + LSA encoder (scikit-learn only)."""

    def __init__(self, dim: int = config.LSA_DIM, seed: int = config.RANDOM_SEED):
        from sklearn.decomposition import TruncatedSVD
        from sklearn.feature_extraction.text import TfidfVectorizer

        self.name = "tfidf-lsa"
        self.dim = dim
        self._tfidf = TfidfVectorizer(
            lowercase=True, stop_words="english", ngram_range=(1, 2), min_df=2, max_features=40_000
        )
        self._svd = TruncatedSVD(n_components=dim, random_state=seed)
        self._fitted = False

    def fit(self, docs: list[str]) -> LsaEncoder:
        tf = self._tfidf.fit_transform(docs)
        max_dim = min(self.dim, tf.shape[1] - 1) if tf.shape[1] > 1 else 1
        if max_dim != self.dim:
            from sklearn.decomposition import TruncatedSVD

            self._svd = TruncatedSVD(n_components=max_dim, random_state=config.RANDOM_SEED)
            self.dim = max_dim
        self._svd.fit(tf)
        self._fitted = True
        log.info("LsaEncoder fitted: dim=%d, vocab=%d", self.dim, tf.shape[1])
        return self

    def encode(self, docs: list[str]) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("LsaEncoder.encode called before fit")
        tf = self._tfidf.transform(docs)
        return _l2_normalize(self._svd.transform(tf).astype(np.float32))


class DenseEncoder:
    """sentence-transformers backend (real dense embeddings)."""

    def __init__(self, model_name: str = config.DENSE_MODEL_NAME):
        from sentence_transformers import SentenceTransformer

        self.name = model_name
        self._model = SentenceTransformer(model_name)
        self.dim = int(self._model.get_sentence_embedding_dimension())

    def fit(self, docs: list[str]) -> DenseEncoder:
        return self  # pretrained — nothing to fit

    def encode(self, docs: list[str]) -> np.ndarray:
        X = self._model.encode(
            docs, batch_size=64, show_progress_bar=False, convert_to_numpy=True
        )
        return _l2_normalize(X.astype(np.float32))


def get_encoder(prefer_dense: bool = True) -> Encoder:
    """Return the best available encoder."""
    if prefer_dense:
        try:
            enc = DenseEncoder()
            log.info("Using dense encoder: %s (dim=%d)", enc.name, enc.dim)
            return enc
        except Exception as exc:  # pragma: no cover - depends on environment
            log.info("Dense encoder unavailable (%s); using TF-IDF+LSA fallback", exc)
    return LsaEncoder()
