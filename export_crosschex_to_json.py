import pyodbc
from datetime import datetime
import json
from access_reader import CrossChexReader

DATABASE_PATH = r"E:\ANVIZ Crosschex Backup\DB\CrossChex.mdb"
OUTPUT_DIR = r"E:\Rettey\madihaa-hrm\crosschex_exports"
MAPPING_FILE = r"E:\Rettey\madihaa-hrm\employee_mapping.json"

def load_mapping(mapping_file: str):
    """Load employee and device mapping from JSON file"""
    try:
        with open(mapping_file, 'r', encoding='utf-8') as f:
            mapping_data = json.load(f)
        
        # Create lookup dictionaries
        user_mapping = {item['userid']: item for item in mapping_data['mapping']}
        device_mapping = mapping_data.get('device_mapping', {})
        
        return user_mapping, device_mapping
    except Exception as e:
        print(f"Warning: Could not load mapping file: {e}")
        return {}, {}

def export_users_to_json(reader: CrossChexReader, output_file: str):
    """Export all users from CrossChex to JSON file"""
    print(f"Exporting users to {output_file}...")
    
    users = reader.get_users()
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "total_users": len(users),
        "users": users
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(users)} users to {output_file}")

def export_attendance_to_json(reader: CrossChexReader, output_file: str, limit: int = None, user_mapping: dict = None, device_mapping: dict = None, user_name_lookup: dict = None):
    """Export attendance records from CrossChex to JSON file with MAD codes and device names"""
    print(f"Exporting attendance records to {output_file}...")
    
    records = reader.get_attendance_records(limit=limit)
    
    # Apply mappings
    enriched_records = []
    for record in records:
        enriched = record.copy()
        
        # Add MAD employee code and name
        if user_mapping and record['userid'] in user_mapping:
            enriched['mad_code'] = user_mapping[record['userid']]['mad_code'] or f"MAD0{record['userid']}"
            enriched['employee_name'] = user_mapping[record['userid']]['name'] or (user_name_lookup.get(record['userid']) if user_name_lookup else None)
        else:
            enriched['mad_code'] = f"MAD0{record['userid']}"
            enriched['employee_name'] = user_name_lookup.get(record['userid']) if user_name_lookup else None
        
        # Add device name
        if device_mapping and str(record['sensorid']) in device_mapping:
            enriched['device_name'] = device_mapping[str(record['sensorid'])]
        else:
            enriched['device_name'] = f"Device {record['sensorid']}"
        
        enriched_records.append(enriched)
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "total_records": len(enriched_records),
        "records": enriched_records
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(enriched_records)} attendance records to {output_file}")

def export_attendance_by_date_range(reader: CrossChexReader, output_file: str, start_date: datetime, end_date: datetime, user_mapping: dict = None, device_mapping: dict = None, user_name_lookup: dict = None):
    """Export attendance records for a specific date range with MAD codes and device names"""
    print(f"Exporting attendance records from {start_date} to {end_date}...")
    
    records = reader.get_attendance_records(start_date=start_date, end_date=end_date)
    
    # Apply mappings
    enriched_records = []
    for record in records:
        enriched = record.copy()
        
        # Add MAD employee code and name
        if user_mapping and record['userid'] in user_mapping:
            enriched['mad_code'] = user_mapping[record['userid']]['mad_code'] or f"MAD0{record['userid']}"
            enriched['employee_name'] = user_mapping[record['userid']]['name'] or (user_name_lookup.get(record['userid']) if user_name_lookup else None)
        else:
            enriched['mad_code'] = f"MAD0{record['userid']}"
            enriched['employee_name'] = user_name_lookup.get(record['userid']) if user_name_lookup else None
        
        # Add device name
        if device_mapping and str(record['sensorid']) in device_mapping:
            enriched['device_name'] = device_mapping[str(record['sensorid'])]
        else:
            enriched['device_name'] = f"Device {record['sensorid']}"
        
        enriched_records.append(enriched)
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "total_records": len(enriched_records),
        "records": enriched_records
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(enriched_records)} attendance records to {output_file}")

