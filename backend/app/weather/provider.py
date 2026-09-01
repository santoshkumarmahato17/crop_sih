from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
import math
import os
from typing import Any, Dict, List, Optional
import httpx


@dataclass
class WeatherDataPoint:
    """Standardized agronomic weather observation or forecast point."""
    timestamp: datetime
    temperature_c: float
    min_temperature_c: Optional[float] = None
    max_temperature_c: Optional[float] = None
    relative_humidity_percent: float = 70.0
    rainfall_mm: float = 0.0
    rainfall_probability_percent: float = 0.0
    rainfall_duration_hours: Optional[float] = None
    wind_speed_mps: float = 2.5
    wind_direction_deg: float = 180.0
    solar_radiation_w_m2: Optional[float] = 600.0
    cloud_cover_percent: Optional[float] = 30.0
    soil_moisture_percent: Optional[float] = None
    leaf_wetness_hours: Optional[float] = None
    condition_text: str = "Partly Cloudy"
    source: str = "mock_provider"
    is_forecast: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class WeatherDataProvider(ABC):
    """Abstract Base Class for meteorological telemetry and forecast providers."""

    @abstractmethod
    async def get_current_weather(self, latitude: float, longitude: float) -> WeatherDataPoint:
        """Retrieve current in-situ or nearest gridded weather observation."""
        pass

    @abstractmethod
    async def get_forecast(
        self, latitude: float, longitude: float, days: int = 7
    ) -> List[WeatherDataPoint]:
        """Retrieve multi-day forward meteorological forecast."""
        pass

    @abstractmethod
    async def get_historical_weather(
        self, latitude: float, longitude: float, days_back: int = 7
    ) -> List[WeatherDataPoint]:
        """Retrieve recent historical weather observations."""
        pass


class MockWeatherProvider(WeatherDataProvider):
    """Deterministic, agronomy-calibrated weather simulator for development, testing, and offline resilience."""

    def __init__(self, simulation_profile: str = "elevated_humidity_outbreak"):
        self.profile = simulation_profile

    async def get_current_weather(self, latitude: float, longitude: float) -> WeatherDataPoint:
        now = datetime.now(timezone.utc)
        # Baseline weather for agricultural region
        return WeatherDataPoint(
            timestamp=now,
            temperature_c=28.4,
            min_temperature_c=21.0,
            max_temperature_c=31.5,
            relative_humidity_percent=82.0,
            rainfall_mm=14.5,
            rainfall_probability_percent=75.0,
            rainfall_duration_hours=3.5,
            wind_speed_mps=3.8,
            wind_direction_deg=225.0,
            solar_radiation_w_m2=540.0,
            cloud_cover_percent=65.0,
            soil_moisture_percent=42.0,
            condition_text="Humid & Intermittent Rain",
            source="mock_agri_provider",
            is_forecast=False,
        )

    async def get_forecast(
        self, latitude: float, longitude: float, days: int = 7
    ) -> List[WeatherDataPoint]:
        now = datetime.now(timezone.utc)
        forecast_points: List[WeatherDataPoint] = []

        # Generate realistic trajectory: Initial wet & humid conditions building up pathogen threat
        daily_profiles = [
            {"day": 0, "temp": 28.5, "min_t": 21.2, "max_t": 31.0, "hum": 82.0, "rain": 12.0, "rain_prob": 70, "cond": "Scattered Showers"},
            {"day": 1, "temp": 27.8, "min_t": 20.5, "max_t": 30.2, "hum": 86.0, "rain": 24.0, "rain_prob": 85, "cond": "Heavy Rain & Humid"},
            {"day": 2, "temp": 26.5, "min_t": 19.8, "max_t": 28.9, "hum": 89.0, "rain": 38.0, "rain_prob": 90, "cond": "Persistent Monsoonal Rain"},
            {"day": 3, "temp": 27.0, "min_t": 20.0, "max_t": 29.5, "hum": 84.0, "rain": 16.0, "rain_prob": 75, "cond": "Humid / Overcast"},
            {"day": 4, "temp": 29.2, "min_t": 21.5, "max_t": 32.8, "hum": 76.0, "rain": 4.0, "rain_prob": 40, "cond": "Warm & Humid"},
            {"day": 5, "temp": 30.5, "min_t": 22.0, "max_t": 34.0, "hum": 68.0, "rain": 0.0, "rain_prob": 20, "cond": "Sunny Intervals"},
            {"day": 6, "temp": 31.8, "min_t": 22.8, "max_t": 35.5, "hum": 62.0, "rain": 0.0, "rain_prob": 10, "cond": "Clear & Warm"},
            {"day": 7, "temp": 32.5, "min_t": 23.0, "max_t": 36.0, "hum": 58.0, "rain": 0.0, "rain_prob": 5, "cond": "Dry & High Heat"},
        ]

        for i in range(min(days + 1, len(daily_profiles))):
            p = daily_profiles[i]
            fc_time = now + timedelta(days=p["day"])
            forecast_points.append(
                WeatherDataPoint(
                    timestamp=fc_time,
                    temperature_c=p["temp"],
                    min_temperature_c=p["min_t"],
                    max_temperature_c=p["max_t"],
                    relative_humidity_percent=p["hum"],
                    rainfall_mm=p["rain"],
                    rainfall_probability_percent=p["rain_prob"],
                    rainfall_duration_hours=round(p["rain"] / 5.0, 1) if p["rain"] > 0 else 0.0,
                    wind_speed_mps=round(3.0 + 1.5 * math.sin(i), 1),
                    wind_direction_deg=210.0 + (i * 15) % 180,
                    solar_radiation_w_m2=round(400.0 + 300.0 * (1 - p["hum"] / 100.0), 0),
                    cloud_cover_percent=p["hum"] * 0.8,
                    soil_moisture_percent=round(max(20.0, min(85.0, 35.0 + p["rain"] * 1.2)), 1),
                    condition_text=p["cond"],
                    source="mock_agri_provider",
                    is_forecast=(i > 0),
                )
            )

        return forecast_points

    async def get_historical_weather(
        self, latitude: float, longitude: float, days_back: int = 7
    ) -> List[WeatherDataPoint]:
        now = datetime.now(timezone.utc)
        hist_points: List[WeatherDataPoint] = []
        for d in range(days_back, 0, -1):
            t = now - timedelta(days=d)
            hist_points.append(
                WeatherDataPoint(
                    timestamp=t,
                    temperature_c=round(27.0 + 2.0 * math.sin(d), 1),
                    min_temperature_c=20.0,
                    max_temperature_c=31.0,
                    relative_humidity_percent=round(72.0 + 10.0 * math.cos(d), 1),
                    rainfall_mm=round(max(0.0, 15.0 * math.sin(d * 1.2)), 1),
                    wind_speed_mps=3.2,
                    source="mock_historical_archive",
                    is_forecast=False,
                )
            )
        return hist_points


