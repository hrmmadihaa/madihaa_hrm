import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { OvertimeRequest } from '../types';

const OVERTIME_COLLECTION = 'overtime_requests';
const BIOMETRIC_COLLECTION = 'biometric_overtime';

// Overtime functions
export const getOvertimeRequests = async (employeeId?: string) => {
  try {
    console.log('=== GET OVERTIME REQUESTS START ===');
    console.log('Collection:', OVERTIME_COLLECTION);
    console.log('Filtering by employeeId:', employeeId);
    let q = query(collection(db, OVERTIME_COLLECTION), orderBy('requestedDate', 'desc'));

    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }

    console.log('Executing query...');
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);
    
    // Log all documents found
    querySnapshot.docs.forEach(doc => {
      console.log('Document ID:', doc.id);
      console.log('Document employeeId:', doc.data().employeeId);
      console.log('Document date:', doc.data().date?.toDate());
      console.log('Document hours:', doc.data().hours);
    });
    
    console.log('=== GET OVERTIME REQUESTS SUCCESS ===');
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      requestedDate: doc.data().requestedDate.toDate(),
      requestType: doc.data().requestType || 'planned',
      requiresDivisionHeadApproval: doc.data().requiresDivisionHeadApproval || false,
      preApproved: doc.data().preApproved || false,
      biometricVarianceMinutes: doc.data().biometricVarianceMinutes || 0,
      approvals: doc.data().approvals?.map((approval: any) => ({
        ...approval,
        actionDate: approval.actionDate?.toDate()
      }))
    })) as OvertimeRequest[];
  } catch (error) {
    console.error('=== GET OVERTIME REQUESTS ERROR ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export const getOvertimeRequestById = async (id: string) => {
  try {
    const docRef = doc(db, OVERTIME_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        date: data.date.toDate(),
        requestedDate: data.requestedDate.toDate(),
        requestType: data.requestType || 'planned',
        requiresDivisionHeadApproval: data.requiresDivisionHeadApproval || false,
        preApproved: data.preApproved || false,
        biometricVarianceMinutes: data.biometricVarianceMinutes || 0,
        approvals: data.approvals?.map((approval: any) => ({
          ...approval,
          actionDate: approval.actionDate?.toDate()
        }))
      } as OvertimeRequest;
    }
    return null;
  } catch (error) {
    console.error('Error fetching overtime request:', error);
    throw error;
  }
};

