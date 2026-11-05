import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read payroll data
const payrollDataPath = path.join(__dirname, '../payroll_data.json');
const payrollData = JSON.parse(fs.readFileSync(payrollDataPath, 'utf8'));

async function updateEmployeeSalaries() {
  console.log(`Starting salary update for ${payrollData.length} employees...`);
  
  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const payroll of payrollData) {
    try {
      // Find employee by staffId
      const employeesRef = db.collection('employees');
      const query = employeesRef.where('employeeId', '==', payroll.staffId);
      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log(`Employee not found: ${payroll.staffId} - ${payroll.name}`);
        notFound++;
        continue;
      }

      // Update each matching employee (should be only one)
      for (const doc of snapshot.docs) {
        const updateData = {
          salary: payroll.salary.toString(),
          salaryAllowances: {
            basicSalary: payroll.salary,
            otherAllowances: payroll.otherAllowances,
            otAllowance: payroll.otAllowance,
            attendanceAllowance: payroll.attendanceAllowance || 0,
            livingAllowance: payroll.livingAllowance || 0,
            fridayAllowance: payroll.fridayAllowance || 0,
          },
          designation: payroll.designation,
          workLocation: payroll.location,
          country: payroll.nationality || null,
          bankAccountNumber: payroll.accountNo || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await doc.ref.update(updateData);
        console.log(`Updated: ${payroll.staffId} - ${payroll.name}`);
        updated++;
      }
    } catch (error) {
      console.error(`Error updating ${payroll.staffId}:`, error.message);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total processed: ${payrollData.length}`);

  process.exit(0);
}

updateEmployeeSalaries().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
