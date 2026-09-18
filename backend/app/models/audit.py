import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditEventType(str, enum.Enum):
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILURE = "LOGIN_FAILURE"
    LOGOUT = "LOGOUT"
    ADMIN_LOGIN = "ADMIN_LOGIN"
    ADMIN_ACCESS_DENIED = "ADMIN_ACCESS_DENIED"
    ROLE_ACCESS_DENIED = "ROLE_ACCESS_DENIED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    USER_CREATED = "USER_CREATED"
    USER_DEACTIVATED = "USER_DEACTIVATED"
    ROLE_CHANGED = "ROLE_CHANGED"
    SECURITY_CONFIG_MODIFIED = "SECURITY_CONFIG_MODIFIED"
    
    # Expert Validation & Advisory Events
    VALIDATION_REQUESTED = "VALIDATION_REQUESTED"
    VALIDATION_ASSIGNED = "VALIDATION_ASSIGNED"
    VALIDATION_STARTED = "VALIDATION_STARTED"
    VALIDATION_CONFIRMED = "VALIDATION_CONFIRMED"
    VALIDATION_REJECTED = "VALIDATION_REJECTED"
    VALIDATION_UNCERTAIN = "VALIDATION_UNCERTAIN"
    LAB_REFERRAL_CREATED = "LAB_REFERRAL_CREATED"
    LAB_REFERRAL_UPDATED = "LAB_REFERRAL_UPDATED"
    LAB_SAMPLE_COLLECTED = "LAB_SAMPLE_COLLECTED"
    LAB_RESULT_SUBMITTED = "LAB_RESULT_SUBMITTED"
    LAB_REPORT_UPLOADED = "LAB_REPORT_UPLOADED"
    DIAGNOSTIC_CASE_CREATED = "DIAGNOSTIC_CASE_CREATED"
    DIAGNOSTIC_CASE_STATUS_CHANGED = "DIAGNOSTIC_CASE_STATUS_CHANGED"
    ADVISORY_GENERATED = "ADVISORY_GENERATED"
    ADVISORY_TRANSLATED = "ADVISORY_TRANSLATED"
    LANGUAGE_CHANGED = "LANGUAGE_CHANGED"

    # Follow-up Monitoring & Health Tracking Events
    MONITORING_CREATED = "MONITORING_CREATED"
    MONITORING_ASSIGNED = "MONITORING_ASSIGNED"
    MONITORING_STARTED = "MONITORING_STARTED"
    MONITORING_COMPLETED = "MONITORING_COMPLETED"
    MONITORING_MISSED = "MONITORING_MISSED"
    MONITORING_ESCALATED = "MONITORING_ESCALATED"
    OBSERVATION_SUBMITTED = "OBSERVATION_SUBMITTED"
    RISK_RECALCULATED = "RISK_RECALCULATED"
    HOTSPOT_UPDATED = "HOTSPOT_UPDATED"
    ADVISORY_UPDATED = "ADVISORY_UPDATED"
    EXPERT_REVIEW_REQUESTED = "EXPERT_REVIEW_REQUESTED"


class AuditLog(Base):
    """Immutable audit trail for security and access events."""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True, index=True
    )
    user_email: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    event_type: Mapped[AuditEventType] = mapped_column(
        Enum(AuditEventType), nullable=False, index=True
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, default=dict, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
