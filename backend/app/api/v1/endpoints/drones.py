from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.drone import (
    DroneCreateRequest,
    DroneListResponse,
    DroneMissionCreateRequest,
    DroneMissionListResponse,
    DroneMissionResponse,
    DroneResponse,
)
from app.services.drone import drone_mission_service, drone_service

router = APIRouter(tags=["Drone Fleet & Mission Management"])


# ==============================================================================
# 1. Drone Fleet Management Endpoints
# ==============================================================================

@router.post(
    "/drones",
    response_model=DroneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Drone Airframe",
    description="Registers an unmanned aerial vehicle (UAV) in the operational fleet.",
)
async def register_drone(
    req: DroneCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneResponse:
    return await drone_service.register_drone(db, req)


@router.get(
    "/drones",
    response_model=DroneListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Drone Fleet",
    description="Returns all registered drone airframes with battery and operational status.",
)
async def list_drones(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneListResponse:
    return await drone_service.list_drones(db, skip=skip, limit=limit)


# ==============================================================================
# 2. Drone Mission Management Endpoints
# ==============================================================================

@router.post(
    "/drone-missions",
    response_model=DroneMissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule Drone Survey Mission",
    description="Schedules a monitoring flight mission over selected farm target zones.",
)
async def schedule_mission(
    req: DroneMissionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneMissionResponse:
    return await drone_mission_service.schedule_mission(db, req, current_user)


@router.get(
    "/drone-missions",
    response_model=DroneMissionListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Drone Missions",
    description="Returns survey flight missions filtered by farm.",
)
async def list_missions(
    farm_id: Optional[str] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneMissionListResponse:
    return await drone_mission_service.list_missions(
        db, farm_id=farm_id, skip=skip, limit=limit
    )


@router.get(
    "/drone-missions/{mission_id}",
    response_model=DroneMissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Mission Details",
    description="Retrieves telemetry, flight boundary corridor, and status of a drone mission.",
)
async def get_mission(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneMissionResponse:
    return await drone_mission_service.get_mission_details(db, mission_id)


@router.post(
    "/drone-missions/{mission_id}/start",
    response_model=DroneMissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Start Drone Mission (Simulation)",
    description="Triggers mock drone takeoff and begins survey scanning.",
)
async def start_mission(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneMissionResponse:
    return await drone_mission_service.start_mission(db, mission_id)


@router.post(
    "/drone-missions/{mission_id}/complete",
    response_model=DroneMissionResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete Drone Mission (Simulation)",
    description="Concludes mock flight mission and registers 100% boundary coverage.",
)
async def complete_mission(
    mission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneMissionResponse:
    return await drone_mission_service.complete_mission(db, mission_id)
