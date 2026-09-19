import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.auth import User
from app.db.session import get_db
from sqlalchemy import select

client = TestClient(app)


@pytest.mark.asyncio
async def test_google_auth_callback_rejects_missing_identity():
    """Test that Google auth callback rejects requests with missing or unconfigured OAuth credentials."""
    response = client.post(
        "/api/v1/auth/google/callback",
        json={
            "redirect_uri": "http://localhost:5173/auth/google/callback"
        },
    )

    assert response.status_code == 401, f"Expected 401 Unauthorized for missing identity, got {response.status_code}: {response.text}"
    data = response.json()
    assert "detail" in data or "message" in data

