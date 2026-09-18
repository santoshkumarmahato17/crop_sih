import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from geoalchemy2.shape import to_shape
from shapely.geometry import MultiPolygon, Polygon
from shapely.ops import unary_union
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import User
from app.models.drone import Drone, DroneMission, DroneStatus, MissionStatus
from app.models.farm import Farm, FarmZone
from app.providers.drone.mock import mock_drone_provider
from app.repositories.drone import (
    DroneMissionRepository,
    DroneRepository,
    drone_mission_repo,
    drone_repo,
)
from app.repositories.farm import farm_repo
from app.schemas.drone import (
    DroneCreateRequest,
    DroneListResponse,
    DroneMissionCreateRequest,
    DroneMissionListResponse,
    DroneMissionResponse,
    DroneResponse,
)
from app.spatial.geometry import (
    geometry_to_geojson_dict,
    shapely_to_wkt_element,
    validate_and_sanitize_boundary,
)


class DroneService:
    """Service managing drone hardware fleet."""

    def __init__(self, repository: DroneRepository = drone_repo):
        self.repo = repository

    def _to_drone_response(self, drone: Drone) -> DroneResponse:
        return DroneResponse(
            id=drone.id,
            name=drone.name,
            serial_number=drone.serial_number,
            manufacturer=drone.manufacturer,
            model_name=drone.model_name,
            camera_type=drone.camera_type,
            sensor_capabilities=drone.sensor_capabilities or ["RGB", "NIR"],
            battery_percentage=drone.battery_percentage,
            battery_cycle_count=drone.battery_cycle_count,
            operational_status=drone.operational_status,
            status=str(drone.status.value if hasattr(drone.status, "value") else drone.status),
            created_at=drone.created_at,
        )

    async def register_drone(
        self, db: AsyncSession, req: DroneCreateRequest
    ) -> DroneResponse:
        """Registers a new drone hardware airframe in the fleet."""
        existing = await self.repo.get_by_serial(db, req.serial_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Drone with serial number '{req.serial_number}' is already registered.",
            )

        drone = Drone(
            id=str(uuid.uuid4()),
            name=req.name.strip(),
            serial_number=req.serial_number.strip(),
            manufacturer=req.manufacturer.strip(),
            model_name=req.model_name.strip(),
            camera_type=req.camera_type.strip(),
            sensor_capabilities=req.sensor_capabilities or ["RGB", "NIR"],
            battery_percentage=req.battery_percentage,
            operational_status=req.operational_status.upper(),
            status=DroneStatus.IDLE,
        )
        db.add(drone)
        await db.commit()
        await db.refresh(drone)
        return self._to_drone_response(drone)

    async def list_drones(
        self, db: AsyncSession, skip: int = 0, limit: int = 50
    ) -> DroneListResponse:
        """Lists all registered drone units."""
        drones = await self.repo.list_all(db, skip=skip, limit=limit)
        return DroneListResponse(
            drones=[self._to_drone_response(d) for d in drones],
            total=len(drones),
        )


