.PHONY: install test lint pipeline web-data api clean
install:
	pip install -e ".[dev]"
test:
	pytest -q
lint:
	ruff check src tests
pipeline:
	python -m library_intel.pipeline
web-data:
	python scripts/build_web_artifacts.py
api:
	uvicorn library_intel.api:app --reload
clean:
	rm -rf .pytest_cache .ruff_cache **/__pycache__
