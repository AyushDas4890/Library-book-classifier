"""Feature engineering: one row per distinct title, describing how it circulates.

A "book" is identified by (normalized title, normalized creator). For each we
compute behavioural features from the monthly checkout records. Everything here
is deterministic and unit-tested.
"""
from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from . import config

log = logging.getLogger(__name__)

REFERENCE_YEAR = config.CHECKOUT_YEAR


def _parse_pub_year(value) -> int:
    """Publication years in the source are messy: '2019', '[2019]', '2019.'..."""
    if pd.isna(value):
        return REFERENCE_YEAR
    s = "".join(ch for ch in str(value) if ch.isdigit())
    if len(s) >= 4:
        year = int(s[:4])
        if 1400 <= year <= REFERENCE_YEAR:
            return year
    return REFERENCE_YEAR


def _coefficient_of_variation(values: np.ndarray) -> float:
    if values.size <= 1:
        return 0.0
    mean = values.mean()
    if mean == 0:
        return 0.0
    return float(values.std() / mean)


def _merge_subjects(series: pd.Series) -> str:
    seen: list[str] = []
    for raw in series.dropna():
        for part in str(raw).split(","):
            p = part.strip()
            if p and p not in seen:
                seen.append(p)
    return ", ".join(seen[:12])


def _temporal_stats(monthly_values: np.ndarray) -> dict:
    total = float(monthly_values.sum())
    active = monthly_values > 0
    return {
        "months_active": int(active.sum()),
        "avg_monthly_checkouts": float(monthly_values[active].mean()) if active.any() else 0.0,
        "checkout_volatility": _coefficient_of_variation(monthly_values),
        "peak_month_share": float(monthly_values.max() / total) if total else 0.0,
        "peak_month": int(np.argmax(monthly_values) + 1) if total else 0,
    }


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Return a per-title feature table from raw checkout rows."""
    df = df.copy()
    df["checkouts"] = pd.to_numeric(df["checkouts"], errors="coerce").fillna(0)
    df["checkoutmonth"] = pd.to_numeric(df["checkoutmonth"], errors="coerce")
    df["creator"] = df["creator"].fillna("Unknown").astype(str)
    df["title"] = df["title"].fillna("Untitled").astype(str)
    df["subjects"] = df["subjects"].fillna("").astype(str)
    df["is_digital"] = df["usageclass"].astype(str).str.lower().eq("digital").astype(int)
    df["pub_year"] = df["publicationyear"].apply(_parse_pub_year)

    df["book_key"] = (
        df["title"].str.strip().str.lower()
        + " ||| "
        + df["creator"].str.strip().str.lower()
    )

    agg = (
        df.groupby("book_key")
        .agg(
            title=("title", "first"),
            creator=("creator", "first"),
            subjects=("subjects", _merge_subjects),
            total_checkouts=("checkouts", "sum"),
            digital_ratio=("is_digital", "mean"),
            format_count=("materialtype", "nunique"),
            pub_year=("pub_year", "median"),
        )
        .reset_index()
    )
    agg["total_checkouts"] = agg["total_checkouts"].astype(int)
    agg["pub_age"] = (REFERENCE_YEAR - agg["pub_year"]).clip(lower=0)
    agg["subject_count"] = agg["subjects"].apply(
        lambda s: len([x for x in s.split(",") if x.strip()])
    )
    agg["is_fiction"] = agg["subjects"].str.contains("fiction", case=False).astype(int)
    agg["title_word_count"] = agg["title"].str.split().apply(len)

    monthly = df.groupby(["book_key", "checkoutmonth"])["checkouts"].sum().reset_index()
    stats_by_key: dict[str, dict] = {}
    for key, grp in monthly.groupby("book_key")["checkouts"]:
        stats_by_key[key] = _temporal_stats(grp.to_numpy(dtype=float))

    def _stat(col, default):
        return agg["book_key"].map(lambda k: stats_by_key.get(k, {}).get(col, default))

    agg["months_active"] = _stat("months_active", 0).astype(int)
    agg["peak_month"] = _stat("peak_month", 0).astype(int)
    agg["avg_monthly_checkouts"] = _stat("avg_monthly_checkouts", 0.0).astype(float)
    agg["checkout_volatility"] = _stat("checkout_volatility", 0.0).astype(float)
    agg["peak_month_share"] = _stat("peak_month_share", 0.0).astype(float)
    agg["log_total_checkouts"] = np.log1p(agg["total_checkouts"])

    log.info("Built features for %s distinct titles", f"{len(agg):,}")
    return agg


def model_subset(feats: pd.DataFrame) -> pd.DataFrame:
    """Titles with enough signal to be clustered behaviourally."""
    subset = feats[feats["total_checkouts"] >= config.MIN_CHECKOUTS_FOR_MODEL].copy()
    log.info(
        "Behavioural model subset: %s / %s titles (>= %d checkouts)",
        f"{len(subset):,}", f"{len(feats):,}", config.MIN_CHECKOUTS_FOR_MODEL,
    )
    return subset.reset_index(drop=True)
