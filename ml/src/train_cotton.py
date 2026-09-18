"""
Production Training Pipeline for 7-Class Cotton Leaf Disease & Pest Classification.
Two-stage transfer learning: (1) warmup with frozen backbone -> (2) full fine-tuning.
Features: class-weighted CrossEntropyLoss, AdamW, CosineAnnealing LR, early stopping,
          model checkpointing, TorchScript export, and full training history logging.
"""

import os
import sys
import time
import copy
import json
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score, classification_report, confusion_matrix, accuracy_score
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import set_seed, load_config, save_json, load_json
from ml.src.dataset_cotton import (
    get_cotton_dataloaders,
    CANONICAL_COTTON_CLASSES,
    CLASS_CATEGORIES,
    CLASS_DISPLAY_NAMES,
)
from ml.src.model import build_model


def compute_class_weights(train_samples: List[Dict], num_classes: int, class_to_idx: Dict[str, int]) -> torch.Tensor:
    """Compute balanced class weights: weight[c] = total / (num_classes * count[c])."""
    counts = [0] * num_classes
    for s in train_samples:
        counts[class_to_idx[s["class_name"]]] += 1
    total = sum(counts)
    weights = [total / (num_classes * max(1, c)) for c in counts]
    wt = torch.tensor(weights, dtype=torch.float32)
    wt = wt / wt.mean()  # normalize so mean weight = 1
    print(f"[Cotton] Class counts : {counts}")
    print(f"[Cotton] Class weights: {[round(w, 3) for w in wt.tolist()]}")
    return wt


def run_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer=None,
    device: torch.device = torch.device("cpu"),
    is_training: bool = True,
) -> Tuple[float, float, float, List[int], List[int]]:
    """Run one epoch (train or eval). Returns (loss, acc, macro_f1, preds, targets)."""
    model.train() if is_training else model.eval()
    running_loss, correct, total = 0.0, 0, 0
    all_preds, all_targets = [], []

    ctx = torch.enable_grad() if is_training else torch.no_grad()
    with ctx:
        for images, targets, _ in dataloader:
            images, targets = images.to(device), targets.to(device)
            if is_training and optimizer:
                optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            if is_training and optimizer:
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
    epoch_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0) * 100.0
    return epoch_loss, epoch_acc, epoch_f1, all_preds, all_targets


