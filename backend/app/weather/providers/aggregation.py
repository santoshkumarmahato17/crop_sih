"""
Historical weather aggregation.
Calculates statistical rollups from stored NormalizedWeatherPoint lists.
Does NOT calculate disease thresholds — this is pure weather statistics.
"""
from __future__ import annotations
import statistics
from dataclasses import dataclass
from typing import Optional

from app.weather.providers.base import NormalizedWeatherPoint


@dataclass
class WeatherAggregate:
    """Statistical weather rollup over a given period."""
    period_days: int

    rainfall_total_mm: Optional[float] = None       # sum
    rainfall_days: Optional[int] = None              # days with rain > 0

    mean_temperature_c: Optional[float] = None
    max_temperature_c: Optional[float] = None
    min_temperature_c: Optional[float] = None

    mean_humidity_percent: Optional[float] = None
    max_humidity_percent: Optional[float] = None

    mean_wind_speed_kmh: Optional[float] = None
    dominant_wind_direction_deg: Optional[float] = None

    soil_moisture_trend: Optional[str] = None       # RISING, FALLING, STABLE, UNKNOWN
    et0_total_mm: Optional[float] = None

    record_count: int = 0


def aggregate(
    points: list[NormalizedWeatherPoint],
    period_days: int,
) -> WeatherAggregate:
    """Compute aggregates from a list of weather points."""
    agg = WeatherAggregate(period_days=period_days, record_count=len(points))

    if not points:
        return agg

    def safe_values(attr: str) -> list[float]:
        return [v for p in points if (v := getattr(p, attr)) is not None]

    # Rainfall
    rainfall_vals = safe_values("rainfall_mm")
    if rainfall_vals:
        agg.rainfall_total_mm = round(sum(rainfall_vals), 2)
        agg.rainfall_days = sum(1 for v in rainfall_vals if v > 0)

    # Temperature
    temps = safe_values("temperature_c")
    if temps:
        agg.mean_temperature_c = round(statistics.mean(temps), 2)
        agg.max_temperature_c = round(max(temps), 2)
        agg.min_temperature_c = round(min(temps), 2)

    # Override max/min if explicit daily fields available
    max_temps = safe_values("max_temperature_c")
    min_temps = safe_values("min_temperature_c")
    if max_temps:
        agg.max_temperature_c = round(max(max_temps), 2)
    if min_temps:
        agg.min_temperature_c = round(min(min_temps), 2)

    # Humidity
    hums = safe_values("relative_humidity_percent")
    if hums:
        agg.mean_humidity_percent = round(statistics.mean(hums), 2)
        agg.max_humidity_percent = round(max(hums), 2)

    # Wind
    winds = safe_values("wind_speed_kmh")
    if winds:
        agg.mean_wind_speed_kmh = round(statistics.mean(winds), 2)

    wind_dirs = safe_values("wind_direction_deg")
    if wind_dirs:
        agg.dominant_wind_direction_deg = round(statistics.mean(wind_dirs), 1)

    # ET0
    et0s = safe_values("et0_mm")
    if et0s:
        agg.et0_total_mm = round(sum(et0s), 2)

    # Soil moisture trend
    soils = safe_values("soil_moisture_percent")
    agg.soil_moisture_trend = _trend(soils)

    return agg


def build_multi_period_aggregates(
    historical_points: list[NormalizedWeatherPoint],
) -> dict[str, WeatherAggregate]:
    """Build 24h, 3d, 7d, 14d aggregates from a historical points list."""
    sorted_pts = sorted(historical_points, key=lambda p: p.timestamp, reverse=True)
    periods = {"24h": 1, "3d": 3, "7d": 7, "14d": 14}
    return {
        label: aggregate(sorted_pts[:days], days)
        for label, days in periods.items()
        if sorted_pts
    }


def _trend(values: list[float]) -> str:
    if len(values) < 2:
        return "UNKNOWN"
    first_half = statistics.mean(values[: len(values) // 2])
    second_half = statistics.mean(values[len(values) // 2 :])
    delta = second_half - first_half
    if delta > 2:
        return "RISING"
    if delta < -2:
        return "FALLING"
    return "STABLE"
