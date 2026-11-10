const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function deleteUSDIncrements() {
  try {
    console.log('Fetching salary increments...');
    const snapshot = await db.collection('salary_increments').get();
    
    let deletedCount = 0;
    let keptCount = 0;
    
    for (const doc of snapshot.docs) {
      const increment = doc.data();
      const reason = increment.reason || '';
      
      // Check if reason contains USD
      if (reason.includes('USD')) {
        await db.collection('salary_increments').doc(doc.id).delete();
        console.log(`Deleted: ${increment.employeeName} - ${reason}`);
        deletedCount++;
      } else {
        keptCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Kept: ${keptCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteUSDIncrements().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
