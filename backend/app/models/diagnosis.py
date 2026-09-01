import enum
import uuid
from datetime import datetime
from typing import List, Optional
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
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DiagnosisStatus(str, enum.Enum):
    AI_SUSPECTED = "AI_SUSPECTED"
    EXPERT_CONFIRMED = "EXPERT_CONFIRMED"
    EXPERT_REJECTED = "EXPERT_REJECTED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"


class SymptomSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    SEVERE = "SEVERE"


class SymptomDistribution(str, enum.Enum):
    SINGLE_PLANT = "Single plant"
    SMALL_GROUP = "Small group of plants"
    ONE_SECTION = "One section of the zone"
    MOST_OF_ZONE = "Most of the zone"
    ENTIRE_FARM = "Entire farm"


class ValidationRequestStatus(str, enum.Enum):
    NOT_REQUESTED = "NOT_REQUESTED"
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    UNCERTAIN = "UNCERTAIN"
    LAB_REFERRAL = "LAB_REFERRAL"


class DiagnosisAnalysis(Base, TimestampMixin):
    """
    Symptom-based crop disease identification and agronomic analysis session.
    Persists structured symptoms, visual imagery, AI reasoning, and expert validation.
    """

    __tablename__ = "diagnosis_analyses"
    __table_args__ = (
        Index("ix_diagnosis_farm_zone", "farm_id", "zone_id"),
        Index("ix_diagnosis_user_created", "user_id", "created_at"),
        Index("ix_diagnosis_crop_status", "crop_type", "status"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    crop_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True
    )

    # Contextual Crop & Field Attributes
    crop_type: Mapped[str] = mapped_column(String(100), nullable=False)
    growth_stage: Mapped[str] = mapped_column(String(100), nullable=False)
    plant_parts: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # e.g. ["Leaf", "Stem"]
    severity: Mapped[SymptomSeverity] = mapped_column(Enum(SymptomSeverity), default=SymptomSeverity.MEDIUM, nullable=False)
    distribution: Mapped[str] = mapped_column(String(100), default="One section of the zone", nullable=False)
    symptom_start_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "4-7 days ago" or ISO date
    farmer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional Field Context
    recent_pesticide_fungicide: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    recent_fertilizer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    recent_irrigation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    recent_rainfall: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    visible_insects: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    recent_unusual_weather: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    other_observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # AI Reasoning & Diagnosis Results
    status: Mapped[DiagnosisStatus] = mapped_column(
        Enum(DiagnosisStatus), default=DiagnosisStatus.AI_SUSPECTED, nullable=False, index=True
    )
    ai_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # 0.0 to 1.0 (e.g. 0.78 for 78%)
    ai_model_name: Mapped[str] = mapped_column(String(100), default="AgriShield-SymptomReasoner-v1.0", nullable=False)
    ai_model_version: Mapped[str] = mapped_column(String(50), default="1.0.0-prototype", nullable=False)
    is_prototype: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    primary_condition: Mapped[str] = mapped_column(String(200), nullable=False)
    possible_conditions: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # ranked candidate list
    reasoning_points: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # "Why was this flagged?" explainability points

    # Spatial & Historical Telemetry Snapshot at time of diagnosis
    zone_status_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    historical_comparison: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    neighboring_zone_analysis: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Actionable Integrated Pest Management (IPM) & Follow-up
    recommendations: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    follow_up_monitoring: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Expert Validation Workflow
    validation_status: Mapped[ValidationRequestStatus] = mapped_column(
        Enum(ValidationRequestStatus), default=ValidationRequestStatus.NOT_REQUESTED, nullable=False, index=True
    )
    expert_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    expert_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revised_diagnosis: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    validated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    symptoms: Mapped[List["DiagnosisSymptom"]] = relationship(
        "DiagnosisSymptom", back_populates="analysis", cascade="all, delete-orphan"
    )
    images: Mapped[List["DiagnosisImage"]] = relationship(
        "DiagnosisImage", back_populates="analysis", cascade="all, delete-orphan"
    )


class DiagnosisSymptom(Base, TimestampMixin):
    """Normalized individual symptom recorded during diagnosis."""

    __tablename__ = "diagnosis_symptoms"
    __table_args__ = (
        Index("ix_diagnosis_symptoms_analysis_cat", "analysis_id", "category"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("diagnosis_analyses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "Leaf Symptoms", "Stem Symptoms"
    symptom_name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Yellowing", "Browning", "Spots"

    # Relationships
    analysis: Mapped["DiagnosisAnalysis"] = relationship("DiagnosisAnalysis", back_populates="symptoms")


class DiagnosisImage(Base, TimestampMixin):
    """Visual evidence plant image uploaded during diagnosis."""

    __tablename__ = "diagnosis_images"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("diagnosis_analyses.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    visual_abnormalities_detected: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    affected_regions: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    analysis: Mapped["DiagnosisAnalysis"] = relationship("DiagnosisAnalysis", back_populates="images")
