#!/usr/bin/env python3
"""
GrantBD startup script.

Runs inside the container:
1. validate DATABASE_URL
2. wait for Postgres
3. run Alembic migrations
4. seed the first admin account
5. start Uvicorn
"""
import os
import sys
import time
import subprocess
from urllib.parse import urlparse, urlunparse


def fix_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


def is_local_database(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return host in {"localhost", "127.0.0.1"}


def mask(url: str) -> str:
    try:
        parsed = urlparse(url)
        user = parsed.username or ""
        host = parsed.hostname or ""
        port = f":{parsed.port}" if parsed.port else ""
        auth = f"{user}:***@" if user else ""
        return urlunparse(parsed._replace(netloc=f"{auth}{host}{port}"))
    except Exception:
        return url[:40] + "..."


def log(message: str) -> None:
    print(message, flush=True)


log("")
log("=" * 60)
log("  GrantBD startup")
log("=" * 60)
log("")

db_url = fix_url(os.environ.get("DATABASE_URL", ""))

if not db_url:
    log("ERROR: DATABASE_URL is not set.")
    log("Railway: add a PostgreSQL service and set DATABASE_URL to its reference.")
    log("Render: set DATABASE_URL to the Postgres internal connection string.")
    sys.exit(1)

log(f"DATABASE_URL = {mask(db_url)}")
log("Waiting for database...")

try:
    import psycopg2
except ImportError:
    log("ERROR: psycopg2 is not installed.")
    sys.exit(1)

sslmode = "disable" if is_local_database(db_url) else "require"
connected = False
for attempt in range(1, 31):
    try:
        conn = psycopg2.connect(db_url, connect_timeout=5, sslmode=sslmode)
        conn.close()
        log(f"Database ready (attempt {attempt}/30)")
        connected = True
        break
    except Exception as exc:
        log(f"[{attempt}/30] {str(exc).strip()[:160]}")
        time.sleep(2)

if not connected:
    log(f"Database unreachable after 60 seconds: {mask(db_url)}")
    sys.exit(1)

log("Running Alembic migrations...")
env = {**os.environ, "DATABASE_URL": db_url}
result = subprocess.run(["alembic", "upgrade", "head"], env=env)
if result.returncode != 0:
    log(f"Migration failed with exit code {result.returncode}")
    sys.exit(1)
log("Migrations complete")

admin_email = os.environ.get("ADMIN_EMAIL", "")
admin_password = os.environ.get("ADMIN_PASSWORD", "") or os.environ.get("ADMIN_PASS", "")
if admin_email and admin_password:
    log(f"Seeding admin: {admin_email}")
    result = subprocess.run(["python", "-m", "app.core.seed_admin"], env=env)
    if result.returncode == 0:
        log("Admin ready")
    else:
        log("Admin seed failed. Continuing because the app can still boot.")
else:
    log("ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seed.")

seed_demo = os.environ.get("SEED_DEMO_DATA", "true").lower() in {"1", "true", "yes", "on"}
if seed_demo:
    log("Seeding demo users and sample data")
    result = subprocess.run(["python", "-m", "app.core.seed_demo"], env=env)
    if result.returncode == 0:
        log("Demo data ready")
    else:
        log("Demo seed failed. Continuing because the app can still boot.")
else:
    log("SEED_DEMO_DATA is false. Skipping demo seed.")

port = os.environ.get("PORT", "8000")
log(f"Starting Uvicorn on port {port}")
os.execvpe(
    "uvicorn",
    [
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        port,
        "--workers",
        "1",
    ],
    env,
)
