"""
Unit tests for Expert Ground-Truth Validation Service and Policy Engine.
"""

import pytest
from app.models.validation import (
    ValidationRequestStatus,
    ValidationPriority,
)
from app.models.laboratory import LabReferralStatus
from app.services.validation_policy import ValidationPolicyEngine
from app.schemas.validation import (
    ValidationRequestCreate,
    ValidationDecisionSubmit,
    LabReferralCreate,
)


def test_validation_policy_high_risk_pathogen():
    eval_res = ValidationPolicyEngine.evaluate_validation_requirement(
        ai_confidence=0.85,
        condition_name="Late Blight",
        is_farmer_request=False,
    )
    assert eval_res["required"] is True
    assert eval_res["priority"] in [ValidationPriority.HIGH, ValidationPriority.CRITICAL]
    assert "High-impact pathogen" in eval_res["reason"]


def test_validation_policy_low_confidence():
    eval_res = ValidationPolicyEngine.evaluate_validation_requirement(
        ai_confidence=0.45,
        condition_name="Unidentified Leaf Spot",
        is_farmer_request=False,
    )
    assert eval_res["required"] is True
    assert eval_res["priority"] == ValidationPriority.HIGH
    assert "Low AI optical confidence" in eval_res["reason"]


def test_validation_policy_farmer_request():
    eval_res = ValidationPolicyEngine.evaluate_validation_requirement(
        ai_confidence=0.90,
        condition_name="Minor Nutrient Deficiency",
        is_farmer_request=True,
    )
    assert eval_res["required"] is True
    assert eval_res["priority"] == ValidationPriority.MEDIUM
    assert "Farmer explicitly requested" in eval_res["reason"]


def test_validation_policy_healthy_routine():
    eval_res = ValidationPolicyEngine.evaluate_validation_requirement(
        ai_confidence=0.95,
        condition_name="Healthy Crop",
        is_farmer_request=False,
    )
    assert eval_res["required"] is False
    assert eval_res["priority"] == ValidationPriority.LOW


def test_validation_request_schema():
    req = ValidationRequestCreate(
        farm_id="farm-123",
        zone_id="zone-456",
        priority=ValidationPriority.HIGH,
        reason="Visual chlorosis and low NDVI",
        suspected_condition="Early Blight",
        ai_confidence=0.68,
        symptoms=["Leaf spots", "Browning"],
    )
    assert req.farm_id == "farm-123"
    assert req.priority == ValidationPriority.HIGH
    assert len(req.symptoms) == 2


def test_validation_decision_schema():
    decision = ValidationDecisionSubmit(
        decision=ValidationRequestStatus.CONFIRMED,
        confirmed_condition="Early Blight (Alternaria solani)",
        expert_notes="Concentric ring spots matching Alternaria.",
        farmer_guidance="Prune lower infected foliage and avoid sprinkler irrigation.",
    )
    assert decision.decision == ValidationRequestStatus.CONFIRMED
    assert decision.confirmed_condition == "Early Blight (Alternaria solani)"


def test_lab_referral_schema():
    lab = LabReferralCreate(
        sample_type="Leaf Tissue Sample",
        suspected_condition="Bacterial Blight",
        reason="Need PCR lab assay to differentiate from fungal spot",
    )
    assert lab.sample_type == "Leaf Tissue Sample"
    assert lab.suspected_condition == "Bacterial Blight"
