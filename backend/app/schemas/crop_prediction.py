"""
Pydantic schemas for the Crop Disease & Pest Prediction Endpoint.
Defines strict API contracts matching the algorithm specification.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TopPredictionItem(BaseModel):
    """Candidate prediction item with confidence probability."""
    model_config = ConfigDict(populate_by_name=True)

    class_name: str = Field(..., alias="class", description="Pathology class key")
    crop: str = Field(..., description="Identified crop type (e.g. rice, maize)")
    condition: str = Field(..., description="Condition category (Disease, Pest, Healthy, etc.)")
    confidence: float = Field(..., description="Confidence probability (0-1)")
    scientific_name: Optional[str] = Field(None, description="Pathogen scientific binomial")


class IPMRecommendationItem(BaseModel):
    """Integrated Pest Management action item."""
    action: str = Field(..., description="Action heading (e.g., Fungicide, Bio-Control)")
    detail: str = Field(..., description="Specific chemical/organic dosage instructions")


class AgronomicRiskAdvisory(BaseModel):
    """Contextual multi-factor agronomic risk intelligence."""
    composite_risk_score: Optional[float] = Field(None, description="Multi-factor risk score (0-100) or None if contextual data is limited")
    risk_level: str = Field(..., description="Risk category: Low, Moderate, High, Critical, LIMITED")
    advisory_summary: str = Field(..., description="Concise agronomist advisory message")
    environmental_favorability: str = Field(..., description="Weather favorability for disease spread")
    weather_context: Optional[Dict[str, float]] = None
    crop_stage: Optional[str] = None
    recommended_actions: List[str] = Field(default_factory=list)


class CropPredictionResponse(BaseModel):
    """
    Standardized Crop Pathology Vision AI Prediction Response.
    Matches all outputs required by the specification:
      - crop
      - condition
      - class
      - confidence
      - severity
      - needs_expert_review
    """
    crop: str = Field(..., description="Identified crop type (e.g. rice, maize)")
    condition: str = Field(..., description="Condition category (Disease, Pest, Nutrient deficiency, etc.)")
    class_name: str = Field(..., alias="class", description="Specific predicted class identifier")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    severity: str = Field(..., description="Severity level: low, medium, or high")
    severity_score: Optional[float] = Field(None, description="Estimated foliar damage area (0.0 to 1.0)")
    needs_expert_review: bool = Field(..., description="Uncertainty flag indicating expert verification needed")
    scientific_name: Optional[str] = Field(None, description="Pathogen scientific name")
    urgency: Optional[str] = Field(None, description="Agronomic urgency level")
    description: Optional[str] = Field(None, description="Pathological symptom description")
    explanation_heatmap_base64: Optional[str] = Field(None, description="Grad-CAM activation heatmap overlay (base64 PNG)")
    top_predictions: Optional[List[TopPredictionItem]] = Field(default_factory=list, description="Top-k candidates")
    ipm_recommendations: Optional[List[IPMRecommendationItem]] = Field(default_factory=list, description="IPM advisories")
    agronomic_advisory: Optional[AgronomicRiskAdvisory] = Field(None, description="Integrated risk advisory")
    image_quality: Optional[Dict[str, Any]] = Field(None, description="Optical quality check metrics")
    detected_regions: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Original coordinate bounding boxes and symptoms")
    causal_agent: Optional[Dict[str, Any]] = Field(None, description="Taxonomic pathogen details")
    video_resource: Optional[Dict[str, Any]] = Field(None, description="Verified direct video link")

    model_config = ConfigDict(populate_by_name=True)


class SupportedClassesResponse(BaseModel):
    """Listing of supported crops, classes, and condition taxonomy."""
    total_classes: int
    crops: List[str]
    condition_categories: List[str]
    classes: List[Dict[str, Any]]
