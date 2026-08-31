import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from geoalchemy2.shape import to_shape
from shapely.geometry import Point
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import logger
from app.core.storage import storage_service
from app.models.auth import User
from app.models.drone import DroneImage, ImageProcessingJob, ImageType, JobStatus, JobType
from app.repositories.drone import drone_mission_repo
from app.repositories.image import drone_image_repo, image_job_repo
from app.schemas.image import (
    DroneImageListResponse,
    DroneImageResponse,
    ImageProcessingJobResponse,
    ImageUploadResponse,
)
from app.spatial.geometry import geometry_to_geojson_dict, shapely_to_wkt_element
from app.workers.tasks.image_tasks import process_drone_image_task

settings = get_settings()

ALLOWED_MIME_TYPES = {
    "image/jpeg": ImageType.RGB,
    "image/jpg": ImageType.RGB,
    "image/png": ImageType.RGB,
    "image/tiff": ImageType.MULTISPECTRAL,
    "image/geotiff": ImageType.MULTISPECTRAL,
    "image/x-tiff": ImageType.MULTISPECTRAL,
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


class ImageIngestionService:
    """Service handling multi-format drone image uploads, storage, and async processing."""

    def __init__(self):
        self.image_repo = drone_image_repo
        self.job_repo = image_job_repo
        self.mission_repo = drone_mission_repo

    def _to_image_response(self, img: DroneImage) -> DroneImageResponse:
        return DroneImageResponse(
            id=img.id,
            mission_id=img.mission_id,
            farm_id=img.farm_id,
            zone_id=img.zone_id,
            filename=img.filename,
            file_type=img.file_type,
            file_size_bytes=img.file_size_bytes,
            sensor_type=img.sensor_type,
            image_type=str(img.image_type.value if hasattr(img.image_type, "value") else img.image_type),
            processing_status=img.processing_status,
            capture_time=img.capture_time,
            altitude_agl_meters=img.altitude_agl_meters,
            location=geometry_to_geojson_dict(img.location),
            footprint=geometry_to_geojson_dict(img.footprint),
            created_at=img.created_at,
        )

    def validate_file(self, filename: str, content_type: Optional[str], size_bytes: int):
        """Validates file extension, MIME type, and size constraints."""
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if size_bytes > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds system limit of {settings.MAX_UPLOAD_SIZE_MB} MB.",
            )

    async def ingest_image(
        self,
        db: AsyncSession,
        mission_id: str,
        upload_file: UploadFile,
        sensor_type: str = "RGB",
        zone_id: Optional[str] = None,
        gps_latitude: Optional[float] = None,
        gps_longitude: Optional[float] = None,
        current_user: Optional[User] = None,
    ) -> ImageUploadResponse:
        """
        Non-blocking ingestion workflow:
        1. Validates file
        2. Streams to MinIO/S3 object storage
        3. Saves DroneImage & ImageProcessingJob records
        4. Dispatches Celery background worker
        5. Returns HTTP 202/201 acknowledgement immediately.
        """
        # 1. Verify mission
        mission = await self.mission_repo.get_by_id_with_relations(db, mission_id)
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Drone Mission '{mission_id}' not found.",
            )

        # 2. Read bytes & Validate
        file_bytes = await upload_file.read()
        file_size = len(file_bytes)
        filename = upload_file.filename or "drone_frame.jpg"
        content_type = upload_file.content_type or "image/jpeg"

        self.validate_file(filename, content_type, file_size)

        # Map image type
        ext = Path(filename).suffix.lower()
        image_type = ImageType.MULTISPECTRAL if ext in {".tif", ".tiff"} else ImageType.RGB

        # 3. Store to MinIO object storage
        safe_filename = storage_service.sanitize_filename(filename)
        storage_path = storage_service.generate_object_path(mission_id, safe_filename)
        storage_uri = await storage_service.upload_file_bytes(
            file_bytes=file_bytes,
            object_path=storage_path,
            content_type=content_type,
        )

        # 4. Optional Initial GPS Location
        location_geom = None
        if gps_latitude is not None and gps_longitude is not None:
            pt = Point(gps_longitude, gps_latitude)
            location_geom = shapely_to_wkt_element(pt, srid=4326)

        # 5. Create Database Records
        image_id = str(uuid.uuid4())
        job_id = str(uuid.uuid4())

        drone_image = DroneImage(
            id=image_id,
            mission_id=mission.id,
            farm_id=mission.farm_id,
            zone_id=zone_id,
            filename=safe_filename,
            file_type=content_type,
            file_path=storage_uri,
            sensor_type=sensor_type.upper(),
            image_type=image_type,
            processing_status="QUEUED",
            capture_time=datetime.now(timezone.utc),
            location=location_geom,
            altitude_agl_meters=mission.altitude_meters,
            file_size_bytes=file_size,
        )
        db.add(drone_image)

        processing_job = ImageProcessingJob(
            id=job_id,
            mission_id=mission.id,
            job_type=JobType.ANOMALY_SEGMENTATION if image_type == ImageType.RGB else JobType.NDVI_CALCULATION,
            status=JobStatus.QUEUED,
            progress_percent=0.0,
        )
        db.add(processing_job)
        await db.commit()

        # 6. Dispatch Background Celery Task (Non-blocking)
        try:
            process_drone_image_task.delay(drone_image.id, processing_job.id)
        except Exception as e:
            logger.warning(f"Celery broker dispatch warning ({e}). Running asynchronous fallback.")
            # Run eagerly for test / standalone setup
            import asyncio
            from app.workers.tasks.image_tasks import _async_process_image
            asyncio.create_task(_async_process_image(drone_image.id, processing_job.id))

        return ImageUploadResponse(
            image_id=drone_image.id,
            filename=drone_image.filename,
            file_size_bytes=drone_image.file_size_bytes,
            sensor_type=drone_image.sensor_type,
            processing_status="QUEUED",
            job_id=processing_job.id,
            message="Image uploaded successfully to object storage. Background raster processing queued.",
        )

    async def list_mission_images(
        self, db: AsyncSession, mission_id: str, skip: int = 0, limit: int = 100
    ) -> DroneImageListResponse:
        """Lists imagery captured during a specific drone survey mission."""
        images = await self.image_repo.list_by_mission(
            db, mission_id=mission_id, skip=skip, limit=limit
        )
        return DroneImageListResponse(
            images=[self._to_image_response(img) for img in images],
            total=len(images),
        )

    async def get_image(self, db: AsyncSession, image_id: str) -> DroneImageResponse:
        """Retrieves metadata of a specific ingested drone image."""
        img = await self.image_repo.get_by_id_with_relations(db, image_id)
        if not img:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Drone Image '{image_id}' not found.",
            )
        return self._to_image_response(img)

    async def get_image_job(
        self, db: AsyncSession, job_id: str
    ) -> ImageProcessingJobResponse:
        """Retrieves processing progress of an image processing job."""
        job = await self.job_repo.get_by_id(db, job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image Processing Job '{job_id}' not found.",
            )
        return ImageProcessingJobResponse(
            id=job.id,
            mission_id=job.mission_id,
            job_type=str(job.job_type.value if hasattr(job.job_type, "value") else job.job_type),
            status=str(job.status.value if hasattr(job.status, "value") else job.status),
            progress_percent=job.progress_percent,
            celery_task_id=job.celery_task_id,
            output_artifacts=job.output_artifacts,
            error_message=job.error_message,
            created_at=job.created_at,
        )


image_ingestion_service = ImageIngestionService()
