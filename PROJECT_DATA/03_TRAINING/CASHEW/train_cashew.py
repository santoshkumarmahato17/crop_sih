"""
Production Training Pipeline for 5-Class Cashew Leaf Disease & Pest Classification:
Two-stage transfer learning (warmup with frozen backbone -> fine-tuning),
class-weighted CrossEntropyLoss, AdamW optimizer, Cosine Annealing LR scheduler,
early stopping, metric monitoring, and checkpoint persistence.
"""

import os
import sys
import time
import copy
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import set_seed, load_config, save_json, load_json, plot_training_history
from ml.src.dataset_cashew import CashewLeafDataset, CANONICAL_CASHEW_CLASSES, CLASS_CATEGORIES
from ml.src.augmentation import get_training_transforms, get_validation_transforms
from ml.src.model import build_model


def compute_class_weights(train_samples: List[Dict], num_classes: int) -> torch.Tensor:
    """
    Compute balanced class weights for CrossEntropyLoss:
    weight[c] = total_samples / (num_classes * count[c])
    """
    counts = [0] * num_classes
    for s in train_samples:
        counts[s["class_idx"]] += 1

    total = len(train_samples)
    weights = [total / (num_classes * max(1, count)) for count in counts]
    weights_tensor = torch.tensor(weights, dtype=torch.float32)
    weights_tensor = weights_tensor / weights_tensor.mean()
    print(f"[Cashew Training] Class counts in training set: {counts}")
    print(f"[Cashew Training] Computed class weights: {[round(w, 3) for w in weights_tensor.tolist()]}")
    return weights_tensor


def run_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer = None,
    device: torch.device = torch.device("cpu"),
    is_training: bool = True,
) -> Tuple[float, float, List[int], List[int]]:
    if is_training:
        model.train()
    else:
        model.eval()

    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_targets = []

    ctx = torch.enable_grad() if is_training else torch.no_grad()
    with ctx:
        for images, targets, _ in dataloader:
            images = images.to(device)
            targets = targets.to(device)

            if is_training and optimizer is not None:
                optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, targets)

            if is_training and optimizer is not None:
                loss.backward()
                optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == targets).sum().item()
            total += targets.size(0)

            all_preds.extend(predicted.cpu().numpy().tolist())
            all_targets.extend(targets.cpu().numpy().tolist())

    epoch_loss = running_loss / max(1, total)
    epoch_acc = (correct / max(1, total)) * 100.0
    return epoch_loss, epoch_acc, all_preds, all_targets


