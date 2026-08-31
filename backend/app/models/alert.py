import enum
import uuid
from datetime import datetime
from typing import List, Optional
from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class AlertType(str, enum.Enum):
    DISEASE_DETECTED = "disease_detected"
    PEST_OUTBREAK = "pest_outbreak"
    WATER_STRESS = "water_stress"
    SPREAD_WARNING = "spread_warning"
    WEATHER_HAZARD = "weather_hazard"
    MISSION_FAILED = "mission_failed"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"


class SentStatus(str, enum.Enum):
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class Alert(Base, TimestampMixin):
    """System-generated urgent agro-intelligence alerts."""

    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_farm_resolved", "farm_id", "is_resolved"),
        Index("ix_alerts_severity_created", "severity", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )

    alert_type: Mapped[AlertType] = mapped_column(
        Enum(AlertType), default=AlertType.DISEASE_DETECTED, nullable=False, index=True
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity), default=AlertSeverity.WARNING, nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # PostGIS Spatial Location (SRID 4326)
    location: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )

    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="alerts")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="alert", cascade="all, delete-orphan"
    )


class Notification(Base, TimestampMixin):
    """User delivery dispatch queue for alerts and system updates."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    alert_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=True, index=True
    )

    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel), default=NotificationChannel.IN_APP, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_status: Mapped[SentStatus] = mapped_column(
        Enum(SentStatus), default=SentStatus.QUEUED, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
    alert: Mapped[Optional["Alert"]] = relationship("Alert", back_populates="notifications")
