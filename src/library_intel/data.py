"""Data ingestion from the real Seattle Public Library Socrata API.

We never fabricate rows. ``load_checkouts`` either reads a cached real sample
or pulls one live from the open data portal. The committed
``data/sample/checkouts_sample.csv`` is a genuine slice of the 2023 dataset so
the whole pipeline is reproducible offline.
"""
from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from . import config

log = logging.getLogger(__name__)

COLUMNS = [
    "title",
    "creator",
    "subjects",
    "materialtype",
    "usageclass",
    "checkouts",
    "checkoutmonth",
    "publicationyear",
]

SAMPLE_FILE = config.SAMPLE_DIR / "checkouts_sample.csv"
RAW_FILE = config.RAW_DIR / "checkouts_2023.csv"


def _where_clause() -> str:
    types = ", ".join(f"'{t}'" for t in config.MATERIAL_TYPES)
    return f"checkoutyear={config.CHECKOUT_YEAR} AND materialtype IN ({types})"


def fetch_from_api(rows: int = config.SAMPLE_ROWS, timeout: int = 180) -> pd.DataFrame:
    """Pull `rows` real checkout records from the Socrata CSV endpoint."""
    import requests  # imported lazily so tests need no network

    params = {
        "$select": ",".join(COLUMNS),
        "$where": _where_clause(),
        "$limit": rows,
    }
    log.info("Fetching %s real rows from %s", f"{rows:,}", config.SOCRATA_ENDPOINT)
    resp = requests.get(config.SOCRATA_ENDPOINT, params=params, timeout=timeout)
    resp.raise_for_status()
    import io

    df = pd.read_csv(io.StringIO(resp.text), low_memory=False)
    log.info("Fetched %s rows", f"{len(df):,}")
    return df


def load_checkouts(
    path: str | Path | None = None,
    refresh: bool = False,
) -> pd.DataFrame:
    """Return the raw checkout records as a DataFrame.

    Resolution order:
      1. explicit `path` if given,
      2. cached raw file,
      3. committed sample,
      4. live API fetch (and cache it).
    """
    if path is not None:
        return pd.read_csv(path, low_memory=False)

    if not refresh and RAW_FILE.exists():
        log.info("Loading cached raw data: %s", RAW_FILE)
        return pd.read_csv(RAW_FILE, low_memory=False)

    if not refresh and SAMPLE_FILE.exists():
        log.info("Loading committed sample: %s", SAMPLE_FILE)
        return pd.read_csv(SAMPLE_FILE, low_memory=False)

    df = fetch_from_api()
    RAW_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_FILE, index=False)
    return df


def write_sample(df: pd.DataFrame, n_rows: int = 15_000) -> Path:
    """Persist a small real slice for reproducible offline runs and tests."""
    sample = df.head(n_rows)
    SAMPLE_FILE.parent.mkdir(parents=True, exist_ok=True)
    sample.to_csv(SAMPLE_FILE, index=False)
    log.info("Wrote %s-row sample to %s", f"{len(sample):,}", SAMPLE_FILE)
    return SAMPLE_FILE
