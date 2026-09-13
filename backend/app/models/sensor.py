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
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class SensorType(str, enum.Enum):
    SOIL_MOISTURE = "SOIL_MOISTURE"
    TEMPERATURE = "TEMPERATURE"
    HUMIDITY = "HUMIDITY"
    SOIL_TEMPERATURE = "SOIL_TEMPERATURE"
    LEAF_WETNESS = "LEAF_WETNESS"
    OTHER = "OTHER"

class TrapType(str, enum.Enum):
    STICKY_TRAP = "STICKY_TRAP"
    PHEROMONE_TRAP = "PHEROMONE_TRAP"
    LIGHT_TRAP = "LIGHT_TRAP"
    MANUAL_COUNT = "MANUAL_COUNT"
    OTHER = "OTHER"

class DataQualityStatus(str, enum.Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    QUALITY_WARNING = "QUALITY_WARNING"

class FreshnessStatus(str, enum.Enum):
    CURRENT = "CURRENT"
    RECENT = "RECENT"
    STALE = "STALE"
    MISSING = "MISSING"

class FieldSensor(Base, TimestampMixin):
    """IoT Field Sensor Deployment."""
    __tablename__ = "field_sensors"
    __table_args__ = (
        Index("ix_sensor_farm_zone", "farm_id", "zone_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    sensor_type: Mapped[SensorType] = mapped_column(Enum(SensorType), nullable=False)
    
    # PostGIS Location
    location: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )
    
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    source_device_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    readings: Mapped[List["FieldSensorReading"]] = relationship("FieldSensorReading", back_populates="sensor", cascade="all, delete-orphan")


class FieldSensorReading(Base, TimestampMixin):
    """Observation logged from an IoT Field Sensor."""
    __tablename__ = "field_sensor_readings"
    __table_args__ = (
        Index("ix_reading_sensor_time", "sensor_id", "timestamp"),
        Index("ix_reading_farm_zone_time", "farm_id", "zone_id", "timestamp"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    sensor_id: Mapped[str] = mapped_column(String(36), ForeignKey("field_sensors.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    
    sensor_type: Mapped[SensorType] = mapped_column(Enum(SensorType), nullable=False)
    measurement: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    quality_status: Mapped[DataQualityStatus] = mapped_column(Enum(DataQualityStatus), default=DataQualityStatus.VALID, nullable=False)
    freshness: Mapped[FreshnessStatus] = mapped_column(Enum(FreshnessStatus), default=FreshnessStatus.CURRENT, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="API", nullable=False)

    sensor: Mapped["FieldSensor"] = relationship("FieldSensor", back_populates="readings")


class PestTrap(Base, TimestampMixin):
    """Field Pest Trap for vector surveillance."""
    __tablename__ = "pest_traps"
    __table_args__ = (
        Index("ix_trap_farm_zone", "farm_id", "zone_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    trap_type: Mapped[TrapType] = mapped_column(Enum(TrapType), nullable=False)
    
    # PostGIS Location
    location: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )
    
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    observations: Mapped[List["PestTrapObservation"]] = relationship("PestTrapObservation", back_populates="trap", cascade="all, delete-orphan")


class PestTrapObservation(Base, TimestampMixin):
    """Observation count recorded from a Pest Trap."""
    __tablename__ = "pest_trap_observations"
    __table_args__ = (
        Index("ix_trapobs_trap_time", "trap_id", "observation_time"),
        Index("ix_trapobs_farm_zone_time", "farm_id", "zone_id", "observation_time"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    trap_id: Mapped[str] = mapped_column(String(36), ForeignKey("pest_traps.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id: Mapped[str] = mapped_column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    
    pest_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    observation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    observer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    quality_status: Mapped[DataQualityStatus] = mapped_column(Enum(DataQualityStatus), default=DataQualityStatus.VALID, nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="MANUAL", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    trap: Mapped["PestTrap"] = relationship("PestTrap", back_populates="observations")
