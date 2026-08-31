from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.temporal import (
    FarmHealthTimelineResponse,
    ZoneHistoryResponse,
    ZoneTrendResponse,
)
from app.services.temporal_analysis import temporal_analysis_service

router = APIRouter(tags=["Temporal Crop Health & Trend Intelligence"])


@router.get(
    "/zones/{zone_id}/history",
    response_model=ZoneHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Zone Multi-Scan Observation History",
    description="Returns chronological sequence of monitoring scan records for a zone with linked disease, pest, and water stress observations.",
)
async def get_zone_history(
    zone_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneHistoryResponse:
    return await temporal_analysis_service.get_zone_history(
        db=db, zone_id=zone_id, limit=limit
    )


@router.get(
    "/zones/{zone_id}/trend",
    response_model=ZoneTrendResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Zone Temporal Trend & Trajectory",
    description=(
        "Compares multi-scan history for a zone and calculates health trend, disease trend, "
        "pest trend, water stress trend, velocity per day, and trend classification (STABLE, IMPROVING, DECLINING, RAPIDLY_DECLINING)."
    ),
)
async def get_zone_trend(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneTrendResponse:
    return await temporal_analysis_service.calculate_zone_trend(
        db=db, zone_id=zone_id
    )


@router.get(
    "/farms/{farm_id}/health-history",
    response_model=FarmHealthTimelineResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Farm-Wide Temporal Health Timeline",
    description="Returns farm-level aggregate health and vegetation trajectory across all monitoring zones.",
)
async def get_farm_health_history(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmHealthTimelineResponse:
    return await temporal_analysis_service.get_farm_health_history(
        db=db, farm_id=farm_id
    )
