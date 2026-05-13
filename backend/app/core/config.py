from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "GrantBD"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-in-production-min-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7   # 7 days

    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/grantbd"

    ANTHROPIC_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GOOGLE_VISION_CREDENTIALS: str = ""   # base64-encoded service account JSON

    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "alerts@grantbd.com"
    EMAIL_FROM_NAME: str = "GrantBD"

    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "/tmp/grantbd_uploads"

    # In production set to your Railway domain, e.g.:
    # ALLOWED_ORIGINS=["https://grantbd-production.up.railway.app"]
    # Leave as ["*"] and Railway handles HTTPS — fine for v1
    ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
