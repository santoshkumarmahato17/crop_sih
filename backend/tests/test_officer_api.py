import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.main import app


@pytest.mark.asyncio
async def test_extension_officer_dashboard_and_validation():
    """Test Extension Officer prioritized dashboard and audited validation review."""
    token = create_access_token(
        subject="officer-user-01",
        email="officer@agrishield.com",
        role="EXTENSION_OFFICER",
    )
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Test Dashboard
        dash_res = await ac.get("/api/v1/officer/dashboard", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()

        assert "total_assigned_farms" in dash_data
        assert "critical_count" in dash_data
        assert len(dash_data["farms"]) > 0

        # Verify priority sorting
        priorities = [f["priority_tier"] for f in dash_data["farms"]]
        assert priorities[0] == "CRITICAL"

        # 2. Test Audited Expert Validation Submission
        val_payload = {
            "observation_id": "obs-farm-101-latest",
            "observation_type": "DISEASE",
            "validation_status": "VALIDATED",
            "notes": "Verified Puccinia striiformis on lower leaf canopy.",
            "create_field_visit": True,
        }
        val_res = await ac.post(
            "/api/v1/officer/validations", json=val_payload, headers=headers
        )
        assert val_res.status_code == 200
        val_data = val_res.json()

        assert val_data["validation_status"] == "VALIDATED"
        assert "audit_log_id" in val_data
        assert val_data["audit_action"] == "OFFICER_ACTION_VALIDATED"
