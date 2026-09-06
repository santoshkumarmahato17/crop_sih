"""
AGRI SHIELD — Crop Disease & Pest Dataset Pipeline.
Supports loading from CSV format (image_path, label) and folder structures (ImageFolder-style),
applying specified data augmentations, normalization, and generating dataset splits.
"""

import os
import csv
import random
from typing import Callable, Dict, List, Optional, Tuple, Union
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as T

from ai.models.crop_classifier import RICE_MAIZE_CLASSES, CLASS_ALIASES

# ------------------------------------------------------------------------------
# Image Transforms & Augmentations as specified in system design
# ------------------------------------------------------------------------------
def get_transforms(mode: str = "train", img_size: int = 224) -> T.Compose:
    """
    Returns torchvision transform pipelines.
    
    Train mode:
      - RandomResizedCrop(224)
      - RandomHorizontalFlip()
      - ColorJitter (brightness, contrast, saturation)
      - RandomRotation(±15°)
      - ToTensor
      - ImageNet Normalization
      
    Val/Inference mode:
      - Resize(256)
      - CenterCrop(224)
      - ToTensor
      - ImageNet Normalization
    """
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]

    if mode == "train":
        return T.Compose([
            T.RandomResizedCrop(img_size, scale=(0.8, 1.0)),
            T.RandomHorizontalFlip(p=0.5),
            T.RandomRotation(degrees=15),
            T.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
            T.ToTensor(),
            T.Normalize(mean=mean, std=std),
        ])
    else:
        return T.Compose([
            T.Resize(256),
            T.CenterCrop(img_size),
            T.ToTensor(),
            T.Normalize(mean=mean, std=std),
        ])


# ------------------------------------------------------------------------------
# PyTorch Dataset
# ------------------------------------------------------------------------------
class CropDiseaseDataset(Dataset):
    """
    PyTorch Dataset for Crop Pest & Disease Images.
    Supports either:
      1. A list of (image_path, class_name) tuples.
      2. A CSV file containing 'image_path' and 'label' columns.
      3. A root directory organized by class subfolders.
    """

    def __init__(
        self,
        data_source: Union[str, List[Tuple[str, str]]],
        class_names: Optional[List[str]] = None,
        transform: Optional[Callable] = None,
        base_dir: Optional[str] = None,
        max_samples_per_class: Optional[int] = None,
    ):
        self.class_names = class_names or RICE_MAIZE_CLASSES
        self.class_to_idx = {name: idx for idx, name in enumerate(self.class_names)}
        self.transform = transform or get_transforms(mode="val")
        self.base_dir = base_dir or ""
        self.samples: List[Tuple[str, int]] = []  # (abs_img_path, class_idx)

        # 1. If data_source is a list of tuples
        if isinstance(data_source, list):
            self._load_from_tuples(data_source)
        # 2. If data_source is a CSV file
        elif isinstance(data_source, str) and data_source.lower().endswith(".csv"):
            self._load_from_csv(data_source)
        # 3. If data_source is a directory
        elif isinstance(data_source, str) and os.path.isdir(data_source):
            self._load_from_directory(data_source, max_samples_per_class)
        else:
            raise ValueError(f"Invalid data_source: {data_source}")

    def _canonical_label(self, label: str) -> Optional[str]:
        cleaned = label.strip().lower().replace(" ", "_").replace("-", "_")
        if cleaned in self.class_to_idx:
            return cleaned
        # Check alias
        if cleaned in CLASS_ALIASES:
            aliased = CLASS_ALIASES[cleaned]
            if aliased in self.class_to_idx:
                return aliased
        return None

    def _load_from_tuples(self, tuples: List[Tuple[str, str]]):
        for path, label in tuples:
            canon = self._canonical_label(label)
            if canon is not None:
                full_path = os.path.join(self.base_dir, path) if self.base_dir and not os.path.isabs(path) else path
                self.samples.append((full_path, self.class_to_idx[canon]))

    def _load_from_csv(self, csv_path: str):
        if not os.path.isabs(csv_path) and self.base_dir:
            csv_path = os.path.join(self.base_dir, csv_path)

        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                img_path = row.get("image_path") or row.get("path") or row.get("filepath")
                label = row.get("label") or row.get("class") or row.get("target")
                if not img_path or not label:
                    continue

                canon = self._canonical_label(label)
                if canon is not None:
                    full_path = os.path.join(os.path.dirname(csv_path), img_path) if not os.path.isabs(img_path) else img_path
                    self.samples.append((full_path, self.class_to_idx[canon]))

    def _load_from_directory(self, root_dir: str, max_samples_per_class: Optional[int] = None):
        counts: Dict[int, int] = {idx: 0 for idx in range(len(self.class_names))}
        valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

        for entry in os.scandir(root_dir):
            if not entry.is_dir():
                continue
            canon = self._canonical_label(entry.name)
            if canon is None:
                continue
            idx = self.class_to_idx[canon]

            for file in os.scandir(entry.path):
                if max_samples_per_class and counts[idx] >= max_samples_per_class:
                    break
                ext = os.path.splitext(file.name)[1].lower()
                if ext in valid_exts:
                    self.samples.append((file.path, idx))
                    counts[idx] += 1

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        path, label_idx = self.samples[idx]
        try:
            with Image.open(path) as img:
                rgb_img = img.convert("RGB")
                tensor = self.transform(rgb_img)
        except Exception as err:
            # Fallback black image if corrupt
            tensor = torch.zeros((3, 224, 224), dtype=torch.float32)
        return tensor, label_idx, path


