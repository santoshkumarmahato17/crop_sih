from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.models.advisory import (
    AdvisoryType,
    AdvisoryPriority,
    AdvisorySource,
)


class AdvisoryTranslationResponse(BaseModel):
    id: str
    advisory_id: str
    language: str
    title: str
    summary: str
    why_this_matters: str
    what_to_do_now: List[str] = Field(default_factory=list)
    what_to_monitor: List[str] = Field(default_factory=list)
    what_to_avoid: List[str] = Field(default_factory=list)
    when_to_seek_expert_help: str
    safety_warnings: List[str] = Field(default_factory=list)
    technical_breakdown: Optional[str] = None
    audio_text: Optional[str] = None

    class Config:
        from_attributes = True


class AdvisoryResponse(BaseModel):
    id: str
    farm_id: str
    farm_name: Optional[str] = None
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    crop_id: Optional[str] = None
    crop_name: Optional[str] = None
    validation_request_id: Optional[str] = None
    risk_assessment_id: Optional[str] = None
    advisory_type: AdvisoryType
    priority: AdvisoryPriority
    source: AdvisorySource
    trust_level: int
    condition_name: str
    follow_up_date: Optional[datetime] = None
    is_read: bool
    version: str
    created_at: datetime

    # Active localized translation based on request language (with fallback)
    localized: Optional[AdvisoryTranslationResponse] = None
    all_translations: List[AdvisoryTranslationResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class AdvisoryGenerateRequest(BaseModel):
    farm_id: str
    zone_id: Optional[str] = None
    crop_id: Optional[str] = None
    condition_name: str
    risk_score: float = Field(default=0.75, ge=0.0, le=1.0)
    advisory_type: AdvisoryType = AdvisoryType.DISEASE_ADVISORY
    priority: AdvisoryPriority = AdvisoryPriority.HIGH
    source: AdvisorySource = AdvisorySource.AI
    trust_level: int = Field(default=1, ge=1, le=4)
    validation_request_id: Optional[str] = None
    risk_assessment_id: Optional[str] = None
    growth_stage: Optional[str] = None
    weather_context: Dict[str, Any] = Field(default_factory=dict)


class UserLanguagePreferenceUpdate(BaseModel):
    language: str = Field(..., description="Language code: en, ta, hi, mr")
