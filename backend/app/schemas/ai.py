from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class CropHealthAnalysisRequest(BaseModel):
    """Payload to trigger AI vision inference for an existing drone image frame."""

    image_id: Optional[str] = Field(default=None, description="Ingested DroneImage ID to analyze")
    farm_id: Optional[str] = Field(default=None, description="Optional Farm ID")
    zone_id: Optional[str] = Field(default=None, description="Optional Farm Zone ID")
    mission_id: Optional[str] = Field(default=None, description="Optional Drone Mission ID")


class CropHealthAnalysisResponse(BaseSchema):
    """Multi-modal crop health analysis results and associated observation entities."""

    health_score: float = Field(description="Normalized canopy vitality index (0.0 dead - 1.0 optimal)")
    vegetation_stress_score: float = Field(description="Vegetation physiological stress score (0.0 - 1.0)")
    anomaly_score: float = Field(description="Spatial canopy anomaly score (0.0 - 1.0)")
    disease_probability: float = Field(description="Likelihood of plant pathology (0.0 - 1.0)")
    pest_probability: float = Field(description="Likelihood of pest defoliation/damage (0.0 - 1.0)")
    confidence: float = Field(description="Model prediction confidence score (0.0 - 1.0)")
    model_name: str
    model_version: str
    inference_timestamp: datetime
    prediction_metadata: Dict[str, Any]
    
    # Linked Database Domain Entities
    health_observation_id: Optional[str] = None
    disease_observation_id: Optional[str] = None
    pest_observation_id: Optional[str] = None
    water_stress_observation_id: Optional[str] = None
    
    prototype_disclaimer: str = Field(
        default="DEMO / PROTOTYPE: Non-diagnostic development inference for software pipeline validation.",
        description="Explicit prototype label and scientific disclaimer",
    )
