"""
Production Inference Engine for 4-Class Apple Leaf Disease Diagnosis.
Handles image quality checks, confidence thresholding, class probabilities,
category attribution (Disease vs Healthy), and agronomic IPM recommendations.
"""

import os
import sys
import io
from typing import Dict, List, Optional, Tuple, Union
from PIL import Image
import torch
import numpy as np

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import load_config, load_json
from ml.src.preprocessing import preprocess_image_input, assess_image_quality
from ml.src.dataset_apple import CANONICAL_APPLE_CLASSES, CLASS_CATEGORIES
from ml.src.model import build_model

APPLE_KNOWLEDGE_BASE = {
    "Apple Scab": {
        "scientific_name": "Venturia inaequalis",
        "category": "disease",
        "condition_type": "Fungal Foliar & Fruit Scab",
        "urgency": "High",
        "description": "Olive-green, velvety or dark brown circular lesions with feathery borders on upper leaf surfaces; severe infection causes leaf chlorosis, puckering, and early summer defoliation.",
        "recommendation": "Apply preventative fungicides (Captan 50 WP or Mancozeb 75 WG) starting at green tip stage through petal fall; shred or disk fallen overwintered leaves to reduce primary ascospore inoculum; ensure canopy pruning for rapid foliar drying.",
    },
    "Black Rot": {
        "scientific_name": "Botryosphaeria obtusa",
        "category": "disease",
        "condition_type": "Fungal Leaf Spot (Frog-Eye) & Canker",
        "urgency": "High",
        "description": "Distinctive 'frog-eye' leaf spots featuring small purple specks that enlarge into circular lesions with tan/brown centers and dark purple margins; can also infect twigs and fruit.",
        "recommendation": "Prune out dead wood, mummified fruit, and fire blight cankers which harbor overwintering pycnidia; apply Captan or Thiophanate-methyl sprays from tight cluster through cover sprays; sanitize pruning shears between cuts.",
    },
    "Cedar Apple Rust": {
        "scientific_name": "Gymnosporangium juniperi-virginianae",
        "category": "disease",
        "condition_type": "Heteroecious Fungal Rust",
        "urgency": "Medium to High",
        "description": "Vivid bright yellow-orange spots on the upper leaf surface that develop small black pycnia; tube-like fungal aecia form on the lower leaf surface releasing spores in late summer.",
        "recommendation": "Remove nearby Eastern red cedar (Juniperus virginiana) alternate host trees within 1-2 miles if feasible; apply DMI fungicides (Myclobutanil) or Mancozeb at pink bud and petal fall stages before spring infection periods.",
    },
    "Healthy": {
        "scientific_name": "Malus domestica (Healthy Foliage)",
        "category": "healthy",
        "condition_type": "Optimal Foliar Health",
        "urgency": "None",
        "description": "Vigorous, dark-green foliage with intact leaf margins, uniform chlorophyll density, and absence of necrotic lesions, pustules, or frog-eye spots.",
        "recommendation": "Continue standard orchard management: balanced N-P-K and micronutrient (Boron, Zinc) foliar sprays, soil moisture monitoring via tensiometers, and routine weekly IPM scouting.",
    },
}


