import secrets
import time
import uuid
from typing import Dict, Any, Optional, Tuple


class OTPRecord:
    def __init__(self, otp_code: str, email: str, ttl_seconds: int = 300):
        self.otp_code = otp_code
        self.email = email.lower().strip()
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds
        self.attempts = 0
        self.max_attempts = 5
        self.resend_cooldown_until = self.created_at + 60


class ResetTokenRecord:
    def __init__(self, email: str, ttl_seconds: int = 600):
        self.token = str(uuid.uuid4())
        self.email = email.lower().strip()
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds


class OTPService:
    """
    AGRI SHIELD OTP & Reset Token Security Service.
    Manages short-lived OTP verification and password reset authorization tokens.
    """

    def __init__(self):
        self._otps: Dict[str, OTPRecord] = {}
        self._reset_tokens: Dict[str, ResetTokenRecord] = {}

    def generate_otp(self, email: str) -> Tuple[str, Dict[str, Any]]:
        """
        Generates a 6-digit secure random OTP for the given email address.
        Enforces 60-second resend cooldown and 5-minute expiry.
        """
        clean_email = email.lower().strip()
        now = time.time()

        # Check resend cooldown
        existing = self._otps.get(clean_email)
        if existing and now < existing.resend_cooldown_until:
            wait_sec = int(existing.resend_cooldown_until - now)
            raise ValueError(f"Please wait {wait_sec} seconds before requesting a new OTP.")

        # Generate cryptographically secure 6-digit OTP
        code = str(secrets.randbelow(900000) + 100000)
        record = OTPRecord(otp_code=code, email=clean_email, ttl_seconds=300)
        self._otps[clean_email] = record

        return code, {
            "expires_in_seconds": 300,
            "resend_cooldown_seconds": 60,
        }

    def clear_otp(self, email: str) -> None:
        """Purges any active OTP record for the given email address (e.g. if email delivery failed)."""
        clean_email = email.lower().strip()
        self._otps.pop(clean_email, None)

    def verify_otp(self, email: str, otp: str) -> str:
        """
        Verifies the OTP submitted for the email address.
        Invalidates OTP immediately on successful verification and issues a 10-minute Reset Token.
        """
        clean_email = email.lower().strip()
        clean_otp = str(otp).strip()
        now = time.time()

        record = self._otps.get(clean_email)
        if not record:
            raise ValueError("No active OTP request found for this email address. Please request a new OTP.")

        if now > record.expires_at:
            self._otps.pop(clean_email, None)
            raise ValueError("OTP has expired. Please request a new OTP.")

        if record.attempts >= record.max_attempts:
            self._otps.pop(clean_email, None)
            raise ValueError("Maximum OTP verification attempts exceeded. Please request a new OTP.")

        record.attempts += 1

        if record.otp_code != clean_otp:
            remaining = record.max_attempts - record.attempts
            if remaining <= 0:
                self._otps.pop(clean_email, None)
                raise ValueError("Maximum attempts exceeded. Please request a new OTP.")
            raise ValueError(f"Incorrect OTP code. {remaining} attempt(s) remaining.")

        # Invalidate OTP on successful verification
        self._otps.pop(clean_email, None)

        # Create single-use Reset Token valid for 10 minutes
        reset_rec = ResetTokenRecord(email=clean_email, ttl_seconds=600)
        self._reset_tokens[reset_rec.token] = reset_rec

        return reset_rec.token

    def consume_reset_token(self, email: str, reset_token: str) -> bool:
        """
        Validates and consumes a reset token for password change.
        Token is deleted immediately so it cannot be reused.
        """
        clean_email = email.lower().strip()
        clean_token = str(reset_token).strip()
        now = time.time()

        record = self._reset_tokens.get(clean_token)
        if not record:
            raise ValueError("Invalid or expired password reset token. Please restart the forgot password process.")

        if record.email != clean_email:
            raise ValueError("Reset token does not match the specified email address.")

        if now > record.expires_at:
            self._reset_tokens.pop(clean_token, None)
            raise ValueError("Password reset token has expired. Please restart the forgot password process.")

        # Invalidate token immediately
        self._reset_tokens.pop(clean_token, None)
        return True

    def generate_phone_otp(self, phone_number: str) -> Tuple[str, Dict[str, Any]]:
        """
        Generates a 6-digit secure random OTP for the given phone number.
        Enforces 60-second resend cooldown and 5-minute expiry.
        """
        from app.services.sms_service import normalize_indian_phone
        try:
            clean_phone = normalize_indian_phone(phone_number)
        except ValueError:
            clean_phone = phone_number.replace(" ", "").replace("-", "").strip()

        now = time.time()

        existing = self._otps.get(clean_phone)
        if existing and now < existing.resend_cooldown_until:
            wait_sec = int(existing.resend_cooldown_until - now)
            raise ValueError(f"Please wait {wait_sec} seconds before requesting a new SMS OTP.")

        code = str(secrets.randbelow(900000) + 100000)
        record = OTPRecord(otp_code=code, email=clean_phone, ttl_seconds=300)
        self._otps[clean_phone] = record

        return code, {
            "expires_in_seconds": 300,
            "resend_cooldown_seconds": 60,
        }

    def clear_phone_otp(self, phone_number: str) -> None:
        """Purges active OTP record for the phone number."""
        from app.services.sms_service import normalize_indian_phone
        try:
            clean_phone = normalize_indian_phone(phone_number)
        except ValueError:
            clean_phone = phone_number.replace(" ", "").replace("-", "").strip()
        self._otps.pop(clean_phone, None)

    def verify_phone_otp(self, phone_number: str, otp: str) -> bool:
        """
        Verifies SMS OTP code submitted for the phone number.
        Invalidates OTP immediately on successful verification.
        """
        from app.services.sms_service import normalize_indian_phone
        try:
            clean_phone = normalize_indian_phone(phone_number)
        except ValueError:
            clean_phone = phone_number.replace(" ", "").replace("-", "").strip()

        clean_otp = str(otp).strip()
        now = time.time()

        record = self._otps.get(clean_phone)
        if not record:
            raise ValueError("No active OTP request found for this phone number. Please request a new OTP.")

        if now > record.expires_at:
            self._otps.pop(clean_phone, None)
            raise ValueError("SMS OTP code has expired. Please request a new OTP.")

        if record.attempts >= record.max_attempts:
            self._otps.pop(clean_phone, None)
            raise ValueError("Maximum OTP verification attempts exceeded. Please request a new OTP.")

        record.attempts += 1

        if record.otp_code != clean_otp:
            remaining = record.max_attempts - record.attempts
            if remaining <= 0:
                self._otps.pop(clean_phone, None)
                raise ValueError("Maximum verification attempts exceeded. Please request a new OTP.")
            raise ValueError(f"Incorrect OTP code. {remaining} attempt(s) remaining.")

        self._otps.pop(clean_phone, None)
        return True



otp_service = OTPService()

