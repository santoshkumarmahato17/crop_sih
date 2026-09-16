from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.api.deps import get_current_active_user, get_db
from app.models.auth import User
from app.models.diagnostic_case import DiagnosticCase
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class DiagnosticCaseResponse(BaseModel):
    id: str
    farm_id: str
    zone_id: str | None
    crop: str
    source_type: str
    ai_status: str
    expert_status: str
    lab_status: str
    final_status: str
    final_condition: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/{case_id}", response_model=DiagnosticCaseResponse)
def get_diagnostic_case(
    case_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve a diagnostic case and its current states."""
    case = db.query(DiagnosticCase).filter(DiagnosticCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Diagnostic Case not found")
    # For a real implementation, we would check if the user has access to this farm
    return case

@router.get("/{case_id}/timeline")
def get_diagnostic_case_timeline(
    case_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve the full audit timeline for a diagnostic case."""
    case = db.query(DiagnosticCase).filter(DiagnosticCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Diagnostic Case not found")
        
    # In a full implementation, this would query the AuditLog for events related to this case_id
    # including AI prediction, Expert review, and Lab events.
    # We will return a mock timeline for demonstration of the unified case logic.
    return [
        {
            "timestamp": case.created_at,
            "actor": "System",
            "event": "DIAGNOSTIC_CASE_CREATED",
            "details": {"source": case.source_type.value, "crop": case.crop}
        }
    ]
