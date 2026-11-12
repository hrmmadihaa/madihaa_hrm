const XLSX = require('xlsx');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Read Excel file
const workbook = XLSX.readFile('Madihaa_Locals Salary_Oct 2026.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sheet name:', workbook.SheetNames[0]);
console.log('Total rows in sheet:', data.length);
console.log('First 5 rows:', data.slice(0, 5));

// Header is at row 3 (index 2), employee names are in column 1 (index 1)
const nameColIndex = 1;

// Create row to employee mapping (data starts at row 4, which is index 3)
const rowToEmployee = {};
data.forEach((row, index) => {
  if (index < 3) return; // Skip header rows
  const rowNumber = index + 1; // Excel rows are 1-indexed
  if (row[nameColIndex]) {
    const name = String(row[nameColIndex]).trim();
    if (name && name !== 'NAME') {
      rowToEmployee[rowNumber] = name;
    }
  }
});

console.log('Row to employee mapping sample:', Object.entries(rowToEmployee).slice(0, 10));
console.log('All employee mappings:', Object.entries(rowToEmployee));

// Get full employee data from Excel for skipped employees
const getEmployeeData = (rowNumber) => {
  const rowIndex = rowNumber - 1; // Convert to 0-indexed
  if (data[rowIndex]) {
    const row = data[rowIndex];
    return {
      name: row[1], // NAME column
      staffId: row[2], // Staff ID
      dateOfJoin: row[3], // Date of Join
      location: row[4], // LOCATION
      designation: row[5], // DESIGNATION
      nationality: row[6], // NATIONALITY
      bankName: row[9], // Bank Name
      accountNo: row[8], // A/C no
    };
  }
  return null;
};

// Log employee details for skipped employees
const skippedEmployees = ['Aminath Shafana', 'Fathmath Hana ', 'Hussain Mahir ', 'Ahmed Rizny', 'Ismail Shareef'];
console.log('\n=== Skipped Employees Details ===');
Object.entries(rowToEmployee).forEach(([rowNum, name]) => {
  if (skippedEmployees.includes(name)) {
    const empData = getEmployeeData(parseInt(rowNum));
    console.log(`\n${name} (Row ${rowNum}):`, empData);
  }
});

// Extract comments
const comments = [];
Object.keys(sheet).forEach(key => {
  if (key.startsWith('!')) return;
  const cell = sheet[key];
  if (cell.c) {
    cell.c.forEach(comment => {
      comments.push({
        cell: key,
        author: comment.a,
        text: comment.t
      });
    });
  }
});

console.log('Total comments found:', comments.length);
console.log('All comments:', comments);

// Get row number from cell reference
const getRowNumber = (cellRef) => {
  const match = cellRef.match(/[A-Z]+(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

// Parse increment comments
function parseIncrementComment(text) {
  const increments = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  const monthMap = {
    'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April',
    'may': 'May', 'jun': 'June', 'jul': 'July', 'aug': 'August',
    'sep': 'September', 'oct': 'October', 'nov': 'November', 'dec': 'December'
  };
  
  const USD_TO_MVR_RATE = 15.4; // Exchange rate: 1 USD = 15.4 MVR
  
  // First pass: find dates and their associated amounts
  let currentEffectiveDate = null;
  let currentReason = '';
  
  lines.forEach(line => {
    const dateMatch = line.match(/(?:given from|increased from|added from|increment of|onward|from)\s*(.+?)(?:\n|$)/i);
    
    if (dateMatch) {
      const dateStr = dateMatch[1].trim();
      const monthMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{2,4})?/i);
      if (monthMatch) {
        const monthAbbr = monthMatch[1].toLowerCase();
        const month = monthMap[monthAbbr] || monthMatch[1];
        const year = monthMatch[2] || '2026';
        currentEffectiveDate = `${month} 1, ${year}`;
        currentReason = line.trim();
      }
    }
    
    // Check if this line has an amount
    const currencyMatch = line.match(/(Rf|MVR|USD)/i);
    const amountMatch = line.match(/(?:Rf|MVR|USD)?\s*[\d,]+\.?\d*\s*\/-/i) || line.match(/(?:Rf|MVR|USD)?\s*[\d,]+\.?\d*/i);
    
    if (amountMatch) {
      const amountStr = amountMatch[0].replace(/[^0-9.]/g, '');
      let amount = parseFloat(amountStr);
      
      // Skip if this looks like a year (e.g., 2025, 2026)
      if (amount > 2000 && amount < 2100 && !currencyMatch) {
        return; // This is likely a year, not an amount
      }
      
      let currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'MVR';
      let reason = currentReason || line.trim();
      
      // Convert USD to MVR
      if (currency === 'USD') {
        const originalAmount = amount;
        amount = Math.round(amount * USD_TO_MVR_RATE);
        reason = reason.replace(/USD\s*[\d,]+\.?\d*/i, `MVR ${amount.toLocaleString()}`);
        console.log(`Converted USD ${originalAmount} to MVR ${amount} (rate: ${USD_TO_MVR_RATE})`);
      }

      // Normalize Rf to MVR in reason
      reason = reason.replace(/Rf\s*/gi, 'MVR ');
      
      let effectiveDate = currentEffectiveDate;
      
      // If no date found in previous lines, check current line
      if (!effectiveDate) {
        const lineDateMatch = line.match(/(?:given from|increased from|added from|increment of|onward|from)\s*(.+?)(?:\n|$)/i);
        if (lineDateMatch) {
          const dateStr = lineDateMatch[1].trim();
          const monthMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{2,4})?/i);
          if (monthMatch) {
            const monthAbbr = monthMatch[1].toLowerCase();
            const month = monthMap[monthAbbr] || monthMatch[1];
            const year = monthMatch[2] || '2026';
            effectiveDate = `${month} 1, ${year}`;
          }
        } else {
          // If no date found, default to October 2026 (file is Oct 2026)
          effectiveDate = 'October 1, 2026';
        }
      }
      
      if (effectiveDate && amount > 0) {
        increments.push({
          amount,
          effectiveDate,
          reason
        });
      }
      
      // Reset for next increment
      currentEffectiveDate = null;
      currentReason = '';
    }
  });
  
  return increments;
}

