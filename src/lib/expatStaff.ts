import type { 
  ExpatStaff, 
  ExpatCompany, 
  ExpatEmploymentStatus,
  ExpatMedicalAppointment,
  ExpatActivityLog,
  ExpatDepositTransaction,
  ExpatDashboardStats,
  ExpatDocumentStatus
} from '../types';
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

const EXPAT_STAFF_COLLECTION = 'expatStaff';
const EXPAT_MEDICAL_APPOINTMENTS_COLLECTION = 'expatMedicalAppointments';
const EXPAT_ACTIVITY_LOGS_COLLECTION = 'expatActivityLogs';
const EXPAT_DEPOSIT_TRANSACTIONS_COLLECTION = 'expatDepositTransactions';

// Utility function to calculate days remaining and document status
export const calculateDocumentStatus = (expiryDate: Date | string | undefined): { status: ExpatDocumentStatus; daysRemaining: number } => {
  if (!expiryDate) {
    return { status: 'missing', daysRemaining: 0 };
  }

  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'expired', daysRemaining };
  } else if (daysRemaining <= 7) {
    return { status: 'expiring_soon', daysRemaining };
  } else {
    return { status: 'valid', daysRemaining };
  }
};

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

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date | undefined): any => {
  if (!date) return null;
  return Timestamp.fromDate(date);
};

// Convert ExpatStaff to Firestore format
const expatStaffToFirestore = (staff: ExpatStaff): any => {
  return {
    ...staff,
    joiningDate: dateToTimestamp(staff.joiningDate),
    departureDate: dateToTimestamp(staff.departureDate),
    personalDetails: {
      ...staff.personalDetails,
      dateOfBirth: dateToTimestamp(staff.personalDetails.dateOfBirth),
    },
    passport: {
      ...staff.passport,
      issueDate: dateToTimestamp(staff.passport.issueDate),
      expiryDate: dateToTimestamp(staff.passport.expiryDate),
    },
    visa: {
      ...staff.visa,
      issueDate: dateToTimestamp(staff.visa.issueDate),
      expiryDate: dateToTimestamp(staff.visa.expiryDate),
    },
    workPermit: {
      ...staff.workPermit,
      issueDate: dateToTimestamp(staff.workPermit.issueDate),
      expiryDate: dateToTimestamp(staff.workPermit.expiryDate),
    },
    medical: {
      ...staff.medical,
      medicalDate: dateToTimestamp(staff.medical.medicalDate),
      nextDueDate: dateToTimestamp(staff.medical.nextDueDate),
    },
    insurance: {
      ...staff.insurance,
      startDate: dateToTimestamp(staff.insurance.startDate),
      expiryDate: dateToTimestamp(staff.insurance.expiryDate),
    },
    quota: {
      ...staff.quota,
      paymentDate: dateToTimestamp(staff.quota.paymentDate),
    },
    deposit: {
      ...staff.deposit,
      paymentDate: dateToTimestamp(staff.deposit.paymentDate),
      refundDate: dateToTimestamp(staff.deposit.refundDate),
    },
    documents: staff.documents.map(doc => ({
      ...doc,
      uploadedAt: dateToTimestamp(doc.uploadedAt),
      expiryDate: dateToTimestamp(doc.expiryDate),
    })),
    createdAt: dateToTimestamp(staff.createdAt),
    updatedAt: dateToTimestamp(staff.updatedAt),
  };
};

