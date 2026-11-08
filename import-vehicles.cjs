const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./madihaa-hrms-v2-firebase-adminsdk-fbsvc-8c88c15292.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'madihaa-hrms-v2'
});

const db = admin.firestore();

// Vehicle data from the provided list
const vehicles = [
  {
    regNo: 'AB1A-C6536',
    type: 'Van',
    tonnage: '4 people',
    roadworthinessExpiry: '2027-09-18',
    insuranceExpiry: '2027-09-23',
    annualFeeExpiry: '2026-12-31',
    chassisNo: 'DA64V-264202',
    engineNo: 'K6A-7927655'
  },
  {
    regNo: 'AC1A-C4535',
    type: 'Pickup',
    tonnage: '350 kg',
    roadworthinessExpiry: '2027-01-07',
    insuranceExpiry: '2027-04-01',
    annualFeeExpiry: '2027-01-31',
    chassisNo: 'DA16T-153769',
    engineNo: 'R06A-1500918'
  },
  {
    regNo: 'AC1A-C1753',
    type: 'Pickup',
    tonnage: '1500 kg',
    roadworthinessExpiry: '2027-01-07',
    insuranceExpiry: '2027-04-19',
    annualFeeExpiry: '2027-07-31',
    chassisNo: 'FB511 B-441254',
    engineNo: 'CA3790'
  },
  {
    regNo: 'AC1A-C4171',
    type: 'Pickup',
    tonnage: '1500 kg',
    roadworthinessExpiry: '2026-11-02',
    insuranceExpiry: '2027-01-31',
    annualFeeExpiry: '2027-10-30',
    chassisNo: 'NHR85-7008357',
    engineNo: '4JJ 1-306487'
  },
  {
    regNo: 'AC1A-C2740',
    type: 'Pickup',
    tonnage: '1500 kg',
    roadworthinessExpiry: '2027-03-28',
    insuranceExpiry: '2027-04-01',
    annualFeeExpiry: '2027-08-31',
    chassisNo: 'KDY230-7013125',
    engineNo: '2KD-1275306'
  },
  {
    regNo: 'AC1A-C2568',
    type: 'Pickup',
    tonnage: '1350 kg',
    roadworthinessExpiry: '2027-06-24',
    insuranceExpiry: '2027-09-23',
    annualFeeExpiry: '2026-11-30',
    chassisNo: 'LY132-0004339',
    engineNo: '5L·5046421'
  },
  {
    regNo: 'AC1A-C3400',
    type: 'Pickup',
    tonnage: '1450 kg',
    roadworthinessExpiry: '2026-11-02',
    insuranceExpiry: '2027-04-01',
    annualFeeExpiry: '2026-12-31',
    chassisNo: 'KDY231-8006550',
    engineNo: '1KD-2027305'
  },
  {
    regNo: 'AC2A-C1742',
    type: 'Lorry',
    tonnage: '2480 kg',
    roadworthinessExpiry: '2027-03-28',
    insuranceExpiry: '2027-01-31',
    annualFeeExpiry: '2027-03-31',
    chassisNo: 'NPR66L7431163',
    engineNo: '4HF1683888'
  },
  {
    regNo: 'AC1A-C4795',
    type: 'Refrigerator Truck',
    tonnage: '1500 kg',
    roadworthinessExpiry: '2027-06-24',
    insuranceExpiry: '2027-06-28',
    annualFeeExpiry: '2027-06-30',
    chassisNo: 'XZC605-0009144',
    engineNo: 'NO4C-UM17761'
  },
  {
    regNo: 'AC1A-P5193',
    type: 'Pickup',
    tonnage: '350 kg',
    roadworthinessExpiry: '2027-04-15',
    insuranceExpiry: '2027-04-19',
    annualFeeExpiry: '2027-03-30',
    chassisNo: 'DA16T-370098',
    engineNo: 'R06A-877384'
  },
  {
    regNo: 'AC1A-P5527',
    type: 'Pickup',
    tonnage: '350 kg',
    roadworthinessExpiry: '2027-06-24',
    insuranceExpiry: '2027-06-28',
    annualFeeExpiry: '2027-06-30',
    chassisNo: 'DA16T-430840',
    engineNo: 'R06A-2414458'
  },
  {
    regNo: 'BB1B-P8711',
    type: 'Car',
    tonnage: '',
    roadworthinessExpiry: '2026-11-03',
    insuranceExpiry: '2027-10-31',
    annualFeeExpiry: '2027-09-30',
    chassisNo: 'P15-022427',
    engineNo: 'HR12-384780C'
  },
  {
    regNo: 'BB1B-P8712',
    type: 'Car',
    tonnage: '',
    roadworthinessExpiry: '2026-11-02',
    insuranceExpiry: '2027-03-20',
    annualFeeExpiry: '2027-09-30',
    chassisNo: 'P15-046893',
    engineNo: 'HR12-416699C'
  },
  {
    regNo: 'AC1A-P6037',
    type: 'Pickup',
    tonnage: '1500kg',
    roadworthinessExpiry: '2027-01-13',
    insuranceExpiry: '2027-03-17',
    annualFeeExpiry: '2026-12-30',
    chassisNo: 'KDY231-8038435',
    engineNo: '1KD-2853254'
  },
  {
    regNo: 'AB1C-P2788',
    type: 'VAN',
    tonnage: '350',
    roadworthinessExpiry: '2026-12-12',
    insuranceExpiry: '2027-01-31',
    annualFeeExpiry: '2026-11-30',
    chassisNo: 'S331V-0215786',
    engineNo: 'KF H788034'
  },
  {
    regNo: 'AC1A-C5776',
    type: 'Pickup',
    tonnage: '350',
    roadworthinessExpiry: '2027-01-11',
    insuranceExpiry: '2027-04-19',
    annualFeeExpiry: '2026-12-31',
    chassisNo: 'DA16T-401474',
    engineNo: 'R06A-0384654'
  },
  {
    regNo: 'AV1A-C3822',
    type: 'Folk lift',
    tonnage: '2500',
    roadworthinessExpiry: '2027-08-20',
    insuranceExpiry: '2027-03-22',
    annualFeeExpiry: '2027-07-31',
    chassisNo: '2412024',
    engineNo: '407857'
  },
  {
    regNo: 'AA0U-C8874',
    type: 'Cycle',
    tonnage: '',
    roadworthinessExpiry: '2028-08-10',
    insuranceExpiry: '2027-08-15',
    annualFeeExpiry: '2027-07-01',
    chassisNo: 'MB8ED113CT8112788',
    engineNo: 'BGA4-241755'
  },
  {
    regNo: 'A0C4752',
    type: 'Cycle',
    tonnage: '',
    roadworthinessExpiry: '',
    insuranceExpiry: '',
    annualFeeExpiry: '2026-09-30',
    chassisNo: '',
    engineNo: ''
  },
  {
    regNo: 'CC4A-C2687',
    type: 'Rashu Pickup (Batuta)',
    tonnage: '',
    roadworthinessExpiry: '2027-03-11',
    insuranceExpiry: '',
    annualFeeExpiry: '',
    chassisNo: '',
    engineNo: ''
  },
  {
    regNo: 'CB2A-C1378',
    type: 'Buggy (Batuta)',
    tonnage: '',
    roadworthinessExpiry: '',
    insuranceExpiry: '',
    annualFeeExpiry: 'Not Required',
    chassisNo: '',
    engineNo: ''
  },
  {
    regNo: 'CC4A-C2955',
    type: 'Rashu Pickup (Madigrand)',
    tonnage: '',
    roadworthinessExpiry: '2027-02-28',
    insuranceExpiry: '',
    annualFeeExpiry: '2027-05-31',
    chassisNo: '',
    engineNo: ''
  },
  {
    regNo: 'C6695A-02',
    type: 'Speed Boat (Madigrand)',
    tonnage: '01-J',
    roadworthinessExpiry: '',
    insuranceExpiry: '',
    annualFeeExpiry: 'Not Required',
    chassisNo: 'Transmitting license',
    engineNo: '2/31/2028'
  }
];

async function importVehicles() {
  console.log('Starting vehicle import...');
  
  const batch = db.batch();
  
  vehicles.forEach((vehicle) => {
    const docRef = db.collection('vehicles').doc();
    batch.set(docRef, {
      ...vehicle,
      status: 'active',
      createdAt: new Date()
    });
  });
  
  try {
    await batch.commit();
    console.log(`Successfully imported ${vehicles.length} vehicles`);
  } catch (error) {
    console.error('Error importing vehicles:', error);
  }
}

importVehicles();
