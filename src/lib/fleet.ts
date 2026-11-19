import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where, getDoc } from 'firebase/firestore';

// Airport Pass
export interface AirportPass {
  id?: string;
  employeeId: string;
  employeeName: string;
  section: 'Drivers' | 'Labours';
  category: string;
  passNo: number | null;
  expiryDate: string;
  daysLeft: number | null;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getAirportPasses = async (): Promise<AirportPass[]> => {
  const querySnapshot = await getDocs(collection(db, 'airportPasses'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AirportPass));
};

export const getAirportPassByEmployeeId = async (employeeId: string): Promise<AirportPass | null> => {
  const q = query(collection(db, 'airportPasses'), where('employeeId', '==', employeeId));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as AirportPass;
};

export const addAirportPass = async (data: Omit<AirportPass, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'airportPasses'), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const updateAirportPass = async (id: string, data: Partial<AirportPass>): Promise<void> => {
  const docRef = doc(db, 'airportPasses', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

export const deleteAirportPass = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'airportPasses', id));
};

// License
export interface License {
  id?: string;
  employeeId: string;
  employeeName: string;
  category: string;
  licenseNo: string;
  expiryDate: string;
  daysLeft: number | null;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getLicenses = async (): Promise<License[]> => {
  const querySnapshot = await getDocs(collection(db, 'licenses'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as License));
};

export const getLicenseByEmployeeId = async (employeeId: string): Promise<License | null> => {
  const q = query(collection(db, 'licenses'), where('employeeId', '==', employeeId));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as License;
};

export const addLicense = async (data: Omit<License, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'licenses'), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const updateLicense = async (id: string, data: Partial<License>): Promise<void> => {
  const docRef = doc(db, 'licenses', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

export const deleteLicense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'licenses', id));
};

// Vehicle
export interface Vehicle {
  id?: string;
  vehicleNo: string;
  registration: string;
  model: string;
  type: string;
  insuranceExpiry: string;
  roadTaxExpiry: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getVehicles = async (): Promise<Vehicle[]> => {
  const querySnapshot = await getDocs(collection(db, 'vehicles'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  const docRef = doc(db, 'vehicles', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Vehicle;
};

export const addVehicle = async (data: Omit<Vehicle, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'vehicles'), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const updateVehicle = async (id: string, data: Partial<Vehicle>): Promise<void> => {
  const docRef = doc(db, 'vehicles', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'vehicles', id));
};
