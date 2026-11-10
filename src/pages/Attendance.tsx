import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, RefreshCw, Download, ArrowRight, ArrowLeft, Upload, MapPin, Edit2, Save, X, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getAttendanceStats, getTodayAttendanceForEmployee, checkIn, checkOut, requestAttendanceAdjustment } from '../lib/attendance';
import { useAuth } from '../contexts/AuthContext';
import { getEmployees } from '../lib/employees';
import { getAllWorkLocations } from '../lib/workLocation';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../lib/permissions';
import { addDoc, collection, query, where, getDocs, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import * as XLSX from 'xlsx';

export const Attendance = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [todayStats, setTodayStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    earlyDeparture: 0,
    onLeave: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceToday, setAttendanceToday] = useState<any | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentCheckIn, setAdjustmentCheckIn] = useState('');
  const [adjustmentCheckOut, setAdjustmentCheckOut] = useState('');
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState('');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [missingStaff, setMissingStaff] = useState<any[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedFirstPunch, setEditedFirstPunch] = useState('');
  const [editedLastPunch, setEditedLastPunch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [firebaseAttendance, setFirebaseAttendance] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [fixingEmployeeIds, setFixingEmployeeIds] = useState(false);
  const [editingFirebaseRecord, setEditingFirebaseRecord] = useState<string | null>(null);
  const [editedCheckIn, setEditedCheckIn] = useState('');
  const [editedCheckOut, setEditedCheckOut] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedLate, setEditedLate] = useState(false);
  const [savingFirebaseRecord, setSavingFirebaseRecord] = useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterSearchName, setFilterSearchName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadType, setUploadType] = useState<'regular' | 'friday'>('regular');
  const [dailyReportDate, setDailyReportDate] = useState('');
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [dailyReportData, setDailyReportData] = useState<any[]>([]);
  const [loadingDailyReport, setLoadingDailyReport] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [supervisorComment, setSupervisorComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savedComment, setSavedComment] = useState('');
  const [staffComments, setStaffComments] = useState<{ [key: string]: string }>({});
  const [staffCommentText, setStaffCommentText] = useState('');
  const [savingStaffComment, setSavingStaffComment] = useState(false);

  const loadTodayStats = useCallback(async () => {
    try {
      const stats = await getAttendanceStats(new Date());
      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadTodayAttendance = useCallback(async () => {
    if (!user?.employeeId) return;
    try {
      const record = await getTodayAttendanceForEmployee(user.employeeId);
      setAttendanceToday(record);
      setIsCheckedIn(Boolean(record?.checkInTime && !record?.checkOutTime));
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  }, [user]);

  useEffect(() => {
    loadTodayStats();
    loadTodayAttendance();
    loadEmployeesAndLocations();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadTodayStats, loadTodayAttendance]);

  const loadEmployeesAndLocations = async () => {
    try {
      const [empData, locData] = await Promise.all([
        getEmployees(),
        getAllWorkLocations()
      ]);
      setEmployees(empData);
      setWorkLocations(locData);
    } catch (error) {
      console.error('Error loading employees and locations:', error);
    }
  };

  const loadFirebaseAttendance = async () => {
    setLoadingHistory(true);
    try {
      const q = query(collection(db, 'attendance'));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
      }));

      // Sort by date descending
      records.sort((a, b) => b.date - a.date);
      setFirebaseAttendance(records);
    } catch (error) {
      console.error('Error loading Firebase attendance:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteAllFirebase = async () => {
    if (!confirm('Are you sure you want to delete ALL attendance records from Firebase? This cannot be undone.')) {
      return;
    }

    setDeleteAllLoading(true);
    try {
      const q = query(collection(db, 'attendance'));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setFirebaseAttendance([]);
      alert('All attendance records deleted successfully');
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Error deleting records');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleFixEmployeeIds = async () => {
    console.log('handleFixEmployeeIds called');
    if (!confirm('This will update employee IDs in the database based on the Excel file. Continue?')) {
      return;
    }

    if (!attendanceData || attendanceData.length === 0) {
      alert('Please upload an Excel file first');
      return;
    }

    console.log('Starting to fix employee IDs...');
    setFixingEmployeeIds(true);
    let fixedCount = 0;
    let skippedCount = 0;

    try {
      const employees = await getEmployees();
      console.log('Loaded employees:', employees.length);

      for (const emp of attendanceData) {
        if (!emp.empId || !emp.name) continue;

        // First try to match by employee ID
        let employee = employees.find(e =>
          (e.employeeId?.trim() || e.employeeId) === (emp.empId?.trim() || emp.empId)
        );

        // If no ID match, try name matching only if unique
        if (!employee) {
          const employeesWithSameName = employees.filter(e =>
            (e.fullName?.toLowerCase().trim() || e.fullName?.toLowerCase()) === (emp.name?.toLowerCase().trim() || emp.name?.toLowerCase())
          );
          if (employeesWithSameName.length === 1) {
            employee = employeesWithSameName[0];
          }
        }

        if (employee) {
          if (employee.employeeId !== emp.empId) {
            // Update employeeId in database
            await updateDoc(doc(db, 'employees', employee.id), {
              employeeId: emp.empId
            });
            fixedCount++;
            console.log(`Fixed: ${employee.fullName} - ${employee.employeeId} -> ${emp.empId}`);
          } else {
            skippedCount++;
          }
        } else {
          console.log(`No match found for Excel employee: ${emp.empId} ${emp.name}`);
        }
      }

      alert(`Fixed ${fixedCount} employee IDs, skipped ${skippedCount}`);
    } catch (error) {
      console.error('Error fixing employee IDs:', error);
      alert('Error fixing employee IDs');
    } finally {
      setFixingEmployeeIds(false);
    }
  };

  const handleEditFirebaseRecord = (record: any) => {
    setEditingFirebaseRecord(record.id);
    // Format time as HH:MM in 24-hour format
    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    setEditedCheckIn(record.checkInTime ? formatTime(record.checkInTime) : '');
    setEditedCheckOut(record.checkOutTime ? formatTime(record.checkOutTime) : '');
    setEditedStatus(record.status || '');
    setEditedLate(record.lateArrival || false);
  };

  const handleSaveFirebaseRecord = async (recordId: string) => {
    setSavingFirebaseRecord(true);
    try {
      const record = firebaseAttendance.find(r => r.id === recordId);
      if (!record) return;

      const updateData: any = {};

      // Parse and update check-in time
      if (editedCheckIn) {
        const [hours, minutes] = editedCheckIn.split(':').map(Number);
        const checkInDate = new Date(record.date);
        checkInDate.setHours(hours, minutes, 0, 0);
        updateData.checkInTime = Timestamp.fromDate(checkInDate);
      } else {
        updateData.checkInTime = null;
      }

      // Parse and update check-out time
      if (editedCheckOut) {
        const [hours, minutes] = editedCheckOut.split(':').map(Number);
        const checkOutDate = new Date(record.date);
        checkOutDate.setHours(hours, minutes, 0, 0);
        updateData.checkOutTime = Timestamp.fromDate(checkOutDate);
      } else {
        updateData.checkOutTime = null;
      }

      // Update status
      updateData.status = editedStatus;

      // Update late arrival
      updateData.lateArrival = editedLate;

      await updateDoc(doc(db, 'attendance', recordId), updateData);

      // Reload the data
      await loadFirebaseAttendance();
      setEditingFirebaseRecord(null);
      setSaveSuccess('Record saved successfully');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Error saving record');
    } finally {
      setSavingFirebaseRecord(false);
    }
  };

  const handleCancelEditFirebase = () => {
    setEditingFirebaseRecord(null);
    setEditedCheckIn('');
    setEditedCheckOut('');
    setEditedStatus('');
    setEditedLate(false);
  };

  const handleGenerateDailyReport = async () => {
    if (!dailyReportDate) {
      alert('Please select a date');
      return;
    }

    setLoadingDailyReport(true);
    try {
      const selectedDate = new Date(dailyReportDate);
      const startOfDay = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0, 0, 0, 0
      ));
      const endOfDay = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        23, 59, 59, 999
      ));

      const q = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );

      const querySnapshot = await getDocs(q);
      const records: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          checkInTime: data.checkInTime?.toDate(),
          checkOutTime: data.checkOutTime?.toDate(),
          date: data.date?.toDate(),
        });
      });

      // Fetch all work locations
      const workLocations = await getAllWorkLocations();

      // Group by work location assignment
      const groupedByLocation: { [key: string]: any[] } = {};
      records.forEach(record => {
        const emp = employees.find(e => e.employeeId === record.employeeId);
        
        // Find the work location this employee is assigned to
        const assignedLocation = workLocations.find(loc => 
          loc.assignedStaff?.includes(emp?.id)
        );
        
        const locationName = assignedLocation?.name || 'Unassigned';
        
        if (!groupedByLocation[locationName]) {
          groupedByLocation[locationName] = [];
        }
        groupedByLocation[locationName].push({
          ...record,
          employeeName: record.employeeName || emp?.fullName || 'Unknown',
          workLocation: locationName,
          position: emp?.position || emp?.jobTitle || emp?.designation || 'N/A',
          lateArrival: record.lateArrival || false,
        });
      });

      setDailyReportData(Object.entries(groupedByLocation).map(([location, data]) => ({
        location,
        employees: data.sort((a, b) => (a.employeeName || '').localeCompare(b.employeeName || ''))
      })));

      // Load saved comment for this date
      const commentQuery = query(
        collection(db, 'daily_report_comments'),
        where('date', '==', dailyReportDate)
      );
      const commentSnapshot = await getDocs(commentQuery);
      if (!commentSnapshot.empty) {
        setSavedComment(commentSnapshot.docs[0].data().comment || '');
        setSupervisorComment(commentSnapshot.docs[0].data().comment || '');
      } else {
        setSavedComment('');
        setSupervisorComment('');
      }

      // Load staff comments for this date
      const staffCommentQuery = query(
        collection(db, 'daily_report_staff_comments'),
        where('date', '==', dailyReportDate)
      );
      const staffCommentSnapshot = await getDocs(staffCommentQuery);
      const commentsMap: { [key: string]: string } = {};
      staffCommentSnapshot.forEach(doc => {
        const data = doc.data();
        commentsMap[data.attendanceId] = data.comment || '';
      });
      setStaffComments(commentsMap);

      setShowDailyReport(true);
    } catch (error) {
      console.error('Error generating daily report:', error);
      alert('Error generating daily report');
    } finally {
      setLoadingDailyReport(false);
    }
  };

  const handlePrintDailyReport = () => {
    window.print();
  };

  const handleSaveComment = async () => {
    if (!dailyReportDate) return;
    
    setSavingComment(true);
    try {
      const commentQuery = query(
        collection(db, 'daily_report_comments'),
        where('date', '==', dailyReportDate)
      );
      const commentSnapshot = await getDocs(commentQuery);
      
      if (!commentSnapshot.empty) {
        // Update existing comment
        await updateDoc(doc(db, 'daily_report_comments', commentSnapshot.docs[0].id), {
          comment: supervisorComment,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new comment
        await addDoc(collection(db, 'daily_report_comments'), {
          date: dailyReportDate,
          comment: supervisorComment,
          supervisorId: user?.id,
          supervisorName: user?.displayName || user?.email || 'Supervisor',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      setSavedComment(supervisorComment);
      alert('Comment saved successfully');
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Failed to save comment');
    } finally {
      setSavingComment(false);
    }
  };

  const handleEditStatus = (recordId: string) => {
    setEditingStatus(recordId);
  };

  const handleSaveStatus = async (recordId: string, newStatus: boolean) => {
    setSavingStatus(true);
    try {
      await updateDoc(doc(db, 'attendance', recordId), {
        lateArrival: newStatus
      });

      // Update local data
      setDailyReportData(prevData =>
        prevData.map(locationGroup => ({
          ...locationGroup,
          employees: locationGroup.employees.map((emp: any) =>
            emp.id === recordId ? { ...emp, lateArrival: newStatus } : emp
          )
        }))
      );

      setEditingStatus(null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCancelEditStatus = () => {
    setEditingStatus(null);
  };

  const handleSaveStaffComment = async (attendanceId: string) => {
    if (!dailyReportDate) return;
    
    setSavingStaffComment(true);
    try {
      const staffCommentQuery = query(
        collection(db, 'daily_report_staff_comments'),
        where('date', '==', dailyReportDate),
        where('attendanceId', '==', attendanceId)
      );
      const staffCommentSnapshot = await getDocs(staffCommentQuery);
      
      if (!staffCommentSnapshot.empty) {
        // Update existing comment
        await updateDoc(doc(db, 'daily_report_staff_comments', staffCommentSnapshot.docs[0].id), {
          comment: staffCommentText,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new comment
        await addDoc(collection(db, 'daily_report_staff_comments'), {
          date: dailyReportDate,
          attendanceId,
          comment: staffCommentText,
          supervisorId: user?.id,
          supervisorName: user?.displayName || user?.email || 'Supervisor',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      setStaffComments(prev => ({ ...prev, [attendanceId]: staffCommentText }));
      setStaffCommentText('');
    } catch (error) {
      console.error('Error saving staff comment:', error);
      alert('Failed to save comment');
    } finally {
      setSavingStaffComment(false);
    }
  };

  const handleCancelStaffComment = () => {
    setStaffCommentText('');
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadFirebaseAttendance();
    }
  }, [activeTab]);

  const handleCheckIn = async () => {
    if (!user?.employeeId) {
      alert('Employee ID not found');
      return;
    }
    
    try {
      setLoading(true);
      await checkIn(user.employeeId, 'web');
      setIsCheckedIn(true);
      await Promise.all([loadTodayStats(), loadTodayAttendance()]);
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceToday?.id) {
      alert('No attendance record found for today.');
      return;
    }
    try {
      setLoading(true);
      await checkOut(attendanceToday.id, 'web');
      setIsCheckedIn(false);
      await Promise.all([loadTodayStats(), loadTodayAttendance()]);
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const submitAdjustmentRequest = async () => {
    if (!user?.employeeId) return;
    if (!adjustmentReason) {
      alert('Please provide a reason for the adjustment.');
      return;
    }

    setAdjustmentSubmitting(true);
    try {
      const adjustment: any = {
        employeeId: user.employeeId,
        date: new Date(),
        reason: adjustmentReason,
      };
      if (adjustmentCheckIn) {
        adjustment.requestedCheckIn = new Date(`${new Date().toDateString()} ${adjustmentCheckIn}`);
      }
      if (adjustmentCheckOut) {
        adjustment.requestedCheckOut = new Date(`${new Date().toDateString()} ${adjustmentCheckOut}`);
      }
      await requestAttendanceAdjustment(adjustment);
      setAdjustmentSuccess('Attendance adjustment request submitted.');
      setAdjustmentReason('');
      setAdjustmentCheckIn('');
      setAdjustmentCheckOut('');
    } catch (error) {
      console.error('Error submitting adjustment request:', error);
      alert('Failed to submit adjustment request');
    } finally {
      setAdjustmentSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadDate) {
      alert('Please select a date for the attendance data');
      return;
    }

    setLoadingAttendance(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

        // Process attendance data based on upload type
        const processor = uploadType === 'friday' ? processFridayAttendanceData : processAttendanceData;
        const { attendanceRecords, missingStaff } = processor(jsonData, uploadDate);
        setAttendanceData(attendanceRecords);
        setMissingStaff(missingStaff);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Failed to parse Excel file');
      } finally {
        setLoadingAttendance(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

const processAttendanceData = (rawData: any[], selectedDate: string) => {
  const employeeMap = new Map<string, any>();
  const punchedEmployeeIds = new Set<string>();

  // Parse the selected date for filtering (use UTC to avoid timezone issues)
  const targetDate = new Date(selectedDate + 'T00:00:00Z');
  const targetDateKey = targetDate.toISOString().split('T')[0];

  // Calculate next day for including early morning punches (before 4 AM)
  const nextDate = new Date(targetDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextDateKey = nextDate.toISOString().split('T')[0];

  let recordsFound = false;
  const availableDates = new Set<string>();

    rawData.forEach((row: any) => {
    const empId = row['User No.']?.toString().trim() || row['Employee ID']?.toString().trim();
    const name = row['Name']?.toString().trim();
    const dateTimeStr = row['Date/Time']?.toString().trim();

    // Parse combined date/time (e.g., "11/1/26 8:03")
    if (!dateTimeStr) return;

    const dateTimeParts = dateTimeStr.split(' ');
    const dateStr = dateTimeParts[0];
    const timeStr = dateTimeParts[1] || '00:00';

    // Parse date from Excel to check if it matches selected date
    // Excel format can be either MM/DD/YY or DD/MM/YY - detect automatically
    let isNextDayEarlyPunch = false;
    if (dateStr && dateStr.includes('/')) {
      const dateParts = dateStr.split('/');
      let month, day, year;
      year = parseInt(dateParts[2]);

      if (year < 100) {
        year += 2000;
      }

      // Detect format: if first part > 12, it's DD/MM/YY; otherwise MM/DD/YY
      const firstPart = parseInt(dateParts[0]);
      const secondPart = parseInt(dateParts[1]);

      if (firstPart > 12) {
        // DD/MM/YY format
        day = firstPart;
        month = secondPart - 1; // JavaScript months are 0-indexed
      } else {
        // MM/DD/YY format
        month = firstPart - 1; // JavaScript months are 0-indexed
        day = secondPart;
      }

      // Use UTC methods to avoid timezone offset issues
      const excelDate = new Date(Date.UTC(year, month, day));
      const excelDateKey = excelDate.toISOString().split('T')[0];
      availableDates.add(excelDateKey);

      // Check if it matches selected date
      if (excelDateKey === targetDateKey) {
        // Same day, include it
        recordsFound = true;
      } else if (excelDateKey === nextDateKey) {
        // Next day - only include if time is before 4 AM
        const hour = parseInt(timeStr.split(':')[0]) || 0;
        if (hour >= 4) {
          return; // Skip if it's 4 AM or later on next day
        }
        isNextDayEarlyPunch = true;
        recordsFound = true;
      } else {
        // Not the selected day or next day, skip
        return;
      }
    } else {
      return; // Skip if no valid date format
    }

    // Infer status from time:
    // - Check-in (0): before 12 PM on the same day
    // - Check-out (1): after 12 PM on the same day, OR early morning next day (before 4 AM)
    const hour = parseInt(timeStr.split(':')[0]) || 0;
    const status = isNextDayEarlyPunch ? 1 : (hour < 12 ? 0 : 1);

    if (!empId || !timeStr) return;

    // Combine date with time from Excel
    // For next day early punches, use the actual next day date for display
    // but they are still grouped under the selected date for attendance calculation
    const [timeHour, timeMinute] = timeStr.split(':');
    const punchDate = isNextDayEarlyPunch ? new Date(nextDate) : new Date(targetDate);
    punchDate.setHours(parseInt(timeHour), parseInt(timeMinute), 0, 0);

    // Get the date key (YYYY-MM-DD) for grouping
    const dateKey = targetDate.toISOString().split('T')[0];
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          empId,
          name: name,
          department: row['Department'],
          dailyRecords: new Map<string, any>(), // Map of dateKey -> { firstCheckIn, lastCheckOut, punches }
          firstPunch: null,
          lastPunch: null,
          totalPunches: 0,
          isLate: false
        });
      }

      const empData = employeeMap.get(empId);

      // Initialize daily record if not exists
      if (!empData.dailyRecords.has(dateKey)) {
        empData.dailyRecords.set(dateKey, {
          firstCheckIn: null,
          lastCheckOut: null,
          punches: []
        });
      }

      const dailyRecord = empData.dailyRecords.get(dateKey);
      dailyRecord.punches.push({ time: punchDate, status, isNextDayEarlyPunch });

      // Update first check-in (status 0)
      if (status === 0 && (!dailyRecord.firstCheckIn || punchDate < dailyRecord.firstCheckIn)) {
        dailyRecord.firstCheckIn = punchDate;
      }

      // Update last check-out (status 1)
      if (status === 1 && (!dailyRecord.lastCheckOut || punchDate > dailyRecord.lastCheckOut)) {
        dailyRecord.lastCheckOut = punchDate;
      }

      // Update total punches
      empData.totalPunches++;
    });

  if (!recordsFound) {
    const datesList = Array.from(availableDates).sort().join(', ');
    throw new Error(`No attendance data found for ${selectedDate} in the Excel file. Available dates in file: ${datesList || 'none'}`);
  }

    // For each employee, find first/last punch with time-based filters
    employeeMap.forEach((empData) => {
      const sortedDates = Array.from(empData.dailyRecords.keys()).sort();
      empData.dailyAttendance = [];

      sortedDates.forEach((dateKey, index) => {
        const dailyRecord = empData.dailyRecords.get(dateKey);

        // Find first check-in of the day (no time filter for display - show earliest punch)
        const allCheckIns = dailyRecord.punches.filter((p: any) => p.status === 0);
        allCheckIns.sort((a: any, b: any) => a.time.getTime() - b.time.getTime());
        const firstCheckIn = allCheckIns.length > 0 ? allCheckIns[0].time : null;

        // Find last check-out after 5 PM on current day
        const eveningCheckOuts = dailyRecord.punches.filter((p: any) => 
          p.status === 1 && 
          p.time.getHours() >= 17
        );
        eveningCheckOuts.sort((a: any, b: any) => b.time.getTime() - a.time.getTime());
        let lastCheckOut = eveningCheckOuts.length > 0 ? eveningCheckOuts[0].time : null;

        // If no check-out after 5 PM, look for first check-out next day before 5 AM
        if (!lastCheckOut && index < sortedDates.length - 1) {
          const nextDateKey = sortedDates[index + 1];
          const nextRecord = empData.dailyRecords.get(nextDateKey);
          if (nextRecord) {
            const nextDayEarlyCheckOuts = nextRecord.punches.filter((p: any) =>
              p.status === 1 &&
              p.time.getHours() < 5
            );
            nextDayEarlyCheckOuts.sort((a: any, b: any) => a.time.getTime() - b.time.getTime());
            if (nextDayEarlyCheckOuts.length > 0) {
              lastCheckOut = nextDayEarlyCheckOuts[0].time;
            }
          }
        }

        empData.dailyAttendance.push({
          date: dateKey,
          firstCheckIn,
          lastCheckOut,
          punches: dailyRecord.punches
        });
      });

      // After processing all days, set overall first/last punch
      // First punch: earliest check-in on the selected date (not including next day early punches)
      // Also exclude early morning punches (before 4 AM) on the same day as they are likely check-outs from previous day
      let earliestCheckIn: Date | null = null;
      empData.dailyRecords.forEach((dailyRecord: any) => {
        dailyRecord.punches.forEach((punch: any) => {
          // Only consider check-ins that are on the selected date and not early morning (before 4 AM)
          // Early morning punches (before 4 AM) are likely check-outs from previous day
          const punchHour = punch.time.getHours();
          if (punch.status === 0 && !punch.isNextDayEarlyPunch && punchHour >= 4 && (!earliestCheckIn || punch.time < earliestCheckIn)) {
            earliestCheckIn = punch.time;
          }
        });
      });
      empData.firstPunch = earliestCheckIn;

      // Last punch: find the latest check-out after 17:00 (5 PM) on the selected date
      // If no check-out after 17:00, look for next-day early check-outs (before 5 AM)
      let latestCheckOut: Date | null = null;
      empData.dailyRecords.forEach((dailyRecord: any) => {
        dailyRecord.punches.forEach((punch: any) => {
          if (punch.status === 1 && punch.time.getHours() >= 17 && (!latestCheckOut || punch.time > latestCheckOut)) {
            latestCheckOut = punch.time;
          }
        });
      });

      // If no check-out after 17:00, look for next-day early check-outs (before 5 AM)
      if (!latestCheckOut) {
        empData.dailyRecords.forEach((dailyRecord: any) => {
          dailyRecord.punches.forEach((punch: any) => {
            if (punch.status === 1 && punch.time.getHours() < 5 && (!latestCheckOut || punch.time > latestCheckOut)) {
              latestCheckOut = punch.time;
            }
          });
        });
      }

      empData.lastPunch = latestCheckOut;
    });

    // Check if first punch is late based on department and day of week, and match with work location
    employeeMap.forEach((empData) => {
      // Match employee with work location first - prioritize employee ID matching over name matching
      let employee = employees.find(emp =>
        (emp.employeeId?.trim() || emp.employeeId) === (empData.empId?.trim() || empData.empId)
      );

      // Try partial ID match (e.g., "326" matches "MAD0326")
      if (!employee && empData.empId) {
        employee = employees.find(emp =>
          emp.employeeId?.includes(empData.empId.trim()) || empData.empId.trim().includes(emp.employeeId || '')
        );
      }

      // Only use name matching if employee ID didn't match AND there's no ambiguity (only one employee with that name)
      if (!employee && empData.name) {
        const employeesWithSameName = employees.filter(emp =>
          (emp.fullName?.toLowerCase().trim() || emp.fullName?.toLowerCase()) === (empData.name?.toLowerCase().trim() || empData.name?.toLowerCase())
        );
        if (employeesWithSameName.length === 1) {
          employee = employeesWithSameName[0];
        }
      }

      if (!employee) {
        console.log('No match found for Excel employee:', empData.empId, empData.name);
      }

      if (employee) {
        punchedEmployeeIds.add(employee.id);
        console.log('Matched employee:', empData.empId, '->', employee.employeeId, 'Firebase ID:', employee.id);
        // Find work location for this employee
        const location = workLocations.find(loc =>
          loc.assignedStaff?.includes(employee.id)
        );
        empData.workLocation = location?.name || 'Unassigned';
        empData.workLocationId = location?.id;
        empData.employeeId = employee.employeeId || empData.empId; // Use actual employeeId, not Firebase document ID
        empData.firebaseEmployeeId = employee.id; // Store Firebase ID separately

        // Check if first punch is late based on work location rules
        if (empData.firstPunch && empData.workLocationId) {
          const firstPunchDate = new Date(empData.firstPunch);
          const hours = firstPunchDate.getHours();
          const minutes = firstPunchDate.getMinutes();
          const dayOfWeek = firstPunchDate.getDay(); // 0 = Sunday, 6 = Saturday

          // Get work location for this employee
          const location = workLocations.find(loc => loc.id === empData.workLocationId);

          // Define late threshold based on work location rules
          let lateHour = 8;
          let lateMinute = 30; // Default: 8:30 AM

          if (location) {
            let threshold;
            if (dayOfWeek >= 0 && dayOfWeek <= 4) {
              // Sunday to Thursday
              threshold = location.lateThresholdSundayToThursday;
            } else if (dayOfWeek === 5) {
              // Friday
              threshold = location.lateThresholdFriday;
            } else {
              // Saturday
              threshold = location.lateThresholdSaturday;
            }

            if (threshold) {
              const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);
              if (!isNaN(thresholdHour) && !isNaN(thresholdMinute)) {
                lateHour = thresholdHour;
                lateMinute = thresholdMinute;
              }
            }
          }

          // Check if time is after the late threshold
          if (hours > lateHour || (hours === lateHour && minutes > lateMinute)) {
            empData.isLate = true;
          }
        }
      } else {
        empData.workLocation = 'Not Found';
        empData.workLocationId = null;
        empData.employeeId = null;
      }
    });
    
    // Find missing staff (employees assigned to work locations who didn't punch)
    const missingStaff = employees
      .filter(emp => {
        // Only active employees assigned to a work location
        if (emp.status !== 'active') return false;
        const hasLocation = workLocations.some(loc => loc.assignedStaff?.includes(emp.id));
        if (!hasLocation) return false;
        // Didn't punch today
        return !punchedEmployeeIds.has(emp.id);
      })
      .map(emp => {
        const location = workLocations.find(loc => loc.assignedStaff?.includes(emp.id));
        return {
          empId: emp.employeeId,
          name: emp.fullName,
          department: emp.department || 'N/A',
          workLocation: location?.name || 'Unassigned',
          workLocationId: location?.id,
          employeeId: emp.id,
          isMissing: true,
          firstPunch: null,
          lastPunch: null,
          totalPunches: 0
        };
      });
    
    const attendanceRecords = Array.from(employeeMap.values());
    return { attendanceRecords, missingStaff };
  };

const processFridayAttendanceData = (rawData: any[], selectedDate: string) => {
  const employeeMap = new Map<string, any>();
  const punchedEmployeeIds = new Set<string>();

  // Parse the selected date for filtering (use UTC to avoid timezone issues)
  const targetDate = new Date(selectedDate + 'T00:00:00Z');
  const targetDateKey = targetDate.toISOString().split('T')[0];

  let recordsFound = false;
  const availableDates = new Set<string>();

  rawData.forEach((row: any) => {
    const empId = row['User No.']?.toString().trim() || row['Employee ID']?.toString().trim();
    const name = row['Name']?.toString().trim();
    const dateTimeStr = row['Date/Time']?.toString().trim();

    // Parse combined date/time (e.g., "11/1/26 8:03")
    if (!dateTimeStr) return;

    const dateTimeParts = dateTimeStr.split(' ');
    const dateStr = dateTimeParts[0];
    const timeStr = dateTimeParts[1] || '00:00';

    // Parse date from Excel to check if it matches selected date
    // Excel format can be either MM/DD/YY or DD/MM/YY - detect automatically
    let isNextDayEarlyPunch = false;
    if (dateStr && dateStr.includes('/')) {
      const dateParts = dateStr.split('/');
      let month, day, year;
      year = parseInt(dateParts[2]);

      if (year < 100) {
        year += 2000;
      }

      // Detect format: if first part > 12, it's DD/MM/YY; otherwise MM/DD/YY
      const firstPart = parseInt(dateParts[0]);
      const secondPart = parseInt(dateParts[1]);

      if (firstPart > 12) {
        // DD/MM/YY format
        day = firstPart;
        month = secondPart - 1; // JavaScript months are 0-indexed
      } else {
        // MM/DD/YY format
        month = firstPart - 1; // JavaScript months are 0-indexed
        day = secondPart;
      }

      // Use UTC methods to avoid timezone offset issues
      const excelDate = new Date(Date.UTC(year, month, day));
      const excelDateKey = excelDate.toISOString().split('T')[0];
      availableDates.add(excelDateKey);

      // Check if it matches selected date (Friday)
      if (excelDateKey === targetDateKey) {
        // Same day (Friday), check if time is >= 13:00
        const hour = parseInt(timeStr.split(':')[0]) || 0;
        if (hour < 13) {
          return; // Skip if before 13:00 on Friday (belongs to Saturday)
        }
        recordsFound = true;
      } else {
        // Not the selected date, skip
        return;
      }
    } else {
      return; // Skip if no valid date format
    }

    // Parse time
    const [timeHour, timeMinute] = timeStr.split(':').map(Number);
    const hour = timeHour || 0;

    // Infer status from time:
    // - Check-in (0): before 6 PM on Friday
    // - Check-out (1): after 6 PM on Friday
    const status = hour < 18 ? 0 : 1;

    if (!empId || !timeStr) return;

    // Combine date with time from Excel
    const punchDate = new Date(targetDate);
    punchDate.setHours(parseInt(timeHour), parseInt(timeMinute), 0, 0);

    // Get the date key (YYYY-MM-DD) for grouping
    const dateKey = targetDate.toISOString().split('T')[0];
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          empId,
          name: name,
          department: row['Department'],
          dailyRecords: new Map<string, any>(),
          firstPunch: null,
          lastPunch: null,
          totalPunches: 0,
          isLate: false
        });
      }

      const empData = employeeMap.get(empId);

      // Initialize daily record if not exists
      if (!empData.dailyRecords.has(dateKey)) {
        empData.dailyRecords.set(dateKey, {
          firstCheckIn: null,
          lastCheckOut: null,
          punches: []
        });
      }

      const dailyRecord = empData.dailyRecords.get(dateKey);
      dailyRecord.punches.push({ time: punchDate, status, isNextDayEarlyPunch });

      // Update first check-in (status 0)
      if (status === 0 && (!dailyRecord.firstCheckIn || punchDate < dailyRecord.firstCheckIn)) {
        dailyRecord.firstCheckIn = punchDate;
      }

      // Update last check-out (status 1)
      if (status === 1 && (!dailyRecord.lastCheckOut || punchDate > dailyRecord.lastCheckOut)) {
        dailyRecord.lastCheckOut = punchDate;
      }

      // Update total punches
      empData.totalPunches++;
    });

  if (!recordsFound) {
    const datesList = Array.from(availableDates).sort().join(', ');
    throw new Error(`No attendance data found for ${selectedDate} in the Excel file. Available dates in file: ${datesList || 'none'}`);
  }

  // For each employee, find first/last punch with Friday-specific filters
  employeeMap.forEach((empData) => {
    const sortedDates = Array.from(empData.dailyRecords.keys()).sort();
    empData.dailyAttendance = [];

    sortedDates.forEach((dateKey) => {
      const dailyRecord = empData.dailyRecords.get(dateKey);

      // Find first check-in of the day (no time filter for display - show earliest punch)
      const allCheckIns = dailyRecord.punches.filter((p: any) => p.status === 0);
      allCheckIns.sort((a: any, b: any) => a.time.getTime() - b.time.getTime());
      const firstCheckIn = allCheckIns.length > 0 ? allCheckIns[0].time : null;

      // Find last check-out after 6 PM on Friday (18:00)
      const eveningCheckOuts = dailyRecord.punches.filter((p: any) => 
        p.status === 1 && 
        p.time.getHours() >= 18
      );
      eveningCheckOuts.sort((a: any, b: any) => b.time.getTime() - a.time.getTime());
      let lastCheckOut = eveningCheckOuts.length > 0 ? eveningCheckOuts[0].time : null;

      empData.dailyAttendance.push({
        date: dateKey,
        firstCheckIn,
        lastCheckOut,
        punches: dailyRecord.punches
      });
    });

    // After processing, set overall first/last punch
    // First punch: earliest check-in across all days (no time filter)
    let earliestCheckIn: Date | null = null;
    empData.dailyRecords.forEach((dailyRecord: any) => {
      dailyRecord.punches.forEach((punch: any) => {
        if (punch.status === 0 && (!earliestCheckIn || punch.time < earliestCheckIn)) {
          earliestCheckIn = punch.time;
        }
      });
    });
    empData.firstPunch = earliestCheckIn;

    // Last punch: find the latest check-out (no time filter for display)
    let latestCheckOut: Date | null = null;
    empData.dailyRecords.forEach((dailyRecord: any) => {
      dailyRecord.punches.forEach((punch: any) => {
        if (punch.status === 1 && (!latestCheckOut || punch.time > latestCheckOut)) {
          latestCheckOut = punch.time;
        }
      });
    });
    empData.lastPunch = latestCheckOut;
  });

  // Check if first punch is late based on Friday threshold (14:00 default)
  employeeMap.forEach((empData) => {
    let employee = employees.find(emp =>
      (emp.employeeId?.trim() || emp.employeeId) === (empData.empId?.trim() || empData.empId)
    );

    if (!employee && empData.empId) {
      employee = employees.find(emp =>
        emp.employeeId?.includes(empData.empId)
      );
    }

    if (employee) {
      punchedEmployeeIds.add(employee.id);
      empData.employeeId = employee.employeeId || empData.empId; // Use actual employeeId, not Firebase document ID
      empData.firebaseEmployeeId = employee.id; // Store Firebase ID separately
      
      const location = workLocations.find(loc => loc.assignedStaff?.includes(employee.id));
      if (location) {
        empData.workLocation = location.name;
        empData.workLocationId = location.id;

        // Friday late threshold (default 14:00)
        const threshold = location.lateThresholdFriday || '14:00';
        const [thresholdHour, thresholdMinute] = threshold.split(':').map(Number);
        
        if (empData.firstPunch) {
          const hours = empData.firstPunch.getHours();
          const minutes = empData.firstPunch.getMinutes();
          
          // Check if time is after the Friday late threshold
          if (hours > thresholdHour || (hours === thresholdHour && minutes > thresholdMinute)) {
            empData.isLate = true;
          }
        }
      } else {
        empData.workLocation = 'Not Found';
        empData.workLocationId = null;
      }
    } else {
      empData.workLocation = 'Not Found';
      empData.workLocationId = null;
      empData.employeeId = null;
    }
  });
    
  // Find missing staff (employees assigned to work locations who didn't punch)
  // On Friday, missing staff might be OFF - mark them appropriately
  const missingStaff = employees
    .filter(emp => {
      if (emp.status !== 'active') return false;
      const hasLocation = workLocations.some(loc => loc.assignedStaff?.includes(emp.id));
      if (!hasLocation) return false;
      return !punchedEmployeeIds.has(emp.id);
    })
    .map(emp => {
      const location = workLocations.find(loc => loc.assignedStaff?.includes(emp.id));
      return {
        empId: emp.employeeId,
        name: emp.fullName,
        department: emp.department || 'N/A',
        workLocation: location?.name || 'Unassigned',
        workLocationId: location?.id,
        employeeId: emp.id,
        isMissing: true,
        firstPunch: null,
        lastPunch: null,
        totalPunches: 0,
        isOff: true // Mark as potentially OFF on Friday
      };
    });
    
  const attendanceRecords = Array.from(employeeMap.values());
  return { attendanceRecords, missingStaff };
};

  const handleEditRow = (empId: string, firstPunch: Date | null, lastPunch: Date | null) => {
    setEditingRow(empId);
    setEditedFirstPunch(firstPunch ? new Date(firstPunch).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
    setEditedLastPunch(lastPunch ? new Date(lastPunch).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedFirstPunch('');
    setEditedLastPunch('');
  };

  const handleSaveRow = async (emp: any) => {
    if (!emp.employeeId) {
      alert('Employee ID not found');
      return;
    }

    try {
      setSaving(true);

      // Parse the edited dates
      const firstPunchDate = editedFirstPunch ? new Date(editedFirstPunch) : emp.firstPunch;
      let lastPunchDate = editedLastPunch ? new Date(editedLastPunch) : emp.lastPunch;

      // Adjust check-out date if it's before check-in (crossed midnight)
      if (lastPunchDate && firstPunchDate && lastPunchDate.getTime() < firstPunchDate.getTime()) {
        lastPunchDate = new Date(lastPunchDate.getTime() + (24 * 60 * 60 * 1000));
        console.log(`Adjusted check-out time (crossed midnight): ${lastPunchDate.toISOString()}`);
      }

      // Check if attendance record exists for this employee on this date
      const attendanceDate = emp.firstPunch ? new Date(emp.firstPunch) : new Date();
      const startOfDay = new Date(attendanceDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(attendanceDate);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', emp.employeeId),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create new attendance record
        await addDoc(collection(db, 'attendance'), {
          employeeId: emp.employeeId,
          date: Timestamp.fromDate(attendanceDate),
          checkInTime: firstPunchDate ? Timestamp.fromDate(firstPunchDate) : null,
          checkOutTime: lastPunchDate ? Timestamp.fromDate(lastPunchDate) : null,
          checkInMethod: 'web',
          status: 'present',
          lateArrival: emp.isLate || false,
        });
      } else {
        // Update existing attendance record
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, 'attendance', docId), {
          checkInTime: firstPunchDate ? Timestamp.fromDate(firstPunchDate) : null,
          checkOutTime: lastPunchDate ? Timestamp.fromDate(lastPunchDate) : null,
          lateArrival: emp.isLate || false,
        });
      }

      // Update local state
      setAttendanceData(prevData =>
        prevData.map(item =>
          item.empId === emp.empId
            ? { ...item, firstPunch: firstPunchDate, lastPunch: lastPunchDate }
            : item
        )
      );

      setEditingRow(null);
      setEditedFirstPunch('');
      setEditedLastPunch('');
      alert('Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllToFirebase = async () => {
    console.log(`[Save to Firebase] Starting save for ${attendanceData.length} records`);
    console.log(`[Save to Firebase] Upload type: ${uploadType}`);
    console.log(`[Save to Firebase] Upload date: ${uploadDate}`);

    if (!confirm(`Are you sure you want to save ${attendanceData.length} attendance records to Firebase?`)) {
      return;
    }

    setSavingAll(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const emp of attendanceData) {
        if (!emp.employeeId) {
          console.error('Skipping employee - no employeeId:', emp.empId);
          errorCount++;
          continue;
        }

        try {
          // Use the selected upload date as the attendance date, not the first punch time
          // Use UTC to ensure consistent storage
          const attendanceDate = uploadDate ? new Date(uploadDate + 'T00:00:00Z') : (emp.firstPunch ? new Date(emp.firstPunch) : new Date());
          console.log(`Saving ${emp.name} (${emp.employeeId}):`, {
            firstPunch: emp.firstPunch,
            lastPunch: emp.lastPunch,
            uploadDate: uploadDate,
            attendanceDate: attendanceDate.toISOString()
          });

          // Use UTC methods to create date boundaries
          const startOfDay = new Date(Date.UTC(
            attendanceDate.getUTCFullYear(),
            attendanceDate.getUTCMonth(),
            attendanceDate.getUTCDate(),
            0, 0, 0, 0
          ));
          const endOfDay = new Date(Date.UTC(
            attendanceDate.getUTCFullYear(),
            attendanceDate.getUTCMonth(),
            attendanceDate.getUTCDate(),
            23, 59, 59, 999
          ));

          console.log(`Query range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

          const q = query(
            collection(db, 'attendance'),
            where('employeeId', '==', emp.employeeId),
            where('date', '>=', Timestamp.fromDate(startOfDay)),
            where('date', '<=', Timestamp.fromDate(endOfDay))
          );

          const querySnapshot = await getDocs(q);
          console.log(`Found ${querySnapshot.size} existing records for ${emp.employeeId}`);

          // Adjust check-out date if it's before check-in (crossed midnight)
          let checkOutTime = emp.lastPunch ? new Date(emp.lastPunch) : null;
          if (checkOutTime && emp.firstPunch) {
            const checkInTime = new Date(emp.firstPunch);
            // If check-out is before check-in, it crossed midnight - add 1 day
            if (checkOutTime.getTime() < checkInTime.getTime()) {
              checkOutTime = new Date(checkOutTime.getTime() + (24 * 60 * 60 * 1000));
              console.log(`Adjusted check-out time (crossed midnight): ${checkOutTime.toISOString()}`);
            }
          }

          if (querySnapshot.empty) {
            console.log(`Adding new record for ${emp.employeeId}`);
            await addDoc(collection(db, 'attendance'), {
              employeeId: emp.employeeId,
              employeeName: emp.name,
              date: Timestamp.fromDate(attendanceDate),
              checkInTime: emp.firstPunch ? Timestamp.fromDate(new Date(emp.firstPunch)) : null,
              checkOutTime: checkOutTime ? Timestamp.fromDate(checkOutTime) : null,
              checkInMethod: 'biometric',
              status: 'present',
              lateArrival: emp.isLate || false,
            });
          } else {
            const docId = querySnapshot.docs[0].id;
            console.log(`Updating existing record ${docId} for ${emp.employeeId}`);
            await updateDoc(doc(db, 'attendance', docId), {
              employeeName: emp.name,
              checkInTime: emp.firstPunch ? Timestamp.fromDate(new Date(emp.firstPunch)) : null,
              checkOutTime: checkOutTime ? Timestamp.fromDate(checkOutTime) : null,
              lateArrival: emp.isLate || false,
            });
          }

          successCount++;
        } catch (error) {
          console.error('Error saving attendance for employee:', emp.empId, error);
          errorCount++;
        }
      }

      setSaveSuccess(`Saved ${successCount} records successfully${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      alert('Error saving to Firebase');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Attendance</h1>
          <p className="text-secondary-600 mt-1">Track employee attendance</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as 'regular' | 'friday')}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="regular">Regular Day</option>
            <option value="friday">Friday</option>
          </select>
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
            id="attendance-upload"
          />
          <Button variant="secondary" onClick={() => document.getElementById('attendance-upload')?.click()}>
            <Upload className="w-5 h-5 mr-2" />
            Upload Attendance
          </Button>
          {attendanceData.length > 0 && (
            <Button variant="primary" onClick={handleSaveAllToFirebase} loading={savingAll}>
              <Download className="w-5 h-5 mr-2" />
              Save to Firebase
            </Button>
          )}
          <Button variant="secondary" onClick={() => Promise.all([loadTodayStats(), loadTodayAttendance()])}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary">
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Time Card */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-100 text-sm">Current Time</p>
              <p className="text-4xl font-bold mt-1">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </p>
              <p className="text-primary-100 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {can(PERMISSIONS.ATTENDANCE_EDIT) && (
                <>
                  {!isCheckedIn ? (
                    <Button
                      onClick={handleCheckIn}
                      loading={loading}
                      className="bg-white text-primary-600 hover:bg-primary-50"
                      size="lg"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Check In
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCheckOut}
                      loading={loading}
                      className="bg-white text-primary-600 hover:bg-primary-50"
                      size="lg"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Check Out
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          {attendanceToday && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-secondary-600">Checked In At</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {attendanceToday.checkInTime ? new Date(attendanceToday.checkInTime).toLocaleTimeString() : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-secondary-600">Checked Out At</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {attendanceToday.checkOutTime ? new Date(attendanceToday.checkOutTime).toLocaleTimeString() : 'Pending'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-secondary-600">Status</p>
                  <p className="text-xl font-bold text-secondary-900 capitalize">{attendanceToday.status}</p>
                </CardContent>
              </Card>
            </div>
          )}
          {can(PERMISSIONS.ATTENDANCE_ADJUST) && (
            <Card className="mt-4">
              <CardHeader>
                <h2 className="text-lg font-semibold text-secondary-900">Attendance Adjustment Request</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Requested Check-in</label>
                    <input
                      type="time"
                      value={adjustmentCheckIn}
                      onChange={(e) => setAdjustmentCheckIn(e.target.value)}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Requested Check-out</label>
                    <input
                      type="time"
                      value={adjustmentCheckOut}
                      onChange={(e) => setAdjustmentCheckOut(e.target.value)}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="Enter adjustment reason"
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                {adjustmentSuccess && (
                  <div className="mt-4 text-sm text-green-600">{adjustmentSuccess}</div>
                )}
                <div className="mt-4">
                  <Button onClick={submitAdjustmentRequest} loading={adjustmentSubmitting}>
                    Submit Attendance Adjustment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Total</p>
                <p className="text-2xl font-bold text-secondary-900">{todayStats.total}</p>
              </div>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.present}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{todayStats.absent}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.late}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">On Leave</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.onLeave}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Attendance Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Attendance</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Upload Excel
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Firebase History
              </button>
              <button
                onClick={() => setShowDailyReport(!showDailyReport)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Daily Attendance
              </button>
            </div>
          </div>
          {saveSuccess && (
            <div className="mt-3 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              {saveSuccess}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {showDailyReport ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <label className="block text-xs text-secondary-600 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={dailyReportDate}
                    onChange={(e) => setDailyReportDate(e.target.value)}
                    className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button
                  onClick={handleGenerateDailyReport}
                  loading={loadingDailyReport}
                  className="mt-5"
                >
                  Generate Report
                </Button>
                {dailyReportData.length > 0 && (
                  <Button
                    onClick={handlePrintDailyReport}
                    variant="secondary"
                    className="mt-5 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                )}
                <Button
                  onClick={() => setShowDailyReport(false)}
                  variant="secondary"
                  className="mt-5"
                >
                  Close
                </Button>
              </div>

              {dailyReportData.length > 0 && (
                <div className="bg-white p-8 rounded-lg border border-secondary-200" id="daily-report-print">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-secondary-900">Daily Attendance Report</h1>
                    <p className="text-lg text-secondary-600 mt-2">
                      Date: {dailyReportDate ? new Date(dailyReportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </p>
                  </div>

                  {/* Supervisor Comment Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Supervisor Comment
                    </label>
                    <textarea
                      value={supervisorComment}
                      onChange={(e) => setSupervisorComment(e.target.value)}
                      placeholder="Enter your comments for this daily report..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2 no-print">
                      <Button
                        onClick={handleSaveComment}
                        loading={savingComment}
                        className="text-sm"
                      >
                        Save Comment
                      </Button>
                      {savedComment && (
                        <span className="text-xs text-green-600 flex items-center mt-2">
                          ✓ Comment saved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Display saved comment in print view */}
                  {savedComment && (
                    <div className="mb-6 p-4 bg-white border-2 border-gray-300 rounded-lg print-only">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Supervisor Comment:</h3>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{savedComment}</p>
                    </div>
                  )}

                  {dailyReportData.map((locationGroup) => (
                    <div key={locationGroup.location} className="mb-8">
                      <h2 className="text-xl font-semibold text-secondary-900 mb-4 border-b-2 border-secondary-300 pb-2">
                        Location: {locationGroup.location}
                      </h2>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-secondary-100">
                            <th className="border border-secondary-300 px-4 py-2 text-left text-sm font-semibold text-secondary-700">Employee ID</th>
                            <th className="border border-secondary-300 px-4 py-2 text-left text-sm font-semibold text-secondary-700">Name</th>
                            <th className="border border-secondary-300 px-4 py-2 text-left text-sm font-semibold text-secondary-700">Position</th>
                            <th className="border border-secondary-300 px-4 py-2 text-left text-sm font-semibold text-secondary-700">First Punch Time</th>
                            <th className="border border-secondary-300 px-4 py-2 text-left text-sm font-semibold text-secondary-700">Status</th>
                            <th className="border border-secondary-300 px-4 py-2 text-left text-sm font-semibold text-secondary-700">Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {locationGroup.employees.map((employee: any) => (
                            <tr key={employee.id} className="hover:bg-secondary-50">
                              <td className="border border-secondary-300 px-4 py-2 text-sm">{employee.employeeId}</td>
                              <td className="border border-secondary-300 px-4 py-2 text-sm">{employee.employeeName}</td>
                              <td className="border border-secondary-300 px-4 py-2 text-sm">{employee.position || 'N/A'}</td>
                              <td className="border border-secondary-300 px-4 py-2 text-sm">
                                {employee.checkInTime ? new Date(employee.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                              </td>
                              <td className="border border-secondary-300 px-4 py-2 text-sm">
                                {editingStatus === employee.id ? (
                                  <div className="flex flex-col gap-2">
                                    <select
                                      value={employee.lateArrival ? 'late' : 'ontime'}
                                      onChange={(e) => handleSaveStatus(employee.id, e.target.value === 'late')}
                                      className="px-2 py-1 border border-secondary-300 rounded text-sm"
                                      disabled={savingStatus}
                                    >
                                      <option value="ontime">On Time</option>
                                      <option value="late">Late</option>
                                    </select>
                                    <textarea
                                      value={staffCommentText}
                                      onChange={(e) => setStaffCommentText(e.target.value)}
                                      placeholder="Add comment..."
                                      className="w-full px-2 py-1 border border-secondary-300 rounded text-sm resize-y"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveStaffComment(employee.id)}
                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                        disabled={savingStaffComment}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => { handleCancelEditStatus(); handleCancelStaffComment(); }}
                                        className="text-xs text-secondary-600 hover:text-secondary-900"
                                        disabled={savingStatus || savingStaffComment}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {employee.lateArrival ? (
                                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Late</span>
                                    ) : (
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">On Time</span>
                                    )}
                                    <button
                                      onClick={() => handleEditStatus(employee.id)}
                                      className="text-xs text-blue-600 hover:text-blue-800 no-print"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="border border-secondary-300 px-4 py-2 text-sm">
                                {staffComments[employee.id] ? (
                                  <span className="text-xs text-gray-700">{staffComments[employee.id]}</span>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No comment</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'upload' ? (
            <>
              {loadingAttendance ? (
                <div className="text-center py-12 text-secondary-600">
                  Loading attendance data...
                </div>
              ) : attendanceData.length > 0 ? (
                <div className="space-y-6">
                  {/* Missing Staff Section */}
                  {missingStaff.length > 0 && (
                    <div className="border-2 border-red-200 rounded-lg overflow-hidden bg-red-50">
                      <div className="bg-red-100 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-red-600" />
                          <h3 className="font-semibold text-red-900">Missing Staff</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-700 font-medium">{missingStaff.length} employees</span>
                          <Button
                            onClick={handleFixEmployeeIds}
                            loading={fixingEmployeeIds}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            Fix Employee IDs
                          </Button>
                        </div>
                      </div>

                      {/* Mobile Cards - Missing Staff */}
                      <div className="sm:hidden space-y-3 p-4">
                        {missingStaff.map((emp: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg shadow p-4 border border-red-200">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold text-red-900 text-sm">{emp.name}</div>
                                <div className="text-xs text-red-700">{emp.empId}</div>
                              </div>
                              <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-semibold">No Punch</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-red-600">Department:</span>
                                <span className="font-medium">{emp.department}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-600">Location:</span>
                                <span className="font-medium">{emp.workLocation}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table - Missing Staff */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-red-200 bg-red-50">
                              <th className="text-left py-3 px-4 text-sm font-medium text-red-700">Employee ID</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-red-700">Name</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-red-700">Department</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-red-700">Work Location</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-red-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {missingStaff.map((emp: any, index: number) => (
                              <tr key={index} className="border-b border-red-100 hover:bg-red-100">
                                <td className="py-3 px-4 text-sm text-red-900">{emp.empId}</td>
                                <td className="py-3 px-4 text-sm text-red-900">{emp.name}</td>
                                <td className="py-3 px-4 text-sm text-red-900">{emp.department}</td>
                                <td className="py-3 px-4 text-sm text-red-900">{emp.workLocation}</td>
                                <td className="py-3 px-4 text-sm">
                                  <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-semibold">No Punch</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Group by Work Location */}
                  {(() => {
                    const groupedByLocation = attendanceData.reduce((acc, emp) => {
                      const location = emp.workLocation || 'Unassigned';
                      if (!acc[location]) {
                        acc[location] = [];
                      }
                      acc[location].push(emp);
                      return acc;
                    }, {} as Record<string, any[]>);

                    return Object.entries(groupedByLocation).map(([location, emps]) => (
                      <div key={location} className="border border-secondary-200 rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            <h3 className="font-semibold text-primary-900">{location}</h3>
                          </div>
                          <span className="text-sm text-primary-700 font-medium">{(emps as any[]).length} employees</span>
                        </div>

                        {/* Mobile Cards - Work Location */}
                        <div className="sm:hidden space-y-3 p-4">
                          {(emps as any[]).map((emp: any, index: number) => (
                            <div key={index} className={`bg-white rounded-lg shadow p-4 border ${emp.isLate ? 'border-red-300 bg-red-50' : 'border-secondary-200'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-bold text-secondary-900 text-sm">{emp.name}</div>
                                  <div className="text-xs text-secondary-500">{emp.empId}</div>
                                </div>
                                {emp.isLate && (
                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Late</span>
                                )}
                              </div>
                              <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                  <span className="text-secondary-600">Department:</span>
                                  <span className="font-medium">{emp.department}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-secondary-600">First Punch:</span>
                                  <span className={`font-medium ${emp.isLate ? 'text-red-600' : ''}`}>
                                {editingRow === emp.empId ? (
                                  <input
                                    type="text"
                                    value={editedFirstPunch}
                                    onChange={(e) => setEditedFirstPunch(e.target.value)}
                                    className="w-full px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                                    placeholder="DD/MM/YYYY HH:mm"
                                  />
                                ) : (
                                  emp.firstPunch ? new Date(emp.firstPunch).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Last Punch:</span>
                              <span className={`font-medium ${!emp.lastPunch ? 'text-red-600' : ''}`}>
                                {editingRow === emp.empId ? (
                                  <input
                                    type="text"
                                    value={editedLastPunch}
                                    onChange={(e) => setEditedLastPunch(e.target.value)}
                                    className="w-full px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                                    placeholder="DD/MM/YYYY HH:mm"
                                  />
                                ) : (
                                  emp.lastPunch ? new Date(emp.lastPunch).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : 'Missing'
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Total Punches:</span>
                              <span className="font-medium">{emp.totalPunches || 0}</span>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            {can(PERMISSIONS.ATTENDANCE_EDIT) && (
                              <>
                                {editingRow === emp.empId ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveRow(emp.empId)}
                                      disabled={saving}
                                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
                                    >
                                      <Save className="w-4 h-4" />
                                      Save
                                    </button>
                                    <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-2 bg-secondary-600 text-white rounded-lg text-sm flex items-center gap-1"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditRow(emp.empId, emp.firstPunch, emp.lastPunch)}
                                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table - Work Location */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-secondary-200 bg-secondary-50">
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Employee ID</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Name</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Department</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">First Punch</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Last Punch</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Total Punches</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(emps as any[]).map((emp: any, index: number) => (
                            <tr 
                              key={index} 
                              className={`border-b border-secondary-100 hover:bg-secondary-50 ${emp.isLate ? 'bg-red-50' : ''}`}
                            >
                              <td className="py-3 px-4 text-sm text-secondary-900">{emp.empId}</td>
                              <td className="py-3 px-4 text-sm text-secondary-900">{emp.name}</td>
                              <td className="py-3 px-4 text-sm text-secondary-900">{emp.department}</td>
                              <td className={`py-3 px-4 text-sm ${emp.isLate ? 'text-red-600 font-semibold' : 'text-secondary-900'}`}>
                                {editingRow === emp.empId ? (
                                  <input
                                    type="text"
                                    value={editedFirstPunch}
                                    onChange={(e) => setEditedFirstPunch(e.target.value)}
                                    className="w-full px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="DD/MM/YYYY HH:mm"
                                  />
                                ) : (
                                  <>
                                    {emp.firstPunch ? new Date(emp.firstPunch).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                                    {emp.isLate && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Late</span>}
                                  </>
                                )}
                              </td>
                              <td className={`py-3 px-4 text-sm ${!emp.lastPunch ? 'text-red-600 font-semibold' : 'text-secondary-900'}`}>
                                {editingRow === emp.empId ? (
                                  <input
                                    type="text"
                                    value={editedLastPunch}
                                    onChange={(e) => setEditedLastPunch(e.target.value)}
                                    className="w-full px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="DD/MM/YYYY HH:mm"
                                  />
                                ) : (
                                  emp.lastPunch ? new Date(emp.lastPunch).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : 'Missing'
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-secondary-900">{emp.totalPunches}</td>
                              <td className="py-3 px-4 text-sm">
                                {editingRow === emp.empId ? (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleSaveRow(emp)}
                                      loading={saving}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleEditRow(emp.empId, emp.firstPunch, emp.lastPunch)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ));
              })()}
                </div>
              ) : (
                <div className="text-center py-12 text-secondary-600">
                  No activity data available. Upload an Excel file to view attendance data.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">Search Name</label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={filterSearchName}
                      onChange={(e) => setFilterSearchName(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">Employee ID</label>
                    <select
                      value={filterEmployeeId}
                      onChange={(e) => setFilterEmployeeId(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Employees</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.employeeId}>{emp.employeeId}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFilterEmployeeId('');
                        setFilterSearchName('');
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleDeleteAllFirebase}
                  loading={deleteAllLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete All Records
                </Button>
              </div>
              {loadingHistory ? (
                <div className="text-center py-12 text-secondary-600">
                  Loading Firebase attendance history...
                </div>
              ) : firebaseAttendance.length === 0 ? (
                <div className="text-center py-12 text-secondary-600">
                  No attendance records found in Firebase.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200 bg-secondary-50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Employee ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Check In</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Check Out</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Late</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firebaseAttendance
                        .filter(record => {
                          // Filter by search name
                          if (filterSearchName) {
                            const searchLower = filterSearchName.toLowerCase();
                            const name = (record.employeeName || '').toLowerCase();
                            if (!name.includes(searchLower)) {
                              return false;
                            }
                          }
                          // Filter by employee ID
                          if (filterEmployeeId && record.employeeId !== filterEmployeeId) {
                            return false;
                          }
                          // Filter by date range
                          if (filterStartDate) {
                            const recordDate = new Date(record.date).toISOString().split('T')[0];
                            if (recordDate < filterStartDate) {
                              return false;
                            }
                          }
                          if (filterEndDate) {
                            const recordDate = new Date(record.date).toISOString().split('T')[0];
                            if (recordDate > filterEndDate) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .map((record) => (
                        <tr key={record.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                          <td className="py-3 px-4 text-sm text-secondary-900">{record.employeeId || record.id}</td>
                          <td className="py-3 px-4 text-sm text-secondary-900">{record.employeeName || 'N/A'}</td>
                          <td className="py-3 px-4 text-sm text-secondary-900">
                            {record.date ? record.date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-900">
                            {editingFirebaseRecord === record.id ? (
                              <input
                                type="text"
                                value={editedCheckIn}
                                onChange={(e) => setEditedCheckIn(e.target.value)}
                                placeholder="HH:MM"
                                pattern="[0-9]{2}:[0-9]{2}"
                                className="px-2 py-1 border border-secondary-300 rounded text-sm w-20"
                              />
                            ) : (
                              record.checkInTime ? record.checkInTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-900">
                            {editingFirebaseRecord === record.id ? (
                              <input
                                type="text"
                                value={editedCheckOut}
                                onChange={(e) => setEditedCheckOut(e.target.value)}
                                placeholder="HH:MM"
                                pattern="[0-9]{2}:[0-9]{2}"
                                className="px-2 py-1 border border-secondary-300 rounded text-sm w-20"
                              />
                            ) : (
                              record.checkOutTime ? record.checkOutTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Pending'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {editingFirebaseRecord === record.id ? (
                              <select
                                value={editedStatus}
                                onChange={(e) => setEditedStatus(e.target.value)}
                                className="px-2 py-1 border border-secondary-300 rounded text-sm"
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="on_leave">On Leave</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                record.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {record.status || 'N/A'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {editingFirebaseRecord === record.id ? (
                              <input
                                type="checkbox"
                                checked={editedLate}
                                onChange={(e) => setEditedLate(e.target.checked)}
                                className="rounded border-secondary-300"
                              />
                            ) : (
                              record.lateArrival ? (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Yes</span>
                              ) : (
                                <span className="text-secondary-600">No</span>
                              )
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {editingFirebaseRecord === record.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveFirebaseRecord(record.id)}
                                  disabled={savingFirebaseRecord}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                >
                                  {savingFirebaseRecord ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEditFirebase}
                                  className="px-2 py-1 bg-secondary-600 text-white rounded text-xs hover:bg-secondary-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditFirebaseRecord(record)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #daily-report-print,
          #daily-report-print * {
            visibility: visible;
          }
          #daily-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  );
};
