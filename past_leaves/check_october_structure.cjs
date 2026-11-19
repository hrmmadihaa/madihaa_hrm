const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Check the structure of October Excel files
const files = [
    'october/Hulhumale Staff - October.xlsx',
    'october/Local Staff - October.xlsx',
    'october/Male Foreigners Staff -  October.xlsx'
];

for (const file of files) {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        continue;
    }
    
    console.log(`\n=== ${file} ===`);
    
    try {
        const workbook = XLSX.readFile(filePath);
        console.log(`Sheet names: ${workbook.SheetNames}`);
        
        for (const sheetName of workbook.SheetNames) {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            console.log(`Total rows: ${data.length}`);
            console.log(`\nFirst 10 rows:`);
            for (let i = 0; i < Math.min(10, data.length); i++) {
                console.log(`Row ${i}:`, data[i]);
            }
        }
        
    } catch (error) {
        console.log(`Error:`, error.message);
    }
}
