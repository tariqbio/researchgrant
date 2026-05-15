# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend --silent

COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# ── Stage 2: Python runtime ────────────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (cached unless requirements.txt changes)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy built React frontend — FastAPI serves this as the SPA
COPY --from=frontend-build /app/frontend/dist ./static/

ENV PORT=8000
EXPOSE 8000

# Startup: wait for DB → migrate → seed admin → start server
CMD ["python", "start.sh"]
