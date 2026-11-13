import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
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
};

type Attendance = {
  employeeId: string;
  date: string;
  inTime: string;
  outTime: string;
  status: string;
  remarks: string;
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
    // Supports YYYY-MM-DD and ISO date strings
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

function classifyStaff(value: string): "senior" | "junior" | null {
  if (!value) return null;
  const v = value.toLowerCase();

  if (v.includes("senior")) return "senior";
  if (v.includes("junior")) return "junior";

  return null;
}

function isStatus(value: string): value is StatusCode {
  return STATUS_CODES.includes(value.toUpperCase() as StatusCode);
}

export default function MonthlyAttendanceExcel() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dateRange, setDateRange] = useState<'full' | 'first-half' | 'second-half'>('full');
  const [areaFilter, setAreaFilter] = useState<'all' | 'male-junior' | 'hulhumale-junior' | 'male-senior' | 'hulhumale-senior' | 'local'>('all');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FIRESTORE LIVE DATA
  useEffect(() => {
    let employeeLoaded = false;
    let attendanceLoaded = false;

    const employeeUnsubscribe = onSnapshot(
      collection(db, "employees"),
      (snapshot) => {
        setEmployees(
          snapshot.docs.map((doc) => {
            const d = doc.data();

            return {
              id: doc.id,
              userId: String(
                d.userId || d.employeeId || d.empId || d.staffId || ""
              ),
              name: String(
                d.name || d.fullName || d.employeeName || ""
              ),
              staffType: String(
                d.staffType || d.employeeType || d.category || d.designation || d.position || d.jobTitle || ""
              ),
              workSite: String(
                d.workSite || ""
              ),
              jobLevel: String(
                d.jobLevel || ""
              ),
              country: String(
                d.country || ""
              ),
            };
          })
        );

        employeeLoaded = true;
        if (attendanceLoaded) setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    const attendanceUnsubscribe = onSnapshot(
      collection(db, "attendance"),
      (snapshot) => {
        setAttendance(
          snapshot.docs.map((doc) => {
            const d = doc.data();

            return {
              employeeId: String(
                d.employeeId || d.userId || d.empId || d.staffId || ""
              ),
              date: getDate(
                d.date || d.attendanceDate || d.createdAt
              ),
              inTime: getTime(
                d.inTime || d.checkIn || d.clockIn || d.IN || d.checkInTime
              ),
              outTime: getTime(
                d.outTime || d.checkOut || d.clockOut || d.OUT || d.checkOutTime
              ),
              status: String(
                d.status || d.attendanceStatus || d.leaveType || ""
              ).toUpperCase(),
              remarks: String(d.remarks || d.remark || ""),
            };
          })
        );

        attendanceLoaded = true;
        if (employeeLoaded) setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      employeeUnsubscribe();
      attendanceUnsubscribe();
    };
  }, []);

  // SELECTED MONTH DATES
  const days = new Date(year, month, 0).getDate();

  const dates = useMemo(() => {
    let startDay = 1;
    let endDay = days;

    if (dateRange === 'first-half') {
      endDay = 15;
    } else if (dateRange === 'second-half') {
      startDay = 16;
    }

    return Array.from({ length: endDay - startDay + 1 }, (_, index) => {
      const day = startDay + index;
      const date = new Date(year, month - 1, day);

      return {
        day,
        date: `${year}-${pad(month)}-${pad(day)}`,
        weekday: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
      };
    });
  }, [year, month, days, dateRange]);

  // ATTENDANCE INDEX
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();

    attendance.forEach((item) => {
      map.set(`${item.employeeId}_${item.date}`, item);
    });

    return map;
  }, [attendance]);

  // EMPLOYEE ATTENDANCE SUMMARY
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
      const record = attendanceMap.get(
        `${employee.userId}_${date.date}` 
      );

      if (!record) return;

      if (isStatus(record.status)) {
        counts[record.status]++;

        // Only a recorded clock-in/out counts as present.
        // Status-only days are not counted as present.
        if (record.inTime || record.outTime) {
          presentDays++;
          if (date.weekday === "Fri") fridays++;
        }
      } else if (record.inTime || record.outTime) {
        presentDays++;

        if (date.weekday === "Fri") {
          fridays++;
        }
      }
    });

    return { presentDays, fridays, counts };
  }

  // Filter employees based on area selection
  const filteredEmployees = useMemo(() => {
    if (areaFilter === 'all') {
      return employees;
    }

    return employees.filter((e) => {
      const jobLevel = e.jobLevel?.toLowerCase() || '';
      const workSite = e.workSite?.toLowerCase() || '';
      const country = e.country?.toLowerCase() || '';

      switch (areaFilter) {
        case 'male-junior':
          return workSite.includes('male') && jobLevel.includes('junior');
        case 'hulhumale-junior':
          return workSite.includes('hulhumale') && jobLevel.includes('junior');
        case 'male-senior':
          return workSite.includes('male') && jobLevel.includes('senior');
        case 'hulhumale-senior':
          return workSite.includes('hulhumale') && jobLevel.includes('senior');
        case 'local':
          return country.includes('maldives') || country.includes('mv');
        default:
          return true;
      }
    });
  }, [employees, areaFilter]);

  // Group filtered employees by senior/junior for display
  const seniorEmployees = filteredEmployees.filter(
    (e) => classifyStaff(e.staffType) === "senior" || e.jobLevel?.toLowerCase().includes('senior')
  );

  const juniorEmployees = filteredEmployees.filter(
    (e) => classifyStaff(e.staffType) === "junior" || e.jobLevel?.toLowerCase().includes('junior')
  );

  const otherEmployeesFiltered = filteredEmployees.filter(
    (e) => !classifyStaff(e.staffType) && !e.jobLevel?.toLowerCase().includes('senior') && !e.jobLevel?.toLowerCase().includes('junior')
  );

  const monthName = new Date(year, month - 1).toLocaleString(
    "en-US",
    { month: "long" }
  );

  function getRecord(employee: Employee, date: string) {
    return attendanceMap.get(`${employee.userId}_${date}`);
  }

  function getDailyValue(
    employee: Employee,
    date: string,
    type: "IN" | "OUT"
  ) {
    const record = getRecord(employee, date);
    if (!record) return "";

    // Status appears in the IN column.
    if (type === "IN" && isStatus(record.status)) {
      return record.status;
    }

    if (type === "IN") return record.inTime;
    return record.outTime;
  }

  function printReport() {
    window.print();
  }

  function renderSection(
    title: string,
    list: Employee[],
    startingNumber: number
  ) {
    return (
      <section className="excel-section">
        <h2 className="excel-title">
          ATTENDANCE FOR {monthName.toUpperCase()} {year}
          {" - "}{title}
        </h2>

        <table className="excel-table">
          <thead>
            <tr className="weekday-row">
              <th colSpan={3}>{title}</th>

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
                  {pad(month)}-{year}
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
            {list.map((employee, index) => {
              const summary = getEmployeeSummary(employee);

              return (
                <tr key={employee.id}>
                  <td>{startingNumber + index}</td>
                  <td>{employee.userId}</td>
                  <td className="name-cell">{employee.name}</td>

                  {dates.map((date) => {
                    const inValue = getDailyValue(
                      employee, date.date, "IN"
                    );
                    const outValue = getDailyValue(
                      employee, date.date, "OUT"
                    );

                    return (
                      <React.Fragment key={date.date}>
                        <td className={
                          isStatus(inValue) ? "status-cell" : ""
                        }>
                          {inValue}
                        </td>
                        <td>{outValue}</td>
                      </React.Fragment>
                    );
                  })}

                  <td className="summary-cell">
                    {summary.presentDays}
                  </td>
                  <td className="summary-cell">
                    {summary.fridays}
                  </td>

                  {STATUS_CODES.map((code) => (
                    <td key={code} className="summary-cell">
                      {summary.counts[code]}
                    </td>
                  ))}

                  <td className="remarks-cell">
                    {dates.map((date) => {
                      const record = getRecord(employee, date.date);
                      return record?.remarks
                        ? `${date.day}: ${record.remarks}; ` 
                        : "";
                    }).join("")}
                  </td>
                </tr>
              );
            })}

            {list.length === 0 && (
              <tr>
                <td colSpan={3 + days * 2 + 2 + STATUS_CODES.length + 1}>
                  No employees found in this staff category.
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
    );
  }

  return (
    <div className="excel-report">
      <div className="report-controls no-print">
        <div>
          <h2>Monthly Attendance Excel Report</h2>
          <p>Foreign senior and junior staff attendance</p>
        </div>

        <div className="report-actions">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option value={i + 1} key={i}>
                {new Date(2000, i).toLocaleString("en-US", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'full' | 'first-half' | 'second-half')}
          >
            <option value="full">Full Month</option>
            <option value="first-half">1 - 15</option>
            <option value="second-half">16 - End</option>
          </select>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as 'all' | 'male-junior' | 'hulhumale-junior' | 'male-senior' | 'hulhumale-senior' | 'local')}
          >
            <option value="all">All Areas</option>
            <option value="male-junior">Male Junior</option>
            <option value="hulhumale-junior">Hulhumale Junior</option>
            <option value="male-senior">Male Senior</option>
            <option value="hulhumale-senior">Hulhumale Senior</option>
            <option value="local">Local (Maldives)</option>
          </select>

          <button onClick={printReport}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {loading && <p className="no-print">Loading Firestore records...</p>}
      {error && <p className="no-print error">{error}</p>}

      {!loading && !error && (
        <div className="no-print">
          <p>
            Senior foreign staff: {seniorEmployees.length}
            {" | "}
            Junior foreign staff: {juniorEmployees.length}
            {" | "}
            Other staff: {otherEmployeesFiltered.length}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="excel-preview">
          {renderSection(
            "MALE SENIOR FOREIGN STAFFS",
            seniorEmployees,
            1
          )}

          {renderSection(
            "MALE JUNIOR FOREIGN STAFFS",
            juniorEmployees,
            seniorEmployees.length + 1
          )}

          {renderSection(
            "OTHER STAFF",
            otherEmployeesFiltered,
            seniorEmployees.length + juniorEmployees.length + 1
          )}
        </div>
      )}
    </div>
  );
}
