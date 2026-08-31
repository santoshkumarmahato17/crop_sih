from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class CropInfoInput(BaseModel):
    """Crop planting details submitted during farm setup."""

    common_name: str = Field(min_length=2, max_length=100, description="Common name, e.g. Wheat, Rice, Corn, Tomato")
    scientific_name: Optional[str] = Field(default=None, max_length=150)
    variety: Optional[str] = Field(default=None, max_length=100, description="Cultivar or variety, e.g. PBW-343, Basmati-1121")
    planting_date: date = Field(description="Date crop was sown or transplanted")
    expected_harvest_date: Optional[date] = None
    growth_stage: Optional[str] = Field(default="Vegetative", description="Current phenological growth stage")
    target_yield_tonnes_per_hectare: Optional[float] = Field(default=None, ge=0.0)


class CropCycleResponse(BaseSchema):
    """Crop cycle summary attached to farm response."""

    id: str
    crop_name: str
    scientific_name: Optional[str] = None
    variety: Optional[str] = None
    planting_date: date
    expected_harvest_date: Optional[date] = None
    status: str
    target_yield: Optional[float] = None


class FarmCreateRequest(BaseModel):
    """Payload to register a new agricultural farm holding."""

    name: str = Field(min_length=2, max_length=150, description="Farm name")
    description: Optional[str] = None
    boundary: Dict[str, Any] = Field(
        description="GeoJSON Polygon or MultiPolygon representing farm boundary"
    )
    address: Optional[str] = None
    city: Optional[str] = "Pune"
    region: Optional[str] = "Maharashtra"
    country: Optional[str] = "India"
    soil_type: Optional[str] = Field(default="Black Cotton Loam", description="Primary soil classification")
    soil_ph: Optional[float] = Field(default=6.8, ge=0.0, le=14.0, description="Soil pH level")
    irrigation_type: Optional[str] = Field(default="drip", description="Irrigation method: drip, sprinkler, flood, rainfed")
    farming_method: Optional[str] = Field(default="conventional", description="Farming method: organic, conventional, regenerative")
    crop_info: Optional[CropInfoInput] = None


class FarmUpdateRequest(BaseModel):
    """Payload to update an existing farm holding."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    boundary: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional updated GeoJSON Polygon boundary"
    )
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    irrigation_type: Optional[str] = None
    farming_method: Optional[str] = None
    is_active: Optional[bool] = None


class FarmResponse(BaseSchema):
    """Comprehensive farm response with GeoJSON geometry and calculated area."""

    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    owner_name: Optional[str] = None
    boundary: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON MultiPolygon boundary"
    )
    center_point: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON Point centroid"
    )
    total_area_hectares: float = Field(
        description="Authoritative calculated surface area in hectares"
    )
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    farming_method: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: str = "India"
    is_active: bool
    created_at: datetime
    active_crop: Optional[CropCycleResponse] = None
    zones_count: int = 0


class FarmListResponse(BaseSchema):
    """Paginated farm list response envelope."""

    farms: List[FarmResponse]
    total: int
    total_hectares: float
