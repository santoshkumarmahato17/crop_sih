"""
KISAN SATHI — Expert Validation REST API Endpoints.
Provides endpoints for creating validation requests, viewing the case queue,
evidence aggregation, decision submission, and lab referral dispatch.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.validation import ExpertValidationRequest, ValidationRequestStatus
from app.schemas.validation import (
    ValidationRequestCreate,
    ValidationRequestResponse,
    ValidationDecisionSubmit,
    LabReferralCreate,
    LabReferralResponse,
    ValidationStatsResponse,
)
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/validation", tags=["Expert Ground-Truth Validation"])


@router.post("/requests", response_model=ValidationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_validation_request(
    req_in: ValidationRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Farmer or Extension Officer submits a crop health / disease case for expert ground-truth validation.
    """
    try:
        val_req = await ValidationService.create_request(db, req_in, current_user)
        return val_req
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests", response_model=List[ValidationRequestResponse])
async def list_validation_requests(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, UNDER_REVIEW, CONFIRMED, etc."),
    priority: Optional[str] = Query(None, description="Filter by priority: LOW, MEDIUM, HIGH, CRITICAL"),
    farm_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List validation requests.
    Farmers see only their requested cases.
    Government Officers / Admins see all regional queued cases.
    """
    return await ValidationService.list_requests(
        db=db,
        current_user=current_user,
        status=status,
        priority=priority,
        farm_id=farm_id,
        skip=skip,
        limit=limit,
    )


@router.get("/statistics", response_model=ValidationStatsResponse)
async def get_validation_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns aggregated metrics for the expert validation queue.
    """
    return await ValidationService.get_statistics(db=db, current_user=current_user)


@router.get("/requests/{id}", response_model=ValidationRequestResponse)
async def get_validation_request(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get detailed case evidence by validation request ID.
    """
    req = await ValidationService.get_request_by_id(db, id)
    if not req:
        raise HTTPException(status_code=404, detail="Validation request case not found")
    
    # Farmer RBAC check
    if current_user.role == "FARMER" and req.requested_by != current_user.id:
        from app.models.farm import Farm
        farms_res = await db.execute(select(Farm.id).where(Farm.owner_id == current_user.id))
        owned_ids = farms_res.scalars().all()
        if req.farm_id not in owned_ids:
            raise HTTPException(status_code=403, detail="Unauthorized access to this case")

    return req


@router.post("/{id}/decision", response_model=ValidationRequestResponse)
async def submit_validation_decision(
    id: str,
    decision_in: ValidationDecisionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Authorized extension officer or pathologist submits ground-truth decision (CONFIRMED, REJECTED, UNCERTAIN).
    """
    user_role_str = str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role).upper()
    if user_role_str not in ["GOVERNMENT", "ADMIN", "EXTENSION_WORKER", "EXPERT", "FARMER"]:
        raise HTTPException(status_code=403, detail="Only authorized agricultural officers can validate cases")

    try:
        updated_req = await ValidationService.submit_decision(
            db=db,
            request_id=id,
            decision_in=decision_in,
            expert_user=current_user,
        )
        return updated_req
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/lab-referral", response_model=LabReferralResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_referral(
    id: str,
    referral_in: LabReferralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Authorized officer refers a complex sample for certified laboratory analysis.
    """
    user_role_str = str(current_user.role.value if hasattr(current_user.role, "value") else current_user.role).upper()
    if user_role_str not in ["GOVERNMENT", "ADMIN", "EXTENSION_WORKER", "EXPERT", "FARMER"]:
        raise HTTPException(status_code=403, detail="Only authorized agricultural officers can order lab referrals")

    try:
        lab_ref = await ValidationService.create_lab_referral(
            db=db,
            request_id=id,
            referral_in=referral_in,
            expert_user=current_user,
        )
        return lab_ref
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.get("/history", response_model=List[ValidationRequestResponse])
async def get_validation_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Lists completed validation history records (CONFIRMED, REJECTED, LAB_REFERRAL).
    """
    return await ValidationService.list_requests(
        db=db,
        current_user=current_user,
        status=None,
        skip=skip,
        limit=limit,
    )
