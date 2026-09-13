"""
AGRI SHIELD — EfficientNetB0 22-class Crop Disease Inference Wrapper.
Handles Cashew (5), Cassava (5), Maize (7), and Tomato (5) disease/pest/healthy classes.
Model: crop_disease_efficientnetb0.keras (~86.5% test accuracy, 4M parameters)
"""

import os
import json
import logging
import numpy as np
from PIL import Image
import io

logger = logging.getLogger(__name__)


def _get_model_dir() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "models_efficientnet")


class EfficientNetPredictor:
    """
    Inference wrapper for the 22-class EfficientNetB0 Keras model.

    Supported classes:
    - Cashew: anthracnose, gumosis, healthy, leaf miner, red rust
    - Cassava: bacterial blight, brown spot, green mite, healthy, mosaic
    - Maize: fall armyworm, grasshoper, healthy, leaf beetle, leaf blight, leaf spot, streak virus
    - Tomato: healthy, leaf blight, leaf curl, septoria leaf spot, verticulium wilt
    """

    def __init__(self, model_path: str, classes_path: str):
        self.model_path = model_path
        self.classes_path = classes_path
        self.model = None
        self.classes = []
        self.confidence_threshold = 70.0
        self._load_model()

    def _load_model(self):
        """Load the Keras model and class names, gracefully handling unavailable TensorFlow."""
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"[EfficientNet] Model file not found: {self.model_path}")
                return

            if not os.path.exists(self.classes_path):
                logger.error(f"[EfficientNet] Class names file not found: {self.classes_path}")
                return

            with open(self.classes_path, "r", encoding="utf-8") as f:
                self.classes = json.load(f)

            # Suppress TF logs
            os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
            os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

            # Add alternate TF install location (Windows --target install)
            import sys as _sys
            _tf_alt = r"C:\tf_install"
            if os.path.isdir(_tf_alt) and _tf_alt not in _sys.path:
                _sys.path.insert(0, _tf_alt)

            import tensorflow as tf

            logger.info(f"[EfficientNet] TensorFlow {tf.__version__} detected. Loading model...")
            self.model = tf.keras.models.load_model(self.model_path, compile=False)
            logger.info(
                f"[EfficientNet] Model loaded successfully: {len(self.classes)} classes, "
                f"input shape: {self.model.input_shape}"
            )

        except ImportError:
            logger.warning(
                "[EfficientNet] TensorFlow not installed. Run: pip install tensorflow>=2.15.0 "
                "EfficientNetB0 inference will be unavailable until TF is installed."
            )
        except Exception as e:
            logger.error(f"[EfficientNet] Error loading model: {e}")

    def preprocess_image(self, image_bytes: bytes) -> "np.ndarray":
        """
        Preprocess raw image bytes into a 224x224 float32 tensor.

        NOTE: This model was trained with raw [0-255] pixel values (no normalization),
        so we DO NOT scale the pixel values. EfficientNetB0 preprocessing is handled
        internally by the Keras layers baked into the model graph.
        """
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
        image = image.resize((224, 224), Image.BILINEAR)
        img_array = np.array(image, dtype=np.float32)
        # Raw pixel values [0, 255] — no normalization applied
        return np.expand_dims(img_array, axis=0)  # shape: (1, 224, 224, 3)


    def _categorize(self, class_name: str) -> str:
        """Classify a raw class label into 'healthy', 'pest', or 'disease'."""
        lower = class_name.lower()
        if "healthy" in lower:
            return "healthy"
        pest_keywords = ["mite", "miner", "armyworm", "grasshoper", "beetle", "insect", "pest"]
        if any(kw in lower for kw in pest_keywords):
            return "pest"
        return "disease"

    def predict(self, image_input: bytes, confidence_threshold: float = None) -> dict:
        """
        Run 22-class inference on raw image bytes.

        Returns a structured result dict with prediction, confidence, category, and all class probabilities.
        """
        if self.model is None:
            raise RuntimeError(
                "EfficientNetB0 model is not loaded. Ensure TensorFlow is installed "
                "and the model file exists at: " + self.model_path
            )

        if confidence_threshold is None:
            confidence_threshold = self.confidence_threshold

        img_tensor = self.preprocess_image(image_input)

        import tensorflow as tf
        preds = self.model.predict(img_tensor, verbose=0)[0]  # shape: (22,)

        # Build per-class probability map (percentage)
        probs = {
            cls_name: round(float(prob) * 100.0, 2)
            for cls_name, prob in zip(self.classes, preds)
        }

        # Determine top class
        sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
        top_class, top_conf = sorted_probs[0]
        category = self._categorize(top_class)
        reliable = top_conf >= confidence_threshold

        return {
            "success": True,
            "prediction": top_class if reliable else "Uncertain prediction",
            "display_name": top_class.replace("_", " ").title(),
            "category": category,
            "confidence": round(top_conf, 2),
            "reliable": reliable,
            "status": "High Confidence" if reliable else "Uncertain Prediction",
            "probabilities": probs,
            "top_5": [
                {"class": cls, "confidence": conf, "category": self._categorize(cls)}
                for cls, conf in sorted_probs[:5]
            ],
            "explanation": (
                f"EfficientNetB0 22-class model classified this image as "
                f"'{top_class.replace('_', ' ')}' with {top_conf:.1f}% confidence."
            ),
        }


# ── Singleton factory ──────────────────────────────────────────────────────────

_EFFICIENTNET_PREDICTOR: "EfficientNetPredictor | None" = None


def get_efficientnet_predictor() -> EfficientNetPredictor:
    """Returns or initialises the global EfficientNetB0 predictor singleton."""
    global _EFFICIENTNET_PREDICTOR
    if _EFFICIENTNET_PREDICTOR is None:
        model_dir = _get_model_dir()
        model_path = os.path.join(model_dir, "crop_disease_efficientnetb0.keras")
        classes_path = os.path.join(model_dir, "class_names.json")
        _EFFICIENTNET_PREDICTOR = EfficientNetPredictor(model_path, classes_path)
    return _EFFICIENTNET_PREDICTOR
