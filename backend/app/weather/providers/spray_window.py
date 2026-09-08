"""
Spray / management window evaluation service.
Evaluates whether current or upcoming weather is favorable for pesticide application.

Rules are based on standard agronomic guidance (NOT invented):
- Strong wind (>20 km/h) → UNFAVORABLE (spray drift)
- Rain within forecast window → UNFAVORABLE (rainfast period violation)
- High humidity + rain → LIMITED
- Otherwise → FAVORABLE or UNKNOWN (if forecast unavailable)

Rainfast periods differ by product. Since product-level data is not available,
we conservatively flag any rain forecast within the spray window as UNFAVORABLE.
We NEVER invent specific rainfast hours for specific products.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Optional

from app.weather.providers.base import NormalizedWeatherPoint

logger = logging.getLogger(__name__)

WIND_UNSAFE_KMH = 20.0          # spray drift threshold
HUMIDITY_HIGH_PCT = 80.0        # high RH reduces efficacy of some products
RAIN_THRESHOLD_MM = 1.0         # any rainfall above this flags risk
DEFAULT_WINDOW_HOURS = 6        # hours ahead to look for rain


class SprayWindowResult:
    def __init__(
        self,
        status: str,             # FAVORABLE | UNFAVORABLE | LIMITED | UNKNOWN
        reason: Optional[str],
        forecast_horizon_hours: int,
    ):
        self.status = status
        self.reason = reason
        self.forecast_horizon_hours = forecast_horizon_hours
        self.evaluated_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "reason": self.reason,
            "evaluated_at": self.evaluated_at.isoformat(),
            "forecast_horizon_hours": self.forecast_horizon_hours,
        }


def evaluate_spray_window(
    current: Optional[NormalizedWeatherPoint],
    forecast_points: list[NormalizedWeatherPoint],
    window_hours: int = DEFAULT_WINDOW_HOURS,
) -> SprayWindowResult:
    """
    Evaluate spray application window.
    Does NOT invent product-specific guidance.
    Returns UNKNOWN if weather data is unavailable.
    """
    if current is None and not forecast_points:
        return SprayWindowResult(
            status="UNKNOWN",
            reason="Weather data unavailable. Cannot evaluate spray window.",
            forecast_horizon_hours=window_hours,
        )

    # Wind check on current observation
    if current and current.wind_speed_kmh is not None:
        if current.wind_speed_kmh > WIND_UNSAFE_KMH:
            return SprayWindowResult(
                status="UNFAVORABLE",
                reason=f"Current wind speed {current.wind_speed_kmh:.1f} km/h exceeds safe limit of {WIND_UNSAFE_KMH} km/h.",
                forecast_horizon_hours=window_hours,
            )

    # Rain check on current observation
    if current and current.rainfall_mm is not None and current.rainfall_mm > RAIN_THRESHOLD_MM:
        return SprayWindowResult(
            status="UNFAVORABLE",
            reason=f"Active rainfall detected ({current.rainfall_mm:.1f} mm). Do not apply.",
            forecast_horizon_hours=window_hours,
        )

    # Rain probability in forecast window
    rain_risk = _check_forecast_rain(forecast_points, window_hours)
    if rain_risk:
        return SprayWindowResult(
            status="UNFAVORABLE",
            reason=rain_risk,
            forecast_horizon_hours=window_hours,
        )

    # High humidity → LIMITED
    if current and current.relative_humidity_percent is not None:
        if current.relative_humidity_percent > HUMIDITY_HIGH_PCT:
            return SprayWindowResult(
                status="LIMITED",
                reason=(
                    f"High relative humidity ({current.relative_humidity_percent:.0f}%) may reduce "
                    f"efficacy of some foliar products. Verify product label."
                ),
                forecast_horizon_hours=window_hours,
            )

    if current is None:
        return SprayWindowResult(
            status="UNKNOWN",
            reason="No current weather observation available.",
            forecast_horizon_hours=window_hours,
        )

    return SprayWindowResult(
        status="FAVORABLE",
        reason="Current conditions appear suitable for application. Verify product label and local advisories.",
        forecast_horizon_hours=window_hours,
    )


def _check_forecast_rain(
    points: list[NormalizedWeatherPoint], window_hours: int
) -> Optional[str]:
    """Return a reason string if rain is forecast within the window, else None."""
    if not points:
        return None
    now = datetime.now(timezone.utc)
    for pt in points[:3]:  # look at near-term forecast days
        hours_ahead = (pt.timestamp - now).total_seconds() / 3600
        if hours_ahead > window_hours:
            break
        if pt.rainfall_mm and pt.rainfall_mm > RAIN_THRESHOLD_MM:
            return (
                f"Rain forecast ({pt.rainfall_mm:.1f} mm) within {int(hours_ahead)} hours. "
                f"Rainfast period may be compromised — delay application."
            )
        if pt.precipitation_probability and pt.precipitation_probability > 60:
            return (
                f"High rain probability ({pt.precipitation_probability:.0f}%) within {int(hours_ahead)} hours. "
                f"Application not recommended."
            )
    return None
