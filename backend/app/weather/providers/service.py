"""
Weather provider service.
Implements IMD-first, Open-Meteo-fallback logic with caching and validation.
"""
from __future__ import annotations
import logging
from typing import Optional

from app.weather.providers.base import NormalizedWeatherPoint, DataQuality
from app.weather.providers.imd import IMDWeatherProvider
from app.weather.providers.open_meteo import OpenMeteoProvider
from app.weather.providers.cache import weather_cache
from app.weather.providers.validation import validate_and_tag

logger = logging.getLogger(__name__)

_imd = IMDWeatherProvider()
_open_meteo = OpenMeteoProvider()


def _select_provider():
    """Return IMD if fully configured, otherwise Open-Meteo."""
    if _imd.is_configured():
        return _imd, _open_meteo
    return _open_meteo, None


async def get_current_weather(
    latitude: float,
    longitude: float,
    *,
    force_refresh: bool = False,
) -> NormalizedWeatherPoint:
    """
    Retrieve current weather. Uses cache unless force_refresh=True.
    Provider priority: IMD → Open-Meteo.
    """
    if not force_refresh:
        cached = await weather_cache.get_current(latitude, longitude)
        if cached is not None:
            return cached

    primary, fallback = _select_provider()
    result = await primary.get_current(latitude, longitude)
    result = validate_and_tag(result)

    # Fallback if primary returned UNAVAILABLE and we have a secondary
    if result.data_quality == DataQuality.UNAVAILABLE and fallback is not None:
        logger.info("Primary provider %s unavailable, falling back to %s", primary.name, fallback.name)
        result = await fallback.get_current(latitude, longitude)
        result = validate_and_tag(result)

    await weather_cache.set_current(latitude, longitude, result)
    return result


async def get_forecast(
    latitude: float,
    longitude: float,
    *,
    days: int = 7,
    force_refresh: bool = False,
) -> list[NormalizedWeatherPoint]:
    """
    Retrieve weather forecast. Uses cache unless force_refresh=True.
    """
    if not force_refresh:
        cached = await weather_cache.get_forecast(latitude, longitude, days)
        if cached is not None:
            return cached

    primary, fallback = _select_provider()
    results = await primary.get_forecast(latitude, longitude, days=days)

    if not results and fallback is not None:
        logger.info("Primary forecast unavailable, falling back to %s", fallback.name)
        results = await fallback.get_forecast(latitude, longitude, days=days)

    validated = [validate_and_tag(p) for p in results]
    await weather_cache.set_forecast(latitude, longitude, days, validated)
    return validated


async def get_historical_weather(
    latitude: float,
    longitude: float,
    *,
    days_back: int = 7,
    force_refresh: bool = False,
) -> list[NormalizedWeatherPoint]:
    """
    Retrieve historical weather data. Uses cache.
    """
    if not force_refresh:
        cached = await weather_cache.get_historical(latitude, longitude, days_back)
        if cached is not None:
            return cached

    primary, fallback = _select_provider()
    results = await primary.get_historical(latitude, longitude, days_back=days_back)

    if not results and fallback is not None:
        logger.info("Primary historical unavailable, falling back to %s", fallback.name)
        results = await fallback.get_historical(latitude, longitude, days_back=days_back)

    validated = [validate_and_tag(p) for p in results]
    await weather_cache.set_historical(latitude, longitude, days_back, validated)
    return validated


def active_provider_name() -> str:
    """Return the name of the currently active primary provider."""
    primary, _ = _select_provider()
    return primary.name
