"""
Cashew Dataset Audit, Validation, Stratified Splitting, and PyTorch Dataset Definition.
Covers 5 classes:
  - Disease: Anthracnose, Gummosis, Red Rust
  - Pest: Leaf Miner (explicitly pest, NOT disease)
  - Healthy: Healthy
Ensures zero data leakage and filters corrupted images.
"""

import os
import sys
import glob
import hashlib
from collections import Counter
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
from sklearn.model_selection import StratifiedShuffleSplit

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import save_json, load_json, load_config

CANONICAL_CASHEW_CLASSES = [
    "Anthracnose",
    "Gummosis",
    "Healthy",
    "Leaf Miner",
    "Red Rust",
]

CLASS_CATEGORIES = {
    "Anthracnose": "disease",
    "Gummosis": "disease",
    "Healthy": "healthy",
    "Leaf Miner": "pest",
    "Red Rust": "disease",
}

FOLDER_MAPPING = {
    "anthracnose": "Anthracnose",
    "authracnose": "Anthracnose",
    "gumosis": "Gummosis",
    "gummosis": "Gummosis",
    "healthy": "Healthy",
    "leaf miner": "Leaf Miner",
    "leaf_miner": "Leaf Miner",
    "red rust": "Red Rust",
    "red_rust": "Red Rust",
}


class CashewLeafDataset(Dataset):
    """PyTorch Dataset loading Cashew leaf images from manifest file."""

    def __init__(
        self,
        samples: List[Dict],
        class_to_idx: Dict[str, int],
        transform=None,
    ):
        self.samples = samples
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        item = self.samples[idx]
        image_path = item["filepath"]
        class_name = item["class_name"]
        label = self.class_to_idx[class_name]

        try:
            with Image.open(image_path) as img:
                image = img.convert("RGB")
        except Exception as e:
            # Fallback black image if read fails at runtime
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform is not None:
            image = self.transform(image)

        return image, label, image_path


def compute_md5(filepath: str, block_size: int = 65536) -> str:
    """Compute MD5 checksum of a file to detect duplicates."""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for block in iter(lambda: f.read(block_size), b""):
            hasher.update(block)
    return hasher.hexdigest()


def find_cashew_dataset_dir(configured_dir: str = "Cashew") -> str:
    """
    Search and verify Cashew dataset directory automatically without hardcoding assumptions.
    """
    candidates = [
        configured_dir,
        os.path.join(REPO_ROOT, configured_dir),
        os.path.join(REPO_ROOT, "Cashew"),
        os.path.join(REPO_ROOT, "cashew"),
        os.path.join(REPO_ROOT, "Dataset", "Cashew"),
        os.path.join(REPO_ROOT, "data", "Cashew"),
        os.path.join(os.path.dirname(REPO_ROOT), "Cashew"),
        "C:\\Users\\krsan\\Desktop\\crop\\Cashew",
    ]

    for cand in candidates:
        if os.path.exists(cand) and os.path.isdir(cand):
            subdirs = [
                d.lower()
                for d in os.listdir(cand)
                if os.path.isdir(os.path.join(cand, d))
            ]
            matches = [
                d for d in subdirs
                if any(k in d for k in ["anthracnose", "authracnose", "gumosis", "gummosis", "healthy", "leaf miner", "red rust"])
            ]
            if len(matches) >= 4:
                return os.path.abspath(cand)

    # Recursive scan from REPO_ROOT
    for root, dirs, _ in os.walk(REPO_ROOT):
        lowered = [d.lower() for d in dirs]
        if any("gumosis" in d or "gummosis" in d for d in lowered) and any("leaf miner" in d for d in lowered):
            return os.path.abspath(root)

    # Fallback search in user home / desktop
    desktop = os.path.expanduser("~/Desktop")
    if os.path.exists(desktop):
        for root, dirs, _ in os.walk(desktop):
            lowered = [d.lower() for d in dirs]
            if any("gumosis" in d or "gummosis" in d for d in lowered) and any("leaf miner" in d for d in lowered):
                return os.path.abspath(root)

    raise FileNotFoundError(
        f"Could not automatically locate the Cashew dataset folder. Searched candidates: {candidates}"
    )


