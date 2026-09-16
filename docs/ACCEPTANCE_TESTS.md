# Acceptance Tests

| Test ID | Description | Component | Status | Evidence/Notes |
|---------|-------------|-----------|--------|----------------|
| AT-001 | Farmer can successfully select their registered farm, zone, and crop, and document a crop-health case. | Frontend / Backend | TBD | |
| AT-002 | System accurately validates the uploaded image against the selected crop (e.g., rejects Non-Tomato if Tomato selected). | Backend (AI) | TBD | CropValidationService implemented. |
| AT-003 | System refuses to force a diagnosis when confidence is insufficient, falling back to 'LOW_CONFIDENCE' or 'UNKNOWN'. | Backend (AI) | TBD | |
| AT-004 | Extension worker can view and review assigned diagnostic cases through their dashboard. | Frontend / Backend | TBD | |
| AT-005 | Expert can validate an uncertain case escalated from an extension worker. | Frontend / Backend | TBD | |
| AT-006 | Authorized user (Expert) can request a laboratory diagnosis for a complex sample. | Frontend / Backend | TBD | |
| AT-007 | Laboratory confirmation state is visually and logically distinguished from AI prediction states. | Frontend | TBD | |
| AT-008 | Regional weather context impacts the contextual risk calculation during diagnosis. | Backend (Risk) | TBD | |
| AT-009 | Farmer receives an evidence-based IPM advisory corresponding directly to the validated condition and risk level. | Backend (AI) | TBD | |
| AT-010 | A follow-up task creates a new observation cycle, preserving temporal history of the diagnostic case. | Backend (DB) | TBD | |
