from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.auth import User
from app.schemas.diagnosis import (
    SymptomAnalysisRequest,
    SymptomAnalysisResponse,
    ExpertValidationRequest,
    DiagnosisHistoryResponse,
)
from app.services.diagnosis_service import DiagnosisService

router = APIRouter(prefix="/diagnosis", tags=["Symptom-Based Disease Identification"])


@router.post(
    "/symptom-analysis",
    response_model=SymptomAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze crop health using farmer symptoms, crop context, visual imagery and spatial telemetry",
)
async def analyze_crop_health_endpoint(
    request: SymptomAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SymptomAnalysisResponse:
    """
    Executes the multi-factor agronomic disease diagnosis pipeline.
    Combines farmer-entered symptoms, crop growth stage, plant parts, visual evidence,
    and spatial/temporal telemetry into an explainable AI diagnostic report.
    """
    service = DiagnosisService(db)
    return await service.execute_symptom_analysis(request, current_user)


@router.get(
    "/history",
    response_model=DiagnosisHistoryResponse,
    summary="List previous crop health identification checks",
)
async def get_diagnosis_history_endpoint(
    farm_id: Optional[str] = Query(None, description="Optional farm ID filter"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DiagnosisHistoryResponse:
    """Retrieve historical symptom-based diagnosis records for the authorized user."""
    service = DiagnosisService(db)
    return await service.list_diagnosis_history(current_user, farm_id=farm_id, limit=limit)


@router.get(
    "/{id}",
    response_model=SymptomAnalysisResponse,
    summary="Get full details of an existing diagnostic report",
)
async def get_diagnosis_by_id_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SymptomAnalysisResponse:
    """Retrieve complete diagnosis result, explainability breakdown, and recommendations."""
    service = DiagnosisService(db)
    return await service.get_diagnosis_by_id(id, current_user)


@router.post(
    "/{id}/request-validation",
    summary="Request expert validation from regional extension agronomist",
)
async def request_expert_validation_endpoint(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark diagnostic report as PENDING expert review and dispatch extension officer notification."""
    service = DiagnosisService(db)
    return await service.request_expert_validation(id, current_user)


@router.post(
    "/{id}/validate",
    summary="Extension officer ground-truth review and diagnosis confirmation",
)
async def submit_expert_validation_endpoint(
    id: str,
    validation_request: ExpertValidationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit agronomist validation verdict: CONFIRMED, REJECTED, UNCERTAIN, or LAB_REFERRAL."""
    service = DiagnosisService(db)
    return await service.submit_expert_validation(id, validation_request, current_user)


from fastapi import UploadFile, File
from app.services.apple_diagnosis import AppleDiagnosisService
from app.services.soybean_diagnosis import SoybeanDiagnosisService
from app.services.rice_diagnosis import RiceDiagnosisService

@router.post(
    "/apple",
    summary="Real Apple Leaf Disease Inference using EfficientNetB0",
)
async def analyze_apple_leaf_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Run the trained Keras EfficientNetB0 model on an uploaded Apple leaf image.
    Returns disease classification, confidence, Grad-CAM, and advisory info.
    """
    apple_service = AppleDiagnosisService()
    result = await apple_service.analyze_image(file)
    return result


@router.post(
    "/soybean",
    summary="Real Soybean Leaf Disease Inference using MobileNetV2",
)
async def analyze_soybean_leaf_endpoint(
    file: UploadFile = File(..., description="Soybean leaf image"),
    current_user: User = Depends(get_current_user),
):
    """
    Run the trained MobileNetV2 10-class model on an uploaded Soybean leaf image.
    Returns 10-class disease classification, confidence policy evaluation,
    Grad-CAM visual attention overlay, and verified agronomic advisory.
    """
    soybean_service = SoybeanDiagnosisService()
    result = await soybean_service.analyze_image(file, include_explanation=True)
    return result

@router.post(
    "/rice",
    summary="Real Rice Leaf Disease Inference using Keras",
)
async def analyze_rice_leaf_endpoint(
    file: UploadFile = File(..., description="Rice leaf image"),
    current_user: User = Depends(get_current_user),
):
    """
    Run the trained Keras model on an uploaded Rice leaf image.
    """
    rice_service = RiceDiagnosisService()
    result = await rice_service.analyze_image(file)
    return result


