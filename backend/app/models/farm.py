import enum
import uuid
from datetime import date
from typing import List, Optional
from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    MANAGER = "manager"
    AGRONOMIST = "agronomist"
    SCOUT = "scout"
    WORKER = "worker"


class CropCycleStatus(str, enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    HARVESTED = "harvested"
    TERMINATED = "terminated"


class Farm(Base, TimestampMixin):
    """Agricultural holding entity with geographic boundaries."""

    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # PostGIS Spatial Boundaries (SRID 4326)
    boundary: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326, spatial_index=True),
        nullable=False,
    )
    center_point: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )

    total_area_hectares: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    elevation_meters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False, index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_farms", foreign_keys=[owner_id])
    members: Mapped[List["FarmMember"]] = relationship("FarmMember", back_populates="farm", cascade="all, delete-orphan")
    zones: Mapped[List["FarmZone"]] = relationship("FarmZone", back_populates="farm", cascade="all, delete-orphan")
    crop_cycles: Mapped[List["CropCycle"]] = relationship("CropCycle", back_populates="farm", cascade="all, delete-orphan")
    drone_missions: Mapped[List["DroneMission"]] = relationship("DroneMission", back_populates="farm", cascade="all, delete-orphan")
    health_observations: Mapped[List["HealthObservation"]] = relationship("HealthObservation", back_populates="farm", cascade="all, delete-orphan")
    weather_observations: Mapped[List["WeatherObservation"]] = relationship("WeatherObservation", back_populates="farm", cascade="all, delete-orphan")
    disease_events: Mapped[List["DiseaseEvent"]] = relationship("DiseaseEvent", back_populates="farm", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="farm", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="farm", cascade="all, delete-orphan")
    field_sensors: Mapped[List["FieldSensor"]] = relationship("FieldSensor", cascade="all, delete-orphan")
    pest_traps: Mapped[List["PestTrap"]] = relationship("PestTrap", cascade="all, delete-orphan")


class FarmMember(Base, TimestampMixin):
    """Association between User and Farm with assigned operational permissions."""

    __tablename__ = "farm_members"
    __table_args__ = (
        UniqueConstraint("farm_id", "user_id", name="uq_farm_user_membership"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role_in_farm: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole), default=MemberRole.WORKER, nullable=False
    )
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="farm_memberships")


class Crop(Base, TimestampMixin):
    """Crop taxonomy and agronomic growth profiles."""

    __tablename__ = "crops"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    common_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    scientific_name: Mapped[str] = mapped_column(String(150), nullable=False)
    variety: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    optimal_temp_min_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    optimal_temp_max_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    optimal_soil_moisture_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    optimal_soil_moisture_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    typical_growing_days: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    growth_stages: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)

    # Relationships
    crop_cycles: Mapped[List["CropCycle"]] = relationship("CropCycle", back_populates="crop")


class CropCycle(Base, TimestampMixin):
    """Seasonal planting instance of a crop on a farm."""

    __tablename__ = "crop_cycles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    crop_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("crops.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    planting_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    expected_harvest_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_harvest_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[CropCycleStatus] = mapped_column(
        Enum(CropCycleStatus), default=CropCycleStatus.ACTIVE, nullable=False, index=True
    )

    target_yield_tonnes_per_hectare: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_yield_tonnes_per_hectare: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="crop_cycles")
    crop: Mapped["Crop"] = relationship("Crop", back_populates="crop_cycles")
    zones: Mapped[List["FarmZone"]] = relationship("FarmZone", back_populates="crop_cycle")


class FarmZone(Base, TimestampMixin):
    """Subdivided topological monitoring plot within a farm."""

    __tablename__ = "farm_zones"
    __table_args__ = (
        UniqueConstraint("farm_id", "zone_code", name="uq_farm_zone_code"),
        Index("ix_farm_zones_farm_active", "farm_id", "is_active"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    crop_cycle_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("crop_cycles.id", ondelete="SET NULL"), nullable=True, index=True
    )

    zone_code: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # PostGIS Spatial Polygon Boundary (SRID 4326)
    boundary: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=False,
    )
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    soil_profile: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    irrigation_type: Mapped[Optional[str]] = mapped_column(String(50), default="drip", nullable=True)
    monitoring_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    health_status: Mapped[str] = mapped_column(String(50), default="healthy", nullable=False)
    risk_status: Mapped[str] = mapped_column(String(50), default="low", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="zones")
    crop_cycle: Mapped[Optional["CropCycle"]] = relationship("CropCycle", back_populates="zones")
    health_observations: Mapped[List["HealthObservation"]] = relationship(
        "HealthObservation", back_populates="zone", cascade="all, delete-orphan"
    )
    field_sensors: Mapped[List["FieldSensor"]] = relationship("FieldSensor", cascade="all, delete-orphan")
    pest_traps: Mapped[List["PestTrap"]] = relationship("PestTrap", cascade="all, delete-orphan")
