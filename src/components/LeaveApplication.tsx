import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDate } from "../lib/dateUtils";

import "./LeaveApplication.css";

type Employee = {
  id: string;
  name: string;
  staffId: string;
  dateOfJoin: string;
  department: string;
  designation: string;
  phone: string;
};

type LeaveData = {
  firstDay: string;
  lastDay: string;
  returnDate: string;
  reason: string;
  lastLeaveDate: string;
  handingOverName: string;
  handingOverDesignation: string;
  companyHolidays: string;
  leaveType: string;
  otherLeave: string;
  sickReason: string;
  annualBroughtForward: string;
  annualAccrued: string;
  sickLeaves: string;
  absents: string;
  adminName: string;
  adminSignature: string;
  hodName: string;
  gmName: string;
  approvalComment: string;
  approvalStatus: string;
  approvedFirstDay: string;
  approvedLastDay: string;
  approvedReturnDate: string;
  approvedLeaveDays: string;
  approvedLeaveType: string;
  authorizedName: string;
  authorizedDesignation: string;
};

const emptyLeave: LeaveData = {
  firstDay: "",
  lastDay: "",
  returnDate: "",
  reason: "",
  lastLeaveDate: "",
  handingOverName: "",
  handingOverDesignation: "",
  companyHolidays: "0",
  leaveType: "Annual Leave",
  otherLeave: "",
  sickReason: "",
  annualBroughtForward: "0",
  annualAccrued: "0",
  sickLeaves: "0",
  absents: "0",
  adminName: "",
  adminSignature: "",
  hodName: "",
  gmName: "",
  approvalComment: "",
  approvalStatus: "Pending",
  approvedFirstDay: "",
  approvedLastDay: "",
  approvedReturnDate: "",
  approvedLeaveDays: "",
  approvedLeaveType: "",
  authorizedName: "",
  authorizedDesignation: "",
};

const getString = (...values: unknown[]): string => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object" && "toDate" in value) {
        return (value as { toDate: () => Date })
          .toDate().toISOString().slice(0, 10);
      }
      return String(value);
    }
  }
  return "";
};

const formatLeaveDate = (value: string) => {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  return formatDate(d);
};

