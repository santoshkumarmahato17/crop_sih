from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class AlertCreate(BaseModel):
    """Payload to trigger an agro-intelligence alert."""

    farm_id: str
    zone_id: Optional[str] = None
    alert_type: str = Field(
        description="DISEASE_DETECTED, DISEASE_RISING, PEST_DETECTED, WATER_STRESS, SPREAD_RISK, DRONE_MISSION_COMPLETED, FOLLOW_UP_MONITORING_REQUIRED, EXPERT_VALIDATION_REQUIRED"
    )
    severity: str = Field(default="MEDIUM", description="INFO, LOW, MEDIUM, HIGH, CRITICAL")
    title: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=5)
    metadata: Optional[Dict[str, Any]] = None


class AlertResponse(BaseSchema):
    """Full detail of an agro-intelligence alert."""

    id: str
    farm_id: str
    farm_name: Optional[str] = None
    zone_id: Optional[str] = None
    zone_code: Optional[str] = None
    alert_type: str
    severity: str  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    title: str
    message: str
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime


class NotificationResponse(BaseSchema):
    """User delivery record in the notification center."""

    id: str
    user_id: str
    alert_id: Optional[str] = None
    channel: str  # IN_APP, EMAIL, SMS, PUSH
    title: str
    content: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    alert: Optional[AlertResponse] = None


class NotificationCenterSummary(BaseSchema):
    """Aggregated notification bell summary for UI."""

    total_unread: int
    critical_alerts_count: int
    high_alerts_count: int
    notifications: List[NotificationResponse]
    evaluated_at: datetime


class MarkNotificationReadRequest(BaseModel):
    """Request to acknowledge / mark notifications as read."""

    notification_ids: List[str]
