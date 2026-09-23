"""
AGRI SHIELD — Explainable AI (XAI) with Grad-CAM.
Generates gradient-weighted class activation mapping (Grad-CAM) to highlight
pathology lesions and symptomatic foliar regions that triggered the model's prediction.
"""

import io
import base64
from typing import Optional, Tuple, Union
import numpy as np
from PIL import Image
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
except ImportError:
    class _DummyTorch: Tensor = object
    torch = _DummyTorch()
    class _DummyModule: pass
    class _DummyNN: Module = _DummyModule
    nn = _DummyNN()
    F = None

from ai.models.crop_classifier import CropDiseaseNet


class GradCAM:
    """
    Grad-CAM implementation for PyTorch Vision models.
    Hooks into the final convolutional feature layer to calculate gradient-weighted activation maps.
    """

    def __init__(self, model: CropDiseaseNet, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.model.eval()

        # Resolve target convolutional layer
        if target_layer is not None:
            self.target_layer = target_layer
        elif hasattr(model, "backbone") and hasattr(model.backbone, "features"):
            # EfficientNet & MobileNet have .features
            self.target_layer = model.backbone.features[-1]
        elif hasattr(model, "backbone") and hasattr(model.backbone, "layer4"):
            # ResNet has .layer4
            self.target_layer = model.backbone.layer4[-1]
        else:
            raise ValueError("Could not automatically locate the target convolutional layer for Grad-CAM.")

        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate(
        self,
        input_tensor: torch.Tensor,
        target_class_idx: Optional[int] = None,
    ) -> np.ndarray:
        """
        Generates 2D normalized heatmap [0, 1] for the specified class index.
        """
        self.model.zero_grad()
        logits = self.model(input_tensor)

        if target_class_idx is None:
            target_class_idx = torch.argmax(logits, dim=1).item()

        target_score = logits[0, target_class_idx]
        target_score.backward()

        # Global average pooling of gradients
        # gradients shape: (1, channels, H, W)
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])

        # Weight the activation maps
        activations = self.activations[0]  # (channels, H, W)
        for i in range(pooled_gradients.size(0)):
            activations[i, :, :] *= pooled_gradients[i]

        heatmap = torch.sum(activations, dim=0).cpu().numpy()
        # ReLU: retain only positive contributions
        heatmap = np.maximum(heatmap, 0)

        # Normalize to [0, 1]
        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap = heatmap / max_val
        else:
            heatmap = np.zeros_like(heatmap)

        return heatmap

    @staticmethod
    def overlay_heatmap(
        pil_image: Image.Image,
        heatmap: np.ndarray,
        alpha: float = 0.5,
        colormap: str = "jet",
    ) -> Image.Image:
        """
        Overlays heatmap on original PIL image.
        Uses pure numpy/Pillow without requiring external opencv/matplotlib dependencies.
        """
        w, h = pil_image.size
        # Resize heatmap to match image size using bilinear interpolation
        heat_img = Image.fromarray((heatmap * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
        heat_arr = np.array(heat_img, dtype=np.float32) / 255.0

        # Simple high-contrast pseudo-jet color ramp: blue -> cyan -> yellow -> red
        r = np.clip(1.5 - np.abs(heat_arr * 4.0 - 3.0), 0.0, 1.0)
        g = np.clip(1.5 - np.abs(heat_arr * 4.0 - 2.0), 0.0, 1.0)
        b = np.clip(1.5 - np.abs(heat_arr * 4.0 - 1.0), 0.0, 1.0)

        color_mask = np.stack([r, g, b], axis=-1) * 255.0
        color_mask = color_mask.astype(np.uint8)

        base_arr = np.array(pil_image.convert("RGB"), dtype=np.float32)
        blended = (base_arr * (1.0 - alpha) + color_mask * alpha).astype(np.uint8)
        return Image.fromarray(blended)

    @staticmethod
    def to_base64_data_uri(pil_image: Image.Image) -> str:
        """Encodes PIL image as PNG data URI string."""
        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