// Convert Firestore document to ExpatStaff
const firestoreToExpatStaff = (doc: any): ExpatStaff => {
  const data = doc.data();
  return {
    id: doc.id,
    employeeId: data.employeeId,
    internalId: data.internalId,
    fullName: data.fullName,
    company: data.company,
    nationality: data.nationality,
    dateOfBirth: timestampToDate(data.dateOfBirth),
    mobileNumber: data.mobileNumber,
    occupation: data.occupation,
    workSite: data.workSite,
    employmentStatus: data.employmentStatus,
    joiningDate: timestampToDate(data.joiningDate) || new Date(),
    departureDate: timestampToDate(data.departureDate),
    departureReason: data.departureReason,
    personalDetails: {
      ...data.personalDetails,
      dateOfBirth: timestampToDate(data.personalDetails?.dateOfBirth),
    },
    passport: {
      ...data.passport,
      issueDate: timestampToDate(data.passport?.issueDate),
      expiryDate: timestampToDate(data.passport?.expiryDate) || new Date(),
    },
    visa: {
      ...data.visa,
      issueDate: timestampToDate(data.visa?.issueDate),
      expiryDate: timestampToDate(data.visa?.expiryDate) || new Date(),
    },
    workPermit: {
      ...data.workPermit,
      issueDate: timestampToDate(data.workPermit?.issueDate),
      expiryDate: timestampToDate(data.workPermit?.expiryDate) || new Date(),
    },
    medical: {
      ...data.medical,
      medicalDate: timestampToDate(data.medical?.medicalDate),
      nextDueDate: timestampToDate(data.medical?.nextDueDate) || new Date(),
    },
    insurance: {
      ...data.insurance,
      startDate: timestampToDate(data.insurance?.startDate),
      expiryDate: timestampToDate(data.insurance?.expiryDate) || new Date(),
    },
    quota: {
      ...data.quota,
      paymentDate: timestampToDate(data.quota?.paymentDate),
    },
    deposit: {
      ...data.deposit,
      paymentDate: timestampToDate(data.deposit?.paymentDate),
      refundDate: timestampToDate(data.deposit?.refundDate),
    },
    documents: (data.documents || []).map((doc: any) => ({
      ...doc,
      uploadedAt: timestampToDate(doc.uploadedAt) || new Date(),
      expiryDate: timestampToDate(doc.expiryDate),
    })),
    remarks: data.remarks,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
};

// CRUD Operations for Expat Staff
export const getExpatStaff = async (id: string): Promise<ExpatStaff | null> => {
  try {
    const docRef = doc(db, EXPAT_STAFF_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return firestoreToExpatStaff(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error getting expat staff:', error);
    throw error;
  }
};

export const getAllExpatStaff = async (): Promise<ExpatStaff[]> => {
  try {
    const q = query(collection(db, EXPAT_STAFF_COLLECTION));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToExpatStaff);
  } catch (error) {
    console.error('Error getting all expat staff:', error);
    throw error;
  }
};

export const getExpatStaffByCompany = async (company: ExpatCompany): Promise<ExpatStaff[]> => {
  try {
    const q = query(collection(db, EXPAT_STAFF_COLLECTION), where('company', '==', company));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToExpatStaff);
  } catch (error) {
    console.error('Error getting expat staff by company:', error);
    throw error;
  }
};

export const getExpatStaffByStatus = async (status: ExpatEmploymentStatus): Promise<ExpatStaff[]> => {
  try {
    const q = query(collection(db, EXPAT_STAFF_COLLECTION), where('employmentStatus', '==', status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToExpatStaff);
  } catch (error) {
    console.error('Error getting expat staff by status:', error);
    throw error;
  }
};

export const createExpatStaff = async (staff: Omit<ExpatStaff, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const newStaff: ExpatStaff = {
      ...staff,
      id: '',
      createdAt: now,
      updatedAt: now,
    };
    
    // Calculate document statuses
    const passportStatus = calculateDocumentStatus(staff.passport.expiryDate);
    const visaStatus = calculateDocumentStatus(staff.visa.expiryDate);
    const workPermitStatus = calculateDocumentStatus(staff.workPermit.expiryDate);
    const medicalStatus = calculateDocumentStatus(staff.medical.nextDueDate);
    const insuranceStatus = calculateDocumentStatus(staff.insurance.expiryDate);

    newStaff.passport.status = passportStatus.status;
    newStaff.passport.daysRemaining = passportStatus.daysRemaining;
    newStaff.visa.daysRemaining = visaStatus.daysRemaining;
    newStaff.workPermit.daysRemaining = workPermitStatus.daysRemaining;
    newStaff.medical.daysRemaining = medicalStatus.daysRemaining;
    newStaff.insurance.daysRemaining = insuranceStatus.daysRemaining;

    const docRef = await addDoc(collection(db, EXPAT_STAFF_COLLECTION), expatStaffToFirestore(newStaff));
    
    // Log activity
    await logActivity(docRef.id, staff.fullName, 'record_created', 'Staff record created', staff.createdBy || 'system');
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating expat staff:', error);
    throw error;
  }
};

export const updateExpatStaff = async (id: string, staff: Partial<ExpatStaff>): Promise<void> => {
  try {
    const now = new Date();
    const updates = {
      ...staff,
      updatedAt: now,
    };

    // Recalculate document statuses if expiry dates changed
    if (staff.passport?.expiryDate) {
      const status = calculateDocumentStatus(staff.passport.expiryDate);
      updates.passport = {
        ...staff.passport,
        status: status.status,
        daysRemaining: status.daysRemaining,
      };
    }
    if (staff.visa?.expiryDate) {
      const status = calculateDocumentStatus(staff.visa.expiryDate);
      updates.visa = {
        ...staff.visa,
        daysRemaining: status.daysRemaining,
      };
    }
    if (staff.workPermit?.expiryDate) {
      const status = calculateDocumentStatus(staff.workPermit.expiryDate);
      updates.workPermit = {
        ...staff.workPermit,
        daysRemaining: status.daysRemaining,
      };
    }
    if (staff.medical?.nextDueDate) {
      const status = calculateDocumentStatus(staff.medical.nextDueDate);
      updates.medical = {
        ...staff.medical,
        daysRemaining: status.daysRemaining,
      };
    }
    if (staff.insurance?.expiryDate) {
      const status = calculateDocumentStatus(staff.insurance.expiryDate);
      updates.insurance = {
        ...staff.insurance,
        daysRemaining: status.daysRemaining,
      };
    }

    const docRef = doc(db, EXPAT_STAFF_COLLECTION, id);
    await updateDoc(docRef, expatStaffToFirestore(updates as ExpatStaff));
  } catch (error) {
    console.error('Error updating expat staff:', error);
    throw error;
  }
};

export const deleteExpatStaff = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, EXPAT_STAFF_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting expat staff:', error);
    throw error;
  }
};

