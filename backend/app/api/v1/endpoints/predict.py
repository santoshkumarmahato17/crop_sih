"""
FastAPI endpoints for Crop Pest & Disease Vision AI Prediction and Agronomic Advisory.
Exposes /predict, /predict-with-explanation, /classes, and /efficientnet/predict endpoints.
"""

import os
import sys
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.schemas.crop_prediction import (
    CropPredictionResponse,
    SupportedClassesResponse,
)
from ai.inference import (
    get_crop_disease_predictor,
    compute_agronomic_risk_and_advisory,
)
from ai.models.crop_classifier import (
    RICE_MAIZE_CLASSES,
    CLASS_TAXONOMY,
    CONDITION_CATEGORIES,
)

router = APIRouter(tags=["Crop Pathology Prediction & Advisory"])


@router.post(
    "/predict",
    response_model=CropPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Crop Disease, Condition, and Severity",
    description=(
        "Analyzes an uploaded leaf or canopy image, identifying crop type, "
        "pathology condition category, specific class, confidence score, "
        "damage severity, and uncertainty flag for expert agronomist review."
    ),
)
async def predict_endpoint(
    file: UploadFile = File(..., description="Crop leaf/canopy optical image file"),
    crop_stage: Optional[str] = Form(None, description="Optional phenological stage (e.g., seedling, tillering, flowering)"),
    temperature_c: Optional[float] = Form(None, description="Optional ambient temperature in Celsius"),
    humidity_percent: Optional[float] = Form(None, description="Optional relative humidity percentage"),
    rainfall_mm: Optional[float] = Form(None, description="Optional precipitation in mm"),
    latitude: Optional[float] = Form(None, description="Optional farm latitude"),
    longitude: Optional[float] = Form(None, description="Optional farm longitude"),
    include_explanation: bool = Form(False, description="Whether to include Grad-CAM activation heatmap"),
) -> Any:
    """
    Main disease detection inference endpoint.
    Accepts image file uploaded by farmer or drone telemetry and returns structured diagnosis.
    """
    # 1. Validate file payload
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid image file must be uploaded.",
        )

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded image file is empty.",
            )
    except Exception as read_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded image: {read_err}",
        )

    # 2. Run Vision AI Inference
    predictor = get_crop_disease_predictor()
    try:
        prediction = predictor.predict(
            image_input=image_bytes,
            top_k=3,
            include_gradcam=include_explanation,
        )
    except Exception as infer_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {infer_err}",
        )

    # 3. Contextual multi-factor agronomic risk intelligence (Golden Rule 6 & 9)
    weather_data = {}
    if temperature_c is not None:
        weather_data["temperature_c"] = temperature_c
    if humidity_percent is not None:
        weather_data["humidity_percent"] = humidity_percent
    if rainfall_mm is not None:
        weather_data["rainfall_mm"] = rainfall_mm

    location_data = {}
    if latitude is not None and longitude is not None:
        location_data = {"latitude": latitude, "longitude": longitude}

    advisory = compute_agronomic_risk_and_advisory(
        prediction=prediction,
        weather=weather_data if weather_data else None,
        crop_stage=crop_stage,
        location=location_data if location_data else None,
    )
    prediction["agronomic_advisory"] = advisory

    # 4. Verified educational & video resources
    from backend.app.services.knowledge_service import KnowledgeService
    resources = KnowledgeService.get_educational_resources(
        condition_key=prediction.get("class", ""),
        is_healthy=(prediction.get("condition") == "Healthy"),
    )
    prediction["video_resource"] = resources.get("video_resource")

    return prediction


