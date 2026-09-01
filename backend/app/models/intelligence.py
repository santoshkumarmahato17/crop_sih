import enum
import uuid
from datetime import datetime
from typing import List, Optional
from geoalchemy2 import Geometry
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


class RiskLevel(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    SEVERE = "severe"


class OutbreakStatus(str, enum.Enum):
    SUSPECTED = "suspected"
    CONFIRMED = "confirmed"
    CONTAINED = "contained"
    RESOLVED = "resolved"


class RecommendationType(str, enum.Enum):
    CHEMICAL_IPM = "chemical_ipm"
    BIOLOGICAL_IPM = "biological_ipm"
    CULTURAL_IPM = "cultural_ipm"
    IRRIGATION_PRIORITY = "irrigation_priority"
    SCOUTING_PRIORITY = "scouting_priority"


class RecommendationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RecommendationStatus(str, enum.Enum):
    PENDING = "pending"
    APPLIED = "applied"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ValidationStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    INCONCLUSIVE = "inconclusive"
    REVISED = "revised"


class RiskAssessment(Base, TimestampMixin):
    """Predictive pest, disease, and environmental water-stress outbreak risk forecasts."""

    __tablename__ = "risk_assessments"
    __table_args__ = (
        Index("ix_risk_assessments_farm_date", "farm_id", "assessment_date"),
        Index("ix_risk_assessments_zone_type", "zone_id", "risk_type"),
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

    assessment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    forecast_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    risk_type: Mapped[str] = mapped_column(String(50), default="DISEASE", nullable=False, index=True) # DISEASE, PEST, WATER_STRESS, OVERALL
    target_pathogen_or_pest: Mapped[str] = mapped_column(String(150), default="General Agronomic Risk", nullable=False, index=True)
    
    risk_score: Mapped[float] = mapped_column(Float, nullable=False) # 0.0 to 1.0 (or 0-100)
    score: Mapped[Optional[int]] = mapped_column(Integer, default=50, nullable=True) # 0 to 100 integer
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.MEDIUM, nullable=False, index=True)
    
    confidence: Mapped[float] = mapped_column(Float, default=0.85, nullable=False) # 0.0 to 1.0
    risk_factors: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    driving_factors: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technical_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    engine_version: Mapped[str] = mapped_column(String(50), default="weather-risk-v1", nullable=False)
    weather_data_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    forecast_window_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)



class DiseaseEvent(Base, TimestampMixin):
    """Active or historical crop pathology outbreak episode."""

    __tablename__ = "disease_events"
    __table_args__ = (
        Index("ix_disease_events_farm_pathogen", "farm_id", "pathogen_or_pest"),
        Index("ix_disease_events_status_date", "outbreak_status", "start_date"),
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

    event_name: Mapped[str] = mapped_column(String(150), nullable=False)
    pathogen_or_pest: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    outbreak_status: Mapped[OutbreakStatus] = mapped_column(
        Enum(OutbreakStatus), default=OutbreakStatus.SUSPECTED, nullable=False, index=True
    )

    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    resolved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # PostGIS Spatial Geometries (SRID 4326)
    epicenter: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    affected_boundary: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    estimated_damage_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="disease_events")
    spread_risks_as_source: Mapped[List["SpreadRisk"]] = relationship(
        "SpreadRisk", back_populates="source_disease_event", cascade="all, delete-orphan"
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation", back_populates="disease_event"
    )
    validations: Mapped[List["ExpertValidation"]] = relationship(
        "ExpertValidation", back_populates="disease_event"
    )


class SpreadRisk(Base, TimestampMixin):
    """Simulated contagion vector from an outbreak node to neighboring farm territory."""

    __tablename__ = "spread_risks"
    __table_args__ = (
        Index("ix_spread_risks_source_target", "source_farm_id", "target_farm_id"),
        Index("ix_spread_risks_timestamp", "calculation_timestamp"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    source_disease_event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("disease_events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )

    spread_probability: Mapped[float] = mapped_column(Float, nullable=False) # 0.0 - 1.0
    estimated_arrival_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # PostGIS Corridor Spatial Polygon (SRID 4326)
    risk_corridor: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    wind_vector_influence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    proximity_meters: Mapped[float] = mapped_column(Float, nullable=False)
    calculation_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    source_disease_event: Mapped["DiseaseEvent"] = relationship("DiseaseEvent", back_populates="spread_risks_as_source")


class Recommendation(Base, TimestampMixin):
    """Integrated Pest Management (IPM) or irrigation priority intervention."""

    __tablename__ = "recommendations"
    __table_args__ = (
        Index("ix_recommendations_farm_status", "farm_id", "status"),
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
    disease_event_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("disease_events.id", ondelete="SET NULL"), nullable=True, index=True
    )

    recommendation_type: Mapped[RecommendationType] = mapped_column(
        Enum(RecommendationType), default=RecommendationType.CULTURAL_IPM, nullable=False, index=True
    )
    priority: Mapped[RecommendationPriority] = mapped_column(
        Enum(RecommendationPriority), default=RecommendationPriority.MEDIUM, nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    action_items: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    dosage_or_rate: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    application_window_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    application_window_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[RecommendationStatus] = mapped_column(
        Enum(RecommendationStatus), default=RecommendationStatus.PENDING, nullable=False, index=True
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="recommendations")
    disease_event: Mapped[Optional["DiseaseEvent"]] = relationship("DiseaseEvent", back_populates="recommendations")


class ExpertValidation(Base, TimestampMixin):
    """Agronomist ground-truth review and model calibration record."""

    __tablename__ = "expert_validations"
    __table_args__ = (
        Index("ix_expert_validations_expert_date", "expert_user_id", "validated_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    health_observation_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_observations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    disease_observation_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("disease_observations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    disease_event_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("disease_events.id", ondelete="CASCADE"), nullable=True, index=True
    )
    expert_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    validation_status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus), default=ValidationStatus.CONFIRMED, nullable=False, index=True
    )
    revised_diagnosis: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    confidence_rating: Mapped[int] = mapped_column(Integer, default=5, nullable=False) # 1 to 5
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ground_truth_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    validated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    expert_user: Mapped["User"] = relationship("User", back_populates="validations")
    health_observation: Mapped[Optional["HealthObservation"]] = relationship("HealthObservation", back_populates="validations")
    disease_observation: Mapped[Optional["DiseaseObservation"]] = relationship("DiseaseObservation", back_populates="validations")
    disease_event: Mapped[Optional["DiseaseEvent"]] = relationship("DiseaseEvent", back_populates="validations")
