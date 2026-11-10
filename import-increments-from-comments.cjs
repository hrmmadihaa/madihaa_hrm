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
const workbook = XLSX.readFile('Madihaa_Foreign _Male Salary_Oct 2026 no password.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Header is at row 3 (index 2), employee names are in column 1 (index 1)
const nameColIndex = 1;

// Create row to employee mapping (data starts at row 4, which is index 3)
const rowToEmployee = {};
data.forEach((row, index) => {
  if (index < 3) return; // Skip header rows
  const rowNumber = index + 1; // Excel rows are 1-indexed
  if (row[nameColIndex]) {
    rowToEmployee[rowNumber] = row[nameColIndex];
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
  
  lines.forEach(line => {
    // Match patterns like "Rf 500 increment given from April 26" or "USD 50 increment..."
    const currencyMatch = line.match(/(Rf|MVR|USD)/i);
    const amountMatch = line.match(/(?:Rf|MVR|USD)\s*[\d,]+\.?\d*/i);
    const dateMatch = line.match(/(?:given from|increased from|added from|increment of)\s*(.+?)(?:\n|$)/i);
    
    if (amountMatch) {
      const amountStr = amountMatch[0].replace(/[^0-9.]/g, '');
      let amount = parseFloat(amountStr);
      let currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'MVR';
      let reason = line.trim();
      
      // Convert USD to MVR
      if (currency === 'USD') {
        const originalAmount = amount;
        amount = Math.round(amount * USD_TO_MVR_RATE);
        reason = reason.replace(/USD\s*[\d,]+\.?\d*/i, `MVR ${amount.toLocaleString()}`);
        console.log(`Converted USD ${originalAmount} to MVR ${amount} (rate: ${USD_TO_MVR_RATE})`);
      }

      // Normalize Rf to MVR in reason
      reason = reason.replace(/Rf\s*/gi, 'MVR ');
      
      let effectiveDate = null;
      if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        // Parse date (e.g., "April 26", "Oct 2026", "JULY 25")
        const monthMatch = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{2,4})?/i);
        if (monthMatch) {
          const monthAbbr = monthMatch[1].toLowerCase();
          const month = monthMap[monthAbbr] || monthMatch[1];
          const year = monthMatch[2] || '2026';
          effectiveDate = `${month} 1, ${year}`; // Default to day 1 if not specified
        }
      }
      
      if (effectiveDate) {
        increments.push({
          amount,
          effectiveDate,
          reason
        });
      }
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

// Now match with Firestore employees
async function importIncrements() {
  try {
    const employeesSnapshot = await db.collection('employees').get();
    const employees = {};
    
    employeesSnapshot.docs.forEach(doc => {
      const emp = doc.data();
      employees[emp.fullName] = doc.id;
      // Also check for name variations
      if (emp.name) {
        employees[emp.name] = doc.id;
      }
    });
    
    console.log('\nFirestore employees loaded:', Object.keys(employees).length);
    
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
      }
      
      // Process increments in reverse chronological order
      for (const inc of increments) {
        const incrementAmount = inc.amount;
        const newSalary = currentSalary + incrementAmount;
        const incrementPercentage = currentSalary > 0 ? (incrementAmount / currentSalary) * 100 : 0;
        
        // Check if already exists (by amount and reason)
        const existingSnapshot = await db.collection('salary_increments')
          .where('employeeId', '==', employeeId)
          .where('incrementAmount', '==', incrementAmount)
          .where('reason', '==', inc.reason)
          .get();
        
        if (!existingSnapshot.empty) {
          console.log(`  - Skipping duplicate: ${incrementAmount} from ${inc.effectiveDate}`);
          continue;
        }
        
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
        
        console.log(`  + Added increment: ${incrementAmount} from ${inc.effectiveDate}`);
        addedCount++;
        
        // Update current salary for next increment
        currentSalary = newSalary;
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
