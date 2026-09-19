import re
import logging
from typing import Dict, Any, Tuple
import httpx
from app.core.config import get_settings

logger = logging.getLogger("agrishield.sms_service")


def normalize_indian_phone(phone: str) -> str:
    """
    Validates and normalizes Indian mobile phone numbers to standard E.164 format (+91XXXXXXXXXX).
    Accepts formats:
    - 9842178901
    - +91 9842178901
    - +919842178901
    - 09842178901
    - 919842178901
    """
    if not phone:
        raise ValueError("Phone number is required.")

    # Remove whitespace, hyphens, dots, parentheses
    cleaned = re.sub(r"[\s\-\.\(\)]", "", phone.strip())

    # Handle leading +91
    if cleaned.startswith("+91"):
        digits = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        digits = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        digits = cleaned[1:]
    else:
        digits = cleaned

    # Check if exactly 10 digits and starts with 6, 7, 8, or 9
    if not (len(digits) == 10 and digits.isdigit() and digits[0] in "6789"):
        raise ValueError(
            "Invalid Indian mobile number. Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9842178901 or +919842178901)."
        )

    return f"+91{digits}"


class SMSService:
    """
    AGRI SHIELD SMS Delivery Engine.
    Handles SMS OTP dispatching across Twilio and Fast2SMS providers.
    """

    def __init__(self):
        self.settings = get_settings()

    async def send_otp_sms(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        """
        Dispatches SMS verification OTP to normalized phone number using configured SMS provider.
        """
        try:
            normalized_phone = normalize_indian_phone(phone_number)
        except ValueError as e:
            return {"sent": False, "reason": "INVALID_PHONE", "message": str(e)}

        phone_10_digits = normalized_phone.replace("+91", "")
        message_body = f"[AGRI SHIELD] Your verification code is: {otp_code}. Valid for 5 minutes."

        # 1. Try Twilio if credentials configured
        if (
            self.settings.TWILIO_ACCOUNT_SID
            and self.settings.TWILIO_AUTH_TOKEN
            and self.settings.TWILIO_PHONE_NUMBER
        ):
            try:
                twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{self.settings.TWILIO_ACCOUNT_SID}/Messages.json"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        twilio_url,
                        auth=(self.settings.TWILIO_ACCOUNT_SID, self.settings.TWILIO_AUTH_TOKEN),
                        data={
                            "From": self.settings.TWILIO_PHONE_NUMBER,
                            "To": normalized_phone,
                            "Body": message_body,
                        },
                    )
                    if resp.status_code in (200, 201):
                        logger.info(f"SMS OTP successfully sent via Twilio to {normalized_phone[:6]}****")
                        return {
                            "sent": True,
                            "provider": "twilio",
                            "message": "SMS OTP code sent to your mobile phone.",
                            "normalized_phone": normalized_phone,
                        }
                    else:
                        logger.error(f"Twilio SMS API error: HTTP {resp.status_code} - {resp.text}")
            except Exception as twilio_err:
                logger.error(f"Twilio connection exception: {twilio_err}")

        # 2. Try Fast2SMS if credentials configured
        if getattr(self.settings, "FAST2SMS_API_KEY", None):
            try:
                fast2sms_url = "https://www.fast2sms.com/dev/bulkV2"
                headers = {
                    "authorization": self.settings.FAST2SMS_API_KEY,
                    "Content-Type": "application/json",
                }
                payload = {
                    "route": "otp",
                    "variables_values": otp_code,
                    "numbers": phone_10_digits,
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(fast2sms_url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("return") is True:
                            logger.info(f"SMS OTP successfully sent via Fast2SMS to {normalized_phone[:6]}****")
                            return {
                                "sent": True,
                                "provider": "fast2sms",
                                "message": "SMS OTP code sent to your mobile phone.",
                                "normalized_phone": normalized_phone,
                            }
                        else:
                            logger.error(f"Fast2SMS error response: {data}")
                    else:
                        logger.error(f"Fast2SMS API error: HTTP {resp.status_code} - {resp.text}")
            except Exception as f2s_err:
                logger.error(f"Fast2SMS connection exception: {f2s_err}")

        # 3. Try MSG91 if credentials configured
        msg91_auth = getattr(self.settings, "MSG91_AUTH_KEY", None)
        msg91_template = getattr(self.settings, "MSG91_TEMPLATE_ID", None)
        if msg91_auth and msg91_template:
            try:
                msg91_url = f"https://control.msg91.com/api/v5/otp?template_id={msg91_template}&mobile=91{phone_10_digits}&authkey={msg91_auth}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(msg91_url, json={"otp": otp_code})
                    if resp.status_code == 200:
                        logger.info(f"SMS OTP successfully sent via MSG91 to {normalized_phone[:6]}****")
                        return {
                            "sent": True,
                            "provider": "msg91",
                            "message": "SMS OTP code sent to your mobile phone.",
                            "normalized_phone": normalized_phone,
                        }
            except Exception as msg91_err:
                logger.error(f"MSG91 connection exception: {msg91_err}")

        # 4. Handle unconfigured or failed SMS providers
        has_credentials = bool(
            (self.settings.TWILIO_ACCOUNT_SID and self.settings.TWILIO_AUTH_TOKEN)
            or getattr(self.settings, "FAST2SMS_API_KEY", None)
            or (getattr(self.settings, "MSG91_AUTH_KEY", None) and getattr(self.settings, "MSG91_TEMPLATE_ID", None))
        )

        if not has_credentials:
            logger.info(f"[DEVELOPMENT MODE] Generated Phone OTP for {normalized_phone}: {otp_code}")
            return {
                "sent": False,
                "reason": "PROVIDER_NOT_CONFIGURED",
                "message": "SMS provider is not configured on the server. Please configure TWILIO, FAST2SMS, or MSG91 API keys in backend/.env.",
                "normalized_phone": normalized_phone,
            }


        return {
            "sent": False,
            "reason": "SMS_DELIVERY_FAILED",
            "message": "Failed to deliver SMS message via the SMS gateway service. Please check provider credentials and account balance.",
            "normalized_phone": normalized_phone,
        }


sms_service = SMSService()
