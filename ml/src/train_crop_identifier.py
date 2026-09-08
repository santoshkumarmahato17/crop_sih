"""
Train and export a lightweight MobileNetV3 Crop Type Classifier:
Distinguishes between 4 core crops: Cashew, Cassava, Maize, and Tomato.
Powers the Unified All-in-One Camera Diagnostic Pipeline.
"""

import os
import sys
import time
import random
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from torch.utils.data import Dataset, DataLoader

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from ml.src.utils import set_seed, save_json

CROPS = ["Cashew", "Cassava", "Maize", "Tomato"]
CROP_TO_IDX = {c: i for i, c in enumerate(CROPS)}

CROP_METADATA = {
    "Cashew": {
        "scientific_name": "Anacardium occidentale",
        "family": "Anacardiaceae",
        "foliage_type": "Broad, leathery, simple alternate ovate leaves with prominent penniveined pinnate venation",
        "emoji": "🌰",
    },
    "Cassava": {
        "scientific_name": "Manihot esculenta",
        "family": "Euphorbiaceae",
        "foliage_type": "Distinctive deeply 5-7 lobed palmate leaves with reddish or green petioles",
        "emoji": "🍃",
    },
    "Maize": {
        "scientific_name": "Zea mays",
        "family": "Poaceae (Gramineae)",
        "foliage_type": "Elongated linear grass-like blade with prominent central midrib and parallel venation",
        "emoji": "🌽",
    },
    "Tomato": {
        "scientific_name": "Solanum lycopersicum",
        "family": "Solanaceae",
        "foliage_type": "Pinnately compound glandular-pubescent leaves with ovate to serrated toothed leaflets",
        "emoji": "🍅",
    },
}


class CropDataset(Dataset):
    def __init__(self, samples: List[Tuple[str, int]], transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        path, label = self.samples[idx]
        try:
            with Image.open(path) as img:
                image = img.convert("RGB")
        except Exception:
            image = Image.new("RGB", (224, 224), (0, 0, 0))

        if self.transform is not None:
            image = self.transform(image)
        return image, label


def train_and_export_crop_identifier():
    set_seed(42)
    device = torch.device("cpu")

    print("[Crop Identifier] Gathering training dataset across 4 crops...")
    train_samples = []
    val_samples = []

    for c in CROPS:
        crop_dir = os.path.join(REPO_ROOT, c)
        files = []
        for root, _, fnames in os.walk(crop_dir):
            for f in fnames:
                if f.lower().endswith((".jpg", ".png", ".jpeg")):
                    files.append(os.path.join(root, f))
        random.shuffle(files)
        # Use 400 train, 100 val per crop for fast, high-accuracy training
        train_samples.extend([(f, CROP_TO_IDX[c]) for f in files[:400]])
        val_samples.extend([(f, CROP_TO_IDX[c]) for f in files[400:500]])

    random.shuffle(train_samples)
    print(f"[Crop Identifier] Train: {len(train_samples)} | Val: {len(val_samples)}")

    tf_train = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    tf_val = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_loader = DataLoader(CropDataset(train_samples, tf_train), batch_size=32, shuffle=True)
    val_loader = DataLoader(CropDataset(val_samples, tf_val), batch_size=32, shuffle=False)

    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    for p in model.features.parameters():
        p.requires_grad = False
    in_feat = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_feat, len(CROPS))
    model.to(device)

    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()

    best_val_acc = 0.0
    best_weights = None

    print("[Crop Identifier] Starting training (3 Epochs)...")
    start_time = time.time()
    for epoch in range(1, 4):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct += (out.argmax(dim=1) == labels).sum().item()
            total += labels.size(0)
        train_acc = correct / total * 100

        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                out = model(imgs)
                val_correct += (out.argmax(dim=1) == labels).sum().item()
                val_total += labels.size(0)
        val_acc = val_correct / val_total * 100
        print(f"Epoch {epoch:02d}: Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_weights = model.state_dict().copy()

    total_time = time.time() - start_time
    print(f"[Crop Identifier] Complete in {total_time:.1f}s | Best Val Acc: {best_val_acc:.2f}%")

    model.load_state_dict(best_weights)
    model.eval()

    # Export
    save_dir = os.path.join(REPO_ROOT, "ml", "models", "crop_classifier")
    os.makedirs(save_dir, exist_ok=True)

    weights_path = os.path.join(save_dir, "crop_type_classifier.pth")
    torch.save({
        "model_state_dict": best_weights,
        "crops": CROPS,
        "crop_to_idx": CROP_TO_IDX,
        "best_val_acc": best_val_acc,
        "crop_metadata": CROP_METADATA,
    }, weights_path)

    save_json(CROPS, os.path.join(save_dir, "crops.json"))
    save_json(CROP_METADATA, os.path.join(save_dir, "crop_metadata.json"))

    print(f"[Crop Identifier] Exported model checkpoint to: {weights_path}")
    return weights_path


if __name__ == "__main__":
    train_and_export_crop_identifier()
