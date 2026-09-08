-- AGRI SHIELD Supabase Complete Database Schema DDL
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table: advisory_templates
CREATE TABLE advisory_templates (
	id VARCHAR(36) NOT NULL, 
	advisory_type advisorytype NOT NULL, 
	priority advisorypriority NOT NULL, 
	crop_filter VARCHAR(100), 
	growth_stage_filter VARCHAR(100), 
	language VARCHAR(10) NOT NULL, 
	title_template VARCHAR(255) NOT NULL, 
	summary_template TEXT NOT NULL, 
	why_this_matters_template TEXT NOT NULL, 
	what_to_do_now JSON NOT NULL, 
	what_to_monitor JSON NOT NULL, 
	what_to_avoid JSON NOT NULL, 
	when_to_seek_expert_help TEXT NOT NULL, 
	safety_warnings JSON NOT NULL, 
	version VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

-- Table: audit_logs
CREATE TABLE audit_logs (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36), 
	user_email VARCHAR(255), 
	event_type auditeventtype NOT NULL, 
	ip_address VARCHAR(50), 
	user_agent VARCHAR(500), 
	details JSON, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

-- Table: crops
CREATE TABLE crops (
	id VARCHAR(36) NOT NULL, 
	common_name VARCHAR(100) NOT NULL, 
	scientific_name VARCHAR(150) NOT NULL, 
	variety VARCHAR(100), 
	optimal_temp_min_c FLOAT, 
	optimal_temp_max_c FLOAT, 
	optimal_soil_moisture_min FLOAT, 
	optimal_soil_moisture_max FLOAT, 
	typical_growing_days INTEGER NOT NULL, 
	growth_stages JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

-- Table: drones
CREATE TABLE drones (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	serial_number VARCHAR(100) NOT NULL, 
	manufacturer VARCHAR(100) NOT NULL, 
	model_name VARCHAR(100) NOT NULL, 
	camera_type VARCHAR(100) NOT NULL, 
	sensor_types JSON, 
	sensor_capabilities JSON, 
	battery_percentage FLOAT NOT NULL, 
	battery_cycle_count INTEGER NOT NULL, 
	operational_status VARCHAR(50) NOT NULL, 
	status dronestatus NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

-- Table: monitoring_policy_configs
CREATE TABLE monitoring_policy_configs (
	id VARCHAR(36) NOT NULL, 
	critical_hours INTEGER NOT NULL, 
	high_hours INTEGER NOT NULL, 
	medium_days INTEGER NOT NULL, 
	low_days INTEGER NOT NULL, 
	enable_auto_escalation BOOLEAN NOT NULL, 
	buffer_zone_expansion BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

-- Table: roles
CREATE TABLE roles (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	description VARCHAR(255), 
	permissions JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id)
);

-- Table: users
CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(150) NOT NULL, 
	phone_number VARCHAR(30), 
	address VARCHAR(500), 
	role roletype NOT NULL, 
	organization_name VARCHAR(200), 
	department VARCHAR(150), 
	assigned_region VARCHAR(150), 
	is_active BOOLEAN NOT NULL, 
	is_verified BOOLEAN NOT NULL, 
	is_superuser BOOLEAN NOT NULL, 
	last_login_at TIMESTAMP WITH TIME ZONE, 
	preferred_language VARCHAR(10) NOT NULL, 
	role_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id) ON DELETE SET NULL
);

-- Table: farms
CREATE TABLE farms (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	description TEXT, 
	owner_id VARCHAR(36) NOT NULL, 
	boundary geometry(MULTIPOLYGON,4326) NOT NULL, 
	center_point geometry(POINT,4326), 
	total_area_hectares FLOAT NOT NULL, 
	elevation_meters FLOAT, 
	soil_type VARCHAR(100), 
	address VARCHAR(255), 
	city VARCHAR(100), 
	region VARCHAR(100), 
	country VARCHAR(100) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Table: crop_cycles
CREATE TABLE crop_cycles (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	crop_id VARCHAR(36) NOT NULL, 
	planting_date DATE NOT NULL, 
	expected_harvest_date DATE, 
	actual_harvest_date DATE, 
	status cropcyclestatus NOT NULL, 
	target_yield_tonnes_per_hectare FLOAT, 
	actual_yield_tonnes_per_hectare FLOAT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(crop_id) REFERENCES crops (id) ON DELETE RESTRICT
);

-- Table: drone_missions
CREATE TABLE drone_missions (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	drone_id VARCHAR(36), 
	operator_id VARCHAR(36), 
	flight_boundary geometry(POLYGON,4326) NOT NULL, 
	mission_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	start_time TIMESTAMP WITH TIME ZONE, 
	end_time TIMESTAMP WITH TIME ZONE, 
	altitude_meters FLOAT NOT NULL, 
	flight_speed_mps FLOAT NOT NULL, 
	overlap_percentage FLOAT NOT NULL, 
	coverage_percentage FLOAT NOT NULL, 
	priority VARCHAR(50) NOT NULL, 
	target_zones JSON, 
	weather_conditions JSON, 
	status missionstatus NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(drone_id) REFERENCES drones (id) ON DELETE SET NULL, 
	FOREIGN KEY(operator_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Table: farm_members
CREATE TABLE farm_members (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	role_in_farm memberrole NOT NULL, 
	permissions JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_farm_user_membership UNIQUE (farm_id, user_id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Table: weather_forecasts
CREATE TABLE weather_forecasts (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	location geometry(POINT,4326) NOT NULL, 
	forecast_time TIMESTAMP WITH TIME ZONE NOT NULL, 
	temperature_c FLOAT NOT NULL, 
	min_temperature_c FLOAT, 
	max_temperature_c FLOAT, 
	relative_humidity_percent FLOAT NOT NULL, 
	rainfall_probability_percent FLOAT NOT NULL, 
	expected_rainfall_mm FLOAT NOT NULL, 
	wind_speed_mps FLOAT NOT NULL, 
	wind_direction_deg FLOAT NOT NULL, 
	solar_radiation_w_m2 FLOAT, 
	cloud_cover_percent FLOAT, 
	source VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE
);

-- Table: weather_observations
CREATE TABLE weather_observations (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	location geometry(POINT,4326) NOT NULL, 
	observation_time TIMESTAMP WITH TIME ZONE NOT NULL, 
	temperature_c FLOAT NOT NULL, 
	min_temperature_c FLOAT, 
	max_temperature_c FLOAT, 
	relative_humidity_percent FLOAT NOT NULL, 
	wind_speed_mps FLOAT NOT NULL, 
	wind_direction_deg FLOAT NOT NULL, 
	rainfall_mm FLOAT NOT NULL, 
	rainfall_duration_hours FLOAT, 
	solar_radiation_w_m2 FLOAT, 
	cloud_cover_percent FLOAT, 
	soil_moisture_percent FLOAT, 
	leaf_wetness_hours FLOAT, 
	source VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE
);

-- Table: farm_zones
CREATE TABLE farm_zones (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	crop_cycle_id VARCHAR(36), 
	zone_code VARCHAR(20) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	boundary geometry(POLYGON,4326) NOT NULL, 
	area_hectares FLOAT NOT NULL, 
	soil_profile JSON, 
	irrigation_type VARCHAR(50), 
	monitoring_status VARCHAR(50) NOT NULL, 
	health_status VARCHAR(50) NOT NULL, 
	risk_status VARCHAR(50) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_farm_zone_code UNIQUE (farm_id, zone_code), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(crop_cycle_id) REFERENCES crop_cycles (id) ON DELETE SET NULL
);

-- Table: image_processing_jobs
CREATE TABLE image_processing_jobs (
	id VARCHAR(36) NOT NULL, 
	mission_id VARCHAR(36) NOT NULL, 
	job_type jobtype NOT NULL, 
	status jobstatus NOT NULL, 
	progress_percent FLOAT NOT NULL, 
	celery_task_id VARCHAR(100), 
	output_artifacts JSON, 
	error_message TEXT, 
	started_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(mission_id) REFERENCES drone_missions (id) ON DELETE CASCADE
);

-- Table: alerts
CREATE TABLE alerts (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	alert_type alerttype NOT NULL, 
	severity alertseverity NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	message TEXT NOT NULL, 
	location geometry(POINT,4326), 
	is_resolved BOOLEAN NOT NULL, 
	resolved_at TIMESTAMP WITH TIME ZONE, 
	resolved_by_user_id VARCHAR(36), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(resolved_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Table: diagnosis_analyses
CREATE TABLE diagnosis_analyses (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36) NOT NULL, 
	crop_id VARCHAR(36), 
	crop_type VARCHAR(100) NOT NULL, 
	growth_stage VARCHAR(100) NOT NULL, 
	plant_parts JSON NOT NULL, 
	severity symptomseverity NOT NULL, 
	distribution VARCHAR(100) NOT NULL, 
	symptom_start_date VARCHAR(100), 
	farmer_notes TEXT, 
	recent_pesticide_fungicide VARCHAR(200), 
	recent_fertilizer VARCHAR(200), 
	recent_irrigation VARCHAR(200), 
	recent_rainfall VARCHAR(200), 
	visible_insects VARCHAR(200), 
	recent_unusual_weather VARCHAR(200), 
	other_observations TEXT, 
	status diagnosisstatus NOT NULL, 
	ai_confidence FLOAT NOT NULL, 
	ai_model_name VARCHAR(100) NOT NULL, 
	ai_model_version VARCHAR(50) NOT NULL, 
	is_prototype BOOLEAN NOT NULL, 
	primary_condition VARCHAR(200) NOT NULL, 
	possible_conditions JSON NOT NULL, 
	reasoning_points JSON NOT NULL, 
	zone_status_snapshot JSON NOT NULL, 
	historical_comparison JSON NOT NULL, 
	neighboring_zone_analysis JSON NOT NULL, 
	recommendations JSON NOT NULL, 
	follow_up_monitoring JSON NOT NULL, 
	validation_status validationrequeststatus NOT NULL, 
	expert_user_id VARCHAR(36), 
	expert_notes TEXT, 
	revised_diagnosis VARCHAR(200), 
	validated_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE CASCADE, 
	FOREIGN KEY(crop_id) REFERENCES crops (id) ON DELETE SET NULL, 
	FOREIGN KEY(expert_user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Table: disease_events
CREATE TABLE disease_events (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	event_name VARCHAR(150) NOT NULL, 
	pathogen_or_pest VARCHAR(150) NOT NULL, 
	outbreak_status outbreakstatus NOT NULL, 
	start_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	resolved_date TIMESTAMP WITH TIME ZONE, 
	epicenter geometry(POINT,4326) NOT NULL, 
	affected_boundary geometry(POLYGON,4326), 
	estimated_damage_percentage FLOAT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: drone_images
CREATE TABLE drone_images (
	id VARCHAR(36) NOT NULL, 
	mission_id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36), 
	zone_id VARCHAR(36), 
	filename VARCHAR(255) NOT NULL, 
	file_type VARCHAR(100) NOT NULL, 
	file_path VARCHAR(512) NOT NULL, 
	sensor_type VARCHAR(50) NOT NULL, 
	image_type imagetype NOT NULL, 
	processing_status VARCHAR(50) NOT NULL, 
	capture_time TIMESTAMP WITH TIME ZONE NOT NULL, 
	location geometry(POINT,4326), 
	footprint geometry(POLYGON,4326), 
	altitude_agl_meters FLOAT NOT NULL, 
	camera_pitch FLOAT, 
	camera_roll FLOAT, 
	camera_yaw FLOAT, 
	resolution_cm_per_pixel FLOAT, 
	file_size_bytes BIGINT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(mission_id) REFERENCES drone_missions (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: drone_monitoring_recommendations
CREATE TABLE drone_monitoring_recommendations (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	target_area_description VARCHAR(255) NOT NULL, 
	targeted_zones JSON NOT NULL, 
	priority monitoringpriority NOT NULL, 
	reason TEXT NOT NULL, 
	recommended_time_window VARCHAR(100) NOT NULL, 
	previous_health_score FLOAT NOT NULL, 
	current_risk_score FLOAT NOT NULL, 
	hotspot_status hotspottrendstatus NOT NULL, 
	is_dispatched BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: expert_validation_requests
CREATE TABLE expert_validation_requests (
	id VARCHAR(36) NOT NULL, 
	case_number VARCHAR(20) NOT NULL, 
	analysis_id VARCHAR(36), 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	crop_id VARCHAR(36), 
	requested_by VARCHAR(36) NOT NULL, 
	assigned_expert_id VARCHAR(36), 
	priority validationpriority NOT NULL, 
	status validationrequeststatus NOT NULL, 
	reason TEXT NOT NULL, 
	suspected_condition VARCHAR(150) NOT NULL, 
	ai_confidence FLOAT NOT NULL, 
	crop_growth_stage VARCHAR(100), 
	symptoms JSON, 
	image_urls JSON, 
	weather_summary JSON, 
	hotspot_id VARCHAR(50), 
	drone_observation_id VARCHAR(36), 
	due_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(crop_id) REFERENCES crops (id) ON DELETE SET NULL, 
	FOREIGN KEY(requested_by) REFERENCES users (id) ON DELETE RESTRICT, 
	FOREIGN KEY(assigned_expert_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Table: health_observations
CREATE TABLE health_observations (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	mission_id VARCHAR(36), 
	observation_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	location geometry(POINT,4326) NOT NULL, 
	affected_polygon geometry(POLYGON,4326), 
	mean_ndvi FLOAT, 
	mean_ndre FLOAT, 
	mean_canopy_temp_c FLOAT, 
	overall_health_score FLOAT NOT NULL, 
	trend healthtrend NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(mission_id) REFERENCES drone_missions (id) ON DELETE SET NULL
);

-- Table: monitoring_tasks
CREATE TABLE monitoring_tasks (
	id VARCHAR(36) NOT NULL, 
	task_code VARCHAR(50) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	crop_id VARCHAR(36), 
	trigger_type monitoringtriggertype NOT NULL, 
	trigger_entity_id VARCHAR(100), 
	suspected_condition VARCHAR(150), 
	priority monitoringpriority NOT NULL, 
	monitoring_method monitoringmethod NOT NULL, 
	status monitoringtaskstatus NOT NULL, 
	scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	due_at TIMESTAMP WITH TIME ZONE, 
	started_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	target_zone_ids JSON, 
	instructions TEXT, 
	assigned_to VARCHAR(36), 
	created_by VARCHAR(36), 
	baseline_health_score FLOAT, 
	baseline_disease_risk FLOAT, 
	baseline_affected_area_ha FLOAT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(crop_id) REFERENCES crops (id) ON DELETE SET NULL, 
	FOREIGN KEY(assigned_to) REFERENCES users (id) ON DELETE SET NULL, 
	FOREIGN KEY(created_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Table: risk_assessments
CREATE TABLE risk_assessments (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	assessment_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	forecast_time TIMESTAMP WITH TIME ZONE, 
	risk_type VARCHAR(50) NOT NULL, 
	target_pathogen_or_pest VARCHAR(150) NOT NULL, 
	risk_score FLOAT NOT NULL, 
	score INTEGER, 
	risk_level risklevel NOT NULL, 
	confidence FLOAT NOT NULL, 
	risk_factors JSON, 
	driving_factors JSON, 
	explanation TEXT, 
	technical_explanation TEXT, 
	engine_version VARCHAR(50) NOT NULL, 
	weather_data_timestamp TIMESTAMP WITH TIME ZONE, 
	forecast_window_days INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: advisories
CREATE TABLE advisories (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	crop_id VARCHAR(36), 
	validation_request_id VARCHAR(36), 
	risk_assessment_id VARCHAR(36), 
	advisory_type advisorytype NOT NULL, 
	priority advisorypriority NOT NULL, 
	source advisorysource NOT NULL, 
	trust_level INTEGER NOT NULL, 
	condition_name VARCHAR(150) NOT NULL, 
	crop_name VARCHAR(100), 
	zone_name VARCHAR(100), 
	follow_up_date TIMESTAMP WITH TIME ZONE, 
	is_read BOOLEAN NOT NULL, 
	version VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(crop_id) REFERENCES crops (id) ON DELETE SET NULL, 
	FOREIGN KEY(validation_request_id) REFERENCES expert_validation_requests (id) ON DELETE SET NULL, 
	FOREIGN KEY(risk_assessment_id) REFERENCES risk_assessments (id) ON DELETE SET NULL
);

-- Table: diagnosis_images
CREATE TABLE diagnosis_images (
	id VARCHAR(36) NOT NULL, 
	analysis_id VARCHAR(36) NOT NULL, 
	image_url VARCHAR(512) NOT NULL, 
	original_filename VARCHAR(255) NOT NULL, 
	file_size_bytes INTEGER NOT NULL, 
	visual_abnormalities_detected BOOLEAN NOT NULL, 
	affected_regions JSON, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(analysis_id) REFERENCES diagnosis_analyses (id) ON DELETE CASCADE
);

-- Table: diagnosis_symptoms
CREATE TABLE diagnosis_symptoms (
	id VARCHAR(36) NOT NULL, 
	analysis_id VARCHAR(36) NOT NULL, 
	category VARCHAR(50) NOT NULL, 
	symptom_name VARCHAR(100) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(analysis_id) REFERENCES diagnosis_analyses (id) ON DELETE CASCADE
);

-- Table: disease_observations
CREATE TABLE disease_observations (
	id VARCHAR(36) NOT NULL, 
	health_observation_id VARCHAR(36), 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	disease_name VARCHAR(150) NOT NULL, 
	pathogen_type pathogentype NOT NULL, 
	severity_level severitylevel NOT NULL, 
	confidence_score FLOAT NOT NULL, 
	location geometry(POINT,4326) NOT NULL, 
	bounding_box JSON, 
	image_url VARCHAR(512), 
	observation_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(health_observation_id) REFERENCES health_observations (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: expert_validation_records
CREATE TABLE expert_validation_records (
	id VARCHAR(36) NOT NULL, 
	validation_request_id VARCHAR(36) NOT NULL, 
	expert_user_id VARCHAR(36) NOT NULL, 
	status validationrequeststatus NOT NULL, 
	confirmed_condition VARCHAR(150), 
	expert_notes TEXT, 
	farmer_guidance TEXT, 
	rejection_reason TEXT, 
	uncertain_recommendation TEXT, 
	validation_version VARCHAR(20) NOT NULL, 
	validated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(validation_request_id) REFERENCES expert_validation_requests (id) ON DELETE CASCADE, 
	FOREIGN KEY(expert_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

-- Table: lab_referrals
CREATE TABLE lab_referrals (
	id VARCHAR(36) NOT NULL, 
	referral_code VARCHAR(20) NOT NULL, 
	validation_request_id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	sample_type VARCHAR(100) NOT NULL, 
	suspected_condition VARCHAR(150) NOT NULL, 
	reason TEXT NOT NULL, 
	status labreferralstatus NOT NULL, 
	requested_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	result_summary TEXT, 
	result_date TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(validation_request_id) REFERENCES expert_validation_requests (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: monitoring_results
CREATE TABLE monitoring_results (
	id VARCHAR(36) NOT NULL, 
	monitoring_task_id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	observation_id VARCHAR(36), 
	health_score FLOAT NOT NULL, 
	disease_risk FLOAT NOT NULL, 
	pest_risk FLOAT NOT NULL, 
	water_stress FLOAT NOT NULL, 
	affected_area_ha FLOAT, 
	severity VARCHAR(50) NOT NULL, 
	trend monitoringtrend NOT NULL, 
	observed_symptoms JSON, 
	image_urls JSON, 
	notes TEXT, 
	location_geometry geometry(GEOMETRY,4326), 
	submitted_by VARCHAR(36), 
	observed_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(monitoring_task_id) REFERENCES monitoring_tasks (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(submitted_by) REFERENCES users (id) ON DELETE SET NULL
);

-- Table: notifications
CREATE TABLE notifications (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	alert_id VARCHAR(36), 
	channel notificationchannel NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	content TEXT NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	read_at TIMESTAMP WITH TIME ZONE, 
	sent_status sentstatus NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(alert_id) REFERENCES alerts (id) ON DELETE CASCADE
);

-- Table: pest_observations
CREATE TABLE pest_observations (
	id VARCHAR(36) NOT NULL, 
	health_observation_id VARCHAR(36), 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	pest_name VARCHAR(150) NOT NULL, 
	infestation_level infestationlevel NOT NULL, 
	affected_area_percentage FLOAT NOT NULL, 
	confidence_score FLOAT NOT NULL, 
	location geometry(POINT,4326) NOT NULL, 
	observation_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(health_observation_id) REFERENCES health_observations (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: recommendations
CREATE TABLE recommendations (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	disease_event_id VARCHAR(36), 
	recommendation_type recommendationtype NOT NULL, 
	priority recommendationpriority NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	action_items JSON NOT NULL, 
	dosage_or_rate VARCHAR(100), 
	application_window_start TIMESTAMP WITH TIME ZONE, 
	application_window_end TIMESTAMP WITH TIME ZONE, 
	status recommendationstatus NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL, 
	FOREIGN KEY(disease_event_id) REFERENCES disease_events (id) ON DELETE SET NULL
);

-- Table: spread_risks
CREATE TABLE spread_risks (
	id VARCHAR(36) NOT NULL, 
	source_disease_event_id VARCHAR(36) NOT NULL, 
	source_farm_id VARCHAR(36) NOT NULL, 
	target_farm_id VARCHAR(36) NOT NULL, 
	spread_probability FLOAT NOT NULL, 
	estimated_arrival_days INTEGER, 
	risk_corridor geometry(POLYGON,4326), 
	wind_vector_influence FLOAT, 
	proximity_meters FLOAT NOT NULL, 
	calculation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_disease_event_id) REFERENCES disease_events (id) ON DELETE CASCADE, 
	FOREIGN KEY(source_farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(target_farm_id) REFERENCES farms (id) ON DELETE CASCADE
);

-- Table: water_stress_observations
CREATE TABLE water_stress_observations (
	id VARCHAR(36) NOT NULL, 
	health_observation_id VARCHAR(36), 
	farm_id VARCHAR(36) NOT NULL, 
	zone_id VARCHAR(36), 
	cwsi_index FLOAT NOT NULL, 
	canopy_air_temp_diff_c FLOAT NOT NULL, 
	stress_category waterstresscategory NOT NULL, 
	location geometry(POINT,4326) NOT NULL, 
	observation_date TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(health_observation_id) REFERENCES health_observations (id) ON DELETE CASCADE, 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE, 
	FOREIGN KEY(zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- Table: advisory_translations
CREATE TABLE advisory_translations (
	id VARCHAR(36) NOT NULL, 
	advisory_id VARCHAR(36) NOT NULL, 
	language VARCHAR(10) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	summary TEXT NOT NULL, 
	why_this_matters TEXT NOT NULL, 
	what_to_do_now JSON NOT NULL, 
	what_to_monitor JSON NOT NULL, 
	what_to_avoid JSON NOT NULL, 
	when_to_seek_expert_help TEXT NOT NULL, 
	safety_warnings JSON NOT NULL, 
	technical_breakdown TEXT, 
	audio_text TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(advisory_id) REFERENCES advisories (id) ON DELETE CASCADE
);

-- Table: expert_validations
CREATE TABLE expert_validations (
	id VARCHAR(36) NOT NULL, 
	health_observation_id VARCHAR(36), 
	disease_observation_id VARCHAR(36), 
	disease_event_id VARCHAR(36), 
	expert_user_id VARCHAR(36) NOT NULL, 
	validation_status validationstatus NOT NULL, 
	revised_diagnosis VARCHAR(150), 
	confidence_rating INTEGER NOT NULL, 
	notes TEXT, 
	ground_truth_image_url VARCHAR(512), 
	validated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(health_observation_id) REFERENCES health_observations (id) ON DELETE CASCADE, 
	FOREIGN KEY(disease_observation_id) REFERENCES disease_observations (id) ON DELETE CASCADE, 
	FOREIGN KEY(disease_event_id) REFERENCES disease_events (id) ON DELETE CASCADE, 
	FOREIGN KEY(expert_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

-- Table: monitoring_comparisons
CREATE TABLE monitoring_comparisons (
	id VARCHAR(36) NOT NULL, 
	monitoring_result_id VARCHAR(36) NOT NULL, 
	previous_observation_id VARCHAR(100), 
	current_observation_id VARCHAR(100), 
	previous_health_score FLOAT NOT NULL, 
	current_health_score FLOAT NOT NULL, 
	health_change FLOAT NOT NULL, 
	previous_disease_risk FLOAT NOT NULL, 
	current_disease_risk FLOAT NOT NULL, 
	disease_risk_change FLOAT NOT NULL, 
	previous_affected_area_ha FLOAT NOT NULL, 
	current_affected_area_ha FLOAT NOT NULL, 
	affected_area_change_ha FLOAT NOT NULL, 
	trend monitoringtrend NOT NULL, 
	hotspot_status hotspottrendstatus NOT NULL, 
	is_escalated BOOLEAN NOT NULL, 
	escalation_reason TEXT, 
	recommended_action TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(monitoring_result_id) REFERENCES monitoring_results (id) ON DELETE CASCADE
);
