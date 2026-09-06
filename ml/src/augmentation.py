"""
Data augmentation pipelines for training and deterministic preprocessing for val/test.
Applies realistic mobile phone leaf variations: flips, small rotations, slight color jitter,
and gentle zoom/crops to ensure robustness to field capture conditions.
"""

from torchvision import transforms as T

# Standard ImageNet normalization constants
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_training_transforms(input_size: int = 224) -> T.Compose:
    """
    Realistic foliar data augmentation pipeline for training data only.
    Avoids extreme non-biological distortions while simulating phone camera variations.
    """
    return T.Compose([
        # 1. Random Resized Crop (minor zoom: 0.85 to 1.0)
        T.RandomResizedCrop(
            size=input_size,
            scale=(0.85, 1.0),
            ratio=(0.9, 1.1),
        ),
        # 2. Random horizontal and vertical flips (leaves have natural orientation symmetries)
        T.RandomHorizontalFlip(p=0.5),
        T.RandomVerticalFlip(p=0.3),
        # 3. Small rotation (-15 to +15 degrees)
        T.RandomRotation(degrees=15),
        # 4. Realistic Color Jitter (phone exposure, sun, indoor/outdoor shadows)
        T.ColorJitter(
            brightness=0.15,
            contrast=0.15,
            saturation=0.15,
            hue=0.05,
        ),
        # 5. Small affine translation / shear (simulating angled phone framing)
        T.RandomAffine(
            degrees=0,
            translate=(0.05, 0.05),
            scale=None,
            shear=(-5, 5),
        ),
        # 6. Tensor conversion and ImageNet normalization
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_validation_transforms(input_size: int = 224) -> T.Compose:
    """
    Clean, deterministic preprocessing for validation and test evaluations.
    """
    return T.Compose([
        T.Resize(int(input_size * 1.14)),  # 256 for 224
        T.CenterCrop(input_size),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_inference_transforms(input_size: int = 224) -> T.Compose:
    """
    Inference preprocessing for single image payloads from camera / API.
    """
    return get_validation_transforms(input_size=input_size)
