"""
Production Inference Engine for 5-Class Cassava Leaf Disease & Pest Classification.
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
from ml.src.dataset_cassava import CANONICAL_CASSAVA_CLASSES, CLASS_CATEGORIES
from ml.src.model import build_model

CASSAVA_KNOWLEDGE_BASE = {
    "Bacterial Blight": {
        "scientific_name": "Xanthomonas axonopodis pv. manihotis",
        "category": "disease",
        "condition_type": "Bacterial Foliar & Vascular Blight",
        "urgency": "High",
        "description": "Angular water-soaked foliar spots, yellow chlorotic margins, leaf wilting, and white or amber gum exudates on petioles and stems.",
        "recommendation": "Prune infected shoots; apply copper-based bactericides (Copper Oxychloride 50 WP); plant certified disease-free stem cuttings; destroy and burn severely blighted residues.",
    },
    "Brown Spot": {
        "scientific_name": "Passalora henningsii",
        "category": "disease",
        "condition_type": "Fungal Foliar Spot",
        "urgency": "Low to Moderate",
        "description": "Circular to subcircular brown necrotic spots with distinct dark borders and yellow halos on older leaves, leading to premature leaf drop.",
        "recommendation": "Enhance plant spacing to improve canopy aeration; apply protective fungicides like Mancozeb 75 WP or Chlorothalonil if spotting reaches upper functional leaves.",
    },
    "Green Mite": {
        "scientific_name": "Mononychellus tanajoa (Bondar)",
        "category": "pest",
        "condition_type": "Acarine Foliar Pest (Pest Infestation)",
        "urgency": "High",
        "description": "Tiny yellow-green mites on young apical leaves, causing chlorotic yellow pinprick stippling, leaf distortion, reduced leaf area, and 'candlestick' shoot tip symptom.",
        "recommendation": "Introduce predatory phytoseiid mites (Typhlodromalus aripo) for biological control; spray bio-acaricides or Neem seed kernel extract (NSKE 5%); avoid broad-spectrum pyrethroids.",
    },
    "Healthy": {
        "scientific_name": "Manihot esculenta (Healthy Foliage)",
        "category": "healthy",
        "condition_type": "Optimal Foliage Health",
        "urgency": "None",
        "description": "Vibrant green palmate leaf lobes with uniform chlorophyll density, clean vein architecture, and absence of bacterial exudates, spots, or stippling.",
        "recommendation": "Maintain balanced N-P-K fertilization (potassium is crucial for root tuber enlargement) and continue regular bi-weekly pest scouting.",
    },
    "Mosaic": {
        "scientific_name": "Cassava mosaic begomoviruses (ACMV / EACMV)",
        "category": "disease",
        "condition_type": "Viral Pathology (Whitefly Vectored)",
        "urgency": "Critical",
        "description": "Conspicuous yellow-green chlorotic mosaic mottling across leaf blades, leaf curling, misshapen asymmetric lobes, and severe stunted growth.",
        "recommendation": "Immediately rogue out and bury/burn infected plants; plant certified CMD-tolerant varieties; manage whitefly (Bemisia tabaci) vectors with sticky traps and bio-pesticides.",
    },
}


class CassavaLeafPredictor:
    """
    Production inference engine for 5-class Cassava Pest & Disease diagnosis.
    """

    def __init__(
        self,
        config_path: str = "ml/config_cassava.yaml",
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

        self.classes = CANONICAL_CASSAVA_CLASSES
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
        print(f"[Cassava Predictor] Loaded model weights from: {model_weights_path}")

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
                    "crop_type": "Cassava",
                    "prediction": "Poor Image Quality",
                    "category": "unknown",
                    "confidence": 0.0,
                    "reliable": False,
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
        knowledge = CASSAVA_KNOWLEDGE_BASE.get(top_class, {})

        explanation = (
            f"Foliage analyzed as {top_class} ({cat.upper()}) with {confidence_pct}% model certainty. "
            f"{knowledge.get('description', '')} {knowledge.get('recommendation', '')}"
            if is_reliable
            else (
                f"The model predicted {top_class} with only {confidence_pct}% confidence, which is below "
                f"the reliable threshold of {threshold}%. Please take a clearer, well-lit photo of the cassava leaf."
            )
        )

        return {
            "success": True,
            "crop_type": "Cassava",
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


_CASSAVA_PREDICTOR = None


def get_cassava_predictor() -> CassavaLeafPredictor:
    """Singleton getter for Cassava predictor."""
    global _CASSAVA_PREDICTOR
    if _CASSAVA_PREDICTOR is None:
        _CASSAVA_PREDICTOR = CassavaLeafPredictor()
    return _CASSAVA_PREDICTOR
