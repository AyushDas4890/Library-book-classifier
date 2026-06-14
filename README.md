<div align="center">

<img src="./assets/banner.svg" alt="Library Circulation Intelligence" width="100%" />

<br/>

<p>
  <a href="https://library-circulation-intelligence.vercel.app">
    <img src="https://img.shields.io/badge/▸_Live_Demo-0a0a0b?style=for-the-badge&labelColor=0a0a0b&color=c7f24a&logoColor=black" alt="Live Demo" />
  </a>
  <a href="https://github.com/AyushDas4890/Library-book-classifier/actions/workflows/ci.yml">
    <img src="https://github.com/AyushDas4890/Library-book-classifier/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/license-MIT-9b978d?style=flat-square" alt="MIT" />
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.10+-1f2937?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/scikit--learn-1.3+-1f2937?style=flat-square&logo=scikitlearn&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0a0a0b?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js_14-0a0a0b?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-0a0a0b?style=flat-square&logo=vercel&logoColor=white" />
</p>

<h3>Unsupervised segmentation <em>and</em> semantic retrieval over real public-library open data.</h3>

<sub>Two questions, one reproducible pipeline — built end to end on the Seattle Public Library<br/><b>“Checkouts by Title”</b> open dataset. No synthetic data. No inflated metrics.</sub>

<br/><br/>

**[✦ Open the live experience →](https://library-circulation-intelligence.vercel.app)**

</div>

---

<div align="center">

|  |  |
| :-- | :-- |
| **How do titles circulate?** | k-means groups ~21k titles into six **circulation archetypes** — steady staples, bursty / event-driven, enduring backlist, digital-first… |
| **Can we search by meaning?** | Every title is embedded into a vector space, so a free-text query is matched by cosine similarity — the **retrieval core of a RAG system**, running fully client-side. |

</div>

---

### ✦ At a glance

<table>
<tr>
<td align="center"><b>119,243</b><br/><sub>distinct titles</sub></td>
<td align="center"><b>21,012</b><br/><sub>modelled titles</sub></td>
<td align="center"><b>6</b><br/><sub>archetypes (k)</sub></td>
<td align="center"><b>0.42</b><br/><sub>silhouette</sub></td>
<td align="center"><b>0.82</b><br/><sub>davies–bouldin</sub></td>
<td align="center"><b>9,536</b><br/><sub>calinski–harabasz</sub></td>
</tr>
</table>

> `k` is chosen by scanning **k = 2…10** and taking the peak silhouette on a fixed evaluation sample — reported in full, no forcing, no metric computed on a hand-picked subset and sold as the headline.

---

### ✦ Architecture

```mermaid
flowchart LR
    A["Socrata API<br/>real checkout data"] --> B["features.py<br/>per-title behaviour"]
    B --> C["cluster.py<br/>k-means + model selection"]
    C --> D["personas.py<br/>archetype profiling"]
    B --> E["embeddings.py<br/>MiniLM · TF-IDF+LSA"]
    E --> F["search.py<br/>cosine VectorIndex"]
    F --> G["api.py<br/>FastAPI · /search /similar"]
    F --> H["build_web_artifacts.py<br/>static JSON"]
    H --> I["Next.js on Vercel<br/>client-side retrieval"]

    classDef lime fill:#c7f24a,stroke:#c7f24a,color:#0a0a0b;
    classDef dark fill:#15161a,stroke:#2a2c33,color:#eceae3;
    class A,B,C,D,E,F,G,H dark;
    class I lime;
```

---

<details>
<summary><b>✦ Quickstart</b></summary>

<br/>

```bash
# 1 — install the package + dev tools
pip install -e ".[dev]"

# 2 — run the test suite (9 tests) and lint
pytest -q && ruff check src tests

# 3 — build clusters + embeddings from the committed real sample
python -m library_intel.pipeline

# 4 — serve the retrieval API
uvicorn library_intel.api:app --reload      # http://localhost:8000/docs
```

Web app:

```bash
python scripts/build_web_artifacts.py        # refresh web/public/data
cd web && npm install && npm run dev          # http://localhost:3000
```

Pull fresh data from the live API instead of the committed sample:

```bash
python -m library_intel.pipeline --refresh
```

</details>

<details>
<summary><b>✦ How it works (the honest version)</b></summary>

<br/>

**Segmentation.** A “book” = `(normalized title, normalized creator)`. For each we engineer eight standardized
behavioural features — overall demand, monthly intensity, months active, volatility, demand concentration,
digital share, title age, subject breadth. k-means runs over those, with `k` selected by silhouette across the
full search range. Metrics are computed on the full model space at the chosen `k`.

**Interpretation.** Cluster names are derived from each centroid’s single strongest standardized deviation — a
transparent reading aid, **not** a validated taxonomy.

**Retrieval (RAG core).** Each title is turned into a short document (`title · creator · subjects`) and embedded.
The query is embedded into the *same* space and matched by cosine similarity.
- The **FastAPI service** uses dense MiniLM (`all-MiniLM-L6-v2`) embeddings.
- The **web demo** ships a TF-IDF + LSA encoder so the browser can embed a query and run cosine retrieval with
  **zero backend and no API key**.

</details>

<details>
<summary><b>✦ Repository layout</b></summary>

<br/>

```
src/library_intel/   data · features · cluster · personas · embeddings · search · api · pipeline
tests/               pytest suite (features, clustering, retrieval)
scripts/             build_web_artifacts.py
data/sample/         committed real slice for offline reproduction
artifacts/           metrics.json + (gitignored) model & vectors
web/                 Next.js 14 app — dark UI, scroll motion, client-side search
.github/workflows/   CI: ruff + pytest, and a Next.js build
```

</details>

<details>
<summary><b>✦ Limitations &amp; roadmap</b></summary>

<br/>

- **Sample, not the full corpus.** The committed run uses 120k of the ~2.3M 2023 rows for fast, reproducible
  builds. `--refresh` pulls live.
- **Labels are interpretive,** derived from centroid deviations — not a validated taxonomy.
- **Clustering is behavioural,** describing *how* a title circulates, not what it’s about. The embedding index is
  the semantic half.
- **Next:** approximate-NN index (FAISS / HNSW) for full-catalogue retrieval, an embedding recommender evaluated
  against held-out co-checkout pairs, and a logged hyper-parameter sweep.

</details>

---

<div align="center">

### Built by **Ayush Das** — clustering + RAG over public-library open data.

<a href="https://library-circulation-intelligence.vercel.app"><b>Live demo</b></a> &nbsp;·&nbsp;
<a href="https://github.com/AyushDas4890/Library-book-classifier"><b>Source</b></a> &nbsp;·&nbsp;
<sub>Data © Seattle Public Library open data · code under MIT</sub>

</div>
