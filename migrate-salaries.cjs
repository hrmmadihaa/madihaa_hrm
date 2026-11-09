const admin = require('firebase-admin');
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateSalaries() {
  try {
    console.log('Starting salary component migration...');
    
    // Get all employees
    const employeesSnapshot = await db.collection('employees').get();
    
    let migratedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doc of employeesSnapshot.docs) {
      const employee = doc.data();
      
      // Check if employee has salary data
      if (employee.salary && employee.salary > 0) {
        // Check if salary record already exists
        const existingRecord = await db.collection('salary_records')
          .where('employeeId', '==', doc.id)
          .get();
        
        // Get salary components from salaryAllowances object
        const allowances = employee.salaryAllowances || {};
        
        const salaryData = {
          employeeId: doc.id,
          employeeName: employee.fullName || employee.name,
          basicSalary: allowances.basicSalary || employee.salary || 0,
          otAllowances: allowances.otAllowance || 0,
          otherAllowances: allowances.otherAllowances || 0,
          attendanceAllowance: allowances.attendanceAllowance || 0,
          livingAllowance: allowances.livingAllowance || 0,
          foodAllowance: allowances.foodAllowance || 0,
          fridayAllowance: allowances.fridayAllowance || 0,
          currency: employee.currency || 'MVR',
          effectiveDate: employee.salaryEffectiveDate || new Date(),
          createdAt: new Date(),
        };
        
        if (existingRecord.empty) {
          // Create new salary record
          await db.collection('salary_records').add(salaryData);
          
          migratedCount++;
          console.log(`Migrated salary for: ${employee.fullName || employee.name}`);
        } else {
          // Update existing record with components
          const recordDoc = existingRecord.docs[0];
          await db.collection('salary_records').doc(recordDoc.id).update(salaryData);
          
          updatedCount++;
          console.log(`Updated salary components for: ${employee.fullName || employee.name}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\nMigration complete!`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error migrating salaries:', error);
  } finally {
    process.exit(0);
  }
}

migrateSalaries();
