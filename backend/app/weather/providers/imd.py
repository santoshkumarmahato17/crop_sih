"""
India Meteorological Department (IMD) weather provider.

IMD does not have a public REST API key system like commercial vendors.
Access is granted via official bilateral agreements/data-sharing protocols.
When IMD credentials/endpoints are configured via environment variables,
this provider takes priority. When not configured, falls back to Open-Meteo.

Supported IMD endpoints (configure via .env):
  IMD_API_BASE_URL     - Base URL of IMD API gateway
  IMD_API_KEY          - API token/key issued by IMD
  IMD_STATION_DATASET  - Station observation dataset endpoint

If none of the above are set, is_configured() returns False and the
WeatherService will automatically use the Open-Meteo fallback.
"""
from __future__ import annotations
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx

from app.weather.providers.base import WeatherProvider, NormalizedWeatherPoint, DataQuality

logger = logging.getLogger(__name__)


class IMDWeatherProvider(WeatherProvider):
    """
    IMD Weather Provider.
    Authoritative source for Indian sub-continental weather data.
    Only active when IMD_API_BASE_URL and IMD_API_KEY are configured.
    """

    def __init__(self) -> None:
        self._base_url: Optional[str] = os.getenv("IMD_API_BASE_URL")
        self._api_key: Optional[str] = os.getenv("IMD_API_KEY")
        self._station_dataset: str = os.getenv("IMD_STATION_DATASET", "observations")

    @property
    def name(self) -> str:
        return "IMD"

    def is_configured(self) -> bool:
        return bool(self._base_url and self._api_key)

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._api_key}", "Accept": "application/json"}

    async def get_current(self, latitude: float, longitude: float) -> NormalizedWeatherPoint:
        if not self.is_configured():
            return _unavailable(latitude, longitude, self.name)

        url = f"{self._base_url}/current"
        params = {"lat": latitude, "lon": longitude}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self._headers())
                resp.raise_for_status()
                raw = resp.json()
        except Exception as exc:
            logger.warning("IMD current fetch failed: %s", exc)
            return _unavailable(latitude, longitude, self.name)

        return _parse_imd_current(raw, latitude, longitude)

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        days: int = 7,
    ) -> list[NormalizedWeatherPoint]:
        if not self.is_configured():
            return []

        url = f"{self._base_url}/forecast"
        params = {"lat": latitude, "lon": longitude, "days": days}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self._headers())
                resp.raise_for_status()
                raw = resp.json()
        except Exception as exc:
            logger.warning("IMD forecast fetch failed: %s", exc)
            return []

        return _parse_imd_forecast(raw, latitude, longitude)

    async def get_historical(
        self,
        latitude: float,
        longitude: float,
        days_back: int = 7,
    ) -> list[NormalizedWeatherPoint]:
        if not self.is_configured():
            return []

        end_date = datetime.now(timezone.utc).date() - timedelta(days=1)
        start_date = end_date - timedelta(days=days_back - 1)
        url = f"{self._base_url}/historical"
        params = {
            "lat": latitude,
            "lon": longitude,
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params, headers=self._headers())
                resp.raise_for_status()
                raw = resp.json()
        except Exception as exc:
            logger.warning("IMD historical fetch failed: %s", exc)
            return []

        return _parse_imd_forecast(raw, latitude, longitude)


# ---------------------------------------------------------------------------
# IMD response parsers
# These are kept separate so they can be tested independently.
# Field names are illustrative and will need to match actual IMD API schema.
# ---------------------------------------------------------------------------

def _parse_imd_current(raw: dict, lat: float, lon: float) -> NormalizedWeatherPoint:
    """Parse IMD current observation JSON."""
    fetch_time = datetime.now(timezone.utc)
    obs_time_str = raw.get("obs_time") or raw.get("observationTime") or raw.get("time")
    try:
        obs_time = datetime.fromisoformat(str(obs_time_str)).astimezone(timezone.utc)
    except Exception:
        obs_time = fetch_time

    # Normalize fields — all Optional, never fabricate
    return NormalizedWeatherPoint(
        timestamp=obs_time,
        latitude=lat,
        longitude=lon,
        temperature_c=_f(raw, "temp", "temperature", "temp_c"),
        relative_humidity_percent=_f(raw, "rh", "relative_humidity", "humidity"),
        rainfall_mm=_f(raw, "rainfall", "rain_mm", "precipitation"),
        wind_speed_kmh=_f(raw, "wind_speed_kmh", "windspeed", "wind_speed"),
        wind_direction_deg=_f(raw, "wind_dir", "wind_direction", "winddir"),
        dew_point_c=_f(raw, "dew_point", "dewpoint_c"),
        condition_text=raw.get("weather_description") or raw.get("condition"),
        location_name=raw.get("station_name") or raw.get("district"),
        provider="IMD",
        model=raw.get("model") or "IMD Station Observation",
        source_timestamp=fetch_time,
        data_quality=DataQuality.GOOD,
        is_forecast=False,
    )


def _parse_imd_forecast(raw: dict, lat: float, lon: float) -> list[NormalizedWeatherPoint]:
    """Parse IMD forecast/historical JSON into NormalizedWeatherPoint list."""
    records = raw.get("forecasts") or raw.get("data") or raw.get("observations") or []
    if not isinstance(records, list):
        return []

    fetch_time = datetime.now(timezone.utc)
    results: list[NormalizedWeatherPoint] = []
    for rec in records:
        time_str = rec.get("date") or rec.get("time") or rec.get("forecast_time")
        try:
            ts = datetime.fromisoformat(str(time_str)).astimezone(timezone.utc)
        except Exception:
            continue
        results.append(NormalizedWeatherPoint(
            timestamp=ts,
            latitude=lat,
            longitude=lon,
            temperature_c=_f(rec, "max_temp", "temp", "temperature"),
            min_temperature_c=_f(rec, "min_temp"),
            max_temperature_c=_f(rec, "max_temp"),
            relative_humidity_percent=_f(rec, "rh", "relative_humidity", "humidity"),
            rainfall_mm=_f(rec, "rainfall", "rain_mm", "expected_rainfall"),
            precipitation_probability=_f(rec, "rain_probability", "precip_probability"),
            wind_speed_kmh=_f(rec, "wind_speed_kmh", "windspeed"),
            wind_direction_deg=_f(rec, "wind_dir", "wind_direction"),
            condition_text=rec.get("weather_description") or rec.get("condition"),
            provider="IMD",
            model=rec.get("model") or "IMD District Forecast",
            source_timestamp=fetch_time,
            data_quality=DataQuality.GOOD,
            is_forecast=True,
        ))
    return results


def _f(d: dict, *keys: str) -> Optional[float]:
    """Try multiple key names, return float or None — never fabricate."""
    for k in keys:
        v = d.get(k)
        if v is not None:
            try:
                return float(v)
            except (TypeError, ValueError):
                continue
    return None


def _unavailable(lat: float, lon: float, provider: str) -> NormalizedWeatherPoint:
    return NormalizedWeatherPoint(
        timestamp=datetime.now(timezone.utc),
        latitude=lat,
        longitude=lon,
        provider=provider,
        data_quality=DataQuality.UNAVAILABLE,
    )
