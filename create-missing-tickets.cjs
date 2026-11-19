const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, addDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJ7C3gIVVpt5uGBy-Y-7WZsmqZJK4V7Mg",
  authDomain: "madihaa-hrms-v2.firebaseapp.com",
  projectId: "madihaa-hrms-v2",
  storageBucket: "madihaa-hrms-v2.firebasestorage.app",
  messagingSenderId: "877220183240",
  appId: "1:877220183240:web:39d1c6b5cd686fa664b9fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createMissingTickets() {
  try {
    console.log('Fetching approved leave requests with ticketRequired=true...');
    
    // Get all approved leaves with ticketRequired=true
    const leavesQuery = query(
      collection(db, 'leave_requests'),
      where('status', '==', 'approved'),
      where('ticketRequired', '==', true)
    );
    
    const leaveSnapshot = await getDocs(leavesQuery);
    const leaves = leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${leaves.length} approved leaves with ticketRequired=true`);
    
    // Get existing ticket requests
    const ticketsSnapshot = await getDocs(collection(db, 'ticketRequests'));
    const existingTicketLeaveIds = ticketsSnapshot.docs.map(doc => doc.data().leaveId);
    
    console.log(`Found ${existingTicketLeaveIds.length} existing ticket requests`);
    
    // Find leaves without tickets
    const leavesWithoutTickets = leaves.filter(leave => !existingTicketLeaveIds.includes(leave.id));
    
    console.log(`Found ${leavesWithoutTickets.length} leaves without ticket requests`);
    
    if (leavesWithoutTickets.length === 0) {
      console.log('No missing tickets to create');
      return;
    }
    
    // Create ticket requests for each leave
    for (const leave of leavesWithoutTickets) {
      try {
        const startDate = leave.startDate?.toDate ? leave.startDate.toDate() : new Date(leave.startDate);
        const endDate = leave.endDate?.toDate ? leave.endDate.toDate() : new Date(leave.endDate);
        
        await addDoc(collection(db, 'ticketRequests'), {
          employeeId: leave.employeeId,
          leaveId: leave.id,
          departureCity: 'Male',
          destinationCity: leave.employeeId?.includes('MAD') ? 'Colombo' : 'Unknown',
          departureDate: startDate,
          returnDate: endDate,
          ticketType: 'round_trip',
          passengers: 1,
          specialRequests: '',
          status: 'price_requested',
          bookedDate: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✓ Created ticket for leave ${leave.id} (employee: ${leave.employeeId})`);
      } catch (error) {
        console.error(`✗ Failed to create ticket for leave ${leave.id}:`, error.message);
      }
    }
    
    console.log('Done! Created ticket requests for missing leaves.');
  } catch (error) {
    console.error('Error:', error);
  }
}

createMissingTickets();
