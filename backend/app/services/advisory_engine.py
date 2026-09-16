"""
AGRI SHIELD — Multilingual Agricultural Advisory Engine.
Converts multi-signal environmental and agronomic risk telemetry into
localized, IPM-safe farmer advisories in English, Tamil, Hindi, and Marathi.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.advisory import (
    Advisory,
    AdvisoryTranslation,
    AdvisoryType,
    AdvisoryPriority,
    AdvisorySource,
)
from app.models.auth import User
from app.models.audit import AuditLog, AuditEventType
from app.services.translation_service import TranslationService
from app.schemas.advisory import AdvisoryGenerateRequest


class AdvisoryEngine:
    """Multi-signal advisory generation orchestrator."""

    @classmethod
    def generate_advisory(
        cls,
        db: Session,
        req: AdvisoryGenerateRequest,
        creator_user: Optional[User] = None,
    ) -> Advisory:
        """Generates an advisory with pre-rendered translations in all supported languages."""
        
        # Follow-up inspection recommended in 48 to 72 hours
        follow_up = datetime.now(timezone.utc) + timedelta(days=2)

        advisory = Advisory(
            id=str(uuid.uuid4()),
            farm_id=req.farm_id,
            zone_id=req.zone_id,
            crop_id=req.crop_id,
            validation_request_id=req.validation_request_id,
            risk_assessment_id=req.risk_assessment_id,
            advisory_type=req.advisory_type,
            priority=req.priority,
            source=req.source,
            trust_level=req.trust_level,
            condition_name=req.condition_name,
            follow_up_date=follow_up,
            is_read=False,
            version="v1.0",
        )
        db.add(advisory)

        # Pre-render translations for all supported languages (en, ta, hi, mr)
        for lang in TranslationService.SUPPORTED_LANGUAGES:
            content = TranslationService.get_localized_content(
                condition_key=req.condition_name,
                target_language=lang,
            )

            # Custom trust level prefix
            trust_prefix = ""
            if req.trust_level == 3:
                if lang == "hi-IN":
                    trust_prefix = "[कृषि विशेषज्ञ द्वारा सत्यापित] "
                elif lang == "mr-IN":
                    trust_prefix = "[कृषी तज्ञांद्वारे पडताळणी पूर्ण] "
                else:
                    trust_prefix = "[Expert Validated] "
            elif req.trust_level == 4:
                if lang == "hi-IN":
                    trust_prefix = "[प्रयोगशाला परिणाम उपलब्ध] "
                elif lang == "mr-IN":
                    trust_prefix = "[प्रयोगशाळा तपासणी अहवाल प्राप्त] "
                else:
                    trust_prefix = "[Lab Confirmed] "

            translation = AdvisoryTranslation(
                id=str(uuid.uuid4()),
                advisory_id=advisory.id,
                language=lang,
                title=f"{trust_prefix}{content['title']}",
                summary=content["summary"],
                why_this_matters=content["why_this_matters"],
                what_to_do_now=content["what_to_do_now"],
                what_to_monitor=content["what_to_monitor"],
                what_to_avoid=content["what_to_avoid"],
                when_to_seek_expert_help=content["when_to_seek_expert_help"],
                safety_warnings=content["safety_warnings"],
                audio_text=content.get("audio_text"),
                technical_breakdown=f"Source: {req.source.value} | Trust Level: {req.trust_level}/4 | Risk Score: {req.risk_score:.2f}",
            )
            db.add(translation)

        # Audit Event
        if creator_user:
            audit = AuditLog(
                id=str(uuid.uuid4()),
                user_id=creator_user.id,
                user_email=creator_user.email,
                event_type=AuditEventType.ADVISORY_GENERATED,
                details={
                    "advisory_id": advisory.id,
                    "farm_id": req.farm_id,
                    "condition": req.condition_name,
                    "trust_level": req.trust_level,
                },
            )
            db.add(audit)

        db.commit()
        db.refresh(advisory)
        return advisory

    @classmethod
    async def list_advisories(
        cls,
        db: AsyncSession,
        current_user: User,
        farm_id: Optional[str] = None,
        language: str = "mr-IN",
        priority: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Lists advisories with active localization matching requested language."""
        from sqlalchemy import select
        
        query = select(Advisory)

        if current_user.role == "FARMER":
            # Avoid lazy-load issues by using a flat list of ids if they were preloaded,
            # or just load them if needed. But assuming `current_user.owned_farms` is available:
            query = query.filter(Advisory.farm_id.in_([f.id for f in current_user.owned_farms]))
        if farm_id:
            query = query.filter(Advisory.farm_id == farm_id)
        if priority:
            query = query.filter(Advisory.priority == priority)

        query = query.order_by(desc(Advisory.created_at)).offset(skip).limit(limit)
        
        # Load joined translations and farm/zone/crop safely
        from sqlalchemy.orm import selectinload
        query = query.options(
            selectinload(Advisory.translations),
            selectinload(Advisory.farm),
            selectinload(Advisory.zone),
            selectinload(Advisory.crop)
        )

        result = await db.execute(query)
        advisories = result.scalars().all()

        results = []
        for adv in advisories:
            # Find translation matching language, fallback to English
            active_trans = next((t for t in adv.translations if t.language == language), None)
            if not active_trans:
                active_trans = next((t for t in adv.translations if t.language == "en-IN"), None)

            results.append({
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
            })

        return results
