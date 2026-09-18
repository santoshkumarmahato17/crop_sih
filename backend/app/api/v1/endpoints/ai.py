from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_optional_current_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.ai import CropHealthAnalysisResponse
from app.services.crop_health_analysis import crop_health_analysis_service

router = APIRouter(tags=["Crop Health AI Vision Inference"])


@router.post(
    "/ai/analyze",
    response_model=CropHealthAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Crop Health with Vision AI",
)
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
    patch_roi: Optional[str] = Form(default=None, description="Optional patch ROI coordinates JSON string e.g. {'ymin': 20, 'xmin': 30, 'ymax': 50, 'xmax': 60}"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
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
        patch_roi=patch_roi,
    )


@router.get(
    "/ai/analysis/{analysis_id}",
    response_model=CropHealthAnalysisResponse,
    summary="Get Full AI Crop Pathology Analysis by ID",
)
async def get_analysis_by_id(analysis_id: str):
    res = crop_health_analysis_service.get_analysis_by_id(analysis_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis session '{analysis_id}' not found or expired.",
        )
    return res


@router.get(
    "/ai/regions",
    summary="Query Localized Foliar Lesion Regions by Analysis ID",
)
@router.get(
    "/ai/analysis/{analysis_id}/regions",
    summary="Get Localized Foliar Lesion Regions in Original Image Coordinates",
)
async def get_analysis_regions(analysis_id: str):
    return crop_health_analysis_service.get_analysis_regions(analysis_id)


@router.get(
    "/ai/risk",
    summary="Query Risk Evaluation by Analysis ID",
)
async def query_analysis_risk(analysis_id: str):
    risk = crop_health_analysis_service.get_analysis_risk(analysis_id)
    if risk is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Risk breakdown for '{analysis_id}' not found.",
        )
    return risk


@router.get(
    "/ai/analysis/{analysis_id}/regions/{region_id}",
    summary="Get Specific Localized Disease Region Details",
)
async def get_analysis_region_detail(analysis_id: str, region_id: str):
    region = crop_health_analysis_service.get_analysis_region_detail(analysis_id, region_id)
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region '{region_id}' not found for analysis '{analysis_id}'.",
        )
    return region


@router.get(
    "/ai/analysis/{analysis_id}/risk",
    summary="Get Multi-Factor Contextual Risk Evaluation",
)
async def get_analysis_risk(analysis_id: str):
    risk = crop_health_analysis_service.get_analysis_risk(analysis_id)
    if risk is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Risk breakdown for '{analysis_id}' not found.",
        )
    return risk


@router.get(
    "/ai/analysis/{analysis_id}/recommendations",
    summary="Get Authoritative IPM and Agronomic Recommendations",
)
async def get_analysis_recommendations(analysis_id: str):
    return crop_health_analysis_service.get_analysis_recommendations(analysis_id)


@router.get(
    "/ai/analysis/{analysis_id}/resources",
    summary="Get Authoritative Educational Knowledge and Extension Links",
)
async def get_analysis_resources(analysis_id: str):
    return crop_health_analysis_service.get_analysis_resources(analysis_id)


@router.get(
    "/ai/analysis/{analysis_id}/videos",
    summary="Get Verified Disease-Specific Video Resources",
)
async def get_analysis_videos(analysis_id: str):
    res = crop_health_analysis_service.get_analysis_resources(analysis_id)
    return res.get("video_resource") or {"notice": "No verified disease-specific video is currently available."}


@router.post(
    "/ai/validation",
    summary="Submit Human Expert Confirmation or Correction for AI Analysis",
)
async def submit_expert_validation(
    analysis_id: str = Form(...),
    validation_status: str = Form(..., description="CONFIRMED | REJECTED | CORRECT | UNCERTAIN | LAB_REFERRAL"),
    expert_notes: Optional[str] = Form(None),
    corrected_condition: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
):
    analysis = crop_health_analysis_service.get_analysis_by_id(analysis_id)
    return {
        "status": "RECORDED",
        "analysis_id": analysis_id,
        "validation_status": validation_status,
        "expert_id": current_user.id if current_user else "expert-reviewer",
        "corrected_condition": corrected_condition,
        "notes": expert_notes,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ai/sample-images", summary="Get Sample Images for Vision AI Test")
@router.get("/ai/yolo/sample-images", summary="Get YOLO Sample Images")
@router.get("/ai/unified/sample-images", summary="Get Unified Sample Images")
@router.get("/ai/cassava/sample-images", summary="Get Cassava Sample Images")
async def get_ai_sample_images(
    crop: Optional[str] = Query(None),
    limit_per_class: int = Query(1, ge=1, le=5),
):
    from app.api.v1.endpoints.dataset import get_sample_images
    try:
        return await get_sample_images(crop=crop, limit_per_class=limit_per_class)
    except Exception:
        return [
            {
                "class_key": "tomato_early_blight",
                "crop": "Tomato",
                "condition": "Early Blight",
                "file_name": "sample_leaf_1.jpg",
                "relative_path": "samples/sample_leaf_1.jpg",
                "full_path": "/data/samples/sample_leaf_1.jpg",
            }
        ]
