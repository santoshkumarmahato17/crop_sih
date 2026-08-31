from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.image import (
    DroneImageListResponse,
    DroneImageResponse,
    ImageProcessingJobResponse,
    ImageUploadResponse,
)
from app.services.image_ingestion import image_ingestion_service

router = APIRouter(tags=["Drone Imagery Ingestion & Processing"])


@router.post(
    "/drone-missions/{mission_id}/images/upload",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload Drone Image Frame",
    description="Uploads a raw drone image (JPEG, PNG, GeoTIFF) to MinIO object storage and dispatches asynchronous background processing.",
)
async def upload_image(
    mission_id: str,
    file: UploadFile = File(..., description="Image binary file (JPEG, PNG, GeoTIFF)"),
    sensor_type: str = Form(default="RGB", description="Sensor payload type: RGB, MULTISPECTRAL, THERMAL"),
    zone_id: Optional[str] = Form(default=None, description="Optional target monitoring Zone ID"),
    gps_latitude: Optional[float] = Form(default=None, description="Optional fallback GPS Latitude"),
    gps_longitude: Optional[float] = Form(default=None, description="Optional fallback GPS Longitude"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ImageUploadResponse:
    return await image_ingestion_service.ingest_image(
        db=db,
        mission_id=mission_id,
        upload_file=file,
        sensor_type=sensor_type,
        zone_id=zone_id,
        gps_latitude=gps_latitude,
        gps_longitude=gps_longitude,
        current_user=current_user,
    )


@router.get(
    "/drone-missions/{mission_id}/images",
    response_model=DroneImageListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Mission Imagery",
    description="Lists all ingested image frames captured during a drone monitoring mission.",
)
async def list_mission_images(
    mission_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneImageListResponse:
    return await image_ingestion_service.list_mission_images(
        db=db, mission_id=mission_id, skip=skip, limit=limit
    )


@router.get(
    "/drone-images/{image_id}",
    response_model=DroneImageResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Image Metadata",
    description="Retrieves spatial coordinates, EXIF data, and processing status of an image.",
)
async def get_image(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DroneImageResponse:
    return await image_ingestion_service.get_image(db=db, image_id=image_id)


@router.get(
    "/image-jobs/{job_id}",
    response_model=ImageProcessingJobResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Image Processing Job Status",
    description="Retrieves the asynchronous Celery processing progress and output artifacts.",
)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ImageProcessingJobResponse:
    return await image_ingestion_service.get_image_job(db=db, job_id=job_id)
