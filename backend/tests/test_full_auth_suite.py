import pytest
import uuid
import secrets
from fastapi.testclient import TestClient
from app.main import app
from app.services.otp_service import otp_service
from app.services.sms_service import normalize_indian_phone

client = TestClient(app)


def test_01_phone_number_normalization():
    """Verify Indian phone number normalization to E.164 format."""
    assert normalize_indian_phone("8148086236") == "+918148086236"
    assert normalize_indian_phone("+91 8148086236") == "+918148086236"
    assert normalize_indian_phone("08148086236") == "+918148086236"
    assert normalize_indian_phone("918148086236") == "+918148086236"

    with pytest.raises(ValueError):
        normalize_indian_phone("12345")


def test_02_register_and_login_flow():
    """Verify user registration and password login."""
    unique_email = f"test.farmer.{uuid.uuid4().hex[:6]}@kisansathi.farm"
    password = "TestPassword123!"

    # 1. Register
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": password,
            "confirm_password": password,
            "full_name": "Test Suite Farmer",
            "role": "FARMER",
            "phone_number": "+91 8148086236",
        },
    )
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    assert user_data["email"] == unique_email

    # 2. Login with registered credentials
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": password},
    )
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    assert "access_token" in tokens
    assert tokens["user"]["email"] == unique_email


def test_03_forgot_password_unregistered_email():
    """Verify forgot-password for non-existent email returns clear 404 message."""
    resp = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent.user.12345@kisansathi.farm"},
    )
    assert resp.status_code == 404
    data = resp.json()
    assert "No KISAN SATHI account" in data["message"] or "No account" in data["message"]


def test_04_forgot_password_end_to_end_reset():
    """Verify complete Forgot Password -> OTP -> Reset Token -> New Password -> Login flow."""
    unique_email = f"forgot.user.{uuid.uuid4().hex[:6]}@kisansathi.farm"
    old_pwd = "OldPassword123!"
    new_pwd = "NewSecurePassword456!"

    # 1. Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": old_pwd,
            "confirm_password": old_pwd,
            "full_name": "Reset Test User",
            "role": "FARMER",
        },
    )

    # 2. Request OTP
    from unittest.mock import patch
    mock_dispatch = {"sent": True, "message": "Dispatched for test"}
    with patch("app.services.email_service.email_service.send_otp_email", return_value=mock_dispatch):
        fp_resp = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": unique_email},
        )
    assert fp_resp.status_code == 200
    assert fp_resp.json()["success"] is True

    # Get generated OTP from in-memory service
    otp_record = otp_service._otps.get(unique_email)
    assert otp_record is not None
    otp_code = otp_record.otp_code

    # 3. Verify OTP
    verify_resp = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": unique_email, "otp": otp_code},
    )
    assert verify_resp.status_code == 200
    reset_token = verify_resp.json()["reset_token"]
    assert reset_token is not None

    # 4. Reset Password
    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": unique_email,
            "reset_token": reset_token,
            "new_password": new_pwd,
            "confirm_password": new_pwd,
        },
    )
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

    # 5. Verify login with NEW password
    new_login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": new_pwd},
    )
    assert new_login_resp.status_code == 200


def test_05_phone_otp_send_and_verify():
    """Verify Phone OTP generation, verification, and real SMS provider requirement."""
    phone = "+91 8148086236"
    normalized = "+918148086236"

    # 1. Send Phone OTP without configured credentials returns 503 Service Unavailable
    send_resp = client.post(
        "/api/v1/auth/phone/send-otp",
        json={"phone_number": phone},
    )
    assert send_resp.status_code == 503
    err_text = send_resp.json().get("message") or send_resp.json().get("detail") or ""
    assert "SMS provider is not configured" in err_text

    # Generate OTP directly via service to test verification flow
    otp_code, _ = otp_service.generate_phone_otp(normalized)

    # 2. Verify Phone OTP
    verify_resp = client.post(
        "/api/v1/auth/phone/verify-otp",
        json={"phone_number": phone, "otp": otp_code},
    )
    assert verify_resp.status_code == 200
    tokens = verify_resp.json()
    assert "access_token" in tokens
    assert tokens["user"]["phone_number"] == normalized


def test_06_google_auth_urls_and_callback():
    """Verify Google OAuth URL construction and callback handler without mock auto-login."""
    url_resp = client.get("/api/v1/auth/google/url")
    assert url_resp.status_code == 200
    url_data = url_resp.json()
    assert "client_id_configured" in url_data

    # Callback handler without valid code or tokens must return 401 Unauthorized
    cb_resp = client.post("/api/v1/auth/google/callback", json={})
    assert cb_resp.status_code == 401
    err_text = cb_resp.json().get("message") or cb_resp.json().get("detail") or ""
    assert "Google OAuth authentication failed" in err_text


def test_07_user_location_and_weather():
    """Verify location storage and weather API fetch by coordinates."""
    # Login to get token (try updated password from test_03 or original password)
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "farmer@kisansathi.internal", "password": "newpassword123"},
    )
    if login_resp.status_code != 200:
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "farmer@kisansathi.internal", "password": "password123"},
        )
    if login_resp.status_code != 200:
        # Register fresh test user if not present
        fresh_email = f"farmer_loc_{uuid.uuid4().hex[:6]}@kisansathi.internal"
        client.post(
            "/api/v1/auth/register",
            json={
                "email": fresh_email,
                "password": "password123",
                "confirm_password": "password123",
                "full_name": "Rajesh Patil",
                "role": "FARMER",
            },
        )
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": fresh_email, "password": "password123"},
        )

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}


    # Store Location
    loc_resp = client.post(
        "/api/v1/auth/location",
        json={"latitude": 11.0168, "longitude": 76.9558},
        headers=headers,
    )
    assert loc_resp.status_code == 200
    assert loc_resp.json()["latitude"] == 11.0168

    # Fetch Weather by coordinates
    weather_resp = client.get(
        "/api/v1/weather/coords?lat=11.0168&lon=76.9558",
        headers=headers,
    )
    assert weather_resp.status_code == 200
    w_data = weather_resp.json()
    assert "current" in w_data
    assert "temperature_c" in w_data["current"]
