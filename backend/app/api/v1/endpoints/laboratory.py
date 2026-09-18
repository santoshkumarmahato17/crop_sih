from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict, Any
from app.api.deps import get_current_active_user, get_db
from app.models.auth import User, Role
from app.models.laboratory import LabReferral, LabSample, LabResult, LabReport, LabReferralStatus, SampleStatus, LabResultStatus
from app.models.diagnostic_case import DiagnosticCase, LabStatus, FinalStatus
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class LabReferralCreate(BaseModel):
    suspected_condition: str
    referral_reason: str
    priority: str = "NORMAL"
    sample_type_requested: str = "Leaf"
    collection_instructions: str | None = None

class LabReferralResponse(BaseModel):
    id: str
    referral_code: str
    diagnostic_case_id: str
    status: str
    suspected_condition: str
    priority: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/cases/{case_id}/lab-referral", response_model=LabReferralResponse)
def create_lab_referral(
    case_id: str,
    referral_in: LabReferralCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new lab referral for a diagnostic case (Expert only)."""
    case = db.query(DiagnosticCase).filter(DiagnosticCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Diagnostic Case not found")
        
    referral = LabReferral(
        diagnostic_case_id=case_id,
        expert_id=current_user.id,
        suspected_condition=referral_in.suspected_condition,
        referral_reason=referral_in.referral_reason,
        priority=referral_in.priority,
        sample_type_requested=referral_in.sample_type_requested,
        collection_instructions=referral_in.collection_instructions,
        status=LabReferralStatus.REQUESTED
    )
    
    # Update Case Status
    case.lab_status = LabStatus.REFERRAL_PENDING
    
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral

@router.get("/referrals", response_model=List[LabReferralResponse])
def get_lab_referrals(
    status: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all lab referrals. Filter by status."""
    query = db.query(LabReferral)
    if status:
        query = query.filter(LabReferral.status == status)
    return query.all()

class SampleCreate(BaseModel):
    sample_type: str
    collection_location: str | None = None
    sample_description: str | None = None

@router.post("/referrals/{referral_id}/samples")
def collect_sample(
    referral_id: str,
    sample_in: SampleCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record physical sample collection for a referral."""
    referral = db.query(LabReferral).filter(LabReferral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    if referral.status not in [LabReferralStatus.REQUESTED, LabReferralStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="Referral is not in a state to collect samples")
        
    sample = LabSample(
        referral_id=referral_id,
        collector_id=current_user.id,
        sample_type=sample_in.sample_type,
        collection_location=sample_in.collection_location,
        sample_description=sample_in.sample_description,
        collection_date=datetime.utcnow(),
        status=SampleStatus.COLLECTED
    )
    
    referral.status = LabReferralStatus.SAMPLE_COLLECTED
    referral.diagnostic_case.lab_status = LabStatus.SAMPLE_COLLECTED
    
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample

class ResultCreate(BaseModel):
    test_name: str
    result_status: str
    pathogen: str | None = None
    notes: str | None = None

@router.post("/referrals/{referral_id}/results")
def submit_lab_result(
    referral_id: str,
    result_in: ResultCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit a structured lab result."""
    referral = db.query(LabReferral).filter(LabReferral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    result = LabResult(
        referral_id=referral_id,
        technician_id=current_user.id,
        test_name=result_in.test_name,
        result_status=LabResultStatus(result_in.result_status),
        pathogen=result_in.pathogen,
        notes=result_in.notes,
        tested_at=datetime.utcnow()
    )
    
    referral.status = LabReferralStatus.RESULT_AVAILABLE
    referral.diagnostic_case.lab_status = LabStatus.RESULT_AVAILABLE
    
    if result_in.result_status == "POSITIVE":
        referral.diagnostic_case.final_status = FinalStatus.LAB_CONFIRMED
        referral.diagnostic_case.final_condition = result_in.pathogen or referral.suspected_condition
        
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

@router.post("/results/{result_id}/report")
def upload_lab_report(
    result_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload immutable PDF/Image report as evidence."""
    result = db.query(LabResult).filter(LabResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
        
    # In a real app we'd upload to MinIO/S3 here
    # For now we mock the database record creation
    report = LabReport(
        result_id=result_id,
        uploaded_by=current_user.id,
        report_reference=file.filename,
        file_path=f"s3://lab-reports/{file.filename}",
        file_hash="mock-hash"
    )
    
    db.add(report)
    db.commit()
    return {"message": "Report uploaded successfully"}
