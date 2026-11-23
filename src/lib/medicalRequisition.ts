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
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const MEDICAL_REQUISITIONS_COLLECTION = 'medical_requisitions';

export interface MedicalStaff {
  id?: string;
  name: string;
  designation: string;
  sickness: string;
}

export interface Medicine {
  name: string;
  tablets: number;
  value: number;
}

export interface Consultation {
  hospital: string;
  doctorName: string;
  doctorComments: string;
  visitTime: Date;
  medicineTaken: boolean;
  medicines?: Medicine[];
}

export interface MedicalRequisition {
  id?: string;
  department: string;
  date: Date;
  staff: MedicalStaff[];
  remarks?: string;
  requestedBy: string;
  requestedByPosition?: string;
  approvedBy?: string;
  approvedByPosition?: string;
  assignedTo?: string; // HR staff assigned to take to hospital
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  consultation?: Consultation;
  employeeId?: string; // Link to employee for medical history
  createdAt?: Date;
  updatedAt?: Date;
}

export const addMedicalRequisition = async (requisition: Omit<MedicalRequisition, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data: any = {
      ...requisition,
      date: Timestamp.fromDate(requisition.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Only include consultation if it exists
    if (requisition.consultation) {
      data.consultation = {
        ...requisition.consultation,
        visitTime: Timestamp.fromDate(requisition.consultation.visitTime)
      };
    }

    const docRef = await addDoc(collection(db, MEDICAL_REQUISITIONS_COLLECTION), data);
    return docRef.id;
  } catch (error) {
    console.error('Error adding medical requisition:', error);
    throw error;
  }
};

export const getMedicalRequisitions = async (status?: string) => {
  try {
    let q = query(collection(db, MEDICAL_REQUISITIONS_COLLECTION), orderBy('createdAt', 'desc'));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate(),
        consultation: data.consultation ? {
          ...data.consultation,
          visitTime: data.consultation.visitTime?.toDate()
        } : undefined,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as MedicalRequisition;
    });
  } catch (error) {
    console.error('Error fetching medical requisitions:', error);
    throw error;
  }
};

export const getMedicalRequisitionById = async (id: string) => {
  try {
    const docRef = doc(db, MEDICAL_REQUISITIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Medical requisition not found');
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date?.toDate(),
      consultation: data.consultation ? {
        ...data.consultation,
        visitTime: data.consultation.visitTime?.toDate()
      } : undefined,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as MedicalRequisition;
  } catch (error) {
    console.error('Error fetching medical requisition:', error);
    throw error;
  }
};

export const getMedicalRequisitionsByEmployee = async (employeeId: string, employeeName?: string) => {
  try {
    // First try to query by employeeId
    const q = query(
      collection(db, MEDICAL_REQUISITIONS_COLLECTION),
      where('employeeId', '==', employeeId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
          consultation: data.consultation ? {
            ...data.consultation,
            visitTime: data.consultation.visitTime?.toDate()
          } : undefined,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MedicalRequisition;
      });
    }
    
    // If no results with employeeId and employeeName is provided, try to get all and filter by staff name
    // This is a fallback for existing records without employeeId
    if (employeeName) {
      const allQ = query(
        collection(db, MEDICAL_REQUISITIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const allSnapshot = await getDocs(allQ);
      
      console.log('All medical requisitions count:', allSnapshot.docs.length);
      
      const allRequisitions = allSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
          consultation: data.consultation ? {
            ...data.consultation,
            visitTime: data.consultation.visitTime?.toDate()
          } : undefined,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as MedicalRequisition;
      });
      
      // Log all staff names for debugging
      const allStaffNames = allRequisitions.flatMap(req => 
        req.staff ? req.staff.map((s: any) => s.name) : []
      );
      console.log('All staff names in requisitions:', allStaffNames);
      console.log('Looking for employee name:', employeeName);
      
      return allRequisitions.filter(req => 
        req.staff && req.staff.some((s: any) => {
          const match = s.name === employeeName || 
                       s.name.includes(employeeName) || 
                       employeeName.includes(s.name);
          if (match) {
            console.log('Matched requisition:', req.id, 'with staff name:', s.name);
          }
          return match;
        })
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching employee medical requisitions:', error);
    throw error;
  }
};

export const updateMedicalRequisition = async (id: string, requisition: Partial<MedicalRequisition>) => {
  try {
    const docRef = doc(db, MEDICAL_REQUISITIONS_COLLECTION, id);
    const updateData: any = {
      ...requisition,
      updatedAt: Timestamp.now()
    };
    
    if (requisition.date) {
      updateData.date = Timestamp.fromDate(requisition.date);
    }
    
    if (requisition.consultation && requisition.consultation.visitTime) {
      updateData.consultation = {
        ...requisition.consultation,
        visitTime: Timestamp.fromDate(requisition.consultation.visitTime)
      };
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating medical requisition:', error);
    throw error;
  }
};

export const deleteMedicalRequisition = async (id: string) => {
  try {
    const docRef = doc(db, MEDICAL_REQUISITIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting medical requisition:', error);
    throw error;
  }
};

export const approveMedicalRequisition = async (id: string, approvedBy: string, approvedByPosition?: string) => {
  return updateMedicalRequisition(id, {
    status: 'approved',
    approvedBy,
    approvedByPosition
  });
};

export const assignMedicalRequisition = async (id: string, assignedTo: string) => {
  return updateMedicalRequisition(id, {
    status: 'in_progress',
    assignedTo
  });
};

export const completeMedicalRequisition = async (id: string, consultation: Consultation) => {
  return updateMedicalRequisition(id, {
    status: 'completed',
    consultation
  });
};
