import {
  collection,
  doc,
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
import type { Attendance, Shift, AttendanceAdjustmentRequest } from '../types';

const ATTENDANCE_COLLECTION = 'attendance';
const SHIFTS_COLLECTION = 'shifts';
const ATTENDANCE_ADJUSTMENTS_COLLECTION = 'attendance_adjustments';

// Attendance functions
export const getAttendance = async (employeeId?: string, startDate?: Date, endDate?: Date) => {
  try {
    let q = query(collection(db, ATTENDANCE_COLLECTION), orderBy('date', 'desc'));
    
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }
    
    if (startDate && endDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(startDate)), where('date', '<=', Timestamp.fromDate(endDate)));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      checkInTime: doc.data().checkInTime?.toDate(),
      checkOutTime: doc.data().checkOutTime?.toDate(),
    })) as Attendance[];
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const getTodayAttendanceForEmployee = async (employeeId: string) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('employeeId', '==', employeeId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      checkInTime: doc.data().checkInTime?.toDate(),
      checkOutTime: doc.data().checkOutTime?.toDate(),
    })) as Attendance[];

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Error fetching today attendance for employee:', error);
    throw error;
  }
};

export const getAttendanceByDate = async (date: Date) => {
  try {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      checkInTime: doc.data().checkInTime?.toDate(),
      checkOutTime: doc.data().checkOutTime?.toDate(),
    })) as Attendance[];
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    throw error;
  }
};

