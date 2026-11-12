const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { cert } = require('firebase-admin/app');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixIncrementSalaries() {
  try {
    console.log('Fetching all salary increments...');
    
    // Get all increments
    const incrementsSnapshot = await db.collection('salary_increments').get();
    
    if (incrementsSnapshot.empty) {
      console.log('No increments found');
      return;
    }
    
    // Group by employee
    const employeeIncrements = {};
    incrementsSnapshot.docs.forEach(doc => {
      const increment = { id: doc.id, ...doc.data() };
      if (!employeeIncrements[increment.employeeId]) {
        employeeIncrements[increment.employeeId] = [];
      }
      employeeIncrements[increment.employeeId].push(increment);
    });
    
    console.log(`Found ${Object.keys(employeeIncrements).length} employees with increments`);
    
    // Process each employee's increments
    let updatedCount = 0;
    for (const [employeeId, increments] of Object.entries(employeeIncrements)) {
      // Sort by effective date (oldest first)
      increments.sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
      
      // Get current salary from salary_records (this is the salary AFTER all increments)
      const salarySnapshot = await db.collection('salary_records')
        .where('employeeId', '==', employeeId)
        .get();
      
      let baseSalary;
      let hasSalaryRecord = !salarySnapshot.empty;
      
      if (hasSalaryRecord) {
        // Calculate base salary by subtracting total increments from current salary
        const salary = salarySnapshot.docs[0].data();
        const currentSalary = salary.basicSalary + salary.otAllowances + salary.otherAllowances +
          salary.attendanceAllowance + salary.livingAllowance +
          salary.foodAllowance + salary.fridayAllowance;
        const totalIncrementAmount = increments.reduce((sum, inc) => sum + inc.incrementAmount, 0);
        baseSalary = currentSalary - totalIncrementAmount;
      } else {
        // Use the first increment's previousSalary as the base salary
        baseSalary = increments[0].previousSalary || 0;
      }
      
      console.log(`\nProcessing ${increments[0].employeeName} (${employeeId})`);
      console.log(`  Has salary record: ${hasSalaryRecord}`);
      console.log(`  Base salary (before any increments): ${baseSalary}`);
      
      // Recalculate each increment starting from base salary
      let runningSalary = baseSalary;
      
      for (const increment of increments) {
        const newSalary = runningSalary + increment.incrementAmount;
        const incrementPercentage = runningSalary > 0 ? (increment.incrementAmount / runningSalary) * 100 : 0;
        
        // Check if values need updating
        const needsUpdate = 
          increment.previousSalary !== runningSalary ||
          increment.newSalary !== newSalary ||
          Math.abs(increment.incrementPercentage - incrementPercentage) > 0.1;
        
        if (needsUpdate) {
          console.log(`  Updating increment ${increment.id}:`);
          console.log(`    Previous: ${increment.previousSalary} -> ${runningSalary}`);
          console.log(`    New: ${increment.newSalary} -> ${newSalary}`);
          console.log(`    Percentage: ${increment.incrementPercentage}% -> ${incrementPercentage.toFixed(1)}%`);
          
          await db.collection('salary_increments').doc(increment.id).update({
            previousSalary: runningSalary,
            newSalary: newSalary,
            incrementPercentage: incrementPercentage
          });
          
          updatedCount++;
        }
        
        runningSalary = newSalary;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Increments updated: ${updatedCount}`);
    console.log('Done');
    
  } catch (error) {
    console.error('Error fixing increment salaries:', error);
  }
}

fixIncrementSalaries();
