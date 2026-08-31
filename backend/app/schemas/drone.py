from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class DroneCreateRequest(BaseModel):
    """Payload to register a new drone airframe."""

    name: str = Field(min_length=2, max_length=150, description="Drone unit name, e.g. AgriFlyer Pro 1")
    serial_number: str = Field(min_length=3, max_length=100, description="Manufacturer hardware serial number")
    manufacturer: str = Field(default="DJI Enterprise", max_length=100)
    model_name: str = Field(min_length=2, max_length=100, description="Model, e.g. Matrice 350 RTK, Mavic 3M")
    camera_type: str = Field(default="Multispectral + RGB", max_length=100)
    sensor_capabilities: Optional[List[str]] = Field(
        default=["RGB", "RedEdge", "NIR", "Thermal_LWIR"],
        description="Supported imaging bands and sensors",
    )
    battery_percentage: float = Field(default=100.0, ge=0.0, le=100.0)
    operational_status: str = Field(
        default="AVAILABLE",
        description="AVAILABLE, IN_MISSION, MAINTENANCE, CHARGING, RETIRED",
    )


class DroneResponse(BaseSchema):
    """Full details of a registered drone hardware unit."""

    id: str
    name: str
    serial_number: str
    manufacturer: str
    model_name: str
    camera_type: str
    sensor_capabilities: Optional[List[str]] = None
    battery_percentage: float
    battery_cycle_count: int
    operational_status: str
    status: str
    created_at: datetime


class DroneListResponse(BaseSchema):
    """Collection of drone airframes."""

    drones: List[DroneResponse]
    total: int


class DroneMissionCreateRequest(BaseModel):
    """Payload to schedule an autonomous monitoring flight mission."""

    farm_id: str = Field(description="Target farm holding ID")
    drone_id: Optional[str] = Field(default=None, description="Assigned drone airframe ID")
    target_zones: Optional[List[str]] = Field(
        default=None, description="Array of target monitoring Zone IDs (e.g. Z01, Z02)"
    )
    flight_boundary: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional custom GeoJSON Polygon boundary (auto-computed from zones if omitted)"
    )
    mission_date: datetime = Field(description="Scheduled flight date/time")
    priority: str = Field(
        default="NORMAL", description="Mission priority: NORMAL, MEDIUM, HIGH, CRITICAL"
    )
    altitude_meters: float = Field(default=50.0, ge=10.0, le=500.0, description="Survey altitude in meters AGL")
    flight_speed_mps: float = Field(default=5.0, ge=1.0, le=25.0, description="Flight speed in m/s")
    overlap_percentage: float = Field(default=75.0, ge=50.0, le=95.0, description="Forward/side overlap percent")


class DroneMissionResponse(BaseSchema):
    """Full flight mission metadata with PostGIS flight boundary corridor."""

    id: str
    farm_id: str
    farm_name: Optional[str] = None
    drone_id: Optional[str] = None
    drone_name: Optional[str] = None
    flight_boundary: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON Polygon flight corridor"
    )
    target_zones: Optional[List[str]] = None
    mission_date: datetime
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    altitude_meters: float
    flight_speed_mps: float
    overlap_percentage: float
    coverage_percentage: float
    priority: str
    status: str
    created_at: datetime


class DroneMissionListResponse(BaseSchema):
    """Collection of drone survey missions."""

    missions: List[DroneMissionResponse]
    total: int
