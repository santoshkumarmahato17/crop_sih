import os
import io
import json
import logging
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

class RiceDiseaseModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RiceDiseaseModelService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        """Loads the RICE_ML_model.keras into memory on startup."""
        self.is_ready = False
        self.model = None
        self.class_names = {}
        
        try:
            # We assume tensorflow is installed in the production environment
            import tensorflow as tf
            
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            model_dir = os.path.join(base_dir, "models", "rice")
            model_path = os.path.join(model_dir, "RICE_ML_model.keras")
            class_names_path = os.path.join(model_dir, "class_names.json")

            if not os.path.exists(model_path):
                logger.error(f"Rice model not found at {model_path}")
                return

            if os.path.exists(class_names_path):
                with open(class_names_path, "r") as f:
                    self.class_names = json.load(f)
            else:
                logger.warning(f"Class names not found at {class_names_path}. Using fallback names.")
                self.class_names = {"0": "Class_0", "1": "Class_1", "2": "Class_2"}

            logger.info(f"Loading Rice ML model from {model_path}...")
            self.model = tf.keras.models.load_model(model_path, compile=False)
            self.is_ready = True
            logger.info("Rice ML model loaded successfully.")

        except ImportError:
            logger.error("TensorFlow is not installed. Rice model cannot be loaded.")
        except Exception as e:
            logger.error(f"Failed to load Rice ML model: {e}")

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Preprocesses the image exactly as the model expects: 224x224, / 255.0"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            image = image.resize((224, 224))
            img_array = np.asarray(image, dtype=np.float32)
            
            # The model doesn't have an internal rescaling layer, so we normalize here
            img_array = img_array / 255.0
            
            # Expand dimensions to match batch shape [None, 224, 224, 3]
            img_array = np.expand_dims(img_array, axis=0)
            return img_array
        except Exception as e:
            raise ValueError(f"Image preprocessing failed: {e}")

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs thread-safe inference on the image bytes."""
        if not self.is_ready or self.model is None:
            raise RuntimeError("Rice model is not loaded or not ready.")

        img_array = self.preprocess_image(image_bytes)
        
        # Inference
        predictions = self.model.predict(img_array, verbose=0)
        probabilities = predictions[0]
        
        predicted_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_idx])
        
        class_name = self.class_names.get(str(predicted_idx), f"Unknown_Class_{predicted_idx}")

        # Configurable thresholds
        high_threshold = float(os.getenv("RICE_HIGH_CONFIDENCE_THRESHOLD", "0.80"))
        review_threshold = float(os.getenv("RICE_REVIEW_THRESHOLD", "0.60"))
        
        if confidence >= high_threshold:
            status = "HIGH_CONFIDENCE"
        elif confidence >= review_threshold:
            status = "MEDIUM_CONFIDENCE"
        else:
            status = "REVIEW_REQUIRED"

        top_predictions = []
        for idx, prob in enumerate(probabilities):
            name = self.class_names.get(str(idx), f"Unknown_Class_{idx}")
            top_predictions.append({"class_name": name, "confidence": float(prob)})
            
        # Sort top predictions
        top_predictions = sorted(top_predictions, key=lambda x: x["confidence"], reverse=True)

        return {
            "prediction": {
                "class_name": class_name,
                "confidence": confidence,
                "confidence_percent": round(confidence * 100, 2),
                "confidence_status": status,
                "message": "Rice disease prediction successful." if status != "REVIEW_REQUIRED" else "Prediction confidence is low. Expert review required."
            },
            "top_predictions": top_predictions
        }

    async def analyze_image(self, file: UploadFile) -> Dict[str, Any]:
        """Wrapper for FastAPI endpoints to use directly."""
        if not self.is_ready:
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
            result = self.predict(contents)
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))
        except Exception as e:
            logger.error(f"Rice inference failed: {e}")
            raise HTTPException(status_code=500, detail=f"Rice inference failed: {str(e)}")

        pred_info = result["prediction"]
        conf_status = pred_info["confidence_status"]
        review_required = conf_status == "REVIEW_REQUIRED"
        
        disease_name = pred_info["class_name"].replace("_", " ")

        formatted_response = {
            "crop": "Rice",
            "prediction": {
                "class": pred_info["class_name"],
                "disease": disease_name,
                "confidence": pred_info["confidence"],
                "confidence_percent": pred_info["confidence_percent"],
            },
            "decision": {
                "status": conf_status,
                "review_required": review_required,
                "message": pred_info["message"],
            },
            "pathogen": "Unknown", # Expandable later via database query
            "disease_type": "Fungal/Bacterial/Viral", 
            "urgency": "High" if conf_status == "HIGH_CONFIDENCE" and disease_name != "Healthy" else "Medium",
            "description": f"Model identified {disease_name} with {pred_info['confidence_percent']}% confidence.",
            "recommendation": "Maintain proper irrigation and apply suitable crop protection if disease is confirmed.",
            "top_predictions": result["top_predictions"],
            "class_probabilities": {
                item["class_name"]: item["confidence"] for item in result["top_predictions"]
            },
            "model": "RICE_ML_model.keras"
        }
        
        return formatted_response
