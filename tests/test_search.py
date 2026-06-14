import numpy as np

from library_intel import embeddings
from library_intel.search import VectorIndex


def test_lsa_encoder_normalized():
    enc = embeddings.LsaEncoder(dim=8)
    docs = [f"science fiction space adventure number {i}" for i in range(20)] + [
        f"cooking recipe kitchen food number {i}" for i in range(20)
    ]
    enc.fit(docs)
    X = enc.encode(docs)
    norms = np.linalg.norm(X, axis=1)
    assert np.allclose(norms, 1.0, atol=1e-5)


def test_similar_returns_same_topic(raw_checkouts):

    from library_intel import features

    feats = features.build_features(raw_checkouts)
    enc = embeddings.LsaEncoder(dim=8)
    index = VectorIndex.build(enc, feats)
    res = index.similar(0, k=3)
    assert len(res) == 3
    assert all(r.book_id != 0 for r in res)
    assert all(-1.0001 <= r.score <= 1.0001 for r in res)


def test_search_returns_results(raw_checkouts):
    from library_intel import features

    feats = features.build_features(raw_checkouts)
    enc = embeddings.LsaEncoder(dim=8)
    index = VectorIndex.build(enc, feats)
    res = index.search("memoir biography life story", k=2)
    assert len(res) == 2
