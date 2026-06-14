# Inference API container. Build artifacts first: python -m library_intel.pipeline
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY pyproject.toml ./
COPY src ./src
COPY artifacts ./artifacts
RUN pip install --no-cache-dir -e .
EXPOSE 8000
CMD ["uvicorn", "library_intel.api:app", "--host", "0.0.0.0", "--port", "8000"]
