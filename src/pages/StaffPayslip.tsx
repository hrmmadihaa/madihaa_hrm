import { useState, useEffect, useCallback } from 'react';
import { Calendar, Download } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { getPayroll } from '../lib/payroll';
import { useAuth } from '../contexts/AuthContext';
import { getEmployees } from '../lib/employees';
import type { Payroll as PayrollRecord, Employee } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import madihaaLogo from '/madihaa (1).jpg';

export const StaffPayslip = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeDocId, setEmployeeDocId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const loadPayrollData = useCallback(async () => {
    try {
      setLoading(true);

      // Get employee document ID from employeeId
      if (user?.employeeId) {
        const employees = await getEmployees();
        const employee = employees.find(e => e.employeeId === user.employeeId);
        if (employee) {
          setEmployeeDocId(employee.id);
          setEmployee(employee);
        }
      }

      if (employeeDocId) {
        // Get all payroll for this employee (avoiding composite index)
        const allPayroll = await getPayroll(undefined, undefined, employeeDocId);
        // Filter by month and year client-side
        const filtered = allPayroll.filter(p => p.month === selectedMonth && p.year === selectedYear);
        setPayrollData(filtered);
      } else {
        setPayrollData([]);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, employeeDocId, user?.employeeId]);

  useEffect(() => {
    if (user?.employeeId) {
      loadPayrollData();
    }
  }, [loadPayrollData, user?.employeeId]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const generatePayslipPDF = (payroll: PayrollRecord) => {
    const doc = new jsPDF();

    // Add Logo
    const logoWidth = 40;
    const logoHeight = 30;
    doc.addImage(madihaaLogo, 'JPEG', 15, 10, logoWidth, logoHeight);

    // Company Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('Madihaa Company Pvt Ltd', 60, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('(C-014/1985)', 60, 26);

    // Pay Slip Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(`Pay Slip for ${months[selectedMonth - 1]}-${selectedYear}`, 20, 45);

    // Employee Details - Left Side
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(employee?.fullName || 'N/A', 45, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('Staff ID:', 20, 63);
    doc.setFont('helvetica', 'normal');
    doc.text(employee?.employeeId || user?.employeeId || 'N/A', 45, 63);

    doc.setFont('helvetica', 'bold');
    doc.text('Nationality:', 20, 71);
    doc.setFont('helvetica', 'normal');
    doc.text(employee?.country || 'N/A', 45, 71);

    // Employee Details - Right Side
    doc.setFont('helvetica', 'bold');
    doc.text('Sheet Ref No:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(payroll.id?.slice(-6) || 'N/A', 150, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('Position:', 120, 63);
    doc.setFont('helvetica', 'normal');
    doc.text(employee?.designation || 'N/A', 150, 63);

    doc.setFont('helvetica', 'bold');
    doc.text('Basic:', 120, 71);
    doc.setFont('helvetica', 'normal');
    doc.text(`MVR ${payroll.basicSalary.toLocaleString()}`, 150, 71);

    // Payment Details Header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text('Payment Details (MVR)', 20, 90);

    // Payment Details Table
    const paymentData = [
      ['Basic Salary:', payroll.basicSalary.toLocaleString()],
      ['Other Allowance:', payroll.allowances.find(a => a.name === 'Other Allowance')?.amount.toLocaleString() || '-'],
      ['Food Allowance:', payroll.allowances.find(a => a.name === 'Food Allowance')?.amount.toLocaleString() || '-'],
      ['Overtime Allowance:', payroll.allowances.find(a => a.name === 'Overtime Allowance')?.amount.toLocaleString() || '-'],
      ['SP Allowance:', payroll.allowances.find(a => a.name === 'SP Allowance')?.amount.toLocaleString() || '-'],
      ['Friday Allowance:', payroll.allowances.find(a => a.name === 'Friday Allowance')?.amount.toLocaleString() || '-'],
      ['', ''],
      ['Total Earnings:', payroll.grossSalary.toLocaleString()]
    ];

    autoTable(doc, {
      startY: 95,
      head: [],
      body: paymentData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', textColor: [0, 0, 0] },
        1: { cellWidth: 40, halign: 'right', textColor: [0, 102, 0] }
      },
      styles: { fontSize: 9 }
    });

    // Deductions Header
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(204, 0, 0);
    doc.text('Deductions (MVR)', 120, finalY);

    // Deductions Table
    const totalDeductions = payroll.deductions.reduce((sum, d) => sum + d.amount, 0);
    const loanDeductions = payroll.loans.reduce((sum, l) => sum + l.installmentAmount, 0);
    const deductionsData = [
      ['Absent Deductions:', payroll.deductions.find(d => d.name === 'Absent Deductions')?.amount.toLocaleString() || '-'],
      ['Loan and others:', loanDeductions > 0 ? loanDeductions.toLocaleString() : '-'],
      ['', ''],
      ['Present days:', '31.00'],
      ['Absent Days:', '-'],
      ['No. of Fridays:', '-'],
      ['', ''],
      ['Total Deduction:', totalDeductions.toLocaleString()]
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [],
      body: deductionsData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', textColor: [0, 0, 0] },
        1: { cellWidth: 40, halign: 'right', textColor: [204, 0, 0] }
      },
      styles: { fontSize: 9 }
    });

    // Net Salary
    const netY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(`Net Salary Payment: MVR ${payroll.netSalary.toLocaleString()}`, 20, netY);

    // Payment Info
    const infoY = netY + 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Paid Date:', 20, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(payroll.processedDate ? new Date(payroll.processedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '00-Jan-00', 50, infoY);

    doc.setFont('helvetica', 'bold');
    doc.text('Credited A/C No:', 20, infoY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text((employee as any)?.bankAccountNumber || '8000354291', 65, infoY + 8);

    doc.setFont('helvetica', 'bold');
    doc.text('/', 95, infoY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text('Commercial Bank of Maldives', 100, infoY + 8);

    // Signatures
    const signY = infoY + 25;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 20, signY);
    doc.setFont('helvetica', 'normal');
    doc.text('__________________', 45, signY);

    doc.setFont('helvetica', 'bold');
    doc.text('Employee sign:', 20, signY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text('__________________', 55, signY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Approved By:', 120, signY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text('__________________', 155, signY + 10);

    // Remarks
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks:', 20, signY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text('- ', 45, signY + 20);

    // Save PDF
    const fileName = `payslip_${employee?.employeeId || user?.employeeId || 'employee'}_${months[selectedMonth - 1]}_${selectedYear}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">My Payslips</h1>
        <p className="text-secondary-600 mt-1">View your salary details and payslips</p>
      </div>

      {/* Month/Year Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-secondary-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslip Details */}
      {payrollData.length > 0 ? (
        <div className="space-y-6">
          {payrollData.map((payroll) => (
            <Card key={payroll.id}>
              <CardContent className="p-6">
                {/* Header with Logo */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  <img src={madihaaLogo} alt="Madihaa Logo" className="w-24 h-20 object-contain" />
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">Madihaa Company Pvt Ltd</h3>
                    <p className="text-sm text-gray-500">(C-014/1985)</p>
                    <p className="text-base font-semibold text-blue-900 mt-1">
                      Pay Slip for {months[selectedMonth - 1]}-{selectedYear}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      payroll.status === 'processed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="font-semibold w-28">Name:</span>
                      <span className="text-gray-700">{employee?.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-28">Staff ID:</span>
                      <span className="text-gray-700">{employee?.employeeId || user?.employeeId || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-28">Nationality:</span>
                      <span className="text-gray-700">{employee?.country || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="font-semibold w-28">Sheet Ref:</span>
                      <span className="text-gray-700">{payroll.id?.slice(-6) || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-28">Position:</span>
                      <span className="text-gray-700">{employee?.designation || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-28">Basic:</span>
                      <span className="text-gray-700">MVR {payroll.basicSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-blue-600 mb-3">Payment Details (MVR)</h4>
                  <div className="bg-green-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Basic Salary:</span>
                      <span className="text-green-700">{payroll.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Other Allowance:</span>
                      <span className="text-green-700">{payroll.allowances.find(a => a.name === 'Other Allowance')?.amount.toLocaleString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Food Allowance:</span>
                      <span className="text-green-700">{payroll.allowances.find(a => a.name === 'Food Allowance')?.amount.toLocaleString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Overtime Allowance:</span>
                      <span className="text-green-700">{payroll.allowances.find(a => a.name === 'Overtime Allowance')?.amount.toLocaleString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">SP Allowance:</span>
                      <span className="text-green-700">{payroll.allowances.find(a => a.name === 'SP Allowance')?.amount.toLocaleString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Friday Allowance:</span>
                      <span className="text-green-700">{payroll.allowances.find(a => a.name === 'Friday Allowance')?.amount.toLocaleString() || '-'}</span>
                    </div>
                    <div className="border-t border-green-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span>Total Earnings:</span>
                      <span className="text-green-800">{payroll.grossSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-red-600 mb-3">Deductions (MVR)</h4>
                  <div className="bg-red-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Absent Deductions:</span>
                      <span className="text-red-700">{payroll.deductions.find(d => d.name === 'Absent Deductions')?.amount.toLocaleString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Loan and others:</span>
                      <span className="text-red-700">{payroll.loans.reduce((sum, l) => sum + l.installmentAmount, 0).toLocaleString() || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Present days:</span>
                      <span className="text-gray-700">31.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Absent Days:</span>
                      <span className="text-gray-700">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">No. of Fridays:</span>
                      <span className="text-gray-700">-</span>
                    </div>
                    <div className="border-t border-red-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span>Total Deduction:</span>
                      <span className="text-red-800">{payroll.deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-900">Net Salary Payment:</span>
                    <span className="text-2xl font-bold text-blue-600">MVR {payroll.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-2 mb-6">
                  <div className="flex">
                    <span className="font-semibold w-36">Paid Date:</span>
                    <span className="text-gray-700">{payroll.processedDate ? new Date(payroll.processedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '00-Jan-00'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-36">Credited A/C No:</span>
                    <span className="text-gray-700">{(employee as any)?.bankAccountNumber || '8000354291'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-36">Bank:</span>
                    <span className="text-gray-700">Commercial Bank of Maldives</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Date:</span>
                      <span className="border-b border-gray-400 flex-1"></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Employee sign:</span>
                      <span className="border-b border-gray-400 flex-1"></span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Approved By:</span>
                      <span className="border-b border-gray-400 flex-1"></span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="mt-6 pt-4 border-t">
                  <span className="font-semibold">Remarks:</span>
                  <span className="ml-2">-</span>
                </div>

                {/* Download Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => generatePayslipPDF(payroll)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No payslip found for {months[selectedMonth - 1]} {selectedYear}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
