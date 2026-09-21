import sqlite3
import os

db_path = r"c:\Users\krsan\Desktop\crop\backend\data\test_agrishield.db"
if not os.path.exists(db_path):
    print("No SQLite database found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("=== SQLITE TABLES ===")
    for table in tables:
        t = table[0]
        print(f"- {t}")
        cursor.execute(f"PRAGMA table_info({t});")
        columns = cursor.fetchall()
        print(f"  Columns: {[c[1] for c in columns]}")
        cursor.execute(f"SELECT COUNT(*) FROM {t};")
        count = cursor.fetchone()[0]
        print(f"  Row count: {count}")
    conn.close()
