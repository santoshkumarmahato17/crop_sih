"""
Normalized Weather API endpoints — /api/v1/weather/*
Connects to real weather data via the providers service layer.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.models.farm import Farm
from app.weather.providers import (
    get_current_weather,
    get_forecast,
    get_historical_weather,
    build_multi_period_aggregates,
    evaluate_spray_window,
    active_provider_name,
    DataQuality,
)

router = APIRouter(tags=["Weather Real-time"])


async def _resolve_farm_coords(
    farm_id: str,
    lat: Optional[float],
    lon: Optional[float],
    db: AsyncSession,
) -> tuple[float, float, Optional[str]]:
    """
    Resolve latitude/longitude for a farm.
    Priority: query params > farm.center_point in DB.
    Raises 404 if farm not found and no explicit coords given.
    """
    if lat is not None and lon is not None:
        return lat, lon, None

    try:
        result = await db.execute(select(Farm).where(Farm.id == farm_id))
        farm = result.scalar_one_or_none()
    except Exception:
        farm = None

    if farm is None:
        raise HTTPException(
            status_code=404,
            detail=f"Farm '{farm_id}' not found. Provide lat/lon query params to override.",
        )

    # Extract lat/lon from PostGIS center_point POINT geometry
    if farm.center_point is not None:
        from geoalchemy2.shape import to_shape
        pt = to_shape(farm.center_point)
        return pt.y, pt.x, getattr(farm, "name", None)

    raise HTTPException(
        status_code=422,
        detail=f"Farm '{farm_id}' has no center_point. Provide lat/lon query params.",
    )


@router.get("/weather/current/{farm_id}", summary="Get Real Current Weather for Farm")
async def get_weather_current(
    farm_id: str,
    lat: Optional[float] = Query(None, description="Farm latitude (overrides DB)"),
    lon: Optional[float] = Query(None, description="Farm longitude (overrides DB)"),
    force_refresh: bool = Query(False, description="Bypass cache and fetch fresh data"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Returns current real weather data for the farm.
    Source: IMD (if configured) → Open-Meteo fallback.
    Never returns fabricated values.
    """
    farm_lat, farm_lon, farm_name = await _resolve_farm_coords(farm_id, lat, lon, db)
    data = await get_current_weather(farm_lat, farm_lon, force_refresh=force_refresh)

    return {
        "farm_id": farm_id,
        "location": {
            "latitude": farm_lat,
            "longitude": farm_lon,
            "name": data.location_name or farm_name,
        },
        "current": {
            "temperature_c": data.temperature_c,
            "relative_humidity_percent": data.relative_humidity_percent,
            "rainfall_mm": data.rainfall_mm,
            "precipitation_probability_percent": data.precipitation_probability,
            "wind_speed_kmh": data.wind_speed_kmh,
            "wind_direction_deg": data.wind_direction_deg,
            "dew_point_c": data.dew_point_c,
            "soil_moisture_percent": data.soil_moisture_percent,
            "et0_mm": data.et0_mm,
            "vpd_kpa": data.vpd_kpa,
            "cloud_cover_percent": data.cloud_cover_percent,
            "solar_radiation_w_m2": data.solar_radiation_w_m2,
            "condition_text": data.condition_text,
        },
        "source": {
            "provider": data.provider,
            "model": data.model,
            "observed_at": data.timestamp.isoformat() if data.timestamp else None,
            "source_timestamp": data.source_timestamp.isoformat() if data.source_timestamp else None,
            "data_quality": data.data_quality.value if data.data_quality else "UNAVAILABLE",
        },
    }


