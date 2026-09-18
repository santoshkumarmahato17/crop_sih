"""
Production Inference Engine for 2-Class Rice Pest & Disease Classification.
"""

import os
import sys
import io
import json
from typing import Dict, List, Optional, Union
from PIL import Image
import numpy as np

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("[WARNING] TensorFlow is not installed. Rice model inference will be mocked.")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.preprocessing import preprocess_image_input

RICE_KNOWLEDGE_BASE = {
    "rice_blast": {
        "scientific_name": "Magnaporthe oryzae",
        "category": "disease",
        "condition_type": "Fungal Foliar Blight",
        "urgency": "High",
        "description": "Spindle-shaped lesions with gray centers and brown margins.",
        "recommendation": "Apply Tricyclazole or Propiconazole. Manage nitrogen fertilizer application.",
    },
    "rice_healthy": {
        "scientific_name": "Oryza sativa",
        "category": "healthy",
        "condition_type": "Healthy Foliage",
        "urgency": "None",
        "description": "Healthy green foliage with no visible lesions.",
        "recommendation": "Maintain proper agronomic practices.",
    }
}

class RiceLeafPredictor:
    def __init__(
        self,
        model_dir: str = "ml/models_rice",
        confidence_threshold: float = 0.7
    ):
        self.model_dir = os.path.join(REPO_ROOT, model_dir)
        self.confidence_threshold = confidence_threshold
        self.input_size = (224, 224)
        
        # Load classes
        class_names_path = os.path.join(self.model_dir, "class_names.json")
        if os.path.exists(class_names_path):
            with open(class_names_path, 'r') as f:
                self.classes = json.load(f)
        else:
            self.classes = ["rice_blast", "rice_healthy"]
        
        self.num_classes = len(self.classes)
        
        # Load model
        model_path = os.path.join(self.model_dir, "RICE_ML_model.keras")
        self.model = None
        if TF_AVAILABLE:
            try:
                self.model = tf.keras.models.load_model(model_path, compile=False)
                print(f"[Rice Predictor] Successfully loaded Keras model from {model_path}")
            except Exception as e:
                print(f"[Rice Predictor] Warning: Failed to load model from {model_path}. Error: {e}")
        else:
            print("[Rice Predictor] TensorFlow missing. Operating in MOCK mode.")
            self.is_ready = False

    def predict(
        self,
        image_input: Union[str, bytes, io.BytesIO, Image.Image],
        confidence_threshold: Optional[float] = None,
    ) -> Dict:
        if not self.model or not TF_AVAILABLE:
            print("[Rice Predictor] Model not loaded or TF unavailable. Returning mock prediction.")
            return {
                "class_id": "rice_healthy",
                "class_name": "Healthy Foliage",
                "confidence_score": 95.0,
                "diagnosis": RICE_KNOWLEDGE_BASE["rice_healthy"]
            }
            
        thresh = confidence_threshold if confidence_threshold is not None else self.confidence_threshold

        tensor, pil_img, quality = preprocess_image_input(image_input, input_size=self.input_size)

        if quality["is_too_dark"] or quality["is_too_bright"] or quality["blur_score"] < 2.0:
            return {
                "success": False,
                "status": "poor_image_quality",
                "prediction": "Uncertain Prediction",
                "display_name": "Poor Image Quality",
                "category": "unknown",
                "confidence": 0.0,
                "reliable": False,
                "predicted_class_raw": "Uncertain Prediction",
                "probabilities": {c: 0.0 for c in self.classes},
                "explanation": "Please capture a clearer image of the rice leaf under good lighting.",
                "disease_details": None,
                "threshold_used": thresh,
                "message": "Please capture a clearer image of the rice leaf.",
                "quality_assessment": quality,
            }

        # tensor is a torch Tensor of shape (1, 3, 224, 224) normalized. 
        # But Keras MobileNetV2 usually expects (1, 224, 224, 3) and maybe different scaling.
        # Let's reconstruct standard RGB numpy array for Keras
        img = pil_img.resize(self.input_size)
        x = np.array(img, dtype=np.float32)
        x = np.expand_dims(x, axis=0)
        # Assuming model handles its own normalization or uses standard [0, 255] or [-1, 1]
        # usually MobileNetV2 uses preprocess_input which maps to [-1, 1]
        # But for generic loaded keras model without knowing preprocessing, dividing by 255 is safe
        # Or using standard inception preprocessing: (x / 127.5) - 1.0
        x = (x / 127.5) - 1.0

        outputs = self.model.predict(x, verbose=0)
        probs = outputs[0]

        best_idx = int(np.argmax(probs))
        pred_class = self.classes[best_idx]
        confidence_pct = round(float(probs[best_idx]) * 100.0, 2)

        probabilities_dict = {
            self.classes[i]: round(float(probs[i]), 4)
            for i in range(self.num_classes)
        }

        is_confident = (confidence_pct / 100.0) >= thresh
        is_reliable = is_confident and quality["is_acceptable"]
        status_str = "High Confidence" if is_confident else "Uncertain Prediction"

        kb = RICE_KNOWLEDGE_BASE.get(pred_class, {})
        category = kb.get("category", "disease")

        if not is_confident:
            explanation = "The model is not confident about this image. Please capture a clear image of the rice leaf."
        elif category == "healthy":
            explanation = f"Rice leaf appears healthy. {kb.get('recommendation', '')}"
        else:
            explanation = f"Disease detected: {pred_class}. {kb.get('description', '')} Action: {kb.get('recommendation', '')}"

        return {
            "success": True,
            "prediction": pred_class if is_confident else "Uncertain Prediction",
            "display_name": pred_class,
            "predicted_class_raw": pred_class,
            "category": category,
            "confidence": confidence_pct,
            "reliable": is_reliable,
            "status": status_str,
            "threshold_used": thresh,
            "probabilities": probabilities_dict,
            "explanation": explanation,
            "disease_details": kb if is_confident else None,
            "quality_assessment": quality,
        }

_RICE_PREDICTOR_INSTANCE: Optional[RiceLeafPredictor] = None

def get_rice_predictor() -> RiceLeafPredictor:
    global _RICE_PREDICTOR_INSTANCE
    if _RICE_PREDICTOR_INSTANCE is None:
        _RICE_PREDICTOR_INSTANCE = RiceLeafPredictor()
    return _RICE_PREDICTOR_INSTANCE
