"""
providers/__init__.py — re-export the public surface of the weather provider module.
"""
from app.weather.providers.base import NormalizedWeatherPoint, DataQuality, WeatherProvider
from app.weather.providers.service import (
    get_current_weather,
    get_forecast,
    get_historical_weather,
    active_provider_name,
)
from app.weather.providers.cache import weather_cache
from app.weather.providers.aggregation import aggregate, build_multi_period_aggregates, WeatherAggregate
from app.weather.providers.normalization import get_profile, PROFILES, DiseaseWeatherProfile
from app.weather.providers.spray_window import evaluate_spray_window, SprayWindowResult
from app.weather.providers.validation import validate_and_tag

__all__ = [
    "NormalizedWeatherPoint",
    "DataQuality",
    "WeatherProvider",
    "get_current_weather",
    "get_forecast",
    "get_historical_weather",
    "active_provider_name",
    "weather_cache",
    "aggregate",
    "build_multi_period_aggregates",
    "WeatherAggregate",
    "get_profile",
    "PROFILES",
    "DiseaseWeatherProfile",
    "evaluate_spray_window",
    "SprayWindowResult",
    "validate_and_tag",
]
