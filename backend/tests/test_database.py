import pytest
from geoalchemy2.elements import WKTElement

from app.models import (
    Base,
    Role,
    User,
    Farm,
    FarmMember,
    Crop,
    CropCycle,
    FarmZone,
    Drone,
    DroneMission,
    DroneImage,
    ImageProcessingJob,
    HealthObservation,
    DiseaseObservation,
    PestObservation,
    WaterStressObservation,
    WeatherObservation,
    RiskAssessment,
    DiseaseEvent,
    SpreadRisk,
    Recommendation,
    ExpertValidation,
    Alert,
    Notification,
    AuditLog,
)


def test_metadata_contains_all_24_tables():
    """Verify that all 24 required domain tables are properly registered in SQLAlchemy metadata."""
    expected_tables = {
        "roles",
        "users",
        "farms",
        "farm_members",
        "crops",
        "crop_cycles",
        "farm_zones",
        "drones",
        "drone_missions",
        "drone_images",
        "image_processing_jobs",
        "health_observations",
        "disease_observations",
        "pest_observations",
        "water_stress_observations",
        "weather_observations",
        "risk_assessments",
        "disease_events",
        "spread_risks",
        "recommendations",
        "expert_validations",
        "alerts",
        "notifications",
        "audit_logs",
    }

    registered_tables = set(Base.metadata.tables.keys())
    missing_tables = expected_tables - registered_tables
    assert not missing_tables, f"Missing tables in Base.metadata: {missing_tables}"
    assert len(registered_tables) >= 24, f"Expected at least 24 tables, found {len(registered_tables)}"


def test_spatial_geometry_columns_configuration():
    """Verify PostGIS spatial column configurations and SRID 4326 enforcement."""
    # Farm spatial columns
    farm_table = Base.metadata.tables["farms"]
    boundary_col = farm_table.columns["boundary"]
    assert str(boundary_col.type.geometry_type) == "MULTIPOLYGON"
    assert boundary_col.type.srid == 4326

    # FarmZone spatial column
    zone_table = Base.metadata.tables["farm_zones"]
    zone_boundary = zone_table.columns["boundary"]
    assert str(zone_boundary.type.geometry_type) == "POLYGON"
    assert zone_boundary.type.srid == 4326

    # DroneMission spatial column
    mission_table = Base.metadata.tables["drone_missions"]
    flight_boundary = mission_table.columns["flight_boundary"]
    assert str(flight_boundary.type.geometry_type) == "POLYGON"
    assert flight_boundary.type.srid == 4326

    # DroneImage spatial columns
    image_table = Base.metadata.tables["drone_images"]
    location_col = image_table.columns["location"]
    assert str(location_col.type.geometry_type) == "POINT"
    assert location_col.type.srid == 4326

    # DiseaseEvent epicenter & affected_boundary
    disease_table = Base.metadata.tables["disease_events"]
    assert str(disease_table.columns["epicenter"].type.geometry_type) == "POINT"
    assert str(disease_table.columns["affected_boundary"].type.geometry_type) == "POLYGON"


def test_model_instantiation_and_wkt_support():
    """Verify that models can be instantiated with WKT spatial elements."""
    point = WKTElement("POINT(73.8567 18.5204)", srid=4326)
    poly = WKTElement("POLYGON((73.85 18.52, 73.86 18.52, 73.86 18.53, 73.85 18.53, 73.85 18.52))", srid=4326)
    multipoly = WKTElement("MULTIPOLYGON(((73.85 18.52, 73.86 18.52, 73.86 18.53, 73.85 18.53, 73.85 18.52)))", srid=4326)

    farm = Farm(
        name="Test Validation Farm",
        owner_id="user-123",
        boundary=multipoly,
        center_point=point,
        total_area_hectares=10.5,
        is_active=True,
    )
    assert farm.name == "Test Validation Farm"
    assert farm.boundary.srid == 4326
    assert farm.is_active is True

    zone = FarmZone(
        farm_id="farm-123",
        zone_code="Z-01",
        name="North Zone",
        boundary=poly,
        area_hectares=5.25,
        is_active=True,
    )
    assert zone.zone_code == "Z-01"
    assert zone.boundary.srid == 4326
    assert zone.is_active is True


def test_table_indexes_and_constraints():
    """Verify foreign keys, unique constraints, and indexes on critical entities."""
    # FarmZone unique constraint
    zone_table = Base.metadata.tables["farm_zones"]
    uq_names = [c.name for c in zone_table.constraints if c.name == "uq_farm_zone_code"]
    assert "uq_farm_zone_code" in uq_names

    # FarmMember unique constraint
    member_table = Base.metadata.tables["farm_members"]
    uq_member = [c.name for c in member_table.constraints if c.name == "uq_farm_user_membership"]
    assert "uq_farm_user_membership" in uq_member

    # Foreign Keys
    assert len(zone_table.foreign_keys) >= 2
    assert len(Base.metadata.tables["drone_images"].foreign_keys) >= 2
    assert len(Base.metadata.tables["disease_observations"].foreign_keys) >= 3
