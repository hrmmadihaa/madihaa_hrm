const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function normalizeCurrencyInReasons() {
  try {
    console.log('Fetching salary increments...');
    const snapshot = await db.collection('salary_increments').get();
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      const increment = doc.data();
      const reason = increment.reason || '';
      
      // Check if reason contains Rf
      if (reason.includes('Rf')) {
        const newReason = reason.replace(/Rf\s*/gi, 'MVR ');
        await db.collection('salary_increments').doc(doc.id).update({
          reason: newReason
        });
        console.log(`Updated: ${increment.employeeName} - "${reason}" -> "${newReason}"`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

normalizeCurrencyInReasons().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
