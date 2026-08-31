from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.risk import FarmRiskSummaryResponse, ZoneRiskResponse
from app.services.risk_engine_service import risk_engine_service

router = APIRouter(tags=["Crop Health Risk Engine"])


@router.post(
    "/farms/{farm_id}/risk/evaluate",
    response_model=FarmRiskSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Explainable Crop Health Risk across Farm Zones",
    description=(
        "Executes multi-factor agronomic risk evaluation combining drone observations, "
        "temporal trajectories, weather parameters, growth stages, and regional disease vectors. "
        "Updates zone map risk tiers and persists explainable assessments in PostGIS."
    ),
)
async def evaluate_farm_risk(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmRiskSummaryResponse:
    return await risk_engine_service.evaluate_farm_risk(db=db, farm_id=farm_id)


@router.get(
    "/zones/{zone_id}/risk",
    response_model=ZoneRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Zone Explainable Risk Assessment Breakdown",
    description="Returns detailed point attribution and explainable contributing factors for a specific zone.",
)
async def get_zone_risk(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneRiskResponse:
    return await risk_engine_service.get_zone_risk(db=db, zone_id=zone_id)


@router.get(
    "/farms/{farm_id}/risk-summary",
    response_model=FarmRiskSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Farm Risk Summary & Zone Risk Matrix",
    description="Retrieves latest risk status and threat breakdown across all monitoring zones of a farm.",
)
async def get_farm_risk_summary(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmRiskSummaryResponse:
    return await risk_engine_service.evaluate_farm_risk(db=db, farm_id=farm_id)
