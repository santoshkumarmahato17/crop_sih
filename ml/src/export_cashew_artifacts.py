"""
Export production artifacts for Cashew leaf classifier:
- PyTorch model checkpoint
- TorchScript Mobile (.pt)
- Class metadata & categories
- Model architecture metadata
- Training history visual & JSON
"""

import os
import sys
import torch

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import save_json, plot_training_history, load_json
from ml.src.model import build_model
from ml.src.dataset_cashew import CANONICAL_CASHEW_CLASSES, CLASS_CATEGORIES


def export_cashew_artifacts():
    pth_path = os.path.join(REPO_ROOT, "ml", "models_cashew", "best_model", "best_model.pth")
    if not os.path.exists(pth_path):
        raise FileNotFoundError(f"Checkpoint not found at {pth_path}")

    checkpoint = torch.load(pth_path, map_location="cpu")
    class_names = checkpoint["class_names"]
    num_classes = len(class_names)
    img_size = checkpoint["config"]["model"]["input_size"]
    best_val_acc = checkpoint["best_val_acc"]
    best_epoch = checkpoint["best_epoch"]

    models_dir = os.path.join(REPO_ROOT, "ml", "models_cashew")
    best_model_dir = os.path.join(models_dir, "best_model")
    reports_dir = os.path.join(REPO_ROOT, "ml", "reports_cashew")
    os.makedirs(best_model_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # 1. Build and load model
    model = build_model(
        num_classes=num_classes,
        backbone_name=checkpoint["config"]["model"]["architecture"],
        pretrained=False,
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # 2. Export TorchScript Mobile artifact
    mobile_pt_path = os.path.join(best_model_dir, "best_model_mobile.pt")
    model.export_torchscript(mobile_pt_path, input_size=img_size)
    print(f"[Export] Mobile TorchScript model saved: {mobile_pt_path} ({os.path.getsize(mobile_pt_path)/(1024*1024):.2f} MB)")

    # 3. Class metadata
    class_meta = {
        "classes": [
            {
                "id": i,
                "name": name,
                "category": CLASS_CATEGORIES.get(name, "unknown"),
                "scientific_name": {
                    "Anthracnose": "Colletotrichum gloeosporioides",
                    "Gummosis": "Lasiodiplodia theobromae",
                    "Healthy": "Anacardium occidentale (Healthy Foliage)",
                    "Leaf Miner": "Acrocercops syngramma",
                    "Red Rust": "Cephaleuros virescens",
                }.get(name, "Cashew condition"),
                "urgency": "High" if name in ["Anthracnose", "Gummosis", "Leaf Miner"] else "Medium" if name == "Red Rust" else "None",
                "recommendation": {
                    "Anthracnose": "Apply Copper Oxychloride (0.2%) or Mancozeb at flushing and flowering; prune and incinerate blighted twigs 10 cm below necrotic margins.",
                    "Gummosis": "Scrape oozing cankers carefully; apply Bordeaux paste (1%) or Copper fungicide to infected trunk/branch wounds; improve soil drainage.",
                    "Healthy": "Maintain standard cashew orchard sanitation, balanced N-P-K nutrient application, and routine canopy scouting.",
                    "Leaf Miner": "Apply Neem Seed Kernel Extract (NSKE 5%) or Spinosad on tender flush shoots; avoid broad-spectrum pyrethroids to preserve natural eulophid parasitoids.",
                    "Red Rust": "Spray Copper Hydroxide (0.2%) or Bordeaux mixture (1%) during moist flush periods; prune overly dense inner canopy branches to boost airflow.",
                }.get(name, "Maintain standard cashew orchard management."),
            }
            for i, name in enumerate(class_names)
        ]
    }
    save_json(class_names, os.path.join(best_model_dir, "class_names.json"))
    save_json(class_names, os.path.join(models_dir, "class_names.json"))
    save_json(class_meta, os.path.join(models_dir, "class_metadata.json"))

    # 4. Model metadata
    param_count = sum(p.numel() for p in model.parameters())
    model_metadata = {
        "model_name": "Cashew Leaf Condition Classifier",
        "architecture": checkpoint["config"]["model"]["architecture"],
        "num_classes": len(class_names),
        "classes": class_names,
        "input_resolution": [img_size, img_size],
        "input_channels": 3,
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "parameter_count": param_count,
        "model_size_mb": round(os.path.getsize(pth_path) / (1024 * 1024), 2),
        "best_epoch": best_epoch,
        "best_val_accuracy": round(best_val_acc, 2),
    }
    save_json(model_metadata, os.path.join(best_model_dir, "model_metadata.json"))
    save_json(model_metadata, os.path.join(models_dir, "model_metadata.json"))

    print("[Success] All Cashew export artifacts saved successfully!")


if __name__ == "__main__":
    export_cashew_artifacts()