@router.post(
    "/predict-with-explanation",
    response_model=CropPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Crop Disease with Grad-CAM Visual Heatmap",
    description="Executes pathology classification and returns Grad-CAM visual heatmap overlay as base64 PNG.",
)
async def predict_with_explanation_endpoint(
    file: UploadFile = File(..., description="Crop leaf image file"),
    crop_stage: Optional[str] = Form(None),
    temperature_c: Optional[float] = Form(None),
    humidity_percent: Optional[float] = Form(None),
    rainfall_mm: Optional[float] = Form(None),
) -> Any:
    """Inference endpoint with automatic Grad-CAM explanation generation."""
    return await predict_endpoint(
        file=file,
        crop_stage=crop_stage,
        temperature_c=temperature_c,
        humidity_percent=humidity_percent,
        rainfall_mm=rainfall_mm,
        include_explanation=True,
    )


@router.get(
    "/predict/classes",
    response_model=SupportedClassesResponse,
    summary="List Supported Crop Pathology Classes and Taxonomies",
)
async def list_supported_classes(all_crops: bool = False) -> SupportedClassesResponse:
    """Returns the list of supported pathology classes for the vision predictor (12 Rice & Maize classes, or all)."""
    target_keys = list(CLASS_TAXONOMY.keys()) if all_crops else [k for k in RICE_MAIZE_CLASSES if k in CLASS_TAXONOMY]
    crops = sorted(list(set(CLASS_TAXONOMY[k]["crop"] for k in target_keys)))
    categories = sorted(list(set(CLASS_TAXONOMY[k]["category"] for k in target_keys)))
    class_list = [
        {
            "class": cls_key,
            "crop": CLASS_TAXONOMY[cls_key]["crop"],
            "condition": CLASS_TAXONOMY[cls_key]["condition"],
            "category": CLASS_TAXONOMY[cls_key]["category"],
            "scientific_name": CLASS_TAXONOMY[cls_key]["scientific_name"],
            "urgency": CLASS_TAXONOMY[cls_key]["urgency"],
        }
        for cls_key in target_keys
    ]

    return SupportedClassesResponse(
        total_classes=len(class_list),
        crops=crops,
        condition_categories=categories,
        classes=class_list,
    )


