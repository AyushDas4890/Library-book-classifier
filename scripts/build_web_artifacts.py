"""Turn pipeline artifacts into compact JSON the Next.js app ships statically.

The live web demo must run with no backend and no API key, so we build a
dedicated TF-IDF + LSA index over the catalogue here and export a small token
encoder. That lets the browser embed a free-text query and do real cosine
retrieval client-side. (The FastAPI service uses MiniLM dense embeddings for
the production retrieval surface; see src/library_intel/api.py.)

Outputs to web/public/data/:
  metrics.json   headline numbers + k-selection trace + cluster profiles
  catalog.json   per-title metadata + 2-D coords + cluster id
  vectors.json   quantized catalogue embedding matrix (int8)
  encoder.json   quantized per-token LSA vectors -> embed queries in-browser
"""
from __future__ import annotations

import json
import logging

import numpy as np
import pandas as pd

from library_intel import config
from library_intel.embeddings import LsaEncoder, book_document

log = logging.getLogger(__name__)
WEB_LSA_DIM = 200
MAX_VOCAB_EXPORT = 6000


def _quantize(mat: np.ndarray, scale: float = 127.0):
    q = np.clip(np.round(mat * scale), -127, 127).astype(np.int8)
    return q, scale


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    art = config.ARTIFACTS_DIR
    out = config.WEB_PUBLIC_DIR
    out.mkdir(parents=True, exist_ok=True)

    catalog = pd.read_parquet(art / "catalog.parquet").reset_index(drop=True)
    clustered = pd.read_parquet(art / "titles_clustered.parquet").set_index("book_key")
    metrics = json.loads((art / "metrics.json").read_text(encoding="utf-8"))

    docs = [book_document(r.title, r.creator, r.subjects) for r in catalog.itertuples()]

    enc = LsaEncoder(dim=WEB_LSA_DIM)
    enc.fit(docs)
    vectors = enc.encode(docs)  # L2-normalized
    dim = vectors.shape[1]

    # catalog.json ----------------------------------------------------------
    records = []
    for i, row in enumerate(catalog.itertuples()):
        c = clustered.loc[row.book_key] if row.book_key in clustered.index else None
        records.append(
            {
                "id": i,
                "title": str(row.title),
                "creator": str(row.creator),
                "subjects": str(row.subjects),
                "checkouts": int(row.total_checkouts),
                "cluster": int(c["cluster"]) if c is not None else -1,
                "pc1": round(float(c["pc1"]), 3) if c is not None else 0.0,
                "pc2": round(float(c["pc2"]), 3) if c is not None else 0.0,
            }
        )
    (out / "catalog.json").write_text(json.dumps(records), encoding="utf-8")
    log.info("catalog.json: %d titles", len(records))

    # vectors.json ----------------------------------------------------------
    q, scale = _quantize(vectors)
    (out / "vectors.json").write_text(
        json.dumps({"scale": scale, "dim": int(dim), "data": q.tolist()}), encoding="utf-8"
    )
    log.info("vectors.json: %d x %d int8", *q.shape)

    # encoder.json — per-token LSA vectors so the browser can embed queries.
    # token vector = idf[t] * SVD_components[:, t]; query = L2norm(sum tokens).
    idf = enc._tfidf.idf_
    components = enc._svd.components_  # (dim, vocab)
    vocab = enc._tfidf.vocabulary_     # token -> col index
    # keep unigrams only (browser tokenizer is whitespace/alnum based)
    items = [(tok, idx) for tok, idx in vocab.items() if " " not in tok]
    # rank by idf ascending (more informative-but-common first) then cap
    items = sorted(items, key=lambda kv: idf[kv[1]])[:MAX_VOCAB_EXPORT]
    tok_mat = np.stack([components[:, idx] * idf[idx] for _, idx in items]).astype(np.float32)
    tq, tscale = _quantize(tok_mat, scale=64.0)
    encoder = {
        "scale": tscale,
        "dim": int(dim),
        "tokens": [tok for tok, _ in items],
        "data": tq.tolist(),
    }
    (out / "encoder.json").write_text(json.dumps(encoder), encoding="utf-8")
    log.info("encoder.json: %d tokens x %d", *tq.shape)

    # refresh metrics encoder note
    metrics["web_encoder"] = {"name": "tfidf-lsa", "dim": int(dim), "tokens": len(items)}
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    log.info("metrics.json written")


if __name__ == "__main__":
    main()
