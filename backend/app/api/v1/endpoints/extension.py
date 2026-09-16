from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.api.deps import require_role, get_db
from app.core.permissions import RoleType
from app.models.auth import User
from app.models.validation import ExpertValidationRequest, ValidationRequestStatus
from app.services.validation_service import ValidationService
from app.schemas.validation import ValidationDecisionSubmit
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ValidationRequestResponse(BaseModel):
    id: str
    case_number: str
    status: str
    priority: str
    suspected_condition: str
    farm_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/queue", response_model=List[ValidationRequestResponse])
def get_extension_queue(
    status: str = None,
    current_user: User = Depends(require_role(RoleType.EXTENSION_WORKER, RoleType.GOVERNMENT, RoleType.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get pending field verification queue for extension workers."""
    return ValidationService.list_requests(
        db=db,
        current_user=current_user,
        status=status,
    )

@router.post("/cases/{case_id}/verify")
def submit_field_verification(
    case_id: str,
    decision_in: ValidationDecisionSubmit,
    current_user: User = Depends(require_role(RoleType.EXTENSION_WORKER, RoleType.GOVERNMENT, RoleType.ADMIN)),
    db: Session = Depends(get_db)
):
    """Submit field verification ground-truth data (Validate/Reject/Request More Evidence)."""
    return ValidationService.process_decision(
        db=db,
        request_id=case_id,
        decision_in=decision_in,
        expert_user=current_user
    )

class EvidenceCreate(BaseModel):
    image_url: str
    notes: str | None = None

@router.post("/cases/{case_id}/evidence")
def upload_additional_evidence(
    case_id: str,
    evidence_in: EvidenceCreate,
    current_user: User = Depends(require_role(RoleType.EXTENSION_WORKER, RoleType.GOVERNMENT, RoleType.ADMIN)),
    db: Session = Depends(get_db)
):
    """Upload additional field evidence for a validation case."""
    req = db.query(ExpertValidationRequest).filter(ExpertValidationRequest.id == case_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Validation case not found")
        
    # Append new evidence logic
    current_images = req.image_urls or []
    current_images.append(evidence_in.image_url)
    req.image_urls = current_images
    
    # If it was waiting for evidence, move back to under review
    if req.status == ValidationRequestStatus.REQUEST_MORE_EVIDENCE:
        req.status = ValidationRequestStatus.UNDER_REVIEW
        
    db.commit()
    db.refresh(req)
    return {"message": "Evidence uploaded successfully", "case_id": case_id}