# ------------------------------------------------------------------------------
# Split Generator (train.csv, val.csv, test.csv)
# ------------------------------------------------------------------------------
def create_dataset_splits(
    samples: List[Tuple[str, str]],
    output_dir: str,
    train_ratio: float = 0.75,
    val_ratio: float = 0.15,
    test_ratio: float = 0.10,
    seed: int = 42,
) -> Tuple[str, str, str]:
    """
    Splits samples into train.csv, val.csv, and test.csv.
    """
    assert abs((train_ratio + val_ratio + test_ratio) - 1.0) < 1e-4, "Ratios must sum to 1.0"
    os.makedirs(output_dir, exist_ok=True)
    random.seed(seed)

    # Stratified split by class
    by_class: Dict[str, List[str]] = {}
    for path, label in samples:
        by_class.setdefault(label, []).append(path)

    train_data, val_data, test_data = [], [], []

    for label, paths in by_class.items():
        random.shuffle(paths)
        n = len(paths)
        if n == 1:
            train_data.append((paths[0], label))
            continue
        n_train = max(1, int(n * train_ratio))
        n_val = max(1, int(n * val_ratio)) if n > 2 else 0

        for p in paths[:n_train]:
            train_data.append((p, label))
        for p in paths[n_train : n_train + n_val]:
            val_data.append((p, label))
        for p in paths[n_train + n_val :]:
            test_data.append((p, label))

    def write_csv(filename: str, rows: List[Tuple[str, str]]) -> str:
        filepath = os.path.join(output_dir, filename)
        with open(filepath, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["image_path", "label"])
            writer.writerows(rows)
        return filepath

    train_path = write_csv("train.csv", train_data)
    val_path = write_csv("val.csv", val_data)
    test_path = write_csv("test.csv", test_data)

    return train_path, val_path, test_path


def get_dataloader(
    data_source: Union[str, List[Tuple[str, str]]],
    mode: str = "train",
    batch_size: int = 32,
    shuffle: Optional[bool] = None,
    num_workers: int = 0,
    class_names: Optional[List[str]] = None,
    max_samples_per_class: Optional[int] = None,
) -> DataLoader:
    """Helper creating DataLoader with appropriate transforms."""
    if shuffle is None:
        shuffle = (mode == "train")
    transform = get_transforms(mode=mode)
    dataset = CropDiseaseDataset(
        data_source=data_source,
        class_names=class_names,
        transform=transform,
        max_samples_per_class=max_samples_per_class,
    )
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
    )