# ---------------------------------------------------------------------------
# EfficientNetB0 22-class Direct Backend Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/efficientnet/predict",
    status_code=status.HTTP_200_OK,
    summary="Predict using 22-class EfficientNetB0 Keras Model",
    description=(
        "Directly runs the trained EfficientNetB0 Keras model on an uploaded image. "
        "Returns 22-class probabilities for Cashew, Cassava, Maize, and Tomato conditions. "
        "Approximate test accuracy: ~86.5%. Expert review is recommended for critical decisions."
    ),
    tags=["Crop Pathology Prediction & Advisory"],
)
async def efficientnet_predict_endpoint(
    file: UploadFile = File(..., description="Crop leaf image file (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(70.0, description="Custom confidence threshold (0-100)"),
) -> Any:
    """
    Runs the trained 22-class EfficientNetB0 Keras model directly.
    Crops: Cashew (5 classes), Cassava (5 classes), Maize (7 classes), Tomato (5 classes).
    """
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Allowed: {valid_exts}",
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to read image: {e}")

    try:
        _repo = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
        if _repo not in sys.path:
            sys.path.insert(0, _repo)
        from ml.src.predict_efficientnet import get_efficientnet_predictor
        predictor = get_efficientnet_predictor()
        result = predictor.predict(image_input=contents, confidence_threshold=confidence_threshold)
        return {
            **result,
            "model": "EfficientNetB0 — 22-class CCMT Crop Disease Classifier",
            "disclaimer": "Prediction is ~86.5% accurate. Not a substitute for expert agronomist review.",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"EfficientNetB0 inference failed: {str(e)}",
        )


@router.get(
    "/efficientnet/classes",
    summary="List EfficientNetB0 22 Supported Classes",
    tags=["Crop Pathology Prediction & Advisory"],
)
async def efficientnet_classes() -> Any:
    """Returns all 22 supported crop disease/pest/healthy classes for the EfficientNetB0 model."""
    _repo = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
    if _repo not in sys.path:
        sys.path.insert(0, _repo)
    from ml.src.predict_efficientnet import get_efficientnet_predictor
    predictor = get_efficientnet_predictor()
    return {
        "total_classes": len(predictor.classes),
        "classes": predictor.classes,
        "crops": ["Cashew", "Cassava", "Maize", "Tomato"],
        "model": "EfficientNetB0 Transfer Learning",
        "accuracy": "~86.5% test accuracy",
    }


# ---------------------------------------------------------------------------
# Soybean MobileNetV2 10-class Backend Endpoints
# ---------------------------------------------------------------------------

def _soybean_repo_path() -> str:
    _repo = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.."))
    if _repo not in sys.path:
        sys.path.insert(0, _repo)
    return _repo


@router.post(
    "/soybean/predict",
    status_code=status.HTTP_200_OK,
    summary="Predict Soybean Leaf Disease — 10-Class MobileNetV2",
    description=(
        "Runs the trained soybean MobileNetV2 model on an uploaded soybean leaf image. "
        "Applies HIGH/MEDIUM/LOW confidence policy. Low-confidence results are labelled "
        "as 'Uncertain' — the system never forces a class name when evidence is insufficient. "
        "Returns Top-3 predictions and verified agronomic advisory from the knowledge base."
    ),
    tags=["Crop Pathology Prediction & Advisory"],
)
async def soybean_predict_endpoint(
    file: UploadFile = File(..., description="Soybean leaf image (JPG/PNG/WEBP, max 10 MB)"),
    include_explanation: bool = Form(False, description="Whether to include Grad-CAM visual attention heatmap"),
) -> Any:
    """
    Soybean 10-class disease classification endpoint.
    Classes: Bacterial Pustule, Frogeye Leaf Spot, Healthy, Iron Deficiency Chlorosis,
             Potassium Deficiency, Powdery Mildew, Rhizoctonia Aerial Blight, Rust,
             Sudden Death Syndrome, Target Spot.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Allowed: {valid_exts}",
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image is empty.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to read image: {e}")

    try:
        _soybean_repo_path()
        from ml.src.predict_soybean import get_soybean_predictor
        predictor = get_soybean_predictor()
        result = predictor.predict(contents, include_explanation=include_explanation)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Soybean inference failed: {str(e)}")


@router.get(
    "/soybean/health",
    summary="Soybean Model Health Check",
    tags=["Crop Pathology Prediction & Advisory"],
)
async def soybean_health_endpoint() -> Any:
    """Returns health status of the soybean MobileNetV2 model."""
    _soybean_repo_path()
    from ml.src.predict_soybean import get_soybean_predictor
    predictor = get_soybean_predictor()
    return {
        "service": "soybean",
        "status": "healthy" if predictor.is_ready else "degraded",
        "model_loaded": predictor.is_ready,
        "version": predictor.MODEL_VERSION,
        "classes": predictor.classes,
        "num_classes": len(predictor.classes),
    }


@router.get(
    "/soybean/classes",
    summary="Soybean 10 Supported Classes",
    tags=["Crop Pathology Prediction & Advisory"],
)
async def soybean_classes_endpoint() -> Any:
    """Returns all 10 soybean disease/condition classes supported by the model."""
    _soybean_repo_path()
    from ml.src.predict_soybean import get_soybean_predictor
    predictor = get_soybean_predictor()
    return {
        "crop": "soybean",
        "classes": predictor.classes,
        "count": len(predictor.classes),
        "architecture": "MobileNetV2",
        "version": predictor.MODEL_VERSION,
        "confidence_thresholds": {
            "high": predictor.high_conf_threshold,
            "medium": predictor.medium_conf_threshold,
        },
    }


@router.get(
    "/soybean/validate",
    summary="Validate Soybean Model (Internal Check)",
    tags=["Crop Pathology Prediction & Advisory"],
)
async def soybean_validate_endpoint() -> Any:
    """Runs internal model validation: shape check, synthetic inference, probability validation."""
    _soybean_repo_path()
    from ml.src.predict_soybean import get_soybean_predictor
    predictor = get_soybean_predictor()
    return predictor.validate_model()
