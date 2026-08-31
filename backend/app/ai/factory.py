from app.ai.base import CropHealthModel
from app.ai.demo import demo_crop_health_model


def get_crop_health_model() -> CropHealthModel:
    """
    Factory resolving the active CropHealthModel instance.
    
    Allows replacing the DemoCropHealthModel with a production PyTorch
    (e.g., Vision Transformer / ResNet / UNet) model without modifying
    any upstream API routes, database hooks, or service consumers.
    """
    return demo_crop_health_model
