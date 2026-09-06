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


class ImageQualitySchema(BaseModel):
    score: float = Field(default=1.0, description="Overall image quality score (0.0 to 1.0)")
    status: str = Field(default="GOOD", description="Quality status: GOOD | ACCEPTABLE | POOR | UNUSABLE")
    is_usable: bool = Field(default=True, description="Whether image is of sufficient diagnostic quality")
    blur_variance: float = Field(default=100.0, description="Laplacian variance blur score")
    mean_luminance: float = Field(default=128.0, description="Mean optical luminance")
    contrast_std: float = Field(default=45.0, description="RMS contrast standard deviation")
    resolution_status: str = Field(default="SUFFICIENT", description="SUFFICIENT | LOW | INSUFFICIENT")
    warning_message: Optional[str] = Field(default=None, description="Actionable feedback if image quality is poor")


class CausalAgentSchema(BaseModel):
    scientific_name: str = Field(default="None", description="Scientific binomial nomenclature of pathogen/pest")
    pathogen_type: str = Field(default="None (Healthy)", description="Fungal | Bacterial | Viral | Oomycete | Nematode | Insect / Pest | Physiological | None (Healthy)")
    description: Optional[str] = Field(default=None, description="Pathogen biology and spread mechanism")


class SeveritySchema(BaseModel):
    level: str = Field(default="LOW", description="Physical damage level: LOW | MODERATE | HIGH | CRITICAL")
    score: float = Field(default=0.0, description="Numerical damage score (0.0 to 100.0)")
    confidence: float = Field(default=0.85, description="Severity estimation confidence")
    affected_area_pct: float = Field(default=0.0, description="Percentage of foliar leaf blade affected by lesions")
    lesion_count: int = Field(default=0, description="Number of localized lesion zones detected")


class RiskFactorSchema(BaseModel):
    name: str
    contribution: float = Field(default=0.0, description="Contribution score or percentage")
    description: Optional[str] = None


class RiskSchema(BaseModel):
    level: str = Field(default="LOW", description="Risk level: LOW | MODERATE | HIGH | CRITICAL | LIMITED")
    score: Optional[float] = Field(default=None, description="Composite future risk score (0.0 to 100.0), or None if data missing")
    confidence: float = Field(default=0.50, description="Independent confidence in risk projection")
    status: str = Field(default="CALCULATED", description="CALCULATED | LIMITED")
    summary: str = Field(default="Low epidemiological risk.")
    factors: List[RiskFactorSchema] = Field(default_factory=list)


class VideoResourceSchema(BaseModel):
    title: str
    channel: str
    watch_url: str
    language: str
    relevance_score: float


class CropHealthAnalysisResponse(BaseSchema):
    """Production-grade multi-modal crop health analysis response conforming to Golden Rules."""

    # Analysis Identity
    analysis_id: Optional[str] = Field(default=None, description="Unique analysis record identifier")

    # 1. Image Quality Assessment
    image_quality: Optional[ImageQualitySchema] = None

    # 2. Crop Identification
    crop: str = Field(default="Crop Leaf", description="Identified crop: Rice, Maize, Tomato, Cashew, Cassava")
    crop_confidence: float = Field(default=0.90, description="Crop identification confidence")
    crop_status: str = Field(default="CONFIDENT", description="CONFIDENT | UNCERTAIN | UNKNOWN | UNSUPPORTED")
    crop_origin: str = Field(default="MODEL_IDENTIFIED", description="MODEL_IDENTIFIED | USER_CONFIRMED | EXPERT_CONFIRMED")

    # 3. Disease Classification & Causal Agent
    condition: Optional[str] = Field(default=None, description="Primary condition name or status")
    condition_category: str = Field(
        default="Disease",
        description="Condition category: Disease | Pest | Nutrient deficiency | Water stress / abiotic | Healthy | Unknown / needs expert review"
    )
    specific_class: str = Field(
        default="unspecified_crop_condition",
        description="Specific taxonomy class (e.g. rice_blast, maize_fall_armyworm, tomato_leaf_blight, rice_healthy)"
    )
    confidence: float = Field(description="Model prediction confidence score (0.0 - 1.0)")
    causal_agent: Optional[CausalAgentSchema] = None
    symptoms: List[str] = Field(default_factory=list, description="Observed morphological leaf symptoms")

    # 4. Decoupled Severity & Risk Engines
    severity: str = Field(default="low", description="Physical damage severity: low | moderate | high | critical")
    severity_percentage: float = Field(default=0.0, description="Affected leaf area percentage (0.0 - 100.0%)")
    severity_detail: Optional[SeveritySchema] = None
    risk_detail: Optional[RiskSchema] = None

    # 5. Precise Lesion Localization (Original Coordinates)
    detected_patches: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of detected damage patches with original image coordinate bounding boxes and unique Region IDs (REG-001...)"
    )
    detected_regions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Alias for detected_patches"
    )
    localization_available: bool = Field(default=False, description="Whether real bounding boxes were successfully localized")
    localization_message: Optional[str] = None
    selected_patch_analysis: Optional[Dict[str, Any]] = None

    # 6. Authoritative Recommendations & Verified Resources
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    video_resource: Optional[VideoResourceSchema] = None
    wiki_resource: Optional[Dict[str, Any]] = None

    # 7. Model Versioning & Traceability
    needs_expert_review: bool = Field(default=False)
    health_score: float = Field(default=0.75)
    vegetation_stress_score: float = Field(default=0.20)
    anomaly_score: float = Field(default=0.10)
    disease_probability: float = Field(default=0.0)
    pest_probability: float = Field(default=0.0)

    model_name: str = "AgriShield-VisionPathologyNet"
    model_version: str = "2.1.0-production"
    crop_model_version: str = "1.2.0"
    detector_model_version: str = "1.4.0"
    disease_model_version: str = "2.1.0"
    dataset_version: str = "CCMT-v2-RiceMaize-2026.1"
    inference_timestamp: datetime = Field(default_factory=lambda: datetime.now())
    prediction_metadata: Dict[str, Any] = Field(default_factory=dict)

    # Linked Database Domain Entities
    health_observation_id: Optional[str] = None
    disease_observation_id: Optional[str] = None
    pest_observation_id: Optional[str] = None
    water_stress_observation_id: Optional[str] = None

    prototype_disclaimer: str = Field(
        default="AGRI SHIELD AI DIAGNOSTICS: Calibrated PyTorch Vision Pipeline + Real Foliar Segmentation with Human-in-the-Loop Expert Validation.",
        description="Scientific and regulatory disclaimer",
    )