class AppleLeafPredictor:
    """
    Production inference engine for 4-class Apple Leaf Disease diagnosis.
    """

    def __init__(
        self,
        config_path: str = "ml/config_apple.yaml",
        model_weights_path: Optional[str] = None,
        device: Optional[str] = None,
        confidence_threshold: Optional[float] = None,
    ):
        full_config_path = os.path.join(REPO_ROOT, config_path) if not os.path.isabs(config_path) else config_path
        self.cfg = load_config(full_config_path)

        self.device = torch.device(device or self.cfg["training"]["device"])
        self.confidence_threshold = (
            confidence_threshold
            if confidence_threshold is not None
            else float(self.cfg["inference"]["confidence_threshold"])
        )

        self.classes = CANONICAL_APPLE_CLASSES
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
        self.idx_to_class = {i: c for i, c in enumerate(self.classes)}
        self.class_categories = CLASS_CATEGORIES

        self.input_size = self.cfg["model"]["input_size"]

        if model_weights_path is None:
            model_weights_path = os.path.join(
                REPO_ROOT, self.cfg["model"]["save_dir"], "best_model", "best_model.pth"
            )

        self.model_weights_path = model_weights_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_weights_path):
            print(f"[ApplePredictor Warning] Checkpoint not found at {self.model_weights_path}. Model uninitialized.")
            return

        arch_name = self.cfg["model"]["architecture"]
        model = build_model(
            num_classes=len(self.classes),
            backbone_name=arch_name,
            pretrained=False,
        ).to(self.device)

        checkpoint = torch.load(self.model_weights_path, map_location=self.device)
        if "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        elif "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)

        model.eval()
        self.model = model
        print(f"[ApplePredictor] Successfully loaded Apple Leaf model ({arch_name}) from {self.model_weights_path}")

    def predict(
        self,
        image_input: Union[str, bytes, Image.Image],
        confidence_threshold: Optional[float] = None,
        bypass_quality_checks: bool = False,
    ) -> Dict:
        """
        End-to-end inference on a single image.
        """
        threshold = confidence_threshold if confidence_threshold is not None else self.confidence_threshold

        # 1. Quality Assessment
        quality = assess_image_quality(
            image_input,
            blur_threshold=float(self.cfg["inference"].get("blur_threshold", 40.0)),
            min_brightness=float(self.cfg["inference"].get("min_brightness", 20.0)),
            max_brightness=float(self.cfg["inference"].get("max_brightness", 240.0)),
        )

        if not quality["passed"] and not bypass_quality_checks:
            return {
                "success": False,
                "status": "poor_image_quality",
                "prediction": "Uncertain Prediction",
                "predicted_class": "Uncertain Prediction",
                "predicted_class_raw": "Uncertain Prediction",
                "display_name": "Uncertain Prediction",
                "category": "unknown",
                "confidence": 0.0,
                "reliable": False,
                "probabilities": {c: 0.0 for c in self.classes},
                "quality_assessment": quality,
                "recommendations": {},
                "disease_details": {},
                "message": (
                    f"Poor image quality detected ({', '.join(quality['reasons'])}). "
                    "Please capture a clear, well-focused image of the apple leaf under good lighting."
                ),
            }

        # 2. Preprocess
        tensor, _, _ = preprocess_image_input(image_input, input_size=self.input_size)
        tensor = tensor.to(self.device)

        # 3. Model Forward Pass
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("Apple Leaf Model is not loaded. Train the model first.")

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

        # 4. Probabilities & Top Prediction
        top_idx = int(np.argmax(probs))
        top_class = self.idx_to_class[top_idx]
        top_confidence = float(probs[top_idx] * 100.0)

        all_probs = {
            self.classes[i]: round(float(probs[i]), 4)
            for i in range(len(self.classes))
        }

        # 5. Threshold Reliability Check
        reliable = bool(top_confidence >= threshold)
        category = self.class_categories.get(top_class, "disease")

        if not reliable:
            pred_status = "Uncertain Prediction"
            message = (
                f"The model is not sufficiently confident ({top_confidence:.2f}% < {threshold}%). "
                "Please capture a clearer image of the apple leaf under uniform lighting and ensure the leaf is centered."
            )
        else:
            pred_status = "High Confidence"
            message = f"Diagnosis confirmed with {top_confidence:.2f}% confidence."

        # 6. Agronomic Knowledge Details
        knowledge = APPLE_KNOWLEDGE_BASE.get(top_class, {})

        return {
            "success": True,
            "prediction": top_class,
            "predicted_class": top_class,
            "predicted_class_raw": top_class,
            "display_name": top_class,
            "category": category,
            "confidence": round(top_confidence, 2),
            "reliable": reliable,
            "status": pred_status,
            "message": message,
            "probabilities": all_probs,
            "quality_assessment": quality,
            "recommendations": knowledge,
            "disease_details": {
                "scientific_name": knowledge.get("scientific_name", "Malus domestica"),
                "condition_type": knowledge.get("condition_type", "Foliar Condition"),
                "urgency": knowledge.get("urgency", "Medium"),
                "description": knowledge.get("description", ""),
                "recommendation": knowledge.get("recommendation", ""),
            },
        }


# Singleton instance
_APPLE_PREDICTOR: Optional[AppleLeafPredictor] = None


def get_apple_predictor(config_path: str = "ml/config_apple.yaml") -> AppleLeafPredictor:
    global _APPLE_PREDICTOR
    if _APPLE_PREDICTOR is None or _APPLE_PREDICTOR.model is None:
        _APPLE_PREDICTOR = AppleLeafPredictor(config_path=config_path)
    return _APPLE_PREDICTOR
