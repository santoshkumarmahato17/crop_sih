"""
KISAN SATHI — Follow-Up Monitoring End-to-End Regression Test Suite.
Verifies the complete closed-loop data flow:
AI Disease Analysis -> Database -> Automatic Follow-Up Task -> API Retrieval -> Task Start -> Image Result Submission -> Before vs After Comparison -> Task Completion -> Statistics Calculation -> Persistence.
"""

import pytest
import uuid
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.main import app
from app.models.auth import User, RoleType
from app.models.farm import Farm, FarmZone
from app.models.monitoring import (
    MonitoringTask,
    MonitoringResult,
    MonitoringComparison,
    MonitoringTaskStatus,
    MonitoringPriority,
)
from app.services.diagnosis_service import DiagnosisService
from app.schemas.diagnosis import SymptomAnalysisRequest, ImageItem
from app.db.session import AsyncSessionLocal


from app.core.security import get_password_hash

@pytest.mark.asyncio
async def test_followup_end_to_end_lifecycle():
    async with AsyncSessionLocal() as db_session:
        # 1. Setup Active Test Farmer & Farm
        unique_email = f"farmer_followup_{uuid.uuid4().hex[:6]}@kisansathi.internal"
        farmer = User(
            id=str(uuid.uuid4()),
            email=unique_email,
            full_name="Rajesh Followup Farmer",
            hashed_password=get_password_hash("SecretHashedPassword123!"),
            role=RoleType.FARMER,
            is_active=True,
        )
        db_session.add(farmer)

        farm = Farm(
            id=str(uuid.uuid4()),
            owner_id=farmer.id,
            name="Nashik Grape & Soybean Plantation",
            boundary="SRID=4326;MULTIPOLYGON(((73.8 18.5, 73.9 18.5, 73.9 18.6, 73.8 18.6, 73.8 18.5)))",
            total_area_hectares=5.0,
            region="Maharashtra",
            country="India",
        )
        db_session.add(farm)

        zone = FarmZone(
            id=str(uuid.uuid4()),
            farm_id=farm.id,
            zone_code="Z01",
            name="Zone Z01 (Soybean Block)",
            boundary="SRID=4326;POLYGON((73.8 18.5, 73.9 18.5, 73.9 18.6, 73.8 18.6, 73.8 18.5))",
            area_hectares=1.5,
        )
        db_session.add(zone)
        await db_session.commit()

        # 2. Execute AI Disease Analysis via DiagnosisService
        diag_service = DiagnosisService(db_session)
        diag_request = SymptomAnalysisRequest(
            farm_id=farm.id,
            zone_id=zone.id,
            crop_type="Soybean",
            growth_stage="Flowering",
            plant_parts=["Leaf"],
            symptoms=["Necrotic lesions", "Brown spots"],
            severity="HIGH",
            distribution="Scattered across zone",
            symptom_start_date="3 days ago",
            farmer_notes="Lesions expanding on lower leaves after humid rain.",
            images=[
                ImageItem(
                    image_url="https://example.com/soybean_leaf_spot.jpg",
                    original_filename="soybean_lesion.jpg",
                    file_size_bytes=1048576,
                )
            ],
        )

        diag_response = await diag_service.execute_symptom_analysis(diag_request, farmer)

        assert diag_response is not None
        assert diag_response.farm_id == farm.id
        assert diag_response.crop_type == "Soybean"

        # 3. Verify Automatic FollowUp MonitoringTask DB Insertion
        task_stmt = select(MonitoringTask).where(MonitoringTask.trigger_entity_id == diag_response.id)
        task_res = await db_session.execute(task_stmt)
        created_task = task_res.scalar_one_or_none()

        assert created_task is not None, "MonitoringTask should be automatically created in database upon AI analysis completion"
        assert created_task.farm_id == farm.id
        assert created_task.zone_id == zone.id
        assert created_task.status == MonitoringTaskStatus.SCHEDULED
        assert created_task.priority in [MonitoringPriority.HIGH, MonitoringPriority.CRITICAL]

        task_id = created_task.id

        # 4. Verify API Retrieval & Scoping via AsyncClient
        from app.core.security import create_access_token

        access_token = create_access_token(subject=farmer.id, email=farmer.email, role="FARMER")
        headers = {"Authorization": f"Bearer {access_token}"}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # GET Tasks
            get_tasks_resp = await ac.get("/api/v1/monitoring/tasks", headers=headers)
            assert get_tasks_resp.status_code == 200
            tasks_data = get_tasks_resp.json()
            assert len(tasks_data) >= 1
            fetched_task = next(t for t in tasks_data if t["id"] == task_id)
            assert fetched_task["farm_name"] == "Nashik Grape & Soybean Plantation"
            assert fetched_task["zone_name"] == "Zone Z01 (Soybean Block)"
            assert fetched_task["status"] == "SCHEDULED"

            # 5. Start Task (POST /tasks/{id}/start)
            start_resp = await ac.post(f"/api/v1/monitoring/tasks/{task_id}/start", headers=headers)
            assert start_resp.status_code == 200
            assert start_resp.json()["status"] == "IN_PROGRESS"

            # 6. Submit Observation Result (POST /tasks/{id}/result)
            result_payload = {
                "observation_id": f"obs-{uuid.uuid4().hex[:6]}",
                "health_score": 82.0,  # Baseline was lower (~62.0), showing improvement
                "disease_risk": 22.0,  # Baseline was higher (~94.0), showing reduction
                "pest_risk": 10.0,
                "water_stress": 0.15,
                "affected_area_ha": 0.2, # Reduced from 0.5
                "severity": "LOW",
                "observed_symptoms": ["Mild halo", "Drying spots"],
                "image_urls": ["https://example.com/followup_soybean_after.jpg"],
                "notes": "Bio-fungicide spray applied. Lesion expansion halted and new foliage healthy.",
            }

            submit_resp = await ac.post(f"/api/v1/monitoring/tasks/{task_id}/result", json=result_payload, headers=headers)
            assert submit_resp.status_code == 200, f"Result submit failed: {submit_resp.text}"
            result_data = submit_resp.json()

            assert result_data["health_score"] == 82.0
            assert result_data["disease_risk"] == 22.0

            # 7. Verify Before vs After Comparison Data in DB
            comp_stmt = select(MonitoringComparison).where(MonitoringComparison.monitoring_result_id == result_data["id"])
            comp_res = await db_session.execute(comp_stmt)
            comparison = comp_res.scalar_one_or_none()

            assert comparison is not None, "ComparisonEngine should calculate quantitative delta comparison"
            assert comparison.health_change > 0, "Health change should reflect positive improvement"
            assert comparison.disease_risk_change < 0, "Disease risk change should reflect decrease"
            assert comparison.trend.value == "IMPROVING"

            # 8. Verify Task Completion Status in DB
            recheck_task_stmt = select(MonitoringTask).where(MonitoringTask.id == task_id)
            recheck_res = await db_session.execute(recheck_task_stmt)
            rechecked_task = recheck_res.scalar_one_or_none()
            await db_session.refresh(rechecked_task)

            assert rechecked_task.status == MonitoringTaskStatus.COMPLETED
            assert rechecked_task.completed_at is not None

            # 9. Verify Statistics API Endpoint
            stats_resp = await ac.get("/api/v1/monitoring/statistics", headers=headers)
            assert stats_resp.status_code == 200
            stats_data = stats_resp.json()
            assert stats_data["completed"] >= 1
            assert stats_data["monitoring_coverage_pct"] > 0
