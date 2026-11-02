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
import type { LeaveRequest, LeaveBalance, LeaveType } from '../types';

const LEAVE_REQUESTS_COLLECTION = 'leave_requests';
const LEAVE_BALANCES_COLLECTION = 'leave_balances';

// Helper function to recursively remove undefined values
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)).filter(item => item !== undefined && item !== null);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = removeUndefined(obj[key]);
        if (value !== undefined && value !== null) {
          result[key] = value;
        }
      }
    }
    return result;
  }
  
  return obj;
};

// Leave Request functions
// Exported functions for leave management
export const getLeaveRequests = async (employeeId?: string) => {
  try {
    let q;
    
    if (employeeId) {
      // Query with employeeId filter - no orderBy to avoid index requirement
      q = query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        where('employeeId', '==', employeeId)
      );
    } else {
      // Query without filter - can use orderBy
      q = query(collection(db, LEAVE_REQUESTS_COLLECTION), orderBy('appliedDate', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || data.startDate,
        endDate: data.endDate?.toDate?.() || data.endDate,
        appliedDate: data.appliedDate?.toDate?.() || data.appliedDate,
        amendedDate: data.amendedDate?.toDate?.() || data.amendedDate,
        approvals: data.approvals?.map((approval: any) => ({
          ...approval,
          actionDate: approval.actionDate?.toDate?.() || approval.actionDate
        })).filter((a: any) => a !== undefined) || []
      } as LeaveRequest;
    });
    
    // Sort client-side if we filtered by employeeId
    if (employeeId) {
      requests.sort((a, b) => b.appliedDate.getTime() - a.appliedDate.getTime());
    }
    
    return requests;
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};

export const getLeaveRequestById = async (id: string) => {
  try {
    const docRef = doc(db, LEAVE_REQUESTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const approvals = data.approvals?.map((approval: any) => ({
        ...approval,
        actionDate: approval.actionDate?.toDate?.() || approval.actionDate
      })).filter((a: any) => a !== undefined) || [];
      
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate?.toDate?.() || data.startDate,
        endDate: data.endDate?.toDate?.() || data.endDate,
        appliedDate: data.appliedDate?.toDate?.() || data.appliedDate,
        amendedDate: data.amendedDate?.toDate?.() || data.amendedDate,
        approvals
      } as LeaveRequest;
    }
    return null;
  } catch (error) {
    console.error('Error fetching leave request:', error);
    throw error;
  }
};

export const calculateLeaveDays = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const validateLeaveRequest = (leaveRequest: Partial<LeaveRequest>) => {
  const errors: string[] = [];
  if (!leaveRequest.employeeId) {
    errors.push('Employee ID is required.');
  }
  if (!leaveRequest.type) {
    errors.push('Leave type is required.');
  }
  if (!leaveRequest.startDate) {
    errors.push('Start date is required.');
  }
  if (!leaveRequest.endDate) {
    errors.push('End date is required.');
  }
  if (leaveRequest.startDate && leaveRequest.endDate && leaveRequest.endDate < leaveRequest.startDate) {
    errors.push('End date cannot be before start date.');
  }
  if (!leaveRequest.reason) {
    errors.push('Reason for leave is required.');
  }
  if (leaveRequest.days !== undefined && leaveRequest.days <= 0) {
    errors.push('Leave duration must be at least one day.');
  }
  return errors;
};

