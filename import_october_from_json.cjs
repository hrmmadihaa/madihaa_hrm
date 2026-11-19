const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read the October leave data from JSON
const octoberLeaves = JSON.parse(fs.readFileSync('past_leaves/employee_leaves_october_2026.json', 'utf8'));

// Import to Firebase as leave requests
async function importLeaves() {
  let successCount = 0;
  let errorCount = 0;
  
  // First, load all employees into a map to avoid repeated queries
  console.log('Loading all employees...');
  const employeesSnapshot = await db.collection('employees').get();
  const employeeMap = new Map();
  employeesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    employeeMap.set(data.employeeId, doc.id);
  });
  console.log(`Loaded ${employeeMap.size} employees into map`);
  
  // Group leaves by employee
  const leavesByEmployee = new Map();
  for (const record of octoberLeaves) {
    const empId = record.employee_id;
    if (!leavesByEmployee.has(empId)) {
      leavesByEmployee.set(empId, []);
    }
    leavesByEmployee.get(empId).push(record);
  }
  
  console.log(`Found leaves for ${leavesByEmployee.size} employees`);
  
  let batch = db.batch();
  let batchSize = 0;
  const MAX_BATCH_SIZE = 400; // Firestore batch limit is 500 operations
  
  for (const [empId, leaves] of leavesByEmployee) {
    // Get employee ID from map
    const employeeId = employeeMap.get(empId);
    if (!employeeId) {
      console.log(`Employee ${empId} not found in Firestore`);
      errorCount += leaves.length;
      continue;
    }
    
    // Group consecutive days with same leave type
    leaves.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentGroup = null;
    const leaveGroups = [];
    
    for (const leave of leaves) {
      const leaveDate = new Date(leave.date);
      const leaveType = leave.leave_type;
      
      // Map leave types to system types
      let mappedType = 'annual';
      if (['Sick', 'SICK', 'SICK / MC', 'INFO SICK', 'MC'].includes(leaveType)) {
        mappedType = 'medical';
      } else if (['EL', 'Emergency Leave'].includes(leaveType)) {
        mappedType = 'emergency';
      } else if (['Accident /Hospital'].includes(leaveType)) {
        mappedType = 'medical';
      } else if (leaveType === 'AL') {
        mappedType = 'annual';
      } else if (leaveType === 'OFF') {
        mappedType = 'off_day';
      }
      
      if (!currentGroup) {
        currentGroup = {
          startDate: leaveDate,
          endDate: leaveDate,
          type: mappedType,
          days: 1
        };
      } else {
        // Check if consecutive day and same type
        const prevDate = new Date(currentGroup.endDate);
        prevDate.setDate(prevDate.getDate() + 1);
        
        if (prevDate.getTime() === leaveDate.getTime() && currentGroup.type === mappedType) {
          currentGroup.endDate = leaveDate;
          currentGroup.days++;
        } else {
          leaveGroups.push(currentGroup);
          currentGroup = {
            startDate: leaveDate,
            endDate: leaveDate,
            type: mappedType,
            days: 1
          };
        }
      }
    }
    
    if (currentGroup) {
      leaveGroups.push(currentGroup);
    }
    
    // Create leave requests for each group
    for (const group of leaveGroups) {
      try {
        const leaveRequest = {
          employeeId: employeeId,
          type: group.type,
          startDate: admin.firestore.Timestamp.fromDate(group.startDate),
          endDate: admin.firestore.Timestamp.fromDate(group.endDate),
          days: group.days,
          reason: `Imported from October 2026 leave data (${group.type})`,
          status: 'approved',
          appliedDate: admin.firestore.Timestamp.fromDate(new Date('2026-10-01')),
          approvals: [{
            level: 1,
            approverId: 'system',
            approverName: 'System Import',
            status: 'approved',
            actionDate: admin.firestore.Timestamp.fromDate(new Date('2026-10-01')),
            comments: 'Auto-imported from historical data'
          }],
          balanceAdjusted: true,
          attachments: []
        };
        
        // Add to batch
        const docRef = db.collection('leave_requests').doc();
        batch.set(docRef, leaveRequest);
        batchSize++;
        successCount++;
        
        // Commit batch when it reaches max size
        if (batchSize >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed: ${batchSize} operations`);
          batch = db.batch();
          batchSize = 0;
          // Wait to avoid quota issues
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Error creating leave request:`, error.message);
        errorCount++;
      }
    }
  }
  
  // Commit remaining batch
  if (batchSize > 0) {
    await batch.commit();
    console.log(`Final batch committed: ${batchSize} operations`);
  }
  
  console.log(`\nImport complete: ${successCount} successful, ${errorCount} errors`);
}

importLeaves().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
