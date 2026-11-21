import { useEffect, useMemo, useState } from "react";
import React from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Download, Printer, Search } from "lucide-react";
import { exportMonthlyAttendanceExcel } from "../utils/exportAttendanceExcel";
import type { StaffAttendance } from "../utils/exportAttendanceExcel";
import { getEmployees } from "../lib/employees";
import { getAttendance } from "../lib/attendance";
import { getOvertimeFromAttendance } from "../lib/overtime";
import "./MonthlyAttendanceExcel.css";

const STATUS_CODES = [
  "OFF", "MC", "EL", "AL", "SUS", "FL",
  "SICK", "HD", "AB", "NL", "SP",
] as const;

type StatusCode = typeof STATUS_CODES[number];

type Employee = {
  id: string;
  userId: string;
  name: string;
  staffType: string;
  workSite: string;
  jobLevel: string;
  country: string;
  status: string;
};

type Attendance = {
  employeeId: string;
  date: string;
  inTime: string;
  outTime: string;
  status: string;
  remarks: string;
};

type LeaveRequest = {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  type: string;
  status: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function getDate(value: any): string {
  if (!value) return "";

  let d: Date;

  if (value?.toDate) {
    d = value.toDate();
  } else if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
  } else {
    return "";
  }

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTime(value: any): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 5);
  }

  if (value?.toDate) {
    return value.toDate().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (value instanceof Date) {
    return value.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "";
}

function isStatus(value: string): value is StatusCode {
  return STATUS_CODES.includes(value.toUpperCase() as StatusCode);
}

export default function StaffAttendanceReport() {
  const now = new Date();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(now.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(now.toISOString().slice(0, 10));
  const [otStartDate, setOtStartDate] = useState(now.toISOString().slice(0, 10));
  const [otEndDate, setOtEndDate] = useState(now.toISOString().slice(0, 10));
  const [faStartDate, setFaStartDate] = useState(now.toISOString().slice(0, 10));
  const [faEndDate, setFaEndDate] = useState(now.toISOString().slice(0, 10));

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [overtimeData, setOvertimeData] = useState<any[]>([]);
  const [foodAllowance, setFoodAllowance] = useState({ firstHalf: 0, secondHalf: 0, total: 0 });

  const [loading, setLoading] = useState(true);

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const empData = await getEmployees();
        setEmployees(empData.map((e: any) => ({
          id: e.id,
          userId: String(e.employeeId || e.userId || e.empId || e.staffId || ""),
          name: String(e.fullName || e.name || e.employeeName || ""),
          staffType: String(e.staffType || e.employeeType || e.category || e.designation || ""),
          workSite: String(e.workSite || ""),
          jobLevel: String(e.jobLevel || ""),
          country: String(e.country || ""),
          status: String(e.status || "active"),
        })));
        setLoading(false);
      } catch (err) {
        console.error("Error loading employees:", err);
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  // Load attendance for selected employee and date range
  useEffect(() => {
    if (!selectedEmployeeUserId || !startDate || !endDate) {
      setAttendance([]);
      return;
    }

    const loadAttendance = async () => {
      try {
        console.log('Loading attendance for employee userId:', selectedEmployeeUserId);
        console.log('Date range:', startDate, 'to', endDate);
        const data = await getAttendance(
          selectedEmployeeUserId,
          new Date(startDate),
          new Date(endDate)
        );
        console.log('Raw attendance data:', data);
        const mappedData = data.map((att: any) => ({
          employeeId: String(att.userId || att.employeeId || ""),
          date: getDate(att.date || att.attendanceDate || att.createdAt),
          inTime: getTime(att.inTime || att.checkIn || att.clockIn || att.IN || att.checkInTime),
          outTime: getTime(att.outTime || att.checkOut || att.clockOut || att.OUT || att.checkOutTime),
          status: String(att.status || att.attendanceStatus || att.leaveType || "").toUpperCase(),
          remarks: String(att.remarks || att.remark || ""),
        }));
        console.log('Mapped attendance data:', mappedData);
        setAttendance(mappedData);
      } catch (err) {
        console.error("Error loading attendance:", err);
      }
    };

    loadAttendance();
  }, [selectedEmployeeUserId, startDate, endDate]);

  // Load leave requests for selected employee
  useEffect(() => {
    if (!selectedEmployeeId) {
      setLeaveRequests([]);
      return;
    }

    const leaveUnsubscribe = onSnapshot(
      collection(db, "leave_requests"),
      (snapshot) => {
        const leaves = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            employeeId: String(d.employeeId || ""),
            startDate: d.startDate?.toDate?.() || d.startDate || new Date(),
            endDate: d.endDate?.toDate?.() || d.endDate || new Date(),
            type: String(d.type || "").toLowerCase(),
            status: String(d.status || "").toLowerCase(),
          };
        }).filter(leave => leave.employeeId === selectedEmployeeId);
        setLeaveRequests(leaves);
      },
      (err) => {
        console.error("Error loading leave requests:", err);
      }
    );

    return () => leaveUnsubscribe();
  }, [selectedEmployeeId]);

  // Load overtime data for selected employee
  useEffect(() => {
    if (!selectedEmployeeUserId || !otStartDate || !otEndDate) {
      setOvertimeData([]);
      return;
    }

    const loadOvertime = async () => {
      try {
        console.log('Loading overtime for employee userId:', selectedEmployeeUserId);
        console.log('OT Date range:', otStartDate, 'to', otEndDate);
        const allOvertimeData = await getOvertimeFromAttendance();
        
        // Filter by employee userId and date range
        const filteredData = allOvertimeData.filter((ot: any) => {
          const employeeMatch = ot.employeeId === selectedEmployeeUserId || ot.employeeName?.toLowerCase().includes(selectedEmployeeUserId.toLowerCase());
          const recordDate = new Date(ot.date);
          const startDate = new Date(otStartDate);
          const endDate = new Date(otEndDate);
          const dateMatch = recordDate >= startDate && recordDate <= endDate;
          return employeeMatch && dateMatch;
        });
        
        console.log('Filtered overtime data:', filteredData);
        setOvertimeData(filteredData);
      } catch (err) {
        console.error("Error loading overtime:", err);
      }
    };

    loadOvertime();
  }, [selectedEmployeeUserId, otStartDate, otEndDate]);

  // Generate dates for overtime range
  const otDates = useMemo(() => {
    if (!otStartDate || !otEndDate) return [];

    const start = new Date(otStartDate);
    const end = new Date(otEndDate);
    const dates = [];

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      dates.push({
        day: d.getDate(),
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    return dates;
  }, [otStartDate, otEndDate]);

  // Overtime index for quick lookup
  const overtimeMap = useMemo(() => {
    const map = new Map<string, any>();
    overtimeData.forEach((item) => {
      const dateKey = new Date(item.date).toISOString().slice(0, 10);
      map.set(dateKey, item);
    });
    return map;
  }, [overtimeData]);
  const dates = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      dates.push({
        day: d.getDate(),
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }

    return dates;
  }, [startDate, endDate]);

  // Attendance index for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((item) => {
      // Try to find matching employee by employeeId from attendance record
      // Match by userId first, then by document id
      const employee = employees.find(e => e.userId === item.employeeId || e.id === item.employeeId);
      
      if (employee) {
        // Use the employee's userId as the key to ensure consistency
        map.set(`${employee.userId}_${item.date}`, item);
      } else {
        // Fallback: use the original employeeId if no match found
        map.set(`${item.employeeId}_${item.date}`, item);
      }
    });
    console.log('Final attendanceMap:', Array.from(map.entries()));
    return map;
  }, [attendance, employees]);

  // Calculate food allowance based on attendance for the selected date range
  useEffect(() => {
    if (!selectedEmployeeUserId || !faStartDate || !faEndDate) {
      setFoodAllowance({ firstHalf: 0, secondHalf: 0, total: 0 });
      return;
    }

    const calculateFoodAllowance = () => {
      const start = new Date(faStartDate);
      const end = new Date(faEndDate);
      
      let firstHalfDaysWorked = 0;
      let secondHalfDaysWorked = 0;
      let totalDaysInRange = 0;
      
      // Count days worked in the selected date range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        totalDaysInRange++;
        const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const record = attendanceMap.get(`${selectedEmployeeUserId}_${dateKey}`);
        
        if (record && (record.inTime || record.status === 'P')) {
          if (d.getDate() <= 15) {
            firstHalfDaysWorked++;
          } else {
            secondHalfDaysWorked++;
          }
        }
      }
      
      // Calculate allowance: 750 MVR per half divided by 15 days (standard half-month), multiplied by days worked in range
      const firstHalfAllowance = (750 / 15) * firstHalfDaysWorked;
      const secondHalfAllowance = (750 / 15) * secondHalfDaysWorked;
      const totalAllowance = firstHalfAllowance + secondHalfAllowance;
      
      setFoodAllowance({
        firstHalf: Math.round(firstHalfAllowance),
        secondHalf: Math.round(secondHalfAllowance),
        total: Math.round(totalAllowance)
      });
    };

    calculateFoodAllowance();
  }, [selectedEmployeeUserId, faStartDate, faEndDate, attendanceMap]);

  // Leave index for quick lookup
  const leaveMap = useMemo(() => {
    const map = new Map<string, LeaveRequest[]>();
    leaveRequests.forEach((request) => {
      if (request.status !== 'approved') return;

      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;

        // Try to match by userId first, then by document id
        const employee = employees.find(e => e.userId === request.employeeId || e.id === request.employeeId);
        if (employee) {
          const key = `${employee.userId}_${dateStr}`;

          if (!map.has(key)) {
            map.set(key, []);
          }
          map.get(key)!.push(request);
        }

        current.setDate(current.getDate() + 1);
      }
    });
    return map;
  }, [leaveRequests, employees]);

  // Check if employee is on leave for a specific date
  function getLeaveStatus(employeeId: string, date: string): string | null {
    const leaves = leaveMap.get(`${employeeId}_${date}`);
    if (!leaves || leaves.length === 0) return null;

    const leave = leaves[0];
    const type = leave.type.toLowerCase();

    const typeMap: Record<string, string> = {
      'annual': 'AL',
      'medical': 'MC',
      'emergency': 'EL',
      'duty': 'OFF',
      'family': 'FL',
      'sick': 'SICK',
      'special': 'SP',
      'no pay': 'NL',
      'off day': 'OFF',
      'off_day': 'OFF',
    };

    return typeMap[type] || type.toUpperCase();
  }

  // Get attendance record
  function getRecord(employeeId: string, date: string) {
    return attendanceMap.get(`${employeeId}_${date}`);
  }

  function getDailyValue(employeeId: string, date: string, type: "IN" | "OUT") {
    const record = getRecord(employeeId, date);
    const leaveStatus = getLeaveStatus(employeeId, date);

    console.log(`getDailyValue called: employeeId=${employeeId}, date=${date}, type=${type}`);
    console.log('Record found:', record);
    console.log('Leave status:', leaveStatus);

    if (leaveStatus && isStatus(leaveStatus)) {
      console.log('Returning leave status:', leaveStatus);
      return leaveStatus;
    }

    if (!record) {
      console.log('No record found, returning empty string');
      return "";
    }

    if (isStatus(record.status)) {
      console.log('Returning status:', record.status);
      return record.status;
    }

    const result = type === "IN" ? record.inTime : record.outTime;
    console.log(`Returning ${type} time:`, result);
    return result;
  }

  // Calculate summary statistics
  function getEmployeeSummary(employee: Employee) {
    const counts: Record<StatusCode, number> = {
      OFF: 0,
      MC: 0,
      EL: 0,
      AL: 0,
      SUS: 0,
      FL: 0,
      SICK: 0,
      HD: 0,
      AB: 0,
      NL: 0,
      SP: 0,
    };

    let presentDays = 0;
    let fridays = 0;

    dates.forEach((date) => {
      const record = attendanceMap.get(`${employee.userId}_${date.date}`);
      const leaveStatus = getLeaveStatus(employee.userId, date.date);

      if (leaveStatus && isStatus(leaveStatus)) {
        counts[leaveStatus]++;
        return;
      }

      if (!record) return;

      if (isStatus(record.status)) {
        counts[record.status]++;
        if (record.inTime || record.outTime) {
          presentDays++;
          if (date.weekday === "Fri") fridays++;
        }
      } else if (record.inTime || record.outTime) {
        presentDays++;
        if (date.weekday === "Fri") fridays++;
      }
    });

    return { presentDays, fridays, counts };
  }

  // Map to export format
  function mapToExportFormat(employee: Employee): StaffAttendance {
    const attendance: Record<number, { inTime?: string; outTime?: string; status?: string }> = {};
    const overtime: Record<number, { inTime?: string; outTime?: string; otHours?: string }> = {};
    const summary = getEmployeeSummary(employee);

    dates.forEach((date) => {
      const record = getRecord(employee.userId, date.date);
      const leaveStatus = getLeaveStatus(employee.userId, date.date);

      if (leaveStatus && isStatus(leaveStatus)) {
        attendance[date.day] = {
          status: leaveStatus,
        };
      } else if (record) {
        attendance[date.day] = {
          inTime: record.inTime || undefined,
          outTime: record.outTime || undefined,
          status: isStatus(record.status) ? record.status : undefined,
        };
      }
    });

    // Map overtime data
    otDates.forEach((date) => {
      const otRecord = overtimeMap.get(date.date);
      if (otRecord) {
        overtime[date.day] = {
          inTime: otRecord.checkInTime 
            ? new Date(otRecord.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
            : undefined,
          outTime: otRecord.checkOutTime
            ? new Date(otRecord.checkOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
            : undefined,
          otHours: otRecord.overtimeHours?.toFixed(2) || undefined,
        };
      }
    });

    return {
      userId: employee.userId,
      name: employee.name,
      attendance,
      overtime,
      summary: {
        presentDays: summary.presentDays,
        fridays: summary.fridays,
        OFF: summary.counts.OFF,
        MC: summary.counts.MC,
        EL: summary.counts.EL,
        AL: summary.counts.AL,
        SUS: summary.counts.SUS,
        FL: summary.counts.FL,
        SICK: summary.counts.SICK,
        HD: summary.counts.HD,
        AB: summary.counts.AB,
        NL: summary.counts.NL,
        SP: summary.counts.SP,
        remarks: "",
      },
    };
  }

  // Export to Excel
  async function handleDownloadExcel() {
    if (!selectedEmployee) return;

    const staff = mapToExportFormat(selectedEmployee);
    const month = new Date(startDate).getMonth();
    const year = new Date(startDate).getFullYear();
    const otRange = { startDate: otStartDate, endDate: otEndDate };

    await exportMonthlyAttendanceExcel({
      month,
      year,
      seniorStaff: staff.userId ? [staff] : [],
      juniorStaff: [],
      overtimeData: staff.overtime,
      otRange,
      foodAllowance,
    });
  }

  function printReport() {
    window.print();
  }

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const summary = selectedEmployee ? getEmployeeSummary(selectedEmployee) : null;

  const monthName = new Date(startDate).toLocaleString("en-US", { month: "long" });
  const year = new Date(startDate).getFullYear();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="excel-report">
      <div className="report-controls no-print">
        <div>
          <h2>Staff Attendance Report</h2>
          <p>Single employee attendance report with custom date range</p>
        </div>

        <div className="report-actions">
          <input
            type="text"
            placeholder="Search employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedEmployeeId}
            onChange={(e) => {
              setSelectedEmployeeId(e.target.value);
              const emp = employees.find((emp) => emp.id === e.target.value);
              setSelectedEmployeeUserId(emp?.userId || "");
            }}
          >
            <option value="">Select Employee</option>
            {employees
              .filter((emp) =>
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.userId.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.userId})
                </option>
              ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button onClick={printReport}>
            <Printer size={18} />
            Print / Save PDF
          </button>

          <button onClick={handleDownloadExcel} disabled={!selectedEmployee || dates.length === 0}>
            <Download size={18} />
            Download Excel
          </button>
        </div>
      </div>

      {/* Overtime Date Selection */}
      <div className="report-controls no-print" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <div>
          <h2>Overtime Data</h2>
          <p>Biometric overtime data (separate date range)</p>
        </div>

        <div className="report-actions">
          <input
            type="date"
            value={otStartDate}
            onChange={(e) => setOtStartDate(e.target.value)}
          />

          <input
            type="date"
            value={otEndDate}
            onChange={(e) => setOtEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Food Allowance Date Selection */}
      <div className="report-controls no-print" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <div>
          <h2>Food Allowance</h2>
          <p>Select date range to calculate food allowance based on attendance (50 MVR per day worked)</p>
        </div>

        <div className="report-actions">
          <input
            type="date"
            value={faStartDate}
            onChange={(e) => setFaStartDate(e.target.value)}
          />

          <input
            type="date"
            value={faEndDate}
            onChange={(e) => setFaEndDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="no-print">Loading...</p>}

      {!loading && selectedEmployee && dates.length > 0 && (
        <div className="excel-preview">
          <section className="excel-section">
            <h2 className="excel-title">
              ATTENDANCE FOR {monthName.toUpperCase()} {year}
              {" - "}{selectedEmployee.name}
            </h2>

            <table className="excel-table">
              <thead>
                <tr className="weekday-row">
                  <th colSpan={3}>{selectedEmployee.name}</th>

                  {dates.map((date) => (
                    <th
                      colSpan={2}
                      key={date.date}
                      className={date.weekday === "Fri" ? "friday" : ""}
                    >
                      {date.weekday}
                    </th>
                  ))}

                  <th colSpan={2}>Attendance Summary</th>
                  <th colSpan={STATUS_CODES.length + 1}>Status Summary</th>
                </tr>

                <tr className="date-row">
                  <th rowSpan={2}>S NO</th>
                  <th rowSpan={2}>User ID</th>
                  <th rowSpan={2}>Name</th>

                  {dates.map((date) => (
                    <th colSpan={2} key={date.date}>
                      {pad(date.day)}
                      <br />
                      {pad(new Date(date.date).getMonth() + 1)}-{year}
                    </th>
                  ))}

                  <th rowSpan={2}>Present Days</th>
                  <th rowSpan={2}>Fridays</th>

                  {STATUS_CODES.map((code) => (
                    <th rowSpan={2} key={code}>{code}</th>
                  ))}

                  <th rowSpan={2}>Remarks</th>
                </tr>

                <tr className="inout-row">
                  {dates.map((date) => (
                    <React.Fragment key={date.date}>
                      <th>IN</th>
                      <th>OUT</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr key={selectedEmployee.id}>
                  <td>1</td>
                  <td>{selectedEmployee.userId}</td>
                  <td className="name-cell">{selectedEmployee.name}</td>

                  {dates.map((date) => {
                    const inValue = getDailyValue(selectedEmployee.userId, date.date, "IN");
                    const outValue = getDailyValue(selectedEmployee.userId, date.date, "OUT");

                    return (
                      <React.Fragment key={date.date}>
                        <td className={isStatus(inValue) ? "status-cell" : ""}>
                          {inValue}
                        </td>
                        <td>{outValue}</td>
                      </React.Fragment>
                    );
                  })}

                  <td className="summary-cell">
                    {summary?.presentDays}
                  </td>
                  <td className="summary-cell">
                    {summary?.fridays}
                  </td>

                  {STATUS_CODES.map((code) => (
                    <td key={code} className="summary-cell">
                      {summary?.counts[code]}
                    </td>
                  ))}

                  <td className="remarks-cell">
                    {dates.map((date) => {
                      const record = getRecord(selectedEmployee.userId, date.date);
                      return record?.remarks
                        ? `${date.day}: ${record.remarks}; `
                        : "";
                    }).join("")}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="status-legend">
              <strong>Attendance Status Legend</strong>
              <div>
                {[
                  ["OFF", "Off Day"],
                  ["MC", "Medical Certificate"],
                  ["EL", "Emergency Leave"],
                  ["AL", "Annual Leave"],
                  ["SUS", "Suspended"],
                  ["FL", "Family Leave"],
                  ["SICK", "Sick Leave"],
                  ["HD", "Half Day"],
                  ["AB", "Absent"],
                  ["NL", "No Pay Leave"],
                  ["SP", "Special Leave"],
                ].map(([code, label]) => (
                  <span key={code}>
                    {label} — <b>{code}</b>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Overtime Section */}
          {otDates.length > 0 && (
            <section className="excel-section" style={{ marginTop: '40px' }}>
              <h2 className="excel-title">
                OVERTIME DATA - {selectedEmployee.name}
              </h2>

              <table className="excel-table">
                <thead>
                  <tr className="weekday-row">
                    <th colSpan={3}>{selectedEmployee.name}</th>
                    {otDates.map((date) => (
                      <th
                        key={date.date}
                        className={date.weekday === "Fri" ? "friday" : ""}
                      >
                        {date.weekday}
                      </th>
                    ))}
                  </tr>
                  <tr className="date-row">
                    <th colSpan={3}></th>
                    {otDates.map((date) => {
                      const d = new Date(date.date);
                      const dateLabel = `${String(date.day).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                      return (
                        <th key={date.date}>
                          {dateLabel}
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="inout-row">
                    <th colSpan={3}></th>
                    {otDates.map((date) => (
                      <th key={date.date}>OT Hrs</th>
                    ))}
                    <th>Total Hrs</th>
                    <th>Rate</th>
                    <th>Total (MVR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3}>Overtime</td>
                    {otDates.map((date) => {
                      const otRecord = overtimeMap.get(date.date);
                      const otHours = otRecord?.overtimeHours?.toFixed(2) || '';

                      return (
                        <td key={date.date}>{otHours}</td>
                      );
                    })}
                    <td>{overtimeData.reduce((sum, ot) => sum + (ot.overtimeHours || 0), 0).toFixed(2)}</td>
                    <td>10</td>
                    <td>{(overtimeData.reduce((sum, ot) => sum + (ot.overtimeHours || 0), 0) * 10).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Food Allowance Section */}
          {faStartDate && faEndDate && (
            <section className="excel-section" style={{ marginTop: '40px' }}>
              <h2 className="excel-title">
                FOOD ALLOWANCE - {selectedEmployee.name}
              </h2>

              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Days Worked</th>
                    <th>Rate (MVR/day)</th>
                    <th>Allowance (MVR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1st - 15th</td>
                    <td>{Math.round(foodAllowance.firstHalf / 50)}</td>
                    <td>50</td>
                    <td>{foodAllowance.firstHalf}</td>
                  </tr>
                  <tr>
                    <td>16th - End of Month</td>
                    <td>{Math.round(foodAllowance.secondHalf / 50)}</td>
                    <td>50</td>
                    <td>{foodAllowance.secondHalf}</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td>Total</td>
                    <td>{Math.round(foodAllowance.total / 50)}</td>
                    <td>-</td>
                    <td>{foodAllowance.total}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          <div className="approval-section">
            <div>
              <strong>Prepared By:</strong>
              <p>Lila Ibrahim</p>
              <span>HR Executive</span>
            </div>

            <div>
              <strong>Checked By:</strong>
              <p>Hussain Mahir</p>
              <span>Office Manager</span>
            </div>

            <div>
              <strong>Approved By:</strong>
              <p>Moosa Ahmed</p>
              <span>Chairman</span>
            </div>
          </div>
        </div>
      )}

      {!loading && !selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select an employee to view attendance report</p>
        </div>
      )}
    </div>
  );
}