export const createOvertimeRequest = async (overtimeRequest: Partial<OvertimeRequest>) => {
  try {
    console.log('=== CREATE OVERTIME REQUEST START ===');
    console.log('Collection:', OVERTIME_COLLECTION);
    console.log('Input data:', JSON.stringify(overtimeRequest, null, 2));
    
    const newRequest = {
      ...overtimeRequest,
      status: 'pending',
      requestType: overtimeRequest.requestType || 'planned',
      requiresDivisionHeadApproval: overtimeRequest.requestType === 'emergency',
      preApproved: overtimeRequest.preApproved || false,
      biometricVarianceMinutes: overtimeRequest.biometricVarianceMinutes || 0,
      requestedDate: new Date(),
      approvals: [],
    };
    
    console.log('Request to save:', JSON.stringify(newRequest, null, 2));
    console.log('Employee ID:', newRequest.employeeId);
    
    const docRef = await addDoc(collection(db, OVERTIME_COLLECTION), {
      ...newRequest,
      date: Timestamp.fromDate(newRequest.date!),
      requestedDate: Timestamp.fromDate(newRequest.requestedDate),
    });
    
    console.log('Document created with ID:', docRef.id);
    console.log('=== CREATE OVERTIME REQUEST SUCCESS ===');
    return docRef.id;
  } catch (error) {
    console.error('=== CREATE OVERTIME REQUEST ERROR ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export const updateOvertimeRequest = async (id: string, data: Partial<OvertimeRequest>) => {
  try {
    console.log('=== UPDATE OVERTIME REQUEST START ===');
    console.log('Document ID:', id);
    console.log('Collection:', OVERTIME_COLLECTION);
    console.log('Update data:', JSON.stringify(data, null, 2));
    
    const updateData: any = { ...data };
    
    if (updateData.date && updateData.date instanceof Date) {
      updateData.date = Timestamp.fromDate(updateData.date);
    }
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    await updateDoc(doc(db, OVERTIME_COLLECTION, id), updateData);
    console.log('=== UPDATE OVERTIME REQUEST SUCCESS ===');
  } catch (error) {
    console.error('=== UPDATE OVERTIME REQUEST ERROR ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export const approveOvertimeRequest = async (id: string, approverId: string, approverName: string, comments?: string) => {
  try {
    const request = await getOvertimeRequestById(id);
    if (!request) throw new Error('Overtime request not found');

    const updatedApprovals = request.approvals || [];
    const approval: any = {
      approverId,
      approverName,
      status: 'approved',
      actionDate: new Date(),
    };
    if (comments) {
      approval.comments = comments;
    }
    updatedApprovals.push(approval);

    await updateOvertimeRequest(id, {
      approvals: updatedApprovals,
      status: 'approved',
    });
  } catch (error) {
    console.error('Error approving overtime request:', error);
    throw error;
  }
};

export const rejectOvertimeRequest = async (id: string, approverId: string, approverName: string, comments?: string) => {
  try {
    const request = await getOvertimeRequestById(id);
    if (!request) throw new Error('Overtime request not found');

    const updatedApprovals = request.approvals || [];
    const approval: any = {
      approverId,
      approverName,
      status: 'rejected',
      actionDate: new Date(),
    };
    if (comments) {
      approval.comments = comments;
    }
    updatedApprovals.push(approval);

    await updateOvertimeRequest(id, {
      approvals: updatedApprovals,
      status: 'rejected',
    });
  } catch (error) {
    console.error('Error rejecting overtime request:', error);
    throw error;
  }
};

export const completeOvertimeRequest = async (id: string) => {
  try {
    await updateOvertimeRequest(id, { status: 'completed' });
  } catch (error) {
    console.error('Error completing overtime request:', error);
    throw error;
  }
};

export const deleteOvertimeRequest = async (id: string) => {
  try {
    await deleteDoc(doc(db, OVERTIME_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting overtime request:', error);
    throw error;
  }
};

// Get pending overtime requests for approver
export const getPendingOvertimeRequests = async () => {
  try {
    const requests = await getOvertimeRequests();
    return requests.filter(request => 
      request.status === 'pending' && 
      (!request.approvals || request.approvals.length === 0)
    );
  } catch (error) {
    console.error('Error fetching pending overtime requests:', error);
    throw error;
  }
};

// Get overtime summary for a period
export const getOvertimeSummary = async (startDate: Date, endDate: Date, employeeId?: string) => {
  try {
    const requests = await getOvertimeRequests(employeeId);
    
    const filteredRequests = requests.filter(request => {
      const requestDate = new Date(request.date);
      return requestDate >= startDate && requestDate <= endDate;
    });
    
    const summary = {
      totalRequests: filteredRequests.length,
      totalHours: filteredRequests.reduce((sum, r) => sum + r.hours, 0),
      approvedHours: filteredRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.hours, 0),
      pendingHours: filteredRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.hours, 0),
      rejectedHours: filteredRequests.filter(r => r.status === 'rejected').reduce((sum, r) => sum + r.hours, 0),
      completedHours: filteredRequests.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.hours, 0),
      publicHolidayHours: filteredRequests
        .filter(r => r.requestType === 'public_holiday')
        .reduce((sum, r) => sum + r.hours, 0),
    };
    
    return summary;
  } catch (error) {
    console.error('Error fetching overtime summary:', error);
    throw error;
  }
};

// Migration function to fix employeeId in existing overtime requests
// Call this from browser console: window.fixOvertimeEmployeeIds()
export const fixOvertimeEmployeeIds = async () => {
  try {
    console.log('=== MIGRATION: FIXING EMPLOYEE IDS START ===');
    
    // Get all overtime requests
    const q = query(collection(db, OVERTIME_COLLECTION));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} overtime requests to migrate`);
    
    // Get all users to build a map of Firebase Auth UID -> employeeId
    // The users collection has Firebase Auth UIDs as document IDs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`Found ${usersSnapshot.size} users in users collection`);
    
    // Log a sample user to debug structure
    if (usersSnapshot.size > 0) {
      console.log('Sample user document:', usersSnapshot.docs[0].data());
    }
    
    const uidToEmployeeIdMap = new Map<string, string>();
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      // doc.id is the Firebase Auth UID, user.employeeId is the employee code
      if (user.employeeId) {
        uidToEmployeeIdMap.set(doc.id, user.employeeId);
      }
    });
    console.log(`Built map with ${uidToEmployeeIdMap.size} user mappings`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Update each overtime request
    for (const docSnapshot of snapshot.docs) {
      const request = docSnapshot.data();
      const currentEmployeeId = request.employeeId;
      
      // Check if this is a Firebase Auth UID (20 chars, alphanumeric)
      if (currentEmployeeId && currentEmployeeId.length === 20 && /^[a-zA-Z0-9]+$/.test(currentEmployeeId)) {
        const correctEmployeeId = uidToEmployeeIdMap.get(currentEmployeeId);
        
        if (correctEmployeeId && correctEmployeeId !== currentEmployeeId) {
          await updateDoc(doc(db, OVERTIME_COLLECTION, docSnapshot.id), {
            employeeId: correctEmployeeId
          });
          console.log(`Updated ${docSnapshot.id}: ${currentEmployeeId} -> ${correctEmployeeId}`);
          updatedCount++;
        } else if (!correctEmployeeId) {
          console.warn(`No mapping found for UID: ${currentEmployeeId}`);
          skippedCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`=== MIGRATION COMPLETE ===`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration error:', error);
  }
}

export const deleteAllOvertimeRequests = async () => {
  try {
    console.log('=== DELETING ALL OVERTIME REQUESTS ===');
    
    const q = query(collection(db, OVERTIME_COLLECTION));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} overtime requests to delete`);
    
    let deletedCount = 0;
    
    // Process in batches of 500
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = snapshot.docs.slice(i, i + 500);
      
      chunk.forEach((docSnapshot) => {
        batch.delete(doc(db, OVERTIME_COLLECTION, docSnapshot.id));
        deletedCount++;
      });
      
      await batch.commit();
      console.log(`Committed batch. Total deleted: ${deletedCount}`);
    }
    
    console.log(`=== DELETION COMPLETE ===`);
    console.log(`Deleted: ${deletedCount}`);
    return deletedCount;
  } catch (error) {
    console.error('Deletion error:', error);
    throw error;
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).fixOvertimeEmployeeIds = fixOvertimeEmployeeIds;
}

