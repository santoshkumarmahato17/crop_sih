"""
KISAN SATHI — CCMT Dataset Exploration & Sample Analysis REST API Endpoints.
Exposes dataset inspection, class taxonomy, sample retrieval, and direct sample inference.
"""

import os
import sys
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Ensure project root is in python path
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from app.api.deps import get_current_active_user, get_optional_current_user
from app.core.config import get_settings
from app.models.auth import User
from app.services.crop_health_analysis import crop_health_analysis_service
from app.schemas.ai import CropHealthAnalysisResponse
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from ai.models.ccmt_classifier import CCMT_CLASSES, CLASS_METADATA

settings = get_settings()

router = APIRouter(prefix="/dataset", tags=["CCMT Crop Pest & Disease Dataset"])


class DatasetSummaryResponse(BaseModel):
    dataset_name: str
    dataset_root: str
    is_available: bool
    total_classes: int
    crops: List[str]
    class_counts: Dict[str, int]
    supported_crops_breakdown: Dict[str, List[str]]


class ClassTaxonomyResponse(BaseModel):
    class_key: str
    crop: str
    condition: str
    pathogen_type: str
    scientific_name: str
    is_healthy: bool
    is_pest: bool
    is_disease: bool
    urgency: str
    description: str
    ipm_recommendations: List[Dict[str, Any]]


class SampleImageInfo(BaseModel):
    class_key: str
    crop: str
    condition: str
    file_name: str
    relative_path: str
    full_path: str


class AnalyzeSampleRequest(BaseModel):
    class_key: str = Field(description="Target class key (e.g. 'cashew_anthracnose', 'maize_fall_armyworm')")
    sample_index: int = Field(default=0, description="Index of sample image to select (0-indexed)")
    farm_id: Optional[str] = None
    zone_id: Optional[str] = None


@router.get(
    "/summary",
    response_model=DatasetSummaryResponse,
    summary="Get CCMT Dataset Statistics & Structure",
)
async def get_dataset_summary() -> DatasetSummaryResponse:
    """Returns overview statistics of the CCMT dataset available on the system."""
    dataset_root = os.path.abspath(settings.DATASET_ROOT_DIR)
    is_available = os.path.isdir(dataset_root)

    crops_set = sorted(list(set(m["crop"] for m in CLASS_METADATA.values())))
    crops_breakdown: Dict[str, List[str]] = {c: [] for c in crops_set}
    for k, m in CLASS_METADATA.items():
        crops_breakdown[m["crop"]].append(m["condition"])

    # Quick count scan across raw folder
    raw_root = os.path.join(dataset_root, "Raw Data", "CCMT Dataset")
    class_counts: Dict[str, int] = {k: 0 for k in CCMT_CLASSES}

    if is_available and os.path.isdir(raw_root):
        from ai.pipelines.ccmt_dataset import CCMTDataset
        try:
            ds = CCMTDataset(dataset_root=dataset_root, subset="raw")
            class_counts = ds.get_class_counts()
        except Exception:
            pass

    return DatasetSummaryResponse(
        dataset_name="CCMT Crop Pest and Disease Detection Dataset",
        dataset_root=dataset_root,
        is_available=is_available,
        total_classes=len(CCMT_CLASSES),
        crops=crops_set,
        class_counts=class_counts,
        supported_crops_breakdown=crops_breakdown,
    )


@router.get(
    "/classes",
    response_model=List[ClassTaxonomyResponse],
    summary="Get 22 Crop Pathology Classes with Agronomic Metadata",
)
async def get_class_taxonomy(crop: Optional[str] = Query(None, description="Filter by crop name (e.g. 'Cashew')")) -> List[ClassTaxonomyResponse]:
    """Returns complete pathological taxonomy, scientific classifications, and IPM protocols."""
    results = []
    for k in CCMT_CLASSES:
        meta = CLASS_METADATA[k]
        if crop and meta["crop"].lower() != crop.lower():
            continue
        results.append(
            ClassTaxonomyResponse(
                class_key=k,
                crop=meta["crop"],
                condition=meta["condition"],
                pathogen_type=meta["pathogen_type"],
                scientific_name=meta["scientific_name"],
                is_healthy=meta["is_healthy"],
                is_pest=meta["is_pest"],
                is_disease=meta["is_disease"],
                urgency=meta["urgency"],
                description=meta["description"],
                ipm_recommendations=meta["ipm_recommendations"],
            )
        )
    return results