// Process comments and match to employees
const employeeIncrements = {};
comments.forEach(comment => {
  const rowNumber = getRowNumber(comment.cell);
  const employeeName = rowToEmployee[rowNumber];
  
  if (employeeName) {
    if (!employeeIncrements[employeeName]) {
      employeeIncrements[employeeName] = [];
    }
    
    const parsedIncrements = parseIncrementComment(comment.text);
    parsedIncrements.forEach(inc => {
      employeeIncrements[employeeName].push({
        ...inc,
        author: comment.author
      });
    });
  }
});

console.log('\n=== Employee Increments ===');
Object.entries(employeeIncrements).slice(0, 5).forEach(([name, increments]) => {
  console.log(`\n${name}:`);
  increments.forEach(inc => {
    console.log(`  - ${inc.amount} from ${inc.effectiveDate}: ${inc.reason}`);
  });
});

console.log(`\nTotal employees with increments: ${Object.keys(employeeIncrements).length}`);

// Save to local JSON file first
const fs = require('fs');
const outputPath = 'salary-increments-backup.json';
fs.writeFileSync(outputPath, JSON.stringify(employeeIncrements, null, 2));
console.log(`\nSaved increments to ${outputPath}`);

// Now match with Firestore employees
async function importIncrements() {
  try {
    const employeesSnapshot = await db.collection('employees').get();
    const employees = {};
    
    employeesSnapshot.docs.forEach(doc => {
      const emp = doc.data();
      employees[emp.fullName] = doc.id;
      employees[emp.fullName.trim()] = doc.id; // Trim whitespace
      // Also check for name variations
      if (emp.name) {
        employees[emp.name] = doc.id;
        employees[emp.name.trim()] = doc.id; // Trim whitespace
      }
    });
    
    console.log('\nFirestore employees loaded:', Object.keys(employees).length);
    
    // Log all employee names for debugging
    console.log('Firestore employee names:', Object.keys(employees));
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const [employeeName, increments] of Object.entries(employeeIncrements)) {
      const employeeId = employees[employeeName];
      
      if (!employeeId) {
        console.log(`Skipping ${employeeName} - not found in Firestore`);
        skippedCount++;
        continue;
      }
      
      console.log(`Processing ${employeeName} (${employeeId})`);
      console.log(`  Increments to process:`, increments);
      
      // Get current salary record
      const salarySnapshot = await db.collection('salary_records')
        .where('employeeId', '==', employeeId)
        .get();
      
      let currentSalary = 0;
      if (!salarySnapshot.empty) {
        const salaryDoc = salarySnapshot.docs[0];
        const salary = salaryDoc.data();
        currentSalary = salary.basicSalary + salary.otAllowances + salary.otherAllowances +
          salary.attendanceAllowance + salary.livingAllowance +
          salary.foodAllowance + salary.fridayAllowance;
        console.log(`  Current salary found: ${currentSalary}`);
      } else {
        console.log(`  No salary record found, using 0 as base`);
      }
      
      // Get existing increments to calculate the correct base salary
      const existingIncrementsSnapshot = await db.collection('salary_increments')
        .where('employeeId', '==', employeeId)
        .get();
      
      if (!existingIncrementsSnapshot.empty) {
        // Sort existing increments by effective date
        const existingIncrements = existingIncrementsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
        
        // Find the latest increment and use its newSalary as the base
        const latestIncrement = existingIncrements[existingIncrements.length - 1];
        currentSalary = latestIncrement.newSalary;
        console.log(`  Using latest increment newSalary as base: ${currentSalary}`);
      }
      
      // Process increments in chronological order (oldest first)
      // Sort increments by effective date
      const sortedIncrements = increments.sort((a, b) => 
        new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
      );
      
      for (const inc of sortedIncrements) {
        const incrementAmount = inc.amount;
        const newSalary = currentSalary + incrementAmount;
        const incrementPercentage = currentSalary > 0 ? (incrementAmount / currentSalary) * 100 : 0;
        
        // Check if already exists (by amount, reason, and effective date)
        const existingSnapshot = await db.collection('salary_increments')
          .where('employeeId', '==', employeeId)
          .where('incrementAmount', '==', incrementAmount)
          .where('reason', '==', inc.reason)
          .where('effectiveDate', '==', new Date(inc.effectiveDate))
          .get();
        
        if (!existingSnapshot.empty) {
          console.log(`  - Skipping duplicate: ${incrementAmount} from ${inc.effectiveDate}`);
        } else {
          const effectiveDate = new Date(inc.effectiveDate);
          
          await db.collection('salary_increments').add({
            employeeId,
            employeeName,
            previousSalary: currentSalary,
            newSalary,
            incrementAmount,
            incrementPercentage,
            reason: inc.reason,
            effectiveDate,
            status: 'Approved',
            createdAt: new Date(),
            createdBy: inc.author || 'System'
          });
          
          console.log(`  + Added increment: ${incrementAmount} from ${inc.effectiveDate} (previous: ${currentSalary}, new: ${newSalary})`);
          addedCount++;
          
          // Update current salary for next increment
          currentSalary = newSalary;
        }
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Increments added: ${addedCount}`);
    console.log(`Employees skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error importing increments:', error);
  }
}

importIncrements().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
