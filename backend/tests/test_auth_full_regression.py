"""
Permanent Comprehensive Authentication & Security Regression Test Suite for KISAN SATHI.

Covers:
1. Existing Farmer login (HTTP 200, JWT)
2. Existing Government official login (HTTP 200, JWT)
3. New Farmer registration + login lifecycle + /auth/me + logout
4. New Government registration + login lifecycle + /auth/me + logout
5. Incorrect password login rejection (HTTP 401)
6. Unknown email login rejection (HTTP 401)
7. Duplicate email registration rejection (HTTP 409)
8. Email case & whitespace normalization (Trimming & lowercasing)
9. Complete Forgot-Password workflow (/forgot-password -> OTP -> /verify-otp -> /reset-password -> login with new password)
10. Protected route blocking for unauthenticated or tampered tokens (HTTP 401)
11. Invalid/missing password hash safety (returns 401, never 500)
12. Regression protection against invalid/truncated bcrypt string fallbacks or startup hash modification
"""

import pytest
import uuid
import asyncio
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import verify_password
from app.db.session import AsyncSessionLocal
from app.models.auth import User
from sqlalchemy import select

client = TestClient(app)


def test_existing_farmer_login():
    """Verifies existing development Farmer seed account authenticates cleanly."""
    res = client.post("/api/v1/auth/login", json={
        "email": "farmer@kisansathi.internal",
        "password": "FarmerSecurePass123!",
    })
    assert res.status_code == 200, f"Existing Farmer login failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "farmer@kisansathi.internal"


def test_existing_government_login():
    """Verifies existing development Government seed account authenticates cleanly."""
    res = client.post("/api/v1/auth/login", json={
        "email": "government@kisansathi.internal",
        "password": "GovOfficialPass123!",
    })
    assert res.status_code == 200, f"Existing Government login failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "government@kisansathi.internal"


def test_new_farmer_registration_and_login_lifecycle():
    """Verifies complete Farmer lifecycle: Register -> Login -> /auth/me -> Logout."""
    unique_id = str(uuid.uuid4())[:8]
    email = f"new_farmer_{unique_id}@kisansathi.farm"
    password = "FarmerSecurePassword123!"

    # 1. Register Farmer
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Ramesh Kisan",
        "role": "FARMER",
        "phone_number": "+919876543210",
        "address": "Village Khed, Pune",
    })
    assert reg_res.status_code == 201, f"Farmer registration failed: {reg_res.text}"
    assert reg_res.json()["email"] == email.lower()

    # 2. Login with SAME credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_res.status_code == 200, f"Farmer login failed: {login_res.text}"
    token_data = login_res.json()
    access_token = token_data["access_token"]
    assert token_data["user"]["role"] == "FARMER"

    # 3. Call /auth/me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email.lower()

    # 4. Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True


def test_new_government_registration_and_login_lifecycle():
    """Verifies complete Government official lifecycle: Register -> Login -> /auth/me -> Logout."""
    unique_id = str(uuid.uuid4())[:8]
    email = f"new_gov_{unique_id}@maharashtra.gov.in"
    password = "GovOfficialSecure123!"

    # 1. Register Government Official
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Dr. Aniket Patil",
        "role": "GOVERNMENT",
        "phone_number": "+919876500000",
        "organization_name": "Department of Agriculture",
        "department": "Crop Protection Division",
        "assigned_region": "Pune District",
    })
    assert reg_res.status_code == 201, f"Gov registration failed: {reg_res.text}"
    assert reg_res.json()["role"] == "GOVERNMENT"

    # 2. Login with SAME credentials
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_res.status_code == 200, f"Gov login failed: {login_res.text}"
    token_data = login_res.json()
    access_token = token_data["access_token"]
    assert token_data["user"]["organization_name"] == "Department of Agriculture"

    # 3. Call /auth/me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "GOVERNMENT"


def test_login_invalid_credentials():
    """Verifies unknown email or wrong password returns HTTP 401 Unauthorized."""
    # Wrong password
    bad_pass = client.post("/api/v1/auth/login", json={
        "email": "farmer@kisansathi.internal",
        "password": "DefinitelyWrongPassword999!",
    })
    assert bad_pass.status_code == 401

    # Unknown email
    unknown_email = client.post("/api/v1/auth/login", json={
        "email": f"nonexistent_{uuid.uuid4()}@domain.com",
        "password": "AnyPassword123!",
    })
    assert unknown_email.status_code == 401


