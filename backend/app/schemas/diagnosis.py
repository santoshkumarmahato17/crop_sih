from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SymptomItem(BaseModel):
    category: str = Field(..., description="Symptom category e.g. Leaf Symptoms, Stem Symptoms")
    symptom_name: str = Field(..., description="Symptom name e.g. Yellowing, Lesions")


class ImageItem(BaseModel):
    image_url: str = Field(..., description="Uploaded image URL or data URI")
    original_filename: str = Field(default="plant_leaf_scan.jpg")
    file_size_bytes: Optional[int] = Field(default=0)


class SymptomAnalysisRequest(BaseModel):
    farm_id: str = Field(..., description="ID of the farm")
    zone_id: str = Field(..., description="ID of the zone")
    crop_type: str = Field(..., description="Crop type e.g. Tomato, Wheat, Rice, Corn, Banana, Cotton")
    growth_stage: str = Field(..., description="Growth stage e.g. Seedling, Vegetative, Flowering, Fruiting, Maturity, Harvest")
    plant_parts: List[str] = Field(default_factory=list, description="Affected plant parts: Leaf, Stem, Root, Fruit, Flower, Whole Plant")
    symptoms: List[str] = Field(..., min_length=1, description="List of observed symptoms")
    severity: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, SEVERE")
    distribution: str = Field(default="One section of the zone", description="Single plant, Small group of plants, One section of the zone, Most of the zone, Entire farm")
    symptom_start_date: Optional[str] = Field(default="Today", description="Today, 1–3 days ago, 4–7 days ago, 1–2 weeks ago, More than 2 weeks ago or date string")
    farmer_notes: Optional[str] = Field(default=None, description="Optional notes from farmer")
    
    # Optional Farmer Agricultural Context
    recent_pesticide_fungicide: Optional[str] = Field(default=None)
    recent_fertilizer: Optional[str] = Field(default=None)
    recent_irrigation: Optional[str] = Field(default=None)
    recent_rainfall: Optional[str] = Field(default=None)
    visible_insects: Optional[str] = Field(default=None)
    recent_unusual_weather: Optional[str] = Field(default=None)
    other_observations: Optional[str] = Field(default=None)
    
    # Visual Media
    images: List[ImageItem] = Field(default_factory=list, description="Uploaded plant photos")


class ConditionCandidate(BaseModel):
    condition_name: str
    probability: float = Field(..., description="Estimated probability 0.0 to 1.0")
    confidence_label: str
    description: str
    pathogen_type: Optional[str] = None # Fungal, Bacterial, Viral, Pest, Physiological
    urgency: str # Low, Medium, High, Urgent


class ZoneStatusSnapshot(BaseModel):
    zone_code: str
    crop_type: str
    current_health_score: float
    disease_risk: float
    pest_risk: float
    water_stress: float
    trend: str # DECLINING, STABLE, IMPROVING
    last_drone_scan: str


class HistoricalComparison(BaseModel):
    previous_health: float
    current_health: float
    health_change_pct: float
    previous_disease_indicator: float
    current_disease_indicator: float
    disease_trend: str # RISING, STABLE, FALLING
    historical_points: List[Dict[str, Any]] = Field(default_factory=list)


class NeighboringZoneRisk(BaseModel):
    zone_code: str
    risk_level: str # Low Risk, Medium Risk, High Risk
    distance_meters: Optional[int] = None
    crop_type: Optional[str] = None


class RecommendationItem(BaseModel):
    action_type: str # IPM, Inspection, Irrigation, Laboratory, Drone
    title: str
    description: str
    priority: str # Low, Medium, High, Urgent


class FollowUpMonitoring(BaseModel):
    is_recommended: bool
    recommended_mission: str
    target_zones: List[str]
    timing: str
    reason: str


class SymptomAnalysisResponse(BaseModel):
    id: str
    farm_id: str
    farm_name: str
    zone_id: str
    zone_code: str
    crop_type: str
    growth_stage: str
    status: str # AI_SUSPECTED, EXPERT_CONFIRMED, INSUFFICIENT_EVIDENCE
    ai_confidence: float # 0.0 to 1.0 (e.g. 0.78 for 78%)
    confidence_percentage: int # e.g. 78
    primary_condition: str
    possible_conditions: List[ConditionCandidate]
    reasoning_points: List[str]
    analyzed_images: List[Dict[str, Any]]
    zone_status: ZoneStatusSnapshot
    historical_comparison: HistoricalComparison
    neighboring_zones: List[NeighboringZoneRisk]
    regional_spread_risk: str # LOW, MEDIUM, HIGH
    recommendations: List[RecommendationItem]
    follow_up_monitoring: FollowUpMonitoring
    validation_status: str # NOT_REQUESTED, PENDING, CONFIRMED, REJECTED
    created_at: datetime
    is_prototype: bool = True
    notice: str = "AI SUSPECTED — AI-generated diagnostic hypothesis. Not a certified laboratory scientific diagnosis."


class ExpertValidationRequest(BaseModel):
    validation_status: str = Field(..., description="CONFIRMED, REJECTED, UNCERTAIN, LAB_REFERRAL")
    revised_diagnosis: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    confidence_rating: Optional[int] = Field(default=5, ge=1, le=5)


class DiagnosisHistoryItem(BaseModel):
    id: str
    created_at: datetime
    farm_id: str
    farm_name: str
    zone_id: str
    zone_code: str
    crop_type: str
    primary_condition: str
    ai_confidence: float
    status: str
    validation_status: str
    severity: str
    images_count: int


class DiagnosisHistoryResponse(BaseModel):
    total: int
    items: List[DiagnosisHistoryItem]
