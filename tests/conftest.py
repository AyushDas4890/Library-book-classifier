import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def raw_checkouts() -> pd.DataFrame:
    """A tiny but realistic raw-checkout frame (mirrors the Socrata schema)."""
    rng = np.random.RandomState(0)
    rows = []
    titles = [
        ("The Midnight Library", "Matt Haig", "Fiction, Fantasy", "BOOK", "Physical"),
        ("Atomic Habits", "James Clear", "Self-Help, Psychology", "EBOOK", "Digital"),
        ("Educated", "Tara Westover", "Biography, Memoir", "AUDIOBOOK", "Digital"),
        ("Project Hail Mary", "Andy Weir", "Science Fiction", "BOOK", "Physical"),
        ("Becoming", "Michelle Obama", "Biography, Nonfiction", "EBOOK", "Digital"),
    ]
    for title, creator, subjects, mtype, usage in titles:
        for month in range(1, 13):
            for _ in range(rng.randint(1, 6)):
                rows.append(
                    {
                        "title": title,
                        "creator": creator,
                        "subjects": subjects,
                        "materialtype": mtype,
                        "usageclass": usage,
                        "checkouts": int(rng.randint(1, 10)),
                        "checkoutmonth": month,
                        "publicationyear": rng.choice(["2018", "[2020]", "2021."]),
                    }
                )
    return pd.DataFrame(rows)
