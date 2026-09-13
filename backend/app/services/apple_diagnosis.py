import os
import io
import json
import base64
import logging
from typing import Dict, Any
from PIL import Image

import numpy as np
import cv2
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

# Try importing tensorflow, but allow the service to be initialized without it for safety
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError as e:
    logger.warning(f"TensorFlow not available: {e}. Apple model inference will fail.")
    TF_AVAILABLE = False


class AppleDiagnosisService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AppleDiagnosisService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        # We assume this file is in backend/app/services, so project root is two levels up
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.model_dir = os.path.join(base_dir, "models", "apple")
        self.model_path = os.path.join(self.model_dir, "apple_disease_efficientnetb0.keras")
        self.class_names_path = os.path.join(self.model_dir, "class_names.json")

        self.model = None
        self.grad_model = None
        self.class_names = {}

        if not TF_AVAILABLE:
            return

        if not os.path.exists(self.model_path):
            logger.warning(f"Apple model not found at {self.model_path}. Inference will fail.")
            return

        try:
            logger.info("Loading Apple Disease EfficientNetB0 model...")
            self.model = tf.keras.models.load_model(self.model_path)
            
            with open(self.class_names_path, "r") as f:
                self.class_names = json.load(f)

            # Grad-CAM setup: Find the last Conv2D layer
            self.last_conv_layer_name = None
            for layer in reversed(self.model.layers):
                if isinstance(layer, tf.keras.layers.Conv2D):
                    self.last_conv_layer_name = layer.name
                    break
            
            if self.last_conv_layer_name:
                last_conv_layer = self.model.get_layer(self.last_conv_layer_name)
                self.grad_model = tf.keras.models.Model(
                    inputs=self.model.inputs,
                    outputs=[last_conv_layer.output, self.model.output]
                )
        except Exception as e:
            logger.error(f"Failed to load Apple model or setup Grad-CAM: {e}")
            self.model = None

    async def analyze_image(self, file: UploadFile) -> Dict[str, Any]:
        if self.model is None:
            raise HTTPException(status_code=500, detail="Apple model not loaded or TensorFlow unavailable.")

        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image.")

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Corrupted or invalid image file.")

        img = Image.open(io.BytesIO(contents))
        if img.mode != "RGB":
            img = img.convert("RGB")

        # 224x224 specific to EfficientNetB0 standard input
        img_resized = img.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img_resized)
        img_array_expanded = np.expand_dims(img_array, axis=0)

        gradcam_base64 = None
        predictions = None

        if self.grad_model:
            with tf.GradientTape() as tape:
                conv_outputs, predictions = self.grad_model(img_array_expanded)
                if len(predictions.shape) == 1:
                    predictions = tf.expand_dims(predictions, 0)
                pred_index = tf.argmax(predictions[0])
                class_channel = predictions[:, pred_index]

            grads = tape.gradient(class_channel, conv_outputs)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            
            conv_outputs = conv_outputs[0]
            heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0)
            max_heat = tf.math.reduce_max(heatmap)
            if max_heat > 0:
                heatmap /= max_heat
            
            heatmap_numpy = heatmap.numpy()
            heatmap_resized = cv2.resize(heatmap_numpy, (img.width, img.height))
            heatmap_uint8 = np.uint8(255 * heatmap_resized)
            colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
            
            img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            overlay = cv2.addWeighted(img_cv, 0.6, colormap, 0.4, 0)
            
            overlay_rgb = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)
            overlay_pil = Image.fromarray(overlay_rgb)
            buf = io.BytesIO()
            overlay_pil.save(buf, format="JPEG")
            gradcam_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        else:
            predictions = self.model.predict(img_array_expanded)

        pred_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][pred_index])
        
        if confidence >= 0.90:
            status_decision = "HIGH_CONFIDENCE"
            review_required = False
        elif confidence >= 0.70:
            status_decision = "REVIEW_REQUIRED"
            review_required = True
        else:
            status_decision = "LOW_CONFIDENCE"
            review_required = True

        class_key = str(pred_index)
        predicted_class_name = self.class_names.get(class_key, f"class_{pred_index}")

        disease_info = {
            "apple_scab": {"disease": "Apple Scab", "pathogen": "Venturia inaequalis", "type": "Fungal"},
            "black_rot": {"disease": "Black Rot", "pathogen": "Botryosphaeria obtusa", "type": "Fungal"},
            "cedar_apple_rust": {"disease": "Cedar Apple Rust", "pathogen": "Gymnosporangium juniperi-virginianae", "type": "Fungal"},
            "healthy": {"disease": "Healthy", "pathogen": "None", "type": "Healthy"},
        }
        
        info = disease_info.get(predicted_class_name, {"disease": predicted_class_name, "pathogen": "Unknown", "type": "Unknown"})

        class_probabilities = {
            self.class_names.get(str(i), f"class_{i}"): float(prob)
            for i, prob in enumerate(predictions[0])
        }

        response = {
            "crop": "Apple",
            "prediction": {
                "class": predicted_class_name,
                "disease": info["disease"],
                "confidence": confidence
            },
            "decision": {
                "status": status_decision,
                "review_required": review_required
            },
            "pathogen": info["pathogen"],
            "disease_type": info["type"],
            "class_probabilities": class_probabilities,
        }

        if gradcam_base64:
            response["gradcam_image_base64"] = f"data:image/jpeg;base64,{gradcam_base64}"

        return response
