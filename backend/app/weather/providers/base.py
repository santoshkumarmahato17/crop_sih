"""
Abstract base class for all weather data providers.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class DataQuality(str, Enum):
    GOOD = "GOOD"
    STALE = "STALE"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass
class NormalizedWeatherPoint:
    """Unified, provider-agnostic weather data point."""
    timestamp: datetime
    latitude: float
    longitude: float

    # Core meteorological fields — all Optional so partial data is supported
    temperature_c: Optional[float] = None
    min_temperature_c: Optional[float] = None
    max_temperature_c: Optional[float] = None
    relative_humidity_percent: Optional[float] = None
    rainfall_mm: Optional[float] = None
    precipitation_probability: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    dew_point_c: Optional[float] = None
    soil_moisture_percent: Optional[float] = None
    et0_mm: Optional[float] = None
    vpd_kpa: Optional[float] = None
    solar_radiation_w_m2: Optional[float] = None
    cloud_cover_percent: Optional[float] = None
    condition_text: Optional[str] = None

    # Provenance — required
    provider: str = "UNKNOWN"
    model: Optional[str] = None
    source_timestamp: Optional[datetime] = None
    data_quality: DataQuality = DataQuality.UNAVAILABLE
    is_forecast: bool = False
    location_name: Optional[str] = None


class WeatherProvider(ABC):
    """Abstract base interface for all weather data providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name, e.g. 'Open-Meteo'."""
        ...

    @abstractmethod
    async def get_current(self, latitude: float, longitude: float) -> NormalizedWeatherPoint:
        """Fetch current conditions. Never fabricate missing fields."""
        ...

    @abstractmethod
    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        days: int = 7,
    ) -> list[NormalizedWeatherPoint]:
        """Fetch daily forecast data up to `days` days ahead."""
        ...

    @abstractmethod
    async def get_historical(
        self,
        latitude: float,
        longitude: float,
        days_back: int = 7,
    ) -> list[NormalizedWeatherPoint]:
        """Fetch historical daily data for up to `days_back` days."""
        ...

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True only when the provider has valid credentials/config."""
        ...
