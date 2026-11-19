const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the October Excel files
const files = [
    'october/Hulhumale Staff - October.xlsx',
    'october/Local Staff - October.xlsx',
    'october/Male Foreigners Staff -  October.xlsx'
];

const allData = [];

for (const file of files) {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        continue;
    }
    
    console.log(`Processing ${file}...`);
    
    try {
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        
        // Process each sheet (each sheet is a different employee)
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Find the header row with 'User ID'
            let headerRowIdx = -1;
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row && row.includes('User ID')) {
                    headerRowIdx = i;
                    break;
                }
            }
            
            if (headerRowIdx === -1) {
                console.log(`Could not find header row in sheet ${sheetName}`);
                continue;
            }
            
            const headers = data[headerRowIdx];
            
            // Find column indices
            let empIdColIdx = headers.indexOf('User ID');
            let nameColIdx = headers.indexOf('Name');
            
            if (empIdColIdx === -1 || nameColIdx === -1) {
                console.log(`Could not find User ID or Name columns in sheet ${sheetName}`);
                continue;
            }
            
            // Find IN/OUT column pairs (each day has IN and OUT)
            const dayColumns = [];
            let inColIdx = headers.indexOf('IN');
            let outColIdx = headers.indexOf('OUT');
            
            // Collect all IN/OUT pairs
            while (inColIdx !== -1 && outColIdx !== -1) {
                dayColumns.push({ in: inColIdx, out: outColIdx });
                // Find next IN/OUT pair
                inColIdx = headers.indexOf('IN', outColIdx + 1);
                outColIdx = headers.indexOf('OUT', inColIdx + 1);
            }
            
            console.log(`Sheet ${sheetName}: Found ${dayColumns.length} day columns`);
            
            // Process data rows (skip header and empty rows)
            for (let rowIdx = headerRowIdx + 1; rowIdx < data.length; rowIdx++) {
                const row = data[rowIdx];
                
                if (!row || row.length === 0) continue;
                
                const empId = String(row[empIdColIdx] || '').trim();
                const name = String(row[nameColIdx] || '').trim();
                
                if (!empId || empId === 'nan' || empId === 'User ID' || empId === 'S NO') {
                    continue;
                }
                
                // Process each day
                for (let dayIdx = 0; dayIdx < dayColumns.length; dayIdx++) {
                    const { in: inCol, out: outCol } = dayColumns[dayIdx];
                    const inValue = String(row[inCol] || '').trim();
                    const outValue = String(row[outCol] || '').trim();
                    
                    // Check for leave codes in IN column
                    let leaveType = null;
                    if (['AL', 'EL', 'SICK', 'SP', 'FL', 'OFF', 'MC', 'SICK / MC', 'INFO SICK', 'Emergency Leave', 'Accident /Hospital'].includes(inValue)) {
                        leaveType = inValue;
                    }
                    
                    if (leaveType) {
                        // Calculate date (October 2026, day 1 = Oct 1)
                        const date = new Date(2026, 9, dayIdx + 1).toISOString().split('T')[0];
                        
                        allData.push({
                            employee_id: empId,
                            employee_name: name,
                            date: date,
                            leave_type: leaveType
                        });
                    }
                }
            }
        }
        
        console.log(`Extracted ${allData.length} records from ${file}`);
        
    } catch (error) {
        console.log(`Error processing ${file}:`, error.message);
        continue;
    }
}

// Write to JSON
const outputPath = path.join(__dirname, 'employee_leaves_october_2026.json');
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf8');

console.log(`\nTotal records extracted: ${allData.length}`);
console.log('Saved to employee_leaves_october_2026.json');
