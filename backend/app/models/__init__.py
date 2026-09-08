"""
AGRI SHIELD — ORM Domain Models Package.
All 24 relational and PostGIS spatial models register metadata on Base.
"""

from app.db.base import Base, TimestampMixin

# Auth Models
from app.core.permissions import RoleType
from app.models.auth import Role, User
from app.models.audit import AuditLog, AuditEventType

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
    WeatherForecast,
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
)

# Expert Ground-Truth Validation Models
from app.models.validation import (
    ExpertValidationRequest,
    ExpertValidationRecord,
    LabReferral,
    ValidationRequestStatus,
    ValidationPriority,
    LabReferralStatus,
)

# Multilingual Agricultural Advisory Models
from app.models.advisory import (
    AdvisoryTemplate,
    Advisory,
    AdvisoryTranslation,
    AdvisoryType,
    AdvisoryPriority,
    AdvisorySource,
)

# Follow-up Monitoring Models
from app.models.monitoring import (
    MonitoringTask,
    MonitoringResult,
    MonitoringComparison,
    DroneMonitoringRecommendation,
    MonitoringPolicyConfig,
    MonitoringTriggerType,
    MonitoringPriority as MonPriority,
    MonitoringMethod,
    MonitoringTaskStatus,
    MonitoringTrend,
    HotspotTrendStatus,
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
    "ZoneObservation",
    "ZoneSpatialFeature",
    "SpatialFeatureType",
    "ZoneStatus",
    "SoilType",
    "DrainageType",
    # Observation
    "HealthObservation",
    "DiseaseObservation",
    "PestObservation",
    "WaterStressObservation",
    "PathogenType",
    "SeverityLevel",
    "InfestationLevel",
    "WaterStressCategory",
    "HealthTrend",
    # Drone
    "Drone",
    "DroneMission",
    "DroneMissionLog",
    "DroneTelemetry",
    "DroneImagery",
    "DroneModel",
    "MissionStatus",
    "MissionType",
    "DroneOperationalStatus",
    "PayloadSensorType",
    # Intelligence
    "RiskAssessment",
    "OutbreakCluster",
    "HotspotAnalysis",
    "MitigationRecommendation",
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
    # Alert
    "Alert",
    "Notification",
    "AlertType",
    "AlertSeverity",
    "NotificationChannel",
    "SentStatus",
    # Audit
    "AuditLog",
    "AuditEventType",
    # Validation
    "ExpertValidationRequest",
    "ExpertValidationRecord",
    "LabReferral",
    "ValidationRequestStatus",
    "ValidationPriority",
    "LabReferralStatus",
    # Advisory
    "AdvisoryTemplate",
    "Advisory",
    "AdvisoryTranslation",
    "AdvisoryType",
    "AdvisoryPriority",
    "AdvisorySource",
    # Follow-up Monitoring
    "MonitoringTask",
    "MonitoringResult",
    "MonitoringComparison",
    "DroneMonitoringRecommendation",
    "MonitoringPolicyConfig",
    "MonitoringTriggerType",
    "MonPriority",
    "MonitoringMethod",
    "MonitoringTaskStatus",
    "MonitoringTrend",
    "HotspotTrendStatus",
]


