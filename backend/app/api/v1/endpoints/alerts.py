from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.alert import (
    AlertCreate,
    AlertResponse,
    MarkNotificationReadRequest,
    NotificationCenterSummary,
)
from app.services.alert_service import alert_service
from app.services.notification_service import notification_service

router = APIRouter(tags=["Alerts & Multi-Channel Notification Center"])


# --- Alerts Endpoints ---


@router.get(
    "/alerts",
    response_model=List[AlertResponse],
    status_code=status.HTTP_200_OK,
    summary="List User Scope-Enforced Agro-Intelligence Alerts",
    description="Returns active and historical alerts filtered by user authorization role.",
)
async def list_alerts(
    is_resolved: Optional[bool] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[AlertResponse]:
    return await alert_service.list_user_alerts(
        db=db, current_user=current_user, is_resolved=is_resolved, severity=severity
    )


@router.post(
    "/alerts",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger System Agro-Intelligence Alert",
    description="Dispatches a new alert and sends multi-channel notifications to authorized recipients.",
)
async def create_alert(
    data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AlertResponse:
    return await alert_service.create_alert(db=db, data=data, current_user=current_user)


@router.put(
    "/alerts/{alert_id}/resolve",
    response_model=AlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Acknowledge / Resolve Agro Alert",
    description="Marks an alert as resolved by an agricultural operator or officer.",
)
async def resolve_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AlertResponse:
    return await alert_service.resolve_alert(
        db=db, alert_id=alert_id, current_user=current_user
    )


# --- Notification Center Endpoints ---


@router.get(
    "/notifications",
    response_model=NotificationCenterSummary,
    status_code=status.HTTP_200_OK,
    summary="Get User Notification Inbox & Unread Counter",
    description="Retrieves delivered in-system notifications with severity badge tallies.",
)
async def get_notifications(
    unread_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> NotificationCenterSummary:
    return await notification_service.get_user_notifications(
        db=db, current_user=current_user, unread_only=unread_only
    )


@router.post(
    "/notifications/mark-read",
    status_code=status.HTTP_200_OK,
    summary="Mark Notifications as Read",
    description="Acknowledges specific notification IDs.",
)
async def mark_notifications_read(
    payload: MarkNotificationReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    count = await notification_service.mark_as_read(
        db=db, notification_ids=payload.notification_ids, current_user=current_user
    )
    return {"marked_count": count, "status": "success"}


@router.post(
    "/notifications/mark-all-read",
    status_code=status.HTTP_200_OK,
    summary="Mark All Notifications as Read",
    description="Clears all unread badges for the current user.",
)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    await notification_service.mark_all_read(db=db, current_user=current_user)
    return {"status": "all_marked_read"}
