from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.ai import CropHealthAnalysisResponse
from app.services.crop_health_analysis import crop_health_analysis_service

router = APIRouter(tags=["Crop Health AI Vision Inference"])


@router.post(
    "/ai/analyze-image",
    response_model=CropHealthAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Crop Health with Vision AI",
    description=(
        "Executes multi-modal crop health analysis using the active CropHealthModel. "
        "Calculates health vitality, vegetation stress, anomaly score, and pathology likelihood, "
        "recording observations into PostGIS database tables."
    ),
)
async def analyze_crop_image(
    image_id: Optional[str] = Form(default=None, description="Ingested DroneImage ID to analyze"),
    file: Optional[UploadFile] = File(default=None, description="Optional direct RGB image binary upload"),
    multispectral_file: Optional[UploadFile] = File(default=None, description="Optional multispectral TIFF upload"),
    thermal_file: Optional[UploadFile] = File(default=None, description="Optional thermal radiance raster upload"),
    farm_id: Optional[str] = Form(default=None, description="Optional Farm ID context"),
    zone_id: Optional[str] = Form(default=None, description="Optional Farm Zone ID context"),
    mission_id: Optional[str] = Form(default=None, description="Optional Drone Mission ID context"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CropHealthAnalysisResponse:
    raw_bytes = await file.read() if file else None
    multi_bytes = await multispectral_file.read() if multispectral_file else None
    thermal_bytes = await thermal_file.read() if thermal_file else None

    return await crop_health_analysis_service.analyze_image(
        db=db,
        image_id=image_id,
        raw_image_bytes=raw_bytes,
        multispectral_bytes=multi_bytes,
        thermal_bytes=thermal_bytes,
        farm_id=farm_id,
        zone_id=zone_id,
        mission_id=mission_id,
        current_user=current_user,
    )
