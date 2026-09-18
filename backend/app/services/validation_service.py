"""
AGRI SHIELD — Expert Ground-Truth Validation Service.
Manages the complete lifecycle of expert validation requests, case queue,
evidence aggregation, decision processing, and audit logging.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.models.validation import (
    ExpertValidationRequest,
    ExpertValidationRecord as ValidationRecord,
    ValidationRequestStatus,
    ValidationPriority,
)
from app.models.laboratory import (
    LabReferral,
    LabReferralStatus,
)
from app.models.auth import User
from app.models.farm import Farm, FarmZone, Crop
from app.models.audit import AuditLog, AuditEventType
from app.services.validation_policy import ValidationPolicyEngine
from app.schemas.validation import (
    ValidationRequestCreate,
    ValidationDecisionSubmit,
    LabReferralCreate,
)


class ValidationService:
    """Expert ground-truth validation orchestrator."""

    @classmethod
    async def create_request(
        cls,
        db: AsyncSession,
        req_in: ValidationRequestCreate,
        current_user: User,
    ) -> ExpertValidationRequest:
        """Creates a new expert validation request case."""
        policy_eval = ValidationPolicyEngine.evaluate_validation_requirement(
            ai_confidence=req_in.ai_confidence,
            condition_name=req_in.suspected_condition,
            is_farmer_request=(current_user.role == "FARMER"),
            is_officer_request=(current_user.role in ["GOVERNMENT", "ADMIN"]),
        )

        final_priority = req_in.priority
        if policy_eval["priority"].value != "LOW":
            final_priority = policy_eval["priority"]

        val_request = ExpertValidationRequest(
            id=str(uuid.uuid4()),
            analysis_id=req_in.analysis_id,
            farm_id=req_in.farm_id,
            zone_id=req_in.zone_id,
            crop_id=req_in.crop_id,
            requested_by=current_user.id,
            priority=final_priority,
            status=ValidationRequestStatus.PENDING,
            reason=req_in.reason or policy_eval["reason"],
            suspected_condition=req_in.suspected_condition,
            ai_confidence=req_in.ai_confidence,
            crop_growth_stage=req_in.crop_growth_stage,
            symptoms=req_in.symptoms,
            image_urls=req_in.image_urls,
            weather_summary=req_in.weather_summary,
            hotspot_id=req_in.hotspot_id,
            drone_observation_id=req_in.drone_observation_id,
        )

        db.add(val_request)

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            user_email=current_user.email,
            event_type=AuditEventType.VALIDATION_REQUESTED,
            details={
                "case_number": val_request.case_number,
                "farm_id": req_in.farm_id,
                "priority": final_priority.value,
                "condition": req_in.suspected_condition,
            },
        )
        db.add(audit)
        await db.commit()
        await db.refresh(val_request)
        return val_request

    @classmethod
    async def get_request_by_id(cls, db: AsyncSession, request_id: str) -> Optional[ExpertValidationRequest]:
        result = await db.execute(select(ExpertValidationRequest).where(ExpertValidationRequest.id == request_id))
        return result.scalar_one_or_none()

    @classmethod
    async def list_requests(
        cls,
        db: AsyncSession,
        current_user: User,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        farm_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ExpertValidationRequest]:
        """Lists requests filtered by user role and query parameters."""
        stmt = select(ExpertValidationRequest)

        if current_user.role == "FARMER":
            try:
                farms_res = await db.execute(select(Farm.id).where(Farm.owner_id == current_user.id))
                owned_ids = farms_res.scalars().all()
            except Exception:
                owned_ids = []

            if owned_ids:
                stmt = stmt.where(
                    (ExpertValidationRequest.requested_by == current_user.id)
                    | (ExpertValidationRequest.farm_id.in_(owned_ids))
                )
            else:
                stmt = stmt.where(ExpertValidationRequest.requested_by == current_user.id)

        if status:
            stmt = stmt.where(ExpertValidationRequest.status == status)
        if priority:
            stmt = stmt.where(ExpertValidationRequest.priority == priority)
        if farm_id:
            stmt = stmt.where(ExpertValidationRequest.farm_id == farm_id)

        skip_val = int(skip) if not hasattr(skip, "default") else 0
        limit_val = int(limit) if not hasattr(limit, "default") else 50

        stmt = stmt.order_by(desc(ExpertValidationRequest.created_at)).offset(skip_val).limit(limit_val)
        result = await db.execute(stmt)
        return result.scalars().all()

    @classmethod
    async def submit_decision(
        cls,
        db: AsyncSession,
        request_id: str,
        decision_in: ValidationDecisionSubmit,
        expert_user: User,
    ) -> ExpertValidationRequest:
        """Processes an expert ground-truth validation decision."""
        req = await cls.get_request_by_id(db, request_id)
        if not req:
            raise ValueError("Validation request not found")

        record = ValidationRecord(
            id=str(uuid.uuid4()),
            validation_request_id=req.id,
            expert_user_id=expert_user.id,
            status=decision_in.decision,
            confirmed_condition=decision_in.confirmed_condition or req.suspected_condition,
            expert_notes=decision_in.expert_notes,
            farmer_guidance=decision_in.farmer_guidance,
            rejection_reason=decision_in.rejection_reason,
            uncertain_recommendation=decision_in.uncertain_recommendation,
            validated_at=datetime.now(timezone.utc),
        )
        db.add(record)

        req.status = decision_in.decision
        req.completed_at = datetime.now(timezone.utc)
        req.assigned_expert_id = expert_user.id

        audit_type_map = {
            ValidationRequestStatus.CONFIRMED: AuditEventType.VALIDATION_CONFIRMED,
            ValidationRequestStatus.REJECTED: AuditEventType.VALIDATION_REJECTED,
            ValidationRequestStatus.UNCERTAIN: AuditEventType.VALIDATION_UNCERTAIN,
            ValidationRequestStatus.LAB_REFERRAL: AuditEventType.LAB_REFERRAL_CREATED,
            ValidationRequestStatus.REQUEST_MORE_EVIDENCE: AuditEventType.VALIDATION_UNCERTAIN,
        }
        audit_event = audit_type_map.get(decision_in.decision, AuditEventType.VALIDATION_CONFIRMED)

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=expert_user.id,
            user_email=expert_user.email,
            event_type=audit_event,
            details={
                "case_number": req.case_number,
                "decision": decision_in.decision.value,
                "confirmed_condition": decision_in.confirmed_condition,
            },
        )
        db.add(audit)
        await db.commit()
        await db.refresh(req)
        return req

    @classmethod
    async def create_lab_referral(
        cls,
        db: AsyncSession,
        request_id: str,
        referral_in: LabReferralCreate,
        expert_user: User,
    ) -> LabReferral:
        """Creates a laboratory referral testing order."""
        req = await cls.get_request_by_id(db, request_id)
        if not req:
            raise ValueError("Validation request not found")

        lab_ref = LabReferral(
            id=str(uuid.uuid4()),
            validation_request_id=req.id,
            farm_id=req.farm_id,
            zone_id=req.zone_id,
            sample_type=referral_in.sample_type,
            suspected_condition=referral_in.suspected_condition,
            reason=referral_in.reason,
            status=LabReferralStatus.REQUESTED,
        )
        db.add(lab_ref)

        req.status = ValidationRequestStatus.LAB_REFERRAL
        await db.commit()
        await db.refresh(lab_ref)
        return lab_ref

    @classmethod
    async def get_statistics(cls, db: AsyncSession, current_user: User) -> Dict[str, int]:
        """Calculates queue metrics for dashboard."""
        base_stmt = select(func.count(ExpertValidationRequest.id))
        if current_user.role == "FARMER":
            base_stmt = base_stmt.where(ExpertValidationRequest.requested_by == current_user.id)

        res_pending = await db.execute(base_stmt.where(ExpertValidationRequest.status == ValidationRequestStatus.PENDING))
        total_pending = res_pending.scalar() or 0

        res_high = await db.execute(
            base_stmt.where(
                ExpertValidationRequest.priority == ValidationPriority.HIGH,
                ExpertValidationRequest.status.in_([ValidationRequestStatus.PENDING, ValidationRequestStatus.UNDER_REVIEW]),
            )
        )
        high_priority = res_high.scalar() or 0

        res_critical = await db.execute(
            base_stmt.where(
                ExpertValidationRequest.priority == ValidationPriority.CRITICAL,
                ExpertValidationRequest.status.in_([ValidationRequestStatus.PENDING, ValidationRequestStatus.UNDER_REVIEW]),
            )
        )
        critical = res_critical.scalar() or 0

        res_my = await db.execute(base_stmt.where(ExpertValidationRequest.assigned_expert_id == current_user.id))
        my_assigned = res_my.scalar() or 0

        res_recent = await db.execute(
            base_stmt.where(
                ExpertValidationRequest.status.in_([ValidationRequestStatus.CONFIRMED, ValidationRequestStatus.REJECTED])
            )
        )
        recently_validated = res_recent.scalar() or 0

        res_lab = await db.execute(select(func.count(LabReferral.id)))
        lab_referrals = res_lab.scalar() or 0

        return {
            "total_pending": total_pending,
            "high_priority": high_priority,
            "critical": critical,
            "my_assigned": my_assigned,
            "recently_validated": recently_validated,
            "lab_referrals": lab_referrals,
        }
