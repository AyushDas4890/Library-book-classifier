# Library Circulation Intelligence

Unsupervised segmentation **and** semantic retrieval over real
[Seattle Public Library](https://data.seattle.gov/Community/Checkouts-by-Title/tmmm-ytt6)
checkout data. Two questions, one reproducible pipeline:

1. **How do titles circulate?** — k-means over behavioural features groups
   ~21k titles into six circulation archetypes (steady staples, bursty/event
   titles, enduring backlist, digital-first, …).
2. **Can we search the catalogue by meaning?** — every title is embedded into a
   vector space so a free-text query is matched by cosine similarity. This is
   the retrieval core of a RAG system, and it powers the live web demo
   **entirely client-side** (no server, no API key).

> **Live demo:** https://library-circulation-intelligence-o22op53dx.vercel.app
> **Data is 100% real.** Nothing in this repo is synthetic.

---

## Results (real, not inflated)

Run on a committed 120,000-row sample of the 2023 dataset:

| Metric | Value |
| --- | --- |
| Distinct titles analysed | **119,243** |
| Titles in the behavioural model (≥5 checkouts) | **21,012** |
| Clusters (k, chosen by silhouette) | **6** |
| Silhouette @ chosen k | **0.42** |
| Davies–Bouldin | **0.82** |
| Calinski–Harabasz | **9,536** |

`k` is selected by scanning k = 2…10 and taking the peak silhouette on a fixed
evaluation sample — reported in full, no forcing, no metric computed on a
hand-picked subset and presented as the headline.

## Architecture

```
Socrata API (real data)
      │  data.py
      ▼
per-title features ──► k-means + model selection ──► cluster_model.joblib
   features.py             cluster.py / personas.py        + metrics.json
      │
      ├──► text embeddings (MiniLM dense, or TF-IDF+LSA fallback)  embeddings.py
      │         │
      │         ▼
      │    VectorIndex (cosine retrieval)  search.py
      │         │
      │         ├──► FastAPI service  api.py     (/search, /similar, /metrics)
      │         └──► static JSON      scripts/build_web_artifacts.py
      │                                   │
      ▼                                   ▼
  artifacts/                         web/  (Next.js → Vercel, client-side search)
```

## Quickstart

```bash
pip install -e ".[dev]"          # install package + dev tools
pytest -q                        # run the test suite
python -m library_intel.pipeline # build clusters + embeddings from the sample
uvicorn library_intel.api:app    # serve the retrieval API on :8000
```

Web app:

```bash
python scripts/build_web_artifacts.py   # refresh web/public/data
cd web && npm install && npm run dev     # http://localhost:3000
```

Pull fresh data from the live API instead of the committed sample:

```bash
python -m library_intel.pipeline --refresh
```

## Retrieval / RAG notes

`embeddings.py` ships two interchangeable encoders behind one interface:

- **Dense (`sentence-transformers/all-MiniLM-L6-v2`)** — used automatically when
  `torch` + `sentence-transformers` are installed. Powers the FastAPI service.
- **TF-IDF + TruncatedSVD (LSA)** — pure scikit-learn, deterministic, no heavy
  deps. Used for CI and for the **web artifacts**, so the browser demo can embed
  a query and run cosine retrieval with zero backend. The token encoder is
  exported to `web/public/data/encoder.json` and mean-pooled in the browser.

## Repository layout

```
src/library_intel/   data · features · cluster · personas · embeddings · search · api · pipeline
tests/               pytest suite (features, clustering, retrieval)
scripts/             build_web_artifacts.py
data/sample/         committed real 15k-row slice for offline reproduction
web/                 Next.js 14 app (TypeScript), deployed to Vercel
.github/workflows/   CI: ruff + pytest, and a Next.js build
```

## Limitations & future work

- **Sample, not the full corpus.** The committed run uses 120k of the ~2.3M 2023
  rows for fast, reproducible builds. `--refresh` pulls live; a full run needs
  more memory and time.
- **Labels are interpretive.** Cluster names are derived from each centroid's
  strongest standardized deviation — a reading aid, not validated taxonomy.
- **Clustering is behavioural, not semantic.** Segments describe *how* a title
  circulates, not what it is about. The embedding index is the semantic half.
- **Next:** approximate-NN index (FAISS/HNSW) for full-catalogue retrieval, an
  embedding-based recommender evaluated against held-out co-checkout pairs, and
  a proper hyper-parameter sweep logged with MLflow.

## Project history

This is a ground-up rebuild of an earlier version. The previous iteration
reported a 0.78 silhouette computed on a small subset forced to k=2 and wrapped
the result in inflated "elite/DNA" framing. This version reports honest metrics
on the full model space, adds tests + CI + a serving API + a semantic-retrieval
layer, and ships a real web product.

## License

MIT — see [LICENSE](LICENSE).
