from app.ai.base import CropHealthModel
from app.ai.ccmt_vision_model import ccmt_crop_health_model


def get_crop_health_model() -> CropHealthModel:
    """
    Factory resolving the active CropHealthModel instance.
    
    Returns the production PyTorch vision classifier trained and calibrated
    on the CCMT (Cashew, Cassava, Maize, Tomato) Crop Pest & Disease Dataset.
    """
    return ccmt_crop_health_model
