from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.common import StatusMessage
from app.schemas.farm import (
    FarmCreateRequest,
    FarmListResponse,
    FarmResponse,
    FarmUpdateRequest,
)
from app.services.farm import farm_service

router = APIRouter(prefix="/farms", tags=["Farm Management & Boundaries"])


@router.post(
    "",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Agricultural Farm",
    description=(
        "Registers a new farm holding with geographic boundary polygon. "
        "The system strictly calculates the authoritative surface area in hectares from the boundary geometry."
    ),
)
async def create_farm(
    req: FarmCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmResponse:
    return await farm_service.create_farm(db, req, current_user)


@router.get(
    "",
    response_model=FarmListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Accessible Farms",
    description="Returns a paginated list of farms owned by the authenticated user (or all if administrator).",
)
async def list_farms(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmListResponse:
    return await farm_service.list_farms(db, current_user, skip=skip, limit=limit)


@router.get(
    "/{farm_id}",
    response_model=FarmResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Farm Details",
    description="Returns the full details, GeoJSON boundary, calculated area, and crop cycle of a farm by ID.",
)
async def get_farm(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmResponse:
    return await farm_service.get_farm_details(db, farm_id, current_user)


@router.put(
    "/{farm_id}",
    response_model=FarmResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Farm",
    description="Updates farm metadata or boundary polygon (recalculating authoritative area if boundary changed).",
)
async def update_farm(
    farm_id: str,
    req: FarmUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FarmResponse:
    return await farm_service.update_farm(db, farm_id, req, current_user)


@router.delete(
    "/{farm_id}",
    response_model=StatusMessage,
    status_code=status.HTTP_200_OK,
    summary="Delete Farm",
    description="Deletes a farm holding with ownership verification.",
)
async def delete_farm(
    farm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> StatusMessage:
    await farm_service.delete_farm(db, farm_id, current_user)
    return StatusMessage(
        status="success",
        detail=f"Farm '{farm_id}' deleted successfully.",
    )
