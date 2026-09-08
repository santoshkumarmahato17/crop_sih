"""
Production Training Pipeline for 4-Class Apple Leaf Disease Classification:
Two-stage transfer learning (warmup with frozen backbone -> deep fine-tuning),
class-weighted CrossEntropyLoss, AdamW optimizer, Cosine Annealing LR scheduler,
early stopping, validation metric monitoring, model checkpointing, and TorchScript export.
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
from sklearn.metrics import f1_score

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import set_seed, load_config, save_json, load_json, plot_training_history
from ml.src.dataset_apple import AppleLeafDataset, CANONICAL_APPLE_CLASSES, CLASS_CATEGORIES
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
    print(f"[Apple Training] Class counts in training set: {counts}")
    print(f"[Apple Training] Computed class weights: {[round(w, 3) for w in weights_tensor.tolist()]}")
    return weights_tensor


def run_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer = None,
    device: torch.device = torch.device("cpu"),
    is_training: bool = True,
) -> Tuple[float, float, float, List[int], List[int]]:
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
    epoch_macro_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0) * 100.0
    return epoch_loss, epoch_acc, epoch_macro_f1, all_preds, all_targets


def train_apple_model(config_path: str = "ml/config_apple.yaml") -> Dict:
    full_config_path = os.path.join(REPO_ROOT, config_path) if not os.path.isabs(config_path) else config_path
    config = load_config(full_config_path)

    set_seed(config["dataset"]["random_seed"])

    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])
    train_samples = load_json(os.path.join(splits_dir, "train_samples.json"))
    val_samples = load_json(os.path.join(splits_dir, "val_samples.json"))

    class_names = CANONICAL_APPLE_CLASSES
    class_to_idx = {cls_name: idx for idx, cls_name in enumerate(class_names)}
    idx_to_class = {idx: cls_name for cls_name, idx in class_to_idx.items()}

    for s in train_samples:
        s["class_idx"] = class_to_idx[s["class_name"]]
    for s in val_samples:
        s["class_idx"] = class_to_idx[s["class_name"]]

    img_size = config["model"]["input_size"]
    train_transform = get_training_transforms(img_size)
    val_transform = get_validation_transforms(img_size)

    train_dataset = AppleLeafDataset(train_samples, class_to_idx, transform=train_transform)
    val_dataset = AppleLeafDataset(val_samples, class_to_idx, transform=val_transform)

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
    print(f"\n[Apple Training] Target Device: {device}")
    print(f"[Apple Training] Training Samples: {len(train_dataset)} ({len(train_loader)} batches)")
    print(f"[Apple Training] Validation Samples: {len(val_dataset)} ({len(val_loader)} batches)")

    # Build model architecture
    arch_name = config["model"]["architecture"]
    print(f"[Apple Training] Initializing {arch_name} with pre-trained weights (4 output classes)...")
    model = build_model(
        num_classes=len(class_names),
        backbone_name=arch_name,
        pretrained=config["model"]["pretrained"],
        dropout_rate=config["model"]["dropout"],
    ).to(device)

    # Class-weighted CrossEntropyLoss
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
        "val_macro_f1": [],
        "learning_rates": [],
    }

    best_val_f1 = 0.0
    best_val_acc = 0.0
    best_model_weights = copy.deepcopy(model.state_dict())
    best_epoch = -1

    start_time = time.time()

    # =========================================================================
    # STAGE 1: Warmup with Frozen Backbone (Train Linear Head Only)
    # =========================================================================
    warmup_epochs = config["training"]["warmup_epochs"]
    warmup_lr = config["training"]["warmup_lr"]

    print("\n" + "=" * 70)
    print(f"  STAGE 1: Linear Head Warmup ({warmup_epochs} Epochs, Backbone Frozen, LR: {warmup_lr})")
    print("=" * 70)

    model.freeze_backbone()

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(
        trainable_params,
        lr=warmup_lr,
        weight_decay=config["training"]["weight_decay"],
    )

    for epoch in range(1, warmup_epochs + 1):
        ep_start = time.time()
        train_loss, train_acc, train_f1, _, _ = run_epoch(
            model, train_loader, criterion, optimizer, device, is_training=True
        )
        val_loss, val_acc, val_f1, _, _ = run_epoch(
            model, val_loader, criterion, None, device, is_training=False
        )
        ep_duration = time.time() - ep_start

        current_lr = optimizer.param_groups[0]["lr"]
        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 2))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 2))
        history["val_macro_f1"].append(round(val_f1, 2))
        history["learning_rates"].append(current_lr)

        print(
            f"Epoch {epoch:02d}/{warmup_epochs:02d} [Warmup] - "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
            f"Val Macro F1: {val_f1:.2f}% | Time: {ep_duration:.1f}s"
        )

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_val_acc = val_acc
            best_model_weights = copy.deepcopy(model.state_dict())
            best_epoch = epoch

    # =========================================================================
    # STAGE 2: Deep Fine-Tuning (Unfreeze Deep Feature Blocks)
    # =========================================================================
    fine_tune_epochs = config["training"]["fine_tune_epochs"]
    fine_tune_lr = config["training"]["fine_tune_lr"]

    print("\n" + "=" * 70)
    print(f"  STAGE 2: Deep Fine-Tuning ({fine_tune_epochs} Epochs, Unfrozen Layers, LR: {fine_tune_lr})")
    print("=" * 70)

    # Unfreeze deepest layers
    model.unfreeze_backbone(unfreeze_last_n_blocks=6)

    # Differential learning rates: lower for backbone, higher for classifier
    backbone_params = []
    classifier_params = []
    for name, param in model.named_parameters():
        if not param.requires_grad:
            continue
        if "classifier" in name or "fc" in name:
            classifier_params.append(param)
        else:
            backbone_params.append(param)

    optimizer = torch.optim.AdamW(
        [
            {"params": backbone_params, "lr": fine_tune_lr * 0.5},
            {"params": classifier_params, "lr": fine_tune_lr},
        ],
        weight_decay=config["training"]["weight_decay"],
    )

    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=fine_tune_epochs,
        eta_min=config["training"]["min_lr"],
    )

    for epoch in range(1, fine_tune_epochs + 1):
        actual_epoch = warmup_epochs + epoch
        ep_start = time.time()

        train_loss, train_acc, train_f1, _, _ = run_epoch(
            model, train_loader, criterion, optimizer, device, is_training=True
        )
        val_loss, val_acc, val_f1, _, _ = run_epoch(
            model, val_loader, criterion, None, device, is_training=False
        )
        scheduler.step()
        ep_duration = time.time() - ep_start

        current_lr = optimizer.param_groups[0]["lr"]
        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 2))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 2))
        history["val_macro_f1"].append(round(val_f1, 2))
        history["learning_rates"].append(current_lr)

        print(
            f"Epoch {actual_epoch:02d}/{(warmup_epochs + fine_tune_epochs):02d} [Fine-Tune] - "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | "
            f"Val Macro F1: {val_f1:.2f}% | Time: {ep_duration:.1f}s"
        )

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_val_acc = val_acc
            best_model_weights = copy.deepcopy(model.state_dict())
            best_epoch = actual_epoch

    total_time = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"[Apple Training Complete] Total duration: {total_time:.1f}s ({total_time / 60:.1f} min)")
    print(f"[Apple Training Complete] Best Epoch: {best_epoch:02d} with Val Acc: {best_val_acc:.2f}%, Val Macro F1: {best_val_f1:.2f}%")
    print("=" * 70 + "\n")

    # Load and persist best checkpoint
    model.load_state_dict(best_model_weights)
    model.eval()

    # Create model directories
    save_dir = os.path.join(REPO_ROOT, config["model"]["save_dir"])
    best_model_dir = os.path.join(save_dir, "best_model")
    mobile_model_dir = os.path.join(save_dir, "mobile_model")
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(best_model_dir, exist_ok=True)
    os.makedirs(mobile_model_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    # 1. Save standard PyTorch weights
    best_weights_path = os.path.join(best_model_dir, "best_model.pth")
    torch.save(
        {
            "state_dict": best_model_weights,
            "architecture": arch_name,
            "num_classes": len(class_names),
            "classes": class_names,
            "input_size": img_size,
            "val_acc": best_val_acc,
            "val_macro_f1": best_val_f1,
            "best_epoch": best_epoch,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        best_weights_path,
    )
    print(f"[Model Saved] PyTorch checkpoint: {best_weights_path}")

    # 2. Export TorchScript mobile model
    mobile_model_path = os.path.join(mobile_model_dir, "apple_leaf_mobilenet_v3.pt")
    model.export_torchscript(mobile_model_path, input_size=img_size)
    mobile_size_mb = os.path.getsize(mobile_model_path) / (1024 * 1024)
    print(f"[Model Exported] TorchScript mobile model: {mobile_model_path} ({mobile_size_mb:.2f} MB)")

    # 3. Save class names and metadata
    class_names_path = os.path.join(save_dir, "class_names.json")
    save_json(class_names, class_names_path)

    class_meta_path = os.path.join(save_dir, "class_metadata.json")
    class_metadata = {
        "classes": [
            {
                "name": c,
                "original_folder": c.lower().replace(" ", "_"),
                "category": CLASS_CATEGORIES[c],
                "index": i,
            }
            for i, c in enumerate(class_names)
        ]
    }
    save_json(class_metadata, class_meta_path)

    # 4. Save model metadata
    model_meta_path = os.path.join(save_dir, "model_metadata.json")
    model_metadata = {
        "model_name": "Apple Leaf Condition Classifier",
        "architecture": arch_name,
        "input_size": [3, img_size, img_size],
        "num_classes": len(class_names),
        "classes": class_names,
        "class_categories": CLASS_CATEGORIES,
        "best_epoch": best_epoch,
        "best_val_accuracy": round(best_val_acc, 2),
        "best_val_macro_f1": round(best_val_f1, 2),
        "mobile_model_size_mb": round(mobile_size_mb, 2),
        "training_time_seconds": round(total_time, 1),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    save_json(model_metadata, model_meta_path)

    # 5. Save training history and plot curves
    history_json_path = os.path.join(reports_dir, "training_history.json")
    save_json(history, history_json_path)

    history_plot_path = os.path.join(reports_dir, "training_history.png")
    plot_training_history(history, history_plot_path)
    print(f"[Reports Saved] History JSON: {history_json_path} | History Plot: {history_plot_path}")

    return {
        "best_epoch": best_epoch,
        "val_acc": best_val_acc,
        "val_f1": best_val_f1,
        "weights_path": best_weights_path,
        "mobile_model_path": mobile_model_path,
        "model_metadata": model_metadata,
    }


if __name__ == "__main__":
    train_apple_model()