@router.get(
    "/sample-images",
    response_model=List[SampleImageInfo],
    summary="Get Representative Sample Images for Every Condition",
)
async def get_sample_images(
    crop: Optional[str] = Query(None, description="Optional crop filter"),
    limit_per_class: int = Query(1, ge=1, le=5),
) -> List[SampleImageInfo]:
    """Provides file paths for representative sample images to preview and test in the UI."""
    dataset_root = os.path.abspath(settings.DATASET_ROOT_DIR)
    if not os.path.isdir(dataset_root):
        fallback_results = []
        for k in CCMT_CLASSES[:5]:
            meta = CLASS_METADATA[k]
            if crop and meta["crop"].lower() != crop.lower():
                continue
            fallback_results.append(
                SampleImageInfo(
                    class_key=k,
                    crop=meta["crop"],
                    condition=meta["condition"],
                    file_name=f"{k}_sample.jpg",
                    relative_path=f"samples/{k}_sample.jpg",
                    full_path=f"{dataset_root}/{k}_sample.jpg",
                )
            )
        return fallback_results

    from ai.pipelines.ccmt_dataset import CCMTDataset
    ds = CCMTDataset(dataset_root=dataset_root, subset="raw")

    samples_by_class: Dict[str, List[str]] = {k: [] for k in CCMT_CLASSES}
    for file_path, _, key in ds.samples:
        if len(samples_by_class[key]) < limit_per_class:
            samples_by_class[key].append(file_path)

    results = []
    for k, paths in samples_by_class.items():
        meta = CLASS_METADATA[k]
        if crop and meta["crop"].lower() != crop.lower():
            continue
        for p in paths:
            rel = os.path.relpath(p, dataset_root)
            results.append(
                SampleImageInfo(
                    class_key=k,
                    crop=meta["crop"],
                    condition=meta["condition"],
                    file_name=os.path.basename(p),
                    relative_path=rel.replace("\\", "/"),
                    full_path=p,
                )
            )
    return results


@router.get(
    "/image-file",
    summary="Stream Sample Image File from Dataset",
)
async def get_image_file(path: str = Query(..., description="Relative or absolute path of dataset image")):
    """Streams the raw binary image from the dataset for display in the frontend viewer."""
    dataset_root = os.path.abspath(settings.DATASET_ROOT_DIR)
    
    # Sanitize and resolve path
    if os.path.isabs(path):
        target_path = os.path.abspath(path)
    else:
        target_path = os.path.abspath(os.path.join(dataset_root, path))

    # Security check to ensure file is inside dataset_root
    if not target_path.startswith(dataset_root) or not os.path.isfile(target_path):
        raise HTTPException(status_code=404, detail="Requested image not found in dataset.")

    media_type = "image/jpeg"
    if target_path.lower().endswith(".png"):
        media_type = "image/png"

    return FileResponse(target_path, media_type=media_type)


@router.post(
    "/analyze-sample",
    response_model=CropHealthAnalysisResponse,
    summary="Analyze a Specified Dataset Sample with PyTorch Vision AI",
)
async def analyze_dataset_sample(
    request: AnalyzeSampleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_current_user),
) -> CropHealthAnalysisResponse:
    """Executes the deep learning inference pipeline on an image directly from the CCMT dataset."""
    dataset_root = os.path.abspath(settings.DATASET_ROOT_DIR)
    from ai.pipelines.ccmt_dataset import CCMTDataset
    ds = CCMTDataset(dataset_root=dataset_root, subset="raw")

    matching = [p for p, _, k in ds.samples if k == request.class_key]
    if not matching:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No samples found for class: {request.class_key}",
        )

    idx = min(max(0, request.sample_index), len(matching) - 1)
    target_sample_path = matching[idx]

    try:
        with open(target_sample_path, "rb") as f:
            raw_bytes = f.read()
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed reading sample image: {err}",
        )

    return await crop_health_analysis_service.analyze_image(
        db=db,
        raw_image_bytes=raw_bytes,
        farm_id=request.farm_id,
        zone_id=request.zone_id,
        current_user=current_user,
    )
