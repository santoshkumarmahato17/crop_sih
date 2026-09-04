from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WeatherObservationSchema(BaseModel):
    """Pydantic model for point or station weather telemetry."""
    timestamp: datetime
    temperature_c: float
    min_temperature_c: Optional[float] = None
    max_temperature_c: Optional[float] = None
    relative_humidity_percent: float
    rainfall_mm: float = 0.0
    rainfall_probability_percent: float = 0.0
    rainfall_duration_hours: Optional[float] = None
    wind_speed_mps: float = 0.0
    wind_direction_deg: float = 0.0
    solar_radiation_w_m2: Optional[float] = None
    cloud_cover_percent: Optional[float] = None
    soil_moisture_percent: Optional[float] = None
    condition_text: str = "Clear"
    source: str = "agro_telemetry"
    is_forecast: bool = False
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class RiskFactorSchema(BaseModel):
    """Explainable risk attribution factor."""
    factor_name: str
    impact_level: str
    points_delta: int
    description: str

    model_config = ConfigDict(from_attributes=True)


class SingleRiskVectorSchema(BaseModel):
    """Single domain risk vector evaluation."""
    risk_type: str  # DISEASE, PEST, WATER_STRESS, OVERALL
    score: int  # 0 to 100
    tier: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence_pct: int
    plain_explanation: str
    technical_explanation: str
    contributing_factors: List[RiskFactorSchema] = Field(default_factory=list)
    rule_version: str = "weather-risk-v1"

    model_config = ConfigDict(from_attributes=True)


class DailyForecastRiskSchema(BaseModel):
    """Daily forecast risk step."""
    day_offset: int
    forecast_date: datetime
    weather_summary: str
    temperature_c: float
    relative_humidity_pct: float
    expected_rainfall_mm: float
    disease_risk_score: int
    disease_tier: str
    pest_risk_score: int
    pest_tier: str
    water_stress_score: int
    water_stress_tier: str
    overall_risk_score: int
    overall_tier: str
    confidence_pct: int
    primary_explanation: str

    model_config = ConfigDict(from_attributes=True)


class FarmWeatherRiskResponse(BaseModel):
    """Comprehensive multi-horizon weather risk forecast for farm or zone."""
    farm_id: str
    farm_name: str
    zone_id: Optional[str] = None
    evaluated_at: datetime
    horizon_days: int
    current_weather: WeatherObservationSchema
    current_disease_risk: SingleRiskVectorSchema
    current_pest_risk: SingleRiskVectorSchema
    current_water_stress: SingleRiskVectorSchema
    current_overall_risk: SingleRiskVectorSchema
    risk_trend: str  # STABLE, RISING, FALLING, RAPIDLY_RISING, RAPIDLY_FALLING
    forecast_timeline: List[DailyForecastRiskSchema] = Field(default_factory=list)
    adaptive_monitoring_recommendation: str
    recommended_inspection_interval_days: int
    rule_version: str = "weather-risk-v1"

    model_config = ConfigDict(from_attributes=True)


class RegionalHotspotItem(BaseModel):
    """Single regional farm or zone risk entry."""
    farm_id: str
    farm_name: str
    location_name: str
    crop_type: str
    overall_risk_score: int
    risk_tier: str
    disease_risk_score: int
    pest_risk_score: int
    water_stress_score: int
    risk_trend: str
    recommended_action: str


class RegionalRiskResponse(BaseModel):
    """Regional aggregated epidemiological and weather risk summary."""
    jurisdiction: str
    evaluated_at: datetime
    total_monitored_farms: int
    critical_hotspots_count: int
    high_risk_hotspots_count: int
    moderate_risk_count: int
    dominant_weather_pattern: str
    hotspots: List[RegionalHotspotItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class RecalculateRiskResponse(BaseModel):
    """Response payload for forced recalculation triggers."""
    farm_id: str
    recalculated_at: datetime
    zones_evaluated: int
    alerts_generated: int
    status: str = "success"
    message: str = "Weather risk matrix and adaptive monitoring schedules successfully updated."
