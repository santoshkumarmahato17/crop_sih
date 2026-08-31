from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class AdaptivePolicyConfigSchema(BaseModel):
    """Configurable risk interval thresholds."""

    low_risk_days: int = Field(default=7, ge=1, le=30, description="Interval for LOW risk farms")
    medium_risk_days: int = Field(default=4, ge=1, le=14, description="Interval for MEDIUM risk farms")
    high_risk_days: int = Field(default=2, ge=1, le=7, description="Interval for HIGH risk farms")
    critical_risk_hours: int = Field(default=24, ge=1, le=72, description="Target window for CRITICAL risk farms")


class AdaptiveMonitoringRecommendation(BaseSchema):
    """Dynamically computed risk-adaptive surveillance recommendation."""

    farm_id: str
    farm_name: str
    overall_risk_level: str
    overall_risk_score: int
    monitoring_priority: str  # ROUTINE, ELEVATED, URGENT, IMMEDIATE_TARGETED
    recommended_monitoring_date: datetime
    interval_days: float
    target_zones: List[str]
    reason_for_monitoring: str
    recommended_sensor_payload: List[str]
    recommended_flight_altitude_m: float
    factors_evaluated: Dict[str, Any] = Field(default_factory=dict)
    generated_at: datetime


class ScheduleMissionFromRecommendationRequest(BaseModel):
    """Converts an adaptive monitoring recommendation into a scheduled DroneMission."""

    farm_id: str
    target_zones: List[str]
    scheduled_time: Optional[datetime] = None
    drone_id: Optional[str] = None
    flight_altitude_m: Optional[float] = 45.0


class ScheduleMissionFromRecommendationResponse(BaseSchema):
    """Confirmation of scheduled mission proposal."""

    mission_id: str
    mission_code: str
    farm_id: str
    status: str
    target_zones: List[str]
    scheduled_time: datetime
    message: str
