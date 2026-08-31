import enum
import uuid
from datetime import datetime
from typing import List, Optional
from geoalchemy2 import Geometry
from sqlalchemy import (
    BigInteger,
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


class DroneStatus(str, enum.Enum):
    IDLE = "idle"
    IN_MISSION = "in_mission"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class MissionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ImageType(str, enum.Enum):
    RGB = "rgb"
    MULTISPECTRAL = "multispectral"
    THERMAL = "thermal"
    NDVI = "ndvi"
    NDRE = "ndre"


class JobType(str, enum.Enum):
    ORTHOMOSAIC_GENERATION = "orthomosaic_generation"
    NDVI_CALCULATION = "ndvi_calculation"
    NDRE_CALCULATION = "ndre_calculation"
    THERMAL_CALIBRATION = "thermal_calibration"
    ANOMALY_SEGMENTATION = "anomaly_segmentation"


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Drone(Base, TimestampMixin):
    """Unmanned aerial vehicle hardware unit and payload metadata."""

    __tablename__ = "drones"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    name: Mapped[str] = mapped_column(String(150), default="AgriDrone Pro", nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    manufacturer: Mapped[str] = mapped_column(String(100), default="DJI Enterprise", nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    camera_type: Mapped[str] = mapped_column(String(100), default="Multispectral + RGB", nullable=False)
    sensor_types: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)
    sensor_capabilities: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)
    battery_percentage: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    battery_cycle_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    operational_status: Mapped[str] = mapped_column(String(50), default="AVAILABLE", nullable=False)
    status: Mapped[DroneStatus] = mapped_column(
        Enum(DroneStatus), default=DroneStatus.IDLE, nullable=False, index=True
    )

    # Relationships
    missions: Mapped[List["DroneMission"]] = relationship("DroneMission", back_populates="drone")


class DroneMission(Base, TimestampMixin):
    """Autonomous monitoring flight executed over farm territory."""

    __tablename__ = "drone_missions"
    __table_args__ = (
        Index("ix_drone_missions_farm_date", "farm_id", "mission_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    drone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("drones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    operator_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Spatial Flight Path / Boundary (SRID 4326)
    flight_boundary: Mapped[Geometry] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=False,
    )

    mission_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    altitude_meters: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    flight_speed_mps: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    overlap_percentage: Mapped[float] = mapped_column(Float, default=75.0, nullable=False)
    coverage_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="NORMAL", nullable=False)
    target_zones: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)
    weather_conditions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    status: Mapped[MissionStatus] = mapped_column(
        Enum(MissionStatus), default=MissionStatus.SCHEDULED, nullable=False, index=True
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="drone_missions")
    drone: Mapped[Optional["Drone"]] = relationship("Drone", back_populates="missions")
    operator: Mapped[Optional["User"]] = relationship("User", back_populates="drone_missions")
    images: Mapped[List["DroneImage"]] = relationship("DroneImage", back_populates="mission", cascade="all, delete-orphan")
    processing_jobs: Mapped[List["ImageProcessingJob"]] = relationship("ImageProcessingJob", back_populates="mission", cascade="all, delete-orphan")
    health_observations: Mapped[List["HealthObservation"]] = relationship("HealthObservation", back_populates="mission")


class DroneImage(Base, TimestampMixin):
    """Raw and processed imagery frames captured during missions."""

    __tablename__ = "drone_images"
    __table_args__ = (
        Index("ix_drone_images_mission_capture", "mission_id", "capture_time"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    mission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("drone_missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    farm_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=True, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )

    filename: Mapped[str] = mapped_column(String(255), default="image.jpg", nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), default="image/jpeg", nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    sensor_type: Mapped[str] = mapped_column(String(50), default="RGB", nullable=False)
    image_type: Mapped[ImageType] = mapped_column(
        Enum(ImageType), default=ImageType.RGB, nullable=False, index=True
    )
    processing_status: Mapped[str] = mapped_column(
        String(50), default="UPLOADED", nullable=False, index=True
    )
    capture_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Spatial Coordinates (SRID 4326)
    location: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )
    footprint: Mapped[Optional[Geometry]] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=True,
    )

    altitude_agl_meters: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    camera_pitch: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    camera_roll: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    camera_yaw: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    resolution_cm_per_pixel: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    # Relationships
    mission: Mapped["DroneMission"] = relationship("DroneMission", back_populates="images")
    farm: Mapped[Optional["Farm"]] = relationship("Farm")
    zone: Mapped[Optional["FarmZone"]] = relationship("FarmZone")


class ImageProcessingJob(Base, TimestampMixin):
    """Background raster processing job executing via Celery."""

    __tablename__ = "image_processing_jobs"
    __table_args__ = (
        Index("ix_image_processing_jobs_mission_status", "mission_id", "status"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    mission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("drone_missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_type: Mapped[JobType] = mapped_column(Enum(JobType), nullable=False, index=True)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), default=JobStatus.QUEUED, nullable=False, index=True
    )

    progress_percent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    output_artifacts: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    mission: Mapped["DroneMission"] = relationship("DroneMission", back_populates="processing_jobs")
