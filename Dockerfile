# WordQue AI — Hugging Face Spaces Deployment
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Ensure data directory exists and is writable for persistence
RUN mkdir -p /app/data/pdfs /app/data/faiss_index && chmod -R 777 /app/data

# Hugging Face Spaces uses port 7860 by default
EXPOSE 7860

# Run with uvicorn on the correct port
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
