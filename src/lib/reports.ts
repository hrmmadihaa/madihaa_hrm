import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateUtils';

// Export to Excel
export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export to CSV
export const exportToCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

// Export to PDF
export const exportToPDF = (data: any[], filename: string, title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  const tableData: (string | number | boolean | null)[][] = data.map(item =>
    Object.values(item).map(value => (value === undefined ? null : value as string | number | boolean | null))
  );
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  autoTable(doc, {
    head: [headers],
    body: tableData as any,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: 'bold',
    },
  });
  
  doc.save(`${filename}.pdf`);
};

// Generate employee report
export const generateEmployeeReport = (employees: any[]) => {
  const reportData = employees.map(emp => ({
    'Employee ID': emp.employeeId,
    'Name': emp.fullName,
    'Email': emp.email,
    'Department': emp.department,
    'Designation': emp.designation,
    'Status': emp.status,
    'Join Date': formatDate(new Date(emp.joinDate)),
  }));
  
  return reportData;
};

// Generate attendance report
export const generateAttendanceReport = (attendance: any[]) => {
  const reportData = attendance.map(att => ({
    'Employee ID': att.employeeId,
    'Date': formatDate(new Date(att.date)),
    'Check In': att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : 'N/A',
    'Check Out': att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : 'N/A',
    'Status': att.status,
    'Method': att.checkInMethod,
  }));
  
  return reportData;
};

// Generate leave report
export const generateLeaveReport = (leaves: any[]) => {
  const reportData = leaves.map(leave => ({
    'Employee ID': leave.employeeId,
    'Type': leave.type,
    'Start Date': formatDate(new Date(leave.startDate)),
    'End Date': formatDate(new Date(leave.endDate)),
    'Days': leave.days,
    'Status': leave.status,
    'Applied Date': formatDate(new Date(leave.appliedDate)),
  }));
  
  return reportData;
};

// Generate payroll report
export const generatePayrollReport = (payroll: any[]) => {
  const reportData = payroll.map(pay => ({
    'Employee ID': pay.employeeId,
    'Basic Salary': pay.basicSalary,
    'Allowances': pay.allowances.reduce((sum: number, a: any) => sum + a.amount, 0),
    'Deductions': pay.deductions.reduce((sum: number, d: any) => sum + d.amount, 0),
    'Gross Salary': pay.grossSalary,
    'Net Salary': pay.netSalary,
    'Status': pay.status,
  }));
  
  return reportData;
};

// Generate overtime report
export const generateOvertimeReport = (overtime: any[]) => {
  const reportData = overtime.map(ot => ({
    'Employee ID': ot.employeeId,
    'Date': formatDate(new Date(ot.date)),
    'Start Time': ot.startTime,
    'End Time': ot.endTime,
    'Hours': ot.hours,
    'Status': ot.status,
    'Reason': ot.reason,
  }));
  
  return reportData;
};
