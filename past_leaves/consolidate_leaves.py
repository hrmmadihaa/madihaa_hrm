import json
from collections import defaultdict

# Read all monthly leave files
files = [
    'january_past_leaves.json',
    'october_past_leaves.json'
]

# Dictionary to store consolidated data by employee_number
consolidated = {}

for filename in files:
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for employee in data:
            emp_num = employee['employee_number']
            name = employee['name']
            leaves = employee['leaves']
            
            if emp_num in consolidated:
                # Merge leaves for existing employee
                consolidated[emp_num]['leaves'].extend(leaves)
            else:
                # Add new employee
                consolidated[emp_num] = {
                    'employee_number': emp_num,
                    'name': name,
                    'leaves': leaves.copy()
                }

# Convert to list
consolidated_list = list(consolidated.values())

# Write consolidated data to file
with open('consolidated_past_leaves.json', 'w', encoding='utf-8') as f:
    json.dump(consolidated_list, f, indent=2)

print(f"Consolidated {len(consolidated_list)} employees with leave data")
