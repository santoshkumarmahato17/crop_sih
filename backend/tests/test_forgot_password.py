import uuid
import pytest
from unittest.mock import patch
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_forgot_password_complete_flow(async_client: AsyncClient):
    """
    Complete end-to-end integration test for AGRI SHIELD Forgot Password / Reset Password flow.
    Tests:
    1. Unregistered email check -> Returns 404
    2. Register new user
    3. Unconfigured SMTP check -> Returns 503
    4. Configured SMTP Forgot Password OTP request -> Generates OTP & returns 200
    5. Rate limit check -> Enforces 60-second cooldown
    6. Verify incorrect OTP -> Returns 400
    7. Verify correct OTP -> Returns Reset Token
    8. Reset Password with invalid token -> Returns 400
    9. Reset Password with valid token -> Updates hashed password
    10. Invalidation check -> Reset token cannot be reused
    11. Login with new password -> Succeeds
    """
    from app.services.otp_service import otp_service

    # 1. Unregistered email check
    unregistered_email = f"nonexistent_{uuid.uuid4().hex[:6]}@kisansathi.farm"
    unreg_res = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": unregistered_email}
    )
    assert unreg_res.status_code == 404, f"Response body: {unreg_res.json()}"
    msg = unreg_res.json().get("message") or unreg_res.json().get("detail")
    assert "No KISAN SATHI account" in str(msg) or "No account" in str(msg)


    # 2. Register a new test account
    test_email = f"farmer_reset_{uuid.uuid4().hex[:6]}@kisansathi.farm"
    old_password = "OldSecurePassword123!"
    new_password = "NewSecurePassword456!"

    reg_payload = {
        "email": test_email,
        "password": old_password,
        "confirm_password": old_password,
        "full_name": "Test Farmer Reset",
        "role": "FARMER"
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # 3. Unconfigured SMTP check
    from app.services import email_service as email_service_mod
    with patch.object(email_service_mod.settings, "SMTP_HOST", ""):
        unconfig_res = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_email}
        )
        assert unconfig_res.status_code == 200
        unconfig_data = unconfig_res.json()
        assert unconfig_data.get("smtp_configured") is False
        assert "Development Mode" in unconfig_data.get("message", "")


    # 4. Mock successful email delivery for testing full verification & reset pipeline
    otp_service.clear_otp(test_email)
    mock_dispatch = {"sent": True, "message": "Dispatched for test"}
    with patch("app.services.email_service.email_service.send_otp_email", return_value=mock_dispatch):
        forgot_res = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_email}
        )
        assert forgot_res.status_code == 200
        forgot_data = forgot_res.json()
        assert forgot_data["success"] is True

        # Get active OTP generated for test_email
        active_record = otp_service._otps.get(test_email.lower().strip())
        assert active_record is not None
        generated_otp = active_record.otp_code

        # 5. Rate limit check (cooldown)
        cooldown_res = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_email}
        )
        assert cooldown_res.status_code == 429
        cooldown_msg = cooldown_res.json().get("message") or cooldown_res.json().get("detail")
        assert "seconds before requesting a new OTP" in str(cooldown_msg)

        # 6. Verify incorrect OTP
        wrong_otp_res = await async_client.post(
            "/api/v1/auth/verify-otp",
            json={"email": test_email, "otp": "000000"}
        )
        assert wrong_otp_res.status_code == 400
        wrong_msg = wrong_otp_res.json().get("message") or wrong_otp_res.json().get("detail")
        assert "Incorrect OTP code" in str(wrong_msg)

        # 7. Verify correct OTP
        verify_res = await async_client.post(
            "/api/v1/auth/verify-otp",
            json={"email": test_email, "otp": generated_otp}
        )
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["success"] is True
        reset_token = verify_data["reset_token"]
        assert reset_token is not None and len(reset_token) > 10

        # 8. Reset password with invalid token
        invalid_token_res = await async_client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": test_email,
                "reset_token": "invalid-uuid-token",
                "new_password": new_password,
                "confirm_password": new_password,
            }
        )
        assert invalid_token_res.status_code == 400

        # 9. Reset password with valid token
        reset_res = await async_client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": test_email,
                "reset_token": reset_token,
                "new_password": new_password,
                "confirm_password": new_password,
            }
        )
        assert reset_res.status_code == 200
        assert reset_res.json()["success"] is True

        # 10. Token Reuse attempt (Token must be consumed and invalid)
        reuse_res = await async_client.post(
            "/api/v1/auth/reset-password",
            json={
                "email": test_email,
                "reset_token": reset_token,
                "new_password": new_password,
                "confirm_password": new_password,
            }
        )
        assert reuse_res.status_code == 400

        # 11. Login with OLD password should fail
        old_login_res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": old_password}
        )
        assert old_login_res.status_code in (400, 401)

        # 12. Login with NEW password should succeed
        new_login_res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": new_password}
        )
        assert new_login_res.status_code == 200
        token_data = new_login_res.json()
        assert "access_token" in token_data
