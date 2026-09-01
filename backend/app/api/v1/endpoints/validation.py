"""
AGRI SHIELD — Expert Validation REST API Endpoints.
Provides endpoints for creating validation requests, viewing the case queue,
evidence aggregation, decision submission, and lab referral dispatch.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

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
def create_validation_request(
    req_in: ValidationRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Farmer or Extension Officer submits a crop health / disease case for expert ground-truth validation.
    """
    try:
        val_req = ValidationService.create_request(db, req_in, current_user)
        return val_req
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests", response_model=List[ValidationRequestResponse])
def list_validation_requests(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, UNDER_REVIEW, CONFIRMED, etc."),
    priority: Optional[str] = Query(None, description="Filter by priority: LOW, MEDIUM, HIGH, CRITICAL"),
    farm_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List validation requests.
    Farmers see only their requested cases.
    Government Officers / Admins see all regional queued cases.
    """
    return ValidationService.list_requests(
        db=db,
        current_user=current_user,
        status=status,
        priority=priority,
        farm_id=farm_id,
        skip=skip,
        limit=limit,
    )


@router.get("/requests/{id}", response_model=ValidationRequestResponse)
def get_validation_request(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get detailed case evidence by validation request ID.
    """
    req = ValidationService.get_request_by_id(db, id)
    if not req:
        raise HTTPException(status_code=404, detail="Validation request case not found")
    
    # Farmer RBAC check
    if current_user.role == "FARMER" and req.requested_by != current_user.id:
        # Check if farmer owns the farm
        if req.farm_id not in [f.id for f in current_user.owned_farms]:
            raise HTTPException(status_code=403, detail="Unauthorized access to this case")

    return req


@router.post("/{id}/decision", response_model=ValidationRequestResponse)
def submit_validation_decision(
    id: str,
    decision_in: ValidationDecisionSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Authorized extension officer or pathologist submits ground-truth decision (CONFIRMED, REJECTED, UNCERTAIN).
    """
    if current_user.role not in ["GOVERNMENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only authorized agricultural officers can validate cases")

    try:
        updated_req = ValidationService.submit_decision(
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
def create_lab_referral(
    id: str,
    referral_in: LabReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Authorized officer refers a complex sample for certified laboratory analysis.
    """
    if current_user.role not in ["GOVERNMENT", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only authorized agricultural officers can order lab referrals")

    try:
        lab_ref = ValidationService.create_lab_referral(
            db=db,
            request_id=id,
            referral_in=referral_in,
            expert_user=current_user,
        )
        return lab_ref
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.get("/statistics", response_model=ValidationStatsResponse)
def get_validation_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns aggregated metrics for the expert validation queue.
    """
    return ValidationService.get_statistics(db=db, current_user=current_user)


@router.get("/history", response_model=List[ValidationRequestResponse])
def get_validation_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Lists completed validation history records (CONFIRMED, REJECTED, LAB_REFERRAL).
    """
    return ValidationService.list_requests(
        db=db,
        current_user=current_user,
        status=None,
        skip=skip,
        limit=limit,
    )
