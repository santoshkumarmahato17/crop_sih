import os
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'best_model.pth')
METADATA_PATH = os.path.join(MODELS_DIR, 'model_metadata.json')
CLASS_NAMES_PATH = os.path.join(MODELS_DIR, 'class_names.json')

class OrangeLeafPredictor:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.class_names = {}
        self.metadata = []
        self.load_metadata()
        self.load_model()
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def load_metadata(self):
        try:
            with open(CLASS_NAMES_PATH, 'r') as f:
                self.class_names = json.load(f)
            with open(METADATA_PATH, 'r') as f:
                self.metadata = json.load(f)
        except Exception as e:
            print(f"Error loading metadata: {e}")

    def load_model(self):
        try:
            num_classes = 5
            self.model = models.mobilenet_v3_small(weights=None)
            in_features = self.model.classifier[3].in_features
            self.model.classifier[3] = nn.Linear(in_features, num_classes)
            
            if os.path.exists(MODEL_PATH):
                self.model.load_state_dict(torch.load(MODEL_PATH, map_location=self.device))
                self.model.to(self.device)
                self.model.eval()
            else:
                print("Warning: Model file not found. Predictions will be untrained.")
        except Exception as e:
            print(f"Error loading model: {e}")

    def predict(self, image_bytes, threshold=0.70):
        if not self.model:
            return {"success": False, "message": "Model not loaded"}
            
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                output = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(output[0], dim=0)
                
            probs = probabilities.cpu().numpy()
            max_prob = float(max(probs))
            predicted_idx = int(torch.argmax(probabilities).item())
            
            class_probs = {}
            for idx, prob in enumerate(probs):
                name = self.class_names.get(str(idx), {}).get("display_name", f"Class_{idx}")
                class_probs[name] = float(prob)
                
            if max_prob < threshold:
                return {
                    "success": True,
                    "prediction": {
                        "class": "Uncertain",
                        "confidence": round(max_prob, 4)
                    },
                    "message": "The model is not confident enough. Please capture a clearer image.",
                    "class_probabilities": class_probs
                }
                
            class_info = self.class_names.get(str(predicted_idx), {})
            
            return {
                "success": True,
                "crop": "Orange",
                "prediction": {
                    "class": class_info.get("display_name", f"Class_{predicted_idx}"),
                    "original_label": class_info.get("original_label", ""),
                    "category": class_info.get("category", ""),
                    "confidence": round(max_prob, 4)
                },
                "class_probabilities": class_probs
            }
            
        except Exception as e:
            return {"success": False, "message": f"Prediction error: {str(e)}"}
