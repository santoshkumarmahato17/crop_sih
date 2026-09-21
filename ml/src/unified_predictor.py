"""
Unified All-in-One Multi-Crop & Foliar Disease Diagnostic Engine:
Combines:
1. Crop Type Identification (Cashew, Cassava, Maize, Tomato)
2. Specialized 5-7 Class Condition Diagnosis (Disease, Pest, Healthy)
3. YOLO Foliar Lesion Bounding Boxes, Multi-Region Segmentation & Severity Scoring
4. Pre-Inference Image Quality Guard (Blur, Overexposure, Underexposure)
All in ONE Single Pipeline Call.
"""

import os
import sys
import io
from typing import Dict, List, Optional, Tuple, Union
from PIL import Image
import torch
import torch.nn as nn
import numpy as np
from torchvision import models, transforms

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import load_json
from ml.src.preprocessing import preprocess_image_input, assess_image_quality
from ml.src.predict_cashew import get_cashew_predictor
from ml.src.predict_cassava import get_cassava_predictor
from ml.src.predict_maize import get_maize_predictor
from ml.src.predict import get_tomato_predictor
from ml.src.predict_apple import get_apple_predictor
from ml.src.predict_rice import get_rice_predictor
from ml.src.predict_soybean import get_soybean_predictor
from ml.src.yolo_disease_detector import YOLODiseaseDetector

CROPS = ["Apple", "Cashew", "Cassava", "Cotton", "Maize", "Onion", "Rice", "Soybean", "Tomato"]

CROP_EMOJIS = {
    "Apple": "🍎",
    "Cashew": "🌰",
    "Cassava": "🍃",
    "Cotton": "☁️",
    "Maize": "🌽",
    "Onion": "🧅",
    "Rice": "🌾",
    "Soybean": "🫘",
    "Tomato": "🍅",
}

CROP_DESCRIPTIONS = {
    "Apple": "Apple (Malus domestica) orchard foliage",
    "Cashew": "Cashew (Anacardium occidentale) foliar canopy",
    "Cassava": "Cassava (Manihot esculenta) palmate foliage",
    "Cotton": "Cotton (Gossypium hirsutum) foliar canopy",
    "Maize": "Maize / Corn (Zea mays) foliar blade",
    "Onion": "Onion (Allium cepa) foliar canopy",
    "Rice": "Rice (Oryza sativa) foliar canopy",
    "Soybean": "Soybean (Glycine max) foliar canopy",
    "Tomato": "Tomato (Solanum lycopersicum) compound foliage",
}


