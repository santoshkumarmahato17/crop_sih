"""
Cotton Leaf Disease & Pest Dataset: Audit, Validation, Stratified Splitting, and PyTorch Dataset.
7 Classes:
  1. Bacterial Blight (Disease)
  2. Curl Virus (Disease / Viral Condition)
  3. Healthy Leaf (Healthy)
  4. Herbicide Growth Damage (Chemical / Herbicide Damage)
  5. Leaf Hopper Jassids (Pest)
  6. Leaf Redding (Leaf Condition)
  7. Leaf Variegation (Leaf Condition)
"""

import os
import sys
import glob
import hashlib
import json
from collections import Counter
from typing import Dict, List, Tuple, Any

import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
from sklearn.model_selection import StratifiedShuffleSplit

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import save_json, load_json, load_config

# Canonical class order — this defines the index mapping used everywhere
CANONICAL_COTTON_CLASSES = [
    "Bacterial Blight",
    "Curl Virus",
    "Healthy Leaf",
    "Herbicide Growth Damage",
    "Leaf Hopper Jassids",
    "Leaf Redding",
    "Leaf Variegation",
]

CLASS_CATEGORIES = {
    "Bacterial Blight": "Disease",
    "Curl Virus": "Disease / Viral Condition",
    "Healthy Leaf": "Healthy",
    "Herbicide Growth Damage": "Chemical / Herbicide Damage",
    "Leaf Hopper Jassids": "Pest",
    "Leaf Redding": "Leaf Condition",
    "Leaf Variegation": "Leaf Condition",
}

CLASS_DISPLAY_NAMES = {
    "Bacterial Blight": "Bacterial Blight",
    "Curl Virus": "Curl Virus",
    "Healthy Leaf": "Healthy Cotton Leaf",
    "Herbicide Growth Damage": "Herbicide Growth Damage",
    "Leaf Hopper Jassids": "Leaf Hopper / Jassids",
    "Leaf Redding": "Leaf Redding",
    "Leaf Variegation": "Leaf Variegation",
}

FOLDER_MAPPING = {
    "bacterial blight": "Bacterial Blight",
    "curl virus": "Curl Virus",
    "healthy leaf": "Healthy Leaf",
    "herbicide growth damage": "Herbicide Growth Damage",
    "leaf hopper jassids": "Leaf Hopper Jassids",
    "leaf redding": "Leaf Redding",
    "leaf variegation": "Leaf Variegation",
}


class CottonLeafDataset(Dataset):
    """PyTorch Dataset for Cotton leaf images from sample manifest records."""

    def __init__(self, samples: List[Dict], class_to_idx: Dict[str, int], transform=None):
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
        except Exception:
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform is not None:
            image = self.transform(image)

        return image, label, image_path


def compute_md5(filepath: str, block_size: int = 65536) -> str:
    """Compute MD5 checksum for duplicate detection."""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for block in iter(lambda: f.read(block_size), b""):
            hasher.update(block)
    return hasher.hexdigest()


