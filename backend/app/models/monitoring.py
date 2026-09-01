"""
AGRI SHIELD — Follow-up Monitoring & Closed-Loop Crop Health Tracking Data Models.
Tracks monitoring tasks, observations, before vs after comparisons, targeted drone
recommendations, and dynamic monitoring policies.
"""

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
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class MonitoringTriggerType(str, enum.Enum):
    DISEASE_RISK = "DISEASE_RISK"
    PEST_RISK = "PEST_RISK"
    WATER_STRESS = "WATER_STRESS"
    HOTSPOT = "HOTSPOT"
    EXPERT_REQUEST = "EXPERT_REQUEST"
    FARMER_REQUEST = "FARMER_REQUEST"
    DRONE_ALERT = "DRONE_ALERT"
    WEATHER_RISK = "WEATHER_RISK"
    LAB_FOLLOWUP = "LAB_FOLLOWUP"


class MonitoringPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class MonitoringMethod(str, enum.Enum):
    DRONE = "DRONE"
    FIELD_INSPECTION = "FIELD_INSPECTION"
    FARMER_IMAGE = "FARMER_IMAGE"
    SENSOR = "SENSOR"
    SATELLITE = "SATELLITE"
    EXPERT_VISIT = "EXPERT_VISIT"


class MonitoringTaskStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    MISSED = "MISSED"
    CANCELLED = "CANCELLED"
    ESCALATED = "ESCALATED"


class MonitoringTrend(str, enum.Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    WORSENING = "WORSENING"
    SPREADING = "SPREADING"
    UNCERTAIN = "UNCERTAIN"


class HotspotTrendStatus(str, enum.Enum):
    NEW = "NEW"
    STABLE = "STABLE"
    EXPANDING = "EXPANDING"
    CONTRACTING = "CONTRACTING"
    RESOLVED = "RESOLVED"
    REACTIVATED = "REACTIVATED"


class MonitoringPolicyConfig(Base, TimestampMixin):
    """Configurable turnaround intervals and policies for monitoring."""

    __tablename__ = "monitoring_policy_configs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    critical_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    high_hours: Mapped[int] = mapped_column(Integer, default=48, nullable=False)
    medium_days: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    low_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    enable_auto_escalation: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    buffer_zone_expansion: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class MonitoringTask(Base, TimestampMixin):
    """Scheduled or in-progress crop-health follow-up monitoring task."""

    __tablename__ = "monitoring_tasks"
    __table_args__ = (
        Index("ix_mon_task_farm_status", "farm_id", "status"),
        Index("ix_mon_task_zone", "zone_id"),
        Index("ix_mon_task_scheduled", "scheduled_at"),
        Index("ix_mon_task_priority", "priority"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    task_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )

    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    crop_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True
    )

    # Triggering entity context
    trigger_type: Mapped[MonitoringTriggerType] = mapped_column(
        Enum(MonitoringTriggerType), nullable=False, index=True
    )
    trigger_entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    suspected_condition: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    
    # Priority & Turnaround
    priority: Mapped[MonitoringPriority] = mapped_column(
        Enum(MonitoringPriority), default=MonitoringPriority.MEDIUM, nullable=False, index=True
    )
    monitoring_method: Mapped[MonitoringMethod] = mapped_column(
        Enum(MonitoringMethod), default=MonitoringMethod.DRONE, nullable=False, index=True
    )
    status: Mapped[MonitoringTaskStatus] = mapped_column(
        Enum(MonitoringTaskStatus), default=MonitoringTaskStatus.SCHEDULED, nullable=False, index=True
    )

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Targeted zones list and spatial buffer
    target_zone_ids: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Initial baseline snapshot metrics
    baseline_health_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_disease_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_affected_area_ha: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", foreign_keys=[farm_id])
    zone: Mapped[Optional["FarmZone"]] = relationship("FarmZone", foreign_keys=[zone_id])
    crop: Mapped[Optional["Crop"]] = relationship("Crop", foreign_keys=[crop_id])
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to])
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])

    results: Mapped[List["MonitoringResult"]] = relationship(
        "MonitoringResult", back_populates="task", cascade="all, delete-orphan"
    )


