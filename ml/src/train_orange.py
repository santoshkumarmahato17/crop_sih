import os
import sys
import time
import copy
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import set_seed, load_config, save_json, plot_training_history
from ml.src.dataset_orange import get_orange_dataloaders
from ml.src.model import build_model

def compute_class_weights(dataset, num_classes: int) -> torch.Tensor:
    counts = [0] * num_classes
    for s in dataset.dataset.samples:
        counts[s["class_name"]] += 1
    # Actually s["class_name"] is a string, wait. Let's compute weights efficiently using class_to_idx
    # This function expects dataset loader, let's fix it below.
    pass

def train_orange_model(config_path: str = "ml/config_orange.yaml") -> Dict:
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    
    set_seed(config["dataset"]["random_seed"])
    
    device = torch.device(config["training"]["device"] if torch.cuda.is_available() else "cpu")
    if torch.cuda.is_available():
        device = torch.device("cuda")
    print(f"[Orange Training] Using device: {device}")
    
    train_loader, val_loader, test_loader, class_to_idx = get_orange_dataloaders(
        config_path=config_path,
        batch_size=config["training"]["batch_size"],
        num_workers=config["training"]["num_workers"]
    )
    
    num_classes = config["model"]["num_classes"]
    
    # Compute weights
    counts = [0] * num_classes
    for s in train_loader.dataset.samples:
        idx = class_to_idx[s["class_name"]]
        counts[idx] += 1
    total = len(train_loader.dataset.samples)
    weights = [total / (num_classes * max(1, count)) for count in counts]
    weights_tensor = torch.tensor(weights, dtype=torch.float32).to(device)
    
    model = build_model(
        backbone_name=config["model"]["architecture"],
        num_classes=num_classes,
        pretrained=config["model"]["pretrained"],
        dropout_rate=config["model"]["dropout"]
    ).to(device)
    
    criterion = nn.CrossEntropyLoss(weight=weights_tensor if config["training"]["use_class_weights"] else None)
    
    epochs = config["training"]["fine_tune_epochs"]
    optimizer = torch.optim.AdamW(
        model.parameters(), 
        lr=config["training"]["fine_tune_lr"], 
        weight_decay=config["training"]["weight_decay"]
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=config["training"]["min_lr"])
    
    save_dir = os.path.join(REPO_ROOT, config["model"]["save_dir"])
    os.makedirs(save_dir, exist_ok=True)
    
    best_val_loss = float("inf")
    best_model_wts = copy.deepcopy(model.state_dict())
    
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": [], "val_f1": []}
    
    for epoch in range(epochs):
        start_time = time.time()
        
        # Train
        model.train()
        running_loss, correct, total_s = 0.0, 0, 0
        for images, targets, _ in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == targets).sum().item()
            total_s += targets.size(0)
            
        train_loss = running_loss / total_s
        train_acc = (correct / total_s) * 100.0
        
        # Validate
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        all_preds, all_targets = [], []
        with torch.no_grad():
            for images, targets, _ in val_loader:
                images, targets = images.to(device), targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)
                
                val_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                val_correct += (predicted == targets).sum().item()
                val_total += targets.size(0)
                
                all_preds.extend(predicted.cpu().numpy().tolist())
                all_targets.extend(targets.cpu().numpy().tolist())
                
        val_loss = val_loss / val_total
        val_acc = (val_correct / val_total) * 100.0
        val_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0) * 100.0
        
        scheduler.step()
        
        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["train_acc"].append(train_acc)
        history["val_acc"].append(val_acc)
        history["val_f1"].append(val_f1)
        
        print(f"Epoch {epoch+1}/{epochs} - Train Loss: {train_loss:.4f}, Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f}, Acc: {val_acc:.2f}%, F1: {val_f1:.2f}%")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_wts = copy.deepcopy(model.state_dict())
            torch.save(best_model_wts, os.path.join(save_dir, "best_model.pth"))
            
    # Load best model and export mobile version
    model.load_state_dict(best_model_wts)
    model.eval()
    
    try:
        example_input = torch.randn(1, 3, config["model"]["input_size"], config["model"]["input_size"]).to(device)
        traced_script_module = torch.jit.trace(model, example_input)
        mobile_path = os.path.join(save_dir, "best_model_mobile.pt")
        traced_script_module.save(mobile_path)
        print(f"Saved optimized mobile model to: {mobile_path}")
    except Exception as e:
        print(f"Warning: Failed to trace model for mobile. {e}")
        
    # Save metadata
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    metadata = {
        "model_architecture": config["model"]["architecture"],
        "num_classes": num_classes,
        "input_size": config["model"]["input_size"],
        "idx_to_class": idx_to_class,
        "class_categories": config["class_categories"],
        "best_val_loss": best_val_loss,
        "final_val_acc": val_acc,
        "final_val_f1": val_f1
    }
    save_json(metadata, os.path.join(save_dir, "model_metadata.json"))
    save_json(idx_to_class, os.path.join(save_dir, "class_names.json"))
    
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)
    save_json(history, os.path.join(reports_dir, "training_history.json"))
    
    return metadata

if __name__ == "__main__":
    train_orange_model()
