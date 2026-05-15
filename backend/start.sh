#!/usr/bin/env python3
"""
Startup script — runs inside the container before uvicorn.
1. Waits for PostgreSQL to be reachable
2. Runs Alembic migrations
3. Seeds admin user (if ADMIN_EMAIL/ADMIN_PASSWORD set)
4. Exec's uvicorn (replaces this process)
"""

import os
import sys
import time
import subprocess


def fix_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


def wait_for_db(url: str, max_attempts: int = 30) -> bool:
    import psycopg2
    print("⏳ Waiting for database...", flush=True)
    for attempt in range(1, max_attempts + 1):
        try:
            conn = psycopg2.connect(url, connect_timeout=3)
            conn.close()
            print(f"✓ Database ready (attempt {attempt})", flush=True)
            return True
        except psycopg2.OperationalError as e:
            print(f"  [{attempt}/{max_attempts}] Not ready: {e}", flush=True)
            time.sleep(2)
    print("✗ Database not reachable after 60s", flush=True)
    return False


def run(cmd: list, desc: str) -> bool:
    print(f"→ {desc}", flush=True)
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print(f"✗ {desc} failed (exit {result.returncode})", flush=True)
        return False
    print(f"✓ {desc} done", flush=True)
    return True


def main():
    raw_url = os.environ.get("DATABASE_URL", "")
    db_url  = fix_url(raw_url)

    # Only wait in production (non-localhost)
    if db_url and "localhost" not in db_url and "127.0.0.1" not in db_url:
        if not wait_for_db(db_url):
            sys.exit(1)
    else:
        print("ℹ Local database — skipping wait", flush=True)

    if not run(["alembic", "upgrade", "head"], "Alembic migrations"):
        sys.exit(1)

    run(["python", "-m", "app.core.seed_admin"], "Admin seed")

    port = os.environ.get("PORT", "8000")
    print(f"🚀 Starting uvicorn on port {port}", flush=True)
    os.execvp("uvicorn", [
        "uvicorn", "app.main:app",
        "--host", "0.0.0.0",
        "--port", port,
    ])


if __name__ == "__main__":
    main()
