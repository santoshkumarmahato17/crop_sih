from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.zone import ZoneGenerateRequest, ZoneListResponse, ZoneResponse
from app.services.farm_zone import farm_zone_service

router = APIRouter(prefix="/farms/{farm_id}/zones", tags=["Intelligent Farm Zoning"])


@router.post(
    "/generate",
    response_model=ZoneListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Intelligent Monitoring Zones",
    description=(
        "Executes a grid-based spatial zoning algorithm on the farm boundary. "
        "Grid cells are clipped to the exact farm polygon, slivers are eliminated, "
        "and topological monitoring zones (Z01, Z02, ...) are persisted in PostGIS."
    ),
)
async def generate_zones(
    farm_id: str,
    req: ZoneGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneListResponse:
    return await farm_zone_service.generate_zones_for_farm(
        db, farm_id, req, current_user
    )


@router.get(
    "",
    response_model=ZoneListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Farm Monitoring Zones",
    description="Returns all subdivided PostGIS monitoring zones, calculated surface areas, centroids, and health statuses.",
)
async def list_zones(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneListResponse:
    return await farm_zone_service.list_zones_by_farm(db, farm_id, current_user)


@router.get(
    "/{zone_id}",
    response_model=ZoneResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Zone Details",
    description="Retrieves a specific monitoring zone by ID with its spatial boundary and status metrics.",
)
async def get_zone(
    farm_id: str,
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ZoneResponse:
    return await farm_zone_service.get_zone_details(
        db, farm_id, zone_id, current_user
    )
