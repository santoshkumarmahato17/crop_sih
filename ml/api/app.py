"""
FastAPI Inference REST API for Tomato Leaf Disease Classification.
Provides:
- POST /api/predict (multipart/form-data image=<file>)
- GET /api/health
- GET /api/classes
- GET /api/model-info
"""

import os
import sys
from typing import Dict, Optional
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.predict import get_tomato_predictor
from ml.src.predict_maize import get_maize_predictor
from ml.src.utils import load_config, load_json

# Orange Leaf Disease Predictor
from ml.inference.predictor import OrangeLeafPredictor
from ml.inference.image_quality import check_image_quality

_ORANGE_PREDICTOR = None
def get_orange_predictor():
    global _ORANGE_PREDICTOR
    if _ORANGE_PREDICTOR is None:
        _ORANGE_PREDICTOR = OrangeLeafPredictor()
    return _ORANGE_PREDICTOR

app = FastAPI(
    title="Tomato Leaf Disease Inference API",
    description="Production ML inference service for 5-class Tomato Leaf Disease classification.",
    version="1.0.0",
)

import sys, os
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)
from app.core.config import get_settings
settings = get_settings()

# Enable CORS for local web and mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictResponse(BaseModel):
    success: bool = True
    prediction: str = Field(description="Predicted disease class or 'Uncertain prediction'")
    confidence: float = Field(description="Confidence percentage (0-100)")
    reliable: bool = Field(description="Whether the prediction is considered reliable")
    status: str = Field(description="High Confidence or Uncertain prediction")
    probabilities: Dict[str, float] = Field(description="Class probabilities for all 5 classes")
    explanation: Optional[str] = None
    quality_assessment: Optional[Dict] = None


