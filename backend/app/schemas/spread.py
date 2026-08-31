from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class NeighborFarmDetail(BaseSchema):
    """Anonymized or public detail of adjacent agricultural holding."""

    farm_id: str
    farm_name: str
    distance_km: float
    crop_type: str
    growth_stage: str
    latitude: float
    longitude: float
    is_downwind: bool
    active_threat_level: str = "LOW"


class NeighborsResponse(BaseSchema):
    """List of geographic neighbors within search radius."""

    target_farm_id: str
    target_farm_name: str
    search_radius_km: float
    total_neighbors: int
    neighbors: List[NeighborFarmDetail]


class SpreadRiskEdgeDetail(BaseSchema):
    """Directed graph edge representing transmission risk from an external source."""

    source_farm_id: str
    source_farm_name: str
    target_farm_id: str
    target_farm_name: str
    distance_km: float
    wind_alignment_factor: float = Field(description="-1.0 to 1.0 (1.0 = direct downwind corridor)")
    crop_similarity_score: float = Field(description="0.0 to 1.0 host compatibility")
    estimated_spread_risk: int = Field(ge=0, le=100, description="0-100 Potential Spread Risk Score")
    spread_risk_tier: str = Field(description="LOW, MEDIUM, HIGH, CRITICAL")
    source_pathogen: str
    estimated_arrival_days: Optional[int] = None
    explanation: str


class SpreadRiskGraphResponse(BaseSchema):
    """Directed Farm Risk Graph edges and contagion risk corridors."""

    farm_id: str
    farm_name: str
    overall_spread_threat_level: str
    max_estimated_spread_risk: int
    incoming_risk_edges: List[SpreadRiskEdgeDetail]
    wind_parameters: Dict[str, Any]
    disclaimer: str = Field(
        default="Estimated Spread Risk represents heuristic epidemiological dispersion modeling, not confirmed laboratory transmission.",
        description="Scientific transmission disclaimer",
    )


class RegionalHotspotDetail(BaseSchema):
    """Cluster zone with elevated regional disease or pest pressure."""

    hotspot_id: str
    name: str
    latitude: float
    longitude: float
    radius_km: float
    active_outbreaks_count: int
    dominant_pathogen: str
    hotspot_severity_level: str  # "MODERATE", "HIGH", "CRITICAL"
    affected_farms_count: int


class RegionalHotspotsResponse(BaseSchema):
    """Regional contagion cluster hotspots detected across the agricultural corridor."""

    total_hotspots: int
    evaluated_at: datetime
    hotspots: List[RegionalHotspotDetail]
