import httpx
import asyncio

async def test_weather():
    import sys
    import os
    sys.path.insert(0, os.path.abspath("backend"))
    from app.weather.provider import get_weather_provider
    
    provider = get_weather_provider()
    print(f"Provider class: {provider.__class__.__name__}")
    
    # Current weather
    current = await provider.get_current_weather(18.5204, 73.8567) # Pune, India
    print("Current Weather:")
    print(f"Temp: {current.temperature_c} C")
    print(f"Condition: {current.condition_text}")
    print(f"Source: {current.source}")

    # Forecast
    forecast = await provider.get_forecast(18.5204, 73.8567, 3)
    print("\nForecast (3 days):")
    for f in forecast:
        print(f"{f.timestamp}: {f.temperature_c} C, {f.condition_text}, Source: {f.source}")

if __name__ == "__main__":
    asyncio.run(test_weather())