def discover_and_audit_cotton_dataset(config_path: str = "ml/config_cotton.yaml") -> Tuple[List[Dict], Dict]:
    """
    Walk the raw dataset directory, validate images, detect duplicates,
    and return (valid_samples, audit_report).
    """
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)

    raw_dir = os.path.join(REPO_ROOT, config["dataset"]["raw_dir"])
    class_mapping = config["class_mapping"]

    if not os.path.exists(raw_dir):
        raise FileNotFoundError(f"Dataset directory not found: {raw_dir}")

    all_samples: List[Dict] = []
    skipped_samples: List[Dict] = []
    corrupted_count = 0
    duplicate_count = 0
    small_image_count = 0
    dimension_stats: Dict[str, List] = {}
    format_counter: Counter = Counter()
    seen_hashes: set = set()

    valid_ext_set = {e.lower() for e in config["dataset"]["image_extensions"]}

    for class_folder in sorted(os.listdir(raw_dir)):
        class_path = os.path.join(raw_dir, class_folder)
        if not os.path.isdir(class_path):
            continue

        canonical_class = class_mapping.get(class_folder.lower())
        if not canonical_class:
            skipped_samples.append({"filepath": class_path, "reason": f"Unknown folder '{class_folder}'"})
            continue

        for fname in os.listdir(class_path):
            fpath = os.path.join(class_path, fname)
            if not os.path.isfile(fpath):
                continue

            ext = os.path.splitext(fname)[1].lower()
            if ext not in valid_ext_set:
                skipped_samples.append({"filepath": fpath, "reason": f"Unsupported extension '{ext}'"})
                continue

            # Integrity check
            try:
                with Image.open(fpath) as img:
                    img.verify()
                # Re-open to get actual size (verify closes the file)
                with Image.open(fpath) as img:
                    w, h = img.size
                    fmt = (img.format or "UNKNOWN").upper()
            except Exception as e:
                corrupted_count += 1
                skipped_samples.append({"filepath": fpath, "reason": f"Corrupted: {e}"})
                continue

            format_counter[fmt] += 1

            if min(w, h) < 50:
                small_image_count += 1
                skipped_samples.append({"filepath": fpath, "reason": f"Too small: {w}x{h}"})
                continue

            # Duplicate detection
            file_hash = compute_md5(fpath)
            if file_hash in seen_hashes:
                duplicate_count += 1
                skipped_samples.append({"filepath": fpath, "reason": "Duplicate (MD5)"})
                continue
            seen_hashes.add(file_hash)

            # Track dimensions
            dimension_stats.setdefault(canonical_class, []).append((w, h))

            all_samples.append({
                "filepath": fpath,
                "class_name": canonical_class,
                "width": w,
                "height": h,
            })

        print(f"[Cotton Audit] Processed '{class_folder}': {len(dimension_stats.get(canonical_class, []))} images", flush=True)

    class_dist = dict(Counter(s["class_name"] for s in all_samples))

    # Dimension summary per class
    dim_summary = {}
    for cls, dims in dimension_stats.items():
        ws = [d[0] for d in dims]
        hs = [d[1] for d in dims]
        dim_summary[cls] = {
            "count": len(dims),
            "min_w": min(ws), "max_w": max(ws), "avg_w": round(np.mean(ws)),
            "min_h": min(hs), "max_h": max(hs), "avg_h": round(np.mean(hs)),
        }

    audit_report = {
        "dataset_name": config["dataset"]["name"],
        "raw_dir": raw_dir,
        "total_discovered": len(all_samples) + len(skipped_samples),
        "total_valid": len(all_samples),
        "total_skipped": len(skipped_samples),
        "corrupted_images": corrupted_count,
        "duplicate_images": duplicate_count,
        "small_images": small_image_count,
        "formats": dict(format_counter),
        "class_distribution": class_dist,
        "dimension_summary": dim_summary,
        "skipped_details": skipped_samples[:200],
    }

    print(f"\n{'='*60}")
    print(f" COTTON DATASET AUDIT")
    print(f"{'='*60}")
    for cls in CANONICAL_COTTON_CLASSES:
        print(f"  {cls}: {class_dist.get(cls, 0)} images")
    print(f"  {'-'*40}")
    print(f"  Total valid: {len(all_samples)}")
    print(f"  Corrupted:   {corrupted_count}")
    print(f"  Duplicates:  {duplicate_count}")
    print(f"  Small (<50): {small_image_count}")
    print(f"  Formats:     {dict(format_counter)}")
    print(f"{'='*60}\n")

    return all_samples, audit_report


