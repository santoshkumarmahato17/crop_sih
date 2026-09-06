"""
Production Inference Engine for Tomato Leaf Disease Classification.
Handles image quality checks, confidence thresholding, class probabilities,
and domain-specific agronomic explanations and IPM guidance.
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
from ml.src.model import build_model, DEFAULT_CLASSES

# Agronomic knowledge base for tomato foliar conditions
TOMATO_DISEASE_KNOWLEDGE = {
    "Healthy": {
        "scientific_name": "Solanum lycopersicum (Vigorous foliage)",
        "condition_type": "Healthy Canopy",
        "description": "Foliage exhibits uniform chlorophyll pigmentation, intact leaf margins, and robust turgor without foliar lesions.",
        "urgency": "None",
        "recommendation": "Maintain standard irrigation schedules, balanced N-P-K fertigation, and routine canopy scouting.",
    },
    "Leaf Blight": {
        "scientific_name": "Phytophthora infestans / Alternaria solani",
        "condition_type": "Fungal/Oomycete Foliar Blight",
        "description": "Irregular dark-brown to black water-soaked necrotic lesions spreading from leaf edges with surrounding pale-green halos.",
        "urgency": "High",
        "recommendation": "Immediately prune and burn infected foliage. Apply copper-based fungicides (Copper Oxychloride) or Mancozeb. Avoid overhead sprinkler irrigation.",
    },
    "Leaf Curl": {
        "scientific_name": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "condition_type": "Viral Pathology (Whitefly Vectored)",
        "description": "Upward curling, puckering, chlorotic margins, and stunting of new apical growth transmitted by Bemisia tabaci whiteflies.",
        "urgency": "Critical",
        "recommendation": "Control whitefly vectors using yellow sticky traps and systemic insecticides (Imidacloprid or Neem seed extract). Rogue out and destroy severely stunted plants.",
    },
    "Septoria Leaf Spot": {
        "scientific_name": "Septoria lycopersici",
        "condition_type": "Fungal Foliar Spot",
        "description": "Numerous circular water-soaked spots (1.5–3 mm) with gray centers and dark brown margins, often bearing minute black pycnidia fruiting bodies.",
        "urgency": "Moderate to High",
        "recommendation": "Mulch base of plants to prevent rain-splash from soil. Spray Chlorothalonil or Copper Hydroxide fungicide. Improve row spacing to enhance airflow.",
    },
    "Verticillium Wilt": {
        "scientific_name": "Verticillium dahliae / Verticillium albo-atrum",
        "condition_type": "Soil-Borne Vascular Wilt",
        "description": "Characteristic V-shaped yellow chlorotic wedges expanding on lower foliage, followed by marginal necrosis and vascular brown discoloration in stem xylem.",
        "urgency": "High",
        "recommendation": "No direct chemical cure once infected. Rogue affected vines, practice 3-4 year non-solanaceous crop rotations, and solarize soil before replanting.",
    },
}


class TomatoLeafPredictor:
    """
    Production-grade inference pipeline for Tomato Leaf pathology diagnosis.
    """

    def __init__(
        self,
        config_path: str = "ml/config.yaml",
        model_path: Optional[str] = None,
        device: Optional[str] = None,
        confidence_threshold: Optional[float] = None,
    ):
        self.cfg = load_config(config_path)
        self.classes = self.cfg["dataset"]["classes"]
        self.num_classes = len(self.classes)
        self.input_size = self.cfg["training"]["input_size"]

        if confidence_threshold is not None:
            self.confidence_threshold = confidence_threshold
        else:
            self.confidence_threshold = self.cfg["inference"]["confidence_threshold"]

        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Resolve weights path
        if model_path is None:
            model_path = os.path.join(self.cfg["paths"]["models_dir"], "best_model", "best_model.pth")
            if not os.path.exists(model_path):
                # Fallback to current directory or weights folder
                repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
                alt = os.path.join(repo_root, model_path)
                if os.path.exists(alt):
                    model_path = alt

        self.model = build_model(
            num_classes=self.num_classes,
            backbone_name=self.cfg["training"]["backbone"],
            pretrained=False,
        ).to(self.device)

        if os.path.exists(model_path):
            ckpt = torch.load(model_path, map_location=self.device)
            if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
                self.model.load_state_dict(ckpt["model_state_dict"])
            elif isinstance(ckpt, dict):
                self.model.load_state_dict(ckpt)
            print(f"[Predictor] Loaded model weights from: {model_path}")
        else:
            print(f"[Predictor] Warning: weights file {model_path} not found. Running initialized model.")

        self.model.eval()

    def predict(
        self,
        image_input: Union[str, bytes, io.BytesIO, Image.Image],
        confidence_threshold: Optional[float] = None,
    ) -> Dict:
        """
        Run end-to-end diagnosis on an input image.
        Returns prediction, confidence %, probabilities for all 5 classes,
        reliability flag, and agronomic explanation.
        """
        thresh = confidence_threshold if confidence_threshold is not None else self.confidence_threshold

        # 1. Preprocess & Quality Assessment
        tensor, pil_img, quality = preprocess_image_input(image_input, input_size=self.input_size)
        tensor = tensor.to(self.device)

        # 2. Neural Forward Pass
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=-1)[0].cpu().numpy()

        best_idx = int(np.argmax(probs))
        pred_class = self.classes[best_idx]
        confidence_pct = round(float(probs[best_idx]) * 100.0, 1)

        # Formulate probabilities dictionary
        probabilities_dict = {
            self.classes[i]: round(float(probs[i]), 3)
            for i in range(self.num_classes)
        }

        # 3. Confidence & Reliability Decision Logic
        is_confident = (confidence_pct / 100.0) >= thresh
        is_reliable = is_confident and quality["is_acceptable"]

        if is_confident:
            status_str = "High Confidence"
        else:
            status_str = "Uncertain prediction"

        # 4. Explanation Generation
        kb = TOMATO_DISEASE_KNOWLEDGE.get(pred_class, {})
        if not is_confident or quality["is_blurry"]:
            explanation = (
                "The image is uncertain. Please capture a clearer image of the tomato leaf "
                "under good lighting with steady focus."
            )
        elif pred_class == "Healthy":
            explanation = (
                f"The leaf appears healthy with normal green pigmentation and no visible symptoms of disease. "
                f"{kb.get('recommendation', '')}"
            )
        else:
            explanation = (
                f"Identified symptoms consistent with {pred_class} ({kb.get('scientific_name', '')}). "
                f"{kb.get('description', '')} Action: {kb.get('recommendation', '')}"
            )

        result = {
            "success": True,
            "prediction": pred_class if is_confident else "Uncertain prediction",
            "predicted_class_raw": pred_class,
            "confidence": confidence_pct,
            "reliable": is_reliable,
            "status": status_str,
            "threshold_used": thresh,
            "probabilities": probabilities_dict,
            "explanation": explanation,
            "disease_details": kb if is_confident else None,
            "quality_assessment": quality,
        }

        return result


# Singleton instance helper
_PREDICTOR_INSTANCE: Optional[TomatoLeafPredictor] = None


def get_tomato_predictor() -> TomatoLeafPredictor:
    """Singleton getter for shared predictor instance."""
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None:
        _PREDICTOR_INSTANCE = TomatoLeafPredictor()
    return _PREDICTOR_INSTANCE
