"""
Pydantic schemas for the new normalized weather API responses.
These are used by the /api/v1/weather/* endpoints.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class WeatherSource(BaseModel):
    provider: str
    model: Optional[str] = None
    observed_at: Optional[datetime] = None
    data_quality: str  # GOOD | STALE | PARTIAL | UNAVAILABLE


class CurrentWeatherResponse(BaseModel):
    farm_id: str
    location: dict  # {latitude, longitude, name}
    current: dict   # normalized weather fields
    source: WeatherSource


class ForecastDayResponse(BaseModel):
    date: datetime
    temperature_c: Optional[float] = None
    min_temperature_c: Optional[float] = None
    max_temperature_c: Optional[float] = None
    relative_humidity_percent: Optional[float] = None
    rainfall_mm: Optional[float] = None
    precipitation_probability: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    condition_text: Optional[str] = None
    et0_mm: Optional[float] = None
    source: WeatherSource


class ForecastResponse(BaseModel):
    farm_id: str
    location: dict
    days_requested: int
    forecast: List[ForecastDayResponse]


class WeatherHistorySummary(BaseModel):
    rainfall_24h_mm: Optional[float] = None
    rainfall_3d_mm: Optional[float] = None
    rainfall_7d_mm: Optional[float] = None
    rainfall_14d_mm: Optional[float] = None
    mean_temperature_24h_c: Optional[float] = None
    mean_humidity_24h_percent: Optional[float] = None
    max_temperature_24h_c: Optional[float] = None
    min_temperature_24h_c: Optional[float] = None
    mean_wind_speed_kmh: Optional[float] = None
    dominant_wind_direction_deg: Optional[float] = None
    soil_moisture_trend: Optional[str] = None
    et0_7d_mm: Optional[float] = None


class WeatherSummaryResponse(BaseModel):
    farm_id: str
    location: dict
    summary: WeatherHistorySummary
    source: WeatherSource


class SprayWindowStatus(BaseModel):
    status: str  # FAVORABLE | UNFAVORABLE | LIMITED | UNKNOWN
    reason: Optional[str] = None
    evaluated_at: datetime
    forecast_horizon_hours: int


class WeatherRiskIntegration(BaseModel):
    """Summary weather-risk overlay appended to disease detection responses."""
    weather_favorability: str   # LOW | MODERATE | HIGH | CRITICAL | UNKNOWN
    risk_factors: List[str]
    data_quality: str
    provider: str
    evaluated_at: datetime