// Dashboard Statistics
export const getExpatDashboardStats = async (): Promise<ExpatDashboardStats> => {
  try {
    const allStaff = await getAllExpatStaff();
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const stats: ExpatDashboardStats = {
      totalExpatStaff: allStaff.length,
      madihaaStaff: allStaff.filter(s => s.company === 'Madihaa').length,
      batutaStaff: allStaff.filter(s => s.company === 'Batuta').length,
      madigrandStaff: allStaff.filter(s => s.company === 'Madigrand').length,
      activeStaff: allStaff.filter(s => s.employmentStatus === 'active').length,
      departedStaff: allStaff.filter(s => s.employmentStatus === 'departed').length,
      workPermitsExpiring: allStaff.filter(s => {
        const expiry = s.workPermit.expiryDate;
        return expiry && new Date(expiry) <= thirtyDaysFromNow && s.employmentStatus === 'active';
      }).length,
      passportsExpiring: allStaff.filter(s => {
        const expiry = s.passport.expiryDate;
        return expiry && new Date(expiry) <= thirtyDaysFromNow && s.employmentStatus === 'active';
      }).length,
      visasExpiring: allStaff.filter(s => {
        const expiry = s.visa.expiryDate;
        return expiry && new Date(expiry) <= thirtyDaysFromNow && s.employmentStatus === 'active';
      }).length,
      medicalExpiring: allStaff.filter(s => {
        const due = s.medical.nextDueDate;
        return due && new Date(due) <= thirtyDaysFromNow && s.employmentStatus === 'active';
      }).length,
      insuranceExpiring: allStaff.filter(s => {
        const expiry = s.insurance.expiryDate;
        return expiry && new Date(expiry) <= thirtyDaysFromNow && s.employmentStatus === 'active';
      }).length,
      pendingDeposits: allStaff.filter(s => 
        s.deposit.depositPaid < s.deposit.depositAmount && s.employmentStatus === 'active'
      ).length,
    };

    return stats;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

// Medical Appointments
export const createMedicalAppointment = async (appointment: Omit<ExpatMedicalAppointment, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const newAppointment: ExpatMedicalAppointment = {
      ...appointment,
      id: '',
      createdAt: new Date(),
    };
    const docRef = await addDoc(collection(db, EXPAT_MEDICAL_APPOINTMENTS_COLLECTION), {
      ...newAppointment,
      scheduledDate: dateToTimestamp(newAppointment.scheduledDate),
      createdAt: dateToTimestamp(newAppointment.createdAt),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating medical appointment:', error);
    throw error;
  }
};

export const getMedicalAppointments = async (company?: ExpatCompany): Promise<ExpatMedicalAppointment[]> => {
  try {
    let q;
    if (company) {
      q = query(collection(db, EXPAT_MEDICAL_APPOINTMENTS_COLLECTION), where('company', '==', company));
    } else {
      q = query(collection(db, EXPAT_MEDICAL_APPOINTMENTS_COLLECTION));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        company: data.company,
        scheduledDate: timestampToDate(data.scheduledDate) || new Date(),
        status: data.status,
        remarks: data.remarks,
        createdAt: timestampToDate(data.createdAt) || new Date(),
        updatedAt: timestampToDate(data.updatedAt),
      };
    });
  } catch (error) {
    console.error('Error getting medical appointments:', error);
    throw error;
  }
};

// Activity Logging
export const logActivity = async (employeeId: string, employeeName: string, eventType: ExpatActivityLog['eventType'], description: string, performedBy: string): Promise<void> => {
  try {
    const log: Omit<ExpatActivityLog, 'id'> = {
      employeeId,
      employeeName,
      eventType,
      description,
      performedBy,
      performedAt: new Date(),
    };
    await addDoc(collection(db, EXPAT_ACTIVITY_LOGS_COLLECTION), {
      ...log,
      performedAt: dateToTimestamp(log.performedAt),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getActivityLogs = async (employeeId?: string): Promise<ExpatActivityLog[]> => {
  try {
    let q;
    if (employeeId) {
      q = query(collection(db, EXPAT_ACTIVITY_LOGS_COLLECTION), where('employeeId', '==', employeeId), orderBy('performedAt', 'desc'));
    } else {
      q = query(collection(db, EXPAT_ACTIVITY_LOGS_COLLECTION), orderBy('performedAt', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        eventType: data.eventType,
        description: data.description,
        performedBy: data.performedBy,
        performedAt: timestampToDate(data.performedAt) || new Date(),
      };
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
};

// Deposit Transactions
export const createDepositTransaction = async (transaction: Omit<ExpatDepositTransaction, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const newTransaction: ExpatDepositTransaction = {
      ...transaction,
      id: '',
      createdAt: new Date(),
    };
    const docRef = await addDoc(collection(db, EXPAT_DEPOSIT_TRANSACTIONS_COLLECTION), {
      ...newTransaction,
      paymentDate: dateToTimestamp(newTransaction.paymentDate),
      createdAt: dateToTimestamp(newTransaction.createdAt),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating deposit transaction:', error);
    throw error;
  }
};

export const getDepositTransactions = async (company?: ExpatCompany): Promise<ExpatDepositTransaction[]> => {
  try {
    let q;
    if (company) {
      q = query(collection(db, EXPAT_DEPOSIT_TRANSACTIONS_COLLECTION), where('company', '==', company), orderBy('paymentDate', 'desc'));
    } else {
      q = query(collection(db, EXPAT_DEPOSIT_TRANSACTIONS_COLLECTION), orderBy('paymentDate', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        company: data.company,
        transactionType: data.transactionType,
        amount: data.amount,
        paymentDate: timestampToDate(data.paymentDate) || new Date(),
        receipt: data.receipt,
        reference: data.reference,
        status: data.status,
        remarks: data.remarks,
        createdAt: timestampToDate(data.createdAt) || new Date(),
      };
    });
  } catch (error) {
    console.error('Error getting deposit transactions:', error);
    throw error;
  }
};

// Search functionality
export const searchExpatStaff = async (searchTerm: string): Promise<ExpatStaff[]> => {
  try {
    const allStaff = await getAllExpatStaff();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return allStaff.filter(staff => 
      staff.fullName.toLowerCase().includes(lowerSearchTerm) ||
      staff.employeeId.toLowerCase().includes(lowerSearchTerm) ||
      staff.workPermit.workPermitNumber.toLowerCase().includes(lowerSearchTerm) ||
      staff.passport.passportNumber.toLowerCase().includes(lowerSearchTerm) ||
      staff.mobileNumber.includes(searchTerm)
    );
  } catch (error) {
    console.error('Error searching expat staff:', error);
    throw error;
  }
};
