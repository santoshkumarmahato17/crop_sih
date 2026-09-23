import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any

from app.core.config import get_settings

logger = logging.getLogger("agrishield.email")
settings = get_settings()


class EmailService:
    """
    KISAN SATHI Email Service.
    Handles secure email dispatch for authentication, OTP verification, and system notifications.
    Reads SMTP credentials securely from environment variables.
    """

    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> Dict[str, Any]:
        """
        Sends a 6-digit OTP verification code to the target user's email address.
        If SMTP_HOST is configured, delivers live email via SMTP TLS.
        If SMTP_HOST is not configured, logs a clear warning and returns unconfigured status.
        """
        if not settings.SMTP_HOST:
            logger.warning(
                f"[EmailService] SMTP_HOST is not configured. OTP '{otp_code}' generated for '{to_email}' "
                "logged to console for development testing."
            )
            return {
                "sent": False,
                "reason": "SMTP_NOT_CONFIGURED",
                "message": "SMTP email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in backend/.env",
            }

        sender_email = settings.EMAILS_FROM_EMAIL or "noreply@kisansathi.farm"
        sender_name = settings.EMAILS_FROM_NAME or "KISAN SATHI Security"

        subject = f"{otp_code} — Your KISAN SATHI Verification OTP"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 1px solid #edf2f7; }}
            .title {{ color: #166534; font-size: 20px; font-weight: 800; margin: 10px 0 4px 0; }}
            .subtitle {{ color: #64748b; font-size: 12px; margin: 0; }}
            .content {{ padding: 24px 0; text-align: center; }}
            .otp-box {{ background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #15803d; }}
            .notice {{ color: #64748b; font-size: 12px; line-height: 1.6; margin-top: 16px; }}
            .footer {{ text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7; padding-top: 16px; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">KISAN SATHI</h1>
              <p class="subtitle">Precision Agricultural Security & Password Reset System</p>
            </div>
            <div class="content">
              <p style="color: #334155; font-size: 14px; font-weight: 600;">Your One-Time Password (OTP) for password reset is:</p>
              <div class="otp-box">{otp_code}</div>
              <p class="notice">This OTP will expire in <strong>5 minutes</strong>.<br>For security reasons, do not share this OTP with anyone.</p>
            </div>
            <div class="footer">
              <p>© 2026 KISAN SATHI System. If you did not request this OTP, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email

        plain_text = f"Your KISAN SATHI password reset OTP is: {otp_code}. Valid for 5 minutes."
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        try:
            port = settings.SMTP_PORT or 587
            with smtplib.SMTP(settings.SMTP_HOST, port, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, [to_email], msg.as_string())
            
            logger.info(f"[EmailService] Successfully sent OTP email to '{to_email}' via SMTP.")
            return {"sent": True, "message": f"OTP email successfully dispatched to {to_email}."}
        except Exception as e:
            err_msg = str(e)
            logger.error(f"[EmailService] Failed to send email to '{to_email}' via SMTP ({settings.SMTP_HOST}:{port}): {err_msg}")
            return {"sent": False, "reason": "SMTP_ERROR", "message": f"Failed to deliver email via SMTP: {err_msg}"}


email_service = EmailService()
