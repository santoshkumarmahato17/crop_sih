"""
AGRI SHIELD — Multilingual Agricultural Advisories REST API Endpoints.
Provides endpoints for querying localized farmer advisories, generating dynamic
multi-signal risk advisories, and updating user language preference.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.auth import User
from app.models.advisory import Advisory
from app.models.audit import AuditLog, AuditEventType
from app.schemas.advisory import (
    AdvisoryResponse,
    AdvisoryGenerateRequest,
    UserLanguagePreferenceUpdate,
    AdvisoryTranslationResponse,
)
from app.services.advisory_engine import AdvisoryEngine

router = APIRouter(prefix="/advisories", tags=["Multilingual Agricultural Advisories"])


@router.get("", response_model=List[AdvisoryResponse])
def list_advisories(
    farm_id: Optional[str] = Query(None),
    language: Optional[str] = Query(None, description="Language code: en, ta, hi, mr"),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Lists advisories tailored to the user's preferred or requested language.
    """
    target_lang = language or getattr(current_user, "preferred_language", "en")
    
    return AdvisoryEngine.list_advisories(
        db=db,
        current_user=current_user,
        farm_id=farm_id,
        language=target_lang,
        priority=priority,
        skip=skip,
        limit=limit,
    )


@router.get("/{id}", response_model=AdvisoryResponse)
def get_advisory_by_id(
    id: str,
    language: Optional[str] = Query(None, description="Language code: en, ta, hi, mr"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieves a single advisory by ID with active localized translation.
    """
    adv = db.query(Advisory).filter(Advisory.id == id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Advisory not found")

    target_lang = language or getattr(current_user, "preferred_language", "en")
    active_trans = next((t for t in adv.translations if t.language == target_lang), None)
    if not active_trans:
        active_trans = next((t for t in adv.translations if t.language == "en"), None)

    return {
        "id": adv.id,
        "farm_id": adv.farm_id,
        "farm_name": adv.farm.name if adv.farm else "Demo Farm",
        "zone_id": adv.zone_id,
        "zone_name": adv.zone.name if adv.zone else None,
        "crop_id": adv.crop_id,
        "crop_name": adv.crop.name if adv.crop else None,
        "validation_request_id": adv.validation_request_id,
        "risk_assessment_id": adv.risk_assessment_id,
        "advisory_type": adv.advisory_type,
        "priority": adv.priority,
        "source": adv.source,
        "trust_level": adv.trust_level,
        "condition_name": adv.condition_name,
        "follow_up_date": adv.follow_up_date,
        "is_read": adv.is_read,
        "version": adv.version,
        "created_at": adv.created_at,
        "localized": active_trans,
        "all_translations": adv.translations,
    }


@router.post("/generate", response_model=AdvisoryResponse, status_code=status.HTTP_201_CREATED)
def generate_advisory(
    req: AdvisoryGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generates a localized multi-signal advisory with pre-rendered language versions.
    """
    try:
        adv = AdvisoryEngine.generate_advisory(db, req, creator_user=current_user)
        active_trans = next((t for t in adv.translations if t.language == "en"), None)
        return {
            "id": adv.id,
            "farm_id": adv.farm_id,
            "farm_name": adv.farm.name if adv.farm else "Demo Farm",
            "zone_id": adv.zone_id,
            "zone_name": adv.zone.name if adv.zone else None,
            "crop_id": adv.crop_id,
            "crop_name": adv.crop.name if adv.crop else None,
            "validation_request_id": adv.validation_request_id,
            "risk_assessment_id": adv.risk_assessment_id,
            "advisory_type": adv.advisory_type,
            "priority": adv.priority,
            "source": adv.source,
            "trust_level": adv.trust_level,
            "condition_name": adv.condition_name,
            "follow_up_date": adv.follow_up_date,
            "is_read": adv.is_read,
            "version": adv.version,
            "created_at": adv.created_at,
            "localized": active_trans,
            "all_translations": adv.translations,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}/translations", response_model=List[AdvisoryTranslationResponse])
def get_advisory_translations(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all language translations available for this advisory.
    """
    adv = db.query(Advisory).filter(Advisory.id == id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Advisory not found")
    return adv.translations


@router.patch("/me/language", status_code=status.HTTP_200_OK)
def update_user_preferred_language(
    payload: UserLanguagePreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Updates the authenticated user's preferred language (en, ta, hi, mr).
    """
    valid_langs = ["en", "ta", "hi", "mr"]
    if payload.language not in valid_langs:
        raise HTTPException(status_code=400, detail=f"Unsupported language code. Choose from: {valid_langs}")

    current_user.preferred_language = payload.language
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        event_type=AuditEventType.LANGUAGE_CHANGED,
        details={"new_language": payload.language},
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "preferred_language": payload.language}
