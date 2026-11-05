const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setCustomClaims() {
  const email = 'leela@madihaahrms.com';
  const role = 'supervisor';

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('Found user:', userRecord.uid);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    console.log(`Successfully set role "${role}" for ${email}`);

    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('Custom claims:', updatedUser.customClaims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
  } finally {
    process.exit();
  }
}

setCustomClaims();