def prepare_cotton_splits(config_path: str = "ml/config_cotton.yaml", force_recreate: bool = False):
    """Create stratified train/val/test splits and save to JSON manifests."""
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])

    train_file = os.path.join(splits_dir, "train.json")
    val_file = os.path.join(splits_dir, "val.json")
    test_file = os.path.join(splits_dir, "test.json")

    if not force_recreate and all(os.path.exists(f) for f in [train_file, val_file, test_file]):
        print(f"[Cotton] Splits already exist in {splits_dir}. Skipping.")
        return

    os.makedirs(splits_dir, exist_ok=True)
    all_samples, audit_report = discover_and_audit_cotton_dataset(config_path)

    seed = config["dataset"]["random_seed"]
    X = list(range(len(all_samples)))
    y = [s["class_name"] for s in all_samples]

    # Split: 80% train, 20% temp
    sss1 = StratifiedShuffleSplit(n_splits=1, test_size=0.20, random_state=seed)
    train_idx, temp_idx = next(sss1.split(X, y))

    train_samples = [all_samples[i] for i in train_idx]
    temp_samples = [all_samples[i] for i in temp_idx]

    # Split temp: 50/50 -> val and test (each 10% of total)
    temp_y = [s["class_name"] for s in temp_samples]
    sss2 = StratifiedShuffleSplit(n_splits=1, test_size=0.50, random_state=seed)
    val_idx, test_idx = next(sss2.split(range(len(temp_samples)), temp_y))

    val_samples = [temp_samples[i] for i in val_idx]
    test_samples = [temp_samples[i] for i in test_idx]

    save_json(train_samples, train_file)
    save_json(val_samples, val_file)
    save_json(test_samples, test_file)

    # Save audit report
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)
    save_json(audit_report, os.path.join(reports_dir, "dataset_audit.json"))

    # Generate dataset_report.md
    md_lines = [
        "# Cotton Leaf Disease & Pest Dataset Audit Report\n",
        f"**Dataset**: {audit_report['dataset_name']}\n",
        f"**Location**: `{audit_report['raw_dir']}`\n",
        f"**Random Seed**: {seed}\n",
        "",
        "## Class Distribution\n",
        "| Class | Images |",
        "|-------|--------|",
    ]
    for cls in CANONICAL_COTTON_CLASSES:
        md_lines.append(f"| {cls} | {audit_report['class_distribution'].get(cls, 0)} |")
    md_lines.extend([
        f"| **Total** | **{audit_report['total_valid']}** |",
        "",
        "## Data Quality\n",
        f"- Corrupted images: {audit_report['corrupted_images']}",
        f"- Duplicate images: {audit_report['duplicate_images']}",
        f"- Small images (<50px): {audit_report['small_images']}",
        f"- Formats: {audit_report['formats']}",
        "",
        "## Split Statistics\n",
        f"- Train: {len(train_samples)} images",
        f"- Validation: {len(val_samples)} images",
        f"- Test: {len(test_samples)} images",
    ])
    with open(os.path.join(reports_dir, "dataset_report.md"), "w") as f:
        f.write("\n".join(md_lines))

    print(f"[Cotton] Saved {len(train_samples)} train, {len(val_samples)} val, {len(test_samples)} test samples.")


def get_cotton_dataloaders(
    config_path: str = "ml/config_cotton.yaml",
    batch_size: int = 16,
    num_workers: int = 0,
) -> Tuple[torch.utils.data.DataLoader, torch.utils.data.DataLoader, torch.utils.data.DataLoader, Dict[str, int]]:
    """Return train/val/test DataLoaders and class_to_idx mapping."""
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)

    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])
    train_file = os.path.join(splits_dir, "train.json")

    if not os.path.exists(train_file):
        print("[Cotton] Splits not found. Preparing splits...")
        prepare_cotton_splits(config_path)

    train_samples = load_json(os.path.join(splits_dir, "train.json"))
    val_samples = load_json(os.path.join(splits_dir, "val.json"))
    test_samples = load_json(os.path.join(splits_dir, "test.json"))

    class_to_idx = {cls: idx for idx, cls in enumerate(CANONICAL_COTTON_CLASSES)}

    from ml.src.augmentation import get_training_transforms, get_validation_transforms

    input_size = config["model"]["input_size"]
    train_ds = CottonLeafDataset(train_samples, class_to_idx, transform=get_training_transforms(input_size))
    val_ds = CottonLeafDataset(val_samples, class_to_idx, transform=get_validation_transforms(input_size))
    test_ds = CottonLeafDataset(test_samples, class_to_idx, transform=get_validation_transforms(input_size))

    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = torch.utils.data.DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, test_loader, class_to_idx


if __name__ == "__main__":
    prepare_cotton_splits(force_recreate=True)
