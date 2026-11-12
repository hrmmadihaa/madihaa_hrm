const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { cert } = require('firebase-admin/app');

// Initialize Firebase Admin
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Employees to add
const employeesToAdd = [
  {
    fullName: 'Aminath Shafana',
    staffId: 'MAD0662',
    dateOfJoin: new Date(45600 * 86400000), // Excel date to JS date
    location: 'Head Office',
    designation: 'Manager-Business Development',
    nationality: 'Maldivian',
    bankName: 'Bank of Maldives',
    accountNo: '7701164369101',
    status: 'Active',
    createdAt: new Date()
  },
  {
    fullName: 'Fathmath Hana',
    staffId: 'MAD0006',
    dateOfJoin: new Date(41326 * 86400000),
    location: 'Head Office',
    designation: 'Finance Controller',
    nationality: 'Maldivian',
    bankName: 'MIB',
    accountNo: '90103101235651000',
    status: 'Active',
    createdAt: new Date()
  },
  {
    fullName: 'Hussain Mahir',
    staffId: 'MAD0257',
    dateOfJoin: new Date(43591 * 86400000),
    location: 'Head Office',
    designation: 'Office Admin Manager',
    nationality: 'Maldivian',
    bankName: 'Bank of Maldives',
    accountNo: '7730000111286',
    status: 'Active',
    createdAt: new Date()
  },
  {
    fullName: 'Ahmed Rizny',
    staffId: 'MAD0689',
    dateOfJoin: new Date(45785 * 86400000),
    location: 'H/M Site',
    designation: 'Supervisor',
    nationality: 'Maldivian',
    bankName: 'Bank of Maldives',
    accountNo: '7701221441101',
    status: 'Active',
    createdAt: new Date()
  },
  {
    fullName: 'Ismail Shareef',
    staffId: 'MAD0784',
    dateOfJoin: new Date(46271 * 86400000),
    location: 'Head Office',
    designation: 'Maintenance Supervisor',
    nationality: 'Maldivian',
    bankName: 'Bank of Maldives',
    accountNo: '7704262687101',
    status: 'Active',
    createdAt: new Date()
  }
];

async function addEmployees() {
  try {
    console.log('Adding employees to Firestore...');
    
    for (const emp of employeesToAdd) {
      // Check if employee already exists by staffId
      const existingSnapshot = await db.collection('employees')
        .where('staffId', '==', emp.staffId)
        .get();
      
      if (!existingSnapshot.empty) {
        console.log(`Skipping ${emp.fullName} - already exists with staffId ${emp.staffId}`);
        continue;
      }
      
      // Add employee
      const docRef = await db.collection('employees').add(emp);
      console.log(`+ Added ${emp.fullName} (ID: ${docRef.id})`);
    }
    
    console.log('\n=== Summary ===');
    console.log('Employees added successfully');
    
  } catch (error) {
    console.error('Error adding employees:', error);
  }
}

addEmployees();
