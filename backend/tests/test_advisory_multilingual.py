"""
Unit tests for Multilingual Translation and Safe IPM Advisory Service.
"""

import pytest
from app.services.translation_service import TranslationService
from app.models.advisory import AdvisoryType, AdvisoryPriority, AdvisorySource
from app.schemas.advisory import AdvisoryGenerateRequest


def test_translation_service_english() -> None:
    content = TranslationService.get_localized_content("early_blight", "en")
    assert content["language"] == "en"
    assert "Early Blight" in content["title"]
    assert len(content["what_to_do_now"]) > 0
    assert len(content["safety_warnings"]) > 0


def test_translation_service_tamil() -> None:
    content = TranslationService.get_localized_content("early_blight", "ta")
    assert content["language"] == "ta"
    assert "இலைக்கருகல்" in content["title"]
    assert "ஈரப்பதம்" in content["why_this_matters"]
    assert len(content["what_to_do_now"]) > 0


def test_translation_service_hindi() -> None:
    content = TranslationService.get_localized_content("early_blight", "hi")
    assert content["language"] == "hi"
    assert "झुलसा" in content["title"]
    assert "पत्तियों" in content["what_to_do_now"][0]


def test_translation_service_marathi() -> None:
    content = TranslationService.get_localized_content("early_blight", "mr")
    assert content["language"] == "mr"
    assert "करपा" in content["title"]
    assert "झाडाच्या" in content["what_to_do_now"][0]


def test_translation_service_fallback() -> None:
    # If a language is not found, fallback to English safely
    content = TranslationService.get_localized_content("early_blight", "unknown_lang")
    assert content["language"] == "en"
    assert "Early Blight" in content["title"]


def test_ipm_dosage_safety_sanitization() -> None:
    unsafe_recipe = "Apply 20 ml per litre of synthetic chemical."
    sanitized = TranslationService.sanitize_agronomic_action(unsafe_recipe)
    assert "20 ml per" not in sanitized
    assert "Agricultural University" in sanitized


def test_advisory_generate_request_schema() -> None:
    req = AdvisoryGenerateRequest(
        farm_id="farm-999",
        zone_id="zone-111",
        condition_name="Early Blight",
        risk_score=0.82,
        priority=AdvisoryPriority.HIGH,
        trust_level=3,
    )
    assert req.farm_id == "farm-999"
    assert req.priority == AdvisoryPriority.HIGH
    assert req.trust_level == 3
