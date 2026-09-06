"""
AGRI SHIELD — Crop Disease Deep Learning Model Training Pipeline.
Trains/Fine-tunes the Pretrained EfficientNet-B0 backbone with custom classifier head
on crop pest and disease images, with validation evaluation and checkpoint saving.
"""

import os
import sys
import time
import argparse
from typing import Dict, List, Optional
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

# Ensure repo root is in python path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai.models.crop_classifier import (
    CropDiseaseNet,
    create_model,
    RICE_MAIZE_CLASSES,
)
from ai.pipelines.dataset import (
    CropDiseaseDataset,
    get_transforms,
    get_dataloader,
)


def train_crop_disease_model(
    train_source: str,
    val_source: Optional[str] = None,
    output_dir: str = "weights",
    model_name: str = "crop_disease_efficientnet_b0.pth",
    backbone_name: str = "efficientnet_b0",
    epochs: int = 10,
    batch_size: int = 32,
    learning_rate: float = 1e-4,
    weight_decay: float = 1e-4,
    class_names: Optional[List[str]] = None,
    max_samples_per_class: Optional[int] = None,
    device_str: Optional[str] = None,
) -> Dict[str, float]:
    """
    Executes the training and validation loop for CropDiseaseNet.
    """
    classes = class_names or RICE_MAIZE_CLASSES
    num_classes = len(classes)

    device = torch.device(
        device_str if device_str else ("cuda" if torch.cuda.is_available() else "cpu")
    )
    print("=" * 75)
    print(" AGRI SHIELD — TRAINING CROP PEST & DISEASE NEURAL CLASSIFIER")
    print("=" * 75)
    print(f"Backbone:              {backbone_name.upper()}")
    print(f"Num Classes:           {num_classes}")
    print(f"Device:                {device}")
    print(f"Epochs:                {epochs}")
    print(f"Batch Size:            {batch_size}")
    print(f"Learning Rate:         {learning_rate}")
    print(f"Train Source:          {train_source}")
    print(f"Val Source:            {val_source or 'Auto-split'}")
    print(f"Target Checkpoint:     {os.path.join(output_dir, model_name)}")
    print("-" * 75)

    os.makedirs(output_dir, exist_ok=True)

    # 1. Build DataLoaders
    train_loader = get_dataloader(
        data_source=train_source,
        mode="train",
        batch_size=batch_size,
        shuffle=True,
        class_names=classes,
        max_samples_per_class=max_samples_per_class,
    )

    val_loader = None
    if val_source and os.path.exists(val_source):
        val_loader = get_dataloader(
            data_source=val_source,
            mode="val",
            batch_size=batch_size,
            shuffle=False,
            class_names=classes,
            max_samples_per_class=max_samples_per_class,
        )

    print(f"Train samples: {len(train_loader.dataset):,} across {len(train_loader)} batches")
    if val_loader:
        print(f"Val samples:   {len(val_loader.dataset):,} across {len(val_loader)} batches")

    # 2. Instantiate Model
    model = create_model(
        num_classes=num_classes,
        backbone_name=backbone_name,
        pretrained=True,
        classes=classes,
    ).to(device)

    # 3. Loss & Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(
        model.parameters(),
        lr=learning_rate,
        weight_decay=weight_decay,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max(1, epochs))

    best_val_acc = -1.0
    best_train_loss = float("inf")
    metrics_summary = {"best_val_acc": 0.0, "final_train_loss": 0.0}

    # 4. Training Loop
    start_total_time = time.time()
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        train_correct = 0
        train_total = 0

        for batch_idx, (images, targets, _) in enumerate(train_loader):
            images, targets = images.to(device), targets.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            preds = torch.argmax(logits, dim=1)
            train_total += targets.size(0)
            train_correct += (preds == targets).sum().item()

        scheduler.step()

        train_loss = running_loss / max(train_total, 1)
        train_acc = (train_correct / max(train_total, 1)) * 100.0

        val_loss = 0.0
        val_acc = 0.0
        # 5. Validation Step
        if val_loader and len(val_loader.dataset) > 0:
            model.eval()
            val_running_loss = 0.0
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for images, targets, _ in val_loader:
                    images, targets = images.to(device), targets.to(device)
                    logits = model(images)
                    loss = criterion(logits, targets)
                    val_running_loss += loss.item() * images.size(0)
                    preds = torch.argmax(logits, dim=1)
                    val_total += targets.size(0)
                    val_correct += (preds == targets).sum().item()

            val_loss = val_running_loss / max(val_total, 1)
            val_acc = (val_correct / max(val_total, 1)) * 100.0

        epoch_time = time.time() - epoch_start
        current_lr = scheduler.get_last_lr()[0]

        if val_loader:
            print(
                f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_time:.1f}s) | "
                f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.2f}% | "
                f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.2f}% | LR: {current_lr:.6f}"
            )
            # Save if best validation accuracy
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                ckpt_path = os.path.join(output_dir, model_name)
                torch.save(
                    {
                        "epoch": epoch,
                        "backbone": backbone_name,
                        "model_state_dict": model.state_dict(),
                        "num_classes": num_classes,
                        "classes": classes,
                        "val_acc": val_acc,
                        "val_loss": val_loss,
                        "train_acc": train_acc,
                        "train_loss": train_loss,
                    },
                    ckpt_path,
                )
                print(f"  --> Checkpoint saved: {ckpt_path} (Val Acc: {val_acc:.2f}%)")
        else:
            print(
                f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_time:.1f}s) | "
                f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.2f}% | LR: {current_lr:.6f}"
            )
            if train_loss < best_train_loss:
                best_train_loss = train_loss
                ckpt_path = os.path.join(output_dir, model_name)
                torch.save(
                    {
                        "epoch": epoch,
                        "backbone": backbone_name,
                        "model_state_dict": model.state_dict(),
                        "num_classes": num_classes,
                        "classes": classes,
                        "train_acc": train_acc,
                        "train_loss": train_loss,
                    },
                    ckpt_path,
                )
                print(f"  --> Checkpoint saved: {ckpt_path} (Train Loss: {train_loss:.4f})")

    total_duration = time.time() - start_total_time
    print(f"\nTraining completed in {total_duration:.1f}s.")
    metrics_summary["best_val_acc"] = best_val_acc if val_loader else train_acc
    metrics_summary["final_train_loss"] = train_loss
    return metrics_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Crop Disease Classifier")
    parser.add_argument("--train-source", type=str, required=True, help="Path to train directory or CSV")
    parser.add_argument("--val-source", type=str, default=None, help="Path to val directory or CSV")
    parser.add_argument("--output-dir", type=str, default="weights", help="Directory to save weights")
    parser.add_argument("--model-name", type=str, default="crop_disease_efficientnet_b0.pth", help="Checkpoint filename")
    parser.add_argument("--backbone", type=str, default="efficientnet_b0", help="Backbone name")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Mini-batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="AdamW learning rate")
    parser.add_argument("--samples-cap", type=int, default=None, help="Optional max samples per class")
    args = parser.parse_args()

    train_crop_disease_model(
        train_source=args.train_source,
        val_source=args.val_source,
        output_dir=args.output_dir,
        model_name=args.model_name,
        backbone_name=args.backbone,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        max_samples_per_class=args.samples_cap,
    )
