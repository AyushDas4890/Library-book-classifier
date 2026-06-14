"""Interpret clusters from their standardized centroids.

This is explicitly *interpretive*: each cluster is described by the behavioural
features on which it deviates most from the global mean, and given a short label
derived from its single strongest deviation. We do NOT claim these labels are
ground truth -- they are a reading aid over real centroids.
"""
from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from .cluster import ClusterModel

log = logging.getLogger(__name__)

FEATURE_LABELS = {
    "log_total_checkouts": "overall demand",
    "avg_monthly_checkouts": "monthly intensity",
    "months_active": "months in circulation",
    "checkout_volatility": "demand volatility",
    "peak_month_share": "demand concentration",
    "digital_ratio": "digital share",
    "pub_age": "title age",
    "subject_count": "subject breadth",
}

# (feature, direction) -> human label for the dominant deviation.
LABELS = {
    ("log_total_checkouts", "high"): "High-demand staples",
    ("log_total_checkouts", "low"): "Long-tail / niche titles",
    ("avg_monthly_checkouts", "high"): "Intense, fast-moving titles",
    ("avg_monthly_checkouts", "low"): "Slow-burn titles",
    ("months_active", "high"): "Year-round steady titles",
    ("months_active", "low"): "Short-window titles",
    ("checkout_volatility", "high"): "Volatile / bursty titles",
    ("checkout_volatility", "low"): "Stable, even circulation",
    ("peak_month_share", "high"): "Spiky / event-driven titles",
    ("peak_month_share", "low"): "Evenly-spread titles",
    ("digital_ratio", "high"): "Digital-first titles",
    ("digital_ratio", "low"): "Print-first titles",
    ("pub_age", "high"): "Enduring backlist",
    ("pub_age", "low"): "New-release driven titles",
    ("subject_count", "high"): "Broad-subject titles",
    ("subject_count", "low"): "Tightly-categorised titles",
}


def profile_clusters(model: ClusterModel, feats: pd.DataFrame, labels: np.ndarray) -> pd.DataFrame:
    """Return one row per cluster: size, label, and key deviations."""
    n = len(feats)
    Xz = model.scaler.transform(feats[model.features].to_numpy(dtype=float))
    z_df = pd.DataFrame(Xz, columns=model.features)
    z_df["cluster"] = labels

    used: set[str] = set()
    rows = []
    for cl, group in z_df.groupby("cluster"):
        z = group[model.features].mean().to_dict()
        ranked = sorted(z.items(), key=lambda kv: abs(kv[1]), reverse=True)
        top = [
            {
                "feature": k,
                "label": FEATURE_LABELS.get(k, k),
                "z": round(float(v), 3),
                "direction": "high" if v > 0 else "low",
            }
            for k, v in ranked[:3]
        ]
        # label from the strongest not-yet-used deviation, so labels stay distinct
        label = "Moderate general circulation"
        for k, v in ranked:
            key = (k, "high" if v > 0 else "low")
            if key in LABELS and key not in used:
                label = LABELS[key]
                used.add(key)
                break
        size = int((labels == cl).sum())
        rows.append(
            {
                "cluster": int(cl),
                "label": label,
                "size": size,
                "share": round(size / n, 4),
                "top_features": top,
            }
        )
    out = pd.DataFrame(rows).sort_values("size", ascending=False).reset_index(drop=True)
    for r in out.itertuples():
        log.info("Cluster %d (%s): %s titles (%.1f%%)", r.cluster, r.label, f"{r.size:,}", r.share * 100)
    return out
