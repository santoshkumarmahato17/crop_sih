import asyncio
import pytest
from app.services.sms_service import normalize_indian_phone, sms_service
from app.services.otp_service import otp_service


def test_indian_phone_normalization():
    assert normalize_indian_phone("9842178901") == "+919842178901"
    assert normalize_indian_phone("+91 9842178901") == "+919842178901"
    assert normalize_indian_phone("09842178901") == "+919842178901"
    assert normalize_indian_phone("919842178901") == "+919842178901"
    assert normalize_indian_phone("+91-9842178901") == "+919842178901"

    with pytest.raises(ValueError):
        normalize_indian_phone("1234567890")  # invalid prefix

    with pytest.raises(ValueError):
        normalize_indian_phone("98421")  # too short


def test_phone_otp_lifecycle():
    phone = "9842178901"
    code, info = otp_service.generate_phone_otp(phone)
    assert len(code) == 6
    assert code.isdigit()

    # Invalid OTP attempt
    with pytest.raises(ValueError):
        otp_service.verify_phone_otp(phone, "000000")

    # Correct OTP verification
    verified = otp_service.verify_phone_otp(phone, code)
    assert verified is True

    # Immediate invalidation check
    with pytest.raises(ValueError):
        otp_service.verify_phone_otp(phone, code)


@pytest.mark.asyncio
async def test_sms_service_fallback():
    res = await sms_service.send_otp_sms("9842178901", "123456")
    assert "sent" in res
    assert "normalized_phone" in res
    assert res["normalized_phone"] == "+919842178901"


if __name__ == "__main__":
    test_indian_phone_normalization()
    test_phone_otp_lifecycle()
    asyncio.run(test_sms_service_fallback())
    print("ALL AUTH UNIT TESTS PASSED SUCCESSFULLY!")
