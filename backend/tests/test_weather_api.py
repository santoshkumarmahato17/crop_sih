from datetime import datetime, timezone
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.main import app
from app.weather.provider import MockWeatherProvider
from app.weather.risk_engines import CropAgronomicContext, WeatherRiskForecastEngine


@pytest.mark.asyncio
async def test_weather_and_risk_api_endpoints():
    """Test all weather and multi-vector risk REST API endpoints."""
    token = create_access_token(
        subject="farmer-user-01",
        email="farmer@agrishield.com",
        role="FARMER",
    )
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Current Weather
        res_w_cur = await ac.get("/api/v1/weather/current/farm-cbe-01", headers=headers)
        assert res_w_cur.status_code == 200
        w_cur = res_w_cur.json()
        assert "temperature_c" in w_cur
        assert "relative_humidity_percent" in w_cur

        # 2. Weather Forecast
        res_w_fc = await ac.get("/api/v1/weather/forecast/farm-cbe-01?days=7", headers=headers)
        assert res_w_fc.status_code == 200
        assert len(res_w_fc.json()) >= 7

        # 3. Weather History
        res_w_hist = await ac.get("/api/v1/weather/history/farm-cbe-01?days_back=5", headers=headers)
        assert res_w_hist.status_code == 200
        assert len(res_w_hist.json()) == 5

        # 4. Farm Risk Dossier
        res_risk = await ac.get("/api/v1/risk/farm/farm-cbe-01?days=7", headers=headers)
        assert res_risk.status_code == 200
        risk_data = res_risk.json()
        assert "current_disease_risk" in risk_data
        assert "current_pest_risk" in risk_data
        assert "current_water_stress" in risk_data
        assert "forecast_timeline" in risk_data
        assert len(risk_data["forecast_timeline"]) >= 7
        assert "risk_trend" in risk_data

        # 5. Zone Risk
        res_zone = await ac.get("/api/v1/risk/zone/zone-z03", headers=headers)
        assert res_zone.status_code == 200
        assert res_zone.json()["zone_id"] == "zone-z03"

        # 6. Regional Risk (Government/Official)
        gov_token = create_access_token(
            subject="officer-user-01",
            email="officer@agrishield.com",
            role="GOVERNMENT",
        )
        gov_headers = {"Authorization": f"Bearer {gov_token}"}
        res_region = await ac.get("/api/v1/risk/region", headers=gov_headers)
        assert res_region.status_code == 200
        reg_data = res_region.json()
        assert "total_monitored_farms" in reg_data
        assert len(reg_data["hotspots"]) > 0

        # 7. Risk Recalculation
        res_recalc = await ac.post("/api/v1/risk/recalculate/farm-cbe-01", headers=headers)
        assert res_recalc.status_code == 200
        assert res_recalc.json()["status"] == "success"
