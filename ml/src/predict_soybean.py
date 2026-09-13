"""
AGRI SHIELD — Soybean Crop Disease Inference Engine (MobileNetV2, 10-class).
Production inference wrapper for soybean_model.weights.h5 + class_names.json.

Preprocessing: Rescaling(scale=0.00784313725490196, offset=-1) is BAKED INTO the model.
Input: Raw [0-255] RGB image -> resize to 224x224 -> pass directly to model.

Architecture: Sequential [ Rescaling | MobileNetV2 | GlobalAveragePooling2D | Dense(10, softmax) ]
"""

import base64
import io
import json
import logging
import os
import sys
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ── Confidence Policy ──────────────────────────────────────────────────────────
# Thresholds are read from env vars first, then fall back to these defaults.
HIGH_CONF_THRESHOLD = float(os.environ.get("SOYBEAN_HIGH_CONF", "0.70"))
MEDIUM_CONF_THRESHOLD = float(os.environ.get("SOYBEAN_MEDIUM_CONF", "0.45"))

# ── Model directory ─────────────────────────────────────────────────────────────
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
_MODEL_DIR = os.path.join(_REPO_ROOT, "ml", "models_soybean")
_KERAS_PATH = os.path.join(_MODEL_DIR, "soybean_model.keras")
_WEIGHTS_PATH = os.path.join(_MODEL_DIR, "soybean_model.weights.h5")
_CLASSES_PATH = os.path.join(_MODEL_DIR, "class_names.json")
_METADATA_PATH = os.path.join(_MODEL_DIR, "model_metadata.json")

# Maximum accepted image size (10 MB) to guard against decompression bombs
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# ── Soybean Knowledge Base ─────────────────────────────────────────────────────
# NOTE: Disease facts come from this verified agronomic layer,
#       NOT from the classifier directly.
SOYBEAN_KNOWLEDGE_BASE: Dict[str, Dict] = {
    "Bacterial_Pustule": {
        "scientific_name": "Xanthomonas axonopodis pv. glycines",
        "category": "disease",
        "pathogen_type": "Bacterial",
        "urgency": "Medium",
        "description": "Small, pale green spots with reddish-brown centers on leaves; pustules (raised bumps) visible on lower leaf surface. Can cause premature defoliation in severe cases.",
        "recommendation": "Apply copper-based bactericides; use resistant varieties; avoid overhead irrigation.",
    },
    "Frogeye_Leaf_Spot": {
        "scientific_name": "Cercospora sojina",
        "category": "disease",
        "pathogen_type": "Fungal",
        "urgency": "Medium",
        "description": "Circular to irregular gray-brown spots with reddish-purple borders, giving a 'frog-eye' appearance. Severe infections reduce photosynthetic area.",
        "recommendation": "Apply triazole or strobilurin fungicides; plant resistant cultivars; rotate crops.",
    },
    "Healthy": {
        "scientific_name": "Glycine max (Healthy Foliage)",
        "category": "healthy",
        "pathogen_type": "None",
        "urgency": "None",
        "description": "Vibrant green, uniform soybean foliage with no visible disease or pest symptoms.",
        "recommendation": "Continue standard agronomic management, soil monitoring, and bi-weekly scouting.",
    },
    "Iron_Deficiency_Chlorosis": {
        "scientific_name": "Physiological — Iron (Fe) deficiency",
        "category": "physiological",
        "pathogen_type": "Abiotic",
        "urgency": "Medium",
        "description": "Interveinal yellowing of young leaves (veins remain green). Occurs on high-pH, alkaline, or calcareous soils restricting Fe availability.",
        "recommendation": "Apply chelated iron (Fe-EDTA or FeEDDHA) foliar sprays; soil acidification; select IDC-tolerant varieties.",
    },
    "Potassium_Deficiency": {
        "scientific_name": "Physiological — Potassium (K) deficiency",
        "category": "physiological",
        "pathogen_type": "Abiotic",
        "urgency": "Medium",
        "description": "Yellowing and browning of leaf margins ('scorching') starting on lower/older leaves; can reduce pod fill and grain yield.",
        "recommendation": "Apply muriate of potash (MOP) or potassium sulphate at recommended soil test rates.",
    },
    "Powdery_Mildew": {
        "scientific_name": "Microsphaera diffusa",
        "category": "disease",
        "pathogen_type": "Fungal",
        "urgency": "Low to Medium",
        "description": "White, powdery fungal growth on upper leaf surfaces, most common during warm, dry conditions with high humidity at night.",
        "recommendation": "Apply sulfur-based or systemic fungicides (triadimefon); ensure good canopy air movement.",
    },
    "Rhizoctonia_Aerial_Blight": {
        "scientific_name": "Rhizoctonia solani",
        "category": "disease",
        "pathogen_type": "Fungal",
        "urgency": "High",
        "description": "Water-soaked, brown lesions on leaves and stems that rapidly coalesce; affects entire plant canopy during warm, wet weather.",
        "recommendation": "Avoid dense planting; apply systemic fungicides early; improve field drainage.",
    },
    "Rust": {
        "scientific_name": "Phakopsora pachyrhizi",
        "category": "disease",
        "pathogen_type": "Fungal",
        "urgency": "Critical",
        "description": "Small, tan to brown pustules (uredinia) on lower leaf surface releasing brownish spores; causes rapid defoliation and severe yield loss.",
        "recommendation": "Apply triazole fungicides (tebuconazole, propiconazole) at first symptom detection; scout regularly and apply preventatively in epidemic-prone seasons.",
    },
    "Sudden_Death_Syndrome": {
        "scientific_name": "Fusarium virguliforme",
        "category": "disease",
        "pathogen_type": "Fungal (Soilborne)",
        "urgency": "High",
        "description": "Interveinal chlorosis and necrosis of leaves (similar to IDC), but roots show internal brown discoloration; roots and lower stem infected while foliage shows late-season foliar symptoms.",
        "recommendation": "Use SDS-resistant varieties; apply seed treatment fungicides (fluopyram); improve soil drainage; avoid compaction.",
    },
    "Target_Spot": {
        "scientific_name": "Corynespora cassiicola",
        "category": "disease",
        "pathogen_type": "Fungal",
        "urgency": "Medium",
        "description": "Dark brown, circular spots with concentric rings (target-like appearance) on leaves; can also affect pods and stems.",
        "recommendation": "Apply protective fungicides (chlorothalonil, azoxystrobin); improve canopy airflow; remove crop residues.",
    },
}


