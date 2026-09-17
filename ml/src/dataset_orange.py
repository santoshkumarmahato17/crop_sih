import os
import sys
import glob
import hashlib
from collections import Counter
from typing import Dict, List, Tuple

from PIL import Image
import torch
from torch.utils.data import Dataset
from sklearn.model_selection import StratifiedShuffleSplit

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import save_json, load_json, load_config

class OrangeLeafDataset(Dataset):
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
        except Exception:
            # Fallback zero-filled image if file read fails at runtime
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform is not None:
            image = self.transform(image)

        return image, label, image_path

def compute_md5(filepath: str, block_size: int = 65536) -> str:
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for block in iter(lambda: f.read(block_size), b""):
            hasher.update(block)
    return hasher.hexdigest()

def discover_and_audit_orange_dataset(config_path: str = "ml/config_orange.yaml") -> Tuple[List[Dict], Dict]:
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    
    raw_dir = os.path.join(REPO_ROOT, config["dataset"]["raw_dir"])
    class_mapping = config["class_mapping"]
    canonical_classes = config["classes"]
    
    if not os.path.exists(raw_dir):
        raise FileNotFoundError(f"Dataset directory not found: {raw_dir}")
        
    all_samples = []
    skipped_samples = []
    
    # Track duplicates
    seen_hashes = set()
    
    for ext in config["dataset"]["image_extensions"]:
        for file_path in glob.glob(os.path.join(raw_dir, "**", f"*{ext}"), recursive=True):
            folder_name = os.path.basename(os.path.dirname(file_path)).lower()
            
            # Use mapping to find canonical class
            canonical_class = class_mapping.get(folder_name)
            if not canonical_class:
                skipped_samples.append({"filepath": file_path, "reason": f"Unknown folder '{folder_name}'"})
                continue
                
            # Basic integrity and duplicate check
            try:
                # Check readability and format
                with Image.open(file_path) as img:
                    img.verify()
                    if img.format.lower() not in [e.replace(".", "") for e in config["dataset"]["image_extensions"]]:
                        skipped_samples.append({"filepath": file_path, "reason": "Invalid image format"})
                        continue
                    if min(img.size) < 50:
                        skipped_samples.append({"filepath": file_path, "reason": f"Image too small: {img.size}"})
                        continue
                        
                # Check for duplicates using MD5
                file_hash = compute_md5(file_path)
                if file_hash in seen_hashes:
                    skipped_samples.append({"filepath": file_path, "reason": "Duplicate content"})
                    continue
                seen_hashes.add(file_hash)
                
                all_samples.append({
                    "filepath": file_path,
                    "class_name": canonical_class
                })
                
            except Exception as e:
                skipped_samples.append({"filepath": file_path, "reason": f"Corrupted file: {str(e)}"})
                
    audit_report = {
        "total_discovered": len(all_samples) + len(skipped_samples),
        "total_valid": len(all_samples),
        "total_skipped": len(skipped_samples),
        "skipped_details": skipped_samples[:100],  # Keep up to 100 details
        "class_distribution": dict(Counter(s["class_name"] for s in all_samples))
    }
    
    print(f"[Audit] Total valid samples: {len(all_samples)}")
    for k, v in audit_report["class_distribution"].items():
        print(f"  - {k}: {v}")
        
    if skipped_samples:
        print(f"[Audit] Skipped {len(skipped_samples)} invalid/duplicate files.")
        
    return all_samples, audit_report

def prepare_orange_splits(config_path: str = "ml/config_orange.yaml", force_recreate: bool = False):
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])
    
    train_file = os.path.join(splits_dir, "train.json")
    val_file = os.path.join(splits_dir, "val.json")
    test_file = os.path.join(splits_dir, "test.json")
    
    if not force_recreate and os.path.exists(train_file) and os.path.exists(val_file) and os.path.exists(test_file):
        print(f"[Prepare] Splits already exist in {splits_dir}. Skipping recreation.")
        return
        
    os.makedirs(splits_dir, exist_ok=True)
    all_samples, audit_report = discover_and_audit_orange_dataset(config_path)
    
    # Stratified Split: Train (80%), Val (10%), Test (10%)
    X = [s["filepath"] for s in all_samples]
    y = [s["class_name"] for s in all_samples]
    
    # First split: Train vs Temp (Val+Test)
    sss_train = StratifiedShuffleSplit(n_splits=1, test_size=0.20, random_state=config["dataset"]["random_seed"])
    train_idx, temp_idx = next(sss_train.split(X, y))
    
    train_samples = [all_samples[i] for i in train_idx]
    temp_samples = [all_samples[i] for i in temp_idx]
    
    # Second split: Val vs Test (from Temp) -> 50% of Temp each (since temp is 20%, each becomes 10%)
    temp_X = [s["filepath"] for s in temp_samples]
    temp_y = [s["class_name"] for s in temp_samples]
    sss_val = StratifiedShuffleSplit(n_splits=1, test_size=0.50, random_state=config["dataset"]["random_seed"])
    val_idx, test_idx = next(sss_val.split(temp_X, temp_y))
    
    val_samples = [temp_samples[i] for i in val_idx]
    test_samples = [temp_samples[i] for i in test_idx]
    
    save_json(train_samples, train_file)
    save_json(val_samples, val_file)
    save_json(test_samples, test_file)
    
    reports_dir = os.path.join(REPO_ROOT, config["dataset"]["reports_dir"])
    os.makedirs(reports_dir, exist_ok=True)
    save_json(audit_report, os.path.join(reports_dir, "dataset_audit.json"))
    
    print(f"[Prepare] Saved {len(train_samples)} train, {len(val_samples)} val, and {len(test_samples)} test samples.")

def get_orange_dataloaders(
    config_path: str = "ml/config_orange.yaml",
    batch_size: int = 32,
    num_workers: int = 0
) -> Tuple[torch.utils.data.DataLoader, torch.utils.data.DataLoader, torch.utils.data.DataLoader, Dict[str, int]]:
    full_config_path = os.path.join(REPO_ROOT, config_path)
    config = load_config(full_config_path)
    
    splits_dir = os.path.join(REPO_ROOT, config["dataset"]["splits_dir"])
    train_file = os.path.join(splits_dir, "train.json")
    val_file = os.path.join(splits_dir, "val.json")
    test_file = os.path.join(splits_dir, "test.json")
    
    if not os.path.exists(train_file):
        print("[Loader] Splits not found. Preparing splits...")
        prepare_orange_splits(config_path)
        
    train_samples = load_json(train_file)
    val_samples = load_json(val_file)
    test_samples = load_json(test_file)
    
    canonical_classes = config["classes"]
    class_to_idx = {cls: idx for idx, cls in enumerate(canonical_classes)}
    
    from ml.src.augmentation import get_training_transforms, get_validation_transforms
    
    train_ds = OrangeLeafDataset(train_samples, class_to_idx, transform=get_training_transforms(config["model"]["input_size"]))
    val_ds = OrangeLeafDataset(val_samples, class_to_idx, transform=get_validation_transforms(config["model"]["input_size"]))
    test_ds = OrangeLeafDataset(test_samples, class_to_idx, transform=get_validation_transforms(config["model"]["input_size"]))
    
    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = torch.utils.data.DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = torch.utils.data.DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    
    return train_loader, val_loader, test_loader, class_to_idx

if __name__ == "__main__":
    prepare_orange_splits(force_recreate=True)
