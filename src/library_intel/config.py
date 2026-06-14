"""Central configuration and paths.

Everything tunable lives here so the rest of the package stays declarative.
No magic constants buried in functions.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
SAMPLE_DIR = DATA_DIR / "sample"
ARTIFACTS_DIR = ROOT / "artifacts"
WEB_PUBLIC_DIR = ROOT / "web" / "public" / "data"

for _d in (RAW_DIR, SAMPLE_DIR, ARTIFACTS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Data source — REAL Seattle Public Library "Checkouts by Title" open dataset.
# https://data.seattle.gov/Community/Checkouts-by-Title/tmmm-ytt6
# ---------------------------------------------------------------------------
SOCRATA_ENDPOINT = "https://data.seattle.gov/resource/tmmm-ytt6.csv"
CHECKOUT_YEAR = 2023
MATERIAL_TYPES = ("BOOK", "EBOOK", "AUDIOBOOK")
SAMPLE_ROWS = 120_000  # rows pulled for the committed, reproducible sample

# Deterministic seed. One seed, used everywhere, documented. Not a gimmick.
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# Modelling
# ---------------------------------------------------------------------------
# Behavioural features used for clustering. All numeric, all standardized.
# Chosen because they describe *how a title circulates*, not what it is about.
CLUSTER_FEATURES = [
    "log_total_checkouts",
    "avg_monthly_checkouts",
    "months_active",
    "checkout_volatility",
    "peak_month_share",
    "digital_ratio",
    "pub_age",
    "subject_count",
]

K_MIN = 2
K_MAX = 10
# Minimum distinct checkouts for a title to enter the behavioural model.
# Titles with a single checkout carry no temporal signal.
MIN_CHECKOUTS_FOR_MODEL = 5

# ---------------------------------------------------------------------------
# Embeddings / retrieval
# ---------------------------------------------------------------------------
# Preferred dense model. Used automatically if sentence-transformers + torch
# are installed; otherwise the package falls back to a deterministic
# TF-IDF + TruncatedSVD (LSA) encoder so CI and the committed artifacts stay
# reproducible with zero heavyweight dependencies. See embeddings.py.
DENSE_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
LSA_DIM = 256
# Number of most-circulated distinct titles whose vectors ship to the web app.
WEB_CATALOG_SIZE = 1500


@dataclass(frozen=True)
class Settings:
    random_seed: int = RANDOM_SEED
    k_min: int = K_MIN
    k_max: int = K_MAX
    cluster_features: tuple[str, ...] = field(default_factory=lambda: tuple(CLUSTER_FEATURES))


SETTINGS = Settings()
