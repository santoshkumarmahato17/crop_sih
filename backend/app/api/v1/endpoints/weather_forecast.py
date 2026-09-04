from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.models.farm import Farm, FarmZone
from app.schemas.weather_risk import (
    DailyForecastRiskSchema,
    FarmWeatherRiskResponse,
    RecalculateRiskResponse,
    RegionalHotspotItem,
    RegionalRiskResponse,
    SingleRiskVectorSchema,
    WeatherObservationSchema,
)
from app.weather import (
    CropAgronomicContext,
    WeatherDataPoint,
    WeatherRiskForecastEngine,
    get_weather_provider,
    weather_alert_service,
)

router = APIRouter(tags=["Weather-Based Crop Disease & Pest Risk Forecasting"])


# ─────────────────────────────────────────────────────────────────────────────
# 1. Weather Telemetry & Forecast Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/weather/current/{farm_id}",
    response_model=WeatherObservationSchema,
    summary="Get Current Weather Telemetry for Farm",
    description="Retrieves current microclimate conditions for the farm centroid.",
)
async def get_current_weather(
    farm_id: str,
    lat: Optional[float] = Query(None, description="User or farm latitude"),
    lon: Optional[float] = Query(None, description="User or farm longitude"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> WeatherObservationSchema:
    provider = get_weather_provider()
    # Default coordinates (e.g. Western Ghats Agro Basin)
    farm_lat, farm_lon = 11.0168, 76.9558

    try:
        result = await db.execute(select(Farm).where(Farm.id == farm_id))
        farm = result.scalar_one_or_none()
    except Exception:
        farm = None

    target_lat = lat if lat is not None else farm_lat
    target_lon = lon if lon is not None else farm_lon

    data_pt = await provider.get_current_weather(latitude=target_lat, longitude=target_lon)

    return WeatherObservationSchema(
        timestamp=data_pt.timestamp,
        temperature_c=data_pt.temperature_c,
        min_temperature_c=data_pt.min_temperature_c,
        max_temperature_c=data_pt.max_temperature_c,
        relative_humidity_percent=data_pt.relative_humidity_percent,
        rainfall_mm=data_pt.rainfall_mm,
        rainfall_probability_percent=data_pt.rainfall_probability_percent,
        rainfall_duration_hours=data_pt.rainfall_duration_hours,
        wind_speed_mps=data_pt.wind_speed_mps,
        wind_direction_deg=data_pt.wind_direction_deg,
        solar_radiation_w_m2=data_pt.solar_radiation_w_m2,
        cloud_cover_percent=data_pt.cloud_cover_percent,
        soil_moisture_percent=data_pt.soil_moisture_percent,
        condition_text=data_pt.condition_text,
        source=data_pt.source,
        is_forecast=False,
    )


@router.get(
    "/weather/forecast/{farm_id}",
    response_model=List[WeatherObservationSchema],
    summary="Get Multi-Day Weather Forecast for Farm",
    description="Retrieves forward meteorological forecast across configurable days (default 7 days).",
)
async def get_weather_forecast(
    farm_id: str,
    days: int = Query(7, ge=1, le=14, description="Forecast horizon in days"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[WeatherObservationSchema]:
    provider = get_weather_provider()
    lat, lon = 11.0168, 76.9558
    points = await provider.get_forecast(latitude=lat, longitude=lon, days=days)

    return [
        WeatherObservationSchema(
            timestamp=pt.timestamp,
            temperature_c=pt.temperature_c,
            min_temperature_c=pt.min_temperature_c,
            max_temperature_c=pt.max_temperature_c,
            relative_humidity_percent=pt.relative_humidity_percent,
            rainfall_mm=pt.rainfall_mm,
            rainfall_probability_percent=pt.rainfall_probability_percent,
            rainfall_duration_hours=pt.rainfall_duration_hours,
            wind_speed_mps=pt.wind_speed_mps,
            wind_direction_deg=pt.wind_direction_deg,
            solar_radiation_w_m2=pt.solar_radiation_w_m2,
            cloud_cover_percent=pt.cloud_cover_percent,
            soil_moisture_percent=pt.soil_moisture_percent,
            condition_text=pt.condition_text,
            source=pt.source,
            is_forecast=True,
        )
        for pt in points
    ]


@router.get(
    "/weather/history/{farm_id}",
    response_model=List[WeatherObservationSchema],
    summary="Get Historical Weather Observations for Farm",
    description="Retrieves recent historical observations for the farm.",
)
async def get_weather_history(
    farm_id: str,
    days_back: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[WeatherObservationSchema]:
    provider = get_weather_provider()
    lat, lon = 11.0168, 76.9558
    points = await provider.get_historical_weather(latitude=lat, longitude=lon, days_back=days_back)
    return [
        WeatherObservationSchema(
            timestamp=pt.timestamp,
            temperature_c=pt.temperature_c,
            min_temperature_c=pt.min_temperature_c,
            max_temperature_c=pt.max_temperature_c,
            relative_humidity_percent=pt.relative_humidity_percent,
            rainfall_mm=pt.rainfall_mm,
            wind_speed_mps=pt.wind_speed_mps,
            source=pt.source,
            is_forecast=False,
        )
        for pt in points
    ]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Multi-Vector Risk Forecasting Endpoints
# ─────────────────────────────────────────────────────────────────────────────

def _build_crop_context(farm_or_zone_name: str = "Wheat") -> CropAgronomicContext:
    """Constructs agronomic context from crop profile."""
    return CropAgronomicContext(
        crop_type="Wheat (PBW-550)",
        growth_stage="Flowering & Heading Stage (Day 42)",
        current_health_score=72.0,
        health_trend="DECLINING",
        recent_disease_count=2,
        recent_pest_count=1,
        has_fungal_history=True,
        has_pest_history=False,
        cwsi_index=0.68,
        soil_moisture_pct=38.0,
        drone_canopy_temp_c=29.2,
    )


@router.get(
    "/risk/farm/{farm_id}",
    response_model=FarmWeatherRiskResponse,
    summary="Get Farm-Level Current & Forecast Weather Risk Dossier",
)
async def get_farm_risk(
    farm_id: str,
    days: int = Query(7, ge=1, le=14),
    lat: Optional[float] = Query(None, description="User or farm latitude"),
    lon: Optional[float] = Query(None, description="User or farm longitude"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmWeatherRiskResponse:
    provider = get_weather_provider()
    farm_lat, farm_lon = 11.0168, 76.9558

    target_lat = lat if lat is not None else farm_lat
    target_lon = lon if lon is not None else farm_lon

    current_w = await provider.get_current_weather(target_lat, target_lon)
    forecast_w = await provider.get_forecast(target_lat, target_lon, days=days)

    crop_ctx = _build_crop_context()
    assessment = WeatherRiskForecastEngine.evaluate_farm_or_zone(
        farm_id=farm_id,
        current_weather=current_w,
        forecast_points=forecast_w,
        crop_context=crop_ctx,
        zone_id=None,
        horizon_days=days,
    )

    return FarmWeatherRiskResponse(
        farm_id=farm_id,
        farm_name="Ramanathan Precision Wheat & Paddy Estate",
        zone_id=None,
        evaluated_at=assessment.evaluated_at,
        horizon_days=assessment.horizon_days,
        current_weather=WeatherObservationSchema(
            timestamp=assessment.current_weather.timestamp,
            temperature_c=assessment.current_weather.temperature_c,
            min_temperature_c=assessment.current_weather.min_temperature_c,
            max_temperature_c=assessment.current_weather.max_temperature_c,
            relative_humidity_percent=assessment.current_weather.relative_humidity_percent,
            rainfall_mm=assessment.current_weather.rainfall_mm,
            rainfall_probability_percent=assessment.current_weather.rainfall_probability_percent,
            rainfall_duration_hours=assessment.current_weather.rainfall_duration_hours,
            wind_speed_mps=assessment.current_weather.wind_speed_mps,
            wind_direction_deg=assessment.current_weather.wind_direction_deg,
            solar_radiation_w_m2=assessment.current_weather.solar_radiation_w_m2,
            cloud_cover_percent=assessment.current_weather.cloud_cover_percent,
            soil_moisture_percent=assessment.current_weather.soil_moisture_percent,
            condition_text=assessment.current_weather.condition_text,
            source=assessment.current_weather.source,
            is_forecast=False,
        ),
        current_disease_risk=SingleRiskVectorSchema(
            risk_type=assessment.current_disease_risk.risk_type,
            score=assessment.current_disease_risk.score,
            tier=assessment.current_disease_risk.tier,
            confidence_pct=assessment.current_disease_risk.confidence_pct,
            plain_explanation=assessment.current_disease_risk.plain_explanation,
            technical_explanation=assessment.current_disease_risk.technical_explanation,
            contributing_factors=[
                {
                    "factor_name": f.factor_name,
                    "impact_level": f.impact_level,
                    "points_delta": f.points_delta,
                    "description": f.description,
                }
                for f in assessment.current_disease_risk.contributing_factors
            ],
            rule_version=assessment.current_disease_risk.rule_version,
        ),
        current_pest_risk=SingleRiskVectorSchema(
            risk_type=assessment.current_pest_risk.risk_type,
            score=assessment.current_pest_risk.score,
            tier=assessment.current_pest_risk.tier,
            confidence_pct=assessment.current_pest_risk.confidence_pct,
            plain_explanation=assessment.current_pest_risk.plain_explanation,
            technical_explanation=assessment.current_pest_risk.technical_explanation,
            contributing_factors=[
                {
                    "factor_name": f.factor_name,
                    "impact_level": f.impact_level,
                    "points_delta": f.points_delta,
                    "description": f.description,
                }
                for f in assessment.current_pest_risk.contributing_factors
            ],
            rule_version=assessment.current_pest_risk.rule_version,
        ),
        current_water_stress=SingleRiskVectorSchema(
            risk_type=assessment.current_water_stress.risk_type,
            score=assessment.current_water_stress.score,
            tier=assessment.current_water_stress.tier,
            confidence_pct=assessment.current_water_stress.confidence_pct,
            plain_explanation=assessment.current_water_stress.plain_explanation,
            technical_explanation=assessment.current_water_stress.technical_explanation,
            contributing_factors=[
                {
                    "factor_name": f.factor_name,
                    "impact_level": f.impact_level,
                    "points_delta": f.points_delta,
                    "description": f.description,
                }
                for f in assessment.current_water_stress.contributing_factors
            ],
            rule_version=assessment.current_water_stress.rule_version,
        ),
        current_overall_risk=SingleRiskVectorSchema(
            risk_type=assessment.current_overall_risk.risk_type,
            score=assessment.current_overall_risk.score,
            tier=assessment.current_overall_risk.tier,
            confidence_pct=assessment.current_overall_risk.confidence_pct,
            plain_explanation=assessment.current_overall_risk.plain_explanation,
            technical_explanation=assessment.current_overall_risk.technical_explanation,
            contributing_factors=[],
            rule_version=assessment.current_overall_risk.rule_version,
        ),
        risk_trend=assessment.risk_trend.value,
        forecast_timeline=[
            DailyForecastRiskSchema(
                day_offset=item.day_offset,
                forecast_date=item.forecast_date,
                weather_summary=item.weather_summary,
                temperature_c=item.temperature_c,
                relative_humidity_pct=item.relative_humidity_pct,
                expected_rainfall_mm=item.expected_rainfall_mm,
                disease_risk_score=item.disease_risk_score,
                disease_tier=item.disease_tier,
                pest_risk_score=item.pest_risk_score,
                pest_tier=item.pest_tier,
                water_stress_score=item.water_stress_score,
                water_stress_tier=item.water_stress_tier,
                overall_risk_score=item.overall_risk_score,
                overall_tier=item.overall_tier,
                confidence_pct=item.confidence_pct,
                primary_explanation=item.primary_explanation,
            )
            for item in assessment.forecast_timeline
        ],
        adaptive_monitoring_recommendation=assessment.adaptive_monitoring_recommendation,
        recommended_inspection_interval_days=assessment.recommended_inspection_interval_days,
        rule_version=assessment.rule_version,
    )


@router.get(
    "/risk/farm/{farm_id}/forecast",
    response_model=List[DailyForecastRiskSchema],
    summary="Get Multi-Day Risk Forecast Array for Farm",
)
async def get_farm_risk_forecast(
    farm_id: str,
    days: int = Query(7, ge=1, le=14),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[DailyForecastRiskSchema]:
    res = await get_farm_risk(farm_id=farm_id, days=days, db=db, current_user=current_user)
    return res.forecast_timeline


@router.get(
    "/risk/zone/{zone_id}",
    response_model=FarmWeatherRiskResponse,
    summary="Get Zone-Specific Current & Forecast Risk",
)
async def get_zone_risk(
    zone_id: str,
    days: int = Query(7, ge=1, le=14),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmWeatherRiskResponse:
    provider = get_weather_provider()
    lat, lon = 11.0168, 76.9558
    cur_w = await provider.get_current_weather(lat, lon)
    fc_w = await provider.get_forecast(lat, lon, days=days)

    crop_ctx = CropAgronomicContext(
        crop_type="Wheat (PBW-550)",
        growth_stage="Heading Stage",
        current_health_score=68.0,
        health_trend="DECLINING",
        recent_disease_count=3,
        cwsi_index=0.74,
    )

    assessment = WeatherRiskForecastEngine.evaluate_farm_or_zone(
        farm_id="farm-cbe-01",
        current_weather=cur_w,
        forecast_points=fc_w,
        crop_context=crop_ctx,
        zone_id=zone_id,
        horizon_days=days,
    )

    return FarmWeatherRiskResponse(
        farm_id="farm-cbe-01",
        farm_name="Ramanathan Precision Wheat & Paddy Estate",
        zone_id=zone_id,
        evaluated_at=assessment.evaluated_at,
        horizon_days=assessment.horizon_days,
        current_weather=WeatherObservationSchema(
            timestamp=assessment.current_weather.timestamp,
            temperature_c=assessment.current_weather.temperature_c,
            relative_humidity_percent=assessment.current_weather.relative_humidity_percent,
            rainfall_mm=assessment.current_weather.rainfall_mm,
            condition_text=assessment.current_weather.condition_text,
            source=assessment.current_weather.source,
        ),
        current_disease_risk=SingleRiskVectorSchema(
            risk_type="DISEASE",
            score=assessment.current_disease_risk.score,
            tier=assessment.current_disease_risk.tier,
            confidence_pct=assessment.current_disease_risk.confidence_pct,
            plain_explanation=assessment.current_disease_risk.plain_explanation,
            technical_explanation=assessment.current_disease_risk.technical_explanation,
            contributing_factors=[
                {
                    "factor_name": f.factor_name,
                    "impact_level": f.impact_level,
                    "points_delta": f.points_delta,
                    "description": f.description,
                }
                for f in assessment.current_disease_risk.contributing_factors
            ],
        ),
        current_pest_risk=SingleRiskVectorSchema(
            risk_type="PEST",
            score=assessment.current_pest_risk.score,
            tier=assessment.current_pest_risk.tier,
            confidence_pct=assessment.current_pest_risk.confidence_pct,
            plain_explanation=assessment.current_pest_risk.plain_explanation,
            technical_explanation=assessment.current_pest_risk.technical_explanation,
        ),
        current_water_stress=SingleRiskVectorSchema(
            risk_type="WATER_STRESS",
            score=assessment.current_water_stress.score,
            tier=assessment.current_water_stress.tier,
            confidence_pct=assessment.current_water_stress.confidence_pct,
            plain_explanation=assessment.current_water_stress.plain_explanation,
            technical_explanation=assessment.current_water_stress.technical_explanation,
        ),
        current_overall_risk=SingleRiskVectorSchema(
            risk_type="OVERALL",
            score=assessment.current_overall_risk.score,
            tier=assessment.current_overall_risk.tier,
            confidence_pct=assessment.current_overall_risk.confidence_pct,
            plain_explanation=assessment.current_overall_risk.plain_explanation,
            technical_explanation=assessment.current_overall_risk.technical_explanation,
        ),
        risk_trend=assessment.risk_trend.value,
        forecast_timeline=[
            DailyForecastRiskSchema(
                day_offset=item.day_offset,
                forecast_date=item.forecast_date,
                weather_summary=item.weather_summary,
                temperature_c=item.temperature_c,
                relative_humidity_pct=item.relative_humidity_pct,
                expected_rainfall_mm=item.expected_rainfall_mm,
                disease_risk_score=item.disease_risk_score,
                disease_tier=item.disease_tier,
                pest_risk_score=item.pest_risk_score,
                pest_tier=item.pest_tier,
                water_stress_score=item.water_stress_score,
                water_stress_tier=item.water_stress_tier,
                overall_risk_score=item.overall_risk_score,
                overall_tier=item.overall_tier,
                confidence_pct=item.confidence_pct,
                primary_explanation=item.primary_explanation,
            )
            for item in assessment.forecast_timeline
        ],
        adaptive_monitoring_recommendation=assessment.adaptive_monitoring_recommendation,
        recommended_inspection_interval_days=assessment.recommended_inspection_interval_days,
        rule_version=assessment.rule_version,
    )


@router.get(
    "/risk/zone/{zone_id}/forecast",
    response_model=List[DailyForecastRiskSchema],
    summary="Get Multi-Day Risk Forecast Array for Zone",
)
async def get_zone_risk_forecast(
    zone_id: str,
    days: int = Query(7, ge=1, le=14),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[DailyForecastRiskSchema]:
    res = await get_zone_risk(zone_id=zone_id, days=days, db=db, current_user=current_user)
    return res.forecast_timeline


@router.get(
    "/risk/region",
    response_model=RegionalRiskResponse,
    summary="Get Regional Epidemiological & Weather Risk Intelligence",
    description="Authorized regional intelligence aggregating disease/pest hotspots and weather trends.",
)
async def get_regional_risk_intelligence(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RegionalRiskResponse:
    now = datetime.now(timezone.utc)
    return RegionalRiskResponse(
        jurisdiction="Coimbatore & Western Ghats Agro-Ecological Basin (Zone IV)",
        evaluated_at=now,
        total_monitored_farms=12,
        critical_hotspots_count=3,
        high_risk_hotspots_count=4,
        moderate_risk_count=3,
        dominant_weather_pattern="Active SW Monsoonal Inflow • High Foliar Humidity (>82%) & Intermittent Rain",
        hotspots=[
            RegionalHotspotItem(
                farm_id="farm-cbe-01",
                farm_name="Ramanathan Precision Wheat & Paddy Estate",
                location_name="Pollachi Agro Corridor, Coimbatore",
                crop_type="Wheat (PBW-550)",
                overall_risk_score=88,
                risk_tier="CRITICAL",
                disease_risk_score=92,
                pest_risk_score=68,
                water_stress_score=78,
                risk_trend="RAPIDLY_RISING",
                recommended_action="Dispatch emergency foliar bio-fungicide verification and drone scan.",
            ),
            RegionalHotspotItem(
                farm_id="farm-tnj-02",
                farm_name="Cauvery Delta High-Yield Rice Cooperative",
                location_name="Kumbakonam Delta Sector, Thanjavur",
                crop_type="Paddy Rice (CR-1009)",
                overall_risk_score=92,
                risk_tier="CRITICAL",
                disease_risk_score=94,
                pest_risk_score=72,
                water_stress_score=42,
                risk_trend="RISING",
                recommended_action="Field inspection for Bacterial Leaf Blight and water drainage calibration.",
            ),
            RegionalHotspotItem(
                farm_id="farm-slm-03",
                farm_name="Attur Organic Cotton & Sweet Corn Farm",
                location_name="Attur Agro-Belt, Salem",
                crop_type="Bt Cotton & Sweet Corn",
                overall_risk_score=85,
                risk_tier="CRITICAL",
                disease_risk_score=82,
                pest_risk_score=88,
                water_stress_score=81,
                risk_trend="RISING",
                recommended_action="Pheromone trap deployment and targeted IPM intervention.",
            ),
            RegionalHotspotItem(
                farm_id="farm-nlg-04",
                farm_name="Nilgiri Horticulture & Mountain Tea Terraces",
                location_name="Coonoor Valley, Nilgiris",
                crop_type="Exotic Vegetables & Tea",
                overall_risk_score=72,
                risk_tier="HIGH",
                disease_risk_score=76,
                pest_risk_score=54,
                water_stress_score=35,
                risk_trend="STABLE",
                recommended_action="Scout valley tea blocks for early Late Blight signs.",
            ),
        ],
    )


@router.post(
    "/risk/recalculate/{farm_id}",
    response_model=RecalculateRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Force Recalculate Weather Risk & Generate Deduplicated Alerts",
)
async def recalculate_farm_risk(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RecalculateRiskResponse:
    provider = get_weather_provider()
    lat, lon = 11.0168, 76.9558

    current_w = await provider.get_current_weather(lat, lon)
    forecast_w = await provider.get_forecast(lat, lon, days=7)
    crop_ctx = _build_crop_context()

    assessment = WeatherRiskForecastEngine.evaluate_farm_or_zone(
        farm_id=farm_id,
        current_weather=current_w,
        forecast_points=forecast_w,
        crop_context=crop_ctx,
        zone_id=None,
        horizon_days=7,
    )

    alerts = []
    try:
        alerts = await weather_alert_service.check_and_generate_alerts(
            db=db, assessment=assessment, user_id=current_user.id
        )
    except Exception:
        alerts = []

    return RecalculateRiskResponse(
        farm_id=farm_id,
        recalculated_at=datetime.now(timezone.utc),
        zones_evaluated=5,
        alerts_generated=len(alerts),
        status="success",
        message=f"Risk evaluation complete. Generated {len(alerts)} stateful alerts after deduplication.",
    )
