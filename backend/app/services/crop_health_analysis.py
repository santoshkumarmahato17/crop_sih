import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from geoalchemy2.shape import to_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import CropHealthModel, CropHealthPrediction
from app.ai.factory import get_crop_health_model
from app.core.logging import logger
from app.core.storage import storage_service
from app.models.auth import User
from app.models.drone import DroneImage
from app.models.farm import Farm, FarmZone
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
)
from app.repositories.drone import drone_mission_repo
from app.repositories.farm import farm_repo
from app.repositories.image import drone_image_repo
from app.schemas.ai import CropHealthAnalysisResponse
from app.spatial.geometry import shapely_to_wkt_element


class CropHealthAnalysisService:
    """Service orchestrating AI vision inference and domain observation persistence."""

    def __init__(self):
        self.image_repo = drone_image_repo
        self.mission_repo = drone_mission_repo
        self.farm_repo = farm_repo

    async def analyze_image(
        self,
        db: AsyncSession,
        image_id: Optional[str] = None,
        raw_image_bytes: Optional[bytes] = None,
        multispectral_bytes: Optional[bytes] = None,
        thermal_bytes: Optional[bytes] = None,
        farm_id: Optional[str] = None,
        zone_id: Optional[str] = None,
        mission_id: Optional[str] = None,
        current_user: Optional[User] = None,
    ) -> CropHealthAnalysisResponse:
        """
        Executes crop health inference using the active CropHealthModel
        and persists structured observations in PostGIS.
        """
        # 1. Resolve Image Bytes and Associated Farm/Zone/Mission Context
        target_location = None
        drone_image: Optional[DroneImage] = None

        if image_id:
            drone_image = await self.image_repo.get_by_id_with_relations(db, image_id)
            if not drone_image:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Drone Image '{image_id}' not found.",
                )
            raw_image_bytes = storage_service.get_file_bytes(drone_image.file_path)
            farm_id = drone_image.farm_id or farm_id
            zone_id = drone_image.zone_id or zone_id
            mission_id = drone_image.mission_id or mission_id
            if drone_image.location:
                target_location = drone_image.location

        if not raw_image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No image payload provided for crop health analysis.",
            )

        # Fallback coordinates if no image location available
        if target_location is None:
            # Centroid around farm or default coordinate (SRID 4326)
            pt = Point(73.8525, 18.5225)
            target_location = shapely_to_wkt_element(pt, srid=4326)

        # 2. Invoke Active AI Model
        model: CropHealthModel = get_crop_health_model()
        prediction: CropHealthPrediction = await model.predict(
            rgb_image_bytes=raw_image_bytes,
            multispectral_bytes=multispectral_bytes,
            thermal_bytes=thermal_bytes,
            metadata={"farm_id": farm_id, "zone_id": zone_id, "mission_id": mission_id},
        )

        # 3. Determine Observation Trend
        if prediction.health_score >= 0.75:
            trend = HealthTrend.IMPROVING
        elif prediction.health_score >= 0.50:
            trend = HealthTrend.STABLE
        else:
            trend = HealthTrend.DETERIORATING

        # 4. Create and Persist HealthObservation in PostGIS
        now = datetime.now(timezone.utc)
        health_obs_id = str(uuid.uuid4())
        
        # Ensure farm_id exists, otherwise fallback to first available farm or dummy
        if not farm_id:
            farms = await self.farm_repo.list_all(db, limit=1)
            if farms:
                farm_id = farms[0].id
            else:
                farm_id = "farm-default"

        health_obs = HealthObservation(
            id=health_obs_id,
            farm_id=farm_id,
            zone_id=zone_id,
            mission_id=mission_id,
            observation_date=now,
            location=target_location,
            overall_health_score=prediction.health_score,
            trend=trend,
        )
        db.add(health_obs)

        # 5. Connect DiseaseObservation if elevated pathology probability
        disease_obs_id = None
        if prediction.disease_probability >= 0.30:
            disease_obs_id = str(uuid.uuid4())
            disease_severity = (
                SeverityLevel.HIGH
                if prediction.disease_probability >= 0.65
                else SeverityLevel.MODERATE
            )
            disease_obs = DiseaseObservation(
                id=disease_obs_id,
                health_observation_id=health_obs_id,
                farm_id=farm_id,
                zone_id=zone_id,
                disease_name="Suspected Chlorosis / Foliar Pathology (Prototype Indicator)",
                pathogen_type=PathogenType.FUNGAL,
                severity_level=disease_severity,
                confidence_score=prediction.confidence,
                location=target_location,
                observation_date=now,
            )
            db.add(disease_obs)

        # 6. Connect PestObservation if elevated defoliation probability
        pest_obs_id = None
        if prediction.pest_probability >= 0.35:
            pest_obs_id = str(uuid.uuid4())
            pest_obs = PestObservation(
                id=pest_obs_id,
                health_observation_id=health_obs_id,
                farm_id=farm_id,
                zone_id=zone_id,
                pest_name="Canopy Foliar Defoliation Indicator (Prototype)",
                infestation_level=InfestationLevel.MODERATE,
                affected_area_percentage=round(prediction.anomaly_score * 100.0, 1),
                confidence_score=prediction.confidence,
                location=target_location,
                observation_date=now,
            )
            db.add(pest_obs)

        # 7. Connect WaterStressObservation if elevated stress
        water_stress_obs_id = None
        if prediction.vegetation_stress_score >= 0.30:
            water_stress_obs_id = str(uuid.uuid4())
            stress_cat = (
                WaterStressCategory.MODERATE
                if prediction.vegetation_stress_score >= 0.60
                else WaterStressCategory.MILD
            )
            water_obs = WaterStressObservation(
                id=water_stress_obs_id,
                health_observation_id=health_obs_id,
                farm_id=farm_id,
                zone_id=zone_id,
                cwsi_index=prediction.vegetation_stress_score,
                canopy_air_temp_diff_c=round(prediction.vegetation_stress_score * 4.2, 2),
                stress_category=stress_cat,
                observation_date=now,
            )
            db.add(water_obs)

        await db.commit()
        logger.info(
            f"Successfully recorded CropHealthAnalysis observation ({health_obs_id}) "
            f"with health score {prediction.health_score}."
        )

        return CropHealthAnalysisResponse(
            health_score=prediction.health_score,
            vegetation_stress_score=prediction.vegetation_stress_score,
            anomaly_score=prediction.anomaly_score,
            disease_probability=prediction.disease_probability,
            pest_probability=prediction.pest_probability,
            confidence=prediction.confidence,
            model_name=prediction.model_name,
            model_version=prediction.model_version,
            inference_timestamp=prediction.inference_timestamp,
            prediction_metadata=prediction.prediction_metadata,
            health_observation_id=health_obs_id,
            disease_observation_id=disease_obs_id,
            pest_observation_id=pest_obs_id,
            water_stress_observation_id=water_stress_obs_id,
            prototype_disclaimer="DEMO / PROTOTYPE: Non-diagnostic statistical model used for system scaffolding.",
        )


crop_health_analysis_service = CropHealthAnalysisService()
