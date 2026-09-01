import pytest
from datetime import datetime, timezone
from app.weather.provider import (
    MockWeatherProvider,
    OpenMeteoWeatherProvider,
    WeatherDataPoint,
    get_weather_provider,
)


@pytest.mark.asyncio
async def test_mock_weather_provider_current_and_forecast():
    """Test MockWeatherProvider generates realistic observations and forecast series."""
    provider = MockWeatherProvider()

    # Current
    current = await provider.get_current_weather(11.0168, 76.9558)
    assert isinstance(current, WeatherDataPoint)
    assert 10.0 <= current.temperature_c <= 45.0
    assert 0.0 <= current.relative_humidity_percent <= 100.0
    assert current.rainfall_mm >= 0.0
    assert not current.is_forecast

    # 7-day Forecast
    forecast = await provider.get_forecast(11.0168, 76.9558, days=7)
    assert len(forecast) >= 7
    for pt in forecast:
        assert pt.temperature_c > 0
        assert pt.relative_humidity_percent > 0

    # Historical
    history = await provider.get_historical_weather(11.0168, 76.9558, days_back=5)
    assert len(history) == 5


@pytest.mark.asyncio
async def test_weather_provider_factory_and_fallback():
    """Test get_weather_provider factory initialization and graceful behavior."""
    provider = get_weather_provider()
    assert provider is not None
    res = await provider.get_current_weather(11.0168, 76.9558)
    assert res.temperature_c is not None