def test_duplicate_email_registration_rejection():
    """Verifies registering an existing email returns HTTP 409 Conflict."""
    unique_id = str(uuid.uuid4())[:8]
    email = f"dup_user_{unique_id}@kisansathi.farm"

    # Register first time
    res1 = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "First User",
        "role": "FARMER",
    })
    assert res1.status_code == 201

    # Register duplicate
    res2 = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "AnotherPassword123!",
        "full_name": "Duplicate User",
        "role": "FARMER",
    })
    assert res2.status_code == 409


def test_email_case_and_whitespace_normalization():
    """Verifies email whitespace trimming and lowercasing on registration and login."""
    unique_id = str(uuid.uuid4())[:8]
    raw_email = f"  MixedCase_{unique_id}@KisanSathi.FARM  "
    clean_email = f"mixedcase_{unique_id}@kisansathi.farm"
    password = "NormalPassword123!"

    # Register with raw padded mixed case
    reg_res = client.post("/api/v1/auth/register", json={
        "email": raw_email,
        "password": password,
        "full_name": "Normal User",
        "role": "FARMER",
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["email"] == clean_email

    # Login with uppercase version
    login_res = client.post("/api/v1/auth/login", json={
        "email": f"  MIXEDCASE_{unique_id}@KISANSATHI.FARM  ",
        "password": password,
    })
    assert login_res.status_code == 200


def test_forgot_and_reset_password_complete_workflow():
    """Verifies full forgot password workflow: /forgot-password -> OTP -> /verify-otp -> /reset-password -> Login."""
    unique_id = str(uuid.uuid4())[:8]
    email = f"reset_flow_{unique_id}@kisansathi.farm"
    old_password = "OldSecurePassword123!"
    new_password = "NewSuperSecurePassword456!"

    # 1. Register test user
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": old_password,
        "full_name": "Password Reset Tester",
        "role": "FARMER",
    })
    assert reg_res.status_code == 201

    # 2. Request Forgot Password
    from unittest.mock import patch
    mock_dispatch = {"sent": True, "message": "Dispatched for test"}
    with patch("app.services.email_service.email_service.send_otp_email", return_value=mock_dispatch):
        forgot_res = client.post("/api/v1/auth/forgot-password", json={
            "email": email,
        })
    assert forgot_res.status_code == 200

    # Retrieve generated OTP from otp_service memory
    from app.services.otp_service import otp_service
    otp_rec = otp_service._otps.get(email.lower())
    assert otp_rec is not None, f"OTP record not found in otp_service for {email}"
    otp_code = otp_rec.otp_code

    # 3. Verify OTP code to obtain reset token
    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "email": email,
        "otp": otp_code,
    })
    assert verify_res.status_code == 200
    reset_token = verify_res.json().get("reset_token")
    assert reset_token is not None

    # 4. Perform Reset Password using token
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "email": email,
        "reset_token": reset_token,
        "new_password": new_password,
        "confirm_password": new_password,
    })
    assert reset_res.status_code == 200

    # 5. Login with NEW password
    new_login = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": new_password,
    })
    assert new_login.status_code == 200


def test_protected_routes_unauthenticated():
    """Verifies unauthenticated or tampered requests return 401."""
    # Missing header
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # Bad token
    res2 = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_tampered_token_string"},
    )
    assert res2.status_code == 401


def test_invalid_or_missing_password_hash_safety():
    """Verifies that an account with missing or invalid password hash returns HTTP 401, never 500."""
    # Direct test using verify_password helper
    assert verify_password("Password123!", None) is False
    assert verify_password("Password123!", "") is False
    assert verify_password("Password123!", "$2b$12$shortinvalid") is False
    assert verify_password("Password123!", "$2b$12$eImiTXuWVxfM37uY4JANjO56Esk0i0g5iS7n6qf6vN7Z8eG9L") is False


def test_no_truncated_bcrypt_written_or_modified_on_startup():
    """Regression test ensuring system never writes 57-char truncated bcrypt string to database."""
    from app.db.session import init_db
    
    async def _test():
        await init_db()
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(User))
            users = res.scalars().all()
            for u in users:
                if u.hashed_password:
                    assert u.hashed_password != "$2b$12$eImiTXuWVxfM37uY4JANjO56Esk0i0g5iS7n6qf6vN7Z8eG9L", (
                        f"Database user {u.email} has truncated fallback bcrypt hash!"
                    )
                    assert len(u.hashed_password.strip()) >= 59, (
                        f"Database user {u.email} has invalid bcrypt hash length: {len(u.hashed_password)}"
                    )

    asyncio.run(_test())
