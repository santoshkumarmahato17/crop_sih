from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.spread import (
    NeighborsResponse,
    RegionalHotspotsResponse,
    SpreadRiskGraphResponse,
)
from app.services.neighbor_intelligence_service import neighbor_intelligence_service

router = APIRouter(tags=["Neighbor Farm & Spread Risk Intelligence"])


@router.get(
    "/farms/{farm_id}/neighbors",
    response_model=NeighborsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Nearby Neighboring Agricultural Farms",
    description="Identifies neighboring agricultural holdings within search radius with privacy anonymization.",
)
async def get_farm_neighbors(
    farm_id: str,
    radius_km: float = Query(default=15.0, ge=1.0, le=50.0, description="Search radius in kilometers"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> NeighborsResponse:
    return await neighbor_intelligence_service.get_farm_neighbors(
        db=db,
        farm_id=farm_id,
        radius_km=radius_km,
        current_user=current_user,
    )


@router.get(
    "/farms/{farm_id}/spread-risk",
    response_model=SpreadRiskGraphResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Potential Spread Risk from Neighboring Farms",
    description=(
        "Constructs the Farm Risk Graph and calculates directed transmission risk corridors "
        "incorporating distance attenuation, anemometric wind dispersion, and crop compatibility."
    ),
)
async def get_farm_spread_risk(
    farm_id: str,
    wind_direction: float = Query(default=225.0, ge=0.0, le=360.0, description="Wind heading degrees"),
    wind_speed: float = Query(default=18.0, ge=0.0, le=120.0, description="Wind velocity in km/h"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SpreadRiskGraphResponse:
    return await neighbor_intelligence_service.calculate_farm_spread_risk(
        db=db,
        farm_id=farm_id,
        wind_direction_deg=wind_direction,
        wind_speed_kmh=wind_speed,
        current_user=current_user,
    )


@router.get(
    "/regions/hotspots",
    response_model=RegionalHotspotsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Regional Crop Pathology Hotspots & Contagion Clusters",
    description="Returns detected clusters of elevated regional pathology pressure and affected farm densities.",
)
async def get_regional_hotspots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> RegionalHotspotsResponse:
    return await neighbor_intelligence_service.get_regional_hotspots(db=db)
