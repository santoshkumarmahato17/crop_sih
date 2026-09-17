import os
import sys
import json
from typing import Dict

import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import load_config, save_json
from ml.src.dataset_orange import get_orange_dataloaders
from ml.src.model import build_model

def evaluate_orange_model(config_path: str = "ml/config_orange.yaml") -> Dict:
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Orange Eval] Using device: {device}")
    
    _, _, test_loader, class_to_idx = get_orange_dataloaders(
        config_path=config_path,
        batch_size=config["training"]["batch_size"],
        num_workers=config["training"]["num_workers"]
    )
    
    num_classes = config["model"]["num_classes"]
    
    model = build_model(
        backbone_name=config["model"]["architecture"],
        num_classes=num_classes,
        pretrained=False,
        dropout_rate=config["model"]["dropout"]
    )
    
    save_dir = os.path.join(REPO_ROOT, config["model"]["save_dir"])
    model_path = os.path.join(save_dir, "best_model.pth")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained model not found at {model_path}")
        
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    
    all_preds = []
    all_targets = []
    all_probs = []
    
    print("[Orange Eval] Running inference on test set...")
    with torch.no_grad():
        for images, targets, _ in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            _, predicted = torch.max(outputs, 1)
            
            all_preds.extend(predicted.cpu().numpy().tolist())
            all_targets.extend(targets.numpy().tolist())
            all_probs.extend(probs.cpu().numpy().tolist())
            
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    target_names = [idx_to_class[i] for i in range(num_classes)]
    
    acc = accuracy_score(all_targets, all_preds)
    report_dict = classification_report(all_targets, all_preds, target_names=target_names, output_dict=True, zero_division=0)
    cm = confusion_matrix(all_targets, all_preds)
    
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)
    
    # Save JSON report
    save_json(report_dict, os.path.join(reports_dir, "classification_report.json"))
    
    # Plot Confusion Matrix
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=target_names, yticklabels=target_names)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.title('Confusion Matrix - Orange Leaf Disease')
    plt.tight_layout()
    plt.savefig(os.path.join(reports_dir, "confusion_matrix.png"))
    plt.close()
    
    print(f"Evaluation Complete. Test Accuracy: {acc*100:.2f}%")
    return report_dict

if __name__ == "__main__":
    evaluate_orange_model()