class DroneMissionService:
    """Service managing autonomous survey missions and MockDroneProvider simulation."""

    def __init__(
        self,
        mission_repo: DroneMissionRepository = drone_mission_repo,
        drone_repository: DroneRepository = drone_repo,
    ):
        self.repo = mission_repo
        self.drone_repo = drone_repository

    def _to_mission_response(self, mission: DroneMission) -> DroneMissionResponse:
        return DroneMissionResponse(
            id=mission.id,
            farm_id=mission.farm_id,
            farm_name=mission.farm.name if mission.farm else None,
            drone_id=mission.drone_id,
            drone_name=mission.drone.name if mission.drone else None,
            flight_boundary=geometry_to_geojson_dict(mission.flight_boundary),
            target_zones=mission.target_zones or [],
            mission_date=mission.mission_date,
            start_time=mission.start_time,
            end_time=mission.end_time,
            altitude_meters=mission.altitude_meters,
            flight_speed_mps=mission.flight_speed_mps,
            overlap_percentage=mission.overlap_percentage,
            coverage_percentage=mission.coverage_percentage,
            priority=mission.priority,
            status=str(mission.status.value if hasattr(mission.status, "value") else mission.status),
            created_at=mission.created_at,
        )

    async def schedule_mission(
        self, db: AsyncSession, req: DroneMissionCreateRequest, current_user: User
    ) -> DroneMissionResponse:
        """Schedules a new survey flight mission over selected target zones."""
        # 1. Verify Farm
        farm = await farm_repo.get_by_id_with_relations(db, req.farm_id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm '{req.farm_id}' not found.",
            )

        # 2. Derive Flight Boundary
        flight_shapely = None
        if req.flight_boundary:
            is_valid, msg, geom = validate_and_sanitize_boundary(req.flight_boundary)
            if is_valid and geom:
                flight_shapely = geom

        if not flight_shapely:
            if req.target_zones and len(req.target_zones) > 0:
                # Query specific target zones to merge flight polygon
                result = await db.execute(
                    select(FarmZone).where(
                        FarmZone.farm_id == farm.id,
                        FarmZone.id.in_(req.target_zones) | FarmZone.zone_code.in_(req.target_zones),
                    )
                )
                zones = list(result.scalars().all())
                if zones:
                    zone_geoms = [to_shape(z.boundary) for z in zones if z.boundary]
                    merged = unary_union(zone_geoms)
                    if isinstance(merged, (Polygon, MultiPolygon)):
                        flight_shapely = merged if isinstance(merged, Polygon) else merged.geoms[0]

            if not flight_shapely and farm.boundary:
                # Fallback to entire farm boundary
                farm_geom = to_shape(farm.boundary)
                flight_shapely = farm_geom if isinstance(farm_geom, Polygon) else farm_geom.geoms[0]

        if not flight_shapely:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not establish a valid spatial flight corridor for this mission.",
            )

        # Ensure flight boundary is convex hull / polygon
        if not isinstance(flight_shapely, Polygon):
            flight_shapely = flight_shapely.convex_hull

        postgis_flight_boundary = shapely_to_wkt_element(flight_shapely, srid=4326)

        # Real weather priority boost
        priority = req.priority.upper()
        try:
            from app.weather.providers.service import get_current_weather
            from app.weather.providers.base import DataQuality
            lat, lon = 20.0, 73.78  # fallback
            cw = await get_current_weather(lat, lon)
            if cw and cw.data_quality in (DataQuality.GOOD, DataQuality.STALE):
                if cw.rainfall_mm and cw.rainfall_mm > 5.0:
                    priority = "CRITICAL"  # Post-rain damage assessment
                elif cw.wind_speed_kmh and cw.wind_speed_kmh > 20.0:
                    priority = "HIGH"      # Needs attention when wind calms
        except Exception:
            pass

        mission = DroneMission(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            drone_id=req.drone_id,
            operator_id=current_user.id,
            flight_boundary=postgis_flight_boundary,
            mission_date=req.mission_date,
            altitude_meters=req.altitude_meters,
            flight_speed_mps=req.flight_speed_mps,
            overlap_percentage=req.overlap_percentage,
            coverage_percentage=0.0,
            priority=priority,
            target_zones=req.target_zones or [],
            status=MissionStatus.SCHEDULED,
        )
        db.add(mission)
        await db.commit()

        # Notify Mock Provider
        await mock_drone_provider.schedule_mission(
            mission_id=mission.id,
            flight_boundary=geometry_to_geojson_dict(mission.flight_boundary) or {},
            altitude_meters=mission.altitude_meters,
            speed_mps=mission.flight_speed_mps,
        )

        saved = await self.repo.get_by_id_with_relations(db, mission.id)
        assert saved is not None
        return self._to_mission_response(saved)

    async def list_missions(
        self,
        db: AsyncSession,
        farm_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> DroneMissionListResponse:
        """Lists survey flight missions."""
        missions = await self.repo.list_by_farm_or_all(
            db, farm_id=farm_id, skip=skip, limit=limit
        )
        return DroneMissionListResponse(
            missions=[self._to_mission_response(m) for m in missions],
            total=len(missions),
        )

    async def get_mission_details(
        self, db: AsyncSession, mission_id: str
    ) -> DroneMissionResponse:
        """Retrieves details of a specific flight mission."""
        mission = await self.repo.get_by_id_with_relations(db, mission_id)
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Drone Mission '{mission_id}' not found.",
            )
        return self._to_mission_response(mission)

    async def start_mission(
        self, db: AsyncSession, mission_id: str
    ) -> DroneMissionResponse:
        """Simulates mission takeoff and sets status to IN_PROGRESS."""
        mission = await self.repo.get_by_id_with_relations(db, mission_id)
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission '{mission_id}' not found.",
            )

        mission.status = MissionStatus.IN_PROGRESS
        mission.start_time = datetime.now(timezone.utc)
        mission.coverage_percentage = 25.0

        if mission.drone:
            mission.drone.operational_status = "IN_MISSION"
            mission.drone.status = DroneStatus.IN_MISSION

        await mock_drone_provider.start_mission(mission.id)
        await db.commit()
        await db.refresh(mission)
        return self._to_mission_response(mission)

    async def complete_mission(
        self, db: AsyncSession, mission_id: str
    ) -> DroneMissionResponse:
        """Simulates mission conclusion and sets status to COMPLETED."""
        mission = await self.repo.get_by_id_with_relations(db, mission_id)
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission '{mission_id}' not found.",
            )

        mission.status = MissionStatus.COMPLETED
        mission.end_time = datetime.now(timezone.utc)
        mission.coverage_percentage = 100.0

        if mission.drone:
            mission.drone.operational_status = "AVAILABLE"
            mission.drone.status = DroneStatus.IDLE
            mission.drone.battery_cycle_count += 1
            mission.drone.battery_percentage = max(20.0, mission.drone.battery_percentage - 25.0)

        await mock_drone_provider.complete_mission(mission.id)
        await db.commit()
        await db.refresh(mission)
        return self._to_mission_response(mission)


drone_service = DroneService()
drone_mission_service = DroneMissionService()
