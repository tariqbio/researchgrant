from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Use settings.db_url (not settings.DATABASE_URL) so postgres:// is auto-fixed
engine = create_engine(
    settings.db_url,
    pool_pre_ping=True,   # detects stale connections before using them
    pool_recycle=300,     # recycle connections every 5 min (avoids Railway idle timeout)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
