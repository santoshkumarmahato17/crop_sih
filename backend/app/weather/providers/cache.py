"""
Server-side in-memory weather cache with configurable TTL.
Prevents hammering external APIs on every dashboard render.
"""
from __future__ import annotations
import asyncio
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Optional

from app.weather.providers.base import NormalizedWeatherPoint

logger = logging.getLogger(__name__)

# TTL defaults (seconds). Override via environment variables.
CURRENT_TTL = int(os.getenv("CURRENT_WEATHER_CACHE_TTL", "1800"))    # 30 minutes
FORECAST_TTL = int(os.getenv("FORECAST_CACHE_TTL", "10800"))          # 3 hours
HISTORICAL_TTL = int(os.getenv("HISTORICAL_WEATHER_CACHE_TTL", "21600"))  # 6 hours


@dataclass
class _CacheEntry:
    data: object
    stored_at: float = field(default_factory=time.monotonic)

    def is_stale(self, ttl: int) -> bool:
        return (time.monotonic() - self.stored_at) > ttl


class WeatherCache:
    """Thread-safe (asyncio) in-memory weather data cache."""

    def __init__(self) -> None:
        self._current: dict[str, _CacheEntry] = {}
        self._forecast: dict[str, _CacheEntry] = {}
        self._historical: dict[str, _CacheEntry] = {}
        self._lock = asyncio.Lock()

    @staticmethod
    def _key(lat: float, lon: float, extra: str = "") -> str:
        return f"{lat:.4f}:{lon:.4f}:{extra}"

    # ── Current ──────────────────────────────────────────────────────────────

    async def get_current(
        self, lat: float, lon: float
    ) -> Optional[NormalizedWeatherPoint]:
        key = self._key(lat, lon, "current")
        async with self._lock:
            entry = self._current.get(key)
        if entry and not entry.is_stale(CURRENT_TTL):
            logger.debug("Cache HIT current weather %s", key)
            return entry.data  # type: ignore
        return None

    async def set_current(
        self, lat: float, lon: float, data: NormalizedWeatherPoint
    ) -> None:
        key = self._key(lat, lon, "current")
        async with self._lock:
            self._current[key] = _CacheEntry(data=data)

    # ── Forecast ─────────────────────────────────────────────────────────────

    async def get_forecast(
        self, lat: float, lon: float, days: int
    ) -> Optional[list[NormalizedWeatherPoint]]:
        key = self._key(lat, lon, f"fc:{days}")
        async with self._lock:
            entry = self._forecast.get(key)
        if entry and not entry.is_stale(FORECAST_TTL):
            logger.debug("Cache HIT forecast %s", key)
            return entry.data  # type: ignore
        return None

    async def set_forecast(
        self, lat: float, lon: float, days: int, data: list[NormalizedWeatherPoint]
    ) -> None:
        key = self._key(lat, lon, f"fc:{days}")
        async with self._lock:
            self._forecast[key] = _CacheEntry(data=data)

    # ── Historical ───────────────────────────────────────────────────────────

    async def get_historical(
        self, lat: float, lon: float, days_back: int
    ) -> Optional[list[NormalizedWeatherPoint]]:
        key = self._key(lat, lon, f"hist:{days_back}")
        async with self._lock:
            entry = self._historical.get(key)
        if entry and not entry.is_stale(HISTORICAL_TTL):
            logger.debug("Cache HIT historical %s", key)
            return entry.data  # type: ignore
        return None

    async def set_historical(
        self, lat: float, lon: float, days_back: int, data: list[NormalizedWeatherPoint]
    ) -> None:
        key = self._key(lat, lon, f"hist:{days_back}")
        async with self._lock:
            self._historical[key] = _CacheEntry(data=data)

    def clear(self) -> None:
        self._current.clear()
        self._forecast.clear()
        self._historical.clear()


# Singleton cache instance shared across the application
weather_cache = WeatherCache()
