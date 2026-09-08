"""
Comprehensive Evaluation of Trained 4-Class Apple Leaf Disease Classifier on Independent Test Set.
Generates accuracy, precision, recall, F1 (macro/weighted), per-class breakdowns,
confusion matrix visual, and per-class performance bar chart.
"""

import os
import sys
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import (
    load_config,
    load_json,
    save_json,
    calculate_metrics,
    plot_confusion_matrix,
    plot_per_class_metrics,
)
from ml.src.dataset_apple import AppleLeafDataset, CANONICAL_APPLE_CLASSES, CLASS_CATEGORIES
from ml.src.augmentation import get_validation_transforms
from ml.src.model import build_model


def evaluate_apple_test_set(
    config_path: str = "ml/config_apple.yaml",
    model_weights_path: str = None,
    batch_size: int = 32,
) -> dict:
    print("\n" + "=" * 75)
    print(" EVALUATION ON INDEPENDENT APPLE TEST SPLIT (4 CLASSES) ")
    print("=" * 75)

    full_config_path = os.path.join(REPO_ROOT, config_path) if not os.path.isabs(config_path) else config_path
    cfg = load_config(full_config_path)
    device = torch.device(cfg["training"]["device"])

    class_names = CANONICAL_APPLE_CLASSES
    class_to_idx = {c: i for i, c in enumerate(class_names)}
    num_classes = len(class_names)
    input_size = cfg["model"]["input_size"]

    test_file = os.path.join(REPO_ROOT, cfg["dataset"]["splits_dir"], "test_samples.json")
    if not os.path.exists(test_file):
        raise FileNotFoundError(f"Test split file not found at {test_file}. Run dataset_apple.py first.")

    test_samples = load_json(test_file)
    print(f"[Apple Evaluation] Total independent test samples: {len(test_samples)}")

    test_dataset = AppleLeafDataset(
        test_samples,
        class_to_idx=class_to_idx,
        transform=get_validation_transforms(input_size),
    )
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    if model_weights_path is None:
        model_weights_path = os.path.join(REPO_ROOT, cfg["model"]["save_dir"], "best_model", "best_model.pth")

    if not os.path.exists(model_weights_path):
        raise FileNotFoundError(f"Model weights not found at {model_weights_path}. Train the model first.")

    model = build_model(
        num_classes=num_classes,
        backbone_name=cfg["model"]["architecture"],
        pretrained=False,
    ).to(device)

    checkpoint = torch.load(model_weights_path, map_location=device)
    if "state_dict" in checkpoint:
        model.load_state_dict(checkpoint["state_dict"])
    elif "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.eval()
    print(f"[Apple Evaluation] Loaded checkpoint from: {model_weights_path}")

    all_targets = []
    all_preds = []
    all_probs = []

    with torch.no_grad():
        for images, targets, _ in test_loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.softmax(logits, dim=-1)

            _, preds = torch.max(probs, dim=1)

            all_targets.extend(targets.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    all_targets = np.array(all_targets)
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)

    # Calculate overall and per-class metrics
    metrics = calculate_metrics(all_targets, all_preds, class_names)

    # Detailed scikit-learn classification report
    sk_report = classification_report(
        all_targets,
        all_preds,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    # Overall and per-class metrics
    overall = metrics["overall"]
    per_class = metrics["per_class"]

    reports_dir = os.path.join(REPO_ROOT, cfg["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)

    # 1. Confusion Matrix Heatmap
    import matplotlib.pyplot as plt
    import seaborn as sns

    cm_path = os.path.join(reports_dir, "confusion_matrix.png")
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        np.array(metrics["confusion_matrix"]),
        annot=True,
        fmt="d",
        cmap="Greens",
        xticklabels=class_names,
        yticklabels=class_names,
        cbar=True,
    )
    plt.title("Apple Leaf Disease Classification — Test Confusion Matrix", fontsize=12, pad=12, fontweight="bold")
    plt.xlabel("Predicted Class", fontsize=10, labelpad=8)
    plt.ylabel("Actual True Class", fontsize=10, labelpad=8)
    plt.xticks(rotation=25, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    plt.savefig(cm_path, dpi=300)
    plt.close()

    # 2. Per-Class Metrics Bar Chart
    bar_path = os.path.join(reports_dir, "per_class_metrics.png")
    x = np.arange(len(class_names))
    width = 0.25
    precisions = [per_class[c]["precision"] * 100 for c in class_names]
    recalls = [per_class[c]["recall"] * 100 for c in class_names]
    f1s = [per_class[c]["f1_score"] * 100 for c in class_names]

    plt.figure(figsize=(10, 5))
    plt.bar(x - width, precisions, width, label="Precision (%)", color="#3498db")
    plt.bar(x, recalls, width, label="Recall (%)", color="#2ecc71")
    plt.bar(x + width, f1s, width, label="F1-Score (%)", color="#e67e22")

    plt.title("Apple Leaf Disease Classifier — Per-Class Test Performance", fontsize=12, fontweight="bold")
    plt.xlabel("Apple Foliar Class", fontsize=10)
    plt.ylabel("Score (%)", fontsize=10)
    plt.xticks(x, class_names, rotation=20, ha="right", fontsize=9)
    plt.ylim(0, 105)
    plt.grid(axis="y", linestyle="--", alpha=0.5)
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(bar_path, dpi=300)
    plt.close()

    # 3. Save JSON reports
    sk_report_path = os.path.join(reports_dir, "classification_report.json")
    save_json(sk_report, sk_report_path)

    eval_report_path = os.path.join(reports_dir, "evaluation_report.json")
    eval_report_data = {
        "dataset": cfg["dataset"]["name"],
        "model_architecture": cfg["model"]["architecture"],
        "checkpoint": model_weights_path,
        "test_samples_count": len(test_samples),
        "overall_metrics": {
            "accuracy": round(overall["accuracy"] * 100.0, 2),
            "macro_precision": round(overall["macro_precision"] * 100.0, 2),
            "macro_recall": round(overall["macro_recall"] * 100.0, 2),
            "macro_f1": round(overall["macro_f1"] * 100.0, 2),
            "weighted_precision": round(overall["weighted_precision"] * 100.0, 2),
            "weighted_recall": round(overall["weighted_recall"] * 100.0, 2),
            "weighted_f1": round(overall["weighted_f1"] * 100.0, 2),
        },
        "per_class_metrics": per_class,
        "confusion_matrix": metrics["confusion_matrix"],
        "class_categories": CLASS_CATEGORIES,
    }
    save_json(eval_report_data, eval_report_path)

    # Formatted terminal display
    print("\n" + "=" * 75)
    print("           APPLE LEAF INDEPENDENT TEST EVALUATION (1,943 SAMPLES)")
    print("=" * 75)
    print(f"Test Accuracy:     {overall['accuracy'] * 100.0:.2f}%")
    print(f"Macro Precision:   {overall['macro_precision'] * 100.0:.2f}%")
    print(f"Macro Recall:      {overall['macro_recall'] * 100.0:.2f}%")
    print(f"Macro F1-Score:    {overall['macro_f1'] * 100.0:.2f}%")
    print(f"Weighted F1-Score: {overall['weighted_f1'] * 100.0:.2f}%")
    print("-" * 75)
    print(f"{'Class':<20} | {'Category':<8} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 75)
    for c in class_names:
        cm = per_class[c]
        cat = CLASS_CATEGORIES.get(c, "disease").upper()
        print(
            f"{c:<20} | {cat:<8} | {cm['precision']*100:>8.2f}% | {cm['recall']*100:>8.2f}% | "
            f"{cm['f1_score']*100:>8.2f}% | {cm['test_samples']:>8d}"
        )
    print("=" * 75)
    print(f"\nArtifacts generated:")
    print(f"  Confusion Matrix: {cm_path}")
    print(f"  Per-Class Chart:  {bar_path}")
    print(f"  Classification JSON: {sk_report_path}")
    print(f"  Evaluation JSON:  {eval_report_path}")
    print("=" * 75 + "\n")

    return eval_report_data


if __name__ == "__main__":
    evaluate_apple_test_set()
