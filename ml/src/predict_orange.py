import os
import sys
import json
from typing import Dict, Tuple

from PIL import Image
import torch
import torchvision.transforms as transforms

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.model import build_model
from ml.src.utils import load_config
from ml.src.preprocessing import is_valid_image

import io

class OrangeLeafPredictor:
    def __init__(self, config_path: str = "ml/config_orange.yaml"):
        self.config_path = config_path if os.path.isabs(config_path) else os.path.join(REPO_ROOT, config_path)
        self.config = load_config(self.config_path)
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        save_dir = os.path.join(REPO_ROOT, self.config["model"]["save_dir"])
        self.model_path = os.path.join(save_dir, "best_model.pth")
        self.metadata_path = os.path.join(save_dir, "model_metadata.json")
        
        self.model_loaded = False
        if not os.path.exists(self.model_path) or not os.path.exists(self.metadata_path):
            print(f"Warning: Model or metadata not found in {save_dir}. Training may still be in progress.")
            return
            
        with open(self.metadata_path, 'r') as f:
            self.metadata = json.load(f)
            
        self.idx_to_class = {int(k): v for k, v in self.metadata["idx_to_class"].items()}
        self.class_categories = self.metadata["class_categories"]
        
        self.model = build_model(
            backbone_name=self.metadata["model_architecture"],
            num_classes=self.metadata["num_classes"],
            pretrained=False
        )
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model = self.model.to(self.device)
        self.model.eval()
        self.model_loaded = True
        
        input_size = self.metadata["input_size"]
        self.transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
    def predict(self, image_input, threshold: float = None) -> Dict:
        """
        Runs full pipeline: quality check -> prediction -> formatting
        image_input: Can be bytes (from FastAPI upload) or string path
        """
        if not self.model_loaded:
            return {"success": False, "error": "Model is not loaded. Training might still be in progress.", "status": "MODEL_NOT_READY"}
            
        # 1. Quality Check
        if isinstance(image_input, str):
            valid, msg = is_valid_image(image_input, self.config["inference"])
            if not valid:
                return {"success": False, "error": msg, "status": "QUALITY_REJECTED"}
        
        # 2. Preprocess
        try:
            if isinstance(image_input, bytes):
                image = Image.open(io.BytesIO(image_input)).convert("RGB")
            else:
                image = Image.open(image_input).convert("RGB")
        except Exception as e:
            return {"success": False, "error": f"Failed to open image: {e}", "status": "ERROR"}
            
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # 3. Predict
        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]
            
        # 4. Format Output
        conf_thresh = threshold if threshold else self.config["inference"]["confidence_threshold"] / 100.0
        max_prob, max_idx = torch.max(probs, 0)
        max_prob_val = max_prob.item()
        
        if max_prob_val < conf_thresh:
             return {
                "success": True,
                "disease": "Unknown",
                "category": "unknown",
                "confidence": round(max_prob_val * 100, 2),
                "status": "LOW_CONFIDENCE",
                "message": f"Confidence ({max_prob_val*100:.1f}%) below threshold ({conf_thresh*100:.1f}%)"
            }
            
        pred_class = self.idx_to_class[max_idx.item()]
        pred_category = self.class_categories[pred_class]
        
        # Top 3 predictions for UI
        top3_prob, top3_idx = torch.topk(probs, min(3, len(probs)))
        alternatives = [
            {"class": self.idx_to_class[i.item()], "confidence": round(p.item() * 100, 2)}
            for p, i in zip(top3_prob, top3_idx)
        ]
        
        return {
            "success": True,
            "disease": pred_class,
            "category": pred_category,
            "confidence": round(max_prob_val * 100, 2),
            "status": "SUCCESS",
            "alternatives": alternatives
        }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, required=True, help="Path to test image")
    args = parser.parse_args()
    
    predictor = OrangeLeafPredictor()
    result = predictor.predict(args.image)
    print(json.dumps(result, indent=2))
