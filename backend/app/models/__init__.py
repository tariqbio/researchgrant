# Import all models here so SQLAlchemy metadata is fully populated
# and Alembic can detect all tables for autogenerate migrations.

from app.models.user import User  # noqa: F401
from app.models.grant import Grant  # noqa: F401
from app.models.pipeline import (  # noqa: F401
    IngestionJob,
    Source,
    CommunitySubmission,
    Watchlist,
    AlertLog,
)
