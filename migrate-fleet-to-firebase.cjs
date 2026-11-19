const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Load JSON data
const airportPassData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fleets', 'airport_pass_updates.json'), 'utf-8'));
const licenseData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fleets', 'license_updates.json'), 'utf-8'));
const vehicleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fleets', 'vehicle_updates.json'), 'utf-8'));

function findEmployeeId(employees, name) {
  // Try exact match first
  if (employees[name]) return employees[name];
  
  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [fullName, id] of Object.entries(employees)) {
    if (fullName.toLowerCase() === lowerName) return id;
  }
  
  // Try partial match
  for (const [fullName, id] of Object.entries(employees)) {
    if (fullName.toLowerCase().includes(lowerName) || lowerName.includes(fullName.toLowerCase())) {
      return id;
    }
  }
  
  return null;
}

async function migrateAirportPasses() {
  console.log('Migrating Airport Passes...');
  const employeesSnapshot = await db.collection('employees').get();
  const employees = {};
  employeesSnapshot.forEach(doc => {
    employees[doc.data().fullName] = doc.id;
  });

  for (const item of airportPassData) {
    const employeeId = findEmployeeId(employees, item.name);
    if (!employeeId) {
      console.log(`Skipping airport pass for ${item.name} - employee not found`);
      continue;
    }

    const data = {
      employeeId,
      employeeName: item.name,
      section: item.section,
      category: item.category,
      passNo: item.passNo,
      expiryDate: item.expiryDate,
      daysLeft: item.daysLeft,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    await db.collection('airportPasses').add(data);
    console.log(`Added airport pass for ${item.name}`);
  }
  console.log('Airport Passes migration complete');
}

async function migrateLicenses() {
  console.log('Migrating Licenses...');
  const employeesSnapshot = await db.collection('employees').get();
  const employees = {};
  employeesSnapshot.forEach(doc => {
    employees[doc.data().fullName] = doc.id;
  });

  for (const item of licenseData) {
    const employeeId = findEmployeeId(employees, item.name);
    if (!employeeId) {
      console.log(`Skipping license for ${item.name} - employee not found`);
      continue;
    }

    const data = {
      employeeId,
      employeeName: item.name,
      category: item.category,
      licenseNo: item.licenseNo,
      expiryDate: item.expiryDate,
      daysLeft: item.daysLeft,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    await db.collection('licenses').add(data);
    console.log(`Added license for ${item.name}`);
  }
  console.log('Licenses migration complete');
}

async function migrateVehicles() {
  console.log('Migrating Vehicles...');
  for (const item of vehicleData) {
    const data = {
      vehicleNo: item.vehicleNo,
      registration: item.registration,
      model: item.model,
      type: item.type,
      insuranceExpiry: item.insuranceExpiry,
      roadTaxExpiry: item.roadTaxExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    await db.collection('vehicles').add(data);
    console.log(`Added vehicle ${item.vehicleNo}`);
  }
  console.log('Vehicles migration complete');
}

async function migrateAll() {
  try {
    await migrateAirportPasses();
    await migrateLicenses();
    await migrateVehicles();
    console.log('All migrations complete!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateAll();
