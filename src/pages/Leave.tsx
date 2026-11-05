import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, X, Eye, Check, X as XIcon, CheckSquare, Square, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { createLeaveRequest, cancelLeaveRequest, getLeaveRequests, validateLeaveRequest, calculateLeaveDays, approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest, bulkDeleteLeaveRequests } from '../lib/leave';
import { useAuth } from '../contexts/AuthContext';
import { getEmployees } from '../lib/employees';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../lib/permissions';
import type { LeaveRequest, LeaveType } from '../types';
import * as XLSX from 'xlsx';

export const Leave = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  
  // Debug: Log user role and permissions
  console.log('Leave - User:', user);
  console.log('Leave - User role:', user?.role);
  console.log('Leave - Can request leave:', can(PERMISSIONS.LEAVE_REQUEST));
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<LeaveType | 'all'>('all');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<LeaveType>('annual');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newDays, setNewDays] = useState(1);
  const [leaveErrors, setLeaveErrors] = useState<string[]>([]);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [approvalModal, setApprovalModal] = useState<{ show: boolean; request: LeaveRequest | null; action: 'approve' | 'reject' }>({ show: false, request: null, action: 'approve' });
  const [approvalComments, setApprovalComments] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<{ show: boolean; action: 'approve' | 'reject' }>({ show: false, action: 'approve' });
  const [bulkComments, setBulkComments] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [viewModal, setViewModal] = useState<{ show: boolean; request: LeaveRequest | null }>({ show: false, request: null });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedLeaves, setParsedLeaves] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; request: LeaveRequest | null }>({ show: false, request: null });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ show: false });
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const requests = await getLeaveRequests();
      setLeaveRequests(requests);

      // Load employees for dropdown
      const empData = await getEmployees();
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading leave data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter requests for the current employee (without status filter for summary)
  const employeeRequests = leaveRequests.filter(request => {
    if (user?.role === 'employee' && user?.employeeId) {
      const employeesData = employees.find(e => e.employeeId === user.employeeId);
      const employeeDocId = employeesData?.id;
      // Match by employee document ID first, fallback to matching by employeeId field
      return employeeDocId ? request.employeeId === employeeDocId : request.employeeId === user.employeeId;
    }
    return true; // For non-employees, return all requests
  });

  const filteredRequests = leaveRequests.filter(request => {
    // If user is an employee, only show their own leave requests
    if (user?.role === 'employee' && user?.employeeId) {
      const employeesData = employees.find(e => e.employeeId === user.employeeId);
      const employeeDocId = employeesData?.id;
      const statusMatch = request.status === activeTab;
      // Match by employee document ID first, fallback to matching by employeeId field
      const employeeMatch = employeeDocId ? request.employeeId === employeeDocId : request.employeeId === user.employeeId;
      const typeMatch = selectedTypeFilter === 'all' || request.type === selectedTypeFilter;
      return statusMatch && employeeMatch && typeMatch;
    }
    const statusMatch = request.status === activeTab;
    const typeMatch = selectedTypeFilter === 'all' || request.type === selectedTypeFilter;
    return statusMatch && typeMatch;
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const typeColors = {
    annual: 'bg-blue-100 text-blue-800',
    medical: 'bg-red-100 text-red-800',
    emergency: 'bg-orange-100 text-orange-800',
    duty: 'bg-purple-100 text-purple-800',
    unpaid: 'bg-gray-100 text-gray-800',
    maternity: 'bg-pink-100 text-pink-800',
    paternity: 'bg-indigo-100 text-indigo-800',
    compassionate: 'bg-teal-100 text-teal-800',
    off_day: 'bg-cyan-100 text-cyan-800',
  };

  const typeLabels = {
    annual: 'Annual Leave',
    medical: 'Medical Leave',
    emergency: 'Emergency Leave',
    duty: 'Duty Leave',
    unpaid: 'Unpaid Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    compassionate: 'Compassionate Leave',
    off_day: 'Off Day',
  };

  const typeIcons = {
    annual: '📅',
    medical: '🏥',
    emergency: '🚨',
    duty: '💼',
    unpaid: '💸',
    maternity: '👶',
    paternity: '👨‍👧',
    compassionate: '❤️',
    off_day: '🏖️',
  };

  const calculateDaysFromRange = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return calculateLeaveDays(startDate, endDate);
  };

  const mapLeaveType = (code: string): LeaveType => {
    switch (code) {
      case 'AL': return 'annual';
      case 'SICK':
      case 'MC':
      case 'S': return 'medical';
      case 'EL': return 'emergency';
      case 'SP':
      case 'SUS':
      case 'NL': return 'unpaid';
      case 'FL': return 'compassionate';
      case 'OFF': return 'off_day';
      case 'HD': return 'duty';
      case 'AB': return 'unpaid';
      default: return 'annual';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // Ensure employees are loaded
      if (employees.length === 0) {
        const empData = await getEmployees();
        setEmployees(empData);
        console.log('Loaded employees for upload:', empData.length);
      }
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      console.log('Workbook sheets:', workbook.SheetNames);
      
      // Parse all sheets
      const allParsedData: any[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        console.log(`Processing sheet: ${sheetName}, rows: ${jsonData.length}`);

      // Detect format type
      let formatType = 'standard';

      // Check if this is summary format (has leave type columns like AL, MC, etc.)
      // Summary format: data rows should have numeric values in leave type columns
      // Standard format: data rows have IN/OUT times in daily columns, leave type columns are just headers
      let summaryHeaderRowIndex = -1;

      // First find a row with leave type codes and employee ID
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row.some((cell: any) => {
          const cellStr = String(cell).toUpperCase().trim();
          return ['OFF', 'MC', 'EL', 'AL', 'SUS', 'FL', 'S', 'HD', 'AB', 'NL', 'SP'].includes(cellStr);
        }) && row.some((cell: any) => {
          const cellStr = String(cell).toUpperCase().trim();
          return cellStr === 'USER ID' || cellStr === 'S NO';
        })) {
          summaryHeaderRowIndex = i;
          console.log('Found potential summary header row at', i);
          break;
        }
      }

      // Now check if data rows have numeric values in leave type columns (summary format)
      // or IN/OUT times in daily columns (standard format)
      // Look at the first actual data row (header row + 2 to skip header row)
      if (summaryHeaderRowIndex >= 0 && summaryHeaderRowIndex + 2 < jsonData.length) {
        const dataRow = jsonData[summaryHeaderRowIndex + 2]; // First employee data row
        if (dataRow) {
          console.log('Checking data row at index', summaryHeaderRowIndex + 2, 'for format detection');
          console.log('Data row sample:', dataRow.slice(0, 10));
          // Check if there are numeric values in the leave type columns (indices 70-80 based on logs)
          // In summary format, these columns have numeric totals
          let hasNumericLeaveValues = false;
          for (let col = 70; col < Math.min(80, dataRow.length); col++) {
            const val = dataRow[col];
            if (val !== null && val !== undefined && val !== '' && typeof val === 'number') {
              hasNumericLeaveValues = true;
              break;
            }
          }
          // Check if there are time values in daily columns (IN/OUT format)
          // In standard format, columns 3-68 contain daily IN/OUT times or leave codes
          let hasTimeValues = false;
          for (let col = 3; col < Math.min(68, dataRow.length); col++) {
            const val = dataRow[col];
            // Check for any non-empty values (numeric times or leave codes like 'OFF')
            if (val !== null && val !== undefined && val !== '') {
              hasTimeValues = true;
              break;
            }
          }
          console.log('Has numeric leave values:', hasNumericLeaveValues, 'Has time values:', hasTimeValues);
          if (hasNumericLeaveValues && !hasTimeValues) {
            formatType = 'summary';
            console.log('Confirmed summary format (numeric leave values)');
          } else {
            console.log('Standard format detected (has time values or no numeric leave values)');
          }
        }
      }

      console.log('Detected format type:', formatType);
      console.log('Summary header row index:', summaryHeaderRowIndex);
      console.log('About to check format type for parsing path');

      // Only check for "User ID" header if summary format was NOT detected
      // Summary format rows also have "User ID" but have leave type columns too
      if (formatType !== 'summary') {
        console.log('Checking for User ID header (standard format)');
        for (let i = 0; i < jsonData.length; i++) {
          if (jsonData[i] && jsonData[i][0] === 'User ID') {
            formatType = 'standard';
            break;
          }
        }
      } else {
        console.log('Skipping User ID check (summary format detected)');
      }

      console.log('After User ID check, formatType:', formatType);

      console.log('About to enter standard format parsing block');
      console.log('Final formatType:', formatType);
      console.log('About to execute if (formatType === "standard")');

      if (formatType === 'standard') {
        console.log('Entering standard format parsing');
      } else {
        console.log('Entering summary format parsing');
      }

      console.log('Skipping S NO header check (summary format already detected)');

      console.log('After S NO check, formatType:', formatType);

      const parsed: any[] = [];

      if (formatType === 'standard') {
        // Parse standard format (IN/OUT columns per day)
        // First, extract date headers to map column positions to actual dates
        const dateHeaders: Record<number, string> = {};
        
        // Find header row (contains "User ID" or "S NO")
        let headerRowIndex = -1;
        let hasHeaderRow = false;
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.some((cell: any) => {
            const cellStr = String(cell).toUpperCase().trim();
            return cellStr === 'USER ID' || cellStr === 'S NO';
          })) {
            headerRowIndex = i;
            hasHeaderRow = true;
            break;
          }
        }

        // If no header row found, check if this is a format without headers (starts with serial number, ID, name)
        if (!hasHeaderRow && jsonData.length > 0) {
          const firstRow = jsonData[0] as any[];
          console.log('No header row found, checking first row:', firstRow);
          console.log('First row length:', firstRow?.length);
          console.log('First row[0] type:', typeof firstRow?.[0], 'value:', firstRow?.[0]);
          console.log('First row[1] type:', typeof firstRow?.[1], 'value:', firstRow?.[1]);
          console.log('First row[2] type:', typeof firstRow?.[2], 'value:', firstRow?.[2]);
          // Check if first column is a number (serial), second looks like ID, third looks like name
          if (firstRow && firstRow.length >= 3 &&
              typeof firstRow[0] === 'number' &&
              typeof firstRow[1] === 'string' &&
              typeof firstRow[2] === 'string') {
            // This is a no-header format, treat row 0 as the first data row
            headerRowIndex = -1; // No header row
            console.log('Detected no-header format');
          } else {
            alert('Could not find recognized header row. Expected "User ID" or "S NO"');
            setUploadingFile(false);
            return;
          }
        }

        // Find date header rows specifically (not employee data rows)
        // Date header rows have consecutive dates across many columns
        const dateRowIndices: number[] = [];
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i] as any[];
          let dateCount = 0;
          for (const cell of row) {
            if (typeof cell === 'number' && cell > 40000) {
              dateCount++;
            } else if (String(cell).match(/^\d{2}-[^\d]+-\d{2}$/)) {
              dateCount++;
            }
          }
          // Only consider it a date header row if it has at least 10 dates
          if (dateCount >= 10) {
            dateRowIndices.push(i);
          }
        }

        console.log('Excel Upload - Found date header rows at indices:', dateRowIndices);

        // Process each date row
        let dateIndex = 0;
        for (const dateRowIndex of dateRowIndices) {
          if (dateRowIndex >= 0 && dateRowIndex < jsonData.length) {
            const dateRow = jsonData[dateRowIndex] as any[];
            console.log(`Excel Upload - Processing date row ${dateIndex} at index ${dateRowIndex}:`, dateRow.slice(0, 20));

            // Map dates from date row to corresponding data columns
            // Excel structure: S No, User ID, Name, then (Date IN, Date OUT) pairs
            // Dates are in the date row, data is in rows below
            // Each date has 2 columns: IN (odd) and OUT (even)
            // We need to map the date to the IN column where leave codes appear

            let sectionDateIndex = 0;

            for (let col = 0; col < dateRow.length; col++) {
              const cell = dateRow[col];
              const cellStr = String(cell);

              // Check for Excel serial date (number > 40000)
              if (typeof cell === 'number' && cell > 40000) {
                // Convert Excel serial date to JavaScript Date
                const excelDate = new Date(Math.round((cell - 25569) * 86400 * 1000));
                console.log(`Excel Upload - Raw Excel serial date: ${cell}, JS Date (UTC): ${excelDate.toISOString()}`);
                // Use local date instead of UTC to avoid timezone shifts
                const year = excelDate.getFullYear();
                const month = String(excelDate.getMonth() + 1).padStart(2, '0');
                const day = String(excelDate.getDate()).padStart(2, '0');
                const isoDate = `${year}-${month}-${day}`;

                // Only process October 2026 dates (2026-10)
                if (year === 2026 && month === '10') {
                  // Map to the IN column (the column where the date is found)
                  // Leave codes are in the IN column, not OUT column
                  const dataCol = col;
                  dateHeaders[dataCol] = isoDate;
                  console.log(`Excel Upload - Section ${dateIndex}: Column ${col} -> Data column ${dataCol}, Date: ${isoDate} (local)`);
                  sectionDateIndex++;
                } else {
                  console.log(`Excel Upload - Skipping date ${isoDate} (not October 2026)`);
                }
              }
              // Check for Dhivehi text date format
              else if (cellStr.match(/^\d{2}-[^\d]+-\d{2}$/)) {
                const parts = cellStr.split('-');
                if (parts.length === 3) {
                  const day = parseInt(parts[0], 10);
                  const year = parseInt('20' + parts[2], 10);
                  const dhivehiMonths: Record<string, number> = {
                    'ޖަނަވަރީ': 0, 'ފެބްރުއަރީ': 1, 'މާރޗް': 2,
                    'އޭޕްރިލް': 3, 'މެއި': 4, 'ޖޫން': 5,
                    'ޖުލައި': 6, 'އޮގަސްޓް': 7, 'ސެޕްޓެމްބަރު': 8,
                    'އޮކްޓޯބަރ': 9, 'އޮކްޓޫބަރު': 9, 'ނޮވެމްބަރު': 10, 'ޑިސެމްބަރު': 11
                  };
                  const month = dhivehiMonths[parts[1]] || 0;
                  const date = new Date(year, month, day);
                  const isoDate = date.toISOString().split('T')[0];

                  // Only process October 2026 dates (2026-10)
                  if (year === 2026 && month === 9) {
                    const dataCol = col;
                    dateHeaders[dataCol] = isoDate;
                    console.log(`Excel Upload - Section ${dateIndex}: Column ${col} (${cellStr}) -> Data column ${dataCol}, Date: ${isoDate}`);
                    sectionDateIndex++;
                  } else {
                    console.log(`Excel Upload - Skipping date ${isoDate} (not October 2026)`);
                  }
                }
              }
            }

            dateIndex++;
          }
        }

        console.log('Excel Upload - Final dateHeaders:', dateHeaders);
        
        // Determine starting row for data
        const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 3) continue;

          const empId = row[1]; // User ID is in column 1
          const empName = row[2]; // Name is in column 2
          if (!empId || empId === 'User ID') continue;

          // Normalize inputs for matching
          const empIdNorm = String(empId).trim().toUpperCase();
          const empNameNorm = String(empName).trim().toLowerCase();

          console.log('Excel Upload - Processing row:', i, 'Employee:', empIdNorm, empNameNorm);

          // Match with existing employee in system (strict matching only)
          const matchedEmp = employees.find(e => {
            const sysEmpId = String(e.employeeId).trim().toUpperCase();
            const sysName = String(e.fullName).trim().toLowerCase();
            const empIdMatch = sysEmpId === empIdNorm;
            const empNameMatch = sysName === empNameNorm;

            // Match by numeric part of ID (e.g., MAD0653 matches D0653)
            const empIdNumMatch = sysEmpId.replace(/^[A-Z]+/, '') === empIdNorm.replace(/^[A-Z]+/, '') &&
                                 sysEmpId.replace(/^[A-Z]+/, '').length >= 4;

            // Only use exact matches - no partial name matching to avoid false positives
            const match = empIdMatch || empNameMatch || (empIdNumMatch && empIdNorm.length >= 4);

            if (match) {
              console.log('Excel Upload - Matched with system employee:', sysEmpId, sysName, 'via:',
                empIdMatch ? 'ID' : empNameMatch ? 'Name' : 'ID Num');
            }

            return match;
          });

          if (!matchedEmp) {
            console.log('Excel Upload - No match found for:', empIdNorm, empNameNorm);
          }


          // Parse each column that has a date header
          let rowLeaveCount = 0;
          for (const [col, dateStr] of Object.entries(dateHeaders)) {
            const colIndex = parseInt(col, 10);
            if (colIndex >= row.length) continue;

            const value = row[colIndex];
            if (!value) continue;

            // Check for leave codes
            let leaveType = null;
            if (['AL', 'EL', 'SICK', 'SP', 'FL', 'OFF', 'MC', 'SUS', 'NL', 'HD', 'AB'].includes(value)) {
              leaveType = value;
            } else if (value === '1' || typeof value === 'number') {
              continue;
            }

            if (leaveType) {
              console.log(`Excel Upload - Found leave: ${empIdNorm} on ${dateStr}, Type: ${leaveType}, Column: ${colIndex}`);
              parsed.push({
                employeeId: empId,
                employeeName: empName,
                matchedEmployeeId: matchedEmp?.id || null,
                date: dateStr,
                leaveType: leaveType,
                mappedType: mapLeaveType(leaveType),
                selected: true,
                matched: !!matchedEmp,
                isSummary: false
              });
              rowLeaveCount++;
            }
          }

          if (rowLeaveCount > 0) {
            console.log(`Excel Upload - Total leaves found for ${empIdNorm}: ${rowLeaveCount}`);
          }
        }
      } else {
        // Parse summary format (leave type columns at the end)
        // Use the detected summary header row index
        console.log('Entering summary format parsing');
        console.log('Summary header row index:', summaryHeaderRowIndex);

        // Extract month and year from first row (e.g., "Attendance - JANUARY 2026 -Male Local Staffs")
        let summaryMonth = '01';
        let summaryYear = '2026';
        if (jsonData.length > 0 && jsonData[0]) {
          const firstRowStr = String((jsonData[0] as any[])[0] || '');
          console.log('First row for date extraction:', firstRowStr);
          const monthMatch = firstRowStr.match(/([A-Z]{3,9})\s+(\d{4})/);
          console.log('Month match result:', monthMatch);
          if (monthMatch) {
            const monthName = monthMatch[1];
            summaryYear = monthMatch[2];
            const months: Record<string, string> = {
              'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
              'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
              'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
            };
            summaryMonth = months[monthName] || '01';
            console.log('Extracted month:', summaryMonth, 'year:', summaryYear);
          } else {
            console.log('No month match found, trying alternative pattern');
            const altMatch = firstRowStr.match(/([A-Z]{3,9})/);
            if (altMatch) {
              const monthName = altMatch[1];
              const months: Record<string, string> = {
                'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
                'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
                'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
              };
              summaryMonth = months[monthName] || '01';
              console.log('Alternative match - month:', summaryMonth);
            }
            const yearMatch = firstRowStr.match(/(\d{4})/);
            if (yearMatch) {
              summaryYear = yearMatch[1];
              console.log('Alternative match - year:', summaryYear);
            }
          }
        }
        const summaryDate = `${summaryYear}-${summaryMonth}-01`;
        console.log('Final summary date:', summaryDate);

        let headerRow = null;
        let headerRowIndex = summaryHeaderRowIndex;

        if (headerRowIndex >= 0) {
          headerRow = jsonData[headerRowIndex] as any[];
          console.log('Using summary header row:', headerRowIndex);
        } else {
          // Fallback: try to find header row
          console.log('No summary header index found, searching for User ID header');
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.some((cell: any) => {
              const cellStr = String(cell).toUpperCase().trim();
              return cellStr === 'USER ID' || cellStr === 'S NO';
            })) {
              headerRow = row;
              headerRowIndex = i;
              console.log('Found header row at:', i);
              break;
            }
          }
        }

        console.log('Final header row index:', headerRowIndex);
        console.log('Header row:', headerRow);

        const leaveTypeCols: Record<string, number> = {};

        if (headerRow) {
          // Has header row - find leave type columns
          console.log('Scanning header row for leave type columns:', headerRow.length, 'columns');
          for (let col = 0; col < headerRow.length; col++) {
            const cell = String((headerRow as any[])[col]).toUpperCase().trim();
            if (['OFF', 'MC', 'EL', 'AL', 'SUS', 'FL', 'S', 'HD', 'AB', 'NL', 'SP'].includes(cell)) {
              leaveTypeCols[cell] = col;
              console.log(`Found leave type column: ${cell} at index ${col}`);
            }
          }
          console.log('Leave type columns found:', leaveTypeCols);
        } else {
          // No header row - scan data rows to find columns with leave codes
          // Look at first few data rows to identify leave type columns
          const sampleRows = jsonData.slice(0, Math.min(10, jsonData.length)) as any[][];
          for (let col = 3; col < sampleRows[0]?.length; col++) {
            const hasLeaveCode = sampleRows.some((row: any[]) => {
              const cell = row[col];
              const cellStr = String(cell).toUpperCase().trim();
              return ['OFF', 'MC', 'EL', 'AL', 'SUS', 'FL', 'S', 'HD', 'AB', 'NL', 'SP', 'SICK'].includes(cellStr);
            });
            if (hasLeaveCode) {
              // This column contains leave codes - we'll treat each unique code as a separate entry
            }
          }
        }

        // Find column indices for User ID and Name
        let userIdCol = 1;
        let nameCol = 2;
        if (headerRow) {
          userIdCol = (headerRow as any[]).findIndex((h: any) => String(h).toUpperCase().includes('USER ID'));
          nameCol = (headerRow as any[]).findIndex((h: any) => String(h).toUpperCase().includes('NAME'));
        }
        if (userIdCol === -1) userIdCol = 1;
        if (nameCol === -1) nameCol = 2;

        // Determine starting row for data
        const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

        // Parse each row and match with existing employees
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 3) continue;

          const empId = row[userIdCol];
          const empName = row[nameCol];
          if (!empId || !empName) continue;

          // Match with existing employee in system
          const matchedEmp = employees.find(e =>
            e.employeeId === empId ||
            e.fullName === empName ||
            String(e.employeeId) === String(empId)
          );

          // If we have leave type columns from header, use those
          if (Object.keys(leaveTypeCols).length > 0) {
            for (const [leaveType, colIndex] of Object.entries(leaveTypeCols)) {
              const value = row[colIndex as unknown as number];
              if (value && value !== 0 && value !== '0') {
                parsed.push({
                  employeeId: empId,
                  employeeName: empName,
                  matchedEmployeeId: matchedEmp?.id || null,
                  date: summaryDate,
                  leaveType: leaveType,
                  mappedType: mapLeaveType(leaveType),
                  days: value,
                  selected: true,
                  isSummary: true,
                  matched: !!matchedEmp
                });
              }
            }
          } else {
            // No header - scan all columns for leave codes
            for (let col = 3; col < row.length; col++) {
              const value = row[col];
              const valueStr = String(value).toUpperCase().trim();
              if (['AL', 'EL', 'SICK', 'SP', 'FL', 'OFF', 'MC', 'SUS', 'NL', 'HD', 'AB'].includes(valueStr)) {
                parsed.push({
                  employeeId: empId,
                  employeeName: empName,
                  matchedEmployeeId: matchedEmp?.id || null,
                  date: summaryDate,
                  leaveType: valueStr,
                  mappedType: mapLeaveType(valueStr),
                  days: 1,
                  selected: true,
                  isSummary: true,
                  matched: !!matchedEmp
                });
              }
            }
          }
        }
      }
      
      // Add parsed data from this sheet to allParsedData
      allParsedData.push(...parsed);
      console.log(`Sheet ${sheetName} parsed: ${parsed.length} records`);
    }
    
    setParsedLeaves(allParsedData);
    setShowUploadModal(true);
    console.log(`Total parsed records from all sheets: ${allParsedData.length}`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      alert('Error parsing Excel file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleExportToMarkdown = () => {
    const mdContent = parsedLeaves.map(leave => {
      const status = leave.matched ? '✓' : '✗';
      return `| ${leave.employeeId} | ${leave.employeeName} | ${leave.date} | ${leave.leaveType} | ${leave.mappedType} | ${leave.days || 1} | ${status} |`;
    }).join('\n');
    
    const header = `| Employee ID | Name | Date | Leave Type | Mapped Type | Days | Matched |\n|-------------|------|------|------------|-------------|------|--------|\n`;
    const fullContent = header + mdContent;
    
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaves_export_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveParsedLeaves = async () => {
    const selectedLeaves = parsedLeaves.filter(l => l.selected);
    if (selectedLeaves.length === 0) {
      alert('No leaves selected to import');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Separate summary format and standard format entries
    const summaryLeaves = selectedLeaves.filter(l => l.isSummary);
    const standardLeaves = selectedLeaves.filter(l => !l.isSummary);
    
    // Process summary format entries (have matchedEmployeeId and days)
    for (const leave of summaryLeaves) {
      if (!leave.matchedEmployeeId) {
        console.log(`Employee ${leave.employeeId} (${leave.employeeName}) not matched in system`);
        errorCount++;
        continue;
      }
      
      try {
        // Parse date as local date to avoid timezone shifts
        const [year, month, day] = leave.date.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day);

        await createLeaveRequest({
          employeeId: leave.matchedEmployeeId,
          type: leave.mappedType,
          startDate: startDate,
          endDate: endDate, // Single day for summary format
          days: leave.days || 1,
          reason: `Imported from Excel Summary (${leave.leaveType})`,
          status: 'approved',
          balanceAdjusted: true,
          appliedDate: new Date(),
          approvals: [{
            level: 1,
            approverId: 'system',
            approverName: 'System',
            status: 'approved',
            comments: 'Auto-approved from Excel import',
            actionDate: new Date()
          }]
        });
        successCount++;
      } catch (error) {
        console.error('Error importing summary leave:', error);
        errorCount++;
      }
    }
    
    // Process standard format entries (group by employee and consecutive days)
    if (standardLeaves.length > 0) {
      const grouped = groupLeavesByEmployee(standardLeaves);
      
      for (const group of grouped) {
        try {
          // Use matchedEmployeeId if available, otherwise fallback to finding by employeeId
          let empId = null;
          
          // Check if any of the leaves in this group has a matchedEmployeeId
          const matchedId = standardLeaves.find(l => l.employeeId === group.employeeId)?.matchedEmployeeId;
          if (matchedId) {
            empId = matchedId;
          } else {
            const emp = employees.find(e => e.employeeId === group.employeeId);
            empId = emp?.id;
          }
          
          if (!empId) {
            console.log(`Employee ${group.employeeId} not found`);
            errorCount++;
            continue;
          }
          
          for (const leave of group.leaves) {
            // Parse dates as local dates to avoid timezone shifts
            const [startYear, startMonth, startDay] = leave.startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = leave.endDate.split('-').map(Number);
            const startDate = new Date(startYear, startMonth - 1, startDay);
            const endDate = new Date(endYear, endMonth - 1, endDay);

            await createLeaveRequest({
              employeeId: empId,
              type: leave.type,
              startDate: startDate,
              endDate: endDate,
              days: leave.days,
              reason: `Imported from Excel (${leave.type})`,
              status: 'approved',
              balanceAdjusted: true,
              appliedDate: new Date(),
              approvals: [{
                level: 1,
                approverId: 'system',
                approverName: 'System',
                status: 'approved',
                comments: 'Auto-approved from Excel import',
                actionDate: new Date()
              }]
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing leave:', error);
          errorCount++;
        }
      }
    }
    
    alert(`Import complete: ${successCount} successful, ${errorCount} errors`);
    setShowUploadModal(false);
    setParsedLeaves([]);
    loadData();
  };

  const handleDeleteLeave = async (request: LeaveRequest) => {
    try {
      setDeleteSubmitting(true);
      await deleteLeaveRequest(request.id);
      setDeleteModal({ show: false, request: null });
      loadData();
    } catch (error) {
      console.error('Error deleting leave:', error);
      alert('Error deleting leave request');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleBulkDeleteLeaves = async () => {
    setBulkDeleteSubmitting(true);
    try {
      await bulkDeleteLeaveRequests(Array.from(selectedRequests));
      await loadData();
      setSelectedRequests(new Set());
      setBulkDeleteModal({ show: false });
      alert('Leave requests deleted successfully!');
    } catch (error) {
      console.error('Error deleting leave requests:', error);
      alert('Failed to delete leave requests. Please try again.');
    } finally {
      setBulkDeleteSubmitting(false);
    }
  };

  const groupLeavesByEmployee = (leaves: any[]) => {
    const byEmployee: Record<string, any[]> = {};
    
    leaves.forEach(leave => {
      if (!byEmployee[leave.employeeId]) {
        byEmployee[leave.employeeId] = [];
      }
      byEmployee[leave.employeeId].push(leave);
    });
    
    const result = Object.entries(byEmployee).map(([empId, empLeaves]) => {
      // Sort by date
      empLeaves.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Group consecutive days with same type
      const groups: any[] = [];
      let currentGroup: any = null;
      
      empLeaves.forEach(leave => {
        if (!currentGroup) {
          currentGroup = {
            type: leave.mappedType,
            startDate: leave.date,
            endDate: leave.date,
            days: 1
          };
        } else {
          const prevDate = new Date(currentGroup.endDate);
          prevDate.setDate(prevDate.getDate() + 1);
          const currDate = new Date(leave.date);
          
          if (prevDate.getTime() === currDate.getTime() && currentGroup.type === leave.mappedType) {
            currentGroup.endDate = leave.date;
            currentGroup.days++;
          } else {
            groups.push(currentGroup);
            currentGroup = {
              type: leave.mappedType,
              startDate: leave.date,
              endDate: leave.date,
              days: 1
            };
          }
        }
      });
      
      if (currentGroup) {
        groups.push(currentGroup);
      }
      
      return {
        employeeId: empId,
        leaves: groups
      };
    });
    
    return result;
  };

  const openLeaveForm = () => {
    setShowLeaveForm(!showLeaveForm);
    setLeaveErrors([]);
  };

  const handleLeaveSubmit = async () => {
    if (!selectedEmployeeId) {
      setLeaveErrors(['Please select an employee']);
      return;
    }

    const request = {
      employeeId: selectedEmployeeId,
      type: newLeaveType,
      startDate: new Date(newStartDate),
      endDate: new Date(newEndDate),
      days: calculateDaysFromRange(newStartDate, newEndDate),
      reason: newReason,
    } as Partial<LeaveRequest>;

    const validationErrors = validateLeaveRequest(request);
    if (validationErrors.length > 0) {
      setLeaveErrors(validationErrors);
      return;
    }

    setSubmittingLeave(true);
    try {
      await createLeaveRequest(request);
      setNewLeaveType('annual');
      setNewStartDate('');
      setNewEndDate('');
      setNewReason('');
      setNewDays(1);
      setSelectedEmployeeId('');
      setLeaveErrors([]);
      setShowLeaveForm(false);
      loadData();
    } catch (error) {
      console.error('Error applying for leave:', error);
      setLeaveErrors(['Unable to submit leave request. Please try again.']);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelLeaveRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleOpenApproval = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setApprovalModal({ show: true, request, action });
    setApprovalComments('');
  };

  const handleCloseApproval = () => {
    setApprovalModal({ show: false, request: null, action: 'approve' });
    setApprovalComments('');
  };

  const handleApprovalSubmit = async () => {
    if (!approvalModal.request || !user?.employeeId) return;

    try {
      setApprovalSubmitting(true);
      
      if (approvalModal.action === 'approve') {
        await approveLeaveRequest(
          approvalModal.request.id,
          user.employeeId,
          user.displayName || 'Admin',
          0, // Level 0 approval
          approvalComments || undefined
        );
      } else {
        await rejectLeaveRequest(
          approvalModal.request.id,
          user.employeeId,
          user.displayName || 'Admin',
          0, // Level 0 approval
          approvalComments || undefined
        );
      }

      handleCloseApproval();
      loadData();
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval');
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleSelectAll = () => {
    const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
    if (selectedRequests.size === pendingRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const handleCloseBulkApproval = () => {
    setBulkModal({ show: false, action: 'approve' });
    setBulkComments('');
  };

  const handleBulkApprovalSubmit = async () => {
    if (!user?.employeeId || selectedRequests.size === 0) return;

    try {
      setBulkSubmitting(true);
      
      for (const requestId of selectedRequests) {
        if (bulkModal.action === 'approve') {
          await approveLeaveRequest(
            requestId,
            user.employeeId,
            user.displayName || 'Admin',
            0,
            bulkComments || undefined
          );
        } else {
          await rejectLeaveRequest(
            requestId,
            user.employeeId,
            user.displayName || 'Admin',
            0,
            bulkComments || undefined
          );
        }
      }

      handleCloseBulkApproval();
      setSelectedRequests(new Set());
      loadData();
    } catch (error) {
      console.error('Error processing bulk approval:', error);
      alert('Failed to process bulk approval');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleViewRequest = (request: LeaveRequest) => {
    setViewModal({ show: true, request });
  };

  const handleCloseViewModal = () => {
    setViewModal({ show: false, request: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calculate leave summary by type (from all employee requests, not filtered by status)
  const leaveSummary = employeeRequests.reduce((acc, request) => {
    if (!acc[request.type]) {
      acc[request.type] = { count: 0, days: 0 };
    }
    acc[request.type].count += 1;
    acc[request.type].days += request.days;
    return acc;
  }, {} as Record<LeaveType, { count: number; days: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {user?.role === 'employee' ? 'My Leaves' : 'Leave Management'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {user?.role === 'employee' ? 'View your leave history and balances' : 'Manage leave requests and balances'}
          </p>
        </div>
        <div className="flex gap-2 sm:w-auto w-full">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          {can(PERMISSIONS.LEAVE_IMPORT) && (
            <Button onClick={() => {
              const input = document.getElementById('excel-upload');
              input?.click();
            }} disabled={uploadingFile} className="sm:w-auto w-full">
              <Upload className="w-5 h-5 mr-2" />
              {uploadingFile ? 'Parsing...' : 'Import from Excel'}
            </Button>
          )}
          {can(PERMISSIONS.LEAVE_REQUEST) && (
            <Button onClick={openLeaveForm} className="sm:w-auto w-full">
              <Plus className="w-5 h-5 mr-2" />
              Apply for Leave
            </Button>
          )}
        </div>
      </div>

      {/* Leave Summary Cards - Only for employees */}
      {user?.role === 'employee' && Object.keys(leaveSummary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(leaveSummary).map(([type, summary]) => (
            <div key={type} className="hover:shadow-lg transition-shadow cursor-pointer p-4 bg-white rounded-lg border border-secondary-200" onClick={() => setSelectedTypeFilter(type as LeaveType)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{typeIcons[type as LeaveType]}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeColors[type as LeaveType]}`}>
                  {typeLabels[type as LeaveType]}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Requests:</span>
                  <span className="font-bold text-secondary-900">{summary.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Total Days:</span>
                  <span className="font-bold text-secondary-900">{summary.days}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Pending ({employeeRequests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Approved ({employeeRequests.filter(r => r.status === 'approved').length})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Rejected ({employeeRequests.filter(r => r.status === 'rejected').length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-secondary-600">Filter by Type:</label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as LeaveType | 'all')}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="annual">Annual Leave</option>
                <option value="medical">Medical Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="duty">Duty Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="compassionate">Compassionate Leave</option>
                <option value="off_day">Off Day</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showLeaveForm && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Employee</label>
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                />
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Employee</option>
                  {employees
                    .filter(emp => 
                      emp.fullName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                      emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase())
                    )
                    .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Leave Type</label>
                <select
                  value={newLeaveType}
                  onChange={(e) => setNewLeaveType(e.target.value as LeaveType)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="annual">Annual</option>
                  <option value="medical">Medical</option>
                  <option value="emergency">Emergency</option>
                  <option value="duty">Duty</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                  <option value="compassionate">Compassionate</option>
                  <option value="off_day">Off Day</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => {
                    setNewStartDate(e.target.value);
                    setNewDays(calculateDaysFromRange(e.target.value, newEndDate));
                  }}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => {
                    setNewEndDate(e.target.value);
                    setNewDays(calculateDaysFromRange(newStartDate, e.target.value));
                  }}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Days</label>
                <input
                  type="number"
                  value={newDays}
                  readOnly
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg bg-secondary-50"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {leaveErrors.length > 0 && (
              <div className="mt-4 space-y-2 text-sm text-red-600">
                {leaveErrors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={handleLeaveSubmit} loading={submittingLeave}>
                Submit Leave Request
              </Button>
              <Button variant="secondary" onClick={openLeaveForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Statistics Cards - Only for managers/admins */}
      {user?.role !== 'employee' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Today on Leave</p>
              <p className="text-2xl font-bold text-blue-600">{leaveRequests.filter(r => r.status === 'approved' && new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date()).length}</p>
              <p className="text-xs text-secondary-500">employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Today on Duty</p>
              <p className="text-2xl font-bold text-green-600">{employees.length - leaveRequests.filter(r => r.status === 'approved' && new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date()).length}</p>
              <p className="text-xs text-secondary-500">employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Today on Sick Leave</p>
              <p className="text-2xl font-bold text-purple-600">{leaveRequests.filter(r => r.status === 'approved' && r.type === 'medical' && new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date()).length}</p>
              <p className="text-xs text-secondary-500">employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{leaveRequests.filter(r => r.status === 'pending').length}</p>
              <p className="text-xs text-secondary-500">awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Total Employees</p>
              <p className="text-2xl font-bold text-secondary-600">{employees.length}</p>
              <p className="text-xs text-secondary-500">in system</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Requests List */}
      <Card>
        {/* Mobile Cards - visible only on small screens */}
        <div className="sm:hidden space-y-4 p-4">
          {filteredRequests.map((request, index) => {
            const employee = employees.find(emp => emp.id === request.employeeId);
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow p-4 border border-secondary-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {(activeTab === 'pending' || activeTab === 'approved') && (
                      <button
                        onClick={() => handleSelectRequest(request.id)}
                        className="hover:text-primary-600"
                      >
                        {selectedRequests.has(request.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <div>
                      <div className="font-bold text-secondary-900 text-sm">
                        {employee?.fullName || 'Unknown'}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {employee?.employeeId || request.employeeId}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                    {request.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Type:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeColors[request.type]}`}>
                      {typeLabels[request.type]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Duration:</span>
                    <span className="font-medium">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Days:</span>
                    <span className="font-medium">{request.days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Applied:</span>
                    <span className="font-medium">{new Date(request.appliedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-secondary-600">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => handleViewRequest(request)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-primary-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  {activeTab === 'pending' && can(PERMISSIONS.LEAVE_APPROVE) && (
                    <>
                      <button
                        onClick={() => handleOpenApproval(request, 'approve')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      {can(PERMISSIONS.LEAVE_REJECT) && (
                        <button
                          onClick={() => handleOpenApproval(request, 'reject')}
                          className="flex-1 sm:flex-none px-3 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <XIcon className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      )}
                      {can(PERMISSIONS.LEAVE_CANCEL_OWN) && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="flex-1 sm:flex-none px-3 py-2 bg-secondary-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <XIcon className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </>
                  )}
                  {activeTab === 'approved' && can(PERMISSIONS.LEAVE_DELETE) && (
                    <button
                      onClick={() => setDeleteModal({ show: true, request })}
                      className="flex-1 sm:flex-none px-3 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1"
                    >
                      <XIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop Table - visible only on larger screens */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  <button onClick={handleSelectAll} className="hover:text-primary-600">
                    {selectedRequests.size === filteredRequests.length && selectedRequests.size > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredRequests.map((request, index) => {
                const employee = employees.find(emp => emp.id === request.employeeId);
                return (
                <motion.tr
                  key={request.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-secondary-50"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    {(activeTab === 'pending' || activeTab === 'approved') && (
                      <button
                        onClick={() => handleSelectRequest(request.id)}
                        className="hover:text-primary-600"
                      >
                        {selectedRequests.has(request.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">
                      {employee?.fullName || 'Unknown'}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {employee?.employeeId || request.employeeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColors[request.type]}`}>
                      {typeLabels[request.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{request.days} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status]}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    {new Date(request.appliedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {activeTab === 'pending' && can(PERMISSIONS.LEAVE_APPROVE) && (
                        <>
                          <button
                            onClick={() => handleOpenApproval(request, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          {can(PERMISSIONS.LEAVE_REJECT) && (
                            <button
                              onClick={() => handleOpenApproval(request, 'reject')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XIcon className="w-5 h-5" />
                            </button>
                          )}
                          {can(PERMISSIONS.LEAVE_CANCEL_OWN) && (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="text-secondary-600 hover:text-secondary-900"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                      {activeTab === 'approved' && can(PERMISSIONS.LEAVE_DELETE) && (
                        <button
                          onClick={() => setDeleteModal({ show: true, request })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600">No leave requests found</p>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.show && approvalModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {approvalModal.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-secondary-600">
                  <strong>Employee:</strong> {employees.find(emp => emp.id === approvalModal.request?.employeeId)?.fullName || 'Unknown'}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Type:</strong> {typeLabels[approvalModal.request.type]}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Dates:</strong> {new Date(approvalModal.request.startDate).toLocaleDateString()} - {new Date(approvalModal.request.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Days:</strong> {approvalModal.request.days}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Reason:</strong> {approvalModal.request.reason}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Comments (optional)
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleApprovalSubmit}
                  loading={approvalSubmitting}
                  className={approvalModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {approvalModal.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
                <Button variant="secondary" onClick={handleCloseApproval}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Approval Modal */}
      {bulkModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {bulkModal.action === 'approve' ? `Approve ${selectedRequests.size} Leave Requests` : `Reject ${selectedRequests.size} Leave Requests`}
              </h3>

              <div className="mb-4">
                <p className="text-sm text-secondary-600">
                  You are about to {bulkModal.action} <strong>{selectedRequests.size}</strong> leave request(s).
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Comments (optional)
                </label>
                <textarea
                  value={bulkComments}
                  onChange={(e) => setBulkComments(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBulkApprovalSubmit}
                  loading={bulkSubmitting}
                  className={bulkModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {bulkModal.action === 'approve' ? 'Approve All' : 'Reject All'}
                </Button>
                <Button variant="secondary" onClick={handleCloseBulkApproval}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Delete Leave Request
              </h3>

              <div className="mb-4">
                <p className="text-sm text-secondary-600">
                  Are you sure you want to delete this leave request for <strong>{employees.find(emp => emp.id === deleteModal.request?.employeeId)?.fullName || 'Unknown'}</strong>?
                </p>
                <p className="text-sm text-secondary-600 mt-2">
                  <strong>Type:</strong> {typeLabels[deleteModal.request.type]}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Dates:</strong> {new Date(deleteModal.request.startDate).toLocaleDateString()} - {new Date(deleteModal.request.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleDeleteLeave(deleteModal.request!)}
                  loading={deleteSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
                <Button variant="secondary" onClick={() => setDeleteModal({ show: false, request: null })}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Delete {selectedRequests.size} Leave Requests
              </h3>

              <div className="mb-4">
                <p className="text-sm text-secondary-600">
                  Are you sure you want to delete <strong>{selectedRequests.size}</strong> approved leave request(s)? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBulkDeleteLeaves}
                  loading={bulkDeleteSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All
                </Button>
                <Button variant="secondary" onClick={() => setBulkDeleteModal({ show: false })}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Review Imported Leaves ({parsedLeaves.length} records)
                </h3>
                <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="mb-4 max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={parsedLeaves.every(l => l.selected)}
                          onChange={(e) => {
                            const newSelected = e.target.checked;
                            setParsedLeaves(parsedLeaves.map(l => ({ ...l, selected: newSelected })));
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Employee ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Leave Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Mapped Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Matched</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {parsedLeaves.map((leave, index) => (
                      <tr key={index} className={`hover:bg-secondary-50 ${!leave.matched ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={leave.selected}
                            onChange={(e) => {
                              const newLeaves = [...parsedLeaves];
                              newLeaves[index].selected = e.target.checked;
                              setParsedLeaves(newLeaves);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{leave.employeeId}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{leave.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">
                          {leave.isSummary ? (
                            <input
                              type="date"
                              value={leave.date}
                              onChange={(e) => {
                                const newLeaves = [...parsedLeaves];
                                newLeaves[index].date = e.target.value;
                                setParsedLeaves(newLeaves);
                              }}
                              className="px-2 py-1 border border-secondary-300 rounded"
                            />
                          ) : (
                            leave.date
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{leave.leaveType}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{typeLabels[leave.mappedType as LeaveType]}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{leave.days || 1}</td>
                        <td className="px-4 py-3 text-sm">
                          {leave.matched !== undefined ? (
                            <span className={leave.matched ? 'text-green-600' : 'text-red-600'}>
                              {leave.matched ? '✓' : '✗'}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveParsedLeaves} className="bg-green-600 hover:bg-green-700">
                  Import Selected Leaves
                </Button>
                <Button variant="secondary" onClick={handleExportToMarkdown}>
                  Export to Markdown
                </Button>
                <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {viewModal.show && viewModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Leave Request Details
              </h3>
              
              <div className="space-y-3 mb-4">
                <p className="text-sm text-secondary-600">
                  <strong>Employee:</strong> {employees.find(emp => emp.id === viewModal.request?.employeeId)?.fullName || 'Unknown'}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Type:</strong> {typeLabels[viewModal.request.type]}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Dates:</strong> {new Date(viewModal.request.startDate).toLocaleDateString()} - {new Date(viewModal.request.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Days:</strong> {viewModal.request.days}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Reason:</strong> {viewModal.request.reason}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Status:</strong> {viewModal.request.status}
                </p>
                <p className="text-sm text-secondary-600">
                  <strong>Applied Date:</strong> {new Date(viewModal.request.appliedDate).toLocaleDateString()}
                </p>
                {viewModal.request.approvals && viewModal.request.approvals.length > 0 && (
                  <div className="text-sm text-secondary-600">
                    <strong>Approvals:</strong>
                    <ul className="ml-4 mt-1">
                      {viewModal.request.approvals.map((approval, idx) => (
                        <li key={idx}>
                          {approval.approverName} - {approval.status} ({approval.actionDate ? new Date(approval.actionDate).toLocaleDateString() : ''})
                          {approval.comments && <span className="ml-2">- {approval.comments}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button variant="secondary" onClick={handleCloseViewModal}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
