"""End-to-end pipeline: real data -> features -> clusters -> embeddings -> artifacts.

Run with:  python -m library_intel.pipeline  [--refresh] [--full]
"""
from __future__ import annotations

import argparse
import json
import logging

import numpy as np

from . import cluster, config, data, embeddings, features, personas
from .search import VectorIndex

log = logging.getLogger(__name__)


def run(refresh: bool = False, prefer_dense: bool = True) -> dict:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    raw = data.load_checkouts(refresh=refresh)
    feats = features.build_features(raw)
    subset = features.model_subset(feats)

    model = cluster.fit(subset)
    labels = model.kmeans.labels_
    subset = subset.copy()
    subset["cluster"] = labels

    profiles = personas.profile_clusters(model, subset, labels)

    # 2-D projection for the explorer (PCA on the standardized model features).
    from sklearn.decomposition import PCA

    Xz = model.scaler.transform(subset[model.features].to_numpy(dtype=float))
    coords = PCA(n_components=2, random_state=config.RANDOM_SEED).fit_transform(Xz)
    subset["pc1"] = coords[:, 0]
    subset["pc2"] = coords[:, 1]

    # Retrieval index over the most-circulated titles ----------------------
    catalog = (
        subset.sort_values("total_checkouts", ascending=False)
        .head(config.WEB_CATALOG_SIZE)
        .reset_index(drop=True)
    )
    encoder = embeddings.get_encoder(prefer_dense=prefer_dense)
    index = VectorIndex.build(encoder, catalog)

    # Persist artifacts -----------------------------------------------------
    cluster.save(model, config.ARTIFACTS_DIR / "cluster_model.joblib")
    subset.to_parquet(config.ARTIFACTS_DIR / "titles_clustered.parquet", index=False)
    np.save(config.ARTIFACTS_DIR / "catalog_vectors.npy", index.vectors)
    catalog.to_parquet(config.ARTIFACTS_DIR / "catalog.parquet", index=False)

    metrics = {
        "data": {
            "raw_rows": int(len(raw)),
            "distinct_titles": int(len(feats)),
            "modelled_titles": int(len(subset)),
            "source": "Seattle Public Library — Checkouts by Title (tmmm-ytt6), 2023",
        },
        "clustering": model.metrics,
        "k_selection": model.selection,
        "encoder": {"name": encoder.name, "dim": int(index.vectors.shape[1])},
        "clusters": json.loads(profiles.to_json(orient="records")),
    }
    with open(config.ARTIFACTS_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    log.info("Wrote metrics.json")

    return {"model": model, "subset": subset, "profiles": profiles, "index": index, "metrics": metrics}


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Library circulation intelligence pipeline")
    ap.add_argument("--refresh", action="store_true", help="re-fetch from the live API")
    ap.add_argument("--no-dense", action="store_true", help="force TF-IDF+LSA encoder")
    args = ap.parse_args()
    run(refresh=args.refresh, prefer_dense=not args.no_dense)
