from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.drone import DroneImage, ImageProcessingJob
from app.repositories.base import BaseRepository


class DroneImageRepository(BaseRepository[DroneImage]):
    """Data access repository for drone imagery frames."""

    def __init__(self):
        super().__init__(DroneImage)

    async def get_by_id_with_relations(
        self, db: AsyncSession, image_id: str
    ) -> Optional[DroneImage]:
        """Fetch image with mission, farm, and zone relationships."""
        result = await db.execute(
            select(DroneImage)
            .options(
                selectinload(DroneImage.mission),
                selectinload(DroneImage.farm),
                selectinload(DroneImage.zone),
            )
            .where(DroneImage.id == image_id)
        )
        return result.scalars().first()

    async def list_by_mission(
        self, db: AsyncSession, mission_id: str, skip: int = 0, limit: int = 100
    ) -> List[DroneImage]:
        """Fetch all imagery captured in a specific mission."""
        result = await db.execute(
            select(DroneImage)
            .options(
                selectinload(DroneImage.mission),
                selectinload(DroneImage.zone),
            )
            .where(DroneImage.mission_id == mission_id)
            .order_by(DroneImage.capture_time.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


class ImageProcessingJobRepository(BaseRepository[ImageProcessingJob]):
    """Data access repository for Celery background processing jobs."""

    def __init__(self):
        super().__init__(ImageProcessingJob)

    async def list_by_mission(
        self, db: AsyncSession, mission_id: str
    ) -> List[ImageProcessingJob]:
        """Fetch processing jobs belonging to a mission."""
        result = await db.execute(
            select(ImageProcessingJob)
            .where(ImageProcessingJob.mission_id == mission_id)
            .order_by(ImageProcessingJob.created_at.desc())
        )
        return list(result.scalars().all())


drone_image_repo = DroneImageRepository()
image_job_repo = ImageProcessingJobRepository()
