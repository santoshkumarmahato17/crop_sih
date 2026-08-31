import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from geoalchemy2.shape import to_shape
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auth import User
from app.models.farm import CropCycle, CropCycleStatus, Farm, FarmZone
from app.repositories.farm import FarmRepository, farm_repo
from app.schemas.zone import ZoneGenerateRequest, ZoneListResponse, ZoneResponse
from app.spatial.geometry import (
    extract_centroid,
    geometry_to_geojson_dict,
    shapely_to_wkt_element,
)
from app.spatial.zoning import generate_farm_grid_zones


class FarmZoneService:
    """Service orchestrating intelligent spatial zoning algorithms and zone lifecycle."""

    def __init__(self, repository: FarmRepository = farm_repo):
        self.repo = repository

    def _to_zone_response(self, zone: FarmZone) -> ZoneResponse:
        """Serializes FarmZone ORM entity with GeoJSON geometries and centroid."""
        boundary_geojson = geometry_to_geojson_dict(zone.boundary)
        
        # Calculate centroid GeoJSON Point
        centroid_geojson = None
        if zone.boundary is not None:
            try:
                shapely_geom = to_shape(zone.boundary)
                lng, lat = extract_centroid(shapely_geom)
                centroid_geojson = {"type": "Point", "coordinates": [lng, lat]}
            except Exception:
                pass

        return ZoneResponse(
            id=zone.id,
            farm_id=zone.farm_id,
            zone_code=zone.zone_code,
            name=zone.name,
            crop_cycle_id=zone.crop_cycle_id,
            boundary=boundary_geojson,
            centroid=centroid_geojson,
            area_hectares=zone.area_hectares,
            monitoring_status=zone.monitoring_status,
            health_status=zone.health_status,
            risk_status=zone.risk_status,
            is_active=zone.is_active,
            created_at=zone.created_at,
        )

    async def _verify_access(self, db: AsyncSession, farm_id: str, current_user: User) -> Farm:
        """Verifies farm existence and enforces anti-IDOR ownership barrier."""
        farm = await self.repo.get_by_id_with_relations(db, farm_id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with ID '{farm_id}' was not found.",
            )

        user_role = current_user.role.name.upper() if current_user.role else "FARMER"
        if not current_user.is_superuser and user_role not in ["SYSTEM_ADMIN", "AGRICULTURE_ADMIN"]:
            if farm.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: You cannot manage zones on another farmer's holdings.",
                )
        return farm

    async def generate_zones_for_farm(
        self,
        db: AsyncSession,
        farm_id: str,
        req: ZoneGenerateRequest,
        current_user: User,
    ) -> ZoneListResponse:
        """
        Executes grid-based intelligent zoning algorithm on the farm boundary.
        Clips grid cells to the exact boundary, removes slivers, and persists PostGIS zones.
        """
        farm = await self._verify_access(db, farm_id, current_user)

        if not farm.boundary:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Farm does not have a valid spatial boundary geometry.",
            )

        # Convert GeoAlchemy2 PostGIS boundary to Shapely geometry
        try:
            shapely_farm_geom = to_shape(farm.boundary)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to decode farm spatial boundary: {str(e)}",
            )

        # Run intelligent grid zoning algorithm
        target_count = req.target_zone_count or 4
        generated_data = generate_farm_grid_zones(
            shapely_farm_geom,
            target_zone_count=target_count,
            grid_size_meters=req.grid_size_meters,
        )

        if not generated_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not generate monitoring zones from the provided farm boundary.",
            )

        # Find active crop cycle if requested
        active_crop_cycle_id = None
        if req.link_active_crop and farm.crop_cycles:
            active_cycle = next(
                (c for c in farm.crop_cycles if c.status == CropCycleStatus.ACTIVE),
                farm.crop_cycles[0] if farm.crop_cycles else None,
            )
            if active_cycle:
                active_crop_cycle_id = active_cycle.id

        # Delete existing zones for this farm to replace with new layout
        await db.execute(delete(FarmZone).where(FarmZone.farm_id == farm.id))
        await db.flush()

        # Insert newly generated zones
        created_zones: List[FarmZone] = []
        for item in generated_data:
            zone_obj = FarmZone(
                id=str(uuid.uuid4()),
                farm_id=farm.id,
                crop_cycle_id=active_crop_cycle_id,
                zone_code=item["zone_code"],
                name=item["name"],
                boundary=item["wkt_element"],
                area_hectares=item["area_hectares"],
                monitoring_status=item["monitoring_status"],
                health_status=item["health_status"],
                risk_status=item["risk_status"],
                is_active=True,
            )
            db.add(zone_obj)
            created_zones.append(zone_obj)

        await db.commit()

        # Re-fetch created zones
        result = await db.execute(
            select(FarmZone)
            .where(FarmZone.farm_id == farm.id)
            .order_by(FarmZone.zone_code.asc())
        )
        saved_zones = list(result.scalars().all())

        total_area = sum(z.area_hectares for z in saved_zones)

        return ZoneListResponse(
            farm_id=farm.id,
            farm_name=farm.name,
            total=len(saved_zones),
            total_area_hectares=round(total_area, 2),
            zones=[self._to_zone_response(z) for z in saved_zones],
        )

    async def list_zones_by_farm(
        self, db: AsyncSession, farm_id: str, current_user: User
    ) -> ZoneListResponse:
        """Retrieves all monitoring zones for a given farm."""
        farm = await self._verify_access(db, farm_id, current_user)

        result = await db.execute(
            select(FarmZone)
            .where(FarmZone.farm_id == farm.id)
            .order_by(FarmZone.zone_code.asc())
        )
        zones = list(result.scalars().all())

        total_area = sum(z.area_hectares for z in zones)

        return ZoneListResponse(
            farm_id=farm.id,
            farm_name=farm.name,
            total=len(zones),
            total_area_hectares=round(total_area, 2),
            zones=[self._to_zone_response(z) for z in zones],
        )

    async def get_zone_details(
        self, db: AsyncSession, farm_id: str, zone_id: str, current_user: User
    ) -> ZoneResponse:
        """Retrieves details of a specific monitoring zone."""
        await self._verify_access(db, farm_id, current_user)

        result = await db.execute(
            select(FarmZone)
            .where(FarmZone.farm_id == farm_id, FarmZone.id == zone_id)
        )
        zone = result.scalars().first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Monitoring Zone with ID '{zone_id}' not found on this farm.",
            )

        return self._to_zone_response(zone)


farm_zone_service = FarmZoneService()
