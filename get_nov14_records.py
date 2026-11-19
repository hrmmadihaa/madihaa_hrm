import pyodbc
from datetime import datetime
import json
from access_reader import CrossChexReader

DATABASE_PATH = r"E:\ANVIZ Crosschex Backup\DB\CrossChex.mdb"
OUTPUT_FILE = r"E:\Rettey\madihaa-hrm\crosschex_exports\crosschex_attendance_2026-11-14_full.json"

def get_all_nov14_records():
    """Get ALL records and filter for November 14, 2026 in Python"""
    reader = CrossChexReader(DATABASE_PATH)
    
    if not reader.connect():
        print("Failed to connect to database")
        return
    
    try:
        # Get ALL attendance records
        print("Fetching all attendance records...")
        all_records = reader.get_attendance_records(limit=None)
        print(f"Total records in database: {len(all_records)}")
        
        # Filter for November 14, 2026
        nov14_records = []
        for record in all_records:
            check_time = record['checkTime']
            if check_time and '2026-11-14' in check_time:
                nov14_records.append(record)
        
        print(f"Records for November 14, 2026: {len(nov14_records)}")
        
        # Load user names from database
        all_users = reader.get_users()
        user_name_lookup = {user['userid']: user['name'] for user in all_users if user['name']}
        
        # Add MAD codes and names
        enriched_records = []
        for record in nov14_records:
            enriched = record.copy()
            enriched['mad_code'] = f"MAD0{record['userid']}"
            enriched['employee_name'] = user_name_lookup.get(record['userid'])
            enriched_records.append(enriched)
        
        # Export to JSON
        export_data = {
            "exported_at": datetime.now().isoformat(),
            "date": "2026-11-14",
            "total_records": len(enriched_records),
            "records": enriched_records
        }
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print(f"Exported {len(enriched_records)} records to {OUTPUT_FILE}")
        
    finally:
        reader.close()

if __name__ == "__main__":
    get_all_nov14_records()
