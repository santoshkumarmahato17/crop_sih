import io
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from PIL import Image
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
    """Service orchestrating AI vision inference, domain observation persistence, and query retrieval."""

    def __init__(self):
        self.image_repo = drone_image_repo
        self.mission_repo = drone_mission_repo
        self.farm_repo = farm_repo
        self.analysis_cache: Dict[str, CropHealthAnalysisResponse] = {}

    def get_analysis_by_id(self, analysis_id: str) -> Optional[CropHealthAnalysisResponse]:
        return self.analysis_cache.get(analysis_id)

    def get_analysis_regions(self, analysis_id: str) -> Dict[str, Any]:
        res = self.analysis_cache.get(analysis_id)
        patches = res.detected_patches if res else []
        return {
            "analysis_id": analysis_id,
            "total_regions": len(patches),
            "regions": patches,
        }

    def get_analysis_region_detail(self, analysis_id: str, region_id: str) -> Optional[Dict[str, Any]]:
        res = self.analysis_cache.get(analysis_id)
        if not res:
            return None
        for r in res.detected_patches:
            if r.get("region_id") == region_id:
                return r
        return None

    def get_analysis_risk(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        res = self.analysis_cache.get(analysis_id)
        return res.risk_detail.model_dump() if (res and res.risk_detail) else None

    def get_analysis_recommendations(self, analysis_id: str) -> List[Dict[str, Any]]:
        res = self.analysis_cache.get(analysis_id)
        return res.recommendations if res else []

    def get_analysis_resources(self, analysis_id: str) -> Dict[str, Any]:
        res = self.analysis_cache.get(analysis_id)
        if not res:
            return {}
        return {
            "video_resource": res.video_resource.model_dump() if res.video_resource else None,
            "wiki_resource": res.wiki_resource,
        }

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
        patch_roi: Optional[str] = None,
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

        # 2. Image Quality Analysis Gating (Golden Rule 1)
        pil_image = None
        try:
            with Image.open(io.BytesIO(raw_image_bytes)) as p_img:
                pil_image = p_img.convert("RGB")
        except Exception as img_err:
            logger.warning(f"Could not open image bytes via PIL: {img_err}")

        quality_data = None
        if pil_image:
            from ai.pipelines.image_quality import ImageQualityAnalyzer
            quality_data = ImageQualityAnalyzer.evaluate_pil_image(pil_image)

            # If image quality is severely degraded, gate diagnosis without fake results
            if not quality_data.get("is_usable", True):
                analysis_id = str(uuid.uuid4())
                unusable_resp = CropHealthAnalysisResponse(
                    id=analysis_id,
                    analysis_id=analysis_id,
                    image_quality=quality_data,
                    crop="Unknown",
                    crop_confidence=0.0,
                    crop_status="UNKNOWN",
                    crop_origin="MODEL_IDENTIFIED",
                    condition="Unable to determine reliably",
                    condition_category="Unknown / needs expert review",
                    specific_class="unusable_image_quality",
                    confidence=0.0,
                    severity="unknown",
                    severity_percentage=0.0,
                    needs_expert_review=True,
                    health_score=0.50,
                    vegetation_stress_score=0.50,
                    anomaly_score=0.50,
                    disease_probability=0.0,
                    pest_probability=0.0,
                    detected_patches=[],
                    detected_regions=[],
                    localization_available=False,
                    localization_message="Precise foliar localization unavailable due to insufficient image quality.",
                    recommendations=[
                        {
                            "action_type": "Image Quality Warning",
                            "title": "Clearer Image Required",
                            "detail": quality_data.get("warning_message") or "Image is blurred or poorly lit. Please upload a clear photo of the plant leaf.",
                            "source": "AGRI SHIELD Vision Quality Gate",
                        }
                    ],
                    model_name="AgriShield-QualityGate-v2.0",
                    model_version="2.1.0",
                    inference_timestamp=datetime.now(timezone.utc),
                    prediction_metadata={
                        "image_quality": quality_data,
                        "status": "UNUSABLE",
                        "detected_crop": "Unknown",
                        "detected_condition": "Unable to determine reliably",
                        "top_candidates": [],
                    },
                )
                self.analysis_cache[analysis_id] = unusable_resp
                return unusable_resp

        # 3. Invoke Active AI Model
        model: CropHealthModel = get_crop_health_model()
        prediction: CropHealthPrediction = await model.predict(
            rgb_image_bytes=raw_image_bytes,
            multispectral_bytes=multispectral_bytes,
            thermal_bytes=thermal_bytes,
            metadata={
                "farm_id": farm_id,
                "zone_id": zone_id,
                "mission_id": mission_id,
                "patch_roi": patch_roi,
            },
        )

        # 4. Extract Real Diagnostic Telemetry & Meta
        p_meta = prediction.prediction_metadata or {}
        detected_crop = p_meta.get("detected_crop", "Crop Leaf")
        detected_condition = p_meta.get("detected_condition", "Canopy Foliage")
        pathogen_type_str = p_meta.get("pathogen_type", "None (Healthy)")
        scientific_name = p_meta.get("scientific_name", "")
        specific_class = p_meta.get("specific_class", detected_condition.lower().replace(" ", "_"))

        # Determine true biological health
        is_healthy = "healthy" in pathogen_type_str.lower() or "healthy" in detected_condition.lower()

        # 5. Real Foliar & Lesion Segmentation (Golden Rule 2 & 3)
        from ai.pipelines.segmentation_engine import SegmentationEngine
        from backend.app.services.severity_engine import SeverityEngine
        from backend.app.services.knowledge_service import KnowledgeService

        seg_res = {}
        if pil_image:
            seg_res = SegmentationEngine.segment_foliar_image(
                pil_image,
                condition_name=detected_condition,
                is_healthy=is_healthy,
            )

        detected_patches = seg_res.get("regions", p_meta.get("detected_patches", []))
        affected_area_pct = seg_res.get("affected_area_pct", 0.0)
        localization_available = seg_res.get("localization_available", len(detected_patches) > 0)
        loc_msg = seg_res.get("localization_message")

        # 6. Decoupled Severity & Risk Evaluation (Golden Rule 6 & 9)
        severity_eval = SeverityEngine.evaluate_severity(
            affected_area_pct=affected_area_pct,
            lesion_count=len(detected_patches),
            is_healthy=is_healthy,
            quality_score=quality_data.get("score", 1.0) if quality_data else 1.0,
        )

        # Check if contextual data is present
        has_context = bool(p_meta.get("weather") or p_meta.get("crop_stage"))
        if not has_context:
            risk_eval = {
                "level": "LIMITED",
                "score": None,
                "confidence": 0.35,
                "status": "LIMITED",
                "summary": "Risk assessment limited: Insufficient contextual data (ambient weather telemetry and phenological stage are absent).",
                "factors": [],
            }
        else:
            risk_eval = {
                "level": severity_eval["level"],
                "score": severity_eval["score"],
                "confidence": 0.75,
                "status": "CALCULATED",
                "summary": f"{severity_eval['level']} risk calculated with environmental factors.",
                "factors": [{"name": "Observed Damage", "contribution": 0.5}],
            }

        # 7. Authoritative IPM Recommendations & Verified Videos
        recs = KnowledgeService.get_curated_ipm_recommendations(
            condition_key=specific_class,
            confidence=prediction.confidence,
            needs_expert_review=(prediction.confidence < 0.65),
        )
        resources = KnowledgeService.get_educational_resources(
            condition_key=specific_class,
            is_healthy=is_healthy,
        )

        # 8. Persist Observation in PostGIS
        now = datetime.now(timezone.utc)
        health_obs_id = str(uuid.uuid4())
        trend = HealthTrend.IMPROVING if prediction.health_score >= 0.75 else (
            HealthTrend.STABLE if prediction.health_score >= 0.50 else HealthTrend.DETERIORATING
        )

        if not farm_id:
            farms = await self.farm_repo.get_multi(db, limit=1)
            farm_id = farms[0].id if farms else "farm-default"

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

        disease_obs_id = None
        if not is_healthy and prediction.disease_probability >= 0.30:
            disease_obs_id = str(uuid.uuid4())
            disease_obs = DiseaseObservation(
                id=disease_obs_id,
                health_observation_id=health_obs_id,
                farm_id=farm_id,
                zone_id=zone_id,
                disease_name=detected_condition,
                pathogen_type=PathogenType.FUNGAL if "fung" in pathogen_type_str.lower() else PathogenType.BACTERIAL,
                severity_level=SeverityLevel.HIGH if severity_eval["level"] in ("HIGH", "CRITICAL") else SeverityLevel.MODERATE,
                confidence_score=prediction.confidence,
                location=target_location,
                observation_date=now,
            )
            db.add(disease_obs)

        try:
            await db.commit()
        except Exception as db_err:
            await db.rollback()
            logger.warning(f"Could not commit observation to DB: {db_err}")

        # Assemble Comprehensive Response
        analysis_id = str(uuid.uuid4())
        cond_category = "Healthy" if is_healthy else ("Pest" if "pest" in pathogen_type_str.lower() else "Disease")
        response = CropHealthAnalysisResponse(
            id=analysis_id,
            analysis_id=analysis_id,
            image_quality=quality_data,
            crop=detected_crop,
            crop_confidence=round(prediction.confidence, 2),
            crop_status="CONFIDENT",
            crop_origin="MODEL_IDENTIFIED",
            condition=detected_condition,
            condition_category=cond_category,
            specific_class=specific_class,
            confidence=round(prediction.confidence, 4),
            causal_agent={
                "scientific_name": scientific_name or "None",
                "pathogen_type": pathogen_type_str,
                "description": p_meta.get("description", ""),
            },
            symptoms=[p.get("label", "Lesion") for p in detected_patches] if detected_patches else [],
            severity=severity_eval["level"].lower(),
            severity_percentage=affected_area_pct,
            severity_detail=severity_eval,
            risk_detail=risk_eval,
            detected_patches=detected_patches,
            detected_regions=detected_patches,
            localization_available=localization_available,
            localization_message=loc_msg,
            recommendations=recs,
            video_resource=resources.get("video_resource"),
            wiki_resource=resources.get("wiki_resource"),
            health_score=prediction.health_score,
            vegetation_stress_score=prediction.vegetation_stress_score,
            anomaly_score=prediction.anomaly_score,
            disease_probability=prediction.disease_probability,
            pest_probability=prediction.pest_probability,
            needs_expert_review=(prediction.confidence < 0.70),
            model_name=prediction.model_name,
            model_version=prediction.model_version,
            inference_timestamp=now,
            prediction_metadata={
                **p_meta,
                "image_quality": quality_data,
                "severity_eval": severity_eval,
                "risk_eval": risk_eval,
                "resources": resources,
            },
            health_observation_id=health_obs_id,
            disease_observation_id=disease_obs_id,
        )

        self.analysis_cache[analysis_id] = response
        return response


crop_health_analysis_service = CropHealthAnalysisService()
