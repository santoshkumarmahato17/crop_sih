"""
Image preprocessing and quality assessment routines:
Validates input images for blur, underexposure, overexposure, and formats.
"""

import io
from typing import Dict, Tuple, Union
import numpy as np
from PIL import Image, ImageStat
import torch
import cv2

from ml.src.augmentation import get_inference_transforms


def assess_image_quality(
    image: Image.Image,
    blur_threshold: float = 60.0,
    min_brightness: float = 25.0,
    max_brightness: float = 235.0,
) -> Dict[str, Union[bool, float, str]]:
    """
    Assess quality of uploaded image:
    - Calculates sharpness / blur score via Laplacian variance.
    - Computes mean brightness and contrast.
    - Flags severe lighting or blur issues before inference.
    """
    # 1. Convert to grayscale numpy array
    gray_img = np.array(image.convert("L"))

    # 2. Laplacian variance sharpness check
    laplacian = cv2.Laplacian(gray_img, cv2.CV_64F)
    variance_of_laplacian = float(laplacian.var())
    is_blurry = bool(variance_of_laplacian < blur_threshold)

    # 3. Brightness and contrast check
    stat = ImageStat.Stat(image.convert("L"))
    mean_brightness = float(stat.mean[0])
    std_contrast = float(stat.stddev[0])

    is_too_dark = bool(mean_brightness < min_brightness)
    is_too_bright = bool(mean_brightness > max_brightness)
    is_low_contrast = bool(std_contrast < 15.0)

    quality_status = "OK"
    advisories = []

    if is_blurry:
        quality_status = "BLURRY"
        advisories.append("Image appears blurry or out of focus. Hold phone steady and refocus.")
    if is_too_dark:
        quality_status = "UNDEREXPOSED"
        advisories.append("Image is too dark. Increase ambient lighting or turn on flash.")
    if is_too_bright:
        quality_status = "OVEREXPOSED"
        advisories.append("Image is overexposed/washed out. Avoid direct bright glare on leaf.")
    if is_low_contrast:
        advisories.append("Low contrast detected between leaf and background.")

    return {
        "is_acceptable": not (is_blurry or is_too_dark or is_too_bright),
        "quality_status": quality_status,
        "blur_score": round(variance_of_laplacian, 2),
        "is_blurry": is_blurry,
        "brightness": round(mean_brightness, 2),
        "is_too_dark": is_too_dark,
        "is_too_bright": is_too_bright,
        "contrast": round(std_contrast, 2),
        "advisory_notes": advisories,
    }


def preprocess_image_input(
    image_input: Union[str, bytes, io.BytesIO, Image.Image],
    input_size: int = 224,
) -> Tuple[torch.Tensor, Image.Image, Dict]:
    """
    Load an image from filepath, raw bytes, BytesIO, or PIL Image,
    perform quality check, convert to RGB, and return normalized torch tensor.
    """
    if isinstance(image_input, str):
        pil_img = Image.open(image_input)
    elif isinstance(image_input, bytes):
        pil_img = Image.open(io.BytesIO(image_input))
    elif isinstance(image_input, io.BytesIO):
        pil_img = Image.open(image_input)
    elif isinstance(image_input, Image.Image):
        pil_img = image_input
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    rgb_img = pil_img.convert("RGB")
    quality = assess_image_quality(rgb_img)

    transform = get_inference_transforms(input_size=input_size)
    tensor = transform(rgb_img).unsqueeze(0)  # Shape: (1, 3, H, W)

    return tensor, rgb_img, quality
