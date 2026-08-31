from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.water_stress import (
    FarmWaterRequirementResponse,
    ZoneWaterStressRecord,
)
from app.services.water_stress_service import water_stress_service

router = APIRouter(tags=["Precision Water-Stress & Irrigation Analytics"])


@router.get(
    "/farms/{farm_id}/water-stress",
    response_model=FarmWaterRequirementResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Farm-Wide Water Requirement Map & Prioritization",
    description="Returns precision water stress status, CWSI index, and irrigation priorities across all subdivided zones.",
)
async def get_farm_water_stress(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmWaterRequirementResponse:
    return await water_stress_service.get_farm_water_stress(db=db, farm_id=farm_id)


@router.get(
    "/zones/{zone_id}/water-stress",
    response_model=ZoneWaterStressRecord,
    status_code=status.HTTP_200_OK,
    summary="Get Zonal Precision Water Stress & Decision Support",
    description="Retrieves CWSI index, thermal delta, soil moisture, and decision support guidance for a specific zone.",
)
async def get_zone_water_stress(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneWaterStressRecord:
    return await water_stress_service.evaluate_zone_water_stress(db=db, zone_id=zone_id)


@router.post(
    "/farms/{farm_id}/water-stress/evaluate",
    response_model=FarmWaterRequirementResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Farm-Wide Precision Water Stress Evaluation",
    description="Re-evaluates water stress and irrigation priorities across all zones and updates PostGIS observations.",
)
async def evaluate_farm_water_stress(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmWaterRequirementResponse:
    return await water_stress_service.get_farm_water_stress(db=db, farm_id=farm_id)
