import sqlite3
import uuid
import json
from datetime import datetime, timezone

def seed_demo_case():
    conn = sqlite3.connect('agrishield.db')
    cursor = conn.cursor()

    # 1. Ensure a demo farm exists
    cursor.execute("SELECT id FROM farms WHERE id = 'farm-demo-1' OR name = 'Green Valley Farm' LIMIT 1")
    farm_row = cursor.fetchone()
    if farm_row:
        farm_id = farm_row[0]
    else:
        farm_id = 'farm-demo-1'
        cursor.execute(
            "INSERT INTO farms (id, name, owner_id, total_area_hectares, country, is_active, boundary) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (farm_id, 'Green Valley Farm', 'usr-demo-farmer', 12.5, 'India', 1, '{"type":"Polygon","coordinates":[]}')
        )

    # 2. Ensure a demo user exists
    cursor.execute("SELECT id FROM users LIMIT 1")
    user_row = cursor.fetchone()
    user_id = user_row[0] if user_row else 'usr-demo-farmer'

    # 3. Check if DEMO-CASE-001 exists
    cursor.execute("SELECT id FROM expert_validation_requests WHERE id = 'DEMO-CASE-001' OR case_number = 'DEMO-CASE-001'")
    existing = cursor.fetchone()

    case_id = 'DEMO-CASE-001'
    case_number = 'DEMO-CASE-001'
    farm_name = 'Green Valley Farm'
    zone_id = 'Zone A'
    crop_id = 'Tomato'
    suspected_condition = 'Early Blight'
    ai_confidence = 0.942
    crop_growth_stage = 'Flowering & Fruiting Stage'
    priority = 'HIGH'
    status = 'PENDING'
    reason = 'AI Confidence 94.2% with early foliar chlorotic ring patterns on Tomato crops. Priority ground-truth verification requested.'
    symptoms = json.dumps(["Brown lesions", "Yellowing", "Leaf damage"])
    image_urls = json.dumps(["https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80"])
    weather_summary = json.dumps({
        "temperature_c": 27.5,
        "humidity_pct": 84,
        "rainfall_mm": 12.0,
        "disease_risk_level": "HIGH"
    })
    created_at = datetime.now(timezone.utc).isoformat()

    if existing:
        cursor.execute("""
            UPDATE expert_validation_requests
            SET status = ?, priority = ?, suspected_condition = ?, ai_confidence = ?, reason = ?, symptoms = ?, image_urls = ?, weather_summary = ?
            WHERE id = ? OR case_number = ?
        """, (status, priority, suspected_condition, ai_confidence, reason, symptoms, image_urls, weather_summary, case_id, case_number))
        print("Updated existing DEMO-CASE-001 in database.")
    else:
        cursor.execute("""
            INSERT INTO expert_validation_requests (
                id, case_number, farm_id, zone_id, crop_id, requested_by, priority, status,
                reason, suspected_condition, ai_confidence, crop_growth_stage, symptoms,
                image_urls, weather_summary, hotspot_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            case_id, case_number, farm_id, zone_id, crop_id, user_id, priority, status,
            reason, suspected_condition, ai_confidence, crop_growth_stage, symptoms,
            image_urls, weather_summary, 'HS-DEMO-001', created_at
        ))
        print("Inserted DEMO-CASE-001 into database successfully.")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    seed_demo_case()
