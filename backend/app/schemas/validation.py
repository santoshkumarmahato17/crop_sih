from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.models.validation import (
    ValidationRequestStatus,
    ValidationPriority,
)
from app.models.laboratory import LabReferralStatus


class ValidationRequestCreate(BaseModel):
    analysis_id: Optional[str] = None
    farm_id: str
    zone_id: Optional[str] = None
    crop_id: Optional[str] = None
    priority: ValidationPriority = ValidationPriority.MEDIUM
    reason: str
    suspected_condition: str = "Suspected Foliar Anomaly"
    ai_confidence: float = Field(default=0.75, ge=0.0, le=1.0)
    crop_growth_stage: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    image_urls: List[str] = Field(default_factory=list)
    weather_summary: Dict[str, Any] = Field(default_factory=dict)
    hotspot_id: Optional[str] = None
    drone_observation_id: Optional[str] = None


class ValidationDecisionSubmit(BaseModel):
    decision: ValidationRequestStatus = Field(
        ..., description="CONFIRMED, REJECTED, UNCERTAIN, or LAB_REFERRAL"
    )
    confirmed_condition: Optional[str] = None
    expert_notes: Optional[str] = Field(None, description="Internal technical notes for archive")
    farmer_guidance: Optional[str] = Field(None, description="Plain language actionable guidance for farmer")
    rejection_reason: Optional[str] = None
    uncertain_recommendation: Optional[str] = None


class LabReferralCreate(BaseModel):
    sample_type: str = "Leaf Tissue Sample"
    suspected_condition: str
    reason: str


class LabReferralResponse(BaseModel):
    id: str
    referral_code: str
    validation_request_id: str
    farm_id: str
    zone_id: Optional[str] = None
    sample_type: str
    suspected_condition: str
    reason: str
    status: LabReferralStatus
    requested_at: datetime
    result_summary: Optional[str] = None
    result_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpertValidationRecordResponse(BaseModel):
    id: str
    validation_request_id: str
    expert_user_id: str
    expert_name: Optional[str] = None
    status: ValidationRequestStatus
    confirmed_condition: Optional[str] = None
    expert_notes: Optional[str] = None
    farmer_guidance: Optional[str] = None
    rejection_reason: Optional[str] = None
    uncertain_recommendation: Optional[str] = None
    validation_version: str
    validated_at: datetime

    class Config:
        from_attributes = True


class ValidationRequestResponse(BaseModel):
    id: str
    case_number: str
    analysis_id: Optional[str] = None
    farm_id: str
    farm_name: Optional[str] = None
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    crop_id: Optional[str] = None
    crop_name: Optional[str] = None
    requested_by: str
    requester_name: Optional[str] = None
    assigned_expert_id: Optional[str] = None
    assigned_expert_name: Optional[str] = None
    priority: ValidationPriority
    status: ValidationRequestStatus
    reason: str
    suspected_condition: str
    ai_confidence: float
    crop_growth_stage: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    image_urls: List[str] = Field(default_factory=list)
    weather_summary: Dict[str, Any] = Field(default_factory=dict)
    hotspot_id: Optional[str] = None
    drone_observation_id: Optional[str] = None
    due_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    decisions: List[ExpertValidationRecordResponse] = Field(default_factory=list)
    lab_referrals: List[LabReferralResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ValidationStatsResponse(BaseModel):
    total_pending: int
    high_priority: int
    critical: int
    my_assigned: int
    recently_validated: int
    lab_referrals: int
