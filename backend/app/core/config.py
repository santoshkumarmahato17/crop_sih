import json
from functools import lru_cache
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    AGRI SHIELD System Configuration Settings.
    Loaded securely from environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # 1. System Settings
    PROJECT_NAME: str = "AGRI SHIELD"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    API_V1_STR: str = "/api/v1"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    ALLOWED_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("ALLOWED_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
        return v if isinstance(v, list) else []

    # 2. Database Settings (PostgreSQL + PostGIS)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "agrishield_user"
    POSTGRES_PASSWORD: str = "agrishield_secure_password"
    POSTGRES_DB: str = "agrishield_db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    @property
    def async_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # 3. Cache & Message Broker (Redis)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # 4. Asynchronous Task Queue (Celery)
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    CELERY_TASK_ALWAYS_EAGER: bool = False

    # 5. Object Storage (MinIO / S3)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minio_admin_user"
    MINIO_SECRET_KEY: str = "minio_admin_secure_password"
    MINIO_USE_SSL: bool = False
    MINIO_REGION: str = "us-east-1"
    MINIO_BUCKET_RAW_IMAGERY: str = "agrishield-raw-imagery"
    MINIO_BUCKET_ORTHOMOSAICS: str = "agrishield-orthomosaics"
    MINIO_BUCKET_INDEX_RASTERS: str = "agrishield-index-rasters"
    MINIO_BUCKET_MODELS: str = "agrishield-model-artifacts"

    # 6. Security & JWT Settings
    SECRET_KEY: str = "agrishield-dev-secret-key-replace-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes short-lived access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days refresh token

    # 7. Geospatial & AI Engine Settings
    MODEL_WEIGHTS_DIR: str = "./weights"
    DEVICE: str = "cpu"
    DEFAULT_CRS: str = "EPSG:4326"
    CALCULATION_CRS: str = "EPSG:3857"
    MAX_UPLOAD_SIZE_MB: int = 2048


@lru_cache()
def get_settings() -> Settings:
    """Singleton getter for cached system settings."""
    return Settings()
