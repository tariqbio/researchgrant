import os
from pydantic_settings import BaseSettings
from typing import List


def fix_db_url(url: str) -> str:
    """
    Railway (and some other hosts) inject DATABASE_URL with the
    'postgres://' scheme. SQLAlchemy 2.x only accepts 'postgresql://'.
    This silently fixes it so the app works without any manual env-var editing.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


class Settings(BaseSettings):
    APP_NAME: str = "GrantBD"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-in-production-min-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7   # 7 days

    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/grantbd"

    ANTHROPIC_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GOOGLE_VISION_CREDENTIALS: str = ""

    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "alerts@grantbd.com"
    EMAIL_FROM_NAME: str = "GrantBD"

    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "/tmp/grantbd_uploads"

    ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def db_url(self) -> str:
        """Always use this instead of DATABASE_URL directly."""
        return fix_db_url(self.DATABASE_URL)


settings = Settings()
