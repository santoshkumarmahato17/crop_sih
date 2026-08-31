from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class DroneImageResponse(BaseSchema):
    """Metadata and spatial location of an ingested drone image frame."""

    id: str
    mission_id: str
    farm_id: Optional[str] = None
    zone_id: Optional[str] = None
    filename: str
    file_type: str
    file_size_bytes: int
    sensor_type: str
    image_type: str
    processing_status: str
    capture_time: datetime
    altitude_agl_meters: float
    location: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON Point GPS location (SRID 4326)"
    )
    footprint: Optional[Dict[str, Any]] = Field(
        default=None, description="GeoJSON Polygon ground footprint (SRID 4326)"
    )
    created_at: datetime


class DroneImageListResponse(BaseSchema):
    """Collection of drone imagery frames."""

    images: List[DroneImageResponse]
    total: int


class ImageUploadResponse(BaseSchema):
    """Immediate acknowledgement returned upon asynchronous image upload."""

    image_id: str
    filename: str
    file_size_bytes: int
    sensor_type: str
    processing_status: str
    job_id: str
    message: str


class ImageProcessingJobResponse(BaseSchema):
    """Status of an asynchronous background processing job."""

    id: str
    mission_id: str
    job_type: str
    status: str
    progress_percent: float
    celery_task_id: Optional[str] = None
    output_artifacts: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
