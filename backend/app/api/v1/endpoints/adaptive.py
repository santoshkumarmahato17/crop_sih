from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.adaptive import (
    AdaptiveMonitoringRecommendation,
    AdaptivePolicyConfigSchema,
    ScheduleMissionFromRecommendationRequest,
    ScheduleMissionFromRecommendationResponse,
)
from app.services.adaptive_monitoring_service import adaptive_monitoring_service

router = APIRouter(tags=["Risk-Adaptive Monitoring & Drone Surveillance Dispatch"])


@router.get(
    "/farms/{farm_id}/adaptive-monitoring",
    response_model=AdaptiveMonitoringRecommendation,
    status_code=status.HTTP_200_OK,
    summary="Get Dynamic Risk-Adaptive Surveillance Recommendation",
    description="Calculates next recommended monitoring date, priority, target zones, and reasoning based on multi-factor risk.",
)
async def get_adaptive_monitoring_recommendation(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AdaptiveMonitoringRecommendation:
    return await adaptive_monitoring_service.get_recommendation(db=db, farm_id=farm_id)


@router.post(
    "/farms/{farm_id}/adaptive-monitoring/schedule-mission",
    response_model=ScheduleMissionFromRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve & Schedule Recommended Drone Mission",
    description="Converts an adaptive monitoring recommendation into a registered DroneMission in the database.",
)
async def schedule_recommended_mission(
    farm_id: str,
    request: ScheduleMissionFromRecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ScheduleMissionFromRecommendationResponse:
    request.farm_id = farm_id
    return await adaptive_monitoring_service.schedule_recommended_mission(
        db=db, request=request, current_user=current_user
    )


@router.get(
    "/adaptive-monitoring/policy",
    response_model=AdaptivePolicyConfigSchema,
    status_code=status.HTTP_200_OK,
    summary="Get Configurable Surveillance Risk Policy",
    description="Retrieves current interval thresholds for LOW, MEDIUM, HIGH, and CRITICAL risk tiers.",
)
async def get_monitoring_policy(
    current_user: User = Depends(get_current_active_user),
) -> AdaptivePolicyConfigSchema:
    return adaptive_monitoring_service.get_policy()


@router.put(
    "/adaptive-monitoring/policy",
    response_model=AdaptivePolicyConfigSchema,
    status_code=status.HTTP_200_OK,
    summary="Update Configurable Surveillance Risk Policy",
    description="Updates interval thresholds for risk-adaptive surveillance frequency.",
)
async def update_monitoring_policy(
    new_policy: AdaptivePolicyConfigSchema,
    current_user: User = Depends(get_current_active_user),
) -> AdaptivePolicyConfigSchema:
    return adaptive_monitoring_service.update_policy(new_policy)