def audit_cashew_dataset(raw_dir: str, valid_extensions: List[str]) -> Tuple[Dict, List[Dict]]:
    """
    Inspect the raw dataset, detect corruptions, quarantine duplicates, and compute statistics.
    """
    print(f"\n[Audit] Inspecting Cashew dataset at: {raw_dir}")
    subdirs = [
        d for d in os.listdir(raw_dir)
        if os.path.isdir(os.path.join(raw_dir, d))
    ]

    print(f"[Audit] Discovered subdirectories ({len(subdirs)}): {subdirs}")

    # Map folders to canonical class names
    detected_classes = {}
    for d in subdirs:
        norm = d.lower().strip()
        canonical = FOLDER_MAPPING.get(norm)
        if canonical:
            detected_classes[canonical] = d
        else:
            print(f"[Audit] WARNING: Unexpected folder encountered: {d}")

    print(f"[Audit] Mapped Canonical Classes ({len(detected_classes)}/5):")
    for can, folder in detected_classes.items():
        cat = CLASS_CATEGORIES.get(can, "unknown")
        print(f"  - {can} (Category: {cat}) -> Folder: '{folder}'")

    all_scanned_files = []
    corrupted_files = []
    seen_hashes = {}
    duplicate_files = []
    valid_samples = []

    widths = []
    heights = []
    extensions_counter = Counter()

    for canonical_name, folder_name in detected_classes.items():
        folder_path = os.path.join(raw_dir, folder_name)
        folder_files = set()
        for ext in valid_extensions:
            # Case-insensitive pattern
            folder_files.update(glob.glob(os.path.join(folder_path, f"*{ext}")))
            folder_files.update(glob.glob(os.path.join(folder_path, f"*{ext.upper()}")))

        print(f"[Audit] Scanning class '{canonical_name}': {len(folder_files)} candidate files")

        for fpath in sorted(list(folder_files)):
            all_scanned_files.append(fpath)
            _, ext = os.path.splitext(fpath)
            extensions_counter[ext.lower()] += 1

            # Check unreadable/corrupted image
            try:
                with Image.open(fpath) as img:
                    img.verify()
                with Image.open(fpath) as img:
                    w, h = img.size
                    widths.append(w)
                    heights.append(h)
            except Exception as e:
                corrupted_files.append({"filepath": fpath, "class": canonical_name, "error": str(e)})
                continue

            # Check duplicate hash to prevent train/test leakage
            try:
                fhash = compute_md5(fpath)
                if fhash in seen_hashes:
                    duplicate_files.append({
                        "filepath": fpath,
                        "duplicate_of": seen_hashes[fhash],
                        "class": canonical_name,
                    })
                    continue
                seen_hashes[fhash] = fpath
            except Exception as e:
                corrupted_files.append({"filepath": fpath, "class": canonical_name, "error": f"MD5 error: {e}"})
                continue

            valid_samples.append({
                "filepath": os.path.abspath(fpath),
                "filename": os.path.basename(fpath),
                "class_name": canonical_name,
                "category": CLASS_CATEGORIES.get(canonical_name, "unknown"),
                "width": w,
                "height": h,
            })

    raw_class_counts = Counter([s["class_name"] for s in valid_samples])

    report = {
        "dataset_name": "Cashew Leaf Disease & Pest Dataset",
        "dataset_location": raw_dir,
        "total_images_scanned": len(all_scanned_files),
        "corrupted_images_count": len(corrupted_files),
        "corrupted_files": corrupted_files,
        "duplicate_images_count": len(duplicate_files),
        "duplicate_files": duplicate_files,
        "clean_unique_images_count": len(valid_samples),
        "classes_detected": list(detected_classes.keys()),
        "class_categories": CLASS_CATEGORIES,
        "raw_class_distribution": dict(raw_class_counts),
        "formats_distribution": dict(extensions_counter),
        "dimensions": {
            "min_width": int(min(widths)) if widths else 0,
            "max_width": int(max(widths)) if widths else 0,
            "min_height": int(min(heights)) if heights else 0,
            "max_height": int(max(heights)) if heights else 0,
            "avg_width": float(np.mean(widths)) if widths else 0,
            "avg_height": float(np.mean(heights)) if heights else 0,
        },
    }

    return report, valid_samples