@router.get("/weather/forecast/{farm_id}", summary="Get Real Weather Forecast for Farm")
async def get_weather_forecast(
    farm_id: str,
    days: int = Query(7, ge=1, le=14, description="Forecast horizon in days"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Returns multi-day weather forecast for the farm."""
    farm_lat, farm_lon, farm_name = await _resolve_farm_coords(farm_id, lat, lon, db)
    points = await get_forecast(farm_lat, farm_lon, days=days)

    forecast_items = []
    for pt in points:
        forecast_items.append({
            "date": pt.timestamp.isoformat(),
            "temperature_c": pt.temperature_c,
            "min_temperature_c": pt.min_temperature_c,
            "max_temperature_c": pt.max_temperature_c,
            "relative_humidity_percent": pt.relative_humidity_percent,
            "rainfall_mm": pt.rainfall_mm,
            "precipitation_probability_percent": pt.precipitation_probability,
            "wind_speed_kmh": pt.wind_speed_kmh,
            "wind_direction_deg": pt.wind_direction_deg,
            "condition_text": pt.condition_text,
            "et0_mm": pt.et0_mm,
            "data_quality": pt.data_quality.value if pt.data_quality else "UNAVAILABLE",
        })

    provider = points[0].provider if points else active_provider_name()
    return {
        "farm_id": farm_id,
        "location": {"latitude": farm_lat, "longitude": farm_lon, "name": farm_name},
        "days_requested": days,
        "forecast": forecast_items,
        "source": {
            "provider": provider,
            "data_quality": "GOOD" if forecast_items else "UNAVAILABLE",
        },
    }


@router.get("/weather/history/{farm_id}", summary="Get Historical Weather for Farm")
async def get_weather_history(
    farm_id: str,
    days_back: int = Query(7, ge=1, le=30),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Returns historical weather observations for the farm."""
    farm_lat, farm_lon, farm_name = await _resolve_farm_coords(farm_id, lat, lon, db)
    points = await get_historical_weather(farm_lat, farm_lon, days_back=days_back)

    history_items = [
        {
            "date": pt.timestamp.isoformat(),
            "temperature_c": pt.temperature_c,
            "min_temperature_c": pt.min_temperature_c,
            "max_temperature_c": pt.max_temperature_c,
            "relative_humidity_percent": pt.relative_humidity_percent,
            "rainfall_mm": pt.rainfall_mm,
            "wind_speed_kmh": pt.wind_speed_kmh,
            "wind_direction_deg": pt.wind_direction_deg,
            "et0_mm": pt.et0_mm,
            "data_quality": pt.data_quality.value if pt.data_quality else "UNAVAILABLE",
        }
        for pt in points
    ]

    provider = points[0].provider if points else active_provider_name()
    return {
        "farm_id": farm_id,
        "location": {"latitude": farm_lat, "longitude": farm_lon},
        "days_back": days_back,
        "history": history_items,
        "source": {"provider": provider},
    }


@router.get("/weather/summary/{farm_id}", summary="Get Aggregated Historical Weather Summary")
async def get_weather_summary(
    farm_id: str,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Returns 24h/3d/7d/14d weather statistical aggregates for the farm.
    Used by the disease-risk engine to calculate weather favorability.
    Does NOT calculate disease risk itself.
    """
    farm_lat, farm_lon, farm_name = await _resolve_farm_coords(farm_id, lat, lon, db)

    # Fetch 14 days historical to cover all windows
    points = await get_historical_weather(farm_lat, farm_lon, days_back=14)
    aggregates = build_multi_period_aggregates(points)

    def _agg_dict(agg):
        return {
            "rainfall_total_mm": agg.rainfall_total_mm,
            "rainfall_days": agg.rainfall_days,
            "mean_temperature_c": agg.mean_temperature_c,
            "max_temperature_c": agg.max_temperature_c,
            "min_temperature_c": agg.min_temperature_c,
            "mean_humidity_percent": agg.mean_humidity_percent,
            "max_humidity_percent": agg.max_humidity_percent,
            "mean_wind_speed_kmh": agg.mean_wind_speed_kmh,
            "dominant_wind_direction_deg": agg.dominant_wind_direction_deg,
            "soil_moisture_trend": agg.soil_moisture_trend,
            "et0_total_mm": agg.et0_total_mm,
            "record_count": agg.record_count,
        }

    provider = points[0].provider if points else active_provider_name()
    return {
        "farm_id": farm_id,
        "location": {"latitude": farm_lat, "longitude": farm_lon, "name": farm_name},
        "summary": {period: _agg_dict(agg) for period, agg in aggregates.items()},
        "source": {
            "provider": provider,
            "data_quality": "GOOD" if points else "UNAVAILABLE",
            "computed_at": datetime.now(timezone.utc).isoformat(),
        },
    }


@router.get("/weather/spray-window/{farm_id}", summary="Evaluate Pesticide Spray Window")
async def get_spray_window(
    farm_id: str,
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    window_hours: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Evaluates whether the current weather is favorable for pesticide application.
    Returns FAVORABLE | UNFAVORABLE | LIMITED | UNKNOWN.
    Does NOT invent pesticide-specific rainfast periods.
    """
    farm_lat, farm_lon, _ = await _resolve_farm_coords(farm_id, lat, lon, db)
    current = await get_current_weather(farm_lat, farm_lon)
    forecast = await get_forecast(farm_lat, farm_lon, days=2)

    window = evaluate_spray_window(current, forecast, window_hours=window_hours)
    return window.to_dict()
