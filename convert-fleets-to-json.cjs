const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const fleetsDir = path.join(__dirname, 'fleets');
const files = [
  'Airport Pass Updates.xlsx',
  'License Updates.xlsx',
  'Vehicle updates(14-08-2026).xlsx'
];

files.forEach(file => {
  const filePath = path.join(fleetsDir, file);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  
  const jsonFileName = file.replace('.xlsx', '.json');
  const jsonFilePath = path.join(fleetsDir, jsonFileName);
  
  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`Converted ${file} to ${jsonFileName}`);
  console.log(`Total records: ${jsonData.length}`);
});

console.log('All files converted successfully!');
