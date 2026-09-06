"""
AGRI SHIELD — CCMT Dataset Loader & PyTorch Pipeline.
Scans and parses the CCMT (Cashew, Cassava, Maize, Tomato) Crop Pest & Disease Dataset.
"""

import os
import random
from typing import Callable, Dict, List, Optional, Tuple
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

from ai.models.ccmt_classifier import CCMT_CLASSES, FOLDER_TO_CLASS_KEY, CLASS_METADATA

DEFAULT_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

AUGMENTED_TRAIN_TRANSFORMS = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


class CCMTDataset(Dataset):
    """
    PyTorch Dataset accessing the CCMT Crop Pest and Disease Detection collection.
    Supports 'raw', 'train', 'test', or 'all' subsets.
    """

    VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".webp", ".JPG", ".JPEG", ".PNG")

    def __init__(
        self,
        dataset_root: str,
        subset: str = "raw",  # "raw", "train", "test", or "all"
        transform: Optional[Callable] = None,
        max_samples_per_class: Optional[int] = None,
    ):
        self.dataset_root = os.path.abspath(dataset_root)
        self.subset = subset
        self.transform = transform or DEFAULT_TRANSFORMS
        self.max_samples_per_class = max_samples_per_class

        self.samples: List[Tuple[str, int, str]] = []  # (file_path, class_index, class_key)
        self.class_to_idx = {k: i for i, k in enumerate(CCMT_CLASSES)}
        self.idx_to_class = {i: k for i, k in enumerate(CCMT_CLASSES)}

        self._scan_dataset()

    def _scan_dataset(self) -> None:
        """Discovers image files and maps to normalized 22 classes."""
        raw_root = os.path.join(self.dataset_root, "Raw Data", "CCMT Dataset")
        aug_root = os.path.join(self.dataset_root, "CCMT Dataset-Augmented")

        targets_to_scan = []
        if self.subset in ("raw", "all") and os.path.isdir(raw_root):
            for crop in os.listdir(raw_root):
                crop_dir = os.path.join(raw_root, crop)
                if os.path.isdir(crop_dir):
                    for cond in os.listdir(crop_dir):
                        cond_dir = os.path.join(crop_dir, cond)
                        if os.path.isdir(cond_dir):
                            targets_to_scan.append((crop, cond, cond_dir))

        if self.subset in ("train", "all") and os.path.isdir(aug_root):
            for crop in os.listdir(aug_root):
                train_dir = os.path.join(aug_root, crop, "train_set")
                if os.path.isdir(train_dir):
                    for cond in os.listdir(train_dir):
                        cond_dir = os.path.join(train_dir, cond)
                        if os.path.isdir(cond_dir):
                            targets_to_scan.append((crop, cond, cond_dir))

        if self.subset in ("test", "all") and os.path.isdir(aug_root):
            for crop in os.listdir(aug_root):
                test_dir = os.path.join(aug_root, crop, "test_set")
                if os.path.isdir(test_dir):
                    for cond in os.listdir(test_dir):
                        cond_dir = os.path.join(test_dir, cond)
                        if os.path.isdir(cond_dir):
                            targets_to_scan.append((crop, cond, cond_dir))

        # Build list with class counts tracking
        class_samples: Dict[str, List[Tuple[str, int, str]]] = {k: [] for k in CCMT_CLASSES}

        for crop, raw_cond, folder_path in targets_to_scan:
            crop_clean = crop.lower().strip()
            # Remove digits from augmented folder names (e.g. anthracnose3102 -> anthracnose)
            cond_clean = "".join([c for c in raw_cond if not c.isdigit()]).lower().strip()
            
            key = FOLDER_TO_CLASS_KEY.get((crop_clean, cond_clean))
            if not key:
                # Try fuzzy matching
                for (c, cd), k in FOLDER_TO_CLASS_KEY.items():
                    if c == crop_clean and (cd in cond_clean or cond_clean in cd):
                        key = k
                        break

            if not key or key not in self.class_to_idx:
                continue

            class_idx = self.class_to_idx[key]

            try:
                for entry in os.scandir(folder_path):
                    if entry.is_file() and entry.name.lower().endswith(self.VALID_EXTENSIONS):
                        class_samples[key].append((entry.path, class_idx, key))
            except Exception:
                continue

        # Assemble final samples, respecting max_samples_per_class
        for key, items in class_samples.items():
            if self.max_samples_per_class and len(items) > self.max_samples_per_class:
                selected = random.sample(items, self.max_samples_per_class)
            else:
                selected = items
            self.samples.extend(selected)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        file_path, class_idx, class_key = self.samples[idx]
        try:
            with Image.open(file_path) as img:
                img = img.convert("RGB")
                tensor = self.transform(img)
        except Exception:
            # Return blank placeholder if decode fails
            tensor = torch.zeros((3, 224, 224), dtype=torch.float32)
        return tensor, class_idx, class_key

    def get_class_counts(self) -> Dict[str, int]:
        counts = {k: 0 for k in CCMT_CLASSES}
        for _, _, key in self.samples:
            counts[key] = counts.get(key, 0) + 1
        return counts

    def get_sample_for_class(self, class_key: str) -> Optional[str]:
        """Returns the file path of a random sample belonging to class_key."""
        matching = [p for p, _, k in self.samples if k == class_key]
        return random.choice(matching) if matching else None


def get_ccmt_dataloader(
    dataset_root: str,
    subset: str = "raw",
    batch_size: int = 32,
    shuffle: bool = True,
    num_workers: int = 0,
    max_samples_per_class: Optional[int] = None,
) -> DataLoader:
    """Convenience builder returning a PyTorch DataLoader for CCMT."""
    tf = AUGMENTED_TRAIN_TRANSFORMS if subset == "train" else DEFAULT_TRANSFORMS
    dataset = CCMTDataset(
        dataset_root=dataset_root,
        subset=subset,
        transform=tf,
        max_samples_per_class=max_samples_per_class,
    )
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=False,
    )
