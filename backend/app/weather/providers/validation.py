"""
Data quality validation for weather provider responses.
Rejects stale, incomplete, or clearly erroneous data.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta

from app.weather.providers.base import NormalizedWeatherPoint, DataQuality

logger = logging.getLogger(__name__)

# A response is considered stale if older than this (seconds)
STALE_THRESHOLD_SECONDS = 7200  # 2 hours

# Plausible range bounds for Maharashtra / Indian sub-continent
TEMP_RANGE = (-5.0, 55.0)       # °C
HUMIDITY_RANGE = (0.0, 100.0)   # %
RAINFALL_RANGE = (0.0, 500.0)   # mm/day
WIND_RANGE = (0.0, 300.0)       # km/h


def validate_and_tag(point: NormalizedWeatherPoint) -> NormalizedWeatherPoint:
    """
    Validate a NormalizedWeatherPoint and set an appropriate data_quality tag.
    Never modifies or fabricates numeric fields.
    """
    # Already unavailable — pass through
    if point.data_quality == DataQuality.UNAVAILABLE:
        return point

    issues: list[str] = []

    # Staleness check
    if point.source_timestamp:
        age = (datetime.now(timezone.utc) - point.source_timestamp).total_seconds()
        if age > STALE_THRESHOLD_SECONDS:
            issues.append(f"data is {int(age / 60)} minutes old")
            point.data_quality = DataQuality.STALE

    # Range checks — log warnings but do NOT remove the field
    _range_check(point.temperature_c, *TEMP_RANGE, "temperature_c", issues)
    _range_check(point.relative_humidity_percent, *HUMIDITY_RANGE, "relative_humidity_percent", issues)
    _range_check(point.rainfall_mm, *RAINFALL_RANGE, "rainfall_mm", issues)
    _range_check(point.wind_speed_kmh, *WIND_RANGE, "wind_speed_kmh", issues)

    # Partial check — essential fields missing
    essential_missing = [
        f for f in ("temperature_c", "relative_humidity_percent")
        if getattr(point, f) is None
    ]
    if essential_missing and point.data_quality == DataQuality.GOOD:
        issues.append(f"missing essential fields: {essential_missing}")
        point.data_quality = DataQuality.PARTIAL

    if issues:
        logger.debug("Weather validation issues for %s @ %s: %s", point.provider, point.timestamp, issues)

    return point


def _range_check(
    value: float | None,
    lo: float,
    hi: float,
    name: str,
    issues: list[str],
) -> None:
    if value is not None and not (lo <= value <= hi):
        issues.append(f"{name}={value} outside plausible range [{lo}, {hi}]")
