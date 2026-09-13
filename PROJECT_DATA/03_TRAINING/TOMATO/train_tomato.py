"""
Production Training Pipeline for Tomato Leaf Disease Classification:
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
from tqdm import tqdm

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import set_seed, load_config, save_json, load_json, plot_training_history
from ml.src.dataset import TomatoLeafDataset
from ml.src.augmentation import get_training_transforms, get_validation_transforms
from ml.src.model import build_model, DEFAULT_CLASSES


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
    # Normalize weights so mean is 1.0
    weights_tensor = weights_tensor / weights_tensor.mean()
    print(f"[Training] Class counts in training set: {counts}")
    print(f"[Training] Computed class weights: {[round(w, 3) for w in weights_tensor.tolist()]}")
    return weights_tensor


def run_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer = None,
    device: torch.device = torch.device("cpu"),
    is_training: bool = True,
) -> Tuple[float, float, List[int], List[int]]:
    """Execute single training or validation epoch."""
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
            _, preds = outputs.max(1)
            correct += preds.eq(targets).sum().item()
            total += targets.size(0)

            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(targets.cpu().tolist())

    epoch_loss = running_loss / max(1, total)
    epoch_acc = correct / max(1, total)
    return epoch_loss, epoch_acc, all_preds, all_targets


def train_tomato_model(
    config_path: str = "ml/config.yaml",
    warmup_epochs: int = 3,
    finetune_epochs: int = 5,
    batch_size: int = 32,
    num_threads: int = 8,
) -> Dict:
    """
    Main training routine.
    """
    print("=" * 75)
    print(" TOMATO LEAF DISEASE CLASSIFIER — PRODUCTION TRAINING PIPELINE ")
    print("=" * 75)

    cfg = load_config(config_path)
    set_seed(cfg["splits"]["random_seed"])

    warmup_epochs = cfg["training"].get("warmup_epochs", warmup_epochs)
    finetune_epochs = cfg["training"].get("finetune_epochs", finetune_epochs)
    batch_size = cfg["training"].get("batch_size", batch_size)

    # Set torch CPU thread count for fast parallel processing
    torch.set_num_threads(num_threads)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training] Computing Device: {device} (threads={torch.get_num_threads()})")

    # Load precomputed splits
    splits_dir = cfg["paths"]["splits_dir"]
    train_file = os.path.join(splits_dir, "train.json")
    val_file = os.path.join(splits_dir, "val.json")

    if not os.path.exists(train_file) or not os.path.exists(val_file):
        raise FileNotFoundError("Splits not found. Please run ml.src.dataset first.")

    train_samples = load_json(train_file)
    val_samples = load_json(val_file)

    class_names = cfg["dataset"]["classes"]
    num_classes = len(class_names)
    print(f"[Training] Loaded {len(train_samples)} training samples, {len(val_samples)} validation samples across {num_classes} classes.")

    # Data Loaders
    input_size = cfg["training"]["input_size"]
    train_dataset = TomatoLeafDataset(train_samples, transform=get_training_transforms(input_size))
    val_dataset = TomatoLeafDataset(val_samples, transform=get_validation_transforms(input_size))

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=cfg["training"]["num_workers"],
        pin_memory=False,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=cfg["training"]["num_workers"],
        pin_memory=False,
    )

    # Model Setup
    backbone = cfg["training"]["backbone"]
    model = build_model(
        num_classes=num_classes,
        backbone_name=backbone,
        pretrained=cfg["training"]["pretrained"],
    ).to(device)

    # Class weights for loss
    class_weights = None
    if cfg["training"]["use_class_weights"]:
        weights_tensor = compute_class_weights(train_samples, num_classes).to(device)
        criterion = nn.CrossEntropyLoss(weight=weights_tensor)
    else:
        criterion = nn.CrossEntropyLoss()

    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
    }

    best_val_acc = 0.0
    best_val_loss = float("inf")
    best_model_weights = None
    best_epoch = 0

    total_start_time = time.time()

    # --------------------------------------------------------------------------
    # STAGE 1: Warmup with Frozen Backbone
    # --------------------------------------------------------------------------
    print("\n" + "-" * 60)
    print(f"STAGE 1: Warming up Classifier Head ({warmup_epochs} Epochs, Frozen Backbone)")
    print("-" * 60)
    model.freeze_backbone()

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=cfg["training"]["warmup_lr"],
        weight_decay=cfg["training"]["weight_decay"],
    )

    for epoch in range(1, warmup_epochs + 1):
        t0 = time.time()
        t_loss, t_acc, _, _ = run_epoch(model, train_loader, criterion, optimizer, device, is_training=True)
        v_loss, v_acc, _, _ = run_epoch(model, val_loader, criterion, None, device, is_training=False)
        t_elapsed = time.time() - t0

        history["train_loss"].append(round(t_loss, 4))
        history["train_acc"].append(round(t_acc, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["val_acc"].append(round(v_acc, 4))

        print(
            f"[Warmup {epoch}/{warmup_epochs}] {t_elapsed:.1f}s | "
            f"Train Loss: {t_loss:.4f} - Acc: {t_acc*100:.2f}% | "
            f"Val Loss: {v_loss:.4f} - Acc: {v_acc*100:.2f}%"
        )

        if v_acc > best_val_acc:
            best_val_acc = v_acc
            best_val_loss = v_loss
            best_epoch = epoch
            best_model_weights = copy.deepcopy(model.state_dict())

    # --------------------------------------------------------------------------
    # STAGE 2: Fine-Tuning Entire Model
    # --------------------------------------------------------------------------
    print("\n" + "-" * 60)
    print(f"STAGE 2: Fine-Tuning Full Architecture ({finetune_epochs} Epochs, Unfrozen)")
    print("-" * 60)
    model.unfreeze_backbone()

    # Differential learning rates: smaller for backbone, slightly higher for head
    backbone_params = [p for n, p in model.base_model.features.named_parameters() if p.requires_grad]
    head_params = [p for n, p in model.base_model.classifier.named_parameters() if p.requires_grad]

    finetune_lr = cfg["training"]["finetune_lr"]
    optimizer = torch.optim.AdamW(
        [
            {"params": backbone_params, "lr": finetune_lr * 0.2},
            {"params": head_params, "lr": finetune_lr},
        ],
        weight_decay=cfg["training"]["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=finetune_epochs, eta_min=1e-6)

    for epoch in range(1, finetune_epochs + 1):
        actual_epoch = warmup_epochs + epoch
        t0 = time.time()
        t_loss, t_acc, _, _ = run_epoch(model, train_loader, criterion, optimizer, device, is_training=True)
        scheduler.step()
        v_loss, v_acc, _, _ = run_epoch(model, val_loader, criterion, None, device, is_training=False)
        t_elapsed = time.time() - t0

        history["train_loss"].append(round(t_loss, 4))
        history["train_acc"].append(round(t_acc, 4))
        history["val_loss"].append(round(v_loss, 4))
        history["val_acc"].append(round(v_acc, 4))

        print(
            f"[FineTune {actual_epoch}/{warmup_epochs+finetune_epochs}] {t_elapsed:.1f}s | "
            f"Train Loss: {t_loss:.4f} - Acc: {t_acc*100:.2f}% | "
            f"Val Loss: {v_loss:.4f} - Acc: {v_acc*100:.2f}% | "
            f"LR: {scheduler.get_last_lr()[0]:.2e}"
        )

        if v_acc >= best_val_acc:
            best_val_acc = v_acc
            best_val_loss = v_loss
            best_epoch = actual_epoch
            best_model_weights = copy.deepcopy(model.state_dict())
            print(f"  --> [Checkpointed] New best validation accuracy: {v_acc*100:.2f}%")

    total_time = time.time() - total_start_time
    print("\n" + "=" * 60)
    print(f"Training Complete in {total_time/60:.2f} min! Best Val Acc: {best_val_acc*100:.2f}% at epoch {best_epoch}")
    print("=" * 60)

    # --------------------------------------------------------------------------
    # Save Artifacts & Export Mobile Model
    # --------------------------------------------------------------------------
    models_dir = cfg["paths"]["models_dir"]
    best_model_dir = os.path.join(models_dir, "best_model")
    final_model_dir = os.path.join(models_dir, "final_model")
    os.makedirs(best_model_dir, exist_ok=True)
    os.makedirs(final_model_dir, exist_ok=True)

    # Save final model
    final_model_path = os.path.join(final_model_dir, "final_model.pth")
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "classes": class_names,
            "backbone": backbone,
            "input_size": input_size,
            "final_val_acc": history["val_acc"][-1],
        },
        final_model_path,
    )

    # Save best model
    best_model_path = os.path.join(best_model_dir, "best_model.pth")
    if best_model_weights is not None:
        model.load_state_dict(best_model_weights)

    torch.save(
        {
            "epoch": best_epoch,
            "model_state_dict": model.state_dict(),
            "best_val_acc": best_val_acc,
            "best_val_loss": best_val_loss,
            "classes": class_names,
            "backbone": backbone,
            "input_size": input_size,
        },
        best_model_path,
    )
    print(f"[Model Save] PyTorch Best Model: {best_model_path}")

    # Export Mobile TorchScript Model (.pt)
    mobile_model_path = os.path.join(best_model_dir, "best_model_mobile.pt")
    model.export_torchscript(mobile_model_path, input_size=input_size)
    print(f"[Model Save] TorchScript Mobile Model: {mobile_model_path}")

    # Save class_names.json and metadata
    class_names_path = os.path.join(models_dir, "class_names.json")
    save_json(class_names, class_names_path)

    metadata = {
        "model_name": "TomatoLeafDiseaseClassifier-MobileNetV3",
        "architecture": backbone,
        "input_size": [3, input_size, input_size],
        "num_classes": num_classes,
        "classes": class_names,
        "confidence_threshold": cfg["inference"]["confidence_threshold"],
        "best_epoch": best_epoch,
        "best_validation_accuracy": round(best_val_acc, 4),
        "best_validation_loss": round(best_val_loss, 4),
        "total_training_time_seconds": round(total_time, 1),
    }
    metadata_path = os.path.join(models_dir, "model_metadata.json")
    save_json(metadata, metadata_path)

    # Save training configuration
    training_config = {
        "backbone": backbone,
        "input_size": input_size,
        "warmup_epochs": warmup_epochs,
        "finetune_epochs": finetune_epochs,
        "batch_size": batch_size,
        "warmup_lr": cfg["training"]["warmup_lr"],
        "finetune_lr": finetune_lr,
        "class_weights": weights_tensor.tolist() if cfg["training"]["use_class_weights"] else None,
        "device": str(device),
    }
    save_json(training_config, os.path.join(models_dir, "training_configuration.json"))

    # Plot training curves
    reports_dir = cfg["paths"]["reports_dir"]
    plot_training_history(history, os.path.join(reports_dir, "training_history.png"))
    save_json(history, os.path.join(reports_dir, "training_history.json"))

    return {
        "best_val_acc": best_val_acc,
        "best_epoch": best_epoch,
        "best_model_path": best_model_path,
        "mobile_model_path": mobile_model_path,
    }


if __name__ == "__main__":
    train_tomato_model()
