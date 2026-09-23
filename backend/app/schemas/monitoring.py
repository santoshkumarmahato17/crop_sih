"""
KISAN SATHI — Pydantic Schemas for Follow-up Monitoring & Crop Health Tracking.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.models.monitoring import (
    MonitoringTriggerType,
    MonitoringPriority,
    MonitoringMethod,
    MonitoringTaskStatus,
    MonitoringTrend,
    HotspotTrendStatus,
)


class MonitoringTaskCreate(BaseModel):
    farm_id: str
    zone_id: Optional[str] = None
    crop_id: Optional[str] = None
    trigger_type: MonitoringTriggerType
    trigger_entity_id: Optional[str] = None
    suspected_condition: Optional[str] = None
    priority: MonitoringPriority = MonitoringPriority.MEDIUM
    monitoring_method: MonitoringMethod = MonitoringMethod.DRONE
    scheduled_at: Optional[datetime] = None
    target_zone_ids: Optional[List[str]] = Field(default_factory=list)
    instructions: Optional[str] = None
    baseline_health_score: Optional[float] = None
    baseline_disease_risk: Optional[float] = None
    baseline_affected_area_ha: Optional[float] = None


class MonitoringComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    monitoring_result_id: str
    previous_observation_id: Optional[str] = None
    current_observation_id: Optional[str] = None
    previous_health_score: float
    current_health_score: float
    health_change: float
    previous_disease_risk: float
    current_disease_risk: float
    disease_risk_change: float
    previous_affected_area_ha: float
    current_affected_area_ha: float
    affected_area_change_ha: float
    trend: MonitoringTrend
    hotspot_status: HotspotTrendStatus
    is_escalated: bool
    escalation_reason: Optional[str] = None
    recommended_action: Optional[str] = None
    created_at: datetime


class MonitoringResultCreate(BaseModel):
    observation_id: Optional[str] = None
    health_score: float = Field(..., ge=0.0, le=100.0)
    disease_risk: float = Field(..., ge=0.0, le=100.0)
    pest_risk: float = Field(default=0.0, ge=0.0, le=100.0)
    water_stress: float = Field(default=0.0, ge=0.0, le=1.0)
    affected_area_ha: Optional[float] = Field(default=0.0, ge=0.0)
    severity: str = "MODERATE"
    observed_symptoms: Optional[List[str]] = Field(default_factory=list)
    image_urls: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None
    location_wkt: Optional[str] = None


class MonitoringResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    monitoring_task_id: str
    farm_id: str
    zone_id: Optional[str] = None
    observation_id: Optional[str] = None
    health_score: float
    disease_risk: float
    pest_risk: float
    water_stress: float
    affected_area_ha: Optional[float] = 0.0
    severity: str
    trend: MonitoringTrend
    observed_symptoms: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None
    notes: Optional[str] = None
    observed_at: datetime
    submitted_by: Optional[str] = None
    created_at: datetime
    comparisons: Optional[List[MonitoringComparisonResponse]] = None


class MonitoringTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_code: str
    farm_id: str
    farm_name: Optional[str] = None
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    crop_id: Optional[str] = None
    crop_name: Optional[str] = None
    trigger_type: MonitoringTriggerType
    trigger_entity_id: Optional[str] = None
    suspected_condition: Optional[str] = None
    priority: MonitoringPriority
    monitoring_method: MonitoringMethod
    status: MonitoringTaskStatus
    scheduled_at: datetime
    due_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    target_zone_ids: Optional[List[str]] = None
    instructions: Optional[str] = None
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    baseline_health_score: Optional[float] = None
    baseline_disease_risk: Optional[float] = None
    baseline_affected_area_ha: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    results: Optional[List[MonitoringResultResponse]] = None


class DroneMonitoringRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    farm_id: str
    farm_name: Optional[str] = None
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    target_area_description: str
    targeted_zones: List[str]
    priority: MonitoringPriority
    reason: str
    recommended_time_window: str
    previous_health_score: float
    current_risk_score: float
    hotspot_status: HotspotTrendStatus
    is_dispatched: bool
    created_at: datetime


class TimeSeriesPoint(BaseModel):
    timestamp: str
    health_score: float
    disease_risk: float
    pest_risk: float
    water_stress: float
    affected_area_ha: float


class ZoneTrendResponse(BaseModel):
    zone_id: str
    zone_name: str
    crop_name: Optional[str] = None
    current_health_score: float
    current_disease_risk: float
    overall_trend: MonitoringTrend
    data_points: List[TimeSeriesPoint]


class FarmHealthTimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    title: str
    description: str
    severity: str
    zone_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class MonitoringStatsResponse(BaseModel):
    scheduled: int
    in_progress: int
    completed: int
    overdue: int
    critical: int
    hotspots_under_monitoring: int
    monitoring_coverage_pct: float
