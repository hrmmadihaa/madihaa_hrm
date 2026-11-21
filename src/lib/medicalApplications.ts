import type { MedicalApplication } from '../types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed;
  return undefined;
};

// Convert MedicalApplication to Firestore format
const medicalApplicationToFirestore = (application: Partial<MedicalApplication>) => {
  const data: any = { ...application };
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });
  return data;
};

// Convert Firestore document to MedicalApplication
const firestoreToMedicalApplication = (doc: any): MedicalApplication => {
  const data = doc.data();
  return {
    id: doc.id,
    staffId: data.staffId || '',
    staffName: data.staffName || '',
    refNumber: data.refNumber || '',
    createdDate: timestampToDate(data.createdDate) || new Date(),
    lastSubmittedDate: timestampToDate(data.lastSubmittedDate),
    stateChangeRemarks: data.stateChangeRemarks,
    status: data.status || 'submitted',
    egovLink: data.egovLink,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
};

// Get all medical applications
export const getAllMedicalApplications = async () => {
  try {
    const q = query(collection(db, 'medicalApplications'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToMedicalApplication);
  } catch (error) {
    console.error('Error fetching medical applications:', error);
    return [];
  }
};

// Get medical applications by staff ID
export const getMedicalApplicationsByStaffId = async (staffId: string) => {
  try {
    const q = query(
      collection(db, 'medicalApplications'),
      where('staffId', '==', staffId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToMedicalApplication);
  } catch (error) {
    console.error('Error fetching medical applications by staff ID:', error);
    return [];
  }
};

// Get medical application by ID
export const getMedicalApplicationById = async (id: string) => {
  try {
    const docRef = doc(db, 'medicalApplications', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return firestoreToMedicalApplication(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching medical application:', error);
    return null;
  }
};

// Create medical application
export const createMedicalApplication = async (application: Partial<MedicalApplication>) => {
  try {
    const data = medicalApplicationToFirestore({
      ...application,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const docRef = await addDoc(collection(db, 'medicalApplications'), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating medical application:', error);
    throw error;
  }
};

// Update medical application
export const updateMedicalApplication = async (id: string, data: Partial<MedicalApplication>) => {
  try {
    const docRef = doc(db, 'medicalApplications', id);
    const updateData = medicalApplicationToFirestore({
      ...data,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating medical application:', error);
    throw error;
  }
};

// Delete medical application
export const deleteMedicalApplication = async (id: string) => {
  try {
    const docRef = doc(db, 'medicalApplications', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting medical application:', error);
    throw error;
  }
};
