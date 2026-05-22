# ── Stage 1: Build Frontend ──────────────────────────────────
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Final Runtime ──────────────────────────────────
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./static

# Ensure data directories exist and are writable for persistence
RUN mkdir -p /app/data/pdfs /app/data/faiss_index && chmod -R 777 /app/data

# Hugging Face Spaces uses port 7860 by default
EXPOSE 7860

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