class MonitoringResult(Base, TimestampMixin):
    """Outcome and quantitative measurements captured during follow-up inspection."""

    __tablename__ = "monitoring_results"
    __table_args__ = (
        Index("ix_mon_res_task", "monitoring_task_id"),
        Index("ix_mon_res_farm_zone", "farm_id", "zone_id"),
        Index("ix_mon_res_trend", "trend"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    monitoring_task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("monitoring_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    observation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Measured Telemetry
    health_score: Mapped[float] = mapped_column(Float, nullable=False) # 0 to 100
    disease_risk: Mapped[float] = mapped_column(Float, nullable=False) # 0 to 100
    pest_risk: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    water_stress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # 0.0 to 1.0 CWSI
    affected_area_ha: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    severity: Mapped[str] = mapped_column(String(50), default="MODERATE", nullable=False)
    
    # Trend vs Baseline
    trend: Mapped[MonitoringTrend] = mapped_column(
        Enum(MonitoringTrend), default=MonitoringTrend.STABLE, nullable=False, index=True
    )

    # Visual Evidence & Field Observations
    observed_symptoms: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    image_urls: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # PostGIS Spatial Footprint
    location_geometry: Mapped[Optional[str]] = mapped_column(
        Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True
    )

    submitted_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    task: Mapped["MonitoringTask"] = relationship("MonitoringTask", back_populates="results")
    comparisons: Mapped[List["MonitoringComparison"]] = relationship(
        "MonitoringComparison", back_populates="monitoring_result", cascade="all, delete-orphan"
    )


class MonitoringComparison(Base, TimestampMixin):
    """Quantitative before-vs-after delta comparison matrix."""

    __tablename__ = "monitoring_comparisons"
    __table_args__ = (
        Index("ix_mon_comp_res", "monitoring_result_id"),
        Index("ix_mon_comp_trend", "trend"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    monitoring_result_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("monitoring_results.id", ondelete="CASCADE"), nullable=False, index=True
    )

    previous_observation_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_observation_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    previous_health_score: Mapped[float] = mapped_column(Float, nullable=False)
    current_health_score: Mapped[float] = mapped_column(Float, nullable=False)
    health_change: Mapped[float] = mapped_column(Float, nullable=False) # e.g. -6.0

    previous_disease_risk: Mapped[float] = mapped_column(Float, nullable=False)
    current_disease_risk: Mapped[float] = mapped_column(Float, nullable=False)
    disease_risk_change: Mapped[float] = mapped_column(Float, nullable=False) # e.g. +6.0

    previous_affected_area_ha: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    current_affected_area_ha: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    affected_area_change_ha: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # e.g. +0.6 ha

    trend: Mapped[MonitoringTrend] = mapped_column(
        Enum(MonitoringTrend), nullable=False, index=True
    )
    hotspot_status: Mapped[HotspotTrendStatus] = mapped_column(
        Enum(HotspotTrendStatus), default=HotspotTrendStatus.STABLE, nullable=False
    )
    
    is_escalated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    escalation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    monitoring_result: Mapped["MonitoringResult"] = relationship(
        "MonitoringResult", back_populates="comparisons"
    )


class DroneMonitoringRecommendation(Base, TimestampMixin):
    """Targeted drone flight surveillance recommendation."""

    __tablename__ = "drone_monitoring_recommendations"
    __table_args__ = (
        Index("ix_drone_rec_farm", "farm_id"),
        Index("ix_drone_rec_priority", "priority"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    farm_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    zone_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("farm_zones.id", ondelete="SET NULL"), nullable=True
    )
    
    target_area_description: Mapped[str] = mapped_column(String(255), nullable=False)
    targeted_zones: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # e.g. ["Z16", "Z17", "Z18"]
    priority: Mapped[MonitoringPriority] = mapped_column(
        Enum(MonitoringPriority), default=MonitoringPriority.HIGH, nullable=False
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_time_window: Mapped[str] = mapped_column(String(100), default="Within 48 hours")
    
    previous_health_score: Mapped[float] = mapped_column(Float, default=78.0)
    current_risk_score: Mapped[float] = mapped_column(Float, default=76.0)
    hotspot_status: Mapped[HotspotTrendStatus] = mapped_column(
        Enum(HotspotTrendStatus), default=HotspotTrendStatus.EXPANDING
    )
    is_dispatched: Mapped[bool] = mapped_column(Boolean, default=False)
