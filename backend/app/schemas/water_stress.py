from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class ZoneWaterStressRecord(BaseSchema):
    """Zonal water deficit status and decision support."""

    zone_id: str
    zone_code: str
    status: str = Field(description="ADEQUATE, MODERATE_STRESS, HIGH_STRESS, POSSIBLE_WATERLOGGING")
    water_stress_score: int = Field(ge=0, le=100, description="0-100 Water Stress Score")
    cwsi_index: float = Field(ge=0.0, le=1.0, description="0.0 - 1.0 Crop Water Stress Index")
    canopy_air_temp_diff_c: float = Field(description="T_canopy - T_air in Celsius")
    soil_moisture_pct: Optional[float] = Field(default=None, description="Volumetric water content %")
    irrigation_priority: str = Field(description="NONE, LOW, MEDIUM, HIGH, CRITICAL, DRAINAGE_ATTENTION")
    decision_support_guidance: str
    decision_factors: Dict[str, Any] = Field(default_factory=dict)


class FarmWaterRequirementResponse(BaseSchema):
    """Farm-level water requirement map and irrigation prioritization matrix."""

    farm_id: str
    farm_name: str
    total_zones: int
    adequate_count: int
    moderate_count: int
    high_stress_count: int
    waterlogged_count: int
    highest_priority: str
    evaluated_at: datetime
    zones: List[ZoneWaterStressRecord]
    disclaimer: str = Field(
        default="Irrigation guidance provides decision support. Exact volumetric application requires calibrated in-situ soil tension lysimeters.",
        description="Agronomic decision support disclaimer",
    )
