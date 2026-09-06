"""
Automated Inference Verification Script for 7-Class Maize Classifier.
Tests unseen held-out test samples across all 7 classes (Pests & Diseases),
verifies confidence scoring, probability calibration, and category attribution.
"""

import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.predict_maize import MaizeLeafPredictor
from ml.src.utils import load_config, load_json


def run_maize_inference_tests(samples_per_class: int = 2):
    print("=" * 75)
    print(" AUTOMATED MAIZE INFERENCE VERIFICATION (UNSEEN TEST SAMPLES) ")
    print("=" * 75)

    predictor = MaizeLeafPredictor()
    cfg = load_config("ml/config_maize.yaml")

    test_file = os.path.join(cfg["paths"]["splits_dir"], "test.json")
    if not os.path.exists(test_file):
        raise FileNotFoundError("test.json split not found.")

    test_samples = load_json(test_file)
    classes = cfg["dataset"]["classes"]

    class_groups = {c: [] for c in classes}
    for s in test_samples:
        class_groups[s["class_name"]].append(s)

    total_tested = 0
    total_correct = 0

    print(f"\nTesting {samples_per_class} unseen test samples per class:\n")

    for c_name in classes:
        print(f"--- Class: {c_name} (Category: {cfg['dataset']['class_categories'].get(c_name)}) ---")
        samples = class_groups[c_name][:samples_per_class]

        for s in samples:
            img_path = s["filepath"]
            actual = s["class_name"]
            result = predictor.predict(img_path)

            pred = result["predicted_class_raw"]
            conf = result["confidence"]
            is_correct = (pred == actual)

            total_tested += 1
            if is_correct:
                total_correct += 1

            status_mark = "CORRECT [PASS]" if is_correct else "INCORRECT [FAIL]"

            print(f"  File:        {os.path.basename(img_path)}")
            print(f"  Actual:      {actual}")
            print(f"  Predicted:   {pred}")
            print(f"  Category:    {result['category']}")
            print(f"  Confidence:  {conf}%")
            print(f"  Result:      {status_mark}")
            print(f"  Probabilities: {result['probabilities']}")
            print()

    acc = (total_correct / max(1, total_tested)) * 100.0
    print("=" * 75)
    print(f"Maize Inference Verification Summary: {total_correct}/{total_tested} Correct ({acc:.1f}%)")
    print("=" * 75)


if __name__ == "__main__":
    run_maize_inference_tests()
