"""
Cotton Leaf Disease & Pest — Production Inference Predictor.
Supports both file-path and raw-bytes inputs (for FastAPI integration).
Returns structured prediction with confidence, class probabilities,
display names, categories, and quality check.
"""

import os
import sys
import io
import json
from typing import Dict, Optional, Union

from PIL import Image
import torch
import torchvision.transforms as transforms

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.model import build_model
from ml.src.utils import load_config

# Singleton cache
_COTTON_PREDICTOR = None


def get_cotton_predictor():
    """Singleton factory for the Cotton predictor."""
    global _COTTON_PREDICTOR
    if _COTTON_PREDICTOR is None:
        _COTTON_PREDICTOR = CottonLeafPredictor()
    return _COTTON_PREDICTOR


class CottonLeafPredictor:
    """
    Loads the trained Cotton model and provides .predict() for single-image inference.
    """

    def __init__(self, config_path: str = "ml/config_cotton.yaml"):
        self.config_path = config_path if os.path.isabs(config_path) else os.path.join(REPO_ROOT, config_path)
        self.config = load_config(self.config_path)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        save_dir = os.path.join(REPO_ROOT, self.config["model"]["save_dir"])
        self.model_path = os.path.join(save_dir, "best_model.pth")
        metadata_path = os.path.join(save_dir, "model_metadata.json")
        class_names_path = os.path.join(save_dir, "class_names.json")

        self.model = None
        self.model_loaded = False
        self.classes = self.config["classes"]
        self.confidence_threshold = self.config["inference"]["confidence_threshold"]

        if not os.path.exists(self.model_path):
            print(f"[Cotton] Warning: best_model.pth not found in {save_dir}. Model not loaded.")
            return

        # Load metadata
        if os.path.exists(metadata_path):
            with open(metadata_path) as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {}

        # Load class names mapping  {idx_str: {original_label, display_name, category}}
        if os.path.exists(class_names_path):
            with open(class_names_path) as f:
                self.class_names = json.load(f)
        else:
            self.class_names = {}

        num_classes = self.config["model"]["num_classes"]

        self.model = build_model(
            backbone_name=self.config["model"]["architecture"],
            num_classes=num_classes,
            pretrained=False,
            dropout_rate=self.config["model"]["dropout"],
        )
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model = self.model.to(self.device)
        self.model.eval()
        self.model_loaded = True
        print(f"[Cotton] Model loaded successfully ({num_classes} classes)")

        inp = self.config["model"]["input_size"]
        self.transform = transforms.Compose([
            transforms.Resize((inp, inp)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    # ── Public API ─────────────────────────────────────────────────────────

    def predict(
        self,
        image_input: Union[bytes, str],
        confidence_threshold: Optional[float] = None,
    ) -> Dict:
        """
        Run inference on a single image.

        Parameters
        ----------
        image_input : bytes | str
            Raw image bytes (from FastAPI upload) **or** an absolute file path.
        confidence_threshold : float, optional
            Override the config threshold (0.0–100.0).

        Returns
        -------
        dict  with keys: success, crop, prediction, class_probabilities, …
        """
        if not self.model_loaded:
            return {
                "success": False,
                "message": "Model is not loaded. Training may still be in progress.",
                "status": "MODEL_NOT_READY",
            }

        threshold = (confidence_threshold if confidence_threshold is not None
                     else self.confidence_threshold) / 100.0

        # ── Open image ────────────────────────────────────────────────────
        try:
            if isinstance(image_input, bytes):
                image = Image.open(io.BytesIO(image_input)).convert("RGB")
            else:
                image = Image.open(image_input).convert("RGB")
        except Exception as e:
            return {"success": False, "message": f"Cannot open image: {e}", "status": "ERROR"}

        tensor = self.transform(image).unsqueeze(0).to(self.device)

        # ── Inference ─────────────────────────────────────────────────────
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]

        max_prob, max_idx = torch.max(probs, 0)
        max_prob_val = max_prob.item()
        pred_idx = max_idx.item()

        # Build class probability dict using display names
        class_probs = {}
        for idx in range(len(self.classes)):
            info = self.class_names.get(str(idx), {})
            name = info.get("display_name", self.classes[idx])
            class_probs[name] = round(probs[idx].item(), 4)

        pred_info = self.class_names.get(str(pred_idx), {})
        display_name = pred_info.get("display_name", self.classes[pred_idx])
        original_label = pred_info.get("original_label", self.classes[pred_idx])
        category = pred_info.get("category", "Unknown")

        if max_prob_val < threshold:
            return {
                "success": True,
                "crop": "Cotton",
                "prediction": {
                    "class": "Uncertain",
                    "original_label": "",
                    "category": "",
                    "confidence": round(max_prob_val, 4),
                },
                "message": "The model is not sufficiently confident. Please capture a clearer image of the cotton leaf.",
                "class_probabilities": class_probs,
            }

        return {
            "success": True,
            "crop": "Cotton",
            "prediction": {
                "class": display_name,
                "original_label": original_label,
                "category": category,
                "confidence": round(max_prob_val, 4),
            },
            "class_probabilities": class_probs,
        }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Cotton Leaf Predictor CLI")
    parser.add_argument("--image", required=True, help="Path to a cotton leaf image")
    args = parser.parse_args()

    predictor = get_cotton_predictor()
    result = predictor.predict(args.image)
    print(json.dumps(result, indent=2))
