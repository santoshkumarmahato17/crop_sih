"""
AGRI SHIELD — ORM Domain Models Package.
All 24 relational and PostGIS spatial models register metadata on Base.
"""

from app.db.base import Base, TimestampMixin

# Auth Models
from app.models.auth import Role, User

# Farm & Agronomic Topology Models
from app.models.farm import Crop, CropCycle, CropCycleStatus, Farm, FarmMember, FarmZone, MemberRole

# Drone & Imagery Capture Models
from app.models.drone import (
    Drone,
    DroneImage,
    DroneMission,
    DroneStatus,
    ImageProcessingJob,
    ImageType,
    JobStatus,
    JobType,
    MissionStatus,
)

# Multi-Modal Observation Models
from app.models.observation import (
    DiseaseObservation,
    HealthObservation,
    HealthTrend,
    InfestationLevel,
    PathogenType,
    PestObservation,
    SeverityLevel,
    WaterStressCategory,
    WaterStressObservation,
    WeatherObservation,
)

# Spread Intelligence & Advisory Models
from app.models.intelligence import (
    DiseaseEvent,
    ExpertValidation,
    OutbreakStatus,
    Recommendation,
    RecommendationPriority,
    RecommendationStatus,
    RecommendationType,
    RiskAssessment,
    RiskLevel,
    SpreadRisk,
    ValidationStatus,
)

# Alerting & Notification Models
from app.models.alert import Alert, AlertSeverity, AlertType, Notification, NotificationChannel, SentStatus

# Audit Trail Models
from app.models.audit import AuditLog

# Symptom-Based Diagnosis Models
from app.models.diagnosis import (
    DiagnosisAnalysis,
    DiagnosisSymptom,
    DiagnosisImage,
    DiagnosisStatus,
    SymptomSeverity,
    SymptomDistribution,
    ValidationRequestStatus,
)

__all__ = [
    # Base
    "Base",
    "TimestampMixin",
    # Auth
    "User",
    "Role",
    # Farm
    "Farm",
    "FarmMember",
    "FarmZone",
    "Crop",
    "CropCycle",
    "MemberRole",
    "CropCycleStatus",
    # Drone
    "Drone",
    "DroneMission",
    "DroneImage",
    "ImageProcessingJob",
    "DroneStatus",
    "MissionStatus",
    "ImageType",
    "JobType",
    "JobStatus",
    # Observation
    "HealthObservation",
    "DiseaseObservation",
    "PestObservation",
    "WaterStressObservation",
    "WeatherObservation",
    "HealthTrend",
    "PathogenType",
    "SeverityLevel",
    "InfestationLevel",
    "WaterStressCategory",
    # Intelligence
    "RiskAssessment",
    "DiseaseEvent",
    "SpreadRisk",
    "Recommendation",
    "ExpertValidation",
    "RiskLevel",
    "OutbreakStatus",
    "RecommendationType",
    "RecommendationPriority",
    "RecommendationStatus",
    "ValidationStatus",
    # Diagnosis
    "DiagnosisAnalysis",
    "DiagnosisSymptom",
    "DiagnosisImage",
    "DiagnosisStatus",
    "SymptomSeverity",
    "SymptomDistribution",
    "ValidationRequestStatus",
    # Alert
    "Alert",
    "Notification",
    "AlertType",
    "AlertSeverity",
    "NotificationChannel",
    "SentStatus",
    # Audit
    "AuditLog",
]
