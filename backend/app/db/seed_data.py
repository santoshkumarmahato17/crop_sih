import asyncio
import uuid
from datetime import datetime, date, timezone, timedelta
from geoalchemy2.elements import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models import (
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
    AuditEventType,
    MemberRole,
    CropCycleStatus,
    DroneStatus,
    MissionStatus,
    ImageType,
    JobType,
    JobStatus,
    HealthTrend,
    PathogenType,
    SeverityLevel,
    InfestationLevel,
    WaterStressCategory,
    RiskLevel,
    OutbreakStatus,
    RecommendationType,
    RecommendationPriority,
    RecommendationStatus,
    ValidationStatus,
    AlertType,
    AlertSeverity,
    NotificationChannel,
    SentStatus,
)


def point_wkt(lng: float, lat: float) -> WKTElement:
    return WKTElement(f"POINT({lng} {lat})", srid=4326)


def polygon_wkt(coords: list[tuple[float, float]]) -> WKTElement:
    ring_str = ", ".join([f"{p[0]} {p[1]}" for p in coords])
    return WKTElement(f"POLYGON(({ring_str}))", srid=4326)


def multipolygon_wkt(polys: list[list[tuple[float, float]]]) -> WKTElement:
    poly_strs = []
    for poly in polys:
        ring = ", ".join([f"{p[0]} {p[1]}" for p in poly])
        poly_strs.append(f"(({ring}))")
    return WKTElement(f"MULTIPOLYGON({', '.join(poly_strs)})", srid=4326)


