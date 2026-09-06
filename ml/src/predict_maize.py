"""
Production Inference Engine for 7-Class Maize Pest & Disease Classification.
Handles image quality checks, confidence thresholding, class probabilities,
category attribution (Pest vs Disease vs Healthy), and agronomic IPM recommendations.
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
from ml.src.dataset_maize import CANONICAL_MAIZE_CLASSES, CLASS_CATEGORIES
from ml.src.model import build_model

MAIZE_KNOWLEDGE_BASE = {
    "Fall army worm": {
        "scientific_name": "Spodoptera frugiperda",
        "category": "pest",
        "condition_type": "Lepidopteran Foliar & Whorl Pest",
        "urgency": "Critical",
        "description": "Characteristic ragged window-pane foliar chewing and holes in leaf blades and whorls, accompanied by coarse moist frass.",
        "recommendation": "Scout whorls immediately. Apply Bacillus thuringiensis (Bt) or Neem seed kernel extract (NSKE 5%). For heavy infestations, apply Emamectin benzoate 5% SG or Chlorantraniliprole 18.5% SC.",
    },
    "Grasshopper": {
        "scientific_name": "Hieroglyphus banian / Zonocerus variegatus",
        "category": "pest",
        "condition_type": "Orthopteran Foliar Defoliator",
        "urgency": "High",
        "description": "Severe chewing damage along leaf margins, irregular notched borders, and defoliation of upper foliage.",
        "recommendation": "Deploy neem oil botanical repellents (3000 ppm) or botanical sprays. Trench border margins and clear grassy field borders where nymphs congregate. Apply Cypermethrin or Malathion bait if swarm pressure is high.",
    },
    "Healthy": {
        "scientific_name": "Zea mays (Vigorous Canopy)",
        "category": "healthy",
        "condition_type": "Healthy Foliage",
        "urgency": "None",
        "description": "Uniform green pigmentation across leaf blade and midrib with intact margins, proper turgor, and zero pest feeding signs.",
        "recommendation": "Maintain balanced N-P-K fertigation schedules (especially Nitrogen during knee-high and tasseling stages) and routine weekly scouting.",
    },
    "Leaf Beetle": {
        "scientific_name": "Oulema melanopus / Chaetocnema pulicaria",
        "category": "pest",
        "condition_type": "Chrysomelid Foliar Pest",
        "urgency": "Moderate to High",
        "description": "Narrow longitudinal chewing tracks and skeletonized leaf windows between veins, turning dry and white.",
        "recommendation": "Apply pyrethrum-based sprays or Lambda-cyhalothrin. Promote beneficial predators like lacewings and ladybird beetles. Avoid excessive nitrogen which attracts tender-leaf feeders.",
    },
    "Leaf Blight": {
        "scientific_name": "Exserohilum turcicum (Northern Corn Leaf Blight)",
        "category": "disease",
        "condition_type": "Fungal Foliar Blight",
        "urgency": "High",
        "description": "Long elliptical cigar-shaped tan or grayish-green necrotic lesions (2.5 to 15 cm) extending parallel to leaf veins.",
        "recommendation": "Apply systemic foliar fungicides such as Azoxystrobin + Difenoconazole or Mancozeb at first sign of lower leaf lesion onset. Practice 2-year crop rotation and deep tillage of residue.",
    },
    "Leaf Spot": {
        "scientific_name": "Cercospora zeae-maydis / Bipolaris maydis",
        "category": "disease",
        "condition_type": "Fungal Foliar Spot",
        "urgency": "Moderate to High",
        "description": "Rectangular to oval necrotic spots restricted by leaf veins with yellow chlorotic halos, merging to cause extensive foliar blight.",
        "recommendation": "Improve row spacing to promote air circulation. Spray Propiconazole 25% EC or Pyraclostrobin. Avoid overhead sprinkler irrigation during late afternoon.",
    },
    "Streak Virus": {
        "scientific_name": "Maize streak mastrevirus (MSV)",
        "category": "disease",
        "condition_type": "Viral Pathology (Leafhopper Vectored)",
        "urgency": "High",
        "description": "Uniform continuous yellow-white chlorotic streaks and stripes running parallel along leaf veins, causing plant stunting.",
        "recommendation": "Control leafhopper vector (Cicadulina mbila) using Imidacloprid seed dressing. Rogue out and destroy severely stunted infected seedlings early. Plant MSV-resistant hybrid seed cultivars.",
    },
}


class MaizeLeafPredictor:
    """
    Production inference engine for 7-class Maize Pest & Disease diagnosis.
    """

    def __init__(
        self,
        config_path: str = "ml/config_maize.yaml",
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

        if model_path is None:
            model_path = os.path.join(self.cfg["paths"]["models_dir"], "best_model", "best_model.pth")
            if not os.path.exists(model_path):
                alt = os.path.join(REPO_ROOT, model_path)
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
            print(f"[Maize Predictor] Loaded model weights from: {model_path}")
        else:
            print(f"[Maize Predictor] Warning: weights file {model_path} not found. Running initialized model.")

        self.model.eval()

    def predict(
        self,
        image_input: Union[str, bytes, io.BytesIO, Image.Image],
        confidence_threshold: Optional[float] = None,
    ) -> Dict:
        thresh = confidence_threshold if confidence_threshold is not None else self.confidence_threshold

        tensor, pil_img, quality = preprocess_image_input(image_input, input_size=self.input_size)

        # Severe image quality guard for completely unusable input
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
                "explanation": "Please capture a clearer image of the maize leaf under good lighting.",
                "disease_details": None,
                "threshold_used": thresh,
                "message": "Please capture a clearer image of the maize leaf.",
                "quality_assessment": quality,
            }

        tensor = tensor.to(self.device)

        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=-1)[0].cpu().numpy()

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

        kb = MAIZE_KNOWLEDGE_BASE.get(pred_class, {})
        category = kb.get("category", CLASS_CATEGORIES.get(pred_class, "disease"))

        if not is_confident:
            explanation = (
                "The model is not confident about this image. Please capture a clear image of the maize leaf "
                "under good lighting and make sure the leaf occupies most of the camera frame."
            )
        elif pred_class == "Healthy":
            explanation = (
                f"Maize leaf appears healthy with normal chlorophyll pigmentation and no visible symptoms of pest infestation or foliar disease. "
                f"{kb.get('recommendation', '')}"
            )
        elif category == "pest":
            explanation = (
                f"Pest damage detected: Consistent with {pred_class} ({kb.get('scientific_name', '')}). "
                f"{kb.get('description', '')} Action: {kb.get('recommendation', '')}"
            )
        else:
            explanation = (
                f"Pathological disease detected: Consistent with {pred_class} ({kb.get('scientific_name', '')}). "
                f"{kb.get('description', '')} Action: {kb.get('recommendation', '')}"
            )

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


_MAIZE_PREDICTOR_INSTANCE: Optional[MaizeLeafPredictor] = None


def get_maize_predictor() -> MaizeLeafPredictor:
    global _MAIZE_PREDICTOR_INSTANCE
    if _MAIZE_PREDICTOR_INSTANCE is None:
        _MAIZE_PREDICTOR_INSTANCE = MaizeLeafPredictor()
    return _MAIZE_PREDICTOR_INSTANCE
