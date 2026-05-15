#!/usr/bin/env python3
"""
Startup script — runs inside the container before uvicorn.
Steps:
  1. Pre-flight: verify DATABASE_URL is configured
  2. Wait for PostgreSQL to accept connections
  3. Run Alembic migrations
  4. Seed admin user (if ADMIN_EMAIL + ADMIN_PASSWORD are set)
  5. exec uvicorn (replaces this process)
"""

import os
import sys
import time
import subprocess


def fix_url(url: str) -> str:
    """SQLAlchemy 2.x requires postgresql:// not postgres://"""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


def mask(url: str) -> str:
    """Mask password in URL for safe logging."""
    try:
        from urllib.parse import urlparse, urlunparse
        p = urlparse(url)
        masked = p._replace(netloc=f"{p.username}:***@{p.hostname}:{p.port}")
        return urlunparse(masked)
    except Exception:
        return url[:30] + "..."


def banner(msg: str):
    print(f"\n{'='*60}", flush=True)
    print(f"  {msg}", flush=True)
    print(f"{'='*60}\n", flush=True)


def step(msg: str):
    print(f"→ {msg}", flush=True)


def ok(msg: str):
    print(f"✓ {msg}", flush=True)


def fail(msg: str):
    print(f"\n✗ ERROR: {msg}", flush=True)
    print("  Deploy aborted.", flush=True)
    sys.exit(1)


# ── Step 0: Pre-flight ────────────────────────────────────────────────────────

banner("GrantBD startup")

raw_url = os.environ.get("DATABASE_URL", "")
db_url  = fix_url(raw_url)

step(f"DATABASE_URL = {mask(db_url) if db_url else '(not set)'}")

if not db_url:
    fail(
        "DATABASE_URL is not set.\n\n"
        "  On Render:  go to your service → Environment → add DATABASE_URL\n"
        "              (copy the Internal Connection String from your Render PostgreSQL)\n\n"
        "  On Railway: add a PostgreSQL plugin — DATABASE_URL is injected automatically."
    )

is_local = "localhost" in db_url or "127.0.0.1" in db_url

# ── Step 1: Wait for DB ───────────────────────────────────────────────────────

if is_local:
    step("Local database detected — skipping connection wait")
else:
    step("Waiting for database to accept connections...")
    try:
        import psycopg2
    except ImportError:
        fail("psycopg2 not installed — check requirements.txt")

    connected = False
    for attempt in range(1, 31):   # 30 attempts × 2s = 60s max
        try:
            conn = psycopg2.connect(db_url, connect_timeout=3)
            conn.close()
            ok(f"Database ready (attempt {attempt}/30)")
            connected = True
            break
        except psycopg2.OperationalError as e:
            print(f"  [{attempt}/30] Not ready yet: {str(e).strip()}", flush=True)
            time.sleep(2)

    if not connected:
        fail(
            "Database not reachable after 60 seconds.\n\n"
            "  Check that DATABASE_URL is correct and the database is running.\n"
            f"  URL tried: {mask(db_url)}"
        )

# ── Step 2: Migrations ────────────────────────────────────────────────────────

step("Running Alembic migrations...")
result = subprocess.run(
    ["alembic", "upgrade", "head"],
    env={**os.environ, "DATABASE_URL": db_url},  # pass fixed URL to subprocess
)
if result.returncode != 0:
    fail(
        f"Alembic migration failed (exit code {result.returncode}).\n\n"
        "  Check the migration output above for the specific error.\n"
        "  Common causes: wrong DATABASE_URL, missing schema, syntax error in migration file."
    )
ok("Migrations complete")

# ── Step 3: Seed admin ────────────────────────────────────────────────────────

admin_email = os.environ.get("ADMIN_EMAIL", "")
admin_pass  = os.environ.get("ADMIN_PASSWORD", "")

if admin_email and admin_pass:
    step(f"Seeding admin user: {admin_email}")
    result = subprocess.run(
        ["python", "-m", "app.core.seed_admin"],
        env={**os.environ, "DATABASE_URL": db_url},
    )
    if result.returncode != 0:
        # Non-fatal — app can still start without admin seed
        print("⚠ Admin seed failed (non-fatal) — check ADMIN_EMAIL / ADMIN_PASSWORD", flush=True)
    else:
        ok("Admin user ready")
else:
    print("ℹ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed", flush=True)
    print("  Set these env vars to create your admin account on next deploy.", flush=True)

# ── Step 4: Start server ──────────────────────────────────────────────────────

port = os.environ.get("PORT", "8000")
banner(f"Starting server on port {port}")

os.execvpe("uvicorn", [
    "uvicorn", "app.main:app",
    "--host", "0.0.0.0",
    "--port", port,
    "--workers", "1",
], {**os.environ, "DATABASE_URL": db_url})
