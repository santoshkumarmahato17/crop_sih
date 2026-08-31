"""Initial AGRI SHIELD PostGIS database schema with 24 domain models

Revision ID: 2026_08_31_0001
Revises: 
Create Date: 2026-08-31 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '2026_08_31_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. PostGIS Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis_raster;")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

    # 2. Roles & Users
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=50), nullable=False, unique=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_roles_name', 'roles', ['name'])

    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone_number', sa.String(length=30), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.Column('role_id', sa.String(length=36), sa.ForeignKey('roles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role_id', 'users', ['role_id'])

    # 3. Farms
    op.create_table(
        'farms',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('boundary', Geometry(geometry_type='MULTIPOLYGON', srid=4326, spatial_index=True), nullable=False),
        sa.Column('center_point', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True),
        sa.Column('total_area_hectares', sa.Float(), nullable=False, default=0.0),
        sa.Column('elevation_meters', sa.Float(), nullable=True),
        sa.Column('soil_type', sa.String(length=100), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=False, default='India'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_farms_name', 'farms', ['name'])
    op.create_index('ix_farms_owner_id', 'farms', ['owner_id'])
    op.create_index('ix_farms_region', 'farms', ['region'])
    op.create_index('ix_farms_country', 'farms', ['country'])

    op.create_table(
        'farm_members',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role_in_farm', sa.String(length=50), nullable=False, default='worker'),
        sa.Column('permissions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('farm_id', 'user_id', name='uq_farm_user_membership'),
    )
    op.create_index('ix_farm_members_farm_id', 'farm_members', ['farm_id'])
    op.create_index('ix_farm_members_user_id', 'farm_members', ['user_id'])

    # 4. Crops & Crop Cycles
    op.create_table(
        'crops',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('common_name', sa.String(length=100), nullable=False),
        sa.Column('scientific_name', sa.String(length=150), nullable=False),
        sa.Column('variety', sa.String(length=100), nullable=True),
        sa.Column('optimal_temp_min_c', sa.Float(), nullable=True),
        sa.Column('optimal_temp_max_c', sa.Float(), nullable=True),
        sa.Column('optimal_soil_moisture_min', sa.Float(), nullable=True),
        sa.Column('optimal_soil_moisture_max', sa.Float(), nullable=True),
        sa.Column('typical_growing_days', sa.Integer(), nullable=False, default=120),
        sa.Column('growth_stages', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_crops_common_name', 'crops', ['common_name'])

    op.create_table(
        'crop_cycles',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', sa.String(length=36), sa.ForeignKey('crops.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('planting_date', sa.Date(), nullable=False),
        sa.Column('expected_harvest_date', sa.Date(), nullable=True),
        sa.Column('actual_harvest_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='active'),
        sa.Column('target_yield_tonnes_per_hectare', sa.Float(), nullable=True),
        sa.Column('actual_yield_tonnes_per_hectare', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_crop_cycles_farm_id', 'crop_cycles', ['farm_id'])
    op.create_index('ix_crop_cycles_crop_id', 'crop_cycles', ['crop_id'])
    op.create_index('ix_crop_cycles_planting_date', 'crop_cycles', ['planting_date'])

    # 5. Farm Zones
    op.create_table(
        'farm_zones',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_cycle_id', sa.String(length=36), sa.ForeignKey('crop_cycles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('zone_code', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('boundary', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=False),
        sa.Column('area_hectares', sa.Float(), nullable=False, default=0.0),
        sa.Column('soil_profile', sa.JSON(), nullable=True),
        sa.Column('irrigation_type', sa.String(length=50), nullable=True, default='drip'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('farm_id', 'zone_code', name='uq_farm_zone_code'),
    )
    op.create_index('ix_farm_zones_farm_id', 'farm_zones', ['farm_id'])
    op.create_index('ix_farm_zones_crop_cycle_id', 'farm_zones', ['crop_cycle_id'])

    # 6. Drones & Missions
    op.create_table(
        'drones',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('serial_number', sa.String(length=100), nullable=False, unique=True),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('sensor_types', sa.JSON(), nullable=True),
        sa.Column('battery_cycle_count', sa.Integer(), nullable=False, default=0),
        sa.Column('status', sa.String(length=50), nullable=False, default='idle'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_drones_serial_number', 'drones', ['serial_number'])

    op.create_table(
        'drone_missions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('drone_id', sa.String(length=36), sa.ForeignKey('drones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('operator_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('flight_boundary', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=False),
        sa.Column('mission_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('altitude_meters', sa.Float(), nullable=False, default=50.0),
        sa.Column('flight_speed_mps', sa.Float(), nullable=False, default=5.0),
        sa.Column('overlap_percentage', sa.Float(), nullable=False, default=75.0),
        sa.Column('weather_conditions', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='scheduled'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_drone_missions_farm_id', 'drone_missions', ['farm_id'])
    op.create_index('ix_drone_missions_mission_date', 'drone_missions', ['mission_date'])

    op.create_table(
        'drone_images',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('mission_id', sa.String(length=36), sa.ForeignKey('drone_missions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('image_type', sa.String(length=50), nullable=False, default='rgb'),
        sa.Column('capture_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('footprint', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('altitude_agl_meters', sa.Float(), nullable=False, default=0.0),
        sa.Column('camera_pitch', sa.Float(), nullable=True),
        sa.Column('camera_roll', sa.Float(), nullable=True),
        sa.Column('camera_yaw', sa.Float(), nullable=True),
        sa.Column('resolution_cm_per_pixel', sa.Float(), nullable=True),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_drone_images_mission_id', 'drone_images', ['mission_id'])
    op.create_index('ix_drone_images_capture_time', 'drone_images', ['capture_time'])

    op.create_table(
        'image_processing_jobs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('mission_id', sa.String(length=36), sa.ForeignKey('drone_missions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, default='queued'),
        sa.Column('progress_percent', sa.Float(), nullable=False, default=0.0),
        sa.Column('celery_task_id', sa.String(length=100), nullable=True),
        sa.Column('output_artifacts', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_image_processing_jobs_mission_id', 'image_processing_jobs', ['mission_id'])
    op.create_index('ix_image_processing_jobs_celery_task_id', 'image_processing_jobs', ['celery_task_id'])

    # 7. Observations
    op.create_table(
        'health_observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('mission_id', sa.String(length=36), sa.ForeignKey('drone_missions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('observation_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('affected_polygon', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('mean_ndvi', sa.Float(), nullable=True),
        sa.Column('mean_ndre', sa.Float(), nullable=True),
        sa.Column('mean_canopy_temp_c', sa.Float(), nullable=True),
        sa.Column('overall_health_score', sa.Float(), nullable=False, default=1.0),
        sa.Column('trend', sa.String(length=50), nullable=False, default='stable'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_health_observations_farm_id', 'health_observations', ['farm_id'])
    op.create_index('ix_health_observations_observation_date', 'health_observations', ['observation_date'])

    op.create_table(
        'disease_observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('health_observation_id', sa.String(length=36), sa.ForeignKey('health_observations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('disease_name', sa.String(length=150), nullable=False),
        sa.Column('pathogen_type', sa.String(length=50), nullable=False, default='fungal'),
        sa.Column('severity_level', sa.String(length=50), nullable=False, default='low'),
        sa.Column('confidence_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('bounding_box', sa.JSON(), nullable=True),
        sa.Column('image_url', sa.String(length=512), nullable=True),
        sa.Column('observation_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_disease_observations_farm_id', 'disease_observations', ['farm_id'])
    op.create_index('ix_disease_observations_disease_name', 'disease_observations', ['disease_name'])
    op.create_index('ix_disease_observations_observation_date', 'disease_observations', ['observation_date'])

    op.create_table(
        'pest_observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('health_observation_id', sa.String(length=36), sa.ForeignKey('health_observations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('pest_name', sa.String(length=150), nullable=False),
        sa.Column('infestation_level', sa.String(length=50), nullable=False, default='low'),
        sa.Column('affected_area_percentage', sa.Float(), nullable=False, default=0.0),
        sa.Column('confidence_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('observation_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_pest_observations_farm_id', 'pest_observations', ['farm_id'])
    op.create_index('ix_pest_observations_pest_name', 'pest_observations', ['pest_name'])

    op.create_table(
        'water_stress_observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('health_observation_id', sa.String(length=36), sa.ForeignKey('health_observations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('cwsi_index', sa.Float(), nullable=False),
        sa.Column('canopy_air_temp_diff_c', sa.Float(), nullable=False),
        sa.Column('stress_category', sa.String(length=50), nullable=False, default='none'),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('observation_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_water_stress_observations_farm_id', 'water_stress_observations', ['farm_id'])

    op.create_table(
        'weather_observations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('observation_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('temperature_c', sa.Float(), nullable=False),
        sa.Column('relative_humidity_percent', sa.Float(), nullable=False),
        sa.Column('wind_speed_mps', sa.Float(), nullable=False, default=0.0),
        sa.Column('wind_direction_deg', sa.Float(), nullable=False, default=0.0),
        sa.Column('rainfall_mm', sa.Float(), nullable=False, default=0.0),
        sa.Column('solar_radiation_w_m2', sa.Float(), nullable=True),
        sa.Column('leaf_wetness_hours', sa.Float(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=False, default='on_farm_station'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_weather_observations_farm_id', 'weather_observations', ['farm_id'])
    op.create_index('ix_weather_observations_observation_time', 'weather_observations', ['observation_time'])

    # 8. Intelligence & Advisory
    op.create_table(
        'risk_assessments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('assessment_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('target_pathogen_or_pest', sa.String(length=150), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(length=50), nullable=False),
        sa.Column('driving_factors', sa.JSON(), nullable=True),
        sa.Column('forecast_window_days', sa.Integer(), nullable=False, default=7),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_risk_assessments_farm_id', 'risk_assessments', ['farm_id'])
    op.create_index('ix_risk_assessments_assessment_date', 'risk_assessments', ['assessment_date'])

    op.create_table(
        'disease_events',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_name', sa.String(length=150), nullable=False),
        sa.Column('pathogen_or_pest', sa.String(length=150), nullable=False),
        sa.Column('outbreak_status', sa.String(length=50), nullable=False, default='suspected'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('epicenter', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=False),
        sa.Column('affected_boundary', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('estimated_damage_percentage', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_disease_events_farm_id', 'disease_events', ['farm_id'])
    op.create_index('ix_disease_events_pathogen', 'disease_events', ['pathogen_or_pest'])
    op.create_index('ix_disease_events_start_date', 'disease_events', ['start_date'])

    op.create_table(
        'spread_risks',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('source_disease_event_id', sa.String(length=36), sa.ForeignKey('disease_events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('spread_probability', sa.Float(), nullable=False),
        sa.Column('estimated_arrival_days', sa.Integer(), nullable=True),
        sa.Column('risk_corridor', Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), nullable=True),
        sa.Column('wind_vector_influence', sa.Float(), nullable=True),
        sa.Column('proximity_meters', sa.Float(), nullable=False),
        sa.Column('calculation_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_spread_risks_source_farm', 'spread_risks', ['source_farm_id'])
    op.create_index('ix_spread_risks_target_farm', 'spread_risks', ['target_farm_id'])

    op.create_table(
        'recommendations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('disease_event_id', sa.String(length=36), sa.ForeignKey('disease_events.id', ondelete='SET NULL'), nullable=True),
        sa.Column('recommendation_type', sa.String(length=50), nullable=False, default='cultural_ipm'),
        sa.Column('priority', sa.String(length=50), nullable=False, default='medium'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('action_items', sa.JSON(), nullable=False),
        sa.Column('dosage_or_rate', sa.String(length=100), nullable=True),
        sa.Column('application_window_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('application_window_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_recommendations_farm_id', 'recommendations', ['farm_id'])

    op.create_table(
        'expert_validations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('health_observation_id', sa.String(length=36), sa.ForeignKey('health_observations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('disease_observation_id', sa.String(length=36), sa.ForeignKey('disease_observations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('disease_event_id', sa.String(length=36), sa.ForeignKey('disease_events.id', ondelete='CASCADE'), nullable=True),
        sa.Column('expert_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('validation_status', sa.String(length=50), nullable=False, default='confirmed'),
        sa.Column('revised_diagnosis', sa.String(length=150), nullable=True),
        sa.Column('confidence_rating', sa.Integer(), nullable=False, default=5),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('ground_truth_image_url', sa.String(length=512), nullable=True),
        sa.Column('validated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_expert_validations_expert_user', 'expert_validations', ['expert_user_id'])
    op.create_index('ix_expert_validations_validated_at', 'expert_validations', ['validated_at'])

    # 9. Alerts, Notifications & Audit
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('farm_id', sa.String(length=36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('zone_id', sa.String(length=36), sa.ForeignKey('farm_zones.id', ondelete='SET NULL'), nullable=True),
        sa.Column('alert_type', sa.String(length=50), nullable=False, default='disease_detected'),
        sa.Column('severity', sa.String(length=50), nullable=False, default='warning'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326, spatial_index=True), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, default=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_alerts_farm_id', 'alerts', ['farm_id'])
    op.create_index('ix_alerts_is_resolved', 'alerts', ['is_resolved'])

    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_id', sa.String(length=36), sa.ForeignKey('alerts.id', ondelete='CASCADE'), nullable=True),
        sa.Column('channel', sa.String(length=50), nullable=False, default='in_app'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_status', sa.String(length=50), nullable=False, default='queued'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=36), nullable=False),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('alerts')
    op.drop_table('expert_validations')
    op.drop_table('recommendations')
    op.drop_table('spread_risks')
    op.drop_table('disease_events')
    op.drop_table('risk_assessments')
    op.drop_table('weather_observations')
    op.drop_table('water_stress_observations')
    op.drop_table('pest_observations')
    op.drop_table('disease_observations')
    op.drop_table('health_observations')
    op.drop_table('image_processing_jobs')
    op.drop_table('drone_images')
    op.drop_table('drone_missions')
    op.drop_table('drones')
    op.drop_table('farm_zones')
    op.drop_table('crop_cycles')
    op.drop_table('crops')
    op.drop_table('farm_members')
    op.drop_table('farms')
    op.drop_table('users')
    op.drop_table('roles')