export const calculateOvertimeRate = (basicSalary: number, hours: number, requestType: 'planned' | 'emergency' | 'public_holiday' = 'planned') => {
  const hourlyRate = basicSalary / 173.33;
  let premium = 1;

  if (requestType === 'public_holiday') {
    premium = 1.5;
  }

  return hourlyRate * hours * premium;
};

export const validateOvertimeRequest = (request: Partial<OvertimeRequest>) => {
  const errors: string[] = [];

  if (!request.date || !(request.date instanceof Date) || isNaN(request.date.getTime())) {
    errors.push('Overtime date is required and must be valid.');
  }
  if (!request.hours || request.hours <= 0) {
    errors.push('Overtime hours must be greater than zero.');
  }
  if (request.hours && request.hours > 85) {
    errors.push('Overtime cannot exceed 85 hours per month.');
  }
  if (request.requestType === 'planned' && request.hours && request.hours > 60) {
    errors.push('Planned overtime cannot exceed 60 hours.');
  }
  if (request.requestType === 'emergency' && !request.requiresDivisionHeadApproval) {
    errors.push('Emergency overtime requires Division Head approval.');
  }
  return errors;
};

export const calculateHoursBetweenTimes = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(startHours, startMinutes, 0, 0);
  const endDate = new Date();
  endDate.setHours(endHours, endMinutes, 0, 0);
  const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return diff > 0 ? Number(diff.toFixed(2)) : 0;
};

