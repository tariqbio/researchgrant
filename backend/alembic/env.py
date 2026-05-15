import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def fix_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


# ── Detect misconfigured DATABASE_URL before doing anything ──────────────────
raw_url = os.environ.get("DATABASE_URL", "")
db_url  = fix_url(raw_url)

if not db_url or "localhost" in db_url or "127.0.0.1" in db_url:
    print("\n" + "="*60, flush=True)
    print("  MIGRATION ABORTED — DATABASE_URL is not configured", flush=True)
    print("="*60, flush=True)
    print(f"\n  Current value: '{db_url or '(empty)'}'", flush=True)
    print("\n  Fix:", flush=True)
    print("  On Render:  Environment tab → add DATABASE_URL", flush=True)
    print("              (use Internal Connection String from your Render PostgreSQL)", flush=True)
    print("  On Railway: Add a PostgreSQL plugin — injected automatically\n", flush=True)
    sys.exit(1)

from app.db.session import Base
from app.models import User, Grant, IngestionJob, Source, CommunitySubmission, Watchlist, AlertLog  # noqa

config = context.config
config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
