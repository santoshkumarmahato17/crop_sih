"""
Disease-Weather Risk Profiles.
Based on authoritative agricultural literature for Maharashtra crops.

IMPORTANT:
- Thresholds are derived from published sources (ICAR, NIPHM, Maharashtra Agriculture).
- Expert-verified fields are marked with expert_verified=True.
- Never invent biological thresholds.
- Rainfall alone does NOT automatically indicate disease risk.
- This module only evaluates WEATHER FAVORABILITY for a detected disease.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class WeatherFactor:
    name: str
    threshold_type: str         # "min", "max", "range", "rate"
    low: Optional[float] = None
    high: Optional[float] = None
    weight: float = 1.0         # relative importance in favorability score
    description: str = ""


@dataclass
class DiseaseWeatherProfile:
    crop: str
    disease: str
    pathogen_type: str          # fungal | bacterial | viral | physiological
    weather_factors: list[WeatherFactor] = field(default_factory=list)
    source: str = ""
    source_version: str = ""
    expert_verified: bool = False
    last_updated: str = ""      # ISO date string


# ─────────────────────────────────────────────────────────────────────────────
# Profiles — sourced from ICAR & NIPHM publications
# ─────────────────────────────────────────────────────────────────────────────

PROFILES: list[DiseaseWeatherProfile] = [
    # ── Tomato ──────────────────────────────────────────────────────────────
    DiseaseWeatherProfile(
        crop="tomato",
        disease="leaf_blight",
        pathogen_type="fungal",
        source="ICAR-IARI Technical Bulletin on Tomato Diseases, 2019",
        expert_verified=True,
        last_updated="2024-01-01",
        weather_factors=[
            WeatherFactor(
                "relative_humidity_percent", "min", low=75.0, weight=2.0,
                description="Fungal sporulation favoured above 75% RH",
            ),
            WeatherFactor(
                "temperature_c", "range", low=15.0, high=25.0, weight=1.5,
                description="Optimal temp range for Alternaria / Phytophthora",
            ),
            WeatherFactor(
                "rainfall_days", "min", low=2.0, weight=1.0,
                description="Consecutive wet days sustain lesion spread",
            ),
        ],
    ),
    DiseaseWeatherProfile(
        crop="tomato",
        disease="leaf_curl",
        pathogen_type="viral",
        source="ICAR-IARI, Vegetable Science, 2020",
        expert_verified=True,
        last_updated="2024-01-01",
        weather_factors=[
            WeatherFactor(
                "temperature_c", "range", low=25.0, high=35.0, weight=1.5,
                description="High temps promote whitefly vector activity",
            ),
            WeatherFactor(
                "relative_humidity_percent", "max", high=65.0, weight=1.0,
                description="Drier conditions favour whitefly population",
            ),
        ],
    ),
    # ── Maize ───────────────────────────────────────────────────────────────
    DiseaseWeatherProfile(
        crop="maize",
        disease="leaf_blight",
        pathogen_type="fungal",
        source="NIPHM Maize Disease Management Guide, 2021",
        expert_verified=True,
        last_updated="2024-01-01",
        weather_factors=[
            WeatherFactor(
                "relative_humidity_percent", "min", low=80.0, weight=2.0,
                description="Turcicum blight sporulation above 80% RH",
            ),
            WeatherFactor(
                "temperature_c", "range", low=18.0, high=27.0, weight=1.5,
                description="Moderate temperature promotes lesion development",
            ),
        ],
    ),
    # ── Cassava ─────────────────────────────────────────────────────────────
    DiseaseWeatherProfile(
        crop="cassava",
        disease="brown_spot",
        pathogen_type="fungal",
        source="IITA Cassava Disease Epidemiology, 2022",
        expert_verified=True,
        last_updated="2024-01-01",
        weather_factors=[
            WeatherFactor(
                "relative_humidity_percent", "min", low=70.0, weight=1.5,
                description="High RH promotes Cercospora leaf spot",
            ),
            WeatherFactor(
                "rainfall_mm", "min", low=20.0, weight=1.0,
                description="Weekly rainfall >20mm sustains disease",
            ),
        ],
    ),
    # ── Orange / Citrus ─────────────────────────────────────────────────────
    DiseaseWeatherProfile(
        crop="orange",
        disease="citrus_canker",
        pathogen_type="bacterial",
        source="ICAR-NRC Citrus, Technical Bulletin 2018",
        expert_verified=True,
        last_updated="2024-01-01",
        weather_factors=[
            WeatherFactor(
                "relative_humidity_percent", "min", low=80.0, weight=2.0,
                description="High humidity enables Xanthomonas axonopodis spread",
            ),
            WeatherFactor(
                "rainfall_mm", "min", low=10.0, weight=1.5,
                description="Rain splash dispersal of canker bacteria",
            ),
            WeatherFactor(
                "wind_speed_kmh", "min", low=15.0, weight=1.0,
                description="Wind-driven rain increases infection sites",
            ),
        ],
    ),
    DiseaseWeatherProfile(
        crop="orange",
        disease="nutrient_deficiency",
        pathogen_type="physiological",
        source="Maharashtra Agriculture Dept Citrus Advisory, 2023",
        expert_verified=False,
        last_updated="2024-01-01",
        weather_factors=[
            WeatherFactor(
                "rainfall_mm", "min", low=60.0, weight=1.0,
                description="Excess rain leaches micronutrients",
            ),
        ],
    ),
]


def get_profile(crop: str, disease: str) -> Optional[DiseaseWeatherProfile]:
    """Retrieve the weather profile for a given crop+disease combination."""
    crop_l = crop.lower().strip()
    disease_l = disease.lower().strip().replace(" ", "_")
    for p in PROFILES:
        if p.crop == crop_l and p.disease == disease_l:
            return p
    return None
