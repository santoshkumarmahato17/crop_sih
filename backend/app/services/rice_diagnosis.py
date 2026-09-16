import os
import sys
import logging
from typing import Dict, Any
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)


class RiceDiagnosisService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RiceDiagnosisService, cls).__new__(cls)
            cls._instance._init_predictor()
        return cls._instance

    def _init_predictor(self):
        try:
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
            if repo_root not in sys.path:
                sys.path.insert(0, repo_root)
            from ml.src.predict_rice import get_rice_predictor
            self.predictor = get_rice_predictor()
        except Exception as e:
            logger.error(f"Failed to initialize Rice predictor: {e}")
            self.predictor = None

    async def analyze_image(self, file: UploadFile) -> Dict[str, Any]:
        if not self.predictor or not self.predictor.is_ready:
            raise HTTPException(
                status_code=503,
                detail="Rice model is not loaded. Ensure RICE_ML_model.keras is present.",
            )

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB.")

        try:
            result = self.predictor.predict(contents)
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Rice inference failed: {str(e)}")

        # Format compatible with SymptomAnalysisResult in frontend
        disease_name = result.get("prediction", "Uncertain").replace("_", " ")

        kb = result.get("disease_details", {}) or {}

        formatted_response = {
            "crop": "Rice",
            "prediction": {
                "class": result.get("prediction", "Uncertain"),
                "disease": disease_name,
                "confidence": result.get("confidence", 0.0) / 100.0,
                "confidence_percent": result.get("confidence", 0.0),
            },
            "decision": {
                "status": result.get("status", "LOW_CONFIDENCE"),
                "review_required": not result.get("reliable", False),
                "message": result.get("explanation", ""),
            },
            "pathogen": kb.get("scientific_name", "Unknown"),
            "disease_type": kb.get("category", "Unknown"),
            "urgency": kb.get("urgency", "Medium"),
            "description": kb.get("description", ""),
            "recommendation": kb.get("recommendation", ""),
            "class_probabilities": result.get("probabilities", {}),
        }

        return formatted_response
