# Requirements Traceability Matrix (RTM)

| ID | Requirement | Source Component | Implementation Layer | Validation Scenario | Status | Evidence/Notes |
|----|-------------|------------------|----------------------|---------------------|--------|----------------|
| REQ-01 | Farm registration | `farms_api.py` | API, DB | AT-001 | TBD | |
| REQ-02 | Farm boundary mapping | `farms_api.py`, PostGIS | API, DB | AT-001 | TBD | |
| REQ-03 | Zone management | `farms_api.py`, `spatial_zoning.py` | API, DB | AT-001 | TBD | |
| REQ-04 | Crop management | `crops_api.py` | API, DB | AT-001 | TBD | |
| REQ-05 | Farmer Image Diagnosis | `diagnosis_engine.py`, `SymptomDiseaseIdentificationPage.tsx` | UI, API, ML | AT-002, AT-003 | PARTIAL | `DiagnosisEngine` refactored, UI pending |
| REQ-06 | Image Quality Validation | `image_quality_service.py` | API | AT-002 | PARTIAL | Service exists, API integration pending |
| REQ-07 | Crop Mismatch Detection | `crop_validation_service.py` | API | AT-002 | PARTIAL | Service exists, API integration pending |
| REQ-08 | Disease Detection | `diagnosis_engine.py` | ML, API | AT-002 | PARTIAL | Prototype logic implemented |
| REQ-09 | Affected Region Localization | `diagnosis_engine.py` | ML, UI | AT-002 | PARTIAL | ML output mocked, UI viewer pending |
| REQ-10 | Separate Confidence Metrics | `diagnosis_engine.py` | ML, API | AT-003 | PASS | `disease_confidence` & `crop_confidence` separated |
| REQ-11 | Expert Validation | `RequestValidationModal.tsx`, `expert_validation.py` | UI, API | AT-005 | FAIL | `ImportError: cannot import name 'LabReferralStatus'` |
| REQ-12 | Extension Worker Workflow | `extension_worker.py` | UI, API | AT-004 | TBD | |
| REQ-13 | Laboratory Referral | `laboratory.py` | UI, API | AT-006, AT-007 | FAIL | Tied to `LabReferralStatus` missing |
| REQ-14 | Weather Intelligence | `weather_provider.py` | API | AT-008 | TBD | |
| REQ-15 | Risk Engine Assessment | `diagnosis_engine.py` | API | AT-008 | TBD | |
| REQ-16 | Actionable Advisory | `diagnosis_engine.py` | API | AT-009 | TBD | |
| REQ-17 | Follow-up Monitoring | `followup_monitoring.py` | API | AT-010 | TBD | |
| REQ-18 | Large File Handling | `image_ingestion.py` | API, Storage | N/A | TBD | |
| REQ-19 | Multilingual Support | `advisory_multilingual.py` | API, UI | N/A | TBD | |

*Note: This matrix will be updated continuously as the audit progresses.*
