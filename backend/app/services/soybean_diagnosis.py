import os
import sys
import logging
from typing import Dict, Any
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)


class SoybeanDiagnosisService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SoybeanDiagnosisService, cls).__new__(cls)
            cls._instance._init_predictor()
        return cls._instance

    def _init_predictor(self):
        try:
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
            if repo_root not in sys.path:
                sys.path.insert(0, repo_root)
            from ml.src.predict_soybean import get_soybean_predictor
            self.predictor = get_soybean_predictor()
        except Exception as e:
            logger.error(f"Failed to initialize Soybean predictor: {e}")
            self.predictor = None

    async def analyze_image(self, file: UploadFile, include_explanation: bool = True) -> Dict[str, Any]:
        if not self.predictor or not self.predictor.is_ready:
            raise HTTPException(
                status_code=503,
                detail="Soybean model is not loaded. Ensure soybean_model.weights.h5 or soybean_model.keras is present.",
            )

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB.")

        try:
            result = self.predictor.predict(contents, include_explanation=include_explanation)
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Soybean inference failed: {str(e)}")

        pred_info = result.get("prediction", {})
        disease_info = result.get("disease_info", {})
        conf_status = pred_info.get("confidence_status", "LOW_CONFIDENCE")
        review_required = conf_status != "HIGH_CONFIDENCE"

        # Format compatible with SymptomAnalysisResult in frontend
        disease_name = pred_info.get("class_name", "Uncertain").replace("_", " ")

        formatted_response = {
            "crop": "Soybean",
            "prediction": {
                "class": pred_info.get("class_name", "Uncertain"),
                "disease": disease_name,
                "confidence": pred_info.get("confidence", 0.0),
                "confidence_percent": pred_info.get("confidence_percent", 0.0),
            },
            "decision": {
                "status": conf_status,
                "review_required": review_required,
                "message": pred_info.get("message"),
            },
            "pathogen": disease_info.get("scientific_name", "Unknown"),
            "disease_type": disease_info.get("pathogen_type", "Unknown"),
            "urgency": disease_info.get("urgency", "Medium"),
            "description": disease_info.get("description", ""),
            "recommendation": disease_info.get("recommendation", ""),
            "top_predictions": result.get("top_predictions", []),
            "class_probabilities": {
                item["class_name"]: item["confidence"] for item in result.get("top_predictions", [])
            },
        }

        if "visual_explanation" in result:
            formatted_response["gradcam_image_base64"] = result["visual_explanation"]["overlay_image"]
            formatted_response["explanation_label"] = result["visual_explanation"]["label"]
            formatted_response["explanation_disclaimer"] = result["visual_explanation"]["disclaimer"]

        return formatted_response
