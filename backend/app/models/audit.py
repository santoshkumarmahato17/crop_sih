import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    JSON,
    func,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    """Immutable audit trail of agronomic reviews, system overrides, and data modifications."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_timestamp", "timestamp"),
        Index("ix_audit_logs_user", "user_id", "timestamp"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    action: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. CREATE, UPDATE, DELETE, VALIDATE
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Farm, Zone, Mission, Alert
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)

    changes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
