import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZ4Uf6JeRkkSj4W6LGl7OcQL9Dn0EsdFM",
  authDomain: "madihaa-hrm.firebaseapp.com",
  projectId: "madihaa-hrm",
  storageBucket: "madihaa-hrm.firebasestorage.app",
  messagingSenderId: "530461998768",
  appId: "1:530461998768:web:9e516eb075705679c14575",
  measurementId: "G-V6565Z0E8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load mappings
const mappings = JSON.parse(fs.readFileSync('./cloudinary-mappings.json', 'utf-8'));

// Update employee records
async function updateEmployeePhotos() {
  console.log('=== Updating employee photos in Firestore ===\n');

  const employeesSnapshot = await getDocs(collection(db, 'employees'));
  const employees = [];
  employeesSnapshot.forEach(doc => {
    employees.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Found ${employees.length} employees\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  for (const employee of employees) {
    const employeeId = employee.employeeId;
    
    if (!employeeId) {
      console.log(`⚠️  Employee has no employeeId, skipping`);
      skippedCount++;
      continue;
    }

    // Check if mapping exists for this employee
    const cloudinaryUrl = mappings[employeeId];
    
    if (!cloudinaryUrl) {
      console.log(`⚠️  No Cloudinary mapping for ${employeeId}, skipping`);
      notFoundCount++;
      continue;
    }

    // Check if already has Cloudinary URL
    if (employee.photo && employee.photo.startsWith('https://res.cloudinary.com')) {
      console.log(`✓ ${employeeId} already has Cloudinary URL, skipping`);
      skippedCount++;
      continue;
    }

    try {
      await updateDoc(doc(db, 'employees', employee.id), {
        photo: cloudinaryUrl
      });
      console.log(`✓ Updated ${employeeId}`);
      updatedCount++;
    } catch (error) {
      console.error(`✗ Failed to update ${employeeId}:`, error.message);
    }
  }

  console.log('\n=== Update Summary ===');
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`No mapping found: ${notFoundCount}`);
  console.log(`Total employees: ${employees.length}`);
}

// Run update
updateEmployeePhotos()
  .then(() => {
    console.log('\nUpdate complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
