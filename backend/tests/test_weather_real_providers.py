import pytest
from datetime import datetime, timezone
from app.weather.providers.base import NormalizedWeatherPoint, DataQuality
from app.weather.providers.validation import validate_and_tag
from app.weather.providers.spray_window import evaluate_spray_window, SprayWindowResult

def test_validation_logic():
    # Good data
    pt = NormalizedWeatherPoint(
        timestamp=datetime.now(timezone.utc),
        latitude=10.0,
        longitude=10.0,
        provider="Test",
        data_quality=DataQuality.GOOD,
        temperature_c=25.0,
        relative_humidity_percent=60.0,
    )
    validated = validate_and_tag(pt)
    assert validated.data_quality == DataQuality.GOOD

    # Missing critical data -> UNAVAILABLE
    pt_missing = NormalizedWeatherPoint(
        timestamp=datetime.now(timezone.utc),
        latitude=10.0,
        longitude=10.0,
        provider="Test",
        data_quality=DataQuality.GOOD,
        temperature_c=None,
        relative_humidity_percent=None,
    )
    val_missing = validate_and_tag(pt_missing)
    assert val_missing.data_quality == DataQuality.UNAVAILABLE

def test_spray_window_evaluation():
    # Favorable
    pt_favorable = NormalizedWeatherPoint(
        timestamp=datetime.now(timezone.utc),
        latitude=10.0,
        longitude=10.0,
        provider="Test",
        data_quality=DataQuality.GOOD,
        temperature_c=25.0,
        relative_humidity_percent=60.0,
        wind_speed_kmh=10.0,
        rainfall_mm=0.0
    )
    result = evaluate_spray_window(pt_favorable, [])
    assert result.status == "FAVORABLE"

    # Unfavorable - high wind
    pt_windy = NormalizedWeatherPoint(
        timestamp=datetime.now(timezone.utc),
        latitude=10.0,
        longitude=10.0,
        provider="Test",
        data_quality=DataQuality.GOOD,
        temperature_c=25.0,
        relative_humidity_percent=60.0,
        wind_speed_kmh=25.0, # > 20
        rainfall_mm=0.0
    )
    res_windy = evaluate_spray_window(pt_windy, [])
    assert res_windy.status == "UNFAVORABLE"

    # Limited - high humidity
    pt_humid = NormalizedWeatherPoint(
        timestamp=datetime.now(timezone.utc),
        latitude=10.0,
        longitude=10.0,
        provider="Test",
        data_quality=DataQuality.GOOD,
        temperature_c=25.0,
        relative_humidity_percent=85.0, # > 80
        wind_speed_kmh=10.0,
        rainfall_mm=0.0
    )
    res_humid = evaluate_spray_window(pt_humid, [])
    assert res_humid.status == "LIMITED"
