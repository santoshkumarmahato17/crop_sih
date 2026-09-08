"""
Open-Meteo weather provider (free, no API key required).
Docs: https://open-meteo.com/en/docs
This is used as the primary/fallback provider when IMD is not configured.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx

from app.weather.providers.base import WeatherProvider, NormalizedWeatherPoint, DataQuality

logger = logging.getLogger(__name__)

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_HISTORICAL = "https://archive-api.open-meteo.com/v1/archive"

# Field mappings from Open-Meteo variable names to our schema
CURRENT_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "precipitation_probability",
    "wind_speed_10m",
    "wind_direction_10m",
    "dew_point_2m",
    "cloud_cover",
    "weather_code",
    "et0_fao_evapotranspiration",
    "surface_pressure",
    "vapour_pressure_deficit",
    "soil_moisture_0_to_1cm",
    "shortwave_radiation",
]

DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "precipitation_probability_max",
    "wind_speed_10m_max",
    "wind_direction_10m_dominant",
    "et0_fao_evapotranspiration",
    "weather_code",
    "shortwave_radiation_sum",
]

WMO_CODE_MAP = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Icy fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snowfall", 73: "Snowfall", 75: "Heavy snowfall",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm",
}


class OpenMeteoProvider(WeatherProvider):
    """Open-Meteo free weather provider. No API key needed."""

    @property
    def name(self) -> str:
        return "Open-Meteo"

    def is_configured(self) -> bool:
        return True  # Always available — no credentials needed

    async def get_current(self, latitude: float, longitude: float) -> NormalizedWeatherPoint:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join(CURRENT_VARS),
            "wind_speed_unit": "kmh",
            "timezone": "auto",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(OPEN_METEO_BASE, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.error("Open-Meteo current fetch failed: %s", exc)
            return NormalizedWeatherPoint(
                timestamp=datetime.now(timezone.utc),
                latitude=latitude,
                longitude=longitude,
                provider=self.name,
                data_quality=DataQuality.UNAVAILABLE,
            )

        cur = data.get("current", {})
        fetch_time = datetime.now(timezone.utc)
        obs_time_str = cur.get("time")
        try:
            obs_time = datetime.fromisoformat(obs_time_str).astimezone(timezone.utc) if obs_time_str else fetch_time
        except Exception:
            obs_time = fetch_time

        wmo = cur.get("weather_code")
        condition = WMO_CODE_MAP.get(wmo) if wmo is not None else None

        vpd = cur.get("vapour_pressure_deficit")
        et0 = cur.get("et0_fao_evapotranspiration")
        soil = cur.get("soil_moisture_0_to_1cm")

        point = NormalizedWeatherPoint(
            timestamp=obs_time,
            latitude=latitude,
            longitude=longitude,
            temperature_c=cur.get("temperature_2m"),
            relative_humidity_percent=cur.get("relative_humidity_2m"),
            rainfall_mm=cur.get("precipitation"),
            precipitation_probability=cur.get("precipitation_probability"),
            wind_speed_kmh=cur.get("wind_speed_10m"),
            wind_direction_deg=cur.get("wind_direction_10m"),
            dew_point_c=cur.get("dew_point_2m"),
            cloud_cover_percent=cur.get("cloud_cover"),
            solar_radiation_w_m2=cur.get("shortwave_radiation"),
            soil_moisture_percent=_pct(soil, scale=100.0) if soil is not None else None,
            et0_mm=et0,
            vpd_kpa=vpd,
            condition_text=condition,
            provider=self.name,
            model="Open-Meteo ERA5 Reanalysis + IFS",
            source_timestamp=fetch_time,
            data_quality=DataQuality.GOOD,
            is_forecast=False,
        )
        return point

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        days: int = 7,
    ) -> list[NormalizedWeatherPoint]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": ",".join(DAILY_VARS),
            "wind_speed_unit": "kmh",
            "forecast_days": min(days, 16),
            "timezone": "auto",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(OPEN_METEO_BASE, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.error("Open-Meteo forecast fetch failed: %s", exc)
            return []

        daily = data.get("daily", {})
        fetch_time = datetime.now(timezone.utc)
        dates = daily.get("time", [])
        results: list[NormalizedWeatherPoint] = []

        for i, date_str in enumerate(dates):
            try:
                ts = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
            except Exception:
                continue
            wmo = _idx(daily.get("weather_code"), i)
            condition = WMO_CODE_MAP.get(wmo) if wmo is not None else None
            results.append(NormalizedWeatherPoint(
                timestamp=ts,
                latitude=latitude,
                longitude=longitude,
                temperature_c=_idx(daily.get("temperature_2m_max"), i),
                min_temperature_c=_idx(daily.get("temperature_2m_min"), i),
                max_temperature_c=_idx(daily.get("temperature_2m_max"), i),
                rainfall_mm=_idx(daily.get("precipitation_sum"), i),
                precipitation_probability=_idx(daily.get("precipitation_probability_max"), i),
                wind_speed_kmh=_idx(daily.get("wind_speed_10m_max"), i),
                wind_direction_deg=_idx(daily.get("wind_direction_10m_dominant"), i),
                et0_mm=_idx(daily.get("et0_fao_evapotranspiration"), i),
                solar_radiation_w_m2=_idx(daily.get("shortwave_radiation_sum"), i),
                condition_text=condition,
                provider=self.name,
                model="Open-Meteo ECMWF IFS",
                source_timestamp=fetch_time,
                data_quality=DataQuality.GOOD,
                is_forecast=True,
            ))
        return results

    async def get_historical(
        self,
        latitude: float,
        longitude: float,
        days_back: int = 7,
    ) -> list[NormalizedWeatherPoint]:
        end_date = datetime.now(timezone.utc).date() - timedelta(days=1)
        start_date = end_date - timedelta(days=days_back - 1)
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ",".join(DAILY_VARS),
            "wind_speed_unit": "kmh",
            "timezone": "auto",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(OPEN_METEO_HISTORICAL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            logger.error("Open-Meteo historical fetch failed: %s", exc)
            return []

        daily = data.get("daily", {})
        fetch_time = datetime.now(timezone.utc)
        results: list[NormalizedWeatherPoint] = []
        for i, date_str in enumerate(daily.get("time", [])):
            try:
                ts = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
            except Exception:
                continue
            results.append(NormalizedWeatherPoint(
                timestamp=ts,
                latitude=latitude,
                longitude=longitude,
                temperature_c=_idx(daily.get("temperature_2m_max"), i),
                min_temperature_c=_idx(daily.get("temperature_2m_min"), i),
                max_temperature_c=_idx(daily.get("temperature_2m_max"), i),
                rainfall_mm=_idx(daily.get("precipitation_sum"), i),
                precipitation_probability=_idx(daily.get("precipitation_probability_max"), i),
                wind_speed_kmh=_idx(daily.get("wind_speed_10m_max"), i),
                wind_direction_deg=_idx(daily.get("wind_direction_10m_dominant"), i),
                et0_mm=_idx(daily.get("et0_fao_evapotranspiration"), i),
                provider=self.name,
                model="Open-Meteo ERA5 Archive",
                source_timestamp=fetch_time,
                data_quality=DataQuality.GOOD,
                is_forecast=False,
            ))
        return results


def _idx(lst: Optional[list], i: int):
    """Safe list index — returns None if out of bounds or None value."""
    if lst is None or i >= len(lst):
        return None
    return lst[i]


def _pct(value: Optional[float], scale: float = 1.0) -> Optional[float]:
    if value is None:
        return None
    return round(value * scale, 2)
