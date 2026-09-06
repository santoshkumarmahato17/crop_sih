"""
Utility functions for Tomato Leaf Disease Classification Pipeline:
Seed management, metrics calculation, plotting, and file helpers.
"""

import os
import sys
import json
import random
import yaml
import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report,
)


def set_seed(seed: int = 42):
    """Ensure full reproducibility across runs."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def load_config(config_path: str = "ml/config.yaml") -> dict:
    """Load configuration YAML file."""
    if not os.path.exists(config_path):
        # Check relative to repo root
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        alt_path = os.path.join(repo_root, config_path)
        if os.path.exists(alt_path):
            config_path = alt_path
        else:
            raise FileNotFoundError(f"Config file not found at {config_path} or {alt_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config


def find_dataset_root(hint_path: str = None) -> str:
    """
    Automatically locate the Tomato dataset directory.
    Searches hint path, workspace root, and common parent folders.
    """
    candidates = []
    if hint_path:
        candidates.append(hint_path)
    
    # Common locations
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    candidates.extend([
        os.path.join(repo_root, "Tomato"),
        os.path.join(repo_root, "data", "Tomato"),
        os.path.join(os.getcwd(), "Tomato"),
        r"c:\Users\krsan\Desktop\crop\Tomato",
    ])

    expected_markers = {"healthy", "leaf blight", "leaf curl", "septoria leaf spot"}

    for path in candidates:
        if path and os.path.isdir(path):
            subdirs = {d.lower() for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))}
            if expected_markers.issubset(subdirs) or len(expected_markers.intersection(subdirs)) >= 4:
                return os.path.abspath(path)

    # Recursive search up to 2 levels deep
    for root, dirs, _ in os.walk(repo_root):
        if "Tomato" in dirs:
            t_path = os.path.join(root, "Tomato")
            subdirs = {d.lower() for d in os.listdir(t_path) if os.path.isdir(os.path.join(t_path, d))}
            if len(expected_markers.intersection(subdirs)) >= 4:
                return os.path.abspath(t_path)

    raise FileNotFoundError("Could not automatically locate the Tomato dataset folder.")


def save_json(data: dict, filepath: str):
    """Save data to JSON with indentation."""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_json(filepath: str) -> dict:
    """Load data from JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_metrics(y_true, y_pred, class_names):
    """
    Calculate comprehensive multi-class classification metrics.
    """
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    acc = float(accuracy_score(y_true, y_pred))
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    per_class_p, per_class_r, per_class_f1, per_class_support = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(len(class_names))), zero_division=0
    )

    per_class_metrics = {}
    for i, c_name in enumerate(class_names):
        per_class_metrics[c_name] = {
            "precision": round(float(per_class_p[i]), 4),
            "recall": round(float(per_class_r[i]), 4),
            "f1_score": round(float(per_class_f1[i]), 4),
            "test_samples": int(per_class_support[i]),
        }

    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))

    report = {
        "overall": {
            "accuracy": round(acc, 4),
            "macro_precision": round(float(p_macro), 4),
            "macro_recall": round(float(r_macro), 4),
            "macro_f1": round(float(f1_macro), 4),
            "weighted_precision": round(float(p_weighted), 4),
            "weighted_recall": round(float(r_weighted), 4),
            "weighted_f1": round(float(f1_weighted), 4),
            "total_samples": int(len(y_true)),
        },
        "per_class": per_class_metrics,
        "confusion_matrix": cm.tolist(),
    }
    return report


def plot_confusion_matrix(cm, class_names, save_path: str):
    """Plot and save confusion matrix heatmap."""
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Greens",
        xticklabels=class_names,
        yticklabels=class_names,
        cbar=True,
    )
    plt.title("Tomato Leaf Disease Classification — Test Confusion Matrix", fontsize=12, pad=12)
    plt.xlabel("Predicted Class", fontsize=10, labelpad=8)
    plt.ylabel("Actual True Class", fontsize=10, labelpad=8)
    plt.xticks(rotation=30, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()


def plot_training_history(history: dict, save_path: str):
    """Plot training and validation loss & accuracy curves side-by-side."""
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
    epochs = range(1, len(history["train_loss"]) + 1)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Loss Curves
    ax1.plot(epochs, history["train_loss"], "o-", color="#e74c3c", label="Train Loss")
    ax1.plot(epochs, history["val_loss"], "s--", color="#3498db", label="Val Loss")
    ax1.set_title("Training vs Validation Loss", fontsize=12, fontweight="bold")
    ax1.set_xlabel("Epoch", fontsize=10)
    ax1.set_ylabel("Loss (CrossEntropy)", fontsize=10)
    ax1.grid(True, linestyle="--", alpha=0.5)
    ax1.legend(loc="upper right")

    # Accuracy Curves
    ax2.plot(epochs, [a * 100 for a in history["train_acc"]], "o-", color="#2ecc71", label="Train Acc (%)")
    ax2.plot(epochs, [a * 100 for a in history["val_acc"]], "s--", color="#9b59b6", label="Val Acc (%)")
    ax2.set_title("Training vs Validation Accuracy", fontsize=12, fontweight="bold")
    ax2.set_xlabel("Epoch", fontsize=10)
    ax2.set_ylabel("Accuracy (%)", fontsize=10)
    ax2.grid(True, linestyle="--", alpha=0.5)
    ax2.legend(loc="lower right")

    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()


def plot_per_class_metrics(per_class_dict: dict, class_names: list, save_path: str):
    """Plot per-class precision, recall, and F1 comparison bar chart."""
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
    x = np.arange(len(class_names))
    width = 0.25

    precisions = [per_class_dict[c]["precision"] * 100 for c in class_names]
    recalls = [per_class_dict[c]["recall"] * 100 for c in class_names]
    f1s = [per_class_dict[c]["f1_score"] * 100 for c in class_names]

    plt.figure(figsize=(10, 5))
    plt.bar(x - width, precisions, width, label="Precision (%)", color="#3498db")
    plt.bar(x, recalls, width, label="Recall (%)", color="#2ecc71")
    plt.bar(x + width, f1s, width, label="F1-Score (%)", color="#e67e22")

    plt.title("Per-Class Performance Breakdown (Test Split)", fontsize=12, fontweight="bold")
    plt.xlabel("Tomato Disease Class", fontsize=10)
    plt.ylabel("Score (%)", fontsize=10)
    plt.xticks(x, class_names, rotation=20, ha="right", fontsize=9)
    plt.ylim(0, 105)
    plt.grid(axis="y", linestyle="--", alpha=0.5)
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