class OpenMeteoWeatherProvider(WeatherDataProvider):
    """Open-Meteo High-Resolution Agro-Meteorological API integration with non-blocking graceful fallback."""

    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        self.api_key = os.environ.get("OPEN_METEO_API_KEY", "")

    async def get_current_weather(self, latitude: float, longitude: float) -> WeatherDataPoint:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                params = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover",
                }
                res = await client.get(self.base_url, params=params)
                if res.status_code == 200:
                    data = res.json().get("current", {})
                    return WeatherDataPoint(
                        timestamp=datetime.now(timezone.utc),
                        temperature_c=float(data.get("temperature_2m", 28.0)),
                        relative_humidity_percent=float(data.get("relative_humidity_2m", 75.0)),
                        rainfall_mm=float(data.get("precipitation", 0.0)),
                        wind_speed_mps=float(data.get("wind_speed_10m", 3.0)),
                        wind_direction_deg=float(data.get("wind_direction_10m", 180.0)),
                        cloud_cover_percent=float(data.get("cloud_cover", 40.0)),
                        condition_text="Live Open-Meteo Telemetry",
                        source="open_meteo_live",
                        is_forecast=False,
                    )
        except Exception:
            pass

        # Fallback to simulated provider
        return await MockWeatherProvider().get_current_weather(latitude, longitude)

    async def get_forecast(
        self, latitude: float, longitude: float, days: int = 7
    ) -> List[WeatherDataPoint]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                params = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
                    "forecast_days": min(days + 1, 14),
                    "timezone": "auto",
                }
                res = await client.get(self.base_url, params=params)
                if res.status_code == 200:
                    data = res.json().get("daily", {})
                    times = data.get("time", [])
                    max_temps = data.get("temperature_2m_max", [])
                    min_temps = data.get("temperature_2m_min", [])
                    precips = data.get("precipitation_sum", [])
                    probs = data.get("precipitation_probability_max", [])
                    winds = data.get("wind_speed_10m_max", [])

                    forecasts: List[WeatherDataPoint] = []
                    for i, t_str in enumerate(times):
                        dt = datetime.fromisoformat(t_str).replace(tzinfo=timezone.utc)
                        max_t = float(max_temps[i]) if i < len(max_temps) else 30.0
                        min_t = float(min_temps[i]) if i < len(min_temps) else 20.0
                        mean_t = (max_t + min_t) / 2.0
                        rain = float(precips[i]) if i < len(precips) else 0.0
                        prob = float(probs[i]) if i < len(probs) else 0.0
                        wind = float(winds[i]) if i < len(winds) else 3.0

                        forecasts.append(
                            WeatherDataPoint(
                                timestamp=dt,
                                temperature_c=mean_t,
                                min_temperature_c=min_t,
                                max_temperature_c=max_t,
                                relative_humidity_percent=max(45.0, min(95.0, 65.0 + rain * 1.5)),
                                rainfall_mm=rain,
                                rainfall_probability_percent=prob,
                                wind_speed_mps=wind,
                                source="open_meteo_forecast",
                                is_forecast=(i > 0),
                            )
                        )
                    if forecasts:
                        return forecasts
        except Exception:
            pass

        return await MockWeatherProvider().get_forecast(latitude, longitude, days=days)

    async def get_historical_weather(
        self, latitude: float, longitude: float, days_back: int = 7
    ) -> List[WeatherDataPoint]:
        return await MockWeatherProvider().get_historical_weather(latitude, longitude, days_back=days_back)


def get_weather_provider() -> WeatherDataProvider:
    """Factory creating appropriate weather provider based on runtime environment."""
    provider_type = os.environ.get("AGRISHIELD_WEATHER_PROVIDER", "hybrid").lower()
    if provider_type == "open_meteo":
        return OpenMeteoWeatherProvider()
    elif provider_type == "mock":
        return MockWeatherProvider()
    else:
        # Default: OpenMeteo with Mock fallback
        return OpenMeteoWeatherProvider()
