import enum
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Boolean,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class AdvisoryType(str, enum.Enum):
    DISEASE_ADVISORY = "DISEASE_ADVISORY"
    PEST_ADVISORY = "PEST_ADVISORY"
    WATER_STRESS_ADVISORY = "WATER_STRESS_ADVISORY"
    WEATHER_RISK_ADVISORY = "WEATHER_RISK_ADVISORY"
    MONITORING_ADVISORY = "MONITORING_ADVISORY"
    PREVENTIVE_ADVISORY = "PREVENTIVE_ADVISORY"
    EXPERT_VALIDATION_ADVISORY = "EXPERT_VALIDATION_ADVISORY"
    LAB_REFERRAL_ADVISORY = "LAB_REFERRAL_ADVISORY"


class AdvisoryPriority(str, enum.Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AdvisorySource(str, enum.Enum):
    AI = "AI"
    EXPERT = "EXPERT"
    SYSTEM_RULE = "SYSTEM_RULE"
    LAB_RESULT = "LAB_RESULT"


class AdvisoryTemplate(Base, TimestampMixin):
    """Reusable, localized agronomic advisory template for IPM and climate risk."""

    __tablename__ = "advisory_templates"
    __table_args__ = (
        Index("ix_adv_tmpl_type_lang", "advisory_type", "language"),
        Index("ix_adv_tmpl_priority", "priority"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    advisory_type: Mapped[AdvisoryType] = mapped_column(
        Enum(AdvisoryType), nullable=False, index=True
    )
    priority: Mapped[AdvisoryPriority] = mapped_column(
        Enum(AdvisoryPriority), default=AdvisoryPriority.MEDIUM, nullable=False
    )
    crop_filter: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "Cotton", "Tomato" or None for all
    growth_stage_filter: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False, index=True) # en, ta, hi, mr
    
    title_template: Mapped[str] = mapped_column(String(255), nullable=False)
    summary_template: Mapped[str] = mapped_column(Text, nullable=False)
    why_this_matters_template: Mapped[str] = mapped_column(Text, nullable=False)
    what_to_do_now: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    what_to_monitor: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    what_to_avoid: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    when_to_seek_expert_help: Mapped[str] = mapped_column(Text, nullable=False)
    safety_warnings: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    
    version: Mapped[str] = mapped_column(String(20), default="v1.0", nullable=False)


class Advisory(Base, TimestampMixin):
    """Context-specific localized advisory issued to a farmer or extension officer."""

    __tablename__ = "advisories"
    __table_args__ = (
        Index("ix_advisories_farm_created", "farm_id", "created_at"),
        Index("ix_advisories_priority", "priority"),
        Index("ix_advisories_trust", "trust_level"),
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
    crop_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    validation_request_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("expert_validation_requests.id", ondelete="SET NULL"), nullable=True, index=True
    )
    risk_assessment_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("risk_assessments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    advisory_type: Mapped[AdvisoryType] = mapped_column(
        Enum(AdvisoryType), default=AdvisoryType.DISEASE_ADVISORY, nullable=False, index=True
    )
    priority: Mapped[AdvisoryPriority] = mapped_column(
        Enum(AdvisoryPriority), default=AdvisoryPriority.MEDIUM, nullable=False
    )
    source: Mapped[AdvisorySource] = mapped_column(
        Enum(AdvisorySource), default=AdvisorySource.AI, nullable=False, index=True
    )
    
    # 1: AI Signal (Suspected), 2: Multi-Signal Risk, 3: Expert Validated, 4: Lab Confirmed
    trust_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False, index=True)

    condition_name: Mapped[str] = mapped_column(String(150), default="Agronomic Alert")
    crop_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zone_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="v1.0", nullable=False)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", foreign_keys=[farm_id])
    zone: Mapped[Optional["FarmZone"]] = relationship("FarmZone", foreign_keys=[zone_id])
    crop: Mapped[Optional["Crop"]] = relationship("Crop", foreign_keys=[crop_id])
    validation_request: Mapped[Optional["ExpertValidationRequest"]] = relationship(
        "ExpertValidationRequest", foreign_keys=[validation_request_id]
    )
    translations: Mapped[List["AdvisoryTranslation"]] = relationship(
        "AdvisoryTranslation", back_populates="advisory", cascade="all, delete-orphan"
    )


class AdvisoryTranslation(Base, TimestampMixin):
    """Language-specific rendering of an advisory."""

    __tablename__ = "advisory_translations"
    __table_args__ = (
        Index("ix_adv_trans_adv_lang", "advisory_id", "language", unique=True),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    advisory_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("advisories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, index=True) # en, ta, hi, mr
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    why_this_matters: Mapped[str] = mapped_column(Text, nullable=False)
    
    what_to_do_now: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    what_to_monitor: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    what_to_avoid: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    when_to_seek_expert_help: Mapped[str] = mapped_column(Text, nullable=False)
    safety_warnings: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    
    # Technical explanation for extension officers / agronomists
    technical_breakdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Clean natural language for text-to-speech
    audio_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    advisory: Mapped["Advisory"] = relationship("Advisory", back_populates="translations")