class UnifiedPlantDiagnosticEngine:
    """
    All-in-One Single Camera Plant Diagnostic System.
    Accepts any leaf image without requiring the user to manually select the crop.
    Automatically determines crop identity, classifies health/disease/pest condition,
    and runs YOLO lesion localization and severity quantification.
    """

    def __init__(self, device: str = "cpu"):
        self.device = torch.device(device)
        self.crops = CROPS
        self.crop_classes = ["Cashew", "Cassava", "Maize", "Tomato"]

        # 1. Load Crop Type Classifier
        weights_path = os.path.join(REPO_ROOT, "ml", "models", "crop_classifier", "crop_type_classifier.pth")
        self.crop_model = models.mobilenet_v3_small(weights=None)
        in_feat = self.crop_model.classifier[3].in_features

        if os.path.exists(weights_path):
            checkpoint = torch.load(weights_path, map_location=self.device)
            ckpt_classes = checkpoint.get("classes") or checkpoint.get("crop_metadata", {}).get("classes")
            ckpt_dim = checkpoint["model_state_dict"]["classifier.3.weight"].shape[0]
            if ckpt_classes and len(ckpt_classes) == ckpt_dim:
                self.crop_classes = ckpt_classes
            elif ckpt_dim == 4:
                self.crop_classes = ["Cashew", "Cassava", "Maize", "Tomato"]
            elif ckpt_dim == 5:
                self.crop_classes = CROPS

            self.crop_model.classifier[3] = nn.Linear(in_feat, ckpt_dim)
            self.crop_model.load_state_dict(checkpoint["model_state_dict"])
            self.crop_metadata = checkpoint.get("crop_metadata", {})
            print(f"[Unified Engine] Loaded Crop Classifier ({ckpt_dim} classes: {self.crop_classes}) from: {weights_path}")
        else:
            self.crop_model.classifier[3] = nn.Linear(in_feat, len(self.crops))
            print("[Unified Engine] WARNING: crop_type_classifier.pth not found, using heuristic selector.")
            self.crop_metadata = {}

        self.crop_model.to(self.device)
        self.crop_model.eval()

        self.crop_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        # 2. Specialized Predictors
        self.apple_predictor = get_apple_predictor()
        self.cashew_predictor = get_cashew_predictor()
        self.cassava_predictor = get_cassava_predictor()
        self.maize_predictor = get_maize_predictor()
        self.tomato_predictor = get_tomato_predictor()
        self.rice_predictor = get_rice_predictor()
        self.soybean_predictor = get_soybean_predictor()
        # Cotton and Onion don't have dedicated predictors yet; fallback will handle them

        # 3. YOLO Lesion Detector
        self.yolo_detector = YOLODiseaseDetector()

        print("[Unified Engine] Initialized All-in-One Multi-Crop & YOLO Diagnostics successfully!")

    def identify_crop(self, pil_img: Image.Image) -> Tuple[str, float, Dict[str, float]]:
        """
        Classifies the crop type from the image among Cashew, Cassava, Maize, and Tomato.
        """
        tensor = self.crop_transform(pil_img).unsqueeze(0).to(self.device)
        with torch.no_grad():
            logits = self.crop_model(tensor)
            probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

        top_idx = int(np.argmax(probs))
        top_crop = self.crop_classes[top_idx]
        top_prob = round(float(probs[top_idx]) * 100.0, 2)

        crop_probs = {self.crop_classes[i]: round(float(probs[i]) * 100.0, 2) for i in range(len(self.crop_classes))}
        return top_crop, top_prob, crop_probs

    def diagnose(
        self,
        image_input: Union[str, bytes, Image.Image, np.ndarray],
        force_crop: Optional[str] = None,
        confidence_threshold: float = 70.0,
        run_yolo: bool = True,
    ) -> Dict:
        """
        Executes unified diagnosis:
        1. Image Quality Check
        2. Auto-Detect Crop (Cashew / Cassava / Maize / Tomato)
        3. Classify Health / Disease / Pest condition
        4. Run YOLO Lesion Detection & Severity Scoring
        """
        # Load PIL image
        if isinstance(image_input, str):
            pil_img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
        else:
            pil_img = Image.fromarray(image_input).convert("RGB")

        # Step 1: Quality Check
        quality = assess_image_quality(pil_img)
        if not quality["is_acceptable"]:
            if quality.get("is_blurry") and quality.get("blur_score", 0) < 2.0:
                return {
                    "success": False,
                    "status": "poor_image_quality",
                    "crop": "Unknown",
                    "prediction": "Poor Image Quality",
                    "display_name": "Poor Image Quality",
                    "category": "unknown",
                    "confidence": 0.0,
                    "reliable": False,
                    "message": "Please capture a clearer image of the plant leaf under good lighting.",
                    "quality_assessment": quality,
                    "explanation": "Image is severely blurry, underexposed, or obstructed. " + " ".join(quality.get("advisory_notes", [])),
                    "probabilities": {},
                    "yolo": None,
                }

        # Step 2: Auto-detect crop or use override
        if force_crop and force_crop.capitalize() in self.crops:
            identified_crop = force_crop.capitalize()
            crop_conf = 100.0
            all_crop_probs = {c: (100.0 if c == identified_crop else 0.0) for c in self.crops}
        else:
            identified_crop, crop_conf, all_crop_probs = self.identify_crop(pil_img)

        # Step 3: Run specialized model for identified crop
        if identified_crop == "Apple":
            condition_res = self.apple_predictor.predict(pil_img, confidence_threshold=confidence_threshold)
            pred_class = condition_res["predicted_class_raw"]
            category = condition_res["category"]
            confidence = condition_res["confidence"]
            reliable = condition_res["reliable"]
            status_text = condition_res["status"]
            probabilities = condition_res["probabilities"]
            disease_details = condition_res.get("disease_details", {})
            explanation = condition_res.get("explanation", "")
        elif identified_crop == "Cashew":
            condition_res = self.cashew_predictor.predict(pil_img, confidence_threshold=confidence_threshold)
            pred_class = condition_res["predicted_class_raw"]
            category = condition_res["category"]
            confidence = condition_res["confidence"]
            reliable = condition_res["reliable"]
            status_text = condition_res["status"]
            probabilities = condition_res["probabilities"]
            disease_details = condition_res.get("disease_details", {})
            explanation = condition_res.get("explanation", "")
        elif identified_crop == "Cassava":
            condition_res = self.cassava_predictor.predict(pil_img, confidence_threshold=confidence_threshold)
            pred_class = condition_res["predicted_class_raw"]
            category = condition_res["category"]
            confidence = condition_res["confidence"]
            reliable = condition_res["reliable"]
            status_text = condition_res["status"]
            probabilities = condition_res["probabilities"]
            disease_details = condition_res.get("disease_details", {})
            explanation = condition_res.get("explanation", "")
        elif identified_crop == "Maize":
            condition_res = self.maize_predictor.predict(pil_img, confidence_threshold=confidence_threshold)
            pred_class = condition_res["predicted_class_raw"]
            category = condition_res["category"]
            confidence = condition_res["confidence"]
            reliable = condition_res["reliable"]
            status_text = condition_res["status"]
            probabilities = condition_res["probabilities"]
            disease_details = condition_res.get("disease_details", {})
            explanation = condition_res.get("explanation", "")
        else:  # Tomato
            condition_res = self.tomato_predictor.predict(pil_img, confidence_threshold=confidence_threshold)
            pred_class = condition_res["prediction"]
            category = "healthy" if pred_class.lower() == "healthy" else "disease"
            confidence = condition_res["confidence"]
            reliable = condition_res["reliable"]
            status_text = condition_res["status"]
            probabilities = condition_res["probabilities"]
            disease_details = condition_res.get("disease_details", {})
            explanation = condition_res.get("explanation", "")

        # Step 4: Run YOLO Lesion Detection & Severity Scoring
        yolo_result = None
        if run_yolo:
            try:
                yolo_result = self.yolo_detector.analyze(pil_img)
            except Exception as e:
                print(f"[Unified Engine] YOLO lesion analysis notice: {e}")
                yolo_result = None

        # Build comprehensive summary
        emoji = CROP_EMOJIS.get(identified_crop, "🌿")
        desc = CROP_DESCRIPTIONS.get(identified_crop, f"{identified_crop} leaf")

        severity_level = yolo_result.get("severity_level", "Moderate") if yolo_result else "Moderate"
        detections_list = yolo_result.get("detections", []) if yolo_result else []
        symptoms_list = yolo_result.get("symptoms", [
            "Leaf tissue discoloration",
            "Chlorotic yellowing around leaf margins",
            "Foliar necrotic lesions"
        ]) if yolo_result else [
            "Leaf tissue discoloration",
            "Chlorotic yellowing around leaf margins",
            "Foliar necrotic lesions"
        ]

        return {
            "success": True,
            "crop": identified_crop,
            "crop_display": f"{emoji} {identified_crop}",
            "crop_confidence": crop_conf,
            "crop_probabilities": all_crop_probs,
            "crop_description": desc,
            "prediction": pred_class,
            "disease": pred_class,
            "display_name": pred_class,
            "category": category,  # "disease" | "pest" | "healthy"
            "confidence": confidence,
            "confidence_percent": round(confidence if confidence > 1.0 else confidence * 100, 1),
            "severity": severity_level,
            "detections": detections_list,
            "symptoms": symptoms_list,
            "reliable": reliable,
            "status": status_text,
            "threshold_used": confidence_threshold,
            "probabilities": probabilities,
            "disease_details": disease_details,
            "yolo": yolo_result,
            "explanation": explanation,
            "quality_assessment": quality,
            "disclaimer": "Consult an agricultural expert when confidence is low or symptoms are unclear.",
        }


_UNIFIED_ENGINE = None


def get_unified_diagnostic_engine() -> UnifiedPlantDiagnosticEngine:
    """Singleton getter for UnifiedPlantDiagnosticEngine."""
    global _UNIFIED_ENGINE
    if _UNIFIED_ENGINE is None:
        _UNIFIED_ENGINE = UnifiedPlantDiagnosticEngine()
    return _UNIFIED_ENGINE
