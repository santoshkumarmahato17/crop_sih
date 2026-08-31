from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.officer import (
    OfficerDashboardResponse,
    OfficerValidationRequest,
    OfficerValidationResponse,
)
from app.services.officer_service import officer_service

router = APIRouter(prefix="/officer", tags=["Extension Officer Intelligence & Audited Review"])


@router.get(
    "/dashboard",
    response_model=OfficerDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Extension Officer Prioritized Farm Portfolio",
    description="Retrieves assigned agricultural holdings ranked by urgency tier (CRITICAL, HIGH, MEDIUM, LOW) with unresolved alert tallies.",
)
async def get_officer_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> OfficerDashboardResponse:
    return await officer_service.get_officer_dashboard(db=db, current_user=current_user)


@router.post(
    "/validations",
    response_model=OfficerValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit Audited Expert Review / Field Action",
    description="Records agronomist validation, rejection, lab confirmation request, or field visit with an immutable audit log entry.",
)
async def submit_officer_validation(
    request: OfficerValidationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> OfficerValidationResponse:
    return await officer_service.submit_validation_and_audit(
        db=db, request=request, current_user=current_user
    )
