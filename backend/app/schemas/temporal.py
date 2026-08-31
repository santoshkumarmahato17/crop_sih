from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class ZoneScanRecord(BaseSchema):
    """Normalized metric record from a single drone monitoring flight scan."""

    scan_id: str
    observation_date: datetime
    health_score: float = Field(description="Canopy health score (0-100)")
    mean_ndvi: Optional[float] = None
    mean_ndre: Optional[float] = None
    disease_probability: float = Field(default=0.0, description="Disease pathology probability (0-100)")
    disease_count: int = 0
    max_disease_severity: str = "none"
    pest_probability: float = Field(default=0.0, description="Pest risk probability (0-100)")
    pest_count: int = 0
    water_stress_cwsi: float = Field(default=0.0, description="Crop Water Stress Index (0.0 - 1.0)")
    water_stress_category: str = "none"
    anomaly_score: float = Field(default=0.0, description="Canopy spatial anomaly percentage (0-100)")


class ZoneHistoryResponse(BaseSchema):
    """Chronological observation history for a specific monitoring zone."""

    zone_id: str
    zone_code: str
    farm_id: str
    total_scans: int
    history: List[ZoneScanRecord]


class ZoneTrendResponse(BaseSchema):
    """Calculated temporal trend metrics, rate of change, and classification for a zone."""

    zone_id: str
    zone_code: str
    farm_id: str
    total_scans: int
    health_trend: str = Field(description="STABLE, IMPROVING, DECLINING, RAPIDLY_DECLINING")
    disease_trend: str = Field(description="STABLE, IMPROVING, INCREASING, SURGING")
    pest_trend: str = Field(description="STABLE, IMPROVING, INCREASING, SURGING")
    water_stress_trend: str = Field(description="STABLE, RELIEVED, INCREASING, CRITICAL")
    anomaly_trend: str = Field(description="STABLE, DISSIPATING, EXPANDING")
    classification: str = Field(description="STABLE, IMPROVING, DECLINING, RAPIDLY_DECLINING")
    delta_last_scan_percent: float
    delta_total_percent: float
    velocity_per_day: float
    baseline_health: float
    current_health: float
    recent_scans: List[ZoneScanRecord]


class FarmHealthTimelineSnapshot(BaseSchema):
    """Farm-level aggregate health trajectory snapshot on a specific date."""

    date: str
    mean_health_score: float
    mean_ndvi: Optional[float] = None
    total_observations: int
    zones_monitored: int
    dominant_trend: str


class FarmHealthTimelineResponse(BaseSchema):
    """Farm-level temporal health trajectory across all subdivided zones."""

    farm_id: str
    farm_name: str
    total_zones: int
    history_by_date: List[FarmHealthTimelineSnapshot]
