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
from ml.src.utils import load_config, load_json

app = FastAPI(
    title="Tomato Leaf Disease Inference API",
    description="Production ML inference service for 5-class Tomato Leaf Disease classification.",
    version="1.0.0",
)

# Enable CORS for local web and mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return HealthResponse(
        status="healthy",
        service="Tomato Leaf Disease Classifier",
        version="1.0.0",
        model_loaded=predictor.model is not None,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
