
from library_intel import features


def test_build_features_one_row_per_title(raw_checkouts):
    feats = features.build_features(raw_checkouts)
    assert len(feats) == raw_checkouts["title"].nunique()
    assert {"total_checkouts", "log_total_checkouts", "checkout_volatility"} <= set(feats.columns)


def test_pub_year_parsing_handles_messy_values():
    assert features._parse_pub_year("[2020]") == 2020
    assert features._parse_pub_year("2021.") == 2021
    assert features._parse_pub_year(None) == features.REFERENCE_YEAR
    assert features._parse_pub_year("garbage") == features.REFERENCE_YEAR


def test_features_are_finite_and_bounded(raw_checkouts):
    feats = features.build_features(raw_checkouts)
    assert feats["digital_ratio"].between(0, 1).all()
    assert feats["peak_month_share"].between(0, 1).all()
    assert feats["total_checkouts"].gt(0).all()
    assert feats.select_dtypes("number").notna().all().all()


def test_volatility_zero_for_flat_series():
    import numpy as np

    assert features._coefficient_of_variation(np.array([5.0, 5.0, 5.0])) == 0.0
