import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, Save, CalendarDays, Clock, Wallet, FileText, ArrowLeft } from 'lucide-react';
import { getAttendance } from '../lib/attendance';
import { getOvertimeRequests } from '../lib/overtime';
import { getEmployees } from '../lib/employees';
import { formatDate } from '../lib/dateUtils';
import type { OvertimeRequest } from '../types';

type AttendanceRow = {
  date: string;
  day: string;
  inTime: string;
  outTime: string;
  status: string;
};

type SettlementForm = {
  employeeId: string;
  employeeName: string;
  company: string;
  nationality: string;
  designation: string;
  workPermit: string;
  settlementMonth: string;
  lastWorkingDate: string;

  monthlySalary: number;
  salaryDays: number;
  salaryDivisor: number;

  overtimeAmount: number;
  overtimeHours: number;
  overtimeRate: number;
  foodAllowanceDays: number;
  foodAllowancePerDay: number;

  presentDays: number;
  fridayCount: number;
  offDays: number;

  mc: number;
  el: number;
  al: number;
  sus: number;
  fl: number;
  sick: number;
  halfDay: number;
  absent: number;
  noPayLeave: number;
  specialLeave: number;

  otherEarnings: number;
  deductions: number;
  advanceDeduction: number;
  remarks: string;
};

