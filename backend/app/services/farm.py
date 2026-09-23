import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from geoalchemy2.elements import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import KisanSathiException, SpatialValidationError
from app.models.auth import User
from app.models.farm import Crop, CropCycle, CropCycleStatus, Farm
from app.repositories.farm import FarmRepository, farm_repo
from app.schemas.farm import (
    CropCycleResponse,
    FarmCreateRequest,
    FarmListResponse,
    FarmResponse,
    FarmUpdateRequest,
)
from app.spatial.geometry import (
    calculate_geodesic_area_hectares,
    extract_centroid,
    geometry_to_geojson_dict,
    shapely_to_wkt_element,
    validate_and_sanitize_boundary,
)


def _get_user_role_str(user: User) -> str:
    if not user or not user.role:
        return "FARMER"
    if hasattr(user.role, "name"):
        return str(user.role.name).upper()
    if hasattr(user.role, "value"):
        return str(user.role.value).upper()
    return str(user.role).upper()


class FarmService:
    """Business logic for farm registration, spatial boundary management, and crop cycles."""

    def __init__(self, repository: FarmRepository = farm_repo):
        self.repo = repository

    def _to_farm_response(self, farm: Farm) -> FarmResponse:
        """Helper to serialize a Farm ORM model with GeoJSON boundaries."""
        active_crop_resp = None
        if farm.crop_cycles:
            # Find most recent active cycle
            active_cycle = next(
                (c for c in farm.crop_cycles if c.status == CropCycleStatus.ACTIVE),
                farm.crop_cycles[0],
            )
            if active_cycle and active_cycle.crop:
                active_crop_resp = CropCycleResponse(
                    id=active_cycle.id,
                    crop_name=active_cycle.crop.common_name,
                    scientific_name=active_cycle.crop.scientific_name,
                    variety=active_cycle.crop.variety,
                    planting_date=active_cycle.planting_date,
                    expected_harvest_date=active_cycle.expected_harvest_date,
                    status=str(active_cycle.status.value if hasattr(active_cycle.status, "value") else active_cycle.status),
                    target_yield=active_cycle.target_yield_tonnes_per_hectare,
                )

        return FarmResponse(
            id=farm.id,
            name=farm.name,
            description=farm.description,
            owner_id=farm.owner_id,
            owner_name=farm.owner.full_name if farm.owner else None,
            boundary=geometry_to_geojson_dict(farm.boundary),
            center_point=geometry_to_geojson_dict(farm.center_point),
            total_area_hectares=farm.total_area_hectares,
            soil_type=farm.soil_type,
            address=farm.address,
            city=farm.city,
            region=farm.region,
            country=farm.country,
            is_active=farm.is_active,
            created_at=farm.created_at,
            active_crop=active_crop_resp,
            zones_count=len(farm.zones) if farm.zones else 0,
        )

    async def create_farm(
        self, db: AsyncSession, req: FarmCreateRequest, current_user: User
    ) -> FarmResponse:
        """
        Creates a new agricultural farm.
        Validates spatial boundary, strictly computes authoritative area from polygon geometry,
        and provisions active crop cycle.
        """
        # 1. Validate Spatial Boundary
        is_valid, err_msg, shapely_geom = validate_and_sanitize_boundary(req.boundary)
        if not is_valid or shapely_geom is None:
            raise SpatialValidationError(message=err_msg)

        # 2. Authoritative Area & Centroid Computation
        calculated_area_ha = calculate_geodesic_area_hectares(shapely_geom)
        center_lng, center_lat = extract_centroid(shapely_geom)

        postgis_boundary = shapely_to_wkt_element(shapely_geom, srid=4326)
        postgis_center = WKTElement(f"POINT({center_lng} {center_lat})", srid=4326)

        # 3. Create Farm Entity
        farm = Farm(
            id=str(uuid.uuid4()),
            name=req.name.strip(),
            description=req.description.strip() if req.description else None,
            owner_id=current_user.id,
            boundary=postgis_boundary,
            center_point=postgis_center,
            total_area_hectares=calculated_area_ha, # Authoritative calculated value
            soil_type=req.soil_type,
            address=req.address,
            city=req.city,
            region=req.region,
            country=req.country or "India",
            is_active=True,
        )
        db.add(farm)
        await db.flush()

        # 4. Create Crop & Active Crop Cycle if provided
        if req.crop_info:
            crop_name = req.crop_info.common_name.strip()
            crop = Crop(
                id=str(uuid.uuid4()),
                common_name=crop_name,
                scientific_name=req.crop_info.scientific_name or f"{crop_name} spp.",
                variety=req.crop_info.variety,
                typical_growing_days=120,
            )
            db.add(crop)
            await db.flush()

            cycle = CropCycle(
                id=str(uuid.uuid4()),
                farm_id=farm.id,
                crop_id=crop.id,
                planting_date=req.crop_info.planting_date,
                expected_harvest_date=req.crop_info.expected_harvest_date,
                status=CropCycleStatus.ACTIVE,
                target_yield_tonnes_per_hectare=req.crop_info.target_yield_tonnes_per_hectare,
            )
            db.add(cycle)

        await db.commit()

        # Re-fetch with preloaded relations
        created_farm = await self.repo.get_by_id_with_relations(db, farm.id)
        assert created_farm is not None
        return self._to_farm_response(created_farm)

    async def list_farms(
        self, db: AsyncSession, current_user: User, skip: int = 0, limit: int = 50
    ) -> FarmListResponse:
        """Lists farms accessible to the current user."""
        user_role = _get_user_role_str(current_user)
        is_admin = current_user.is_superuser or user_role in ["SYSTEM_ADMIN", "AGRICULTURE_ADMIN", "ADMIN"]

        farms = await self.repo.list_by_owner(
            db, owner_id=current_user.id, is_admin=is_admin, skip=skip, limit=limit
        )
        total_count, total_ha = await self.repo.get_stats_by_owner(
            db, owner_id=current_user.id, is_admin=is_admin
        )

        return FarmListResponse(
            farms=[self._to_farm_response(f) for f in farms],
            total=total_count,
            total_hectares=total_ha,
        )

    async def get_farm_details(
        self, db: AsyncSession, farm_id: str, current_user: User
    ) -> FarmResponse:
        """Retrieves farm details with ownership check."""
        farm = await self.repo.get_by_id_with_relations(db, farm_id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with ID '{farm_id}' was not found.",
            )

        # Ownership barrier
        user_role = _get_user_role_str(current_user)
        if not current_user.is_superuser and user_role not in ["SYSTEM_ADMIN", "AGRICULTURE_ADMIN"]:
            if farm.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: You are not the authorized owner of this farm.",
                )

        return self._to_farm_response(farm)

    async def update_farm(
        self,
        db: AsyncSession,
        farm_id: str,
        req: FarmUpdateRequest,
        current_user: User,
    ) -> FarmResponse:
        """Updates farm metadata or spatial boundary."""
        farm = await self.repo.get_by_id_with_relations(db, farm_id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with ID '{farm_id}' was not found.",
            )

        # Ownership barrier
        user_role = _get_user_role_str(current_user)
        if not current_user.is_superuser and user_role not in ["SYSTEM_ADMIN", "AGRICULTURE_ADMIN"]:
            if farm.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: You cannot modify another farmer's holdings.",
                )

        # Update metadata fields if provided
        if req.name is not None:
            farm.name = req.name.strip()
        if req.description is not None:
            farm.description = req.description.strip()
        if req.address is not None:
            farm.address = req.address
        if req.city is not None:
            farm.city = req.city
        if req.region is not None:
            farm.region = req.region
        if req.country is not None:
            farm.country = req.country
        if req.soil_type is not None:
            farm.soil_type = req.soil_type
        if req.is_active is not None:
            farm.is_active = req.is_active

        # Recalculate boundary if updated
        if req.boundary is not None:
            is_valid, err_msg, shapely_geom = validate_and_sanitize_boundary(req.boundary)
            if not is_valid or shapely_geom is None:
                raise SpatialValidationError(message=err_msg)

            farm.total_area_hectares = calculate_geodesic_area_hectares(shapely_geom)
            center_lng, center_lat = extract_centroid(shapely_geom)
            farm.boundary = shapely_to_wkt_element(shapely_geom, srid=4326)
            farm.center_point = WKTElement(f"POINT({center_lng} {center_lat})", srid=4326)

        await db.commit()
        await db.refresh(farm)
        return self._to_farm_response(farm)

    async def delete_farm(
        self, db: AsyncSession, farm_id: str, current_user: User
    ) -> None:
        """Deletes a farm holding with ownership verification."""
        farm = await self.repo.get(db, farm_id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with ID '{farm_id}' was not found.",
            )

        # Ownership barrier
        user_role = _get_user_role_str(current_user)
        if not current_user.is_superuser and user_role not in ["SYSTEM_ADMIN"]:
            if farm.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: You cannot delete another farmer's holdings.",
                )

        await db.delete(farm)
        await db.commit()


farm_service = FarmService()
