"""
KISAN SATHI — Multilingual Agricultural Advisories REST API Endpoints.
Provides endpoints for querying localized farmer advisories, generating dynamic
multi-signal risk advisories, and updating user language preference.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

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


def _serialize_advisory(adv, lang: str) -> dict:
    """Serialize an Advisory ORM object to a response dict safely."""
    translations = getattr(adv, "translations", []) or []
    active_trans = next((t for t in translations if getattr(t, "language", None) == lang), None)
    if not active_trans:
        active_trans = next((t for t in translations if getattr(t, "language", None) in ("en", "en-IN")), None)
    if not active_trans and translations:
        active_trans = translations[0]

    farm_obj = getattr(adv, "farm", None)
    zone_obj = getattr(adv, "zone", None)
    crop_obj = getattr(adv, "crop", None)

    return {
        "id": adv.id,
        "farm_id": adv.farm_id,
        "farm_name": farm_obj.name if farm_obj else "Demo Farm",
        "zone_id": adv.zone_id,
        "zone_name": zone_obj.name if zone_obj else None,
        "crop_id": adv.crop_id,
        "crop_name": crop_obj.name if crop_obj else None,
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
        "all_translations": translations,
    }


@router.get("", response_model=List[AdvisoryResponse])
async def list_advisories(
    farm_id: Optional[str] = Query(None),
    language: Optional[str] = Query(None, description="Language code: en, ta, hi, mr"),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Lists advisories tailored to the user's preferred or requested language."""
    target_lang = language or getattr(current_user, "preferred_language", "en")

    stmt = select(Advisory).options(
        selectinload(Advisory.translations),
        selectinload(Advisory.farm),
        selectinload(Advisory.zone),
        selectinload(Advisory.crop),
    )

    if getattr(current_user, "role", None) == "FARMER":
        try:
            from app.models.farm import Farm
            farms_res = await db.execute(select(Farm.id).where(Farm.owner_id == current_user.id))
            owned_ids = farms_res.scalars().all()
            if owned_ids:
                stmt = stmt.where(Advisory.farm_id.in_(owned_ids))
        except Exception:
            pass
    if farm_id:
        stmt = stmt.where(Advisory.farm_id == farm_id)
    if priority:
        stmt = stmt.where(Advisory.priority == priority)

    skip_val = int(skip) if not hasattr(skip, "default") else 0
    limit_val = int(limit) if not hasattr(limit, "default") else 50

    stmt = stmt.order_by(desc(Advisory.created_at)).offset(skip_val).limit(limit_val)

    result = await db.execute(stmt)
    advisories = result.scalars().all()

    return [_serialize_advisory(adv, target_lang) for adv in advisories]


@router.get("/{id}", response_model=AdvisoryResponse)
async def get_advisory_by_id(
    id: str,
    language: Optional[str] = Query(None, description="Language code: en, ta, hi, mr"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieves a single advisory by ID with active localized translation."""
    stmt = select(Advisory).options(
        selectinload(Advisory.translations),
        selectinload(Advisory.farm),
        selectinload(Advisory.zone),
        selectinload(Advisory.crop),
    ).where(Advisory.id == id)
    result = await db.execute(stmt)
    adv = result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advisory not found")

    target_lang = language or getattr(current_user, "preferred_language", "en")
    return _serialize_advisory(adv, target_lang)


@router.post("/generate", response_model=AdvisoryResponse, status_code=status.HTTP_201_CREATED)
async def generate_advisory(
    req: AdvisoryGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generates a localized multi-signal advisory with pre-rendered language versions."""
    try:
        adv = AdvisoryEngine.generate_advisory(db, req, creator_user=current_user)
        return _serialize_advisory(adv, "en")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}/translations", response_model=List[AdvisoryTranslationResponse])
async def get_advisory_translations(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all language translations available for this advisory."""
    result = await db.execute(select(Advisory).where(Advisory.id == id))
    adv = result.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Advisory not found")
    return adv.translations


@router.patch("/me/language", status_code=status.HTTP_200_OK)
async def update_user_preferred_language(
    payload: UserLanguagePreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Updates the authenticated user's preferred language (en, ta, hi, mr)."""
    valid_langs = ["en", "ta", "hi", "mr"]
    if payload.language not in valid_langs:
        raise HTTPException(status_code=400, detail=f"Unsupported language code. Choose from: {valid_langs}")

    current_user.preferred_language = payload.language

    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        event_type=AuditEventType.LANGUAGE_CHANGED,
        details={"new_language": payload.language},
    )
    db.add(audit)
    await db.commit()

    return {"status": "success", "preferred_language": payload.language}