const money = (value: number) =>
  new Intl.NumberFormat('en-MV', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const Settlement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  const [loading, setLoading] = useState(true);
  const [overtimeData, setOvertimeData] = useState<OvertimeRequest[]>([]);

  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [overtimeStartDate, setOvertimeStartDate] = useState('');
  const [overtimeEndDate, setOvertimeEndDate] = useState('');

  const [form, setForm] = useState<SettlementForm>({
    employeeId: employeeId || '',
    employeeName: '',
    company: 'Madihaa Company Pvt Ltd',
    nationality: '',
    designation: '',
    workPermit: '',
    settlementMonth: '',
    lastWorkingDate: '',
    monthlySalary: 0,
    salaryDays: 23,
    salaryDivisor: 30,
    overtimeAmount: 0,
    overtimeHours: 0,
    overtimeRate: 10,
    foodAllowanceDays: 0,
    foodAllowancePerDay: 0,
    presentDays: 0,
    fridayCount: 0,
    offDays: 0,
    mc: 0,
    el: 0,
    al: 0,
    sus: 0,
    fl: 0,
    sick: 0,
    halfDay: 0,
    absent: 0,
    noPayLeave: 0,
    specialLeave: 0,
    otherEarnings: 0,
    deductions: 0,
    advanceDeduction: 0,
    remarks: '',
  });

  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const empData = await getEmployees();

      if (employeeId) {
        const employee = empData.find((e) => e.id === employeeId);
        if (employee) {
          setForm((prev) => ({
            ...prev,
            employeeId: employee.id,
            employeeName: employee.fullName || '',
            designation: employee.designation || '',
            nationality: employee.country || '',
            workPermit: employee.wpNo || '',
            monthlySalary: employee.salary ? Number(employee.salary) : 0,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!employeeId || !attendanceStartDate || !attendanceEndDate) return;

    try {
      const data = await getAttendance(
        employeeId,
        new Date(attendanceStartDate),
        new Date(attendanceEndDate)
      );

      const rows: AttendanceRow[] = data.map((att) => ({
        date: formatDate(att.date),
        day: new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' }),
        inTime: att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        outTime: att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        status: att.status,
      }));
      setAttendance(rows);

      // Calculate attendance summary
      const presentDays = data.filter((a) => a.status === 'present').length;
      const absentDays = data.filter((a) => a.status === 'absent').length;
      const halfDays = data.filter((a) => a.status === 'half_day').length;
      const fridays = data.filter((a) => new Date(a.date).getDay() === 5).length;

      setForm((prev) => ({
        ...prev,
        presentDays,
        absent: absentDays,
        halfDay: halfDays,
        fridayCount: fridays,
      }));
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const loadOvertime = async () => {
    if (!employeeId || !overtimeStartDate || !overtimeEndDate) return;

    try {
      const data = await getOvertimeRequests(employeeId);
      const filteredData = data.filter(
        (ot) =>
          ot.date >= new Date(overtimeStartDate) && ot.date <= new Date(overtimeEndDate)
      );
      setOvertimeData(filteredData);

      const totalHours = filteredData.reduce((sum, ot) => sum + (ot.hours || 0), 0);
      setForm((prev) => ({
        ...prev,
        overtimeHours: totalHours,
        overtimeAmount: totalHours * prev.overtimeRate,
      }));
    } catch (error) {
      console.error('Error loading overtime:', error);
    }
  };

  const calculations = useMemo(() => {
    const dailySalary = form.salaryDivisor > 0 ? form.monthlySalary / form.salaryDivisor : 0;
    const basicPay = dailySalary * form.salaryDays;
    const foodAllowance = form.foodAllowanceDays * form.foodAllowancePerDay;
    const totalEarnings = basicPay + form.overtimeAmount + foodAllowance + form.otherEarnings;
    const totalDeductions = form.deductions + form.advanceDeduction;
    const netSettlement = totalEarnings - totalDeductions;

    return {
      dailySalary,
      basicPay,
      foodAllowance,
      totalEarnings,
      totalDeductions,
      netSettlement,
    };
  }, [form]);

  const updateField = <K extends keyof SettlementForm>(key: K, value: SettlementForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1 block text-xs font-medium text-gray-500';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </section>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );

  const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <Field label={label}>
      <input
        type="number"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </Field>
  );

  const StatCard = ({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: React.ReactNode }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{title}</span>
        <span className="rounded-lg bg-gray-100 p-2 text-gray-600">{icon}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          input, select, textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: black !important;
          }
          table { width: 100%; border-collapse: collapse !important; }
          th, td { border: 1px solid #777 !important; padding: 4px !important; font-size: 9px !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* HEADER */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Settlement</h1>
            <p className="mt-1 text-sm text-gray-500">Foreign staff final salary & settlement management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            <Printer size={16} />
            Print / PDF
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Save size={16} />
            Save Settlement
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="no-print mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Basic Salary" value={`MVR ${money(calculations.basicPay)}`} subtitle={`${form.salaryDays} salary days`} icon={<Wallet size={18} />} />
        <StatCard title="Overtime" value={`MVR ${money(form.overtimeAmount)}`} subtitle={`${form.overtimeHours.toFixed(2)} hrs`} icon={<Clock size={18} />} />
        <StatCard title="Food Allowance" value={`MVR ${money(calculations.foodAllowance)}`} subtitle={`${form.foodAllowanceDays} days`} icon={<CalendarDays size={18} />} />
        <StatCard title="Net Settlement" value={`MVR ${money(calculations.netSettlement)}`} subtitle="Calculated settlement" icon={<FileText size={18} />} />
      </div>

      {/* EMPLOYEE DETAILS */}
      <Section title="Employee Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Employee ID">
            <input className={inputClass} value={form.employeeId} onChange={(e) => updateField('employeeId', e.target.value)} />
          </Field>
          <Field label="Employee Name">
            <input className={inputClass} value={form.employeeName} onChange={(e) => updateField('employeeName', e.target.value)} />
          </Field>
          <Field label="Company">
            <select className={inputClass} value={form.company} onChange={(e) => updateField('company', e.target.value)}>
              <option>Madihaa Company Pvt Ltd</option>
              <option>Batuta</option>
              <option>Madigrand</option>
            </select>
          </Field>
          <Field label="Nationality">
            <input className={inputClass} value={form.nationality} onChange={(e) => updateField('nationality', e.target.value)} />
          </Field>
          <Field label="Designation">
            <input className={inputClass} value={form.designation} onChange={(e) => updateField('designation', e.target.value)} />
          </Field>
          <Field label="Work Permit No.">
            <input className={inputClass} value={form.workPermit} onChange={(e) => updateField('workPermit', e.target.value)} />
          </Field>
          <Field label="Settlement Month">
            <input type="month" className={inputClass} value={form.settlementMonth} onChange={(e) => updateField('settlementMonth', e.target.value)} />
          </Field>
          <Field label="Last Working Date">
            <input type="date" className={inputClass} value={form.lastWorkingDate} onChange={(e) => updateField('lastWorkingDate', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ATTENDANCE SELECTION */}
      <Section title="Attendance Data">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <Field label="Start Date">
            <input type="date" className={inputClass} value={attendanceStartDate} onChange={(e) => setAttendanceStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={inputClass} value={attendanceEndDate} onChange={(e) => setAttendanceEndDate(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button onClick={loadAttendance} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Load Attendance
            </button>
          </div>
        </div>
        {attendance.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="border p-2">S.No</th>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Day</th>
                  <th className="border p-2">IN</th>
                  <th className="border p-2">OUT</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{i + 1}</td>
                    <td className="border p-2">{row.date}</td>
                    <td className="border p-2">{row.day}</td>
                    <td className="border p-2">{row.inTime}</td>
                    <td className="border p-2">{row.outTime}</td>
                    <td className="border p-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* OVERTIME SELECTION */}
      <Section title="Overtime Data">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4">
          <Field label="Start Date">
            <input type="date" className={inputClass} value={overtimeStartDate} onChange={(e) => setOvertimeStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={inputClass} value={overtimeEndDate} onChange={(e) => setOvertimeEndDate(e.target.value)} />
          </Field>
          <NumberField label="Rate per Hour (MVR)" value={form.overtimeRate} onChange={(v) => updateField('overtimeRate', v)} />
          <div className="flex items-end">
            <button onClick={loadOvertime} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Load Overtime
            </button>
          </div>
        </div>
        {overtimeData.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Hours</th>
                  <th className="border p-2">Rate</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {overtimeData.map((ot, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border p-2">{formatDate(ot.date)}</td>
                    <td className="border p-2">{ot.hours?.toFixed(2) || 0}</td>
                    <td className="border p-2">{form.overtimeRate}</td>
                    <td className="border p-2">{money((ot.hours || 0) * form.overtimeRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-lg font-bold">{form.overtimeHours.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-gray-500">Total Overtime Amount</p>
            <p className="text-lg font-bold text-blue-700">MVR {money(form.overtimeAmount)}</p>
          </div>
        </div>
      </Section>

      {/* SALARY CALCULATION */}
      <Section title="Salary Calculation">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Monthly Salary (MVR)" value={form.monthlySalary} onChange={(v) => updateField('monthlySalary', v)} />
          <NumberField label="Salary Days" value={form.salaryDays} onChange={(v) => updateField('salaryDays', v)} />
          <NumberField label="Salary Divisor" value={form.salaryDivisor} onChange={(v) => updateField('salaryDivisor', v)} />
          <Field label="Daily Salary">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold">MVR {money(calculations.dailySalary)}</div>
          </Field>
          <Field label="Basic Pay">
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">MVR {money(calculations.basicPay)}</div>
          </Field>
          <NumberField label="Overtime Amount (MVR)" value={form.overtimeAmount} onChange={(v) => updateField('overtimeAmount', v)} />
          <NumberField label="Food Allowance Days" value={form.foodAllowanceDays} onChange={(v) => updateField('foodAllowanceDays', v)} />
          <NumberField label="Food Allowance Per Day (MVR)" value={form.foodAllowancePerDay} onChange={(v) => updateField('foodAllowancePerDay', v)} />
          <Field label="Total Food Allowance">
            <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800">MVR {money(calculations.foodAllowance)}</div>
          </Field>
          <NumberField label="Other Earnings (MVR)" value={form.otherEarnings} onChange={(v) => updateField('otherEarnings', v)} />
        </div>
      </Section>

      {/* ATTENDANCE SUMMARY */}
      <Section title="Attendance & Leave Summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <NumberField label="Present Days" value={form.presentDays} onChange={(v) => updateField('presentDays', v)} />
          <NumberField label="Fridays" value={form.fridayCount} onChange={(v) => updateField('fridayCount', v)} />
          <NumberField label="OFF" value={form.offDays} onChange={(v) => updateField('offDays', v)} />
          <NumberField label="MC" value={form.mc} onChange={(v) => updateField('mc', v)} />
          <NumberField label="Emergency Leave (EL)" value={form.el} onChange={(v) => updateField('el', v)} />
          <NumberField label="Annual Leave (AL)" value={form.al} onChange={(v) => updateField('al', v)} />
          <NumberField label="Suspended (SUS)" value={form.sus} onChange={(v) => updateField('sus', v)} />
          <NumberField label="Family Leave (FL)" value={form.fl} onChange={(v) => updateField('fl', v)} />
          <NumberField label="Sick" value={form.sick} onChange={(v) => updateField('sick', v)} />
          <NumberField label="Half Day" value={form.halfDay} onChange={(v) => updateField('halfDay', v)} />
          <NumberField label="Absent (AB)" value={form.absent} onChange={(v) => updateField('absent', v)} />
          <NumberField label="No Pay Leave (NL)" value={form.noPayLeave} onChange={(v) => updateField('noPayLeave', v)} />
          <NumberField label="Special Leave (SP)" value={form.specialLeave} onChange={(v) => updateField('specialLeave', v)} />
        </div>
      </Section>

      {/* DEDUCTIONS */}
      <Section title="Deductions">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Other Deductions (MVR)" value={form.deductions} onChange={(v) => updateField('deductions', v)} />
          <NumberField label="Advance / Loan Deduction (MVR)" value={form.advanceDeduction} onChange={(v) => updateField('advanceDeduction', v)} />
          <Field label="Total Deductions">
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">MVR {money(calculations.totalDeductions)}</div>
          </Field>
        </div>
      </Section>

      {/* SETTLEMENT TOTAL */}
      <Section title="Final Settlement Summary">
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-200">
            <SummaryRow label="Basic Salary" value={calculations.basicPay} />
            <SummaryRow label="Overtime" value={form.overtimeAmount} />
            <SummaryRow label="Food Allowance" value={calculations.foodAllowance} />
            <SummaryRow label="Other Earnings" value={form.otherEarnings} />
            <SummaryRow label="Total Earnings" value={calculations.totalEarnings} bold />
            <SummaryRow label="Other Deductions" value={form.deductions} />
            <SummaryRow label="Advance / Loan" value={form.advanceDeduction} />
            <SummaryRow label="Total Deductions" value={calculations.totalDeductions} />
          </div>
          <div className="flex items-center justify-between bg-gray-900 px-4 py-4 text-white">
            <span className="font-semibold">NET SETTLEMENT</span>
            <span className="text-xl font-bold">MVR {money(calculations.netSettlement)}</span>
          </div>
        </div>
      </Section>

      {/* REMARKS */}
      <Section title="Remarks / Notes">
        <textarea className={`${inputClass} min-h-[100px]`} value={form.remarks} onChange={(e) => updateField('remarks', e.target.value)} placeholder="Enter settlement notes..." />
      </Section>
    </div>
  );
};

function SummaryRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className={bold ? 'font-semibold text-gray-900' : 'text-gray-600'}>{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}>MVR {money(value)}</span>
    </div>
  );
}
