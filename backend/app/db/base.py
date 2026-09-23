from datetime import datetime, timezone
from typing import Any
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    """Base declarative class for all KISAN SATHI database entities."""

    id: Any
    __name__: str

    # Generate __tablename__ automatically in lowercase pluralized form
    @declared_attr.directive
    def __tablename__(cls) -> str:
        name = cls.__name__.lower()
        if not name.endswith("s"):
            return f"{name}s"
        return name


class TimestampMixin:
    """Provides standard audit timestamps for entities."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
