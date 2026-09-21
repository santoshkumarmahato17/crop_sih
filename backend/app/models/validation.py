import enum
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class ValidationRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    CONFIRMED = "CONFIRMED"
    VALIDATED = "VALIDATED"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
    REJECTED = "REJECTED"
    UNCERTAIN = "UNCERTAIN"
    LAB_REFERRAL = "LAB_REFERRAL"
    REQUEST_MORE_EVIDENCE = "REQUEST_MORE_EVIDENCE"


class ValidationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"





class ExpertValidationRequest(Base, TimestampMixin):
    """Case queued for human agricultural expert ground-truthing and verification."""

    __tablename__ = "expert_validation_requests"
    __table_args__ = (
        Index("ix_val_req_farm_status", "farm_id", "status"),
        Index("ix_val_req_priority", "priority"),
        Index("ix_val_req_expert", "assigned_expert_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    case_number: Mapped[str] = mapped_column(
        String(20), default=lambda: f"EV-{datetime.utcnow().strftime('%y%m')}-{uuid.uuid4().hex[:4].upper()}", unique=True, index=True
    )
    diagnostic_case_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("diagnostic_cases.id", ondelete="CASCADE"), nullable=True, index=True
    )
    analysis_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    crop_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    # User who requested validation (Farmer or Government Officer)
    requested_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # Assigned agronomist / extension specialist
    assigned_expert_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    priority: Mapped[ValidationPriority] = mapped_column(
        Enum(ValidationPriority), default=ValidationPriority.MEDIUM, nullable=False, index=True
    )
    status: Mapped[ValidationRequestStatus] = mapped_column(
        Enum(ValidationRequestStatus), default=ValidationRequestStatus.PENDING, nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Evidence snapshots
    suspected_condition: Mapped[str] = mapped_column(String(150), default="Suspected Foliar Anomaly")
    ai_confidence: Mapped[float] = mapped_column(Float, default=0.75) # 0.0 to 1.0
    crop_growth_stage: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    symptoms: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    image_urls: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    weather_summary: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    hotspot_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    drone_observation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", foreign_keys=[farm_id])
    zone: Mapped[Optional["FarmZone"]] = relationship("FarmZone", foreign_keys=[zone_id])
    crop: Mapped[Optional["Crop"]] = relationship("Crop", foreign_keys=[crop_id])
    requester: Mapped["User"] = relationship("User", foreign_keys=[requested_by])
    assigned_expert: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_expert_id])
    
    validation_decisions: Mapped[List["ExpertValidationRecord"]] = relationship(
        "ExpertValidationRecord", back_populates="validation_request", cascade="all, delete-orphan"
    )
    diagnostic_case: Mapped["DiagnosticCase"] = relationship(
        "DiagnosticCase", back_populates="expert_requests"
    )

    @property
    def farm_name(self) -> Optional[str]:
        return self.farm.name if self.farm else "Green Valley Farm"

    @property
    def zone_name(self) -> Optional[str]:
        return self.zone.name if self.zone else (self.zone_id or "Zone A")

    @property
    def crop_name(self) -> Optional[str]:
        return self.crop.name if self.crop else (self.crop_id or "Tomato")

    @property
    def requester_name(self) -> Optional[str]:
        return getattr(self.requester, "full_name", None) or "Farmer"

    @property
    def assigned_expert_name(self) -> Optional[str]:
        return getattr(self.assigned_expert, "full_name", None) if self.assigned_expert else None


class ExpertValidationRecord(Base, TimestampMixin):
    """Ground truth decision issued by an authorized agricultural specialist."""

    __tablename__ = "expert_validation_records"
    __table_args__ = (
        Index("ix_exp_val_req", "validation_request_id"),
        Index("ix_exp_val_expert", "expert_user_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    validation_request_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("expert_validation_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expert_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    status: Mapped[ValidationRequestStatus] = mapped_column(
        Enum(ValidationRequestStatus), nullable=False, index=True
    )
    confirmed_condition: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    # Internal notes for government / extension archive
    expert_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Farmer-facing guidance in plain language
    farmer_guidance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    uncertain_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    validation_version: Mapped[str] = mapped_column(String(20), default="v1.0", nullable=False)
    validated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    validation_request: Mapped["ExpertValidationRequest"] = relationship(
        "ExpertValidationRequest", back_populates="validation_decisions"
    )
    expert_user: Mapped["User"] = relationship("User", foreign_keys=[expert_user_id])