def create_stratified_splits(
    samples: List[Dict],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    random_seed: int = 42,
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Split clean samples into 70% Train, 15% Validation, 15% Test with zero data leakage.
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-5

    labels = [s["class_name"] for s in samples]

    # Split Train vs (Val + Test)
    val_test_ratio = val_ratio + test_ratio
    sss1 = StratifiedShuffleSplit(n_splits=1, test_size=val_test_ratio, random_state=random_seed)
    train_idx, val_test_idx = next(sss1.split(samples, labels))

    train_samples = [samples[i] for i in train_idx]
    val_test_samples = [samples[i] for i in val_test_idx]
    val_test_labels = [labels[i] for i in val_test_idx]

    # Split Val vs Test (50/50 of remaining 30%)
    relative_test_ratio = test_ratio / val_test_ratio
    sss2 = StratifiedShuffleSplit(n_splits=1, test_size=relative_test_ratio, random_state=random_seed)
    val_sub_idx, test_sub_idx = next(sss2.split(val_test_samples, val_test_labels))

    val_samples = [val_test_samples[i] for i in val_sub_idx]
    test_samples = [val_test_samples[i] for i in test_sub_idx]

    return train_samples, val_samples, test_samples


def main():
    config_path = os.path.join(REPO_ROOT, "ml", "config_cashew.yaml")
    config = load_config(config_path)

    raw_dir = find_cashew_dataset_dir(config["dataset"]["raw_dir"])
    valid_exts = config["dataset"]["image_extensions"]

    report, valid_samples = audit_cashew_dataset(raw_dir, valid_exts)

    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)
    save_json(report, os.path.join(reports_dir, "dataset_report.json"))

    print("\n" + "=" * 55)
    print("           CASHEW DATASET REPORT")
    print("=" * 55)
    for c in CANONICAL_CASHEW_CLASSES:
        cnt = report["raw_class_distribution"].get(c, 0)
        cat = CLASS_CATEGORIES.get(c, "").capitalize()
        print(f"  {c:<18} ({cat:<7}): {cnt:>5} images")
    print("-" * 55)
    print(f"  Total Scanned           : {report['total_images_scanned']:>5} images")
    print(f"  Corrupted Filtered      : {report['corrupted_images_count']:>5} images")
    print(f"  Duplicates Quarantined  : {report['duplicate_images_count']:>5} images")
    print(f"  Clean Unique Dataset    : {report['clean_unique_images_count']:>5} images")
    print(f"  Min Image Resolution   : {report['dimensions']['min_width']}x{report['dimensions']['min_height']}")
    print(f"  Max Image Resolution   : {report['dimensions']['max_width']}x{report['dimensions']['max_height']}")
    print(f"  Avg Image Resolution   : {report['dimensions']['avg_width']:.1f}x{report['dimensions']['avg_height']:.1f}")
    print("=" * 55)

    # Perform stratified split
    train_samples, val_samples, test_samples = create_stratified_splits(
        valid_samples,
        train_ratio=config["dataset"]["train_split"],
        val_ratio=config["dataset"]["val_split"],
        test_ratio=config["dataset"]["test_split"],
        random_seed=config["dataset"]["random_seed"],
    )

    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])
    os.makedirs(splits_dir, exist_ok=True)
    save_json(train_samples, os.path.join(splits_dir, "train.json"))
    save_json(val_samples, os.path.join(splits_dir, "val.json"))
    save_json(test_samples, os.path.join(splits_dir, "test.json"))

    print("\n[Splits] Stratified Data Partitioning (70% / 15% / 15%):")
    print(f"  - Training Set   : {len(train_samples)} samples")
    print(f"  - Validation Set : {len(val_samples)} samples")
    print(f"  - Test Set       : {len(test_samples)} samples")

    # Verify zero leakage via MD5 hashes
    train_hashes = {compute_md5(s["filepath"]) for s in train_samples}
    val_hashes = {compute_md5(s["filepath"]) for s in val_samples}
    test_hashes = {compute_md5(s["filepath"]) for s in test_samples}

    leak_train_val = train_hashes.intersection(val_hashes)
    leak_train_test = train_hashes.intersection(test_hashes)
    leak_val_test = val_hashes.intersection(test_hashes)

    assert len(leak_train_val) == 0, f"Data leakage between Train & Val: {len(leak_train_val)}"
    assert len(leak_train_test) == 0, f"Data leakage between Train & Test: {len(leak_train_test)}"
    assert len(leak_val_test) == 0, f"Data leakage between Val & Test: {len(leak_val_test)}"

    print("[Splits] Zero data leakage strictly verified across Train, Val, and Test splits!")


if __name__ == "__main__":
    main()
