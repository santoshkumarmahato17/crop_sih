from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseMLModel(ABC):
    """Abstract interface for all AGRI SHIELD machine learning inference pipelines."""

    def __init__(self, model_path: Optional[str] = None, device: str = "cpu"):
        self.model_path = model_path
        self.device = device
        self.is_loaded = False

    @abstractmethod
    def load_model(self) -> None:
        """Loads weights and initializes the inference graph."""
        pass

    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        """Executes inference on preprocessed tensor or array inputs."""
        pass
