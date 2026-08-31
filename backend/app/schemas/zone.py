from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class ZoneGenerateRequest(BaseModel):
    """Configuration payload to generate structured monitoring zones on a farm."""

    target_zone_count: Optional[int] = Field(
        default=4, ge=1, le=100, description="Target number of subdivided zones (e.g. 4, 9, 16, 20)"
    )
    grid_size_meters: Optional[float] = Field(
        default=None, ge=10.0, le=5000.0, description="Optional target square grid cell resolution in meters"
    )
    link_active_crop: bool = Field(
        default=True, description="Automatically link generated zones to the farm's active crop cycle"
    )


class ZoneResponse(BaseSchema):
    """Full details of a subdivided monitoring zone."""

    id: str
    farm_id: str
    zone_code: str = Field(description="Unique zone code, e.g. Z01, Z02")
    name: str = Field(description="Display designation, e.g. Zone Z01")
    crop_cycle_id: Optional[str] = None
    boundary: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON Polygon boundary"
    )
    centroid: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON Point centroid"
    )
    area_hectares: float = Field(description="Authoritative calculated surface area in hectares")
    monitoring_status: str = Field(default="active", description="active, paused, under_inspection")
    health_status: str = Field(
        default="healthy", description="healthy, moderate_concern, high_concern, critical"
    )
    risk_status: str = Field(default="low", description="low, moderate, elevated, severe")
    is_active: bool = True
    created_at: datetime


class ZoneListResponse(BaseSchema):
    """Collection response containing all monitoring zones for a farm."""

    farm_id: str
    farm_name: str
    total: int
    total_area_hectares: float
    zones: List[ZoneResponse]