export const checkIn = async (employeeId: string, method: 'biometric' | 'web' | 'mobile') => {
  try {
    const attendance = {
      employeeId,
      date: new Date(),
      checkInTime: new Date(),
      checkInMethod: method,
      status: 'present',
    };
    
    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      ...attendance,
      date: Timestamp.fromDate(attendance.date),
      checkInTime: Timestamp.fromDate(attendance.checkInTime),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

export const checkOut = async (attendanceId: string, method: 'biometric' | 'web' | 'mobile') => {
  try {
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId), {
      checkOutTime: Timestamp.fromDate(new Date()),
      checkOutMethod: method,
    });
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

export const requestAttendanceAdjustment = async (adjustment: Partial<AttendanceAdjustmentRequest>) => {
  try {
    const newRequest = {
      ...adjustment,
      status: 'pending',
      requestedDate: new Date(),
    };
    const docRef = await addDoc(collection(db, ATTENDANCE_ADJUSTMENTS_COLLECTION), {
      ...newRequest,
      date: Timestamp.fromDate(newRequest.date!),
      requestedDate: Timestamp.fromDate(newRequest.requestedDate),
      requestedCheckIn: newRequest.requestedCheckIn ? Timestamp.fromDate(newRequest.requestedCheckIn) : null,
      requestedCheckOut: newRequest.requestedCheckOut ? Timestamp.fromDate(newRequest.requestedCheckOut) : null,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error requesting attendance adjustment:', error);
    throw error;
  }
};

export const getAttendanceAdjustmentRequests = async (employeeId?: string) => {
  try {
    let q = query(collection(db, ATTENDANCE_ADJUSTMENTS_COLLECTION), orderBy('requestedDate', 'desc'));

    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      requestedDate: doc.data().requestedDate.toDate(),
      requestedCheckIn: doc.data().requestedCheckIn?.toDate(),
      requestedCheckOut: doc.data().requestedCheckOut?.toDate(),
    })) as AttendanceAdjustmentRequest[];
  } catch (error) {
    console.error('Error fetching attendance adjustment requests:', error);
    throw error;
  }
};

export const approveAttendanceAdjustmentRequest = async (
  id: string,
  approverId: string,
  approverName: string,
  approved: boolean,
  comments?: string
) => {
  try {
    const status = approved ? 'approved' : 'rejected';
    await updateDoc(doc(db, ATTENDANCE_ADJUSTMENTS_COLLECTION, id), {
      status,
      approverComments: comments || '',
      approverId,
      approverName,
    });
  } catch (error) {
    console.error('Error updating attendance adjustment request:', error);
    throw error;
  }
};

export const updateAttendance = async (id: string, data: Partial<Attendance>) => {
  try {
    const updateData: any = { ...data };
    if (updateData.date && updateData.date instanceof Date) {
      updateData.date = Timestamp.fromDate(updateData.date);
    }
    if (updateData.checkInTime && updateData.checkInTime instanceof Date) {
      updateData.checkInTime = Timestamp.fromDate(updateData.checkInTime);
    }
    if (updateData.checkOutTime && updateData.checkOutTime instanceof Date) {
      updateData.checkOutTime = Timestamp.fromDate(updateData.checkOutTime);
    }
    
    await updateDoc(doc(db, ATTENDANCE_COLLECTION, id), updateData);
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
};

// Shift functions
export const getShifts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SHIFTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Shift[];
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
};

export const createShift = async (shift: Partial<Shift>) => {
  try {
    const docRef = await addDoc(collection(db, SHIFTS_COLLECTION), shift);
    return docRef.id;
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
};

export const updateShift = async (id: string, shift: Partial<Shift>) => {
  try {
    await updateDoc(doc(db, SHIFTS_COLLECTION, id), shift);
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
};

export const deleteShift = async (id: string) => {
  try {
    await deleteDoc(doc(db, SHIFTS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting shift:', error);
    throw error;
  }
};

// Get attendance statistics
export const getAttendanceStats = async (date: Date) => {
  try {
    const attendance = await getAttendanceByDate(date);
    
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.lateArrival).length,
      earlyDeparture: attendance.filter(a => a.earlyDeparture).length,
      onLeave: attendance.filter(a => a.status === 'leave').length,
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    throw error;
  }
};

export const getShiftForEmployee = async (employeeId: string) => {
  try {
    const q = query(collection(db, SHIFTS_COLLECTION), where('employeeId', '==', employeeId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].data() as Shift;
  } catch (error) {
    console.error('Error fetching shift for employee:', error);
    throw error;
  }
};

export const validateAttendance = (attendance: Partial<Attendance>) => {
  const errors: string[] = [];
  if (!attendance.employeeId) {
    errors.push('Employee ID is required.');
  }
  if (!attendance.date) {
    errors.push('Attendance date is required.');
  }
  if (!attendance.checkInTime) {
    errors.push('Check-in time is required.');
  }
  if (!attendance.checkOutTime) {
    errors.push('Check-out time is required.');
  }
  return errors;
};

export const calculateLateArrival = (scheduledStart: string, actualCheckIn: Date) => {
  const [scheduledHour, scheduledMinute] = scheduledStart.split(':').map(Number);
  const scheduledDate = new Date(actualCheckIn);
  scheduledDate.setHours(scheduledHour, scheduledMinute, 0, 0);
  return actualCheckIn.getTime() > scheduledDate.getTime();
};

export const calculateEarlyDeparture = (scheduledEnd: string, actualCheckOut: Date) => {
  const [scheduledHour, scheduledMinute] = scheduledEnd.split(':').map(Number);
  const scheduledDate = new Date(actualCheckOut);
  scheduledDate.setHours(scheduledHour, scheduledMinute, 0, 0);
  return actualCheckOut.getTime() < scheduledDate.getTime();
};

export const calculateShiftAllowance = (shift: Shift | null, basicSalary: number) => {
  if (!shift) return 0;
  const dayCount = shift.daysOfWeek.length;
  const hourlyRate = basicSalary / 173.33;
  const shiftHours = ((parseInt(shift.endTime.split(':')[0], 10) * 60 + parseInt(shift.endTime.split(':')[1], 10)) - (parseInt(shift.startTime.split(':')[0], 10) * 60 + parseInt(shift.startTime.split(':')[1], 10))) / 60;
  const shiftPremium = dayCount > 5 ? 0.15 : 0.1;
  return Number((hourlyRate * shiftHours * shiftPremium).toFixed(2));
};

export const calculateAttendanceAllowance = (presentDays: number, monthlySalary: number) => {
  if (presentDays >= 26) {
    return Number((monthlySalary * 0.1).toFixed(2));
  }
  if (presentDays >= 22) {
    return Number((monthlySalary * 0.05).toFixed(2));
  }
  return 0;
};

export const getAttendanceAllowanceEligibility = (presentDays: number) => {
  if (presentDays >= 26) return '10% attendance allowance';
  if (presentDays >= 22) return '5% attendance allowance';
  return 'Not eligible';
};

// Calculate attendance statistics for payroll
export const getAttendanceStatsForPayroll = async (employeeId: string, month: number, year: number) => {
  try {
    // Get the first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    const attendance = await getAttendance(employeeId, startDate, endDate);

    let daysWorked = 0;
    let absentDays = 0;
    let fridaysWorked = 0;
    let halfDays = 0;
    let leaveDays = 0;

    attendance.forEach(record => {
      const dayOfWeek = record.date.getDay(); // 0 = Sunday, 5 = Friday

      if (record.status === 'present') {
        daysWorked++;
        if (dayOfWeek === 5) { // Friday
          fridaysWorked++;
        }
      } else if (record.status === 'absent') {
        absentDays++;
      } else if (record.status === 'half_day') {
        halfDays++;
        daysWorked += 0.5;
        if (dayOfWeek === 5) {
          fridaysWorked += 0.5;
        }
      } else if (record.status === 'leave') {
        leaveDays++;
      }
    });

    return {
      daysWorked,
      absentDays,
      fridaysWorked,
      halfDays,
      leaveDays,
      totalDaysInMonth: endDate.getDate(),
    };
  } catch (error) {
    console.error('Error calculating attendance stats for payroll:', error);
    throw error;
  }
};

