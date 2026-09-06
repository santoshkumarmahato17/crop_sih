"""
Comprehensive Evaluation of Trained Tomato Leaf Disease Classifier on the Held-Out Test Set.
Generates accuracy, precision, recall, F1 (macro/weighted), per-class breakdowns,
confusion matrix visual, and per-class bar chart.
"""

import os
import sys
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from tqdm import tqdm

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
from ml.src.dataset import TomatoLeafDataset
from ml.src.augmentation import get_validation_transforms
from ml.src.model import build_model


def evaluate_test_set(
    config_path: str = "ml/config.yaml",
    model_weights_path: str = None,
    batch_size: int = 32,
) -> dict:
    """
    Evaluate best trained model against the test split.
    """
    print("=" * 75)
    print(" EVALUATION ON INDEPENDENT HELD-OUT TEST SPLIT ")
    print("=" * 75)

    cfg = load_config(config_path)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    class_names = cfg["dataset"]["classes"]
    num_classes = len(class_names)
    input_size = cfg["training"]["input_size"]

    # Load test split
    test_file = os.path.join(cfg["paths"]["splits_dir"], "test.json")
    if not os.path.exists(test_file):
        raise FileNotFoundError(f"Test split file not found at {test_file}")

    test_samples = load_json(test_file)
    print(f"[Evaluation] Total independent test samples: {len(test_samples)}")

    test_dataset = TomatoLeafDataset(test_samples, transform=get_validation_transforms(input_size))
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )

    # Load model
    if model_weights_path is None:
        model_weights_path = os.path.join(cfg["paths"]["models_dir"], "best_model", "best_model.pth")

    if not os.path.exists(model_weights_path):
        raise FileNotFoundError(f"Model weights not found at {model_weights_path}. Train the model first.")

    model = build_model(
        num_classes=num_classes,
        backbone_name=cfg["training"]["backbone"],
        pretrained=False,
    ).to(device)

    checkpoint = torch.load(model_weights_path, map_location=device)
    if "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)

    model.eval()
    print(f"[Evaluation] Successfully loaded checkpoint from: {model_weights_path}")

    all_preds = []
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for images, targets, _ in tqdm(test_loader, desc="Evaluating Test Set"):
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=-1)
            _, preds = outputs.max(1)

            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(targets.cpu().tolist())
            all_probs.extend(probs.cpu().tolist())

    # Compute complete metrics
    report = calculate_metrics(all_targets, all_preds, class_names)
    cm = np.array(report["confusion_matrix"])

    reports_dir = cfg["paths"]["reports_dir"]
    os.makedirs(reports_dir, exist_ok=True)

    # Save visual confusion matrix
    cm_path = os.path.join(reports_dir, "confusion_matrix.png")
    plot_confusion_matrix(cm, class_names, cm_path)

    # Save per-class bar chart
    pc_path = os.path.join(reports_dir, "per_class_metrics.png")
    plot_per_class_metrics(report["per_class"], class_names, pc_path)

    # Save evaluation reports
    save_json(report, os.path.join(reports_dir, "evaluation_report.json"))
    save_json(report, os.path.join(reports_dir, "classification_report.json"))

    # Print clean summary table
    overall = report["overall"]
    print("\n" + "=" * 60)
    print("              OVERALL TEST METRICS              ")
    print("=" * 60)
    print(f" Test Accuracy:      {overall['accuracy']*100:.2f}%")
    print(f" Macro Precision:    {overall['macro_precision']*100:.2f}%")
    print(f" Macro Recall:       {overall['macro_recall']*100:.2f}%")
    print(f" Macro F1-Score:     {overall['macro_f1']*100:.2f}%")
    print(f" Weighted F1-Score:  {overall['weighted_f1']*100:.2f}%")
    print(f" Total Test Samples: {overall['total_samples']}")
    print("=" * 60)
    print("\nPER-CLASS TEST RESULTS:")
    print(f"{'Class':<22} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Samples':<8}")
    print("-" * 70)
    for c_name in class_names:
        metrics = report["per_class"][c_name]
        print(
            f"{c_name:<22} | "
            f"{metrics['precision']*100:>8.2f}% | "
            f"{metrics['recall']*100:>8.2f}% | "
            f"{metrics['f1_score']*100:>8.2f}% | "
            f"{metrics['test_samples']:>8}"
        )
    print("=" * 70)
    print(f"Artifacts saved in {reports_dir}/:\n  - confusion_matrix.png\n  - per_class_metrics.png\n  - evaluation_report.json")

    return report


if __name__ == "__main__":
    evaluate_test_set()