const countDays = (
  first: string,
  last: string,
  holidays: number
) => {
  if (!first || !last) return 0;

  const start = new Date(first + "T00:00:00");
  const end = new Date(last + "T00:00:00");

  if (end < start) return 0;

  const diff =
    Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

  return Math.max(0, diff - Math.max(0, holidays));
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <label className="leave-field">
    <span>{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

export default function LeaveApplication() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leave, setLeave] = useState<LeaveData>(emptyLeave);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const formNo = `LV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

  // Fetch employee records from Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        // Change "employees" if your existing collection has another name.
        const snapshot = await getDocs(collection(db, "employees"));

        const list: Employee[] = snapshot.docs.map((doc) => {
          const d = doc.data();

          return {
            id: doc.id,
            name: getString(
              d.name,
              d.fullName,
              d.employeeName,
              d.staffName
            ),
            staffId: getString(
              d.employeeId,
              d.staffId,
              d.empId,
              d.employeeCode
            ),
            dateOfJoin: getString(
              d.dateOfJoin,
              d.joiningDate,
              d.dateJoined
            ),
            department: getString(
              d.department,
              d.departmentName
            ),
            designation: getString(
              d.designation,
              d.position,
              d.jobTitle
            ),
            phone: getString(
              d.phone,
              d.contactNo,
              d.mobile,
              d.phoneNumber
            ),
          };
        });

        setEmployees(list.filter((e) => e.staffId || e.name));
      } catch (error) {
        console.error("Employee fetch error:", error);
        alert("Unable to fetch employees. Check Firebase connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Select employee and fill details
  const handleStaffChange = (staffId: string) => {
    setSelectedStaff(staffId);

    const found = employees.find((e) => e.staffId === staffId);

    setEmployee(found || null);
  };

  const update = (key: keyof LeaveData, value: string) => {
    setLeave((prev) => ({ ...prev, [key]: value }));
  };

  const holidayCount = Number(leave.companyHolidays) || 0;

  const requestedDays = useMemo(
    () => countDays(leave.firstDay, leave.lastDay, holidayCount),
    [leave.firstDay, leave.lastDay, holidayCount]
  );

  const annualAvailable =
    (Number(leave.annualBroughtForward) || 0) +
    (Number(leave.annualAccrued) || 0);

  const annualCarryForward =
    annualAvailable -
    (leave.leaveType === "Annual Leave" ? requestedDays : 0);

  const totalSickAndAbsent =
    (Number(leave.sickLeaves) || 0) +
    (Number(leave.absents) || 0);

  const updateApproved = () => {
    setLeave((prev) => ({
      ...prev,
      approvedFirstDay: prev.firstDay,
      approvedLastDay: prev.lastDay,
      approvedReturnDate: prev.returnDate,
      approvedLeaveDays: String(requestedDays),
      approvedLeaveType: prev.leaveType,
    }));
  };

  const printForm = () => {
    window.print();
  };

  const date = (value: string) => formatLeaveDate(value) || "____________";

  return (
    <div className="leave-app">

      <div className="leave-toolbar">
        <div>
          <h2>Leave Application Form</h2>
          <p>Madihaa HR Management System</p>
        </div>

        <div className="leave-toolbar-actions">
          <button
            className="leave-secondary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Hide Form" : "Edit Details"}
          </button>

          <button className="leave-primary" onClick={printForm}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="leave-layout">

        {showForm && (
          <aside className="leave-editor">

            <h3>1. Select Employee</h3>

            <label className="leave-field">
              <span>Staff ID / Employee</span>
              <select
                value={selectedStaff}
                onChange={(e) => handleStaffChange(e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.staffId}>
                    {e.staffId} - {e.name}
                  </option>
                ))}
              </select>
            </label>

            {loading && <p>Loading employees...</p>}

            <h3>2. Leave Details</h3>

            <Field
              label="First Day of Leave"
              type="date"
              value={leave.firstDay}
              onChange={(v) => update("firstDay", v)}
            />

            <Field
              label="Last Day of Leave"
              type="date"
              value={leave.lastDay}
              onChange={(v) => update("lastDay", v)}
            />

            <Field
              label="Return to Work"
              type="date"
              value={leave.returnDate}
              onChange={(v) => update("returnDate", v)}
            />

            <Field
              label="Company Holidays During Leave"
              type="number"
              value={leave.companyHolidays}
              onChange={(v) => update("companyHolidays", v)}
            />

            <label className="leave-field">
              <span>Leave Type</span>
              <select
                value={leave.leaveType}
                onChange={(e) => update("leaveType", e.target.value)}
              >
                <option>Annual Leave</option>
                <option>Sick Leave</option>
                <option>Parental Leave</option>
                <option>Emergency Leave</option>
                <option>Unpaid Leave of Absence</option>
                <option>Other Leave</option>
              </select>
            </label>

            {leave.leaveType === "Other Leave" && (
              <Field
                label="Specify Other Leave"
                value={leave.otherLeave}
                onChange={(v) => update("otherLeave", v)}
              />
            )}

            <Field
              label="Reason for Leave"
              value={leave.reason}
              onChange={(v) => update("reason", v)}
            />

            <Field
              label="Last Date of Previous Leave"
              type="date"
              value={leave.lastLeaveDate}
              onChange={(v) => update("lastLeaveDate", v)}
            />

            <h3>3. Employee Handing Over</h3>

            <Field
              label="Employee Name"
              value={leave.handingOverName}
              onChange={(v) => update("handingOverName", v)}
            />

            <Field
              label="Designation"
              value={leave.handingOverDesignation}
              onChange={(v) => update("handingOverDesignation", v)}
            />

            <Field
              label="Sick Leave Reason"
              value={leave.sickReason}
              onChange={(v) => update("sickReason", v)}
            />

            <h3>4. Annual Leave Record</h3>

            <Field
              label="Annual Leave Brought Forward (a)"
              type="number"
              value={leave.annualBroughtForward}
              onChange={(v) => update("annualBroughtForward", v)}
            />

            <Field
              label="Annual Leave Accrued (b)"
              type="number"
              value={leave.annualAccrued}
              onChange={(v) => update("annualAccrued", v)}
            />

            <Field
              label="Sick Leaves Taken (f)"
              type="number"
              value={leave.sickLeaves}
              onChange={(v) => update("sickLeaves", v)}
            />

            <Field
              label="Number of Absents (g)"
              type="number"
              value={leave.absents}
              onChange={(v) => update("absents", v)}
            />

            <h3>5. Approval Details</h3>

            <Field
              label="Head of Department"
              value={leave.hodName}
              onChange={(v) => update("hodName", v)}
            />

            <Field
              label="General Manager"
              value={leave.gmName}
              onChange={(v) => update("gmName", v)}
            />

            <Field
              label="Recorded by Admin"
              value={leave.adminName}
              onChange={(v) => update("adminName", v)}
            />

            <Field
              label="Authorized Person"
              value={leave.authorizedName}
              onChange={(v) => update("authorizedName", v)}
            />

            <Field
              label="Authorized Designation"
              value={leave.authorizedDesignation}
              onChange={(v) => update("authorizedDesignation", v)}
            />

            <Field
              label="Approval Comment"
              value={leave.approvalComment}
              onChange={(v) => update("approvalComment", v)}
            />

            <label className="leave-field">
              <span>Approval Status</span>
              <select
                value={leave.approvalStatus}
                onChange={(e) => update("approvalStatus", e.target.value)}
              >
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </label>

            <button
              className="leave-secondary"
              onClick={updateApproved}
            >
              Copy Requested Dates to Approval Chit
            </button>

          </aside>
        )}

        <main className="leave-preview-area">
          <div className="leave-preview-heading">
            <strong>A4 Leave Application Preview</strong>
            <span>One page · A4 Portrait</span>
          </div>

          <article className="leave-paper">

            {/* LETTERHEAD */}
            <header className="leave-letterhead">
              <img src="/Madihaa 2026 (1).png" alt="Madihaa" />
              <div>
                <h1>MADIHAA COMPANY (PTE) LTD</h1>
                <p>M. Madihaa, Shaheed Ali Hingun, Malé, Republic of Maldives</p>
                <p>Tel: +960 332 8827 | Fax: 331 3936 | Email: admin@madihaa.mv | Web: www.madihaaa.com</p>
              </div>
            </header>

            <div className="leave-line" />

            <div className="leave-heading">
              <h2>LEAVE APPLICATION FORM</h2>
              <p>Please submit this completed form 15 days prior to leave being taken</p>
            </div>

            <div className="leave-form-number">
              Form No: {formNo}
            </div>

            {/* EMPLOYEE INFORMATION */}
            <table className="leave-table">
              <tbody>
                <tr>
                  <th>Full Name / ފުރިހަމަ ނަން</th>
                  <td>{employee?.name || ""}</td>
                  <th>Staff ID / ސްޓާފް އައިޑީ</th>
                  <td>{employee?.staffId || ""}</td>
                  <th>Date of Join / ވަޒީފާ ފެށި ތާރީޚް</th>
                  <td>{date(employee?.dateOfJoin || "")}</td>
                </tr>
                <tr>
                  <th>Department / ޑިޕާޓްމަންޓް</th>
                  <td>{employee?.department || ""}</td>
                  <th>Designation / މަޤާމު</th>
                  <td>{employee?.designation || ""}</td>
                  <th>Tel No.</th>
                  <td>{employee?.phone || ""}</td>
                </tr>
              </tbody>
            </table>

            <p className="leave-instruction">Please fill in dd/mm/yy</p>

            {/* LEAVE DATES */}
            <table className="leave-table">
              <tbody>
                <tr>
                  <th>First Day of Leave</th>
                  <td>{date(leave.firstDay)}</td>
                  <th>Last Day of Leave</th>
                  <td>{date(leave.lastDay)}</td>
                  <th>Return to Work</th>
                  <td>{date(leave.returnDate)}</td>
                  <th>No. of Days</th>
                  <td className="leave-number">{requestedDays}</td>
                </tr>
                <tr>
                  <th>Reason for Leave</th>
                  <td colSpan={3}>{leave.reason}</td>
                  <th>Last Date of Previous Leave</th>
                  <td colSpan={3}>{date(leave.lastLeaveDate)}</td>
                </tr>
                <tr>
                  <th>Employee Handing Over</th>
                  <td colSpan={2}>{leave.handingOverName}</td>
                  <th>Designation</th>
                  <td colSpan={2}>{leave.handingOverDesignation}</td>
                  <th>Signature</th>
                  <td />
                </tr>
                <tr>
                  <th>Company Holidays During Period</th>
                  <td>{leave.companyHolidays}</td>
                  <th>Total Days as Leave</th>
                  <td colSpan={5}>{requestedDays}</td>
                </tr>
              </tbody>
            </table>

            {/* LEAVE TYPE */}
            <div className="leave-type-heading">PLEASE TICK</div>

            <table className="leave-table leave-types">
              <tbody>
                {[
                  ["Annual Leave", "Parental Leave"],
                  ["Sick Leave", "Emergency Leave"],
                  ["Unpaid Leave of Absence", "Other Leave"],
                ].map((pair) => (
                  <tr key={pair[0]}>
                    {pair.map((type) => (
                      <React.Fragment key={type}>
                        <th>{type}</th>
                        <td className="tick-cell">
                          {leave.leaveType === type ||
                          (type === "Other Leave" && leave.leaveType === "Other Leave")
                            ? "✓"
                            : ""}
                          {type === "Other Leave" && leave.otherLeave
                            ? ` ${leave.otherLeave}`
                            : ""}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="leave-sick-reason">
              For Sick Leave, please state reason (Attach Medical Certificate):
              <span>{leave.sickReason}</span>
            </div>

            <div className="leave-declaration">
              The above dates are my required dates. If I get delayed in reporting
              to work after completion of leave, I understand that the company
              reserves the right to deduct salaries and take required actions.
            </div>

            <div className="leave-dhivehi">
              މަތީގައި ބަޔާންކުރެވިފައިވާ ތާރީޚްތަކަކީ އަޅުގަނޑު އެދޭ އަދި
              އެއްބަސްވާ ތާރީޚްތަކެވެ. ޗުއްޓީ ނިމިގެން ވަޒީފާއަށް ހާޒިރުވުމަށް
              ލަސްވާނަމަ، މުސާރައިން އުނިކުރުމާއި އިތުރު ފިޔަވަޅުތައް އެޅުމުގެ
              އިޚްތިޔާރު ކުންފުންޏަށް ލިބިގެންވާކަން އެއްބަސްވަމެވެ.
            </div>

            {/* SIGNATURES */}
            <table className="leave-table leave-signatures">
              <tbody>
                <tr>
                  <th>Applicant's Signature</th>
                  <th>Head of Department</th>
                  <th>General Manager</th>
                </tr>
                <tr>
                  <td>
                    Name: {employee?.name || ""}
                    <br />Date: _______________
                  </td>
                  <td>
                    Name: {leave.hodName}
                    <br />Date: _______________
                  </td>
                  <td>
                    Name: {leave.gmName}
                    <br />Date: _______________
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ANNUAL LEAVE RECORD */}
            <h3 className="annual-heading">ANNUAL LEAVE RECORD</h3>

            <table className="leave-table annual-table">
              <tbody>
                <tr>
                  <th>Leave Details</th>
                  <th>Days</th>
                  <th>Recorded by Admin Department</th>
                </tr>
                <tr>
                  <td>(a) Annual Leave brought forward</td>
                  <td>{leave.annualBroughtForward}</td>
                  <td rowSpan={5}>
                    Name: {leave.adminName}
                    <br /><br />
                    Signature: {leave.adminSignature}
                    <br /><br />
                    Date: _______________
                  </td>
                </tr>
                <tr>
                  <td>(b) Annual Leave accrued to date</td>
                  <td>{leave.annualAccrued}</td>
                </tr>
                <tr>
                  <td>(c) Total Annual Leave Available (a) + (b)</td>
                  <td>{annualAvailable}</td>
                </tr>
                <tr>
                  <td>(d) Less Annual Leave to be taken</td>
                  <td>
                    {leave.leaveType === "Annual Leave" ? requestedDays : 0}
                  </td>
                </tr>
                <tr>
                  <td>(e) Annual Leave carry forward (c) - (d)</td>
                  <td>{annualCarryForward}</td>
                </tr>
                <tr>
                  <td>(f) Sick Leaves taken</td>
                  <td>{leave.sickLeaves}</td>
                  <td rowSpan={2}>
                    Total Sick Leave and Absents:
                    <strong>{totalSickAndAbsent} days</strong>
                  </td>
                </tr>
                <tr>
                  <td>(g) Number of Absents</td>
                  <td>{leave.absents}</td>
                </tr>
              </tbody>
            </table>

            {/* DETACHABLE APPROVAL CHIT */}
            <div className="leave-cut-line">
              ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            </div>

            <h3 className="approval-title">
              Madihaa Company Pvt Ltd - Leave Approval Chit
              <small>(This part to be returned to the Staff)</small>
            </h3>

            <table className="leave-table approval-table">
              <tbody>
                <tr>
                  <th>Name</th>
                  <td>{employee?.name || ""}</td>
                  <th>Staff ID</th>
                  <td>{employee?.staffId || ""}</td>
                  <th>Authorized by Madihaa Company Pvt Ltd</th>
                </tr>
                <tr>
                  <th>First day of leave</th>
                  <td colSpan={3}>{date(leave.approvedFirstDay || leave.firstDay)}</td>
                  <td rowSpan={5}>
                    Name: {leave.authorizedName}
                    <br /><br />
                    Designation: {leave.authorizedDesignation}
                    <br /><br />
                    Signature: _______________
                  </td>
                </tr>
                <tr>
                  <th>Last day of leave</th>
                  <td colSpan={3}>{date(leave.approvedLastDay || leave.lastDay)}</td>
                </tr>
                <tr>
                  <th>Return to work on</th>
                  <td colSpan={3}>{date(leave.approvedReturnDate || leave.returnDate)}</td>
                </tr>
                <tr>
                  <th>No. of Leave Days</th>
                  <td colSpan={3}>{leave.approvedLeaveDays || requestedDays}</td>
                </tr>
                <tr>
                  <th>Type of Leave</th>
                  <td colSpan={3}>{leave.approvedLeaveType || leave.leaveType}</td>
                </tr>
                <tr>
                  <th>Comment</th>
                  <td colSpan={4}>{leave.approvalComment}</td>
                </tr>
              </tbody>
            </table>

            <div className="leave-warning">
              If late to return after leave, salaries will be deducted.
              Further delays will result in more disciplinary actions.
            </div>

            <div className="leave-print-footer">
              Madihaa Company Pvt Ltd | Leave Application Form | {formNo}
            </div>

          </article>
        </main>
      </div>
    </div>
  );
}
