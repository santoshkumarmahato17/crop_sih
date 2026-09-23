import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.main import app


@pytest.mark.asyncio
async def test_farmer_dashboard_summary_endpoint():
    """Test GET /api/v1/dashboard/farmer-summary returns answers to all 8 core questions."""
    token = create_access_token(subject="farmer-test-1", email="farmer@kisansathi.com", role="FARMER")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/api/v1/dashboard/farmer-summary", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Verify answers to 8 core questions
    # Q1: Is my farm healthy?
    assert "overall_health_score" in data
    assert "health_verdict" in data
    assert "health_trend" in data
    assert 0 <= data["overall_health_score"] <= 100

    # Q2: Where is the problem?
    assert "problem_zones" in data
    assert len(data["problem_zones"]) > 0

    # Q3: What problem is occurring?
    assert "primary_threat_type" in data
    assert "disease_alert_summary" in data

    # Q4: Is it getting worse?
    assert "temporal_velocity" in data

    # Q5: Could it spread?
    assert "potential_spread_risk_score" in data
    assert "spread_risk_verdict" in data

    # Q6: Which area needs water?
    assert "water_stress_priority_zones" in data

    # Q7: What should I do?
    assert "actionable_recommendations" in data
    assert len(data["actionable_recommendations"]) > 0

    # Q8: When is the next monitoring mission?
    assert "next_mission" in data
    assert "mission_code" in data["next_mission"]
    assert "scheduled_time" in data["next_mission"]

    # Verify Map layers
    assert "active_layers" in data
    assert len(data["active_layers"]) >= 5
