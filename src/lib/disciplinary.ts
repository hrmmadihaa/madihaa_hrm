import type { DisciplinaryAction } from '../types';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
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

// Convert DisciplinaryAction to Firestore format
const disciplinaryToFirestore = (disciplinary: Partial<DisciplinaryAction>) => {
  const data: any = { ...disciplinary };
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });
  return data;
};

// Convert Firestore document to DisciplinaryAction
const firestoreToDisciplinary = (doc: any): DisciplinaryAction => {
  const data = doc.data();
  return {
    id: doc.id,
    employeeId: data.employeeId || '',
    employeeName: data.employeeName || '',
    employeeDepartment: data.employeeDepartment || '',
    employeeDesignation: data.employeeDesignation || '',
    type: data.type || 'other',
    severity: data.severity || 'minor',
    incidentDate: timestampToDate(data.incidentDate) || new Date(),
    reportedDate: timestampToDate(data.reportedDate) || new Date(),
    description: data.description || '',
    actionTaken: data.actionTaken || '',
    reportedBy: data.reportedBy || '',
    approvedBy: data.approvedBy,
    status: data.status || 'pending',
    warningLetterIssued: data.warningLetterIssued || false,
    suspensionDays: data.suspensionDays,
    fineAmount: data.fineAmount,
    notes: data.notes,
    attachments: data.attachments || [],
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
  };
};

// Get all disciplinary actions
export const getDisciplinaryActions = async () => {
  try {
    const q = query(collection(db, 'disciplinaryActions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToDisciplinary);
  } catch (error) {
    console.error('Error fetching disciplinary actions:', error);
    return [];
  }
};

// Get disciplinary action by ID
export const getDisciplinaryActionById = async (id: string) => {
  try {
    const docRef = doc(db, 'disciplinaryActions', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return firestoreToDisciplinary(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching disciplinary action:', error);
    return null;
  }
};

// Get disciplinary actions by employee ID
export const getDisciplinaryActionsByEmployee = async (employeeId: string) => {
  try {
    // Fetch all actions and filter client-side to avoid requiring a composite index
    const q = query(collection(db, 'disciplinaryActions'));
    const querySnapshot = await getDocs(q);
    const allActions = querySnapshot.docs.map(firestoreToDisciplinary);
    
    // Filter by employeeId and sort by createdAt descending
    return allActions
      .filter(action => action.employeeId === employeeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching disciplinary actions for employee:', error);
    return [];
  }
};

// Create disciplinary action
export const createDisciplinaryAction = async (disciplinary: Partial<DisciplinaryAction>) => {
  try {
    const data = disciplinaryToFirestore({
      ...disciplinary,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const docRef = await addDoc(collection(db, 'disciplinaryActions'), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating disciplinary action:', error);
    throw error;
  }
};

// Update disciplinary action
export const updateDisciplinaryAction = async (id: string, data: Partial<DisciplinaryAction>) => {
  try {
    const docRef = doc(db, 'disciplinaryActions', id);
    const updateData = disciplinaryToFirestore({
      ...data,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating disciplinary action:', error);
    throw error;
  }
};

// Delete disciplinary action
export const deleteDisciplinaryAction = async (id: string) => {
  try {
    const docRef = doc(db, 'disciplinaryActions', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting disciplinary action:', error);
    throw error;
  }
};

// Search disciplinary actions
export const searchDisciplinaryActions = async (searchTerm: string) => {
  try {
    const actions = await getDisciplinaryActions();
    const term = searchTerm.toLowerCase();
    
    return actions.filter(action =>
      action.employeeName.toLowerCase().includes(term) ||
      action.employeeId.toLowerCase().includes(term) ||
      action.employeeDepartment.toLowerCase().includes(term) ||
      action.description.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching disciplinary actions:', error);
    throw error;
  }
};
