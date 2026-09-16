import enum
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class DiagnosticSourceType(str, enum.Enum):
    FARMER_IMAGE = "FARMER_IMAGE"
    EXTENSION_IMAGE = "EXTENSION_IMAGE"
    DRONE_OBSERVATION = "DRONE_OBSERVATION"
    FIELD_INSPECTION = "FIELD_INSPECTION"
    SENSOR_EVENT = "SENSOR_EVENT"
    PEST_TRAP = "PEST_TRAP"

class AIStatus(str, enum.Enum):
    PENDING = "PENDING"
    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    NO_ISSUE_DETECTED = "NO_ISSUE_DETECTED"
    FAILED = "FAILED"

class ExpertStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VALIDATED = "VALIDATED"
    LAB_REFERRAL_REQUIRED = "LAB_REFERRAL_REQUIRED"
    NOT_REQUIRED = "NOT_REQUIRED"

class LabStatus(str, enum.Enum):
    NOT_REQUESTED = "NOT_REQUESTED"
    REFERRAL_PENDING = "REFERRAL_PENDING"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED"
    TESTING = "TESTING"
    RESULT_AVAILABLE = "RESULT_AVAILABLE"
    CONFIRMED = "CONFIRMED"
    INCONCLUSIVE = "INCONCLUSIVE"
    REJECTED = "REJECTED"

class FinalStatus(str, enum.Enum):
    PENDING = "PENDING"
    AI_PREDICTED = "AI_PREDICTED"
    EXPERT_VALIDATED = "EXPERT_VALIDATED"
    LAB_CONFIRMED = "LAB_CONFIRMED"
    RESOLVED_NO_ISSUE = "RESOLVED_NO_ISSUE"

class DiagnosticCase(Base, TimestampMixin):
    """
    Unified entity serving as the root for all diagnostic evidence (AI, Expert, Laboratory).
    Ensures complete traceability and separates AI predictions from Laboratory confirmations.
    """
    __tablename__ = "diagnostic_cases"
    __table_args__ = (
        Index("ix_diag_case_farm", "farm_id"),
        Index("ix_diag_case_zone", "zone_id"),
        Index("ix_diag_case_status", "final_status"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=True, index=True
    )
    
    crop: Mapped[str] = mapped_column(String(100), nullable=False)
    crop_stage: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    source_type: Mapped[DiagnosticSourceType] = mapped_column(
        Enum(DiagnosticSourceType), default=DiagnosticSourceType.FARMER_IMAGE, nullable=False
    )
    source_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # State Machine Tracking
    ai_status: Mapped[AIStatus] = mapped_column(Enum(AIStatus), default=AIStatus.PENDING, nullable=False)
    expert_status: Mapped[ExpertStatus] = mapped_column(Enum(ExpertStatus), default=ExpertStatus.PENDING, nullable=False)
    lab_status: Mapped[LabStatus] = mapped_column(Enum(LabStatus), default=LabStatus.NOT_REQUESTED, nullable=False)
    final_status: Mapped[FinalStatus] = mapped_column(Enum(FinalStatus), default=FinalStatus.PENDING, nullable=False)

    # Final conclusions
    final_condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", foreign_keys=[farm_id])
    zone: Mapped[Optional["FarmZone"]] = relationship("FarmZone", foreign_keys=[zone_id])
    
    ai_analysis: Mapped[Optional["DiagnosisAnalysis"]] = relationship(
        "DiagnosisAnalysis", back_populates="diagnostic_case", uselist=False, cascade="all, delete-orphan"
    )
    expert_requests: Mapped[List["ExpertValidationRequest"]] = relationship(
        "ExpertValidationRequest", back_populates="diagnostic_case", cascade="all, delete-orphan"
    )
    lab_referrals: Mapped[List["LabReferral"]] = relationship(
        "LabReferral", back_populates="diagnostic_case", cascade="all, delete-orphan"
    )