def _add_tf_path() -> None:
    """Ensure TensorFlow is importable (handles --target install to C:\\tf_install)."""
    _tf_alt = r"C:\tf_install"
    if os.path.isdir(_tf_alt) and _tf_alt not in sys.path:
        sys.path.insert(0, _tf_alt)


def _build_mobilenetv2_model(num_classes: int = 10):
    """Rebuild the MobileNetV2 architecture exactly as trained."""
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
    _add_tf_path()
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras import layers, models

    base = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights=None)
    model = models.Sequential([
        layers.Rescaling(scale=0.00784313725490196, offset=-1.0, input_shape=(224, 224, 3)),
        base,
        layers.GlobalAveragePooling2D(),
        layers.Dense(num_classes, activation="softmax"),
    ])
    return model


class SoybeanPredictor:
    """
    Production-grade soybean leaf disease classifier using MobileNetV2 (10 classes).

    Preprocessing contract:
      - Input: raw [0-255] RGB pixel values
      - The model INTERNALLY applies Rescaling(scale=1/127.5, offset=-1)
      - Do NOT pre-scale the image before passing to this predictor

    Confidence policy (configurable via env vars):
      - >= HIGH_CONF_THRESHOLD   -> HIGH CONFIDENCE
      - >= MEDIUM_CONF_THRESHOLD -> MEDIUM CONFIDENCE
      - <  MEDIUM_CONF_THRESHOLD -> LOW CONFIDENCE (returns uncertain message)
    """

    MODEL_NAME = "soybean_model"
    MODEL_VERSION = "1.0"
    INPUT_SIZE = (224, 224)

    def __init__(
        self,
        weights_path: str = _WEIGHTS_PATH,
        keras_path: str = _KERAS_PATH,
        classes_path: str = _CLASSES_PATH,
        high_conf_threshold: float = HIGH_CONF_THRESHOLD,
        medium_conf_threshold: float = MEDIUM_CONF_THRESHOLD,
    ):
        self.weights_path = weights_path
        self.keras_path = keras_path
        self.classes_path = classes_path
        self.high_conf_threshold = high_conf_threshold
        self.medium_conf_threshold = medium_conf_threshold
        self.model = None
        self.classes: List[str] = []
        self._load()

    def _load(self) -> None:
        """Load class names and model weights. Fails loudly on missing files."""
        # 1. Validate class names file
        if not os.path.exists(self.classes_path):
            logger.error(f"[Soybean] class_names.json not found: {self.classes_path}")
            return

        with open(self.classes_path, "r", encoding="utf-8") as f:
            self.classes = json.load(f)

        if len(self.classes) != 10:
            logger.error(
                f"[Soybean] class_names.json has {len(self.classes)} classes, expected 10. "
                "Replace with the exact class_names.json from model training."
            )
            self.classes = []
            return

        # 2. Check for compiled .keras model first, then fallback to .weights.h5
        _add_tf_path()
        import tensorflow as tf

        if os.path.exists(self.keras_path):
            try:
                logger.info(f"[Soybean] Loading compiled Keras model from {self.keras_path}...")
                self.model = tf.keras.models.load_model(self.keras_path)
                logger.info(
                    f"[Soybean] MobileNetV2 compiled model loaded: {len(self.classes)} classes, "
                    f"input={self.INPUT_SIZE}, version={self.MODEL_VERSION}"
                )
                return
            except Exception as e:
                logger.warning(f"[Soybean] Failed to load .keras model: {e}. Falling back to weights.")

        # 3. Fallback: Build architecture and load weights
        if not os.path.exists(self.weights_path):
            logger.error(f"[Soybean] Neither .keras nor weights file found: {self.weights_path}")
            logger.error(
                "Soybean model architecture is available, but trained weights are required for inference. "
                "Place soybean_model.weights.h5 or soybean_model.keras in ml/models_soybean/ to enable inference."
            )
            return

        try:
            self.model = _build_mobilenetv2_model(num_classes=len(self.classes))
            self.model.load_weights(self.weights_path)
            logger.info(
                f"[Soybean] MobileNetV2 model loaded from weights: {len(self.classes)} classes, "
                f"input={self.INPUT_SIZE}, version={self.MODEL_VERSION}"
            )
        except Exception as e:
            logger.error(f"[Soybean] Failed to load model: {e}")
            self.model = None

    @property
    def is_ready(self) -> bool:
        return self.model is not None and len(self.classes) == 10

    def _validate_image_bytes(self, image_bytes: bytes) -> None:
        """Security validation: size, format, and decompression-bomb checks."""
        if len(image_bytes) == 0:
            raise ValueError("Uploaded image file is empty.")
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError(
                f"Image file is too large ({len(image_bytes) / 1024 / 1024:.1f} MB). "
                f"Maximum allowed: {MAX_IMAGE_BYTES // 1024 // 1024} MB."
            )

    def _decode_and_preprocess(self, image_bytes: bytes) -> "np.ndarray":
        """
        Decode, validate, and resize image bytes.
        Returns a (1, 224, 224, 3) float32 array with RAW [0-255] values.
        The model's internal Rescaling layer handles normalization.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise ValueError(f"Cannot decode image — file may be corrupt or unsupported: {e}")

        # MIME type validation via Pillow format detection
        fmt = (image.format or "").upper()
        if fmt not in {"JPEG", "JPG", "PNG", "WEBP"}:
            raise ValueError(
                f"Unsupported image format: '{fmt}'. Accepted: JPEG, PNG, WEBP."
            )

        if image.mode != "RGB":
            image = image.convert("RGB")

        image = image.resize(self.INPUT_SIZE, Image.BILINEAR)
        arr = np.array(image, dtype=np.float32)  # Raw [0, 255] — model handles Rescaling
        return np.expand_dims(arr, axis=0)        # shape: (1, 224, 224, 3)

    def _confidence_status(self, confidence: float) -> str:
        if confidence >= self.high_conf_threshold:
            return "HIGH_CONFIDENCE"
        elif confidence >= self.medium_conf_threshold:
            return "MEDIUM_CONFIDENCE"
        return "LOW_CONFIDENCE"

    def _generate_visual_explanation(self, image_bytes: bytes, tensor: "np.ndarray", pred_index: int) -> Optional[str]:
        """
        Generate Grad-CAM visual attention overlay using the MobileNetV2 base model.
        Returns a base64 encoded data URI (image/jpeg).
        Explicitly labeled as AI visual attention heatmap, NOT exact infected region.
        """
        try:
            _add_tf_path()
            import tensorflow as tf

            # Find base model layer and its last conv layer (out_relu)
            base_model = None
            for layer in self.model.layers:
                if hasattr(layer, "layers"):
                    base_model = layer
                    break

            if not base_model:
                return None

            last_conv_layer = None
            for sl in reversed(base_model.layers):
                if "relu" in sl.name.lower() or "conv" in sl.name.lower():
                    last_conv_layer = sl
                    break

            if not last_conv_layer:
                return None

            rescaling_layer = self.model.layers[0]
            gap_layer = self.model.layers[2]
            dense_layer = self.model.layers[3]

            rescaled_input = rescaling_layer(tensor)

            grad_model = tf.keras.models.Model(
                inputs=base_model.inputs,
                outputs=[last_conv_layer.output, base_model.output]
            )

            with tf.GradientTape() as tape:
                conv_out, base_out = grad_model(rescaled_input)
                gap_out = gap_layer(base_out)
                preds = dense_layer(gap_out)
                class_channel = preds[:, pred_index]

            grads = tape.gradient(class_channel, conv_out)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            heatmap = conv_out[0] @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0)
            max_heat = tf.math.reduce_max(heatmap)
            if max_heat > 0:
                heatmap /= max_heat

            heatmap_np = heatmap.numpy()

            # Load original image
            orig_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            heatmap_resized = cv2.resize(heatmap_np, (orig_img.width, orig_img.height))
            heatmap_uint8 = np.uint8(255 * heatmap_resized)
            colormap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

            orig_bgr = cv2.cvtColor(np.array(orig_img), cv2.COLOR_RGB2BGR)
            overlay = cv2.addWeighted(orig_bgr, 0.65, colormap, 0.35, 0)
            overlay_rgb = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)

            overlay_pil = Image.fromarray(overlay_rgb)
            buf = io.BytesIO()
            overlay_pil.save(buf, format="JPEG", quality=85)
            return f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
        except Exception as e:
            logger.warning(f"[Soybean] Grad-CAM generation error: {e}")
            return None

    def predict(self, image_bytes: bytes, include_explanation: bool = False) -> dict:
        """
        Run soybean disease inference on raw image bytes.

        Raises:
            RuntimeError: if model is not loaded.
            ValueError:   if image is invalid/unsupported/too large.

        Returns:
            Structured dict with prediction, confidence, top-3, knowledge-base advisory,
            and optional AI visual attention explanation overlay.
        """
        if not self.is_ready:
            raise RuntimeError(
                "Soybean model is not loaded. "
                "Ensure soybean_model.weights.h5 and class_names.json are in ml/models_soybean/."
            )

        # Security: size check
        self._validate_image_bytes(image_bytes)

        # Preprocess
        tensor = self._decode_and_preprocess(image_bytes)

        # Inference
        _add_tf_path()
        import tensorflow as tf
        preds = self.model.predict(tensor, verbose=0)[0]  # shape: (10,)

        # Validate output
        if len(preds) != len(self.classes):
            raise RuntimeError(
                f"Model output size ({len(preds)}) does not match class count ({len(self.classes)}). "
                "Verify class_names.json matches the exact training class order."
            )

        # Build full probability map
        probs = {cls: float(p) for cls, p in zip(self.classes, preds)}
        sorted_probs = sorted(probs.items(), key=lambda x: x[1], reverse=True)

        top_class, top_conf = sorted_probs[0]
        conf_status = self._confidence_status(top_conf)
        pred_index = self.classes.index(top_class)

        # Do NOT force a class name if confidence is too low
        if conf_status == "LOW_CONFIDENCE":
            predicted_class = "Uncertain"
            message = (
                f"Unable to confidently identify the soybean condition. "
                f"Top candidate: '{top_class}' at {top_conf * 100:.1f}%. "
                "Please upload a clearer, closer image of the soybean leaf."
            )
        else:
            predicted_class = top_class
            message = None

        # Knowledge-base lookup (from verified agronomic layer)
        kb = SOYBEAN_KNOWLEDGE_BASE.get(predicted_class, {})

        top_3 = [
            {"class_name": cls, "confidence": round(conf, 4)}
            for cls, conf in sorted_probs[:3]
        ]

        response = {
            "success": True,
            "crop": "soybean",
            "model": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
                "architecture": "MobileNetV2",
                "framework": "keras",
            },
            "prediction": {
                "class_name": predicted_class,
                "confidence": round(top_conf, 4),
                "confidence_percent": round(top_conf * 100, 2),
                "confidence_status": conf_status,
                "message": message,
            },
            "top_predictions": top_3,
            "disease_info": {
                "scientific_name": kb.get("scientific_name", ""),
                "category": kb.get("category", ""),
                "pathogen_type": kb.get("pathogen_type", ""),
                "urgency": kb.get("urgency", ""),
                "description": kb.get("description", ""),
                "recommendation": kb.get("recommendation", ""),
            } if predicted_class != "Uncertain" else {},
            "metadata": {
                "input_size": list(self.INPUT_SIZE),
                "framework": "keras/tensorflow",
                "preprocessing": "Rescaling(1/127.5, -1) baked into model — raw [0-255] input",
                "num_classes": len(self.classes),
                "disclaimer": (
                    "This is a preliminary AI-assisted diagnosis only. "
                    "Predictions are based on leaf image patterns. "
                    "Consult a certified agronomist for confirmed treatment decisions."
                ),
            },
        }

        # Optional Grad-CAM explanation overlay
        if include_explanation:
            heatmap_uri = self._generate_visual_explanation(image_bytes, tensor, pred_index)
            if heatmap_uri:
                response["visual_explanation"] = {
                    "overlay_image": heatmap_uri,
                    "label": "AI visual attention (Grad-CAM heatmap)",
                    "disclaimer": "AI attention/visual explanation — approximate heatmap, not exact infected region boundaries.",
                }

        return response

    def validate_model(self) -> dict:
        """
        Internal model validation test:
        - Verifies model is loaded
        - Checks input/output shapes
        - Runs synthetic inference on blank image
        - Verifies probability vector sums to ~1.0
        - Verifies class name count matches output
        """
        if not self.is_ready:
            return {"valid": False, "error": "Model or class names not loaded."}

        _add_tf_path()
        import tensorflow as tf

        checks = {}
        try:
            checks["input_shape"] = str(self.model.input_shape)
            checks["output_shape"] = str(self.model.output_shape)
            checks["num_classes_from_model"] = self.model.output_shape[-1]
            checks["num_classes_from_json"] = len(self.classes)
            checks["class_count_match"] = self.model.output_shape[-1] == len(self.classes)

            # Synthetic inference
            dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
            out = self.model.predict(dummy, verbose=0)[0]
            checks["output_length"] = len(out)
            checks["probabilities_sum"] = round(float(np.sum(out)), 4)
            checks["probabilities_valid"] = all(0.0 <= float(p) <= 1.0 for p in out)
            checks["top_class_maps_to_json"] = self.classes[int(np.argmax(out))]
            checks["valid"] = (
                checks["class_count_match"]
                and checks["probabilities_valid"]
                and abs(checks["probabilities_sum"] - 1.0) < 0.01
            )
        except Exception as e:
            checks["valid"] = False
            checks["error"] = str(e)

        return checks


# ── Singleton ──────────────────────────────────────────────────────────────────

_SOYBEAN_PREDICTOR: Optional[SoybeanPredictor] = None


def get_soybean_predictor() -> SoybeanPredictor:
    """Returns or initialises the global SoybeanPredictor singleton."""
    global _SOYBEAN_PREDICTOR
    if _SOYBEAN_PREDICTOR is None:
        _SOYBEAN_PREDICTOR = SoybeanPredictor()
    return _SOYBEAN_PREDICTOR
