from datetime import datetime, timezone
import pytest
from app.weather.analyzer import WeatherConditionAnalyzer
from app.weather.provider import MockWeatherProvider, WeatherDataPoint
from app.weather.risk_engines import (
    CropAgronomicContext,
    DiseaseRiskEngine,
    PestRiskEngine,
    RiskTier,
    WaterStressRiskEngine,
    WeatherRiskForecastEngine,
)


@pytest.mark.asyncio
async def test_disease_pest_and_water_stress_engines():
    """Test dedicated risk engines under different agro-meteorological scenarios."""
    crop = CropAgronomicContext(
        crop_type="Wheat (PBW-550)",
        growth_stage="Flowering & Heading Stage",
        current_health_score=70.0,
        health_trend="DECLINING",
        has_fungal_history=True,
        has_pest_history=True,
        cwsi_index=0.72,
    )

    # 1. Disease Favorable Weather
    disease_weather = WeatherDataPoint(
        timestamp=datetime.now(timezone.utc),
        temperature_c=24.0,
        relative_humidity_percent=88.0,
        rainfall_mm=22.0,
        rainfall_duration_hours=4.0,
    )
    d_signals = WeatherConditionAnalyzer.analyze_point(disease_weather)
    d_res = DiseaseRiskEngine.evaluate(disease_weather, d_signals, crop)

    assert d_res.risk_type == "DISEASE"
    assert d_res.score >= 60
    assert d_res.tier in ["HIGH", "CRITICAL"]
    assert "Conditions indicate elevated risk" in d_res.plain_explanation
    assert len(d_res.contributing_factors) >= 3

    # 2. Pest Favorable Weather
    pest_weather = WeatherDataPoint(
        timestamp=datetime.now(timezone.utc),
        temperature_c=29.0,
        relative_humidity_percent=68.0,
        rainfall_mm=0.0,
        wind_speed_mps=7.5,
    )
    p_signals = WeatherConditionAnalyzer.analyze_point(pest_weather)
    p_res = PestRiskEngine.evaluate(pest_weather, p_signals, crop)

    assert p_res.risk_type == "PEST"
    assert p_res.score >= 50
    assert "Weather conditions may favor pest activity" in p_res.plain_explanation

    # 3. Water Stress Favorable Weather
    dry_weather = WeatherDataPoint(
        timestamp=datetime.now(timezone.utc),
        temperature_c=36.5,
        relative_humidity_percent=35.0,
        rainfall_mm=0.0,
    )
    w_signals = WeatherConditionAnalyzer.analyze_point(dry_weather)
    w_res = WaterStressRiskEngine.evaluate(dry_weather, w_signals, crop)

    assert w_res.risk_type == "WATER_STRESS"
    assert w_res.score >= 60
    assert "Water stress risk is elevated" in w_res.plain_explanation


@pytest.mark.asyncio
async def test_weather_risk_forecast_engine_and_trend():
    """Test 7-day multi-horizon risk forecast and trend calculation."""
    provider = MockWeatherProvider()
    cur_w = await provider.get_current_weather(11.0168, 76.9558)
    fc_w = await provider.get_forecast(11.0168, 76.9558, days=7)
    crop = CropAgronomicContext()

    assessment = WeatherRiskForecastEngine.evaluate_farm_or_zone(
        farm_id="farm-test-01",
        current_weather=cur_w,
        forecast_points=fc_w,
        crop_context=crop,
        horizon_days=7,
    )

    assert assessment.farm_id == "farm-test-01"
    assert len(assessment.forecast_timeline) >= 7
    assert assessment.risk_trend in ["STABLE", "RISING", "FALLING", "RAPIDLY_RISING", "RAPIDLY_FALLING"]
    assert assessment.recommended_inspection_interval_days in [1, 2, 4, 7]
    assert assessment.rule_version == "weather-risk-v1"
