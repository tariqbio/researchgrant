import os
import sys
from urllib.parse import urlparse
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def fix_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


raw_url = os.environ.get("DATABASE_URL", "")
db_url  = fix_url(raw_url)

if not db_url:
    print("✗ MIGRATION ABORTED: DATABASE_URL is not set.", flush=True)
    sys.exit(1)

# Import models AFTER fixing URL so Base.metadata is populated
from app.db.session import Base
from app.models import User, Grant, Source, IngestionJob, Watchlist, AlertLog, CommunitySubmission  # noqa

config = context.config
config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Use connect_args for SSL on cloud DBs
    connect_args = {}
    host = urlparse(db_url).hostname or ""
    if host not in {"localhost", "127.0.0.1"}:
        connect_args["sslmode"] = "require"

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
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
