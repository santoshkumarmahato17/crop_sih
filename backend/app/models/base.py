"""
KISAN SATHI — Base Model Mixins and Enums.
"""

import enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
import uuid


class UUIDPrimaryKeyMixin:
    """Provides a standardized UUID primary key for models."""

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )


class SystemHealthStatus(str, enum.Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
