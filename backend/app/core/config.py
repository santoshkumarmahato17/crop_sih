import json
from functools import lru_cache
from typing import List, Optional, Union

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
    BACKEND_PORT: int = 8001
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

    # 2. Database Settings (PostgreSQL + PostGIS or Supabase Hosted Database)
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "agrishield_user"
    POSTGRES_PASSWORD: str = "agrishield_secure_password"
    POSTGRES_DB: str = "agrishield_db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Supabase Specific Configuration
    SUPABASE_URL: str = "https://iekecrgipogdkycreqbc.supabase.co"
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = "sb_publishable_qllqavPGE7kum20YazmeSA_5o_kwb-e"
    SUPABASE_SECRET_KEY: Optional[str] = None
    SUPABASE_JWKS_URL: str = "https://iekecrgipogdkycreqbc.supabase.co/auth/v1/.well-known/jwks.json"
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    @property
    def get_supabase_anon_key(self) -> str:
        return self.SUPABASE_ANON_KEY or self.SUPABASE_PUBLISHABLE_KEY or ""

    @property
    def get_supabase_service_role_key(self) -> str:
        return self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_SECRET_KEY or ""

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            # Normalize scheme to postgresql+asyncpg
            if url.startswith("postgres://"):
                url = "postgresql+asyncpg://" + url[len("postgres://"):]
            elif url.startswith("postgresql://"):
                url = "postgresql+asyncpg://" + url[len("postgresql://"):]
            elif not url.startswith("postgresql+asyncpg://"):
                url = "postgresql+asyncpg://" + url

            # Strip unsupported asyncpg query params (e.g., sslmode=require)
            if "sslmode=" in url:
                import re
                url = re.sub(r'[\?&]sslmode=[^&]+', '', url)
                if '?' not in url and '&' in url:
                    url = url.replace('&', '?', 1)
            return url

        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            if url.startswith("postgresql+asyncpg://"):
                url = "postgresql://" + url[len("postgresql+asyncpg://"):]
            elif url.startswith("postgres://"):
                url = "postgresql://" + url[len("postgres://"):]
            return url

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
    ADMIN_EMAIL_ALLOWLIST: Union[List[str], str] = [
        "admin@agrishield.com",
        "admin@example.com",
        "admin1@example.com",
        "admin2@example.com",
        "security@agrishield.com",
    ]

    @field_validator("ADMIN_EMAIL_ALLOWLIST", mode="before")
    @classmethod
    def assemble_admin_allowlist(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [item.lower().strip() for item in parsed if item]
                except Exception:
                    pass
            return [email.lower().strip() for email in v.split(",") if email.strip()]
        elif isinstance(v, list):
            return [str(email).lower().strip() for email in v if email]
        return []

    # 7. Geospatial & AI Engine Settings
    MODEL_WEIGHTS_DIR: str = "./weights"
    DEVICE: str = "cpu"
    DEFAULT_CRS: str = "EPSG:4326"
    CALCULATION_CRS: str = "EPSG:3857"
    MAX_UPLOAD_SIZE_MB: int = 2048
    GEMINI_API_KEY: str = "AQ.Ab8RN6LOdiNsdPOpR5S0RxEmVwEIOb_uBfz15HprZgP5Vx1sLg"
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    DATASET_ROOT_DIR: str = r"c:\Users\krsan\Desktop\crop\Dataset for Crop Pest and Disease Detection"
    USE_SQLITE_FALLBACK: bool = True

    # 8. SMTP & Email Delivery Settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = "noreply@agrishield.farm"
    EMAILS_FROM_NAME: Optional[str] = "AGRI SHIELD Security"


@lru_cache()
def get_settings() -> Settings:
    """Singleton getter for cached system settings."""
    return Settings()
