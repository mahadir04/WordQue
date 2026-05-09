# WordQue AI Backend Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for FAISS and PyMuPDF
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data directory exists for persistence
RUN mkdir -p data/pdfs data/faiss_index

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
