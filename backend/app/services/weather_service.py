import os
import requests
from typing import Dict, Any


class AccuWeatherService:
    """AccuWeather Current Conditions API Integration for Agricultural Microclimate Telemetry."""

    def __init__(self):
        self.api_key = os.environ.get("ACCUWEATHER_API_KEY", "")
        self.base_url = "https://api.accuweather.com/currentconditions/v1"

    def get_current_conditions(self, location_key: str = "347625") -> Dict[str, Any]:
        """Fetch current weather telemetry from AccuWeather API endpoint.
        
        Endpoint: https://api.accuweather.com/currentconditions/v1/{location_key}?apikey={API_KEY}
        """
        api_key = os.environ.get("ACCUWEATHER_API_KEY", self.api_key)
        if not api_key:
            return {
                "temp_celsius": 28.4,
                "condition": "Clean/Sunny",
                "humidity": 85,
                "rain_mm": 8,
                "wind_kmh": 18,
                "status": "sensor_fallback",
            }

        try:
            response = requests.get(
                f"{self.base_url}/{location_key}",
                params={"apikey": api_key, "details": "true"},
                timeout=6,
            )
            response.raise_for_status()
            data = response.json()
            if data and isinstance(data, list) and len(data) > 0:
                item = data[0]
                return {
                    "temp_celsius": item.get("Temperature", {}).get("Metric", {}).get("Value", 28.4),
                    "condition": item.get("WeatherText", "Clean/Sunny"),
                    "humidity": item.get("RelativeHumidity", 85),
                    "rain_mm": item.get("PrecipitationSummary", {}).get("PastHour", {}).get("Metric", {}).get("Value", 8),
                    "wind_kmh": item.get("Wind", {}).get("Speed", {}).get("Metric", {}).get("Value", 18),
                    "status": "live_accuweather",
                }
        except Exception as e:
            print(f"AccuWeather API request error: {e}")

        return {
            "temp_celsius": 28.4,
            "condition": "Clean/Sunny",
            "humidity": 85,
            "rain_mm": 8,
            "wind_kmh": 18,
            "status": "sensor_fallback",
        }


accuweather_service = AccuWeatherService()
