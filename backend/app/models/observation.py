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
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class HealthTrend(str, enum.Enum):
    IMPROVING = "improving"
    STABLE = "stable"
    DETERIORATING = "deteriorating"


class PathogenType(str, enum.Enum):
    FUNGAL = "fungal"
    BACTERIAL = "bacterial"
    VIRAL = "viral"
    NEMATODE = "nematode"
    PHYSIOLOGICAL = "physiological"


class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class InfestationLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"


class WaterStressCategory(str, enum.Enum):
    NONE = "none"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


class HealthObservation(Base, TimestampMixin):
    """Zonal or point-level canopy health index measurements."""

    __tablename__ = "health_observations"
    __table_args__ = (
        Index("ix_health_obs_farm_date", "farm_id", "observation_date"),
        Index("ix_health_obs_zone_date", "zone_id", "observation_date"),
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
    mission_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("drone_missions.id", ondelete="SET NULL"), nullable=True, index=True
    )

    observation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # PostGIS Spatial Geometries (SRID 4326)
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    affected_polygon: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    mean_ndvi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mean_ndre: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mean_canopy_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    overall_health_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False) # 0.0 to 1.0

    trend: Mapped[HealthTrend] = mapped_column(
        Enum(HealthTrend), default=HealthTrend.STABLE, nullable=False, index=True
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="health_observations")
    zone: Mapped[Optional["FarmZone"]] = relationship("FarmZone", back_populates="health_observations")
    mission: Mapped[Optional["DroneMission"]] = relationship("DroneMission", back_populates="health_observations")
    disease_observations: Mapped[List["DiseaseObservation"]] = relationship("DiseaseObservation", back_populates="health_observation", cascade="all, delete-orphan")
    pest_observations: Mapped[List["PestObservation"]] = relationship("PestObservation", back_populates="health_observation", cascade="all, delete-orphan")
    water_stress_observations: Mapped[List["WaterStressObservation"]] = relationship("WaterStressObservation", back_populates="health_observation", cascade="all, delete-orphan")
    validations: Mapped[List["ExpertValidation"]] = relationship("ExpertValidation", back_populates="health_observation")


class DiseaseObservation(Base, TimestampMixin):
    """Specific plant pathology detected by AI vision models or ground scouting."""

    __tablename__ = "disease_observations"
    __table_args__ = (
        Index("ix_disease_obs_farm_name", "farm_id", "disease_name"),
        Index("ix_disease_obs_severity", "severity_level", "observation_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    health_observation_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_observations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )

    disease_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    pathogen_type: Mapped[PathogenType] = mapped_column(
        Enum(PathogenType), default=PathogenType.FUNGAL, nullable=False
    )
    severity_level: Mapped[SeverityLevel] = mapped_column(
        Enum(SeverityLevel), default=SeverityLevel.LOW, nullable=False, index=True
    )
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # PostGIS Spatial Location (SRID 4326)
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )

    bounding_box: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    observation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    health_observation: Mapped[Optional["HealthObservation"]] = relationship("HealthObservation", back_populates="disease_observations")
    validations: Mapped[List["ExpertValidation"]] = relationship("ExpertValidation", back_populates="disease_observation")


class PestObservation(Base, TimestampMixin):
    """Insect or nematode pest infestation event detected on crop."""

    __tablename__ = "pest_observations"
    __table_args__ = (
        Index("ix_pest_obs_farm_date", "farm_id", "observation_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    health_observation_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_observations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )

    pest_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    infestation_level: Mapped[InfestationLevel] = mapped_column(
        Enum(InfestationLevel), default=InfestationLevel.LOW, nullable=False, index=True
    )
    affected_area_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # PostGIS Spatial Location (SRID 4326)
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    observation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    health_observation: Mapped[Optional["HealthObservation"]] = relationship("HealthObservation", back_populates="pest_observations")


class WaterStressObservation(Base, TimestampMixin):
    """Crop water deficit and stomatal conductance stress observation."""

    __tablename__ = "water_stress_observations"
    __table_args__ = (
        Index("ix_water_stress_farm_date", "farm_id", "observation_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    health_observation_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_observations.id", ondelete="CASCADE"), nullable=True, index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )

    cwsi_index: Mapped[float] = mapped_column(Float, nullable=False) # 0.0 - 1.0 Crop Water Stress Index
    canopy_air_temp_diff_c: Mapped[float] = mapped_column(Float, nullable=False)
    stress_category: Mapped[WaterStressCategory] = mapped_column(
        Enum(WaterStressCategory), default=WaterStressCategory.NONE, nullable=False, index=True
    )

    # PostGIS Spatial Location (SRID 4326)
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    observation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    health_observation: Mapped[Optional["HealthObservation"]] = relationship("HealthObservation", back_populates="water_stress_observations")


class WeatherObservation(Base, TimestampMixin):
    """In-situ weather station or microclimate reanalysis observation."""

    __tablename__ = "weather_observations"
    __table_args__ = (
        Index("ix_weather_obs_farm_time", "farm_id", "observation_time"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # PostGIS Station Location (SRID 4326)
    location: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    observation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    relative_humidity_percent: Mapped[float] = mapped_column(Float, nullable=False)
    wind_speed_mps: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    wind_direction_deg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rainfall_mm: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    solar_radiation_w_m2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    leaf_wetness_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="on_farm_station", nullable=False)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="weather_observations")
