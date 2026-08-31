from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.core.logging import logger


class NotificationChannelBase(ABC):
    """Abstract notification delivery channel."""

    @abstractmethod
    async def send(
        self,
        recipient_id: str,
        recipient_address: str,
        title: str,
        content: str,
        severity: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Dispatches notification via specific transport medium."""
        pass


class InSystemChannel(NotificationChannelBase):
    """In-system delivery channel persisting to UI notification center."""

    async def send(
        self,
        recipient_id: str,
        recipient_address: str,
        title: str,
        content: str,
        severity: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        logger.info(f"[InSystem Notification] Delivered to user {recipient_id}: [{severity}] {title}")
        return True


class PushNotificationChannel(NotificationChannelBase):
    """Push notification channel stub for FCM / APNs."""

    async def send(
        self,
        recipient_id: str,
        recipient_address: str,
        title: str,
        content: str,
        severity: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        logger.info(f"[Push Notification Stub] Queued for user {recipient_id} device token: {title}")
        return True


class SMSChannel(NotificationChannelBase):
    """SMS channel stub for Twilio / AWS SNS."""

    async def send(
        self,
        recipient_id: str,
        recipient_address: str,
        title: str,
        content: str,
        severity: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        logger.info(f"[SMS Notification Stub] Dispatched SMS to {recipient_address}: {title}")
        return True


class EmailChannel(NotificationChannelBase):
    """Email channel stub for SMTP / SendGrid."""

    async def send(
        self,
        recipient_id: str,
        recipient_address: str,
        title: str,
        content: str,
        severity: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        logger.info(f"[Email Notification Stub] Sent email to {recipient_address}: {title}")
        return True


class NotificationDispatcher:
    """Multi-channel notification routing manager."""

    def __init__(self):
        self.channels: Dict[str, NotificationChannelBase] = {
            "in_app": InSystemChannel(),
            "push": PushNotificationChannel(),
            "sms": SMSChannel(),
            "email": EmailChannel(),
        }

    async def dispatch(
        self,
        recipient_id: str,
        recipient_email: str,
        title: str,
        content: str,
        severity: str,
        channel_keys: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, bool]:
        keys = channel_keys or ["in_app"]
        results = {}
        for key in keys:
            channel = self.channels.get(key)
            if channel:
                results[key] = await channel.send(
                    recipient_id=recipient_id,
                    recipient_address=recipient_email,
                    title=title,
                    content=content,
                    severity=severity,
                    metadata=metadata,
                )
        return results


notification_dispatcher = NotificationDispatcher()
