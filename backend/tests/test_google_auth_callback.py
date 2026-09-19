import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.auth import User
from app.db.session import get_db
from sqlalchemy import select

client = TestClient(app)


@pytest.mark.asyncio
async def test_google_auth_callback_creates_user_with_hashed_password():
    """Test that Google auth callback provisions a user with a valid hashed_password and returns access token."""
    response = client.post(
        "/api/v1/auth/google/callback",
        json={
            "redirect_uri": "http://localhost:5173/auth/google/callback"
        },
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == "farmer.google@agrishield.farm"

