from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.observation import (
    DiseaseObservation,
    HealthObservation,
    PestObservation,
    WaterStressObservation,
)
from app.repositories.base import BaseRepository


class ObservationRepository(BaseRepository[HealthObservation]):
    """Data access repository for crop health observations and temporal queries."""

    def __init__(self):
        super().__init__(HealthObservation)

    async def list_by_zone_chronological(
        self, db: AsyncSession, zone_id: str, limit: int = 50
    ) -> List[HealthObservation]:
        """Fetch all observations for a zone ordered chronologically (oldest -> newest)."""
        result = await db.execute(
            select(HealthObservation)
            .options(
                selectinload(HealthObservation.disease_observations),
                selectinload(HealthObservation.pest_observations),
                selectinload(HealthObservation.water_stress_observations),
                selectinload(HealthObservation.zone),
                selectinload(HealthObservation.farm),
            )
            .where(HealthObservation.zone_id == zone_id)
            .order_by(HealthObservation.observation_date.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_by_farm_chronological(
        self, db: AsyncSession, farm_id: str, limit: int = 200
    ) -> List[HealthObservation]:
        """Fetch all observations for a farm ordered chronologically."""
        result = await db.execute(
            select(HealthObservation)
            .options(
                selectinload(HealthObservation.disease_observations),
                selectinload(HealthObservation.pest_observations),
                selectinload(HealthObservation.water_stress_observations),
                selectinload(HealthObservation.zone),
                selectinload(HealthObservation.farm),
            )
            .where(HealthObservation.farm_id == farm_id)
            .order_by(HealthObservation.observation_date.asc())
            .limit(limit)
        )
        return list(result.scalars().all())


observation_repo = ObservationRepository()
