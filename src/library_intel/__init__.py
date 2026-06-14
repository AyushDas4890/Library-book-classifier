"""library_intel — circulation pattern mining + semantic retrieval for public-library data.

A small, honest, reproducible ML package built on real Seattle Public Library
open data (Socrata dataset ``tmmm-ytt6``). It does two things:

1. Unsupervised segmentation of book titles by their circulation behaviour
   (k-means with proper model selection and persisted artifacts).
2. Semantic retrieval (the "R" in RAG) over the catalogue — find books similar
   to a query string or to another book using dense text embeddings.
"""

__version__ = "1.0.0"
