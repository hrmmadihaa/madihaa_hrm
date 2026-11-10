# Excel Import Guide

This guide explains how to extract salary increment comments from Excel files and import them into the HRM system, as well as how to extract and import salary data.

## Table of Contents
- [Extracting and Importing Salary Increment Comments](#extracting-and-importing-salary-increment-comments)
- [Extracting and Importing Salary Data](#extracting-and-importing-salary-data)

---

## Extracting and Importing Salary Increment Comments

### Prerequisites
- Excel file with salary increment comments
- Firebase Admin SDK service account key (`madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json`)
- Node.js with required packages: `xlsx`, `firebase-admin`

### Step 1: Remove Password from Excel File

If the Excel file is password-protected:
1. Open the file in Excel with the password
2. Go to **File** → **Save As**
3. Choose **Excel Workbook (*.xlsx)** format
4. Click **Tools** → **General Options**
5. Delete the password from the "Password to open" field
6. Click **OK** and save the file

### Step 2: Extract Comments from Excel

Use the `read-comments.cjs` script to extract comments:

```bash
node read-comments.cjs
```

This will:
- Read the Excel file (`Madihaa_Foreign _Male Salary_Oct 2026 no password.xlsx`)
- Extract all cell comments
- Match comments to employee names based on row numbers
- Save results to `excel-comments-detailed.txt`

**Output file structure:**
```
Cell O5 (Row 5) - Employee: [Employee Name]
Author: [Author Name]
Comment: [Comment Text]
---
```

### Step 3: Review the Extracted Comments

Open `excel-comments-detailed.txt` to review:
- Total comments found
- Employee names matched to each comment
- Increment amounts and dates
- Comment authors

### Step 4: Import Comments to Firestore

Use the `import-increments-from-comments.cjs` script:

```bash
node import-increments-from-comments.cjs
```

This will:
- Parse increment comments to extract:
  - Increment amount (Rf, MVR, USD)
  - Effective date (month/year)
  - Reason text
- Match employee names to Firestore employee IDs
- Create salary increment records in the `salary_increments` collection
- Skip duplicates (based on amount and reason)
- Mark all imported increments as "Approved"

**Import logic:**
- Comments are parsed to extract increment amounts and dates
- Dates are formatted as "Month 1, Year" (e.g., "January 1, 2026")
- Employee names are matched against `fullName` field in Firestore
- For each increment, the script:
  - Calculates the new salary (current + increment)
  - Calculates increment percentage
  - Creates a record with status "Approved"
  - Sets `createdBy` to the comment author or "System"

**Sample output:**
```
Total comments found: 92
Total employees with increments: 76
Firestore employees loaded: 167
Processing [Employee Name] ([Employee ID])
  + Added increment: 500 from November 1, 2025
  + Added increment: 1000 from April 1, 26

=== Summary ===
Increments added: 35
Employees skipped: 50
```

### Step 5: Verify Import

Check the Salary page in the HRM system:
1. Navigate to the Salary page
2. Click "View Increment History"
3. Select an employee to view their increment history
4. Verify that imported increments appear with correct dates and amounts

---

## Extracting and Importing Salary Data

### Prerequisites
- Excel file with salary data
- Firebase Admin SDK service account key
- Node.js with required packages: `xlsx`, `firebase-admin`

### Step 1: Prepare Excel File

Ensure the Excel file has the correct structure:
- Header row with column names
- Employee names in a consistent column
- Salary components (basic salary, OT allowances, other allowances, etc.)
- No password protection

### Step 2: Create Migration Script

Create a migration script (e.g., `migrate-salaries.cjs`) with the following structure:

```javascript
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
const workbook = XLSX.readFile('your-salary-file.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Process and import
async function migrateSalaries() {
  for (const row of data) {
    // Match employee by name or ID
    const employeeSnapshot = await db.collection('employees')
      .where('fullName', '==', row['Employee Name'])
      .get();
    
    if (employeeSnapshot.empty) {
      console.log(`Skipping ${row['Employee Name']} - not found`);
      continue;
    }
    
    const employeeId = employeeSnapshot.docs[0].id;
    
    // Create or update salary record
    await db.collection('salary_records').add({
      employeeId,
      employeeName: row['Employee Name'],
      basicSalary: row['Basic Salary'] || 0,
      otAllowances: row['OT Allowance'] || 0,
      otherAllowances: row['Other Allowances'] || 0,
      attendanceAllowance: row['Attendance Allowance'] || 0,
      livingAllowance: row['Living Allowance'] || 0,
      foodAllowance: row['Food Allowance'] || 0,
      fridayAllowance: row['Friday Allowance'] || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Imported salary for ${row['Employee Name']}`);
  }
}

migrateSalaries().then(() => {
  console.log('Migration complete');
  process.exit(0);
});
```

### Step 3: Run Migration Script

```bash
node migrate-salaries.cjs
```

### Step 4: Verify Import

Check the Salary page to ensure:
- All employees have salary records
- Salary components are correctly populated
- Total salaries are calculated correctly

---

## Common Issues and Solutions

### Issue: File is password-protected
**Solution:** Remove the password in Excel before processing (see Step 1 above).

### Issue: Employee names don't match
**Solution:** 
- Check for spelling differences (extra spaces, different case)
- Update the script to use fuzzy matching
- Manually update employee names in Firestore to match Excel

### Issue: Invalid date format
**Solution:** The script automatically formats dates as "Month 1, Year". If you encounter errors, check the date parsing logic in the script.

### Issue: Duplicate increments
**Solution:** The script automatically skips duplicates based on amount and reason. If you need to re-import, delete existing records first.

### Issue: Module not found errors
**Solution:** Install required packages:
```bash
npm install xlsx firebase-admin
```

---

## File Structure Reference

### Excel File Structure for Comments
- Row 1-2: Title/headers
- Row 3: Column headers (NAME, Staff ID, etc.)
- Row 4+: Employee data
- Comments: Attached to individual cells (typically in columns N, O, P)

### Excel File Structure for Salary Data
- Header row with column names
- Employee identification (Name, Staff ID)
- Salary components:
  - Basic Salary
  - OT Allowance
  - Other Allowances
  - Attendance Allowance
  - Living Allowance
  - Food Allowance
  - Friday Allowance

### Firestore Collections
- `employees`: Employee records with `fullName` field
- `salary_records`: Current salary records per employee
- `salary_increments`: Historical increment records

---

## Scripts Reference

### read-comments.cjs
Extracts comments from Excel and saves to text file.

**Usage:**
```bash
node read-comments.cjs
```

**Output:** `excel-comments-detailed.txt`

### import-increments-from-comments.cjs
Imports extracted comments as salary increment records.

**Usage:**
```bash
node import-increments-from-comments.cjs
```

**Requirements:**
- `madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json` in project root
- Excel file: `Madihaa_Foreign _Male Salary_Oct 2026 no password.xlsx`

### migrate-salaries.cjs
Migrates salary data from Excel to Firestore.

**Usage:**
```bash
node migrate-salaries.cjs
```

**Customization:** Update the script to match your Excel file structure.

---

## Best Practices

1. **Always backup data** before running import scripts
2. **Test with a small sample** first before importing all data
3. **Review the extracted data** in the text file before importing
4. **Handle duplicates** by checking existing records before importing
5. **Use consistent naming** for employees across Excel and Firestore
6. **Document your Excel structure** for future reference
7. **Keep service account key secure** - never commit it to version control

---

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify Excel file structure matches expected format
3. Ensure Firebase Admin SDK is properly configured
4. Check network connectivity for Firestore operations