async def seed_all_data(db: AsyncSession) -> dict:
    """Populates the database with a complete, coherent agronomic test dataset."""
    now = datetime.now(timezone.utc)

    # --------------------------------------------------------------------------
    # 1. Seed Roles
    # --------------------------------------------------------------------------
    roles = {
        "admin": Role(
            id=str(uuid.uuid4()),
            name="admin",
            description="System Administrator with full access",
            permissions={"all": True},
        ),
        "agronomist": Role(
            id=str(uuid.uuid4()),
            name="agronomist",
            description="Senior Agronomist & Extension Specialist",
            permissions={"validate_disease": True, "create_recommendations": True},
        ),
        "farmer": Role(
            id=str(uuid.uuid4()),
            name="farmer",
            description="Farm Owner & Operator",
            permissions={"manage_farm": True, "view_alerts": True},
        ),
        "authority": Role(
            id=str(uuid.uuid4()),
            name="authority",
            description="Regional Agricultural Authority",
            permissions={"view_regional_spread": True, "export_reports": True},
        ),
    }
    for r in roles.values():
        db.add(r)
    await db.flush()

    # --------------------------------------------------------------------------
    # 2. Seed Users
    # --------------------------------------------------------------------------
    user_farmer = User(
        id=str(uuid.uuid4()),
        email="farmer@kisansathi.internal",
        hashed_password=get_password_hash("FarmerSecurePass123!"),
        full_name="Rajesh Patil",
        phone_number="+919876543210",
        is_active=True,
        role_id=roles["farmer"].id,
    )
    user_agronomist = User(
        id=str(uuid.uuid4()),
        email="agronomist@kisansathi.internal",
        hashed_password=get_password_hash("AgroSecurePass123!"),
        full_name="Dr. Priya Sharma",
        phone_number="+919876543211",
        is_active=True,
        role_id=roles["agronomist"].id,
    )
    user_operator = User(
        id=str(uuid.uuid4()),
        email="pilot@kisansathi.internal",
        hashed_password=get_password_hash("PilotSecurePass123!"),
        full_name="Ravi Kumar",
        phone_number="+919876543212",
        is_active=True,
        role_id=roles["admin"].id,
    )
    user_government = User(
        id=str(uuid.uuid4()),
        email="government@kisansathi.internal",
        hashed_password=get_password_hash("GovOfficialPass123!"),
        full_name="Dr. Aniket Patil",
        phone_number="+919876543213",
        is_active=True,
        role_id=roles["authority"].id,
    )
    db.add_all([user_farmer, user_agronomist, user_operator, user_government])
    await db.flush()

    # --------------------------------------------------------------------------
    # 3. Seed Farm & Spatial Boundaries (Around Pune Agricultural Belt)
    # --------------------------------------------------------------------------
    # Coordinates for ~25 hectare farm
    farm_coords = [
        (73.8500, 18.5200),
        (73.8560, 18.5200),
        (73.8560, 18.5250),
        (73.8500, 18.5250),
        (73.8500, 18.5200),
    ]

    farm = Farm(
        id=str(uuid.uuid4()),
        name="Sahyadri Bio-Agricultural Research Estate",
        description="Precision horticulture and staple crop monitoring estate.",
        owner_id=user_farmer.id,
        boundary=multipolygon_wkt([farm_coords]),
        center_point=point_wkt(73.8530, 18.5225),
        total_area_hectares=24.8,
        elevation_meters=560.0,
        soil_type="Black Cotton Loam (Vertisol)",
        address="Survey No. 42, Khed Shivapur Road",
        city="Pune",
        region="Maharashtra",
        country="India",
        is_active=True,
    )
    db.add(farm)
    await db.flush()

    # Farm Member Association
    member = FarmMember(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        user_id=user_agronomist.id,
        role_in_farm=MemberRole.AGRONOMIST,
        permissions={"edit_zones": True, "prescribe_treatments": True},
    )
    db.add(member)

    # --------------------------------------------------------------------------
    # 4. Seed Crops & Crop Cycle
    # --------------------------------------------------------------------------
    crop_wheat = Crop(
        id=str(uuid.uuid4()),
        common_name="Wheat",
        scientific_name="Triticum aestivum",
        variety="PBW-343",
        optimal_temp_min_c=12.0,
        optimal_temp_max_c=25.0,
        optimal_soil_moisture_min=45.0,
        optimal_soil_moisture_max=75.0,
        typical_growing_days=130,
        growth_stages=[
            {"stage": "Germination", "days": 10},
            {"stage": "Tillering", "days": 35},
            {"stage": "Heading/Flowering", "days": 75},
            {"stage": "Ripening/Maturity", "days": 125},
        ],
    )
    db.add(crop_wheat)
    await db.flush()

    crop_cycle = CropCycle(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        crop_id=crop_wheat.id,
        planting_date=date(2026, 6, 15),
        expected_harvest_date=date(2026, 10, 20),
        status=CropCycleStatus.ACTIVE,
        target_yield_tonnes_per_hectare=4.5,
    )
    db.add(crop_cycle)
    await db.flush()

    # --------------------------------------------------------------------------
    # 5. Seed Farm Zones (4 Quadrants)
    # --------------------------------------------------------------------------
    z1_coords = [(73.8500, 18.5225), (73.8530, 18.5225), (73.8530, 18.5250), (73.8500, 18.5250), (73.8500, 18.5225)]
    z2_coords = [(73.8530, 18.5225), (73.8560, 18.5225), (73.8560, 18.5250), (73.8530, 18.5250), (73.8530, 18.5225)]
    z3_coords = [(73.8500, 18.5200), (73.8530, 18.5200), (73.8530, 18.5225), (73.8500, 18.5225), (73.8500, 18.5200)]
    z4_coords = [(73.8530, 18.5200), (73.8560, 18.5200), (73.8560, 18.5225), (73.8530, 18.5225), (73.8530, 18.5200)]

    zones = [
        FarmZone(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            crop_cycle_id=crop_cycle.id,
            zone_code="Z-01",
            name="North-West Terrace Plot",
            boundary=polygon_wkt(z1_coords),
            area_hectares=6.2,
            irrigation_type="drip",
            is_active=True,
        ),
        FarmZone(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            crop_cycle_id=crop_cycle.id,
            zone_code="Z-02",
            name="North-East High Density Plot",
            boundary=polygon_wkt(z2_coords),
            area_hectares=6.2,
            irrigation_type="drip",
            is_active=True,
        ),
        FarmZone(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            crop_cycle_id=crop_cycle.id,
            zone_code="Z-03",
            name="South-West Valley Plot",
            boundary=polygon_wkt(z3_coords),
            area_hectares=6.2,
            irrigation_type="sprinkler",
            is_active=True,
        ),
        FarmZone(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            crop_cycle_id=crop_cycle.id,
            zone_code="Z-04",
            name="South-East Buffer Plot",
            boundary=polygon_wkt(z4_coords),
            area_hectares=6.2,
            irrigation_type="sprinkler",
            is_active=True,
        ),
    ]
    db.add_all(zones)
    await db.flush()

    # --------------------------------------------------------------------------
    # 6. Seed Drone, Mission & Processing Job
    # --------------------------------------------------------------------------
    drone = Drone(
        id=str(uuid.uuid4()),
        serial_number="DJI-M350-AGRI-001",
        model_name="DJI Matrice 350 RTK + Zenmuse P1 / H20T",
        sensor_types=["RGB", "Multispectral", "Thermal"],
        battery_cycle_count=34,
        status=DroneStatus.IDLE,
    )
    db.add(drone)
    await db.flush()

    mission = DroneMission(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        drone_id=drone.id,
        operator_id=user_operator.id,
        flight_boundary=polygon_wkt(farm_coords),
        mission_date=now - timedelta(days=2),
        altitude_meters=60.0,
        flight_speed_mps=6.5,
        overlap_percentage=80.0,
        weather_conditions={"wind_mps": 2.1, "cloud_cover": "clear", "temp_c": 26.5},
        status=MissionStatus.COMPLETED,
    )
    db.add(mission)
    await db.flush()

    # Sample Drone Captured Image
    drone_img = DroneImage(
        id=str(uuid.uuid4()),
        mission_id=mission.id,
        zone_id=zones[0].id,
        file_path="kisansathi-raw-imagery/2026/08/29/DJI_0042_RGB.tif",
        image_type=ImageType.RGB,
        capture_time=now - timedelta(days=2, hours=1),
        location=point_wkt(73.8515, 18.5235),
        footprint=polygon_wkt([
            (73.8510, 18.5230),
            (73.8520, 18.5230),
            (73.8520, 18.5240),
            (73.8510, 18.5240),
            (73.8510, 18.5230),
        ]),
        altitude_agl_meters=60.2,
        resolution_cm_per_pixel=1.8,
        file_size_bytes=42500000,
    )
    db.add(drone_img)

    proc_job = ImageProcessingJob(
        id=str(uuid.uuid4()),
        mission_id=mission.id,
        job_type=JobType.ORTHOMOSAIC_GENERATION,
        status=JobStatus.COMPLETED,
        progress_percent=100.0,
        celery_task_id="celery-task-ortho-982341",
        started_at=now - timedelta(days=2),
        completed_at=now - timedelta(days=2) + timedelta(minutes=18),
    )
    db.add(proc_job)

    # --------------------------------------------------------------------------
    # 7. Seed Multi-Modal Observations (Health, Disease, Pest, CWSI, Weather)
    # --------------------------------------------------------------------------
    health_obs = HealthObservation(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        zone_id=zones[0].id,
        mission_id=mission.id,
        observation_date=now - timedelta(days=2),
        location=point_wkt(73.8515, 18.5235),
        affected_polygon=polygon_wkt([
            (73.8512, 18.5232),
            (73.8518, 18.5232),
            (73.8518, 18.5238),
            (73.8512, 18.5238),
            (73.8512, 18.5232),
        ]),
        mean_ndvi=0.62, # Stress indicator
        mean_ndre=0.51,
        mean_canopy_temp_c=29.8,
        overall_health_score=0.68,
        trend=HealthTrend.DETERIORATING,
    )
    db.add(health_obs)
    await db.flush()

    disease_obs = DiseaseObservation(
        id=str(uuid.uuid4()),
        health_observation_id=health_obs.id,
        farm_id=farm.id,
        zone_id=zones[0].id,
        disease_name="Yellow Rust (Puccinia striiformis)",
        pathogen_type=PathogenType.FUNGAL,
        severity_level=SeverityLevel.MODERATE,
        confidence_score=0.92,
        location=point_wkt(73.8515, 18.5235),
        bounding_box={"xmin": 120, "ymin": 340, "xmax": 280, "ymax": 490},
        observation_date=now - timedelta(days=2),
    )
    db.add(disease_obs)

    pest_obs = PestObservation(
        id=str(uuid.uuid4()),
        health_observation_id=health_obs.id,
        farm_id=farm.id,
        zone_id=zones[0].id,
        pest_name="Wheat Aphid (Sitobion avenae)",
        infestation_level=InfestationLevel.LOW,
        affected_area_percentage=4.5,
        confidence_score=0.88,
        location=point_wkt(73.8515, 18.5235),
        observation_date=now - timedelta(days=2),
    )
    db.add(pest_obs)

    water_obs = WaterStressObservation(
        id=str(uuid.uuid4()),
        health_observation_id=health_obs.id,
        farm_id=farm.id,
        zone_id=zones[0].id,
        cwsi_index=0.38,
        canopy_air_temp_diff_c=2.1,
        stress_category=WaterStressCategory.MILD,
        location=point_wkt(73.8515, 18.5235),
        observation_date=now - timedelta(days=2),
    )
    db.add(water_obs)

    weather_obs = WeatherObservation(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        location=point_wkt(73.8530, 18.5225),
        observation_time=now - timedelta(hours=1),
        temperature_c=27.4,
        relative_humidity_percent=78.0,
        wind_speed_mps=3.2,
        wind_direction_deg=220.0,
        rainfall_mm=0.0,
        solar_radiation_w_m2=680.0,
        leaf_wetness_hours=4.5,
        source="on_farm_station_A1",
    )
    db.add(weather_obs)

    # --------------------------------------------------------------------------
    # 8. Seed Risk Assessment, Disease Event, Spread Risk & IPM Recommendation
    # --------------------------------------------------------------------------
    risk_assessment = RiskAssessment(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        zone_id=zones[0].id,
        assessment_date=now,
        target_pathogen_or_pest="Yellow Rust (Puccinia striiformis)",
        risk_score=0.84,
        risk_level=RiskLevel.HIGH,
        driving_factors={
            "relative_humidity": "78% (optimal for fungal germination)",
            "temperature_band": "22-28C",
            "leaf_wetness_hours": 4.5,
            "existing_hotspot": "Zone Z-01 cluster",
        },
        forecast_window_days=7,
    )
    db.add(risk_assessment)

    disease_event = DiseaseEvent(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        zone_id=zones[0].id,
        event_name="North-West Yellow Rust Cluster",
        pathogen_or_pest="Yellow Rust",
        outbreak_status=OutbreakStatus.CONFIRMED,
        start_date=now - timedelta(days=3),
        epicenter=point_wkt(73.8515, 18.5235),
        affected_boundary=polygon_wkt([
            (73.8510, 18.5230),
            (73.8520, 18.5230),
            (73.8520, 18.5240),
            (73.8510, 18.5240),
            (73.8510, 18.5230),
        ]),
        estimated_damage_percentage=8.0,
    )
    db.add(disease_event)
    await db.flush()

    # Recommendation
    recommendation = Recommendation(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        zone_id=zones[0].id,
        disease_event_id=disease_event.id,
        recommendation_type=RecommendationType.CHEMICAL_IPM,
        priority=RecommendationPriority.URGENT,
        title="Targeted Propiconazole 25% EC Application",
        action_items={
            "steps": [
                "Apply Propiconazole 25% EC @ 1ml/L targeted strictly to Zone Z-01 buffer.",
                "Maintain 15m safety border from neighboring Zone Z-02.",
                "Execute spraying during early morning before 09:00 AM to prevent drift.",
            ]
        },
        dosage_or_rate="1.0 ml / Litre of water (approx 500L/ha)",
        application_window_start=now + timedelta(hours=12),
        application_window_end=now + timedelta(hours=36),
        status=RecommendationStatus.PENDING,
    )
    db.add(recommendation)

    # Agronomist Expert Validation
    validation = ExpertValidation(
        id=str(uuid.uuid4()),
        health_observation_id=health_obs.id,
        disease_observation_id=disease_obs.id,
        disease_event_id=disease_event.id,
        expert_user_id=user_agronomist.id,
        validation_status=ValidationStatus.CONFIRMED,
        confidence_rating=5,
        notes="Yellow rust pustules confirmed on lower canopy leaves. Immediate containment recommended.",
        validated_at=now - timedelta(days=1),
    )
    db.add(validation)

    # --------------------------------------------------------------------------
    # 9. Seed Alert, Notification & Audit Log
    # --------------------------------------------------------------------------
    alert = Alert(
        id=str(uuid.uuid4()),
        farm_id=farm.id,
        zone_id=zones[0].id,
        alert_type=AlertType.DISEASE_DETECTED,
        severity=AlertSeverity.HIGH,
        title="High Severity Disease Hotspot: Zone Z-01",
        message="AI Vision detected Yellow Rust with 92% confidence. Immediate IPM spray recommended.",
        location=point_wkt(73.8515, 18.5235),
        is_resolved=False,
    )
    db.add(alert)
    await db.flush()

    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_farmer.id,
        alert_id=alert.id,
        channel=NotificationChannel.IN_APP,
        title="Alert: Yellow Rust Hotspot Identified",
        content="Zone Z-01 has detected Yellow Rust. Review recommended IPM actions in your dashboard.",
        is_read=False,
        sent_status=SentStatus.SENT,
    )
    db.add(notification)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_agronomist.id,
        user_email=user_agronomist.email,
        event_type=AuditEventType.VALIDATION_CONFIRMED,
        details={
            "action": "VALIDATE",
            "entity_type": "DiseaseObservation",
            "entity_id": disease_obs.id,
            "changes": {"status_before": "unverified", "status_after": "confirmed"},
        },
        ip_address="192.168.1.50",
    )
    db.add(audit)

    await db.commit()

    return {
        "roles": len(roles),
        "users": 3,
        "farms": 1,
        "zones": len(zones),
        "crops": 1,
        "crop_cycles": 1,
        "drones": 1,
        "missions": 1,
        "observations": 5,
        "disease_events": 1,
        "recommendations": 1,
        "alerts": 1,
    }