def export_all_attendance(reader: CrossChexReader, output_file: str, user_mapping: dict = None, device_mapping: dict = None, user_name_lookup: dict = None):
    """Export ALL attendance records without date filter with MAD codes and device names"""
    print(f"Exporting ALL attendance records...")
    
    records = reader.get_attendance_records(limit=None)
    
    # Apply mappings
    enriched_records = []
    for record in records:
        enriched = record.copy()
        
        # Add MAD employee code and name
        if user_mapping and record['userid'] in user_mapping:
            enriched['mad_code'] = user_mapping[record['userid']]['mad_code'] or f"MAD0{record['userid']}"
            enriched['employee_name'] = user_mapping[record['userid']]['name'] or (user_name_lookup.get(record['userid']) if user_name_lookup else None)
        else:
            enriched['mad_code'] = f"MAD0{record['userid']}"
            enriched['employee_name'] = user_name_lookup.get(record['userid']) if user_name_lookup else None
        
        # Add device name
        if device_mapping and str(record['sensorid']) in device_mapping:
            enriched['device_name'] = device_mapping[str(record['sensorid'])]
        else:
            enriched['device_name'] = f"Device {record['sensorid']}"
        
        enriched_records.append(enriched)
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "total_records": len(enriched_records),
        "records": enriched_records
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(enriched_records)} attendance records to {output_file}")

def export_devices_to_json(reader: CrossChexReader, output_file: str):
    """Export device information from CrossChex to JSON file"""
    print(f"Exporting devices to {output_file}...")
    
    devices = reader.get_device_info()
    
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "total_devices": len(devices),
        "devices": devices
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(devices)} devices to {output_file}")

def main():
    import os
    
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Initialize reader
    reader = CrossChexReader(DATABASE_PATH)
    
    if not reader.connect():
        print("Failed to connect to database")
        return
    
    try:
        # Get all users from database for automatic name lookup
        all_users = reader.get_users()
        user_name_lookup = {user['userid']: user['name'] for user in all_users if user['name']}
        print(f"Loaded {len(user_name_lookup)} user names from database")
        
        # Load employee and device mappings (for MAD codes)
        user_mapping, device_mapping = load_mapping(MAPPING_FILE)
        print(f"Loaded {len(user_mapping)} user mappings and {len(device_mapping)} device mappings")
        
        # Merge database names with mapping
        for userid, user_data in user_mapping.items():
            if not user_data['name'] and userid in user_name_lookup:
                user_data['name'] = user_name_lookup[userid]
        
        # Export users
        users_file = os.path.join(OUTPUT_DIR, "crosschex_users.json")
        export_users_to_json(reader, users_file)
        
        # Export devices
        devices_file = os.path.join(OUTPUT_DIR, "crosschex_devices.json")
        export_devices_to_json(reader, devices_file)
        
        # Export recent attendance (last 1000 records)
        recent_attendance_file = os.path.join(OUTPUT_DIR, "crosschex_attendance_recent.json")
        export_attendance_to_json(reader, recent_attendance_file, limit=1000, user_mapping=user_mapping, device_mapping=device_mapping, user_name_lookup=user_name_lookup)
        
        # Export attendance for today
        today = datetime.now()
        start_of_day = datetime(today.year, today.month, today.day)
        end_of_day = datetime(today.year, today.month, today.day, 23, 59, 59)
        
        today_attendance_file = os.path.join(OUTPUT_DIR, f"crosschex_attendance_{today.strftime('%Y-%m-%d')}.json")
        export_attendance_by_date_range(reader, today_attendance_file, start_of_day, end_of_day, user_mapping=user_mapping, device_mapping=device_mapping, user_name_lookup=user_name_lookup)
        
        # Export attendance for last 7 days
        from datetime import timedelta
        week_ago = today - timedelta(days=7)
        week_attendance_file = os.path.join(OUTPUT_DIR, f"crosschex_attendance_last_7_days.json")
        export_attendance_by_date_range(reader, week_attendance_file, week_ago, end_of_day, user_mapping=user_mapping, device_mapping=device_mapping, user_name_lookup=user_name_lookup)
        
        # Export attendance for November 1, 2026
        nov_1 = datetime(2026, 11, 1)
        nov_1_start = datetime(2026, 11, 1, 0, 0, 0)
        nov_1_end = datetime(2026, 11, 1, 23, 59, 59)
        nov_1_file = os.path.join(OUTPUT_DIR, "crosschex_attendance_2026-11-01.json")
        export_attendance_by_date_range(reader, nov_1_file, nov_1_start, nov_1_end, user_mapping=user_mapping, device_mapping=device_mapping, user_name_lookup=user_name_lookup)
        
        # Export ALL attendance records
        all_attendance_file = os.path.join(OUTPUT_DIR, "crosschex_attendance_all.json")
        export_all_attendance(reader, all_attendance_file, user_mapping=user_mapping, device_mapping=device_mapping, user_name_lookup=user_name_lookup)
        
        print(f"\n=== EXPORT COMPLETE ===")
        print(f"All files exported to: {OUTPUT_DIR}")
        
    except Exception as e:
        print(f"Error during export: {e}")
    finally:
        reader.close()

if __name__ == "__main__":
    main()
