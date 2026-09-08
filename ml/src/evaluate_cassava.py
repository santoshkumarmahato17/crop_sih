"""
Comprehensive Evaluation of Trained 5-Class Cassava Disease & Pest Classifier on Independent Test Set.
Generates accuracy, precision, recall, F1 (macro/weighted), per-class breakdowns,
confusion matrix visual, and per-class bar chart.
"""

import os
import sys
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

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
from ml.src.dataset_cassava import CassavaLeafDataset, CANONICAL_CASSAVA_CLASSES
from ml.src.augmentation import get_validation_transforms
from ml.src.model import build_model


def evaluate_cassava_test_set(
    config_path: str = "ml/config_cassava.yaml",
    model_weights_path: str = None,
    batch_size: int = 32,
) -> dict:
    print("=" * 75)
    print(" EVALUATION ON INDEPENDENT CASSAVA TEST SPLIT (5 CLASSES) ")
    print("=" * 75)

    full_config_path = os.path.join(REPO_ROOT, config_path) if not os.path.isabs(config_path) else config_path
    cfg = load_config(full_config_path)
    device = torch.device(cfg["training"]["device"])

    class_names = CANONICAL_CASSAVA_CLASSES
    class_to_idx = {c: i for i, c in enumerate(class_names)}
    num_classes = len(class_names)
    input_size = cfg["model"]["input_size"]

    test_file = os.path.join(REPO_ROOT, cfg["dataset"]["splits_dir"], "test.json")
    if not os.path.exists(test_file):
        raise FileNotFoundError(f"Test split file not found at {test_file}")

    test_samples = load_json(test_file)
    print(f"[Cassava Evaluation] Total independent test samples: {len(test_samples)}")

    test_dataset = CassavaLeafDataset(
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
    if "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.eval()
    print(f"[Cassava Evaluation] Loaded checkpoint from: {model_weights_path}")

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

    # Compute comprehensive metrics
    metrics = calculate_metrics(all_targets, all_preds, class_names)

    overall = metrics["overall"]
    print("\n" + "=" * 65)
    print("        CASSAVA HELD-OUT TEST EVALUATION METRICS")
    print("=" * 65)
    print(f"  Test Accuracy   : {overall['accuracy'] * 100:.2f}%")
    print(f"  Macro Precision : {overall['macro_precision'] * 100:.2f}%")
    print(f"  Macro Recall    : {overall['macro_recall'] * 100:.2f}%")
    print(f"  Macro F1-Score  : {overall['macro_f1'] * 100:.2f}%")
    print(f"  Weighted F1     : {overall['weighted_f1'] * 100:.2f}%")
    print("-" * 65)
    print("  Per-Class Performance Table:")
    print(f"  {'Class':<20} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'Support':<7}")
    print("  " + "-" * 61)
    for c in class_names:
        cm = metrics["per_class"][c]
        print(f"  {c:<20} | {cm['precision']*100:>8.2f}% | {cm['recall']*100:>8.2f}% | {cm['f1_score']*100:>8.2f}% | {cm['test_samples']:>7}")
    print("=" * 65)

    reports_dir = os.path.join(REPO_ROOT, cfg["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)

    # Save reports
    eval_report_path = os.path.join(reports_dir, "evaluation_report.json")
    save_json(metrics, eval_report_path)

    clf_report_path = os.path.join(reports_dir, "classification_report.json")
    save_json(metrics["per_class"], clf_report_path)

    # Confusion matrix visual
    cm_path = os.path.join(reports_dir, "confusion_matrix.png")
    plot_confusion_matrix(metrics["confusion_matrix"], class_names, cm_path)

    # Per-class metrics chart visual
    chart_path = os.path.join(reports_dir, "per_class_metrics.png")
    plot_per_class_metrics(metrics["per_class"], class_names, chart_path)

    print(f"\n[Artifacts] Reports saved to: {reports_dir}")
    return metrics


if __name__ == "__main__":
    evaluate_cassava_test_set()
