from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.farm import Crop, CropCycle, Farm, FarmZone
from app.repositories.base import BaseRepository


class FarmRepository(BaseRepository[Farm]):
    """Data access repository for agricultural farms."""

    def __init__(self):
        super().__init__(Farm)

    async def get_by_id_with_relations(
        self, db: AsyncSession, farm_id: str
    ) -> Optional[Farm]:
        """Fetch farm by ID with owner, zones, and crop cycles preloaded."""
        result = await db.execute(
            select(Farm)
            .options(
                selectinload(Farm.owner),
                selectinload(Farm.zones),
                selectinload(Farm.crop_cycles).selectinload(CropCycle.crop),
            )
            .where(Farm.id == farm_id)
        )
        return result.scalars().first()

    async def list_by_owner(
        self,
        db: AsyncSession,
        owner_id: Optional[str] = None,
        is_admin: bool = False,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Farm]:
        """Fetch farms filtered by owner (or all if admin)."""
        query = (
            select(Farm)
            .options(
                selectinload(Farm.owner),
                selectinload(Farm.zones),
                selectinload(Farm.crop_cycles).selectinload(CropCycle.crop),
            )
            .order_by(Farm.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if not is_admin and owner_id:
            query = query.where(Farm.owner_id == owner_id)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_stats_by_owner(
        self,
        db: AsyncSession,
        owner_id: Optional[str] = None,
        is_admin: bool = False,
    ) -> Tuple[int, float]:
        """Returns (total_farms, total_hectares)."""
        query = select(
            func.count(Farm.id),
            func.coalesce(func.sum(Farm.total_area_hectares), 0.0),
        )
        if not is_admin and owner_id:
            query = query.where(Farm.owner_id == owner_id)

        result = await db.execute(query)
        row = result.first()
        if row:
            return (int(row[0]), round(float(row[1]), 2))
        return (0, 0.0)


farm_repo = FarmRepository()
