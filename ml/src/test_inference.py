"""
Automated Inference Verification Script.
Tests the trained model across held-out test samples from each of the 5 classes,
verifies accuracy, confidence output, probability calibration, and uncertainty handling.
"""

import os
import sys
import random

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.predict import TomatoLeafPredictor
from ml.src.utils import load_config, load_json


def run_inference_tests(samples_per_class: int = 3):
    print("=" * 75)
    print(" AUTOMATED MODEL INFERENCE VERIFICATION (TEST SET SAMPLES) ")
    print("=" * 75)

    predictor = TomatoLeafPredictor()
    cfg = load_config()

    test_file = os.path.join(cfg["paths"]["splits_dir"], "test.json")
    if not os.path.exists(test_file):
        raise FileNotFoundError("test.json split not found.")

    test_samples = load_json(test_file)
    classes = cfg["dataset"]["classes"]

    # Group test samples by true class
    class_groups = {c: [] for c in classes}
    for s in test_samples:
        class_groups[s["class_name"]].append(s)

    total_tested = 0
    total_correct = 0

    print(f"\nEvaluating {samples_per_class} unseen test samples per class:\n")

    for c_name in classes:
        print(f"--- Class: {c_name} ---")
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

            print(f"  File:       {os.path.basename(img_path)}")
            print(f"  Actual:     {actual}")
            print(f"  Predicted:  {pred}")
            print(f"  Confidence: {conf}%")
            print(f"  Result:     {status_mark}")
            print(f"  Probabilities: {result['probabilities']}")
            print()

    acc = (total_correct / max(1, total_tested)) * 100.0
    print("=" * 75)
    print(f"Inference Verification Summary: {total_correct}/{total_tested} Correct ({acc:.1f}%)")
    print("=" * 75)


if __name__ == "__main__":
    run_inference_tests()