export const validateBiometricVariance = (recordedMinutes: number, requestedMinutes: number) => {
  const variance = Math.abs(recordedMinutes - requestedMinutes);
  return variance <= 3;
};

// Save biometric data to Firestore
export const saveBiometricData = async (records: any[], missingStaff: any[]) => {
  try {
    console.log('=== SAVING BIOMETRIC DATA ===');
    const batch = writeBatch(db);

    // Save biometric records
    records.forEach(record => {
      const docRef = doc(collection(db, BIOMETRIC_COLLECTION));
      batch.set(docRef, {
        employeeId: record.employeeId,
        empId: record.empId,
        name: record.name,
        date: Timestamp.fromDate(record.date),
        finishTime: record.finishTime,
        overtimeHours: record.overtimeHours,
        workLocation: record.workLocation,
        workLocationId: record.workLocationId,
        createdAt: Timestamp.now(),
      });
    });

    // Save missing staff records
    missingStaff.forEach(staff => {
      const docRef = doc(collection(db, BIOMETRIC_COLLECTION));
      batch.set(docRef, {
        employeeId: staff.employeeId,
        empId: staff.empId,
        name: staff.name,
        workLocation: staff.workLocation,
        workLocationId: staff.workLocationId,
        isMissing: true,
        overtimeHours: 0,
        createdAt: Timestamp.now(),
      });
    });

    await batch.commit();
    console.log(`Saved ${records.length + missingStaff.length} biometric records`);
  } catch (error) {
    console.error('Error saving biometric data:', error);
    throw error;
  }
};

// Load biometric data from Firestore
export const getBiometricData = async () => {
  try {
    console.log('=== LOADING BIOMETRIC DATA ===');
    const q = query(collection(db, BIOMETRIC_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const records: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      records.push({
        id: doc.id,
        employeeId: data.employeeId,
        empId: data.empId,
        name: data.name,
        date: data.date?.toDate() || new Date(),
        finishTime: data.finishTime,
        overtimeHours: data.overtimeHours,
        workLocation: data.workLocation,
        workLocationId: data.workLocationId,
        isMissing: data.isMissing || false,
        selected: false,
      });
    });

    console.log(`Loaded ${records.length} biometric records`);
    return records;
  } catch (error) {
    console.error('Error loading biometric data:', error);
    throw error;
  }
};

// Clear old biometric data (optional cleanup)
export const clearBiometricData = async () => {
  try {
    console.log('=== CLEARING BIOMETRIC DATA ===');
    const q = query(collection(db, BIOMETRIC_COLLECTION));
    const snapshot = await getDocs(q);

    let deletedCount = 0;
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(db);
      const chunk = snapshot.docs.slice(i, i + 500);

      chunk.forEach(docSnapshot => {
        batch.delete(doc(db, BIOMETRIC_COLLECTION, docSnapshot.id));
        deletedCount++;
      });

      await batch.commit();
    }

    console.log(`Cleared ${deletedCount} biometric records`);
    return deletedCount;
  } catch (error) {
    console.error('Error clearing biometric data:', error);
    throw error;
  }
};

export const getOvertimeRequestPremium = (requestType: 'planned' | 'emergency' | 'public_holiday') => {
  if (requestType === 'public_holiday') return 1.5;
  return 1;
};

