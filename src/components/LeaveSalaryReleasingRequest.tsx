import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDate } from "../lib/dateUtils";

type Employee = {
  id: string;
  staffId: string;
  name: string;
  occupation: string;
  site: string;
};

type RequestData = {
  startDate: string;
  returnedDate: string;
  noOfDays: string;
  remarks: string;
  preparedBy: string;
  checkedBy: string;
  approvedBy: string;
};

const initialRequest: RequestData = {
  startDate: "",
  returnedDate: "",
  noOfDays: "",
  remarks: "",
  preparedBy: "Lila Ibrahim",
  checkedBy: "Hussain Mahir",
  approvedBy: "Moosa Ahmed",
};

const readText = (...values: unknown[]): string => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object" && value && "toDate" in value) {
        return (value as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
      }
      return String(value);
    }
  }
  return "";
};

const displayDate = (value: string) => {
  if (!value) return "________________";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : formatDate(date);
};

const calculateDays = (start: string, end: string) => {
  if (!start || !end) return "";
  const first = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || last < first) return "";
  return String(Math.floor((last.getTime() - first.getTime()) / 86400000) + 1);
};

export default function LeaveSalaryRelease() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [request, setRequest] = useState<RequestData>(initialRequest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(true);
  const [requestNo] = useState(() => `LSR-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`);

  useEffect(() => {
    let active = true;
    const loadEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        // Change "employees" if your HRMS uses a different Firestore collection name.
        const snapshot = await getDocs(collection(db, "employees"));
        const rows: Employee[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            staffId: readText(data.employeeId, data.staffId, data.empId, data.employeeCode, doc.id),
            name: readText(data.name, data.fullName, data.employeeName, data.staffName),
            occupation: readText(data.occupation, data.designation, data.position, data.jobTitle),
            site: readText(data.site, data.location, data.workSite, data.branch, data.shop),
          };
        });
        if (active) setEmployees(rows.filter((row) => row.name || row.staffId));
      } catch (err) {
        console.error("Unable to load employees", err);
        if (active) setError("Could not load employees. Check the Firestore collection name and permissions.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEmployees();
    return () => { active = false; };
  }, []);

  const days = useMemo(
    () => request.noOfDays.trim() || calculateDays(request.startDate, request.returnedDate),
    [request.noOfDays, request.startDate, request.returnedDate]
  );

  const update = (key: keyof RequestData, value: string) => {
    setRequest((current) => ({ ...current, [key]: value }));
  };

  const chooseEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setEmployee(employees.find((item) => item.id === id) ?? null);
  };

  const updateDate = (key: "startDate" | "returnedDate", value: string) => {
    setRequest((current) => ({ ...current, [key]: value, noOfDays: "" }));
  };

  const print = () => window.print();

  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    type: React.HTMLInputTypeAttribute = "text"
  ) => (
    <label className="lsr-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );

  return (
    <div className="lsr-app">
      <style>{`
        .lsr-app{min-height:100vh;padding:22px;background:#f2f5f9;color:#172033;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
        .lsr-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 auto 18px;max-width:1250px}
        .lsr-toolbar h2{margin:0 0 4px;font-size:22px}.lsr-toolbar p{margin:0;color:#64748b;font-size:13px}
        .lsr-actions{display:flex;gap:8px}.lsr-btn{border:0;border-radius:7px;padding:10px 15px;font-weight:700;cursor:pointer}
        .lsr-btn-primary{background:#155fc0;color:#fff}.lsr-btn-secondary{background:#e2e8f0;color:#243247}
        .lsr-layout{max-width:1250px;margin:auto;display:grid;grid-template-columns:310px minmax(0,1fr);gap:18px;align-items:start}
        .lsr-editor{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:17px;max-height:85vh;overflow:auto}
        .lsr-editor h3{font-size:14px;margin:16px 0 10px;padding-bottom:7px;border-bottom:1px solid #e8edf3}.lsr-editor h3:first-child{margin-top:0}
        .lsr-field{display:flex;flex-direction:column;gap:5px;margin-bottom:11px}.lsr-field span{font-size:12px;font-weight:700;color:#475569}
        .lsr-field input,.lsr-field select,.lsr-field textarea{width:100%;box-sizing:border-box;border:1px solid #d8e0e9;border-radius:6px;padding:9px;font:inherit;font-size:13px;background:#fff;color:#172033}
        .lsr-field textarea{min-height:72px;resize:vertical}.lsr-error{font-size:12px;color:#b42318;margin:8px 0}
        .lsr-preview-wrap{min-width:0;overflow:auto}.lsr-preview-label{display:flex;justify-content:space-between;gap:10px;margin:0 0 10px;font-size:13px}
        .lsr-paper{width:210mm;height:297mm;min-width:210mm;box-sizing:border-box;margin:0 auto;background:#fff;color:#111;padding:16mm 17mm 14mm;box-shadow:0 2px 12px #0002;position:relative;font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.45}
        .lsr-letterhead{display:flex;align-items:center;justify-content:center;position:relative;min-height:25mm;text-align:center;padding-bottom:3mm}
        .lsr-letterhead img{position:absolute;left:0;top:0;width:27mm;height:23mm;object-fit:contain}
        .lsr-letterhead-copy{width:100%}.lsr-letterhead h1{font-size:14pt;margin:0 0 5px;font-weight:700}.lsr-letterhead p{font-size:8pt;margin:2px 0}
        .lsr-rule{border-top:1.2px solid #222;margin:2mm 0 13mm}
        .lsr-title{text-align:center;font-size:15pt;font-weight:700;text-decoration:underline;margin:0 0 15mm;letter-spacing:.2px}
        .lsr-request-no{text-align:right;font-size:8pt;margin-top:-11mm;margin-bottom:8mm;color:#333}
        .lsr-section-title{font-size:11pt;font-weight:700;margin:0 0 5mm}
        .lsr-staff-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7mm;margin-bottom:15mm}
        .lsr-data-block{min-width:0}.lsr-data-label{font-size:8.5pt;font-weight:700;display:block;margin-bottom:3mm}.lsr-data-value{min-height:8mm;border-bottom:1px solid #555;padding:1mm 0 2mm;overflow-wrap:anywhere}
        .lsr-leave-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7mm;margin-bottom:12mm}
        .lsr-remarks{margin:0 0 9mm}.lsr-remarks-line{border-bottom:1px solid #777;min-height:13mm;padding:2mm 0;white-space:pre-wrap;overflow-wrap:anywhere}
        .lsr-request-text{font-size:10pt;line-height:1.8;text-align:justify;margin:0 0 18mm}
        .lsr-signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:9mm;margin-top:2mm;text-align:center}
        .lsr-signature{min-width:0}.lsr-signature-space{height:22mm}.lsr-signature-line{border-top:1px solid #333;padding-top:3mm;font-size:9pt;font-weight:700}
        .lsr-signature-name{font-size:9pt;margin-top:2mm}.lsr-signature-role{font-size:8pt;margin-top:1mm;color:#333}
        .lsr-bottom-note{position:absolute;left:17mm;right:17mm;bottom:10mm;border-top:1px solid #bbb;padding-top:3mm;text-align:center;font-size:7pt;color:#666}
        @media(max-width:950px){.lsr-layout{grid-template-columns:1fr}.lsr-editor{max-height:none}}
        @page{size:A4 portrait;margin:0}
        @media print{
          html,body,#root{margin:0!important;padding:0!important;width:210mm!important;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
          .lsr-app{padding:0!important;margin:0!important;background:#fff!important}.lsr-toolbar,.lsr-editor,.lsr-preview-label{display:none!important}
          .lsr-layout{display:block!important;margin:0!important}.lsr-preview-wrap{overflow:visible!important}.lsr-paper{width:210mm!important;height:297mm!important;min-width:210mm!important;margin:0!important;box-shadow:none!important;overflow:hidden!important;page-break-after:avoid!important;break-after:avoid!important}
        }
      `}</style>

      <div className="lsr-toolbar">
        <div>
          <h2>Leave Salary Releasing Request</h2>
          <p>Madihaa Company Pvt Ltd · HR Management</p>
        </div>
        <div className="lsr-actions">
          <button className="lsr-btn lsr-btn-secondary" onClick={() => setShowEditor((value) => !value)}>
            {showEditor ? "Hide Form" : "Edit Details"}
          </button>
          <button className="lsr-btn lsr-btn-primary" onClick={print}>Print / Save PDF</button>
        </div>
      </div>

      <div className="lsr-layout">
        {showEditor && (
          <aside className="lsr-editor">
            <h3>Staff Details</h3>
            <label className="lsr-field">
              <span>Select Staff</span>
              <select value={selectedEmployeeId} onChange={(event) => chooseEmployee(event.target.value)}>
                <option value="">Select employee</option>
                {employees.map((item) => (
                  <option key={item.id} value={item.id}>{item.staffId} - {item.name}</option>
                ))}
              </select>
            </label>
            {loading && <p>Loading employees...</p>}
            {error && <p className="lsr-error">{error}</p>}
            <h3>Leave Details</h3>
            {field("Start Date", request.startDate, (value) => updateDate("startDate", value), "date")}
            {field("Returned Date", request.returnedDate, (value) => updateDate("returnedDate", value), "date")}
            {field("No. of Days (auto-calculated; editable)", request.noOfDays || calculateDays(request.startDate, request.returnedDate), (value) => update("noOfDays", value), "number")}
            <label className="lsr-field">
              <span>Remarks</span>
              <textarea value={request.remarks} onChange={(event) => update("remarks", event.target.value)} rows={4} />
            </label>
            <h3>Prepared / Checked / Approved</h3>
            {field("Prepared By", request.preparedBy, (value) => update("preparedBy", value))}
            {field("Checked By", request.checkedBy, (value) => update("checkedBy", value))}
            {field("Approved By", request.approvedBy, (value) => update("approvedBy", value))}
          </aside>
        )}

        <main className="lsr-preview-wrap">
          <div className="lsr-preview-label"><strong>A4 document preview</strong><span>210 × 297 mm · Portrait</span></div>
          <article className="lsr-paper">
            <header className="lsr-letterhead">
              <img src="/Madihaa 2026 (1).png" alt="Madihaa Company logo" />
              <div className="lsr-letterhead-copy">
                <h1>MADIHAA COMPANY (PTE) LTD</h1>
                <p>M. Madihaa, Shaheed Ali Hingun, Malé, Republic of Maldives</p>
                <p>Tel: +960 332 8827 | Email: admin@madihaa.mv | Web: www.madihaa.mv</p>
              </div>
            </header>
            <div className="lsr-rule" />
            <h2 className="lsr-title">LEAVE SALARY RELEASING REQUEST</h2>
            <div className="lsr-request-no">Request No: {requestNo}</div>

            <h3 className="lsr-section-title">Staff details</h3>
            <div className="lsr-staff-grid">
              <div className="lsr-data-block"><span className="lsr-data-label">Name</span><div className="lsr-data-value">{employee?.name || ""}</div></div>
              <div className="lsr-data-block"><span className="lsr-data-label">Occupation</span><div className="lsr-data-value">{employee?.occupation || ""}</div></div>
              <div className="lsr-data-block"><span className="lsr-data-label">Site / Location</span><div className="lsr-data-value">{employee?.site || ""}</div></div>
            </div>

            <h3 className="lsr-section-title">Leave details</h3>
            <div className="lsr-leave-grid">
              <div className="lsr-data-block"><span className="lsr-data-label">Start date</span><div className="lsr-data-value">{displayDate(request.startDate)}</div></div>
              <div className="lsr-data-block"><span className="lsr-data-label">Returned date</span><div className="lsr-data-value">{displayDate(request.returnedDate)}</div></div>
              <div className="lsr-data-block"><span className="lsr-data-label">No. of days</span><div className="lsr-data-value">{days}</div></div>
            </div>

            <div className="lsr-remarks">
              <h3 className="lsr-section-title">Remarks</h3>
              <div className="lsr-remarks-line">{request.remarks}</div>
            </div>

            <p className="lsr-request-text">
              Kindly arrange to release the leave salary for {employee?.name || "…………………………………."} for the above employee.
            </p>

            <div className="lsr-signatures">
              <div className="lsr-signature">
                <div className="lsr-signature-space" />
                <div className="lsr-signature-line">Prepared by:</div>
                <div className="lsr-signature-name">{request.preparedBy}</div>
                <div className="lsr-signature-role">HR Executive</div>
              </div>
              <div className="lsr-signature">
                <div className="lsr-signature-space" />
                <div className="lsr-signature-line">Checked by:</div>
                <div className="lsr-signature-name">{request.checkedBy}</div>
                <div className="lsr-signature-role">Office Manager</div>
              </div>
              <div className="lsr-signature">
                <div className="lsr-signature-space" />
                <div className="lsr-signature-line">Approved by:</div>
                <div className="lsr-signature-name">{request.approvedBy}</div>
                <div className="lsr-signature-role">Chairman</div>
              </div>
            </div>

            <div className="lsr-bottom-note">Madihaa Company Pvt Ltd · Leave Salary Releasing Request · {requestNo}</div>
          </article>
        </main>
      </div>
    </div>
  );
}
