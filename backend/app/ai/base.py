from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass
class CropHealthPrediction:
    """
    Standardized AI Inference Output Contract for Crop Health & Anomaly Estimation.
    Used uniformly across development demo prototypes and production PyTorch/ONNX vision models.
    """

    health_score: float  # 0.0 (severely necrotic/dead) to 1.0 (optimal canopy vitality)
    vegetation_stress_score: float  # 0.0 (no stress) to 1.0 (critical physiological/water stress)
    anomaly_score: float  # 0.0 (uniform canopy) to 1.0 (severe spatial anomaly detected)
    disease_probability: float  # 0.0 to 1.0 likelihood of fungal/bacterial/viral pathology
    pest_probability: float  # 0.0 to 1.0 likelihood of insect defoliation or infestation
    confidence: float  # 0.0 to 1.0 model epistemic/aleatoric prediction certainty
    model_name: str
    model_version: str
    inference_timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    prediction_metadata: Dict[str, Any] = field(default_factory=dict)


class CropHealthModel(ABC):
    """
    Abstract Base Class for Multi-Modal Crop Health AI Vision Models.
    
    Enforces a strict decouple between backend application logic and machine learning
    backends (PyTorch, TensorFlow, TensorRT, or Development Prototypes).
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the neural vision model or prototype."""
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Version tag of the inference weights/pipeline."""
        pass

    @property
    @abstractmethod
    def is_prototype(self) -> bool:
        """Boolean flag indicating if the model is a development demo or production model."""
        pass

    @abstractmethod
    async def predict(
        self,
        rgb_image_bytes: bytes,
        multispectral_bytes: Optional[bytes] = None,
        thermal_bytes: Optional[bytes] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CropHealthPrediction:
        """
        Executes forward inference on multi-spectral/RGB imagery frames.
        
        Args:
            rgb_image_bytes: Raw binary bytes of primary RGB optical frame.
            multispectral_bytes: Optional NIR/RedEdge multispectral TIFF bytes.
            thermal_bytes: Optional long-wave infrared thermal radiance raster.
            metadata: Optional contextual metadata (e.g. crop type, solar altitude).
            
        Returns:
            Standardized CropHealthPrediction containing health, stress, and anomaly indicators.
        """
        pass