export const createLeaveRequest = async (leaveRequest: Partial<LeaveRequest>) => {
  try {
    const newRequest = {
      ...leaveRequest,
      status: 'pending',
      appliedDate: new Date(),
      approvals: [],
      balanceAdjusted: false,
    };
    
    const docRef = await addDoc(collection(db, LEAVE_REQUESTS_COLLECTION), {
      ...newRequest,
      startDate: Timestamp.fromDate(newRequest.startDate!),
      endDate: Timestamp.fromDate(newRequest.endDate!),
      appliedDate: Timestamp.fromDate(newRequest.appliedDate),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

export const updateLeaveRequest = async (id: string, data: Partial<LeaveRequest>) => {
  try {
    const updateData: any = { ...data };
    
    if (updateData.startDate && updateData.startDate instanceof Date) {
      updateData.startDate = Timestamp.fromDate(updateData.startDate);
    }
    if (updateData.endDate && updateData.endDate instanceof Date) {
      updateData.endDate = Timestamp.fromDate(updateData.endDate);
    }
    if (updateData.amendedDate && updateData.amendedDate instanceof Date) {
      updateData.amendedDate = Timestamp.fromDate(updateData.amendedDate);
    }
    
    // Handle approvals array - convert Date objects to Timestamps
    if (updateData.approvals && Array.isArray(updateData.approvals)) {
      updateData.approvals = updateData.approvals.map((approval: any) => ({
        ...approval,
        actionDate: approval.actionDate instanceof Date 
          ? Timestamp.fromDate(approval.actionDate) 
          : approval.actionDate
      }));
    }
    
    // Recursively remove all undefined and null values
    const cleanedData = removeUndefined(updateData);
    
    await updateDoc(doc(db, LEAVE_REQUESTS_COLLECTION, id), cleanedData);
  } catch (error) {
    console.error('Error updating leave request:', error);
    throw error;
  }
};

export const adjustLeaveBalance = async (employeeId: string, leaveType: LeaveType, days: number, year: number, restore = false) => {
  const balance = await getLeaveBalance(employeeId, year);
  const diff = restore ? days : -days;
  const updates: Partial<LeaveBalance> = {};

  switch (leaveType) {
    case 'annual':
      updates.annual = Math.max(0, balance.annual + diff);
      break;
    case 'medical':
      updates.medical = Math.max(0, balance.medical + diff);
      break;
    case 'emergency':
      updates.emergency = Math.max(0, balance.emergency + diff);
      break;
    case 'duty':
      updates.duty = Math.max(0, balance.duty + diff);
      break;
    default:
      break;
  }

  await updateLeaveBalance(employeeId, year, updates);
};

export const approveLeaveRequest = async (id: string, approverId: string, approverName: string, level: number, comments?: string) => {
  try {
    const request = await getLeaveRequestById(id);
    if (!request) throw new Error('Leave request not found');
    
    // Create a clean approvals array with only the new approval
    const newApproval = {
      level,
      approverId,
      approverName,
      status: 'approved' as const,
      comments,
      actionDate: new Date(),
    };
    
    // Set status to approved directly since we're using single-level approval
    const status = 'approved';
    
    await updateLeaveRequest(id, {
      approvals: [newApproval],
      status,
    });

    if (!request.balanceAdjusted) {
      await adjustLeaveBalance(request.employeeId, request.type, request.days, request.startDate.getFullYear());
      await updateLeaveRequest(id, { balanceAdjusted: true });
    }
  } catch (error) {
    console.error('Error approving leave request:', error);
    throw error;
  }
};

export const rejectLeaveRequest = async (id: string, approverId: string, approverName: string, level: number, comments?: string) => {
  try {
    const request = await getLeaveRequestById(id);
    if (!request) throw new Error('Leave request not found');
    
    // Create a clean approvals array with only the new rejection
    const newApproval = {
      level,
      approverId,
      approverName,
      status: 'rejected' as const,
      comments,
      actionDate: new Date(),
    };
    
    await updateLeaveRequest(id, {
      approvals: [newApproval],
      status: 'rejected',
    });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    throw error;
  }
};

export const cancelLeaveRequest = async (id: string) => {
  try {
    await updateLeaveRequest(id, { status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    throw error;
  }
};

export const deleteLeaveRequest = async (id: string) => {
  try {
    await deleteDoc(doc(db, LEAVE_REQUESTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting leave request:', error);
    throw error;
  }
};

export const bulkDeleteLeaveRequests = async (ids: string[]) => {
  try {
    const deletePromises = ids.map(id => deleteDoc(doc(db, LEAVE_REQUESTS_COLLECTION, id)));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error bulk deleting leave requests:', error);
    throw error;
  }
};

export const deleteAllLeaveRequests = async () => {
  try {
    const q = query(collection(db, LEAVE_REQUESTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map(doc => doc.id);
    if (ids.length > 0) {
      await bulkDeleteLeaveRequests(ids);
    }
    return ids.length;
  } catch (error) {
    console.error('Error deleting all leave requests:', error);
    throw error;
  }
};

// Leave Balance functions
export const getLeaveBalance = async (employeeId: string, year: number) => {
  try {
    const q = query(
      collection(db, LEAVE_BALANCES_COLLECTION),
      where('employeeId', '==', employeeId),
      where('year', '==', year)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // Create default balance
      const defaultBalance: LeaveBalance = {
        employeeId,
        annual: 30,
        medical: 10,
        emergency: 7,
        duty: 0,
        carryForward: 0,
        year,
      };
      await addDoc(collection(db, LEAVE_BALANCES_COLLECTION), defaultBalance);
      return defaultBalance;
    }
    
    return querySnapshot.docs[0].data() as LeaveBalance;
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    throw error;
  }
};

export const updateLeaveBalance = async (employeeId: string, year: number, updates: Partial<LeaveBalance>) => {
  try {
    const q = query(
      collection(db, LEAVE_BALANCES_COLLECTION),
      where('employeeId', '==', employeeId),
      where('year', '==', year)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Leave balance not found');
    }
    
    await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, querySnapshot.docs[0].id), updates);
  } catch (error) {
    console.error('Error updating leave balance:', error);
    throw error;
  }
};

// Get pending leave requests for approver
export const getPendingLeaveRequests = async (approverId: string) => {
  try {
    const requests = await getLeaveRequests();
    return requests.filter(request => 
      request.status === 'pending' && 
      (!request.approvals[0] || request.approvals[0].approverId === approverId)
    );
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    throw error;
  }
};