// Fetch attendance data and calculate overtime from check-out times after 19:00
export const getOvertimeFromAttendance = async (employeeId?: string) => {
  try {
    console.log('=== FETCHING OVERTIME FROM ATTENDANCE ===');
    const ATTENDANCE_COLLECTION = 'attendance';
    let q = query(collection(db, ATTENDANCE_COLLECTION), orderBy('date', 'desc'));

    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }

    const querySnapshot = await getDocs(q);
    const records: any[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const checkOutTime = data.checkOutTime?.toDate();
      const checkInTime = data.checkInTime?.toDate();

      // Calculate overtime from 19:00 local time (Maldives UTC+5) to finish time
      // 19:00 local = 14:00 UTC
      const overtimeStartHour = 14;
      let overtimeHours = 0;

      if (checkOutTime) {
        // Firebase timestamps are already in UTC, no conversion needed
        const checkOutTimeUTC = new Date(checkOutTime);
        const finishHour = checkOutTimeUTC.getUTCHours();

        // Use check-in time's date as the base for overtime start (same day as check-in)
        const baseDate = checkInTime ? new Date(checkInTime) : checkOutTimeUTC;

        console.log(`Employee ${data.employeeId} - CheckIn (UTC): ${baseDate.toISOString()}, CheckOut (UTC): ${checkOutTimeUTC.toISOString()}`);

        // Calculate overtime start based on check-in date at 19:00 UTC
        const overtimeStart = new Date(Date.UTC(
          baseDate.getUTCFullYear(),
          baseDate.getUTCMonth(),
          baseDate.getUTCDate(),
          overtimeStartHour,
          0,
          0,
          0
        ));

        // Check if check-out is on a different day than check-in
        const checkInDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()));
        const checkOutDate = new Date(Date.UTC(checkOutTimeUTC.getUTCFullYear(), checkOutTimeUTC.getUTCMonth(), checkOutTimeUTC.getUTCDate()));
        const isNextDay = checkOutDate.getTime() > checkInDate.getTime();

        // Convert UTC back to local time to check if it's before 6 AM
        const localFinishHour = (finishHour + 5) % 24; // UTC+5 to local

        let finishTimeForCalc = new Date(checkOutTimeUTC);
        if (isNextDay && localFinishHour < 6) {
          // Early morning check-out (before 6 AM local time)
          // Treat as part of previous day's attendance - use next day date for calculation
          finishTimeForCalc = new Date(Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate() + 1,
            checkOutTimeUTC.getUTCHours(),
            checkOutTimeUTC.getUTCMinutes(),
            checkOutTimeUTC.getUTCSeconds(),
            checkOutTimeUTC.getUTCMilliseconds()
          ));
          console.log(`Next-day early morning check-out detected (local ${localFinishHour}:00), using next day date for calculation`);
        } else if (isNextDay) {
          // Check-out is on next day but not early morning (data anomaly)
          // Cap overtime at end of check-in day (23:59:59 UTC)
          finishTimeForCalc = new Date(Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate(),
            23, 59, 59, 999
          ));
          console.log(`Next-day evening check-out detected (data anomaly), capping at end of check-in day`);
        }

        console.log(`Overtime start: ${overtimeStart.toISOString()}, Finish for calc: ${finishTimeForCalc.toISOString()}`);

        if (finishTimeForCalc.getTime() > overtimeStart.getTime()) {
          const diffMs = finishTimeForCalc.getTime() - overtimeStart.getTime();
          overtimeHours = diffMs / (1000 * 60 * 60);
          console.log(`Overtime calculated: ${overtimeHours.toFixed(2)} hours`);
        } else {
          console.log(`No overtime - finish time is before or at overtime start`);
        }
      } else {
        console.log(`No check-out time for employee ${data.employeeId} on ${data.date?.toDate()?.toISOString()}`);
      }

      // Include all attendance records, not just those with overtime
      records.push({
        id: doc.id,
        employeeId: data.employeeId,
        employeeName: data.employeeName || '',
        date: data.date?.toDate() || new Date(),
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        finishTime: checkOutTime ? checkOutTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Pending',
        overtimeHours: Number(overtimeHours.toFixed(2)),
        selected: false,
      });
    });

    console.log(`Loaded ${records.length} attendance records from attendance`);
    return records;
  } catch (error) {
    console.error('Error fetching overtime from attendance:', error);
    throw error;
  }
};