def train_cashew_model():
    config_path = os.path.join(REPO_ROOT, "ml", "config_cashew.yaml")
    config = load_config(config_path)

    set_seed(config["dataset"]["random_seed"])

    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])
    train_samples = load_json(os.path.join(splits_dir, "train.json"))
    val_samples = load_json(os.path.join(splits_dir, "val.json"))

    class_names = CANONICAL_CASHEW_CLASSES
    class_to_idx = {cls_name: idx for idx, cls_name in enumerate(class_names)}
    idx_to_class = {idx: cls_name for cls_name, idx in class_to_idx.items()}

    for s in train_samples:
        s["class_idx"] = class_to_idx[s["class_name"]]
    for s in val_samples:
        s["class_idx"] = class_to_idx[s["class_name"]]

    img_size = config["model"]["input_size"]
    train_transform = get_training_transforms(img_size)
    val_transform = get_validation_transforms(img_size)

    train_dataset = CashewLeafDataset(train_samples, class_to_idx, transform=train_transform)
    val_dataset = CashewLeafDataset(val_samples, class_to_idx, transform=val_transform)

    batch_size = config["training"]["batch_size"]
    num_workers = config["training"]["num_workers"]

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=False,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False,
    )

    device = torch.device(config["training"]["device"])
    print(f"[Cashew Training] Target Device: {device}")
    print(f"[Cashew Training] Training Batches: {len(train_loader)} | Validation Batches: {len(val_loader)}")

    # Initialize model
    model = build_model(
        num_classes=len(class_names),
        backbone_name=config["model"]["architecture"],
        pretrained=config["model"]["pretrained"],
        dropout_rate=config["model"]["dropout"],
    ).to(device)

    # Class weights
    if config["training"]["use_class_weights"]:
        class_weights = compute_class_weights(train_samples, len(class_names)).to(device)
        criterion = nn.CrossEntropyLoss(weight=class_weights)
    else:
        criterion = nn.CrossEntropyLoss()

    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "learning_rates": [],
    }

    best_val_acc = 0.0
    best_model_weights = copy.deepcopy(model.state_dict())
    best_epoch = -1

    start_time = time.time()

    # =========================================================================
    # STAGE 1: Warmup with Frozen Backbone (Train Head Only)
    # =========================================================================
    warmup_epochs = config["training"]["warmup_epochs"]
    warmup_lr = config["training"]["warmup_lr"]

    print("\n" + "=" * 65)
    print(f"  STAGE 1: Linear Head Warmup ({warmup_epochs} Epochs, Backbone Frozen, LR: {warmup_lr})")
    print("=" * 65)

    model.freeze_backbone()

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(
        trainable_params,
        lr=warmup_lr,
        weight_decay=config["training"]["weight_decay"],
    )

    for epoch in range(1, warmup_epochs + 1):
        ep_start = time.time()
        train_loss, train_acc, _, _ = run_epoch(
            model, train_loader, criterion, optimizer, device, is_training=True
        )
        val_loss, val_acc, _, _ = run_epoch(
            model, val_loader, criterion, None, device, is_training=False
        )
        ep_duration = time.time() - ep_start

        current_lr = optimizer.param_groups[0]["lr"]
        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["learning_rates"].append(current_lr)

        print(
            f"Epoch {epoch:02d}/{warmup_epochs:02d} [Warmup] - "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
            f"Time: {ep_duration:.1f}s"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_weights = copy.deepcopy(model.state_dict())
            best_epoch = epoch

    # =========================================================================
    # STAGE 2: End-to-End Fine-Tuning (Full Architecture)
    # =========================================================================
    fine_tune_epochs = config["training"]["fine_tune_epochs"]
    fine_tune_lr = config["training"]["fine_tune_lr"]

    print("\n" + "=" * 65)
    print(f"  STAGE 2: Full Architecture Fine-Tuning ({fine_tune_epochs} Epochs, LR: {fine_tune_lr})")
    print("=" * 65)

    model.unfreeze_backbone()

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=fine_tune_lr,
        weight_decay=config["training"]["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=fine_tune_epochs,
        eta_min=config["training"]["min_lr"],
    )

    for epoch in range(1, fine_tune_epochs + 1):
        ep_start = time.time()
        overall_epoch = warmup_epochs + epoch
        current_lr = optimizer.param_groups[0]["lr"]

        train_loss, train_acc, _, _ = run_epoch(
            model, train_loader, criterion, optimizer, device, is_training=True
        )
        val_loss, val_acc, _, _ = run_epoch(
            model, val_loader, criterion, None, device, is_training=False
        )
        scheduler.step()
        ep_duration = time.time() - ep_start

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["learning_rates"].append(current_lr)

        improved = False
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_weights = copy.deepcopy(model.state_dict())
            best_epoch = overall_epoch
            improved = True

        status_flag = " [BEST SAVED]" if improved else ""
        print(
            f"Epoch {overall_epoch:02d}/{(warmup_epochs + fine_tune_epochs):02d} [Fine-Tune] - "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
            f"LR: {current_lr:.6f} | Time: {ep_duration:.1f}s{status_flag}"
        )

    total_time = time.time() - start_time
    print("\n" + "=" * 65)
    print(f"[Cashew Training Complete] Total Time: {total_time/60:.2f} min | Best Val Acc: {best_val_acc:.2f}% (Epoch {best_epoch})")
    print("=" * 65)

    # Load best checkpoint
    model.load_state_dict(best_model_weights)
    model.eval()

    # =========================================================================
    # PERSISTENCE & EXPORT
    # =========================================================================
    models_dir = os.path.join(REPO_ROOT, config["model"]["save_dir"])
    best_model_dir = os.path.join(models_dir, "best_model")
    os.makedirs(best_model_dir, exist_ok=True)

    # 1. PyTorch Best Model Checkpoint
    best_pth_path = os.path.join(best_model_dir, "best_model.pth")
    torch.save(
        {
            "model_state_dict": best_model_weights,
            "architecture": config["model"]["architecture"],
            "num_classes": len(class_names),
            "class_names": class_names,
            "class_to_idx": class_to_idx,
            "best_val_acc": float(best_val_acc),
            "best_epoch": int(best_epoch),
            "config": config,
        },
        best_pth_path,
    )
    print(f"[Export] PyTorch model saved to: {best_pth_path} ({os.path.getsize(best_pth_path)/(1024*1024):.2f} MB)")

    # 2. Mobile TorchScript Export
    mobile_pt_path = os.path.join(best_model_dir, "best_model_mobile.pt")
    model.export_torchscript(mobile_pt_path, input_size=img_size)
    print(f"[Export] Mobile TorchScript model saved to: {mobile_pt_path} ({os.path.getsize(mobile_pt_path)/(1024*1024):.2f} MB)")

    # 3. Class Names & Categories Metadata
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

    # 4. Model Metadata
    param_count = sum(p.numel() for p in model.parameters())
    model_metadata = {
        "model_name": "Cashew Leaf Condition Classifier",
        "architecture": config["model"]["architecture"],
        "num_classes": len(class_names),
        "classes": class_names,
        "input_resolution": [img_size, img_size],
        "input_channels": 3,
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "parameter_count": param_count,
        "model_size_mb": round(os.path.getsize(best_pth_path) / (1024 * 1024), 2),
        "best_epoch": best_epoch,
        "best_val_accuracy": round(best_val_acc, 2),
        "training_duration_min": round(total_time / 60, 2),
    }
    save_json(model_metadata, os.path.join(best_model_dir, "model_metadata.json"))
    save_json(model_metadata, os.path.join(models_dir, "model_metadata.json"))

    # 5. Training History Plot & JSON
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)
    save_json(history, os.path.join(reports_dir, "training_history.json"))
    save_json(history, os.path.join(best_model_dir, "training_history.json"))
    plot_training_history(history, os.path.join(reports_dir, "training_history.png"))
    plot_training_history(history, os.path.join(best_model_dir, "training_history.png"))

    print(f"\n[Artifacts] Training artifacts saved to: {best_model_dir}")


if __name__ == "__main__":
    train_cashew_model()
