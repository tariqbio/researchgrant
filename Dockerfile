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
    curl libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./static/

ENV PORT=8000
EXPOSE 8000

# 1. Run DB migrations
# 2. Seed admin user if ADMIN_EMAIL + ADMIN_PASSWORD are set
# 3. Start server
CMD alembic upgrade head && \
    python -m app.core.seed_admin && \
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
