import numpy as np

from library_intel import cluster


def _blobs(seed=0):
    rng = np.random.RandomState(seed)
    a = rng.normal(0, 0.3, (200, 4))
    b = rng.normal(5, 0.3, (200, 4))
    c = rng.normal(-5, 0.3, (200, 4))
    return np.vstack([a, b, c])


def test_select_k_finds_three_blobs():
    X = _blobs()
    k, trace = cluster.select_k(X, k_min=2, k_max=6, eval_size=600)
    assert k == 3
    assert len(trace) == 5
    assert all("silhouette" in row for row in trace)


def test_fit_and_assign_roundtrip(raw_checkouts):

    from library_intel import features

    feats = features.build_features(raw_checkouts)
    feats = features.model_subset(feats)
    model = cluster.fit(feats, k=2)
    labels = model.assign(feats)
    assert set(labels) <= {0, 1}
    assert model.metrics["k"] == 2
    assert 0.0 <= model.metrics["silhouette"] <= 1.0