def train_cotton_model(config_path: str = "ml/config_cotton.yaml") -> Dict:
    """Full two-stage training pipeline."""
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    seed = config["dataset"]["random_seed"]
    set_seed(seed)

    device = torch.device("cuda" if torch.cuda.is_available() else config["training"]["device"])
    print(f"[Cotton] Device: {device}")

    # ── Data ────────────────────────────────────────────────────────────────
    train_loader, val_loader, test_loader, class_to_idx = get_cotton_dataloaders(
        config_path=config_path,
        batch_size=config["training"]["batch_size"],
        num_workers=config["training"]["num_workers"],
    )
    num_classes = config["model"]["num_classes"]
    idx_to_class = {v: k for k, v in class_to_idx.items()}

    # ── Class weights ──────────────────────────────────────────────────────
    train_samples = load_json(os.path.join(REPO_ROOT, config["dataset"]["splits_dir"], "train.json"))
    weights_tensor = compute_class_weights(train_samples, num_classes, class_to_idx).to(device)

    # ── Model ──────────────────────────────────────────────────────────────
    model = build_model(
        backbone_name=config["model"]["architecture"],
        num_classes=num_classes,
        pretrained=config["model"]["pretrained"],
        dropout_rate=config["model"]["dropout"],
    ).to(device)

    criterion = nn.CrossEntropyLoss(
        weight=weights_tensor if config["training"]["use_class_weights"] else None
    )

    save_dir = os.path.join(REPO_ROOT, config["model"]["save_dir"])
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    history: Dict[str, List] = {
        "train_loss": [], "val_loss": [],
        "train_acc": [], "val_acc": [],
        "train_f1": [], "val_f1": [],
        "lr": [],
    }
    best_val_loss = float("inf")
    best_model_wts = copy.deepcopy(model.state_dict())
    patience_counter = 0
    patience = config["training"].get("early_stopping_patience", 4)

    start_time = time.time()

    # ── Stage 1: Warmup (frozen backbone) ──────────────────────────────────
    warmup_epochs = config["training"]["warmup_epochs"]
    print(f"\n{'='*60}")
    print(f" STAGE 1: Warmup ({warmup_epochs} epochs, backbone frozen)")
    print(f"{'='*60}")
    model.freeze_backbone()
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=config["training"]["warmup_lr"],
        weight_decay=config["training"]["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=warmup_epochs, eta_min=config["training"]["min_lr"]
    )

    for epoch in range(warmup_epochs):
        t_loss, t_acc, t_f1, _, _ = run_epoch(model, train_loader, criterion, optimizer, device, True)
        v_loss, v_acc, v_f1, _, _ = run_epoch(model, val_loader, criterion, device=device, is_training=False)
        scheduler.step()
        lr = scheduler.get_last_lr()[0]

        history["train_loss"].append(t_loss); history["val_loss"].append(v_loss)
        history["train_acc"].append(t_acc);   history["val_acc"].append(v_acc)
        history["train_f1"].append(t_f1);     history["val_f1"].append(v_f1)
        history["lr"].append(lr)

        print(f"  Warmup {epoch+1}/{warmup_epochs} | "
              f"Train Loss {t_loss:.4f} Acc {t_acc:.1f}% | "
              f"Val Loss {v_loss:.4f} Acc {v_acc:.1f}% F1 {v_f1:.1f}% | LR {lr:.6f}")

        if v_loss < best_val_loss:
            best_val_loss = v_loss
            best_model_wts = copy.deepcopy(model.state_dict())
            patience_counter = 0
        else:
            patience_counter += 1

    # ── Stage 2: Fine-tune (full model) ────────────────────────────────────
    ft_epochs = config["training"]["fine_tune_epochs"]
    print(f"\n{'='*60}")
    print(f" STAGE 2: Fine-tuning ({ft_epochs} epochs, full model)")
    print(f"{'='*60}")
    model.unfreeze_backbone()
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config["training"]["fine_tune_lr"],
        weight_decay=config["training"]["weight_decay"],
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=ft_epochs, eta_min=config["training"]["min_lr"]
    )
    patience_counter = 0  # reset

    for epoch in range(ft_epochs):
        t_loss, t_acc, t_f1, _, _ = run_epoch(model, train_loader, criterion, optimizer, device, True)
        v_loss, v_acc, v_f1, _, _ = run_epoch(model, val_loader, criterion, device=device, is_training=False)
        scheduler.step()
        lr = scheduler.get_last_lr()[0]

        history["train_loss"].append(t_loss); history["val_loss"].append(v_loss)
        history["train_acc"].append(t_acc);   history["val_acc"].append(v_acc)
        history["train_f1"].append(t_f1);     history["val_f1"].append(v_f1)
        history["lr"].append(lr)

        tag = ""
        if v_loss < best_val_loss:
            best_val_loss = v_loss
            best_model_wts = copy.deepcopy(model.state_dict())
            torch.save(best_model_wts, os.path.join(save_dir, "best_model.pth"))
            patience_counter = 0
            tag = " [best]"
        else:
            patience_counter += 1

        print(f"  FT {epoch+1}/{ft_epochs} | "
              f"Train Loss {t_loss:.4f} Acc {t_acc:.1f}% | "
              f"Val Loss {v_loss:.4f} Acc {v_acc:.1f}% F1 {v_f1:.1f}% | LR {lr:.6f}{tag}")

        if patience_counter >= patience:
            print(f"  [Early stopping] at epoch {warmup_epochs + epoch + 1}")
            break

    total_time = time.time() - start_time
    print(f"\n[Cotton] Training completed in {total_time:.1f}s")

    # ── Save last model ────────────────────────────────────────────────────
    torch.save(model.state_dict(), os.path.join(save_dir, "last_model.pth"))

    # ── Load best and evaluate on test ─────────────────────────────────────
    model.load_state_dict(best_model_wts)
    model.eval()
    torch.save(best_model_wts, os.path.join(save_dir, "best_model.pth"))

    test_loss, test_acc, test_f1, test_preds, test_targets = run_epoch(
        model, test_loader, criterion, device=device, is_training=False
    )

    target_names = [idx_to_class[i] for i in range(num_classes)]
    report_dict = classification_report(test_targets, test_preds, target_names=target_names, output_dict=True, zero_division=0)
    cm = confusion_matrix(test_targets, test_preds)

    print(f"\n{'='*60}")
    print(f" TEST EVALUATION")
    print(f"{'='*60}")
    print(classification_report(test_targets, test_preds, target_names=target_names, zero_division=0))

    # ── Confusion matrix plot ──────────────────────────────────────────────
    plt.figure(figsize=(12, 10))
    display_names = [CLASS_DISPLAY_NAMES.get(n, n) for n in target_names]
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=display_names, yticklabels=display_names)
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.title("Cotton Leaf Disease & Pest — Confusion Matrix")
    plt.tight_layout()
    plt.savefig(os.path.join(reports_dir, "confusion_matrix.png"), dpi=150)
    plt.close()

    # ── Training history plots ─────────────────────────────────────────────
    epochs_range = range(1, len(history["train_loss"]) + 1)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    axes[0].plot(epochs_range, history["train_acc"], label="Train Acc")
    axes[0].plot(epochs_range, history["val_acc"], label="Val Acc")
    axes[0].axvline(x=warmup_epochs, color="gray", linestyle="--", alpha=0.5, label="Stage 2 start")
    axes[0].set_title("Accuracy"); axes[0].set_xlabel("Epoch"); axes[0].set_ylabel("%")
    axes[0].legend()

    axes[1].plot(epochs_range, history["train_loss"], label="Train Loss")
    axes[1].plot(epochs_range, history["val_loss"], label="Val Loss")
    axes[1].axvline(x=warmup_epochs, color="gray", linestyle="--", alpha=0.5, label="Stage 2 start")
    axes[1].set_title("Loss"); axes[1].set_xlabel("Epoch"); axes[1].set_ylabel("Loss")
    axes[1].legend()

    plt.tight_layout()
    plt.savefig(os.path.join(reports_dir, "training_history.png"), dpi=150)
    plt.close()

    # ── Export TorchScript mobile model ────────────────────────────────────
    mobile_path = os.path.join(save_dir, "best_model_mobile.pt")
    try:
        inp = config["model"]["input_size"]
        example = torch.randn(1, 3, inp, inp).to(device)
        traced = torch.jit.trace(model, example)
        traced.save(mobile_path)
        mobile_size_mb = os.path.getsize(mobile_path) / (1024 * 1024)
        print(f"[Cotton] TorchScript mobile model saved ({mobile_size_mb:.2f} MB)")
    except Exception as e:
        mobile_size_mb = 0
        print(f"[Cotton] Warning: TorchScript export failed: {e}")

    # ── Export ONNX ────────────────────────────────────────────────────────
    onnx_path = os.path.join(save_dir, "model.onnx")
    try:
        inp = config["model"]["input_size"]
        dummy = torch.randn(1, 3, inp, inp).to(device)
        torch.onnx.export(model, dummy, onnx_path,
                          input_names=["input"], output_names=["output"],
                          dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}})
        print(f"[Cotton] ONNX model saved: {onnx_path}")
    except Exception as e:
        print(f"[Cotton] Warning: ONNX export failed: {e}")

    # ── Save class mapping ─────────────────────────────────────────────────
    class_names_map = {}
    for idx in range(num_classes):
        cls = idx_to_class[idx]
        class_names_map[str(idx)] = {
            "original_label": cls,
            "display_name": CLASS_DISPLAY_NAMES.get(cls, cls),
            "category": CLASS_CATEGORIES.get(cls, "Unknown"),
        }
    save_json(class_names_map, os.path.join(save_dir, "class_names.json"))
    save_json(class_names_map, os.path.join(save_dir, "class_mapping.json"))

    # ── Save metadata ──────────────────────────────────────────────────────
    metadata = {
        "model_name": "Cotton Leaf Condition Classifier",
        "model_architecture": config["model"]["architecture"],
        "input_size": config["model"]["input_size"],
        "num_classes": num_classes,
        "classes": CANONICAL_COTTON_CLASSES,
        "class_categories": CLASS_CATEGORIES,
        "class_display_names": CLASS_DISPLAY_NAMES,
        "idx_to_class": idx_to_class,
        "best_val_loss": round(best_val_loss, 5),
        "test_accuracy": round(test_acc, 2),
        "test_macro_f1": round(test_f1, 2),
        "mobile_model_size_mb": round(mobile_size_mb, 2),
        "training_time_seconds": round(total_time, 1),
        "random_seed": seed,
    }
    save_json(metadata, os.path.join(save_dir, "model_metadata.json"))

    # ── Save reports ───────────────────────────────────────────────────────
    save_json(report_dict, os.path.join(reports_dir, "classification_report.json"))
    save_json(history, os.path.join(reports_dir, "training_history.json"))

    # ── Error analysis ─────────────────────────────────────────────────────
    error_lines = [
        "# Cotton Leaf Disease — Error Analysis\n",
        f"**Test Accuracy**: {test_acc:.2f}%\n",
        f"**Macro F1**: {test_f1:.2f}%\n",
        "",
        "## Per-Class Performance\n",
        "| Class | Precision | Recall | F1 | Support |",
        "|-------|-----------|--------|-----|---------|",
    ]
    best_f1_cls, worst_f1_cls = None, None
    best_f1_val, worst_f1_val = -1, 2.0
    for cls in CANONICAL_COTTON_CLASSES:
        info = report_dict.get(cls, {})
        p = info.get("precision", 0) * 100
        r = info.get("recall", 0) * 100
        f = info.get("f1-score", 0) * 100
        s = info.get("support", 0)
        error_lines.append(f"| {cls} | {p:.1f}% | {r:.1f}% | {f:.1f}% | {s} |")
        if f > best_f1_val:
            best_f1_val, best_f1_cls = f, cls
        if f < worst_f1_val:
            worst_f1_val, worst_f1_cls = f, cls

    error_lines.extend([
        "",
        f"## Best Performing Class: **{best_f1_cls}** (F1: {best_f1_val:.1f}%)",
        f"## Worst Performing Class: **{worst_f1_cls}** (F1: {worst_f1_val:.1f}%)",
        "",
        "## Most Confused Class Pairs\n",
    ])

    # Find top confusion pairs
    confusions = []
    for i in range(num_classes):
        for j in range(num_classes):
            if i != j and cm[i][j] > 0:
                confusions.append((idx_to_class[i], idx_to_class[j], int(cm[i][j])))
    confusions.sort(key=lambda x: x[2], reverse=True)
    for true_cls, pred_cls, count in confusions[:10]:
        error_lines.append(f"- **{true_cls}** misclassified as **{pred_cls}**: {count} times")

    error_lines.extend([
        "",
        "## Recommendations\n",
        "- Collect more images for underrepresented classes",
        "- Use stronger augmentation for minority classes",
        "- Consider focal loss if class imbalance persists",
        "- Verify label quality for the most confused pairs",
    ])
    with open(os.path.join(reports_dir, "error_analysis.md"), "w") as f:
        f.write("\n".join(error_lines))

    print(f"\n[Cotton] All reports saved to {reports_dir}")
    print(f"[Cotton] Model artifacts saved to {save_dir}")

    return metadata


if __name__ == "__main__":
    train_cotton_model()