class MaizePredictResponse(BaseModel):
    success: bool = True
    prediction: str = Field(description="Predicted class name or 'Uncertain Prediction'")
    display_name: str = Field(description="Display name")
    category: str = Field(description="'pest', 'disease', or 'healthy'")
    confidence: float = Field(description="Confidence percentage (0-100)")
    reliable: bool = Field(description="Whether the prediction is considered reliable")
    status: str = Field(description="High Confidence or Uncertain Prediction")
    probabilities: Dict[str, float] = Field(description="Class probabilities for all 7 classes")
    explanation: Optional[str] = None
    disease_details: Optional[Dict] = None
    quality_assessment: Optional[Dict] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    classes: list


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Verify that the ML inference service and model are operational."""
    predictor = get_tomato_predictor()
    is_loaded = predictor.model is not None
    return HealthResponse(
        status="healthy" if is_loaded else "degraded",
        service="Tomato Leaf Disease Classifier",
        version="1.0.0",
        model_loaded=is_loaded,
        classes=predictor.classes,
    )


@app.get("/api/classes", tags=["Metadata"])
async def get_classes():
    """Retrieve supported class taxonomy."""
    predictor = get_tomato_predictor()
    return {
        "classes": predictor.classes,
        "count": len(predictor.classes),
        "confidence_threshold": predictor.confidence_threshold,
    }


@app.get("/api/model-info", tags=["Metadata"])
async def get_model_info():
    """Retrieve training and architecture metadata."""
    metadata_path = os.path.join(REPO_ROOT, "ml", "models", "model_metadata.json")
    if os.path.exists(metadata_path):
        return load_json(metadata_path)
    return {"status": "metadata not found, model might be training"}


@app.get("/api/sample-images", tags=["Metadata"])
@app.get("/sample-images", tags=["Metadata"])
async def get_sample_images():
    """Retrieve sample images from the Tomato dataset across each of the 5 classes."""
    predictor = get_tomato_predictor()
    tomato_root = os.path.join(REPO_ROOT, "Tomato")
    folder_mapping = {
        "Healthy": "healthy",
        "Leaf Blight": "leaf blight",
        "Leaf Curl": "leaf curl",
        "Septoria Leaf Spot": "septoria leaf spot",
        "Verticillium Wilt": "verticulium wilt",
    }
    samples = []
    for cls in predictor.classes:
        fld = folder_mapping.get(cls, cls.lower())
        cls_dir = os.path.join(tomato_root, fld)
        if os.path.isdir(cls_dir):
            files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            for f in files[:4]:
                samples.append({
                    "class_name": cls,
                    "filename": f,
                    "relative_path": f"{fld}/{f}",
                })
    return {"samples": samples}


@app.get("/api/sample-image-file", tags=["Metadata"])
@app.get("/sample-image-file", tags=["Metadata"])
async def get_sample_image_file(rel_path: str):
    """Stream a sample image file."""
    safe_rel = os.path.normpath(rel_path).replace("\\", "/")
    if safe_rel.startswith("..") or "/../" in safe_rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    full_path = os.path.join(REPO_ROOT, "Tomato", safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


@app.post(
    "/api/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Inference"],
    summary="Predict Tomato Leaf Disease",
    description="Accepts a photograph of a tomato leaf and returns diagnosis, probabilities, confidence, and reliability.",
)
@app.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Inference"],
    summary="Predict Tomato Leaf Disease (Alias)",
)
async def predict_leaf(
    image: UploadFile = File(..., description="Photograph of a tomato leaf (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(None, description="Custom confidence threshold between 0.0 and 1.0"),
):
    """
    Main prediction endpoint matching mobile camera and web client contract.
    """
    if not image or not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid image file must be uploaded.",
        )

    # Validate file extension
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image file format '{ext}'. Allowed: {valid_exts}",
        )

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded image file is empty.",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded image: {e}",
        )

    try:
        predictor = get_tomato_predictor()
        result = predictor.predict(
            image_input=contents,
            confidence_threshold=confidence_threshold,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML Inference failed: {str(e)}",
        )


@app.post(
    "/api/maize/predict",
    response_model=MaizePredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Maize Inference"],
    summary="Predict Maize Leaf Pest, Disease, or Healthy Condition (7 Classes)",
    description="Accepts a photograph of a maize leaf and returns 7-class prediction, category (pest/disease/healthy), confidence, and probabilities.",
)
@app.post(
    "/maize/predict",
    response_model=MaizePredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Maize Inference"],
)
async def predict_maize_leaf(
    image: UploadFile = File(..., description="Photograph of a maize leaf (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(None, description="Custom confidence threshold (0.0 - 1.0)"),
):
    """Maize 7-class pest & disease inference endpoint."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        predictor = get_maize_predictor()
        result = predictor.predict(
            image_input=contents,
            confidence_threshold=confidence_threshold,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Maize ML Inference failed: {str(e)}")


@app.get("/api/maize/classes", tags=["Maize Metadata"])
@app.get("/maize/classes", tags=["Maize Metadata"])
async def get_maize_classes():
    """Retrieve supported Maize class taxonomy and categories."""
    predictor = get_maize_predictor()
    from ml.src.dataset_maize import CLASS_CATEGORIES
    return {
        "classes": predictor.classes,
        "count": len(predictor.classes),
        "class_categories": CLASS_CATEGORIES,
        "confidence_threshold": predictor.confidence_threshold,
    }


@app.get("/api/maize/sample-images", tags=["Maize Metadata"])
@app.get("/maize/sample-images", tags=["Maize Metadata"])
async def get_maize_sample_images():
    """Retrieve sample images across each of the 7 Maize classes."""
    predictor = get_maize_predictor()
    maize_root = os.path.join(REPO_ROOT, "Maize")
    folder_mapping = {
        "Fall army worm": "fall armyworm",
        "Grasshopper": "grasshoper",
        "Healthy": "healthy",
        "Leaf Beetle": "leaf beetle",
        "Leaf Blight": "leaf blight",
        "Leaf Spot": "leaf spot",
        "Streak Virus": "streak virus",
    }
    samples = []
    for cls in predictor.classes:
        fld = folder_mapping.get(cls, cls.lower())
        cls_dir = os.path.join(maize_root, fld)
        if os.path.isdir(cls_dir):
            files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            for f in files[:4]:
                samples.append({
                    "class_name": cls,
                    "filename": f,
                    "relative_path": f"{fld}/{f}",
                })
    return {"samples": samples}


@app.get("/api/maize/sample-image-file", tags=["Maize Metadata"])
@app.get("/maize/sample-image-file", tags=["Maize Metadata"])
async def get_maize_sample_image_file(rel_path: str):
    """Stream a Maize sample image file."""
    safe_rel = os.path.normpath(rel_path).replace("\\", "/")
    if safe_rel.startswith("..") or "/../" in safe_rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    full_path = os.path.join(REPO_ROOT, "Maize", safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


@app.get("/api/maize/model-info", tags=["Maize Metadata"])
@app.get("/maize/model-info", tags=["Maize Metadata"])
async def get_maize_model_info():
    """Retrieve Maize training and architecture metadata."""
    metadata_path = os.path.join(REPO_ROOT, "ml", "models_maize", "model_metadata.json")
    if os.path.exists(metadata_path):
        return load_json(metadata_path)
    return {"status": "metadata not found, model might be training"}


# ---------------------------------------------------------------------------
# Cassava 5-Class Pest & Disease Classification Endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/api/cassava/predict",
    tags=["Cassava Inference"],
    summary="Predict Cassava Leaf Disease, Pest, or Healthy Condition (5 Classes)",
    description="Accepts a photograph of a cassava leaf and returns 5-class prediction, category (pest/disease/healthy), confidence, and probabilities.",
)
@app.post(
    "/cassava/predict",
    tags=["Cassava Inference"],
)
async def predict_cassava_leaf(
    image: UploadFile = File(..., description="Photograph of a cassava leaf (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(None, description="Custom confidence threshold (0.0 - 100.0)"),
):
    """Cassava 5-class disease & pest inference endpoint."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        from ml.src.predict_cassava import get_cassava_predictor
        predictor = get_cassava_predictor()
        result = predictor.predict(
            image_input=contents,
            confidence_threshold=confidence_threshold,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cassava ML Inference failed: {str(e)}")


@app.get("/api/cassava/classes", tags=["Cassava Metadata"])
@app.get("/cassava/classes", tags=["Cassava Metadata"])
async def get_cassava_classes():
    """Retrieve supported Cassava class taxonomy and categories."""
    from ml.src.predict_cassava import get_cassava_predictor
    predictor = get_cassava_predictor()
    from ml.src.dataset_cassava import CLASS_CATEGORIES
    return {
        "classes": predictor.classes,
        "count": len(predictor.classes),
        "class_categories": CLASS_CATEGORIES,
        "confidence_threshold": predictor.confidence_threshold,
    }


@app.get("/api/cassava/sample-images", tags=["Cassava Metadata"])
@app.get("/cassava/sample-images", tags=["Cassava Metadata"])
async def get_cassava_sample_images():
    """Retrieve sample images across each of the 5 Cassava classes."""
    from ml.src.predict_cassava import get_cassava_predictor
    predictor = get_cassava_predictor()
    cassava_root = os.path.join(REPO_ROOT, "Cassava")
    folder_mapping = {
        "Bacterial Blight": "bacterial blight",
        "Brown Spot": "brown spot",
        "Green Mite": "green mite",
        "Healthy": "healthy",
        "Mosaic": "mosaic",
    }
    samples = []
    for cls in predictor.classes:
        fld = folder_mapping.get(cls, cls.lower())
        cls_dir = os.path.join(cassava_root, fld)
        if os.path.isdir(cls_dir):
            files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            for f in files[:4]:
                samples.append({
                    "class_name": cls,
                    "filename": f,
                    "relative_path": f"{fld}/{f}",
                })
    return {"samples": samples}


@app.get("/api/cassava/sample-image-file", tags=["Cassava Metadata"])
@app.get("/cassava/sample-image-file", tags=["Cassava Metadata"])
async def get_cassava_sample_image_file(rel_path: str):
    """Stream a Cassava sample image file."""
    safe_rel = os.path.normpath(rel_path).replace("\\", "/")
    if safe_rel.startswith("..") or "/../" in safe_rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    full_path = os.path.join(REPO_ROOT, "Cassava", safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


@app.get("/api/cassava/model-info", tags=["Cassava Metadata"])
@app.get("/cassava/model-info", tags=["Cassava Metadata"])
async def get_cassava_model_info():
    """Retrieve Cassava training and architecture metadata."""
    metadata_path = os.path.join(REPO_ROOT, "ml", "models_cassava", "model_metadata.json")
    if os.path.exists(metadata_path):
        return load_json(metadata_path)
    return {"status": "metadata not found, model might be training"}


# ---------------------------------------------------------------------------
# Cashew 5-Class Disease, Pest & Healthy Classification Endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/api/cashew/predict",
    tags=["Cashew Inference"],
    summary="Predict Cashew Leaf Disease, Pest, or Healthy Condition (5 Classes)",
    description="Accepts a photograph of a cashew leaf and returns 5-class prediction, category (pest/disease/healthy), confidence, and probabilities.",
)
@app.post(
    "/cashew/predict",
    tags=["Cashew Inference"],
)
async def predict_cashew_leaf(
    image: UploadFile = File(..., description="Photograph of a cashew leaf (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(None, description="Custom confidence threshold (0.0 - 100.0)"),
):
    """Cashew 5-class disease & pest inference endpoint."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        from ml.src.predict_cashew import get_cashew_predictor
        predictor = get_cashew_predictor()
        result = predictor.predict(
            image_input=contents,
            confidence_threshold=confidence_threshold,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cashew ML Inference failed: {str(e)}")


@app.get("/api/cashew/health", tags=["Cashew Metadata"])
@app.get("/cashew/health", tags=["Cashew Metadata"])
async def cashew_health_check():
    """Verify that the Cashew ML inference service and model are operational."""
    try:
        from ml.src.predict_cashew import get_cashew_predictor
        predictor = get_cashew_predictor()
        return {
            "status": "healthy",
            "service": "Cashew Leaf Condition Classifier",
            "version": "1.0.0",
            "model_loaded": predictor.model is not None,
            "classes": predictor.classes,
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "Cashew Leaf Condition Classifier",
            "error": str(e),
        }


@app.get("/api/cashew/classes", tags=["Cashew Metadata"])
@app.get("/cashew/classes", tags=["Cashew Metadata"])
async def get_cashew_classes():
    """Retrieve supported Cashew class taxonomy and categories."""
    from ml.src.predict_cashew import get_cashew_predictor
    predictor = get_cashew_predictor()
    from ml.src.dataset_cashew import CLASS_CATEGORIES
    return {
        "classes": predictor.classes,
        "count": len(predictor.classes),
        "class_categories": CLASS_CATEGORIES,
        "confidence_threshold": predictor.confidence_threshold,
    }


@app.get("/api/cashew/sample-images", tags=["Cashew Metadata"])
@app.get("/cashew/sample-images", tags=["Cashew Metadata"])
async def get_cashew_sample_images():
    """Retrieve sample images across each of the 5 Cashew classes."""
    from ml.src.predict_cashew import get_cashew_predictor
    predictor = get_cashew_predictor()
    cashew_root = os.path.join(REPO_ROOT, "Cashew")
    folder_mapping = {
        "Anthracnose": "anthracnose",
        "Gummosis": "gumosis",
        "Healthy": "healthy",
        "Leaf Miner": "leaf miner",
        "Red Rust": "red rust",
    }
    samples = []
    for cls in predictor.classes:
        fld = folder_mapping.get(cls, cls.lower())
        cls_dir = os.path.join(cashew_root, fld)
        if os.path.isdir(cls_dir):
            files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            for f in files[:4]:
                samples.append({
                    "class_name": cls,
                    "filename": f,
                    "relative_path": f"{fld}/{f}",
                })
    return {"samples": samples}


@app.get("/api/cashew/sample-image-file", tags=["Cashew Metadata"])
@app.get("/cashew/sample-image-file", tags=["Cashew Metadata"])
async def get_cashew_sample_image_file(rel_path: str):
    """Stream a Cashew sample image file."""
    safe_rel = os.path.normpath(rel_path).replace("\\", "/")
    if safe_rel.startswith("..") or "/../" in safe_rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    full_path = os.path.join(REPO_ROOT, "Cashew", safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


@app.get("/api/cashew/model-info", tags=["Cashew Metadata"])
@app.get("/cashew/model-info", tags=["Cashew Metadata"])
async def get_cashew_model_info():
    """Retrieve Cashew training and architecture metadata."""
    metadata_path = os.path.join(REPO_ROOT, "ml", "models_cashew", "model_metadata.json")
    if os.path.exists(metadata_path):
        return load_json(metadata_path)
    return {"status": "metadata not found, model might be training"}


# ---------------------------------------------------------------------------
# Apple Leaf Disease Classification Endpoints (4 Classes)
# ---------------------------------------------------------------------------

class ApplePredictResponse(BaseModel):
    success: bool = True
    prediction: str = Field(description="Predicted class name or 'Uncertain Prediction'")
    display_name: str = Field(description="Display name")
    category: str = Field(description="'disease' or 'healthy'")
    confidence: float = Field(description="Confidence percentage (0-100)")
    reliable: bool = Field(description="Whether the prediction is considered reliable")
    status: str = Field(description="High Confidence or Uncertain Prediction")
    probabilities: Dict[str, float] = Field(default_factory=dict, description="Class probabilities for all 4 classes")
    message: Optional[str] = None
    disease_details: Optional[Dict] = None
    recommendations: Optional[Dict] = None
    quality_assessment: Optional[Dict] = None


@app.post(
    "/api/apple/predict",
    response_model=ApplePredictResponse,
    tags=["Apple Disease Classification"],
    summary="Predict Apple Leaf Condition from Camera / Uploaded Photo",
    description="Accepts an image of an apple leaf, runs quality validation, classifies among Apple Scab, Black Rot, Cedar Apple Rust, and Healthy.",
)
@app.post(
    "/apple/predict",
    response_model=ApplePredictResponse,
    tags=["Apple Disease Classification"],
)
async def predict_apple_leaf_condition(
    image: UploadFile = File(..., description="Photograph of Apple foliage (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(70.0, description="Custom confidence threshold (0-100)"),
):
    """Diagnose Apple foliar health and detect fungal diseases."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        from ml.src.predict_apple import get_apple_predictor
        predictor = get_apple_predictor()
        result = predictor.predict(
            image_input=contents,
            confidence_threshold=confidence_threshold or 70.0,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Apple Leaf Inference failed: {str(e)}")


@app.get("/api/apple/health", tags=["Apple Metadata"])
@app.get("/apple/health", tags=["Apple Metadata"])
async def apple_health_check():
    """Verify that the Apple Leaf classifier is operational."""
    try:
        from ml.src.predict_apple import get_apple_predictor
        predictor = get_apple_predictor()
        return {
            "status": "healthy",
            "service": "Apple Leaf Disease Classifier",
            "version": "1.0.0",
            "model_loaded": predictor.model is not None,
            "classes": predictor.classes,
            "confidence_threshold": predictor.confidence_threshold,
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "Apple Leaf Disease Classifier",
            "error": str(e),
        }


@app.get("/api/apple/classes", tags=["Apple Metadata"])
@app.get("/apple/classes", tags=["Apple Metadata"])
async def get_apple_classes():
    """Retrieve supported Apple class taxonomy and categories."""
    from ml.src.predict_apple import get_apple_predictor
    predictor = get_apple_predictor()
    from ml.src.dataset_apple import CLASS_CATEGORIES
    return {
        "classes": predictor.classes,
        "count": len(predictor.classes),
        "class_categories": CLASS_CATEGORIES,
        "confidence_threshold": predictor.confidence_threshold,
    }


@app.get("/api/apple/sample-images", tags=["Apple Metadata"])
@app.get("/apple/sample-images", tags=["Apple Metadata"])
async def get_apple_sample_images():
    """Retrieve sample images across each of the 4 Apple classes from the test set."""
    from ml.src.dataset_apple import find_apple_dataset_dir
    apple_root = find_apple_dataset_dir()
    test_dir = os.path.join(apple_root, "test")
    folder_mapping = {
        "Apple Scab": "apple_scab",
        "Black Rot": "black_rot",
        "Cedar Apple Rust": "cedar_apple_rust",
        "Healthy": "healthy",
    }
    samples = []
    for cls_name, fld in folder_mapping.items():
        cls_dir = os.path.join(test_dir, fld)
        if os.path.isdir(cls_dir):
            files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            for f in files[:4]:
                samples.append({
                    "class_name": cls_name,
                    "filename": f,
                    "relative_path": f"test/{fld}/{f}",
                })
    return {"samples": samples}


@app.get("/api/apple/sample-image-file", tags=["Apple Metadata"])
@app.get("/apple/sample-image-file", tags=["Apple Metadata"])
async def get_apple_sample_image_file(rel_path: str):
    """Stream an Apple sample image file."""
    safe_rel = os.path.normpath(rel_path).replace("\\", "/")
    if safe_rel.startswith("..") or "/../" in safe_rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    from ml.src.dataset_apple import find_apple_dataset_dir
    apple_root = find_apple_dataset_dir()
    full_path = os.path.join(apple_root, safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


@app.get("/api/apple/model-info", tags=["Apple Metadata"])
@app.get("/apple/model-info", tags=["Apple Metadata"])
async def get_apple_model_info():
    """Retrieve Apple training and architecture metadata."""
    metadata_path = os.path.join(REPO_ROOT, "ml", "models_apple", "model_metadata.json")
    if os.path.exists(metadata_path):
        return load_json(metadata_path)
    return {"status": "metadata not found, model might be training"}


# ---------------------------------------------------------------------------
# Unified All-in-One Multi-Crop & YOLO Plant Health Diagnostic Endpoints
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

@app.post(
    "/api/unified/predict",
    tags=["Unified Diagnostics"],
    summary="All-in-One Multi-Crop Auto-Detection, Disease Diagnosis & YOLO Lesion Analysis",
    description="Accepts any crop leaf image (Cashew, Cassava, Maize, Tomato), auto-detects the crop, diagnoses condition, and computes YOLO lesion severity.",
)
@app.post(
    "/unified/predict",
    tags=["Unified Diagnostics"],
)
async def unified_predict(
    image: UploadFile = File(..., description="Photograph of any crop foliage (JPG/PNG)"),
    force_crop: Optional[str] = Form(None, description="Optional manual crop override (Cashew, Cassava, Maize, Tomato)"),
    confidence_threshold: Optional[float] = Form(70.0, description="Custom confidence threshold (0-100)"),
):
    """Unified diagnosis endpoint for all crops and YOLO foliar analysis in one call."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        from ml.src.unified_predictor import get_unified_diagnostic_engine
        engine = get_unified_diagnostic_engine()
        result = engine.diagnose(
            image_input=contents,
            force_crop=force_crop,
            confidence_threshold=confidence_threshold or 70.0,
            run_yolo=True,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unified Diagnostic Inference failed: {str(e)}")


@app.get("/api/unified/sample-images", tags=["Unified Diagnostics"])
@app.get("/unified/sample-images", tags=["Unified Diagnostics"])
async def get_unified_sample_images():
    """Retrieve verified foliage samples across all 4 crops."""
    all_samples = []
    folder_mappings = {
        "Apple": {"Apple Scab": "test/apple_scab", "Black Rot": "test/black_rot", "Cedar Apple Rust": "test/cedar_apple_rust", "Healthy": "test/healthy"},
        "Cashew": {"Anthracnose": "anthracnose", "Healthy": "healthy", "Leaf Miner": "leaf miner", "Red Rust": "red rust"},
        "Cassava": {"Bacterial Blight": "bacterial blight", "Green Mite": "green mite", "Healthy": "healthy", "Mosaic": "mosaic"},
        "Maize": {"Fall army worm": "fall armyworm", "Healthy": "healthy", "Leaf Blight": "leaf blight"},
        "Tomato": {"Healthy": "healthy", "Leaf Blight": "leaf blight", "Leaf Curl": "leaf curl"},
    }
    for crop, classes in folder_mappings.items():
        crop_dir = os.path.join(REPO_ROOT, "apple dataset" if crop == "Apple" else crop)
        if not os.path.isdir(crop_dir):
            continue
        for cls_name, fld in classes.items():
            fld_dir = os.path.join(crop_dir, fld)
            if os.path.isdir(fld_dir):
                files = [f for f in os.listdir(fld_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if files:
                    all_samples.append({
                        "crop": crop,
                        "class_name": cls_name,
                        "filename": files[0],
                        "relative_path": f"{'apple dataset' if crop == 'Apple' else crop}/{fld}/{files[0]}",
                    })
    return {"samples": all_samples}


@app.get("/api/unified/sample-image-file", tags=["Unified Diagnostics"])
@app.get("/unified/sample-image-file", tags=["Unified Diagnostics"])
async def get_unified_sample_image_file(rel_path: str):
    """Stream a sample image file for unified diagnosis."""
    safe_rel = os.path.normpath(rel_path).replace("\\", "/")
    if safe_rel.startswith("..") or "/../" in safe_rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    full_path = os.path.join(REPO_ROOT, safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


# ---------------------------------------------------------------------------
# YOLO Plant Disease Lesion Detection & Severity Segmentation Endpoints
# ---------------------------------------------------------------------------

_YOLO_DETECTOR = None


def get_yolo_detector():
    """Singleton getter for YOLODiseaseDetector."""
    global _YOLO_DETECTOR
    if _YOLO_DETECTOR is None:
        from ml.src.yolo_disease_detector import YOLODiseaseDetector
        _YOLO_DETECTOR = YOLODiseaseDetector()
    return _YOLO_DETECTOR


@app.post(
    "/api/yolo/analyze-disease",
    tags=["YOLO Lesion Detection"],
    summary="YOLO Foliar Lesion Detection, Multi-Region Segmentation & Severity",
    description="Analyzes foliage image, returns bounding boxes, segmentation masks, spectral heatmap, and quantitative severity metrics.",
)
@app.post(
    "/yolo/analyze-disease",
    tags=["YOLO Lesion Detection"],
)
async def analyze_yolo_disease(
    image: UploadFile = File(..., description="Photograph of plant foliage (JPG/PNG)"),
):
    """YOLO disease lesion detection and segmentation endpoint."""
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        detector = get_yolo_detector()
        result = detector.analyze(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO Disease Analysis failed: {str(e)}")


@app.get("/api/yolo/sample-images", tags=["YOLO Lesion Detection"])
@app.get("/yolo/sample-images", tags=["YOLO Lesion Detection"])
async def get_yolo_sample_images():
    """Retrieve sample images for YOLO foliar lesion analysis."""
    samples_dir = os.path.join(REPO_ROOT, "ml", "data", "yolo_samples")
    meta = {
        "pear_foliar_blight_yolo.jpg": {
            "title": "Field Canopy Blight (Figure 3)",
            "description": "Pear foliage with multiple necrotic lesion margins",
            "category": "Blight Bounding Boxes",
        },
        "potato_late_blight_spectral.jpg": {
            "title": "Potato Late Blight (Figure 1)",
            "description": "Potato leaf with water-soaked late blight patches",
            "category": "Spectral Heatmap",
        },
        "multiclass_foliar_lesions.jpg": {
            "title": "Multi-Foliar Disease Lesions (Figure 2)",
            "description": "Multi-crop leaves showing chlorotic halos and necrotic cores",
            "category": "Multi-Region Segmentation",
        },
        "maize_turcicum_blight.jpg": {
            "title": "Maize Turcicum Blight",
            "description": "Maize leaf with elongated cigar-shaped blight lesions",
            "category": "Maize Pathology",
        },
        "tomato_foliar_blight.jpg": {
            "title": "Tomato Foliar Blight",
            "description": "Tomato leaf affected by severe foliar blight lesions",
            "category": "Tomato Pathology",
        },
    }
    items = []
    if os.path.exists(samples_dir):
        for f in os.listdir(samples_dir):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                info = meta.get(f, {
                    "title": f.replace("_", " ").replace(".jpg", "").title(),
                    "description": "Plant foliage lesion sample",
                    "category": "Foliar Sample",
                })
                items.append({
                    "filename": f,
                    "title": info["title"],
                    "description": info["description"],
                    "category": info["category"],
                    "relative_path": f,
                })
    return {"samples": items}


@app.get("/api/yolo/sample-image-file", tags=["YOLO Lesion Detection"])
@app.get("/yolo/sample-image-file", tags=["YOLO Lesion Detection"])
async def get_yolo_sample_image_file(rel_path: str):
    """Stream a YOLO sample image file."""
    safe_rel = os.path.basename(rel_path)
    full_path = os.path.join(REPO_ROOT, "ml", "data", "yolo_samples", safe_rel)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(full_path, media_type="image/jpeg")


# ---------------------------------------------------------------------------
# Orange Leaf Disease Classification Endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/api/orange/predict",
    tags=["Orange Leaf Inference"],
    summary="Predict Orange Leaf Disease (5 Classes)",
    description="Accepts a photograph of an orange leaf and returns prediction and confidence.",
)
async def predict_orange_leaf(
    image: UploadFile = File(..., description="Photograph of an orange leaf (JPG/PNG)"),
    confidence_threshold: Optional[float] = Form(0.70, description="Confidence threshold"),
):
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Valid image file must be uploaded.")

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {valid_exts}")

    try:
        contents = await image.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    # Image Quality Check
    is_good, quality_msg = check_image_quality(contents)
    if not is_good:
        return JSONResponse(status_code=400, content={"success": False, "message": quality_msg})

    try:
        predictor_orange = get_orange_predictor()
        result = predictor_orange.predict(contents, threshold=confidence_threshold)
        if not result.get("success"):
            return JSONResponse(status_code=500, content=result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orange Leaf Inference failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
