from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.drone import Drone, DroneMission
from app.repositories.base import BaseRepository


class DroneRepository(BaseRepository[Drone]):
    """Data access repository for drone hardware airframes."""

    def __init__(self):
        super().__init__(Drone)

    async def list_all(
        self, db: AsyncSession, skip: int = 0, limit: int = 50
    ) -> List[Drone]:
        """Fetch all registered drone units."""
        result = await db.execute(
            select(Drone).order_by(Drone.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_serial(
        self, db: AsyncSession, serial_number: str
    ) -> Optional[Drone]:
        """Fetch drone by hardware serial number."""
        result = await db.execute(
            select(Drone).where(Drone.serial_number == serial_number.strip())
        )
        return result.scalars().first()


class DroneMissionRepository(BaseRepository[DroneMission]):
    """Data access repository for drone survey missions."""

    def __init__(self):
        super().__init__(DroneMission)

    async def get_by_id_with_relations(
        self, db: AsyncSession, mission_id: str
    ) -> Optional[DroneMission]:
        """Fetch mission with farm and drone relations preloaded."""
        result = await db.execute(
            select(DroneMission)
            .options(
                selectinload(DroneMission.farm),
                selectinload(DroneMission.drone),
            )
            .where(DroneMission.id == mission_id)
        )
        return result.scalars().first()

    async def list_by_farm_or_all(
        self,
        db: AsyncSession,
        farm_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[DroneMission]:
        """Fetch missions filtered by farm (or all)."""
        query = (
            select(DroneMission)
            .options(
                selectinload(DroneMission.farm),
                selectinload(DroneMission.drone),
            )
            .order_by(DroneMission.mission_date.desc())
            .offset(skip)
            .limit(limit)
        )
        if farm_id:
            query = query.where(DroneMission.farm_id == farm_id)

        result = await db.execute(query)
        return list(result.scalars().all())


drone_repo = DroneRepository()
drone_mission_repo = DroneMissionRepository()
