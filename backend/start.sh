#!/usr/bin/env python3
"""
GrantBD startup script
Runs inside the container: wait for DB → migrate → seed admin → start uvicorn
"""
import os, sys, time, subprocess

def fix_url(url):
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url

def mask(url):
    try:
        from urllib.parse import urlparse, urlunparse
        p = urlparse(url)
        masked = p._replace(netloc=f"{p.username}:***@{p.hostname}:{p.port or ''}")
        return urlunparse(masked)
    except:
        return url[:40] + "..."

def log(msg): print(msg, flush=True)

log("\n" + "="*60)
log("  GrantBD startup")
log("="*60 + "\n")

raw_url = os.environ.get("DATABASE_URL", "")
db_url  = fix_url(raw_url)

if not db_url:
    log("✗ ERROR: DATABASE_URL is not set.")
    log("  Railway: add a PostgreSQL plugin — injected automatically.")
    log("  Render:  Environment tab → add DATABASE_URL (Internal Connection String).")
    sys.exit(1)

log(f"→ DATABASE_URL = {mask(db_url)}")

# Wait for DB — always wait, regardless of hostname
# (Railway internal hostnames look like 'postgres.railway.internal', not localhost)
log("→ Waiting for database...")
try:
    import psycopg2
except ImportError:
    log("✗ psycopg2 not installed")
    sys.exit(1)

connected = False
for attempt in range(1, 31):
    try:
        conn = psycopg2.connect(db_url, connect_timeout=5,
                                sslmode='require' if 'localhost' not in db_url and '127.0.0.1' not in db_url else 'disable')
        conn.close()
        log(f"✓ Database ready (attempt {attempt}/30)")
        connected = True
        break
    except Exception as e:
        log(f"  [{attempt}/30] {str(e).strip()[:80]}")
        time.sleep(2)

if not connected:
    log(f"✗ Database unreachable after 60s — URL: {mask(db_url)}")
    sys.exit(1)

# Run migrations
log("→ Running Alembic migrations...")
env = {**os.environ, "DATABASE_URL": db_url}
result = subprocess.run(["alembic", "upgrade", "head"], env=env)
if result.returncode != 0:
    log(f"✗ Migration failed (exit {result.returncode})")
    sys.exit(1)
log("✓ Migrations complete")

# Seed admin
admin_email = os.environ.get("ADMIN_EMAIL", "")
admin_pass  = os.environ.get("ADMIN_PASSWORD", "")
if admin_email and admin_pass:
    log(f"→ Seeding admin: {admin_email}")
    r = subprocess.run(["python", "-m", "app.core.seed_admin"], env=env)
    if r.returncode == 0:
        log("✓ Admin ready")
    else:
        log("⚠ Admin seed failed (non-fatal)")
else:
    log("ℹ ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed")

# Start server
port = os.environ.get("PORT", "8000")
log(f"\n→ Starting uvicorn on port {port}\n")
os.execvpe("uvicorn", [
    "uvicorn", "app.main:app",
    "--host", "0.0.0.0",
    "--port", port,
    "--workers", "1",
], env)
