"""
AGRI SHIELD — CCMT Deep Learning Model Training Pipeline.
Trains/Fine-tunes the MobileNetV3 architecture on the CCMT Dataset and persists model weights.
"""

import os
import sys
import time
import argparse
import torch
import torch.nn as nn
import torch.optim as optim

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai.models.ccmt_classifier import CCMTDiseaseClassifier, CCMT_CLASSES
from ai.pipelines.ccmt_dataset import get_ccmt_dataloader


def train_ccmt_model(
    dataset_root: str,
    output_dir: str = "weights",
    epochs: int = 5,
    batch_size: int = 32,
    learning_rate: float = 1e-3,
    max_samples_per_class: int = 50,
):
    print("=" * 70)
    print(" AGRI SHIELD — TRAINING CCMT CROP PATHOLOGY VISION MODEL")
    print("=" * 70)
    print(f"Dataset Root:          {dataset_root}")
    print(f"Epochs:                {epochs}")
    print(f"Batch Size:            {batch_size}")
    print(f"Samples per Class Cap: {max_samples_per_class}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device:                {device}")

    # Build Training DataLoader
    print("\nLoading dataset split...")
    train_loader = get_ccmt_dataloader(
        dataset_root=dataset_root,
        subset="raw",
        batch_size=batch_size,
        shuffle=True,
        max_samples_per_class=max_samples_per_class,
    )
    print(f"Total training samples: {len(train_loader.dataset):,} | Batches: {len(train_loader)}")

    # Initialize model
    model = CCMTDiseaseClassifier(num_classes=len(CCMT_CLASSES), pretrained_backbone=True).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    os.makedirs(output_dir, exist_ok=True)
    best_loss = float("inf")

    # Training Loop
    model.train()
    start_time = time.time()
    for epoch in range(1, epochs + 1):
        running_loss = 0.0
        correct = 0
        total = 0
        epoch_start = time.time()

        for batch_idx, (images, targets, _) in enumerate(train_loader):
            images, targets = images.to(device), targets.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

        scheduler.step()
        epoch_loss = running_loss / max(total, 1)
        epoch_acc = 100.0 * correct / max(total, 1)
        elapsed = time.time() - epoch_start

        print(
            f"Epoch [{epoch}/{epochs}] ({elapsed:.1f}s) "
            f"Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}% | LR: {scheduler.get_last_lr()[0]:.6f}"
        )

        # Save checkpoint
        if epoch_loss < best_loss:
            best_loss = epoch_loss
            ckpt_path = os.path.join(output_dir, "ccmt_mobilenet_v3.pth")
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "loss": epoch_loss,
                    "accuracy": epoch_acc,
                    "classes": CCMT_CLASSES,
                },
                ckpt_path,
            )
            print(f" -> Checkpoint saved to: {ckpt_path}")

    total_time = time.time() - start_time
    print(f"\nTraining completed in {total_time:.1f}s. Final weights saved.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CCMT Crop Disease Classifier")
    parser.add_argument(
        "--dataset",
        type=str,
        default=r"c:\Users\krsan\Desktop\crop\Dataset for Crop Pest and Disease Detection",
        help="Dataset root path",
    )
    parser.add_argument("--epochs", type=int, default=2, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--samples-cap", type=int, default=30, help="Max samples per class for rapid training")
    args = parser.parse_args()

    train_ccmt_model(
        dataset_root=args.dataset,
        epochs=args.epochs,
        batch_size=args.batch_size,
        max_samples_per_class=args.samples_cap,
    )
