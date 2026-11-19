const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(serial) {
  if (typeof serial !== 'number') return serial;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

// Restructure Airport Pass Updates
function restructureAirportPass() {
  const filePath = path.join(__dirname, 'fleets', 'Airport Pass Updates.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Skip title row
    if (row[0] && typeof row[0] === 'string' && row[0].includes('Madihaa Company')) continue;
    
    // Detect section headers (Drivers, Labours) - check if any cell contains these values
    const sectionIndex = row.findIndex(cell => cell === 'Drivers' || cell === 'Labours');
    if (sectionIndex !== -1) {
      const section = row[sectionIndex];
      // Next row should have "Name" in the same column
      if (data[i + 1] && data[i + 1][sectionIndex] === 'Name') {
        const names = data[i + 1];
        const categories = data[i + 2];
        const passNos = data[i + 3];
        const expiries = data[i + 4];
        const daysLeft = data[i + 5];
        
        // Process each column starting from the section index
        for (let j = sectionIndex + 1; j < names.length; j++) {
          const name = names[j];
          if (!name || (typeof name !== 'string')) continue;
          
          result.push({
            name: name.trim(),
            category: categories[j] || '',
            section: section,
            passNo: passNos[j] || null,
            expiryDate: excelDateToJSDate(expiries[j]),
            daysLeft: daysLeft[j] || null
          });
        }
      }
    }
  }
  
  return result;
}

// Restructure License Updates
function restructureLicenseUpdates() {
  const filePath = path.join(__dirname, 'fleets', 'License Updates.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const result = [];
  let names = [];
  let categories = [];
  let licenseNos = [];
  let expiries = [];
  let daysLeft = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Skip title and number rows
    if (row[0] && (row[0].includes('Madihaa Company') || typeof row[0] === 'number')) continue;
    
    // Capture header rows
    if (row[0] === 'Name') {
      names = row.slice(1);
      continue;
    }
    if (row[0] === 'Category') {
      categories = row.slice(1);
      continue;
    }
    if (row[0] === 'Licence No') {
      licenseNos = row.slice(1);
      continue;
    }
    if (row[0] === 'Expiry') {
      expiries = row.slice(1);
      continue;
    }
    if (row[0] === 'Days left' && typeof row[1] === 'number') {
      daysLeft = row.slice(1);
      continue;
    }
    
    // Skip metadata rows
    if (row[0] && typeof row[0] === 'string' && (row[0].includes('Prepared By') || row[0].includes('Last Updated'))) continue;
    
    // Process additional data rows (if any)
    if (row[4] && typeof row[4] === 'string' && row[4] !== 'OLD') {
      const idx = 4;
      result.push({
        name: row[idx]?.trim() || '',
        category: data[i - 1]?.[idx] || '',
        licenseNo: data[i - 2]?.[idx] || '',
        expiryDate: excelDateToJSDate(data[i - 3]?.[idx]),
        daysLeft: data[i - 4]?.[idx] || null
      });
    }
  }
  
  // Build main list from captured arrays
  for (let i = 0; i < names.length; i++) {
    if (names[i] && typeof names[i] === 'string' && names[i].trim()) {
      result.push({
        name: names[i].trim(),
        category: categories[i] || '',
        licenseNo: licenseNos[i] || '',
        expiryDate: excelDateToJSDate(expiries[i]),
        daysLeft: daysLeft[i] || null
      });
    }
  }
  
  return result;
}

// Restructure Vehicle Updates
function restructureVehicleUpdates() {
  const filePath = path.join(__dirname, 'fleets', 'Vehicle updates(14-08-2026).xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const result = [];
  
  // The data is transposed - headers are in rows, vehicles are in columns
  // Find the row with "Reg. No" - this is where vehicle data starts
  let regNoRowIndex = -1;
  let typeRowIndex = -1;
  let tonnageRowIndex = -1;
  let roadWorthinessRowIndex = -1;
  let insuranceRowIndex = -1;
  let annualFeeRowIndex = -1;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] === 'Reg. No') regNoRowIndex = i;
    if (row[0] === 'Type') typeRowIndex = i;
    if (row[0] === 'Tonnage') tonnageRowIndex = i;
    if (row[0] === 'R.worthiness') roadWorthinessRowIndex = i;
    if (row[0] === 'Insurance') insuranceRowIndex = i;
    if (row[0] === 'Annual Fee') annualFeeRowIndex = i;
  }
  
  if (regNoRowIndex === -1) {
    console.log('Reg. No row not found');
    return result;
  }
  
  // Get the registration numbers (column 0 is the header, columns 1+ are vehicles)
  const regNoRow = data[regNoRowIndex];
  const typeRow = typeRowIndex !== -1 ? data[typeRowIndex] : [];
  const tonnageRow = tonnageRowIndex !== -1 ? data[tonnageRowIndex] : [];
  const roadWorthinessRow = roadWorthinessRowIndex !== -1 ? data[roadWorthinessRowIndex] : [];
  const insuranceRow = insuranceRowIndex !== -1 ? data[insuranceRowIndex] : [];
  const annualFeeRow = annualFeeRowIndex !== -1 ? data[annualFeeRowIndex] : [];
  
  // Process each vehicle (starting from column 1)
  for (let col = 1; col < regNoRow.length; col++) {
    const registration = regNoRow[col];
    const type = typeRow[col] || '';
    const tonnage = tonnageRow[col] || '';
    const roadWorthiness = excelDateToJSDate(roadWorthinessRow[col]);
    const insuranceExpiry = excelDateToJSDate(insuranceRow[col]);
    const annualFee = excelDateToJSDate(annualFeeRow[col]);
    
    // Skip if no registration
    if (!registration) continue;
    
    // Skip if registration looks like a header or empty
    if (typeof registration === 'string' && (registration.includes('Reg.') || registration === '')) continue;
    
    result.push({
      vehicleNo: registration.toString(),
      registration: registration.toString(),
      model: tonnage.toString(),
      type: type.toString(),
      insuranceExpiry: insuranceExpiry,
      roadTaxExpiry: annualFee // Using Annual Fee as road tax expiry
    });
  }
  
  return result;
}

// Process all files
const fleetsDir = path.join(__dirname, 'fleets');

// Airport Pass
const airportPassData = restructureAirportPass();
fs.writeFileSync(
  path.join(fleetsDir, 'airport_pass_updates.json'),
  JSON.stringify(airportPassData, null, 2),
  'utf-8'
);
console.log(`Restructured Airport Pass Updates: ${airportPassData.length} records`);

// License Updates
const licenseData = restructureLicenseUpdates();
fs.writeFileSync(
  path.join(fleetsDir, 'license_updates.json'),
  JSON.stringify(licenseData, null, 2),
  'utf-8'
);
console.log(`Restructured License Updates: ${licenseData.length} records`);

// Vehicle Updates
const vehicleData = restructureVehicleUpdates();
fs.writeFileSync(
  path.join(fleetsDir, 'vehicle_updates.json'),
  JSON.stringify(vehicleData, null, 2),
  'utf-8'
);
console.log(`Restructured Vehicle Updates: ${vehicleData.length} records`);

console.log('All files restructured successfully!');
