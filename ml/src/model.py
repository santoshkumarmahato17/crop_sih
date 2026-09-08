"""
Tomato Leaf Disease Classification Model Architecture.
Employs MobileNetV3-Large transfer learning with customized 5-class linear head.
Provides freeze/unfreeze mechanisms and TorchScript mobile export.
"""

from typing import List, Optional
import torch
import torch.nn as nn
import torchvision.models as models

DEFAULT_CLASSES = [
    "Healthy",
    "Leaf Blight",
    "Leaf Curl",
    "Septoria Leaf Spot",
    "Verticillium Wilt",
]


class TomatoDiseaseClassifier(nn.Module):
    """
    MobileNetV3 transfer learning model specialized for Tomato foliar diseases.
    """

    def __init__(
        self,
        num_classes: int = 5,
        backbone_name: str = "mobilenet_v3_large",
        pretrained: bool = True,
        dropout_rate: float = 0.25,
    ):
        super().__init__()
        self.num_classes = num_classes
        self.backbone_name = backbone_name

        if backbone_name == "mobilenet_v3_large":
            weights = models.MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
            self.base_model = models.mobilenet_v3_large(weights=weights)
            in_features = self.base_model.classifier[3].in_features
            # Replace final classification layer
            self.base_model.classifier[2] = nn.Dropout(p=dropout_rate, inplace=True)
            self.base_model.classifier[3] = nn.Linear(in_features, num_classes)
        elif backbone_name == "mobilenet_v3_small":
            weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
            self.base_model = models.mobilenet_v3_small(weights=weights)
            in_features = self.base_model.classifier[3].in_features
            self.base_model.classifier[2] = nn.Dropout(p=dropout_rate, inplace=True)
            self.base_model.classifier[3] = nn.Linear(in_features, num_classes)
        elif backbone_name == "efficientnet_b0":
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            self.base_model = models.efficientnet_b0(weights=weights)
            in_features = self.base_model.classifier[1].in_features
            self.base_model.classifier[0] = nn.Dropout(p=dropout_rate, inplace=True)
            self.base_model.classifier[1] = nn.Linear(in_features, num_classes)
        elif backbone_name == "resnet18":
            weights = models.ResNet18_Weights.DEFAULT if pretrained else None
            self.base_model = models.resnet18(weights=weights)
            in_features = self.base_model.fc.in_features
            self.base_model.fc = nn.Sequential(
                nn.Dropout(p=dropout_rate),
                nn.Linear(in_features, num_classes),
            )
        else:
            raise ValueError(f"Unsupported backbone: {backbone_name}")

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Standard forward pass returning raw unnormalized logits."""
        return self.base_model(x)

    def predict_probabilities(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass with Softmax activation returning class probabilities."""
        logits = self.forward(x)
        return torch.softmax(logits, dim=-1)

    def freeze_backbone(self):
        """Freeze all feature extractor layers to train only the classifier head."""
        if hasattr(self.base_model, "features"):
            for param in self.base_model.features.parameters():
                param.requires_grad = False
            for param in self.base_model.classifier.parameters():
                param.requires_grad = True
        elif hasattr(self.base_model, "fc"):
            for name, param in self.base_model.named_parameters():
                if "fc" not in name:
                    param.requires_grad = False
                else:
                    param.requires_grad = True

    def unfreeze_backbone(self, unfreeze_last_n_blocks: Optional[int] = None):
        """
        Unfreeze backbone layers for fine-tuning.
        """
        if unfreeze_last_n_blocks is None:
            for param in self.base_model.parameters():
                param.requires_grad = True
        else:
            if hasattr(self.base_model, "features"):
                num_blocks = len(self.base_model.features)
                cutoff = max(0, num_blocks - unfreeze_last_n_blocks)
                for idx, block in enumerate(self.base_model.features):
                    req = idx >= cutoff
                    for param in block.parameters():
                        param.requires_grad = req
                for param in self.base_model.classifier.parameters():
                    param.requires_grad = True
            elif hasattr(self.base_model, "fc"):
                for param in self.base_model.parameters():
                    param.requires_grad = True

    def export_torchscript(self, save_path: str, input_size: int = 224) -> str:
        """
        Export trained model to an optimized TorchScript mobile artifact (.pt).
        """
        self.eval()
        dummy_input = torch.randn(1, 3, input_size, input_size)
        traced_model = torch.jit.trace(self, dummy_input)
        traced_model.save(save_path)
        return save_path


def build_model(
    num_classes: int = 5,
    backbone_name: str = "mobilenet_v3_large",
    pretrained: bool = True,
    dropout_rate: float = 0.25,
) -> TomatoDiseaseClassifier:
    """Factory helper to build the classifier."""
    return TomatoDiseaseClassifier(
        num_classes=num_classes,
        backbone_name=backbone_name,
        pretrained=pretrained,
        dropout_rate=dropout_rate,
    )
