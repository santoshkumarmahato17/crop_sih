from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class RiskContributingFactor(BaseSchema):
    """Specific factor with point contribution and agronomic explanation."""

    factor_name: str
    category: str = Field(description="weather, temporal_trend, agronomic, biosecurity, history")
    points: int = Field(description="Exact score points added or deducted")
    description: str


class RiskAssessmentDetail(BaseSchema):
    """Explainable multi-vector crop health risk assessment breakdown."""

    disease_risk_score: int = Field(ge=0, le=100, description="0-100 Disease Risk Score")
    pest_risk_score: int = Field(ge=0, le=100, description="0-100 Pest Risk Score")
    water_stress_risk: int = Field(ge=0, le=100, description="0-100 Water Stress Risk")
    overall_crop_risk: int = Field(ge=0, le=100, description="0-100 Composite Crop Risk")
    risk_level: str = Field(description="LOW, MEDIUM, HIGH, CRITICAL")
    rule_version: str
    assessment_timestamp: datetime
    explanation_summary: str
    contributing_factors: List[RiskContributingFactor]
    raw_inputs: Dict[str, Any] = Field(default_factory=dict)


class ZoneRiskResponse(BaseSchema):
    """Zone-level explainable risk assessment response."""

    zone_id: str
    zone_code: str
    farm_id: str
    risk_assessment: RiskAssessmentDetail


class FarmRiskSummaryResponse(BaseSchema):
    """Farm-level aggregate risk intelligence across all subdivided zones."""

    farm_id: str
    farm_name: str
    mean_overall_risk: float
    highest_risk_level: str
    critical_zones_count: int
    evaluated_at: datetime
    zones_risk: List[ZoneRiskResponse]
