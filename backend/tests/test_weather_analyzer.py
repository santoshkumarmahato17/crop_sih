from datetime import datetime, timezone
import pytest
from app.weather.analyzer import WeatherConditionAnalyzer, WeatherSignal
from app.weather.provider import WeatherDataPoint


def test_weather_condition_analyzer_signals():
    """Test physical environmental signal identification."""
    # 1. High humidity and heavy rain point
    wet_point = WeatherDataPoint(
        timestamp=datetime.now(timezone.utc),
        temperature_c=26.0,
        relative_humidity_percent=88.0,
        rainfall_mm=30.0,
        rainfall_duration_hours=5.0,
        wind_speed_mps=8.5,
    )
    analysis = WeatherConditionAnalyzer.analyze_point(wet_point)

    assert WeatherSignal.HIGH_HUMIDITY in analysis.signals
    assert WeatherSignal.HEAVY_RAIN in analysis.signals
    assert WeatherSignal.PROLONGED_RAIN in analysis.signals
    assert WeatherSignal.HIGH_WIND in analysis.signals
    assert WeatherSignal.WET_PERIOD in analysis.signals
    assert analysis.microclimate_disease_suitability > 0.6

    # 2. Dry Heat Stress Point
    dry_point = WeatherDataPoint(
        timestamp=datetime.now(timezone.utc),
        temperature_c=39.0,
        max_temperature_c=40.5,
        relative_humidity_percent=32.0,
        rainfall_mm=0.0,
        wind_speed_mps=3.0,
    )
    prev_point = WeatherDataPoint(
        timestamp=datetime.now(timezone.utc),
        temperature_c=31.0,
        relative_humidity_percent=50.0,
    )
    analysis_dry = WeatherConditionAnalyzer.analyze_point(dry_point, prev_point=prev_point)

    assert WeatherSignal.HIGH_TEMPERATURE in analysis_dry.signals
    assert WeatherSignal.HIGH_HEAT in analysis_dry.signals
    assert WeatherSignal.DRY_PERIOD in analysis_dry.signals
    assert WeatherSignal.RAPID_TEMPERATURE_CHANGE in analysis_dry.signals
    assert analysis_dry.microclimate_water_deficit > 0.5
