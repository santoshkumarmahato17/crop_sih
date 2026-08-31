from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class OfficerFarmSummary(BaseSchema):
    """Extension officer assigned agricultural holding summary with priority ranking."""

    farm_id: str
    farm_name: str
    owner_name: str
    location_name: str
    area_hectares: float
    crop_type: str
    growth_stage: str
    priority_tier: str = Field(description="CRITICAL, HIGH, MEDIUM, LOW")
    risk_score: int = Field(ge=0, le=100)
    critical_zones_count: int
    pest_hotspots_count: int
    spread_risk_score: int
    unresolved_alerts_count: int
    pending_validations_count: int
    recommended_visit: bool
    last_visit_date: Optional[datetime] = None


class OfficerDashboardResponse(BaseSchema):
    """Aggregated Extension Worker Field Prioritization Dashboard."""

    officer_id: str
    officer_name: str
    total_assigned_farms: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    unresolved_alerts_total: int
    pending_validations_total: int
    recommended_visits_total: int
    farms: List[OfficerFarmSummary]
    evaluated_at: datetime


class OfficerValidationRequest(BaseModel):
    """Agronomist ground-truth validation or model calibration submission."""

    observation_id: str = Field(description="Target observation or disease event ID")
    observation_type: str = Field(default="DISEASE", description="HEALTH, DISEASE, PEST, WATER")
    validation_status: str = Field(description="VALIDATED, REJECTED, UNCERTAIN, LAB_CONFIRMATION_REQUESTED")
    notes: Optional[str] = Field(default=None, description="Agronomist field diagnosis notes")
    override_pathogen: Optional[str] = Field(default=None, description="Corrected scientific pathogen name")
    create_field_visit: bool = Field(default=False)
    visit_scheduled_date: Optional[datetime] = None


class OfficerValidationResponse(BaseSchema):
    """Validation confirmation and audit record acknowledgment."""

    validation_id: str
    officer_id: str
    observation_id: str
    validation_status: str
    audit_log_id: str
    audit_action: str
    notes: Optional[str] = None
    created_at: datetime
    message: str
