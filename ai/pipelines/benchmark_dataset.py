"""
AGRI SHIELD — CCMT Dataset Benchmark & Verification Utility.
Inspects the local dataset, reports class distribution, checks image decodability,
and benchmarks model inference throughput.
"""

import os
import sys
import time
from typing import Dict
from PIL import Image
import torch

# Add repository root to pythonpath
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ai.models.ccmt_classifier import (
    CCMT_CLASSES,
    CLASS_METADATA,
    CCMTDiseaseClassifier,
)
from ai.pipelines.ccmt_dataset import CCMTDataset, DEFAULT_TRANSFORMS


def benchmark_dataset(dataset_root: str):
    print("=" * 70)
    print(" AGRI SHIELD — CCMT DATASET BENCHMARK & SYSTEM ANALYSIS")
    print("=" * 70)
    print(f"Target Directory: {dataset_root}")

    if not os.path.isdir(dataset_root):
        print(f"ERROR: Dataset root directory does not exist: {dataset_root}")
        return

    # 1. Inspect Raw Data Subset
    print("\n[1/3] Scanning Raw Data Subset...")
    t0 = time.time()
    raw_ds = CCMTDataset(dataset_root=dataset_root, subset="raw")
    t1 = time.time()
    print(f"-> Discovered {len(raw_ds):,} raw images in {t1 - t0:.2f}s across {len(CCMT_CLASSES)} classes.")

    # 2. Class Distribution Summary
    raw_counts = raw_ds.get_class_counts()
    print("\n[2/3] Crop & Disease Breakdown (Raw Subset):")
    current_crop = ""
    for class_key in CCMT_CLASSES:
        meta = CLASS_METADATA[class_key]
        crop = meta["crop"]
        if crop != current_crop:
            print(f"\n  --- {crop.upper()} ---")
            current_crop = crop
        count = raw_counts.get(class_key, 0)
        tag = f"[{meta['pathogen_type']}]"
        print(f"  * {meta['condition']:<32} {tag:<18}: {count:>5} images")

    # 3. Model Inference Benchmark
    print("\n[3/3] Benchmarking PyTorch Neural Inference Engine...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"-> Execution Device: {device}")

    model = CCMTDiseaseClassifier(pretrained_backbone=False).to(device)
    model.eval()

    # Pick 4 test sample images from each crop
    test_crops = ["Cashew", "Cassava", "Maize", "Tomato"]
    print("\nEvaluating Sample Inference across Crops:")
    for crop_name in test_crops:
        sample_path = None
        for key in CCMT_CLASSES:
            if CLASS_METADATA[key]["crop"] == crop_name and not CLASS_METADATA[key]["is_healthy"]:
                sample_path = raw_ds.get_sample_for_class(key)
                if sample_path:
                    break

        if sample_path and os.path.exists(sample_path):
            with Image.open(sample_path) as img:
                img_rgb = img.convert("RGB")
                tensor = DEFAULT_TRANSFORMS(img_rgb).unsqueeze(0).to(device)

            start = time.time()
            top_preds = model.predict_top_k(tensor, k=3)
            duration_ms = (time.time() - start) * 1000.0

            top = top_preds[0]
            print(f"  [{crop_name}] Sample: {os.path.basename(sample_path)}")
            print(f"    Inference Latency: {duration_ms:.1f}ms")
            print(f"    Top Prediction:    {top['crop']} - {top['condition']} ({top['confidence_percent']}%)")
            print(f"    Pathogen:          {top['pathogen_type']} | Urgency: {top['urgency']}")

    print("\n" + "=" * 70)
    print(" BENCHMARK COMPLETED SUCCESSFULLY")
    print("=" * 70)


if __name__ == "__main__":
    dataset_path = sys.argv[1] if len(sys.argv) > 1 else r"c:\Users\krsan\Desktop\crop\Dataset for Crop Pest and Disease Detection"
    benchmark_dataset(dataset_path)
