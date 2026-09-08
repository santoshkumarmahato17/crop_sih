"""
Production Inference Engine for 5-Class Cashew Leaf Disease & Pest Classification.
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
from ml.src.dataset_cashew import CANONICAL_CASHEW_CLASSES, CLASS_CATEGORIES
from ml.src.model import build_model

CASHEW_KNOWLEDGE_BASE = {
    "Anthracnose": {
        "scientific_name": "Colletotrichum gloeosporioides",
        "category": "disease",
        "condition_type": "Fungal Foliar & Inflorescence Blight",
        "urgency": "High",
        "description": "Reddish-brown to dark necrotic lesions with chlorotic halos expanding on foliage and young shoots; blighted panicles and premature defoliation.",
        "recommendation": "Prune blighted twigs 10 cm below necrotic margins and incinerate; spray Copper Oxychloride 50 WP (0.2%) or Mancozeb at flushing and flowering stages at 2-3 week intervals.",
    },
    "Gummosis": {
        "scientific_name": "Lasiodiplodia theobromae",
        "category": "disease",
        "condition_type": "Fungal Canker & Bark Dieback",
        "urgency": "High",
        "description": "Amber-colored resinous gum exudates oozing from longitudinal bark cracks, trunk cankers, branch dieback, and foliar chlorosis/wilt.",
        "recommendation": "Scrape infected bark tissues carefully until healthy wood is exposed; apply Bordeaux paste (1%) or Copper Oxychloride paste; facilitate field drainage to reduce root-collar waterlogging.",
    },
    "Healthy": {
        "scientific_name": "Anacardium occidentale (Healthy Canopy)",
        "category": "healthy",
        "condition_type": "Optimal Foliage Health",
        "urgency": "None",
        "description": "Vigorous leathery green foliage with uniform chlorophyll distribution, intact leaf margins, and zero evidence of cankers, algal rust, or insect mines.",
        "recommendation": "Maintain balanced N-P-K nutrient application, routine canopy pruning for light penetration, and bi-weekly IPM field scouting.",
    },
    "Leaf Miner": {
        "scientific_name": "Acrocercops syngramma",
        "category": "pest",
        "condition_type": "Lepidopteran Foliar Pest (Pest Infestation)",
        "urgency": "High",
        "description": "Silvery serpentine epidermal tunnels or blistered brown patches on tender young flush leaves caused by mining larvae; leaves curl, distort, and dry prematurely.",
        "recommendation": "Spray Neem Seed Kernel Extract (NSKE 5%) or Spinosad (0.015%) during the post-monsoon flush period; conserve eulophid parasitic wasps; avoid broad-spectrum pyrethroid insecticides.",
    },
    "Red Rust": {
        "scientific_name": "Cephaleuros virescens",
        "category": "disease",
        "condition_type": "Algal Foliar Pathology",
        "urgency": "Medium",
        "description": "Circular orange-red velvety algal pustules on the upper leaf surface; causes impaired photosynthesis and premature senescence in dense, humid cashew canopies.",
        "recommendation": "Deliver full foliar coverage with Copper Hydroxide (0.2%) or Bordeaux mixture (1%) during humid flush periods; prune inner canopy water sprouts to improve sunlight and aeration.",
    },
}


class CashewLeafPredictor:
    """
    Production inference engine for 5-class Cashew Pest & Disease diagnosis.
    """

    def __init__(
        self,
        config_path: str = "ml/config_cashew.yaml",
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

        self.classes = CANONICAL_CASHEW_CLASSES
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
        self.idx_to_class = {i: c for i, c in enumerate(self.classes)}
        self.class_categories = CLASS_CATEGORIES

        self.input_size = self.cfg["model"]["input_size"]

        if model_weights_path is None:
            model_weights_path = os.path.join(
                REPO_ROOT, self.cfg["model"]["save_dir"], "best_model", "best_model.pth"
            )

        if not os.path.exists(model_weights_path):
            raise FileNotFoundError(
                f"Trained model weights not found at: {model_weights_path}. Train the model first."
            )

        self.model = build_model(
            num_classes=len(self.classes),
            backbone_name=self.cfg["model"]["architecture"],
            pretrained=False,
        ).to(self.device)

        checkpoint = torch.load(model_weights_path, map_location=self.device)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            self.model.load_state_dict(checkpoint["model_state_dict"])
        else:
            self.model.load_state_dict(checkpoint)

        self.model.eval()
        print(f"[Cashew Predictor] Loaded model weights from: {model_weights_path}")

    def predict(
        self,
        image_input: Union[str, bytes, Image.Image, np.ndarray],
        confidence_threshold: Optional[float] = None,
        skip_quality_check: bool = False,
    ) -> Dict:
        threshold = confidence_threshold if confidence_threshold is not None else self.confidence_threshold

        # Step 1: Preprocessing & Quality Assessment
        tensor, original_rgb, quality_assessment = preprocess_image_input(
            image_input, input_size=self.input_size
        )

        # Step 2: Quality validation guard
        if not skip_quality_check and not quality_assessment["is_acceptable"]:
            if quality_assessment.get("is_blurry") and quality_assessment.get("blur_score", 0) < 2.0:
                return {
                    "success": False,
                    "status": "poor_image_quality",
                    "crop_type": "Cashew",
                    "prediction": "Poor Image Quality",
                    "display_name": "Poor Image Quality",
                    "category": "unknown",
                    "confidence": 0.0,
                    "reliable": False,
                    "message": "Please capture a clearer image of the cashew leaf.",
                    "quality_assessment": quality_assessment,
                    "explanation": "Image is severely blurry or obstructed. " + " ".join(quality_assessment["advisory_notes"]),
                    "probabilities": {c: 0.0 for c in self.classes},
                }

        # Step 3: PyTorch Neural Inference
        tensor = tensor.to(self.device)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

        # Step 4: Extract top prediction
        top_idx = int(np.argmax(probs))
        top_prob = float(probs[top_idx])
        confidence_pct = round(top_prob * 100.0, 2)
        top_class = self.idx_to_class[top_idx]

        probabilities_dict = {
            self.classes[i]: round(float(probs[i]), 4)
            for i in range(len(self.classes))
        }

        # Step 5: Confidence thresholding
        is_reliable = confidence_pct >= threshold
        if is_reliable:
            prediction_display = top_class
            status_text = "High Confidence"
        else:
            prediction_display = "Uncertain Prediction"
            status_text = f"Low Confidence (< {threshold}%)"

        cat = self.class_categories.get(top_class, "unknown")
        knowledge = CASHEW_KNOWLEDGE_BASE.get(top_class, {})

        explanation = (
            f"Foliage analyzed as {top_class} ({cat.upper()}) with {confidence_pct}% model certainty. "
            f"{knowledge.get('description', '')} {knowledge.get('recommendation', '')}"
            if is_reliable
            else (
                f"The model predicted {top_class} with only {confidence_pct}% confidence, which is below "
                f"the reliable threshold of {threshold}%. "
                f"The model is not sufficiently confident about this image. "
                f"Please capture a clear image of the cashew leaf under good lighting and ensure that the leaf is clearly visible."
            )
        )

        return {
            "success": True,
            "crop_type": "Cashew",
            "prediction": prediction_display,
            "predicted_class_raw": top_class,
            "display_name": top_class,
            "category": cat,
            "confidence": confidence_pct,
            "reliable": is_reliable,
            "status": status_text,
            "threshold_used": threshold,
            "probabilities": probabilities_dict,
            "explanation": explanation,
            "disease_details": knowledge,
            "quality_assessment": quality_assessment,
        }


_CASHEW_PREDICTOR = None


def get_cashew_predictor() -> CashewLeafPredictor:
    """Singleton getter for Cashew predictor."""
    global _CASHEW_PREDICTOR
    if _CASHEW_PREDICTOR is None:
        _CASHEW_PREDICTOR = CashewLeafPredictor()
    return _CASHEW_PREDICTOR
