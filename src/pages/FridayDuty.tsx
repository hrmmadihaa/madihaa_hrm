import React, { useState, useEffect, useCallback } from 'react';
import { Save, Printer, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { getEmployees } from '../lib/employees';
import { getAllWorkLocations } from '../lib/workLocation';
import { getLeaveRequests, createLeaveRequest, deleteLeaveRequest } from '../lib/leave';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { WorkLocation } from '../types';

interface Employee {
  id: string;
  empId: string;
  fullName: string;
  department: string;
  designation?: string;
}

interface FridayScheduleEntry {
  status: 'On' | 'Off' | 'Holiday';
  remarks: string;
}

interface FridayScheduleData {
  [dateString: string]: {
    [empId: string]: FridayScheduleEntry;
  };
}

export const FridayDuty = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<FridayScheduleData>({});
  const [currentFridays, setCurrentFridays] = useState<Date[]>([]);
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Group employees by work location
  const employeesByWorkLocation = useCallback(() => {
    const grouped: { [key: string]: Employee[] } = {};
    
    // Initialize with all work locations
    workLocations.forEach(loc => {
      if (loc.name) {
        grouped[loc.name] = [];
      }
    });
    
    // Add employees to their assigned work locations
    employees.forEach(emp => {
      // Find the work location this employee is assigned to
      const workLocation = workLocations.find(loc => loc.assignedStaff?.includes(emp.id));
      if (workLocation && workLocation.name) {
        grouped[workLocation.name].push(emp);
      } else {
        // Unassigned employees
        if (!grouped['Unassigned']) grouped['Unassigned'] = [];
        grouped['Unassigned'].push(emp);
      }
    });
    
    // Remove empty work locations
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });
    
    return grouped as Record<string, Employee[]>;
  }, [employees, workLocations]);

  // Filter employees by selected work location
  const filteredGroupedEmployees = useCallback(() => {
    const grouped = employeesByWorkLocation();
    if (selectedWorkLocation === 'all') {
      return grouped;
    }
    return { [selectedWorkLocation]: grouped[selectedWorkLocation] || [] };
  }, [employeesByWorkLocation, selectedWorkLocation]);

  // Calculate past 4 Fridays and next Friday from current date
  const getFridays = useCallback(() => {
    const fridays: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent Friday (could be today if today is Friday)
    let current = new Date(today);
    const dayOfWeek = current.getDay();

    // If today is Friday, start from today
    if (dayOfWeek === 5) {
      // Keep current as is
    } else {
      // Go back to the most recent Friday
      const daysSinceFriday = (dayOfWeek - 5 + 7) % 7;
      current.setDate(current.getDate() - daysSinceFriday);
    }

    // Get past 4 Fridays (going backwards)
    for (let i = 3; i >= 0; i--) {
      const pastFriday = new Date(current);
      pastFriday.setDate(current.getDate() - (i * 7));
      fridays.push(pastFriday);
    }

    // Get next Friday
    const nextFriday = new Date(current);
    nextFriday.setDate(current.getDate() + 7);
    fridays.push(nextFriday);

    // Sort chronologically
    return fridays.sort((a, b) => a.getTime() - b.getTime());
  }, []);

  // Load employees and work locations
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empData, locData, leaveData] = await Promise.all([
          getEmployees(),
          getAllWorkLocations(),
          getLeaveRequests()
        ]);
        const formattedEmployees = empData.map(emp => ({
          id: emp.id,
          empId: emp.employeeId,
          fullName: emp.fullName,
          department: emp.department || 'Unassigned',
          designation: emp.designation
        }));
        setEmployees(formattedEmployees);
        setWorkLocations(locData);
        setLeaveRequests(leaveData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load schedule data from Firebase
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        console.log('Friday Duty - Attempting to load schedule data from friday_schedules/current');
        const scheduleDoc = await getDoc(doc(db, 'friday_schedules', 'current'));
        console.log('Friday Duty - Schedule doc exists:', scheduleDoc.exists());
        if (scheduleDoc.exists()) {
          console.log('Friday Duty - Schedule data loaded:', scheduleDoc.data());
          setScheduleData(scheduleDoc.data() as FridayScheduleData);
        }
      } catch (error) {
        console.error('Friday Duty - Error loading schedule data:', error);
        console.error('Friday Duty - Error code:', (error as any).code);
        console.error('Friday Duty - Error message:', (error as any).message);
      }
    };
    loadScheduleData();
  }, []);

  // Update Fridays when data loads
  useEffect(() => {
    console.log('Friday Duty - useEffect triggered, employees:', employees.length, 'leaves:', leaveRequests.length);
    if (employees.length === 0 || leaveRequests.length === 0) return;

    const fridays = getFridays();
    console.log('Friday Duty - Fridays:', fridays.map(f => getDateString(f)));
    setCurrentFridays(fridays);

    // Auto-populate schedule data based on leave requests
    const updatedScheduleData: FridayScheduleData = { ...scheduleData };

    fridays.forEach(friday => {
      const dateString = getDateString(friday);

      employees.forEach(emp => {
        // Check if employee has leave on this Friday
        const hasLeave = leaveRequests.some(leave => {
          if (leave.employeeId !== emp.id) return false;
          if (leave.status !== 'approved') return false;

          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);
          leaveStart.setHours(0, 0, 0, 0);
          leaveEnd.setHours(23, 59, 59, 999);

          return friday >= leaveStart && friday <= leaveEnd;
        });

        if (hasLeave) {
          const leaveRequest = leaveRequests.find(leave => {
            if (leave.employeeId !== emp.id) return false;
            if (leave.status !== 'approved') return false;

            const leaveStart = new Date(leave.startDate);
            const leaveEnd = new Date(leave.endDate);
            leaveStart.setHours(0, 0, 0, 0);
            leaveEnd.setHours(23, 59, 59, 999);

            return friday >= leaveStart && friday <= leaveEnd;
          });

          if (!updatedScheduleData[dateString]) updatedScheduleData[dateString] = {};
          // Always override with leave data - leave takes precedence
          updatedScheduleData[dateString][emp.empId] = {
            status: 'Off',
            remarks: leaveRequest?.reason || `Imported from Excel (${leaveRequest?.type})`
          };
          console.log(`Friday Duty - Marked ${emp.fullName} (${emp.empId}) as Off on ${dateString}`);
        }
      });
    });

    // Debug: Check for Ahmed Rifath specifically
    const ahmedEmployees = employees.filter(e => e.fullName.toLowerCase().includes('ahmed'));
    console.log('Friday Duty - All Ahmed employees:');
    ahmedEmployees.forEach(e => console.log(`  - ${e.fullName} (${e.empId}), ID: ${e.id}`));
    const ahmedRifath = employees.find(e => e.fullName.toLowerCase().includes('ahmed rifath'));
    if (ahmedRifath) {
      console.log('Friday Duty - Ahmed Rifath found:', ahmedRifath);
      const ahmedLeaves = leaveRequests.filter(l => l.employeeId === ahmedRifath.id);
      console.log('Friday Duty - Ahmed Rifath leaves count:', ahmedLeaves.length);
      console.log('Friday Duty - Ahmed Rifath leaves:', ahmedLeaves.map(l => ({
        type: l.type,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status
      })));
    }

    setScheduleData(updatedScheduleData);
    console.log('Friday Duty - Schedule data updated');
  }, [getFridays, employees, leaveRequests]);

  const handleStatusChange = (dateString: string, empId: string, status: 'On' | 'Off' | 'Holiday') => {
    const employee = employees.find(emp => emp.empId === empId);
    const oldStatus = scheduleData[dateString]?.[empId]?.status || 'On';
    
    console.log('Friday Duty - Status change:', {
      date: dateString,
      employeeId: empId,
      employeeName: employee?.fullName || 'Unknown',
      oldStatus,
      newStatus: status,
      user: auth.currentUser?.email
    });
    
    setScheduleData(prev => {
      const updated = { ...prev };
      if (!updated[dateString]) updated[dateString] = {};
      if (!updated[dateString][empId]) updated[dateString][empId] = { status: 'On', remarks: '' };
      updated[dateString][empId].status = status;
      
      console.log('Friday Duty - Updated scheduleData for this change:', {
        date: dateString,
        empId,
        entry: updated[dateString][empId]
      });
      
      return updated;
    });
  };

  const handleRemarksChange = (dateString: string, empId: string, remarks: string) => {
    const employee = employees.find(emp => emp.empId === empId);
    const oldRemarks = scheduleData[dateString]?.[empId]?.remarks || '';
    
    console.log('Friday Duty - Remarks change:', {
      date: dateString,
      employeeId: empId,
      employeeName: employee?.fullName || 'Unknown',
      oldRemarks,
      newRemarks: remarks,
      user: auth.currentUser?.email
    });
    
    setScheduleData(prev => {
      const updated = { ...prev };
      if (!updated[dateString]) updated[dateString] = {};
      if (!updated[dateString][empId]) updated[dateString][empId] = { status: 'On', remarks: '' };
      updated[dateString][empId].remarks = remarks;
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Debug: Check user auth token
      const user = auth.currentUser;
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        console.log('Friday Duty - User email:', user.email);
        console.log('Friday Duty - User UID:', user.uid);
        console.log('Friday Duty - Auth token claims:', tokenResult.claims);
        console.log('Friday Duty - Role in token:', tokenResult.claims.role);
      }
      
      console.log('Friday Duty - Attempting to save schedule data:', scheduleData);
      console.log('Friday Duty - Collection: friday_schedules, Document: current');
      
      // Log summary of changes
      const changeSummary = {
        totalDates: Object.keys(scheduleData).length,
        totalEntries: Object.values(scheduleData).reduce((sum, day) => sum + Object.keys(day).length, 0),
        offCount: 0,
        onCount: 0,
        holidayCount: 0
      };
      
      Object.values(scheduleData).forEach(day => {
        Object.values(day).forEach(entry => {
          if (entry.status === 'Off') changeSummary.offCount++;
          else if (entry.status === 'On') changeSummary.onCount++;
          else if (entry.status === 'Holiday') changeSummary.holidayCount++;
        });
      });
      
      console.log('Friday Duty - Change summary:', changeSummary);
      
      await setDoc(doc(db, 'friday_schedules', 'current'), scheduleData, { merge: true });
      console.log('Friday Duty - Schedule data saved successfully');

      // Refresh leave requests to get latest data
      const updatedLeaveRequests = await getLeaveRequests();

      // Create leave requests for employees marked as "Off" and delete for "On"
      for (const dateString in scheduleData) {
        // Parse date in local timezone to avoid timezone shifts
        const [year, month, day] = dateString.split('-').map(Number);
        const fridayDate = new Date(year, month - 1, day);
        fridayDate.setHours(0, 0, 0, 0);

        // Skip dates that are not Fridays (day of week 5)
        if (fridayDate.getDay() !== 5) {
          continue;
        }

        const dayEntries = scheduleData[dateString];

        for (const empId in dayEntries) {
          const entry = dayEntries[empId];
          const employee = employees.find(emp => emp.empId === empId);
          if (!employee) continue;

          // Check if leave request already exists for this date
          const existingLeave = updatedLeaveRequests.find(leave => {
            if (leave.employeeId !== employee.id) return false;
            if (leave.type !== 'off_day') return false;
            const leaveStart = new Date(leave.startDate);
            leaveStart.setHours(0, 0, 0, 0);
            return leaveStart.getTime() === fridayDate.getTime();
          });

          if (entry.status === 'Off') {
            // Create leave request if it doesn't exist
            if (!existingLeave) {
              console.log('Friday Duty - Creating leave request for:', {
                employeeId: employee.id,
                employeeName: employee.fullName,
                date: dateString,
                remarks: entry.remarks
              });
              await createLeaveRequest({
                employeeId: employee.id,
                type: 'off_day',
                startDate: fridayDate,
                endDate: fridayDate,
                days: 1,
                reason: entry.remarks || 'Friday Off Duty',
                status: 'approved',
                balanceAdjusted: true,
                appliedDate: new Date(),
                approvals: [{
                  level: 1,
                  approverId: 'system',
                  approverName: 'System',
                  status: 'approved',
                  comments: 'Auto-generated from Friday Duty Schedule',
                  actionDate: new Date()
                }]
              });
              console.log('Friday Duty - Leave request created successfully');
            } else {
              console.log('Friday Duty - Leave request already exists for:', {
                employeeId: employee.id,
                employeeName: employee.fullName,
                date: dateString
              });
            }
          } else if (entry.status === 'On' && existingLeave) {
            // Delete leave request if employee is marked as "On"
            console.log('Friday Duty - Deleting leave request for:', {
              employeeId: employee.id,
              employeeName: employee.fullName,
              date: dateString,
              leaveId: existingLeave.id
            });
            await deleteLeaveRequest(existingLeave.id);
            console.log('Friday Duty - Leave request deleted successfully');
          }
        }
      }

      alert('Schedule saved successfully! Leave requests updated.');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = async () => {
    console.log('Friday Duty - Refreshing data...');
    setLoading(true);
    try {
      const [leaveData, scheduleDoc] = await Promise.all([
        getLeaveRequests(),
        getDoc(doc(db, 'friday_schedules', 'current'))
      ]);
      console.log('Friday Duty - Loaded leave requests:', leaveData.length);
      console.log('Friday Duty - Loaded schedule doc exists:', scheduleDoc.exists());
      setLeaveRequests(leaveData);
      if (scheduleDoc.exists()) {
        setScheduleData(scheduleDoc.data() as FridayScheduleData);
      } else {
        setScheduleData({});
      }
      console.log('Friday Duty - Refresh complete');
    } catch (error) {
      console.error('Friday Duty - Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!confirm('Are you sure you want to clear all Friday schedule data? This will remove all saved "On/Off" statuses.')) {
      return;
    }
    try {
      await setDoc(doc(db, 'friday_schedules', 'current'), {});
      setScheduleData({});
      alert('Schedule data cleared successfully!');
    } catch (error) {
      console.error('Error clearing schedule:', error);
      alert('Failed to clear schedule. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate summary for a department on a specific date
  const calculateSummary = (departmentEmployees: Employee[], dateString: string) => {
    const counts: { [key: string]: number } = {};
    departmentEmployees.forEach(emp => {
      const entry = scheduleData[dateString]?.[emp.empId];
      const status = entry?.status || 'On';
      if (status === 'On') {
        const position = emp.designation || 'Unknown';
        counts[position] = (counts[position] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([pos, count]) => (
      <span key={pos} className="summary-item inline-block mr-3">
        <b>{pos}:</b> {count}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const groupedEmployees = employeesByWorkLocation();

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.3cm;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Hide sidebar, header, and navigation */
          aside, header, button, .space-y-6 > div:first-child {
            display: none !important;
          }
          
          /* Remove padding from main content */
          main {
            padding: 0 !important;
          }
          
          .space-y-6 {
            gap: 0 !important;
          }
          
          /* Fit table to page width */
          .overflow-x-auto {
            overflow: visible !important;
          }
          
          table {
            width: 100% !important;
            font-size: 8px !important;
            table-layout: fixed !important;
          }
          
          th, td {
            padding: 2px 4px !important;
            font-size: 8px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          /* Ensure sticky columns work in print */
          .sticky {
            position: static !important;
          }
          
          /* Page break before each work location */
          tbody {
            page-break-inside: avoid;
          }
          
          /* Ensure work location headers don't break */
          tr.bg-primary-50 {
            page-break-after: auto;
          }
          
          /* Reduce card padding */
          .Card, .CardContent {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Friday Duty Schedule</h1>
          <p className="text-secondary-600 mt-1">Manage Friday off-duty schedule for all employees</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <select
            value={selectedWorkLocation}
            onChange={(e) => setSelectedWorkLocation(e.target.value)}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Work Locations</option>
            {Object.keys(groupedEmployees).map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleClearSchedule} disabled={loading}>
            Clear
          </Button>
          <Button onClick={handlePrint} disabled={loading}>
            <Printer className="w-5 h-5 mr-2" />
            Print
          </Button>
          <Button onClick={handleSave} disabled={loading || saving} loading={saving}>
            <Save className="w-5 h-5 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Schedule Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-secondary-300 px-4 py-2 bg-secondary-100 text-left font-semibold text-secondary-700 sticky left-0 bg-secondary-100 z-10">
                    Employee Name
                  </th>
                  {currentFridays.map((friday, index) => (
                    <th key={index} colSpan={2} className="border border-secondary-300 px-4 py-2 bg-secondary-100 text-center font-semibold text-secondary-700">
                      {formatDate(friday)}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border border-secondary-300 px-4 py-2 bg-secondary-50 text-left font-medium text-secondary-600 sticky left-0 bg-secondary-50 z-10">
                    &nbsp;
                  </th>
                  {currentFridays.map((_, index) => (
                    <React.Fragment key={index}>
                      <th className="border border-secondary-300 px-4 py-2 bg-secondary-50 text-center font-medium text-secondary-600 w-24">
                        Status
                      </th>
                      <th className="border border-secondary-300 px-4 py-2 bg-secondary-50 text-center font-medium text-secondary-600">
                        Remarks
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredGroupedEmployees()).map(([department, deptEmployees]) => (
                  <React.Fragment key={department}>
                    <tr className="bg-primary-50">
                      <td colSpan={1 + currentFridays.length * 2} className="border border-secondary-300 px-4 py-3 font-bold text-primary-900">
                        {department}
                      </td>
                    </tr>
                    {/* Summary Row */}
                    <tr className="bg-secondary-50">
                      <td className="border border-secondary-300 px-4 py-2 font-semibold text-secondary-900 sticky left-0 bg-secondary-50">
                        Summary
                      </td>
                      {currentFridays.map((friday, index) => {
                        const dateString = getDateString(friday);
                        return (
                          <td key={index} colSpan={2} className="border border-secondary-300 px-4 py-2 text-sm text-secondary-700">
                            {calculateSummary(deptEmployees, dateString)}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Employee Rows */}
                    {deptEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-secondary-50">
                        <td className="border border-secondary-300 px-4 py-2 text-secondary-900 sticky left-0 bg-white">
                          {employee.fullName}
                        </td>
                        {currentFridays.map((friday, index) => {
                          const dateString = getDateString(friday);
                          const entry = scheduleData[dateString]?.[employee.empId];
                          const status = entry?.status || 'On';
                          const remarks = entry?.remarks || '';
                          return (
                            <React.Fragment key={index}>
                              <td className="border border-secondary-300 px-2 py-2">
                                <select
                                  value={status}
                                  onChange={(e) => handleStatusChange(dateString, employee.empId, e.target.value as 'On' | 'Off' | 'Holiday')}
                                  className="w-full px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                >
                                  <option value="On">On</option>
                                  <option value="Off">Off</option>
                                  <option value="Holiday">Holiday</option>
                                </select>
                              </td>
                              <td className="border border-secondary-300 px-2 py-2">
                                <input
                                  type="text"
                                  value={remarks}
                                  onChange={(e) => handleRemarksChange(dateString, employee.empId, e.target.value)}
                                  placeholder="Remarks..."
                                  className="w-full px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
