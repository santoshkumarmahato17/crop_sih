# Acceptance Tests

| Test ID | Description | Component | Status | Evidence/Notes |
|---------|-------------|-----------|--------|----------------|
| AT-001 | Farmer can successfully select their registered farm, zone, and crop, and document a crop-health case. | Frontend / Backend | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-002 | System accurately validates the uploaded image against the selected crop (e.g., rejects Non-Tomato if Tomato selected). | Backend (AI) | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-003 | System refuses to force a diagnosis when confidence is insufficient, falling back to 'LOW_CONFIDENCE' or 'UNKNOWN'. | Backend (AI) | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-004 | Extension worker can view and review assigned diagnostic cases through their dashboard. | Frontend / Backend | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-005 | Expert can validate an uncertain case escalated from an extension worker. | Frontend / Backend | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-006 | Authorized user (Expert) can request a laboratory diagnosis for a complex sample. | Frontend / Backend | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-007 | Laboratory confirmation state is visually and logically distinguished from AI prediction states. | Frontend | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-008 | Regional weather context impacts the contextual risk calculation during diagnosis. | Backend (Risk) | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-009 | Farmer receives an evidence-based IPM advisory corresponding directly to the validated condition and risk level. | Backend (AI) | PASS | Automated via `test_acceptance_scenarios.py` |
| AT-010 | A follow-up task creates a new observation cycle, preserving temporal history of the diagnostic case. | Backend (DB) | PASS | Automated via `test_acceptance_scenarios.py` |
