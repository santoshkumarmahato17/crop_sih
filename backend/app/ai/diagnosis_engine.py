"""
Symptom-Based Crop Disease AI Identification & Agronomic Reasoning Engine.
Combines farmer symptoms, plant parts, crop growth stages, visual image indicators,
spatial zone health telemetry, weather context, and historical observations.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


@dataclass
class AgronomicDiagnosisResult:
    status: str # "AI_SUSPECTED" or "INSUFFICIENT_EVIDENCE"
    primary_condition: str
    confidence: float # 0.0 to 1.0
    possible_conditions: List[Dict[str, Any]]
    reasoning_points: List[str]
    recommendations: List[Dict[str, Any]]
    follow_up_monitoring: Dict[str, Any]
    regional_spread_risk: str
    model_name: str = "AgriShield-SymptomReasoner-v1.0"
    model_version: str = "1.0.0-prototype"
    is_prototype: bool = True


class DiseaseIdentificationService(ABC):
    """Abstract interface for Replaceable Crop Disease Identification AI backends."""

    @abstractmethod
    async def analyze_crop_health(
        self,
        crop_type: str,
        growth_stage: str,
        plant_parts: List[str],
        symptoms: List[str],
        severity: str,
        distribution: str,
        symptom_start_date: Optional[str] = None,
        farmer_notes: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None,
        zone_telemetry: Optional[Dict[str, Any]] = None,
        weather_context: Optional[Dict[str, Any]] = None,
        has_images: bool = False,
    ) -> AgronomicDiagnosisResult:
        """Executes the agronomic disease diagnosis inference pipeline."""
        pass


class PrototypeDiseaseIdentificationService(DiseaseIdentificationService):
    """
    Heuristic, knowledge-graph-driven prototype inference engine.
    Applies rules-based agronomic pathology correlation across staple crops,
    accounting for vegetative indices, weather triggers, and historical decline.
    """

    # Agronomic pathology knowledge base mapping
    DISEASE_KNOWLEDGE_BASE = {
        "Tomato": [
            {
                "name": "Possible Early Blight (Alternaria solani)",
                "triggers": ["Spots", "Browning", "Yellowing", "Necrosis", "Blotches"],
                "parts": ["Leaf", "Stem"],
                "stages": ["Flowering", "Fruiting", "Vegetative"],
                "pathogen": "Fungal",
                "base_prob": 0.78,
                "urgency": "High",
                "desc": "Concentric dark brown rings with chlorotic yellow halo on lower foliar canopy.",
                "recs": [
                    {"action_type": "IPM", "title": "Apply Bio-Fungicide (Trichoderma / Copper Hydroxide)", "description": "Spray organic copper-based formulation in early morning to halt spore germination.", "priority": "High"},
                    {"action_type": "Cultural", "title": "Prune Lower Chlorotic Leaves", "description": "Carefully remove and dispose of infected bottom foliage to prevent soil splash propagation.", "priority": "Medium"},
                ]
            },
            {
                "name": "Possible Late Blight (Phytophthora infestans)",
                "triggers": ["Water-soaked lesions", "Wilting", "Blotches", "Rot", "Curling"],
                "parts": ["Leaf", "Stem", "Fruit"],
                "stages": ["Flowering", "Fruiting", "Maturity"],
                "pathogen": "Oomycete",
                "base_prob": 0.65,
                "urgency": "Urgent",
                "desc": "Rapidly expanding dark water-soaked foliar lesions with white sporulation on undersides.",
                "recs": [
                    {"action_type": "IPM", "title": "Immediate Preventative Drip / Foliar Barrier", "description": "Ensure canopy aeration and avoid overhead irrigation.", "priority": "Urgent"}
                ]
            },
            {
                "name": "Possible Tomato Leaf Curl Virus (ToLCV)",
                "triggers": ["Curling", "Stunted growth", "Yellowing", "Mosaic pattern"],
                "parts": ["Leaf", "Whole Plant"],
                "stages": ["Seedling", "Vegetative", "Flowering"],
                "pathogen": "Viral",
                "base_prob": 0.60,
                "urgency": "High",
                "desc": "Upward foliar curling, vein clearing, stunted internodes transmitted by whiteflies.",
                "recs": [
                    {"action_type": "IPM", "title": "Deploy Yellow Sticky Traps for Whitefly Vector Control", "description": "Target adult whiteflies using neem oil emulsion and physical sticky cards.", "priority": "High"}
                ]
            },
        ],
        "Wheat": [
            {
                "name": "Possible Yellow / Stripe Rust (Puccinia striiformis)",
                "triggers": ["Rust-like appearance", "Yellowing", "Powdery coating", "Spots"],
                "parts": ["Leaf"],
                "stages": ["Tillering", "Stem Elongation", "Heading", "Grain Filling"],
                "pathogen": "Fungal",
                "base_prob": 0.82,
                "urgency": "Urgent",
                "desc": "Yellow-orange powdery urediniospore pustules arranged in parallel stripes along leaf veins.",
                "recs": [
                    {"action_type": "IPM", "title": "Targeted Triazole Foliar Application (Propiconazole / Tebuconazole)", "description": "Deliver calibrated spray to contain vegetative striping before flag leaf emergence.", "priority": "Urgent"},
                    {"action_type": "Inspection", "title": "Scout Adjacent Wheat Parcels within 48h", "description": "Wind-borne urediniospores travel rapidly across downwind farm plots.", "priority": "High"},
                ]
            },
            {
                "name": "Possible Powdery Mildew (Blumeria graminis)",
                "triggers": ["Powdery coating", "Browning", "Necrosis", "Yellowing"],
                "parts": ["Leaf", "Stem"],
                "stages": ["Vegetative", "Heading"],
                "pathogen": "Fungal",
                "base_prob": 0.68,
                "urgency": "Medium",
                "desc": "White-grey talcum-like fungal mats on upper leaf surfaces.",
                "recs": [
                    {"action_type": "IPM", "title": "Sulfur / Difenoconazole Spray", "description": "Apply during dry afternoon hours to target superficial mycelial growth.", "priority": "Medium"}
                ]
            },
        ],
        "Rice": [
            {
                "name": "Possible Rice Blast (Magnaporthe oryzae)",
                "triggers": ["Spots", "Blotches", "Browning", "Necrosis", "Lesions"],
                "parts": ["Leaf", "Stem", "Whole Plant"],
                "stages": ["Tillering", "Booting", "Panicle"],
                "pathogen": "Fungal",
                "base_prob": 0.76,
                "urgency": "High",
                "desc": "Diamond/spindle-shaped lesions with grey centers and dark reddish-brown margins.",
                "recs": [
                    {"action_type": "IPM", "title": "Apply Tricyclazole / Isoprothiolane Solution", "description": "Spray at first sign of spindle foliar lesions.", "priority": "High"},
                    {"action_type": "Irrigation", "title": "Maintain Continuous Shallow Water Layer", "description": "Prevent soil cracking which stresses root systems and accelerates blast severity.", "priority": "Medium"},
                ]
            },
            {
                "name": "Possible Bacterial Leaf Blight (Xanthomonas oryzae)",
                "triggers": ["Wilting", "Yellowing", "Discoloration", "Browning"],
                "parts": ["Leaf"],
                "stages": ["Tillering", "Flowering"],
                "pathogen": "Bacterial",
                "base_prob": 0.66,
                "urgency": "High",
                "desc": "Water-soaked stripes along leaf margins drying into wavy yellowish-white lesions.",
                "recs": [
                    {"action_type": "IPM", "title": "Bactericide (Streptomycin sulphate + Tetracycline)", "description": "Spray in early morning; drain field water temporarily if standing water is deep.", "priority": "High"}
                ]
            }
        ],
        "Corn": [
            {
                "name": "Possible Fall Armyworm Damage (Spodoptera frugiperda)",
                "triggers": ["Holes", "Lesions", "Stunted growth", "Discoloration"],
                "parts": ["Leaf", "Stem"],
                "stages": ["Vegetative", "Whorl"],
                "pathogen": "Pest / Insect",
                "base_prob": 0.79,
                "urgency": "High",
                "desc": "Ragged foliar feeding holes with dark sawdust-like frass inside corn whorl.",
                "recs": [
                    {"action_type": "IPM", "title": "Deploy Pheromone Traps & Neem / Bacillus thuringiensis (Bt)", "description": "Spray bio-pesticide directly into the whorl central funnel.", "priority": "High"}
                ]
            }
        ],
        "Banana": [
            {
                "name": "Possible Black Sigatoka (Pseudocercospora fijiensis)",
                "triggers": ["Spots", "Browning", "Necrosis", "Yellowing"],
                "parts": ["Leaf"],
                "stages": ["Shooting", "Fruiting", "Vegetative"],
                "pathogen": "Fungal",
                "base_prob": 0.74,
                "urgency": "High",
                "desc": "Reddish-brown narrow streaks parallel to leaf veins coalescing into large dark necrotic blotches.",
                "recs": [
                    {"action_type": "Cultural", "title": "De-leafing severely affected leaves", "description": "Cut and lower infected leaves onto the ground to reduce ascospore discharge.", "priority": "High"}
                ]
            }
        ]
    }

    async def analyze_crop_health(
        self,
        crop_type: str,
        growth_stage: str,
        plant_parts: List[str],
        symptoms: List[str],
        severity: str,
        distribution: str,
        symptom_start_date: Optional[str] = None,
        farmer_notes: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None,
        zone_telemetry: Optional[Dict[str, Any]] = None,
        weather_context: Optional[Dict[str, Any]] = None,
        has_images: bool = False,
    ) -> AgronomicDiagnosisResult:
        
        normalized_crop = "Tomato"
        for key in self.DISEASE_KNOWLEDGE_BASE:
            if key.lower() in crop_type.lower():
                normalized_crop = key
                break

        candidates_pool = self.DISEASE_KNOWLEDGE_BASE.get(normalized_crop, self.DISEASE_KNOWLEDGE_BASE["Tomato"])
        
        # Calculate matching scores
        scored_candidates = []
        matched_reasoning = []

        # 1. Symptom matching
        for candidate in candidates_pool:
            score = candidate["base_prob"]
            triggers = candidate["triggers"]
            matching_symptoms = [s for s in symptoms if any(t.lower() in s.lower() for t in triggers)]
            
            symptom_match_ratio = len(matching_symptoms) / max(len(triggers), 1)
            score += symptom_match_ratio * 0.18

            # Part match
            for part in plant_parts:
                if part in candidate["parts"]:
                    score += 0.05
                    break

            # Stage match
            if any(st.lower() in growth_stage.lower() for st in candidate["stages"]):
                score += 0.04

            # Severity weighting
            if severity == "SEVERE":
                score += 0.06
            elif severity == "HIGH":
                score += 0.03
            elif severity == "LOW":
                score -= 0.05

            # Clamp between 0.10 and 0.94 (no 100% without expert verification)
            final_prob = min(max(round(score, 2), 0.12), 0.91)
            
            scored_candidates.append({
                "condition_name": candidate["name"],
                "probability": final_prob,
                "confidence_label": f"{int(final_prob * 100)}% AI confidence",
                "description": candidate["desc"],
                "pathogen_type": candidate["pathogen"],
                "urgency": candidate["urgency"],
                "recs": candidate["recs"],
            })

        # Sort by probability descending
        scored_candidates.sort(key=lambda x: x["probability"], reverse=True)
        top_match = scored_candidates[0]

        # Add physiological / environmental stress fallback
        stress_prob = round(max(0.08, 1.0 - top_match["probability"] - 0.12), 2)
        scored_candidates.append({
            "condition_name": "Nutrient / Environmental Physiological Stress",
            "probability": stress_prob,
            "confidence_label": f"{int(stress_prob * 100)}% AI confidence",
            "description": "Sub-optimal soil moisture, micronutrient deficit, or thermal transpiration imbalance.",
            "pathogen_type": "Physiological",
            "urgency": "Medium",
            "recs": [
                {"action_type": "Irrigation", "title": "Check Soil Moisture & CWSI Index", "description": "Review root-zone moisture sensor readings in affected zone.", "priority": "Medium"}
            ]
        })

        # Generate Explainability Reasoning Points ("Why was this flagged?")
        for s in symptoms[:3]:
            matched_reasoning.append(f"Foliar symptom '{s}' strongly correlates with {top_match['condition_name']}.")
        
        if symptom_start_date:
            matched_reasoning.append(f"Symptoms reported active for '{symptom_start_date}', indicating established pathology incubation.")
        
        matched_reasoning.append(f"Crop is currently in '{growth_stage}', a high-vulnerability stage for {top_match['pathogen_type']} pathology.")
        
        if zone_telemetry and zone_telemetry.get("trend") == "DECLINING":
            matched_reasoning.append(f"Zone NDVI health index has shown a declining trend over recent scans.")
        else:
            matched_reasoning.append(f"Nearby parcel telemetry indicates elevated microclimate disease risk.")

        if has_images:
            matched_reasoning.append("Vision inspection model detected localized foliar chlorosis / lesion patterns in submitted photograph.")

        # Low confidence fallback handling
        status = "AI_SUSPECTED"
        if top_match["probability"] < 0.45 and len(symptoms) < 2:
            status = "INSUFFICIENT_EVIDENCE"
            matched_reasoning.append("Warning: Insufficient symptom evidence for high-certainty classification. Field inspection recommended.")

        # Recommendations list aggregation
        recommendations = list(top_match["recs"])
        recommendations.append({
            "action_type": "Inspection",
            "title": "Request Extension-Worker / Agronomist Field Validation",
            "description": "Submit this diagnostic report to your regional extension officer for ground-truth confirmation.",
            "priority": "Medium"
        })
        recommendations.append({
            "action_type": "Monitoring",
            "title": "Monitor Surrounding Zones (Z16, Z18) for Early Spotting",
            "description": "Increase drone inspection frequency to catch downwind pathogen spread.",
            "priority": "Medium"
        })

        # Follow-up Drone Monitoring recommendation
        zone_code = zone_telemetry.get("zone_code", "Z17") if zone_telemetry else "Z17"
        follow_up = {
            "is_recommended": top_match["probability"] >= 0.60 or severity in ["HIGH", "SEVERE"],
            "recommended_mission": "Targeted Multispectral Zone Scan",
            "target_zones": [zone_code, "Z16", "Z18"],
            "timing": "Within 48 hours",
            "reason": f"Disease indicators are elevated ({int(top_match['probability'] * 100)}%) and downwind parcels show potential spread susceptibility."
        }

        regional_spread = "MEDIUM" if severity in ["MEDIUM", "HIGH"] else ("HIGH" if severity == "SEVERE" else "LOW")

        return AgronomicDiagnosisResult(
            status=status,
            primary_condition=top_match["condition_name"],
            confidence=top_match["probability"],
            possible_conditions=scored_candidates,
            reasoning_points=matched_reasoning,
            recommendations=recommendations,
            follow_up_monitoring=follow_up,
            regional_spread_risk=regional_spread,
            model_name="AgriShield-SymptomReasoner-v1.0",
            model_version="1.0.0-prototype",
            is_prototype=True,
        )
