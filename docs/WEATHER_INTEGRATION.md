# KISAN SATHI Weather Integration

## Overview
This document describes the real-time weather integration architecture implemented for KISAN SATHI. The system replaces mocked weather data with authoritative real-time and forecasted weather data via a robust provider strategy pattern.

## Provider Architecture

The weather integration is built using a Provider pattern (Strategy pattern) located in `backend/app/weather/providers/`:

- `IMDWeatherProvider` (`imd.py`): The primary, authoritative weather provider. Integrates with the India Meteorological Department. It requires configuration via `.env` (API key, base URL).
- `OpenMeteoProvider` (`open_meteo.py`): The fallback provider. A free, high-availability service that does not require an API key.

### Data Flow
1. **Service Layer** (`service.py`): The entrypoint (`get_current_weather`, `get_forecast`, `get_historical_weather`) routes requests through the cache first.
2. **Fallback Logic**: If the cache misses, the system attempts to fetch from IMD (if configured). If IMD fails or is unconfigured, it automatically falls back to Open-Meteo.
3. **Validation & Tagging** (`validation.py`): The raw data is validated. Missing fields are flagged, and the data is tagged with a `data_quality` status (`GOOD`, `STALE`, or `UNAVAILABLE`).
4. **Caching** (`cache.py`): To prevent external API rate-limiting, all responses are cached in memory using configurable TTLs (Time-to-Live).

## Integrations

### Crop Health Risk Engine
The risk engine (`risk_engine_service.py`) relies on real weather data to adjust its risk scores. It consumes current temperature, humidity, and historical rainfall to accurately evaluate conditions conducive to diseases like blight or pests.

### Drone Monitoring Priority
The drone scheduling system (`drone.py`) uses real-time weather to alter the priority of drone flights. 
- If recent rainfall is high (> 5mm), drone mission priorities are escalated to `CRITICAL` for post-rain damage assessment.
- If wind speeds are high (> 20km/h), priorities are escalated to `HIGH` so they can be executed immediately when the wind calms down.

### Government Intelligence
The Agricultural Extension Officer Dashboard (`officer_service.py`) evaluates the urgency of farms based on weather conditions. High rainfall and high humidity increase the priority tier of farms in the officer's portfolio, directing attention to the most vulnerable areas first.

### Pesticide Spray Window
The system calculates the safest and most effective window for pesticide application (`spray_window.py`).
- **UNFAVORABLE**: Forecasted rain or high wind speeds (> 20 km/h).
- **LIMITED**: High relative humidity which may reduce product efficacy.
- **FAVORABLE**: Clear conditions.

## Configuration

Weather settings are managed via `.env`. Example configurations:

```ini
KISANSATHI_WEATHER_PROVIDER=open_meteo

# IMD Config
IMD_API_BASE_URL=
IMD_API_KEY=
IMD_STATION_DATASET=observations

# Cache TTLs (Seconds)
CURRENT_WEATHER_CACHE_TTL=1800
FORECAST_CACHE_TTL=10800
HISTORICAL_WEATHER_CACHE_TTL=21600
```
