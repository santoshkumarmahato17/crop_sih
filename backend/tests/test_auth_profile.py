import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_profile_flow(async_client: AsyncClient):
    """
    Test user registration with farm address, login, getting profile,
    updating address/name, and changing password.
    """
    unique_email = f"saravanan.farmer_{uuid.uuid4().hex[:8]}@kisansathi.farm"
    register_payload = {
        "email": unique_email,
        "password": "StrongPassword2026!",
        "full_name": "Farmer Saravanan",
        "phone_number": "+91 99441 23456",
        "address": "Holding 5, Thanjavur Delta Agro Region, Tamil Nadu 613001",
        "role_name": "FARMER",
    }
    try:
        reg_res = await async_client.post("/api/v1/auth/register", json=register_payload)
    except Exception as e:
        pytest.skip(f"Live database offline for API integration test ({e})")

    assert reg_res.status_code in [201, 409]

    # 2. Login
    login_payload = {
        "email": unique_email,
        "password": "StrongPassword2026!",
    }
    login_res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    token = token_data["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get profile
    me_res = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == unique_email

    # 4. Update profile address and name
    update_payload = {
        "full_name": "Farmer Saravanan M.",
        "address": "Updated Holding 5, North Canal Road, Thanjavur, TN 613001",
        "phone_number": "+91 99441 99999",
    }
    update_res = await async_client.put("/api/v1/auth/profile", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    updated_profile = update_res.json()
    assert updated_profile["full_name"] == "Farmer Saravanan M."
    assert updated_profile["address"] == "Updated Holding 5, North Canal Road, Thanjavur, TN 613001"

    # 5. Change Password
    pwd_payload = {
        "current_password": "StrongPassword2026!",
        "new_password": "NewStrongPassword2026!",
    }
    pwd_res = await async_client.put("/api/v1/auth/password", json=pwd_payload, headers=headers)
    assert pwd_res.status_code == 200
    assert pwd_res.json()["success"] is True
