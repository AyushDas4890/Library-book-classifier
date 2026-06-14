"""K-means segmentation with honest model selection and persistence.

No forcing of k, no metrics computed on a cherry-picked subset and reported as
the headline. We scan k, pick by silhouette on a fixed evaluation sample, and
report silhouette / Davies-Bouldin / Calinski-Harabasz for the chosen k over
the SAME feature space the model was trained on.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import (
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)
from sklearn.preprocessing import StandardScaler

from . import config

log = logging.getLogger(__name__)


@dataclass
class ClusterModel:
    scaler: StandardScaler
    kmeans: KMeans
    features: list[str]
    k: int
    metrics: dict = field(default_factory=dict)
    selection: list[dict] = field(default_factory=list)

    def assign(self, feats: pd.DataFrame) -> np.ndarray:
        X = self.scaler.transform(feats[self.features].to_numpy(dtype=float))
        return self.kmeans.predict(X)


def _eval_sample(n: int, size: int, seed: int) -> np.ndarray:
    if n <= size:
        return np.arange(n)
    rng = np.random.RandomState(seed)
    return rng.choice(n, size, replace=False)


def select_k(
    X: np.ndarray,
    k_min: int = config.K_MIN,
    k_max: int = config.K_MAX,
    seed: int = config.RANDOM_SEED,
    eval_size: int = 20_000,
) -> tuple[int, list[dict]]:
    """Scan k and return the k with the best silhouette, plus the full trace."""
    idx = _eval_sample(X.shape[0], eval_size, seed)
    Xe = X[idx]
    trace: list[dict] = []
    for k in range(k_min, k_max + 1):
        km = KMeans(n_clusters=k, random_state=seed, n_init=10)
        labels = km.fit_predict(Xe)
        row = {
            "k": k,
            "silhouette": round(float(silhouette_score(Xe, labels)), 4),
            "davies_bouldin": round(float(davies_bouldin_score(Xe, labels)), 4),
            "calinski_harabasz": round(float(calinski_harabasz_score(Xe, labels)), 1),
            "inertia": round(float(km.inertia_), 1),
        }
        trace.append(row)
        log.info(
            "k=%d  silhouette=%.4f  davies_bouldin=%.4f", k, row["silhouette"], row["davies_bouldin"]
        )
    best = max(trace, key=lambda r: r["silhouette"])
    log.info("Selected k=%d by silhouette", best["k"])
    return best["k"], trace


def fit(
    feats: pd.DataFrame,
    features: list[str] | None = None,
    k: int | None = None,
    seed: int = config.RANDOM_SEED,
) -> ClusterModel:
    features = features or list(config.CLUSTER_FEATURES)
    X_raw = feats[features].to_numpy(dtype=float)
    scaler = StandardScaler().fit(X_raw)
    X = scaler.transform(X_raw)

    trace: list[dict] = []
    if k is None:
        k, trace = select_k(X, seed=seed)

    kmeans = KMeans(n_clusters=k, random_state=seed, n_init=10).fit(X)
    labels = kmeans.labels_

    idx = _eval_sample(X.shape[0], 50_000, seed)
    metrics = {
        "silhouette": round(float(silhouette_score(X[idx], labels[idx])), 4),
        "davies_bouldin": round(float(davies_bouldin_score(X[idx], labels[idx])), 4),
        "calinski_harabasz": round(float(calinski_harabasz_score(X[idx], labels[idx])), 1),
        "n_titles": int(X.shape[0]),
        "k": int(k),
        "eval_sample": int(len(idx)),
    }
    log.info("Final model: k=%d silhouette=%.4f", k, metrics["silhouette"])
    return ClusterModel(scaler, kmeans, features, k, metrics, trace)


def save(model: ClusterModel, path) -> None:
    import joblib

    joblib.dump(model, path)
    log.info("Saved cluster model to %s", path)


def load(path) -> ClusterModel:
    import joblib

    return joblib.load(path)
