import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


def fix_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


_raw_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@localhost:5432/grantbd")
DATABASE_URL = fix_url(_raw_url)

# SSL required for Railway/Render cloud PostgreSQL
_is_cloud = "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL
_connect_args = {"sslmode": "require"} if _is_cloud else {}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
