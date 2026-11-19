import json
from datetime import datetime
import os
from openpyxl import load_workbook

# Read the October Excel files
files = [
    'october/Hulhumale Staff - October.xlsx',
    'october/Local Staff - October.xlsx',
    'october/Male Foreigners Staff -  October.xlsx'
]

all_data = []

for file in files:
    if not os.path.exists(file):
        print(f"File not found: {file}")
        continue
    
    print(f"Processing {file}...")
    
    try:
        # Read Excel file using openpyxl
        wb = load_workbook(file, data_only=True)
        sheet = wb.active
        
        # Get header row
        headers = [cell.value for cell in sheet[1]]
        print(f"Columns in {file}: {headers}")
        
        # Find employee ID and name columns
        emp_id_col_idx = None
        name_col_idx = None
        
        for idx, header in enumerate(headers):
            if header and isinstance(header, str):
                header_lower = header.lower()
                if 'user id' in header_lower or 'employee id' in header_lower or 'emp id' in header_lower:
                    emp_id_col_idx = idx
                elif 'name' in header_lower and 'employee' in header_lower:
                    name_col_idx = idx
        
        if emp_id_col_idx is None or name_col_idx is None:
            print(f"Could not find employee ID or name columns in {file}")
            continue
        
        print(f"Using column indices: emp_id={emp_id_col_idx}, name={name_col_idx}")
        
        # Process each data row
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2), start=2):
            emp_id = str(row[emp_id_col_idx].value).strip() if row[emp_id_col_idx].value else ''
            name = str(row[name_col_idx].value).strip() if row[name_col_idx].value else ''
            
            if not emp_id or emp_id == 'nan' or emp_id == 'User ID':
                continue
            
            # Look for date columns (should be 31 days for October)
            for col_idx, header in enumerate(headers):
                if header and isinstance(header, str):
                    header_str = str(header)
                    # Check if column looks like a date (e.g., "1", "2", "01", "02", etc.)
                    if header_str.isdigit() or (len(header_str) == 2 and header_str.isdigit()):
                        day = int(header_str)
                        if day < 1 or day > 31:
                            continue
                        
                        value = str(row[col_idx].value).strip() if row[col_idx].value else ''
                        
                        # Check for leave codes
                        leave_type = None
                        if value in ['AL', 'EL', 'SICK', 'SP', 'FL', 'OFF', 'MC', 'SICK / MC', 'INFO SICK', 'Emergency Leave', 'Accident /Hospital']:
                            leave_type = value
                        elif value and value not in ['nan', '']:
                            # Could be other leave codes
                            leave_type = value
                        
                        if leave_type:
                            date = datetime(2026, 10, day).strftime('%Y-%m-%d')
                            
                            all_data.append({
                                'employee_id': emp_id,
                                'employee_name': name,
                                'date': date,
                                'leave_type': leave_type
                            })
        
        print(f"Extracted {len(all_data)} records from {file}")
        
    except Exception as e:
        print(f"Error processing {file}: {e}")
        import traceback
        traceback.print_exc()
        continue

# Write to JSON
with open('employee_leaves_october_2026.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, indent=2)

print(f"\nTotal records extracted: {len(all_data)}")
print("Saved to employee_leaves_october_2026.json")
