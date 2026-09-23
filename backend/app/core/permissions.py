import enum
from typing import Dict, List, Set


class RoleType(str, enum.Enum):
    """Primary user authorization roles for KISAN SATHI."""
    FARMER = "FARMER"
    EXTENSION_WORKER = "EXTENSION_WORKER"
    GOVERNMENT = "GOVERNMENT"
    ADMIN = "ADMIN"


class Permission(str, enum.Enum):
    """Fine-grained domain permissions."""
    # Farmer Domain Permissions
    FARM_VIEW = "FARM_VIEW"
    FARM_CREATE = "FARM_CREATE"
    FARM_EDIT = "FARM_EDIT"
    FARM_DELETE = "FARM_DELETE"
    CROP_VIEW = "CROP_VIEW"
    CROP_MANAGE = "CROP_MANAGE"
    DRONE_VIEW = "DRONE_VIEW"
    DRONE_MANAGE = "DRONE_MANAGE"
    DISEASE_VIEW = "DISEASE_VIEW"
    DISEASE_ANALYZE = "DISEASE_ANALYZE"
    ALERT_VIEW = "ALERT_VIEW"
    REPORT_VIEW = "REPORT_VIEW"
    AI_ASSISTANT_USE = "AI_ASSISTANT_USE"

    # Extension Worker / Field Officer Domain Permissions
    EXTENSION_DASHBOARD_VIEW = "EXTENSION_DASHBOARD_VIEW"
    FIELD_VERIFICATION_VIEW = "FIELD_VERIFICATION_VIEW"
    FIELD_VERIFICATION_MANAGE = "FIELD_VERIFICATION_MANAGE"
    LAB_REFERRAL_CREATE = "LAB_REFERRAL_CREATE"

    # Government / Regional Authority Domain Permissions
    REGIONAL_DASHBOARD_VIEW = "REGIONAL_DASHBOARD_VIEW"
    REGIONAL_MONITORING_VIEW = "REGIONAL_MONITORING_VIEW"
    DISEASE_HOTSPOTS_VIEW = "DISEASE_HOTSPOTS_VIEW"
    PEST_HOTSPOTS_VIEW = "PEST_HOTSPOTS_VIEW"
    WATER_STRESS_VIEW = "WATER_STRESS_VIEW"
    SPREAD_RISK_VIEW = "SPREAD_RISK_VIEW"
    REGIONAL_ANALYTICS_VIEW = "REGIONAL_ANALYTICS_VIEW"
    REGIONAL_REPORTS_VIEW = "REGIONAL_REPORTS_VIEW"
    REGIONAL_ADVISORY_CREATE = "REGIONAL_ADVISORY_CREATE"

    # Administrator Domain Permissions
    ADMIN_DASHBOARD_ACCESS = "ADMIN_DASHBOARD_ACCESS"
    USER_MANAGE = "USER_MANAGE"
    FARMER_MANAGE = "FARMER_MANAGE"
    GOVERNMENT_MANAGE = "GOVERNMENT_MANAGE"
    SYSTEM_MONITORING = "SYSTEM_MONITORING"
    AI_MODEL_MANAGE = "AI_MODEL_MANAGE"
    DRONE_SYSTEM_MANAGE = "DRONE_SYSTEM_MANAGE"
    AUDIT_LOGS_VIEW = "AUDIT_LOGS_VIEW"
    SECURITY_SETTINGS_MANAGE = "SECURITY_SETTINGS_MANAGE"
    SYSTEM_CONFIG_MANAGE = "SYSTEM_CONFIG_MANAGE"


# Standard Role-to-Permissions Mapping (Source of Truth)
ROLE_PERMISSIONS: Dict[RoleType, Set[Permission]] = {
    RoleType.FARMER: {
        Permission.FARM_VIEW,
        Permission.FARM_CREATE,
        Permission.FARM_EDIT,
        Permission.FARM_DELETE,
        Permission.CROP_VIEW,
        Permission.CROP_MANAGE,
        Permission.DRONE_VIEW,
        Permission.DRONE_MANAGE,
        Permission.DISEASE_VIEW,
        Permission.DISEASE_ANALYZE,
        Permission.ALERT_VIEW,
        Permission.REPORT_VIEW,
        Permission.AI_ASSISTANT_USE,
    },
    RoleType.EXTENSION_WORKER: {
        Permission.EXTENSION_DASHBOARD_VIEW,
        Permission.FIELD_VERIFICATION_VIEW,
        Permission.FIELD_VERIFICATION_MANAGE,
        Permission.LAB_REFERRAL_CREATE,
        Permission.FARM_VIEW,
        Permission.CROP_VIEW,
        Permission.DISEASE_VIEW,
        Permission.ALERT_VIEW,
        Permission.REPORT_VIEW,
    },
    RoleType.GOVERNMENT: {
        Permission.REGIONAL_DASHBOARD_VIEW,
        Permission.REGIONAL_MONITORING_VIEW,
        Permission.DISEASE_HOTSPOTS_VIEW,
        Permission.PEST_HOTSPOTS_VIEW,
        Permission.WATER_STRESS_VIEW,
        Permission.SPREAD_RISK_VIEW,
        Permission.REGIONAL_ANALYTICS_VIEW,
        Permission.REGIONAL_REPORTS_VIEW,
        Permission.REGIONAL_ADVISORY_CREATE,
        Permission.ALERT_VIEW,
        Permission.AI_ASSISTANT_USE,
        Permission.REPORT_VIEW,
    },
    RoleType.ADMIN: {
        # Admins inherit all system permissions
        perm for perm in Permission
    },
}


def get_permissions_for_role(role: RoleType | str) -> List[str]:
    """Returns permission string list for a given role enum/string."""
    if isinstance(role, str):
        try:
            role_enum = RoleType(role.upper().strip())
        except ValueError:
            return []
    else:
        role_enum = role

    perms = ROLE_PERMISSIONS.get(role_enum, set())
    return sorted([p.value for p in perms])
