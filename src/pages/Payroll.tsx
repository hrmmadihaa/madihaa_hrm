import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Download, FileText, Send, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getPayroll, getPayrollSummary, processPayrollRun, generatePayrollFromEmployees } from '../lib/payroll';
import { getEmployees } from '../lib/employees';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../lib/permissions';
import type { Payroll as PayrollRecord, PayrollSummary, Employee } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Payroll = () => {
  const { can } = usePermissions();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadPayrollData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, summaryData, empData] = await Promise.all([
        getPayroll(selectedMonth, selectedYear),
        getPayrollSummary(selectedMonth, selectedYear),
        getEmployees(),
      ]);
      setEmployees(empData);

      // Filter payroll data based on user role
      // Only superadmin can view all salaries, others can only view their own
      if (user?.role === 'super_admin') {
        setPayrollData(data);
        setSummary(summaryData);
      } else if (user?.employeeId) {
        // Filter to show only the user's own payroll
        const userEmployee = empData.find(emp => emp.employeeId === user.employeeId);
        if (userEmployee) {
          const filteredData = data.filter(p => p.employeeId === userEmployee.id);
          setPayrollData(filteredData);
          // Calculate summary for just this user
          const userSummary = {
            totalEmployees: 1,
            totalGrossSalary: filteredData.reduce((sum, p) => sum + p.grossSalary, 0),
            totalNetSalary: filteredData.reduce((sum, p) => sum + p.netSalary, 0),
            totalAllowances: filteredData.reduce((sum, p) => sum + p.allowances.reduce((as, a) => as + a.amount, 0), 0),
            totalDeductions: filteredData.reduce((sum, p) => sum + p.deductions.reduce((ds, d) => ds + d.amount, 0), 0),
            totalBonuses: filteredData.reduce((sum, p) => sum + p.bonuses.reduce((bs, b) => bs + b.amount, 0), 0),
            status: {
              draft: filteredData.filter(p => p.status === 'draft').length,
              processed: filteredData.filter(p => p.status === 'processed').length,
              approved: filteredData.filter(p => p.status === 'approved').length,
              paid: filteredData.filter(p => p.status === 'paid').length,
            },
          };
          setSummary(userSummary);
        } else {
          setPayrollData([]);
          setSummary(null);
        }
      } else {
        setPayrollData([]);
        setSummary(null);
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, user?.role, user?.employeeId]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const generatePayslipPDF = (payroll: PayrollRecord) => {
    const employee = employees.find(emp => emp.id === payroll.employeeId);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Madihaa Pvt Ltd', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Payslip', 105, 30, { align: 'center' });
    
    // Period
    doc.setFontSize(10);
    doc.text(`Period: ${months[selectedMonth - 1]} ${selectedYear}`, 105, 40, { align: 'center' });
    
    // Employee Information
    doc.setFontSize(12);
    doc.text('Employee Information', 20, 55);
    doc.setFontSize(10);
    doc.text(`Name: ${employee?.fullName || 'N/A'}`, 20, 65);
    doc.text(`Employee ID: ${employee?.employeeId || payroll.employeeId}`, 20, 72);
    doc.text(`Department: ${employee?.department || 'N/A'}`, 20, 79);
    
    // Earnings Table
    doc.setFontSize(12);
    doc.text('Earnings', 20, 95);
    
    const earningsData = [
      ['Basic Salary', `MVR ${payroll.basicSalary.toLocaleString()}`],
      ...payroll.allowances.map(a => [a.name, `MVR ${a.amount.toLocaleString()}`]),
      ['', ''],
      ['Total Earnings', `MVR ${payroll.grossSalary.toLocaleString()}`]
    ];
    
    autoTable(doc, {
      startY: 100,
      head: [['Description', 'Amount']],
      body: earningsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Deductions Table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Deductions', 20, finalY);
    
    const totalDeductions = payroll.deductions.reduce((sum, d) => sum + d.amount, 0);
    const deductionsData = [
      ...payroll.deductions.map(d => [d.name, `MVR ${d.amount.toLocaleString()}`]),
      ['', ''],
      ['Total Deductions', `MVR ${totalDeductions.toLocaleString()}`]
    ];
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Description', 'Amount']],
      body: deductionsData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
    });
    
    // Net Salary
    const netY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Salary: MVR ${payroll.netSalary.toLocaleString()}`, 20, netY);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated on: ' + new Date().toLocaleDateString(), 20, 280);
    doc.text('This is a computer-generated document.', 105, 280, { align: 'center' });
    
    // Save PDF
    const fileName = `payslip_${employee?.employeeId || payroll.employeeId}_${months[selectedMonth - 1]}_${selectedYear}.pdf`;
    doc.save(fileName);
  };

  const handleProcessPayroll = async () => {
    if (!confirm(`Are you sure you want to process payroll for ${months[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    try {
      setProcessing(true);
      const payrollIds = payrollData.map(p => p.id);
      await processPayrollRun(payrollIds, user?.id || 'system');
      await loadPayrollData();
      alert('Payroll processed successfully!');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Failed to process payroll. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (payrollData.length > 0) {
      if (!confirm(`Payroll data already exists for ${months[selectedMonth - 1]} ${selectedYear}. Do you want to regenerate it? This will replace existing data.`)) {
        return;
      }
    } else {
      if (!confirm(`Generate payroll for ${months[selectedMonth - 1]} ${selectedYear} from employee salary data?`)) {
        return;
      }
    }

    try {
      setGenerating(true);
      await generatePayrollFromEmployees(selectedMonth, selectedYear);
      await loadPayrollData();
      alert('Payroll generated successfully!');
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Failed to generate payroll. Please try again.');
    } finally {
      setGenerating(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Payroll</h1>
          <p className="text-secondary-600 mt-1">Manage salary processing and payments</p>
        </div>
        <div className="flex gap-2">
          {can(PERMISSIONS.PAYROLL_PROCESS) && (
            <Button onClick={handleGeneratePayroll} disabled={generating} variant="secondary">
              {generating ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {generating ? 'Generating...' : 'Generate Payroll'}
            </Button>
          )}
          {can(PERMISSIONS.REPORTS_EXPORT) && (
            <Button variant="secondary">
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          )}
          {can(PERMISSIONS.PAYROLL_PROCESS) && (
            <Button onClick={handleProcessPayroll} disabled={processing || payrollData.length === 0}>
              {processing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {processing ? 'Processing...' : 'Process Payroll'}
            </Button>
          )}
        </div>
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

      {/* Summary Cards - Only show for superadmin */}
      {summary && user?.role === 'super_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Total Employees</p>
                  <p className="text-2xl font-bold text-secondary-900">{summary.totalEmployees}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Total Gross Salary</p>
                  <p className="text-2xl font-bold text-green-600">MVR {summary.totalGrossSalary.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Total Net Salary</p>
                  <p className="text-2xl font-bold text-primary-600">MVR {summary.totalNetSalary.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">MVR {summary.totalDeductions.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Overview */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Draft</p>
                  <p className="text-xl font-bold text-secondary-900">{summary.status.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Processed</p>
                  <p className="text-xl font-bold text-secondary-900">{summary.status.processed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Approved</p>
                  <p className="text-xl font-bold text-secondary-900">{summary.status.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Paid</p>
                  <p className="text-xl font-bold text-secondary-900">{summary.status.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Details */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Payroll Details</h2>
        </CardHeader>
        
        {/* Mobile Cards */}
        <div className="sm:hidden space-y-4 p-4">
          {payrollData.map((payroll, index) => (
            <motion.div
              key={payroll.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow p-4 border border-secondary-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-secondary-900 text-sm">
                    {employees.find(e => e.id === payroll.employeeId)?.fullName || payroll.employeeId}
                  </div>
                  <div className="text-xs text-secondary-500">
                    {employees.find(e => e.id === payroll.employeeId)?.employeeId || ''}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                    payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                    payroll.status === 'processed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payroll.status}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Basic Salary:</span>
                  <span className="font-medium">MVR {payroll.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Allowances:</span>
                  <span className="font-medium text-green-600">+MVR {payroll.allowances.reduce((sum: number, a: any) => sum + a.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Deductions:</span>
                  <span className="font-medium text-red-600">-MVR {payroll.deductions.reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Net Salary:</span>
                  <span className="font-bold text-secondary-900">MVR {payroll.netSalary.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => generatePayslipPDF(payroll)}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View
                </button>
                <button 
                  onClick={() => generatePayslipPDF(payroll)}
                  className="px-3 py-2 bg-secondary-600 text-white rounded-lg text-sm flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {payrollData.map((payroll, index) => (
                <motion.tr
                  key={payroll.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-secondary-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">
                      {employees.find(e => e.id === payroll.employeeId)?.fullName || payroll.employeeId}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {employees.find(e => e.id === payroll.employeeId)?.employeeId || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    MVR {payroll.basicSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +MVR {payroll.allowances.reduce((sum: number, a: any) => sum + a.amount, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -MVR {payroll.deductions.reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    MVR {payroll.netSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      payroll.status === 'processed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => generatePayslipPDF(payroll)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => generatePayslipPDF(payroll)}
                        className="text-secondary-600 hover:text-secondary-900"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {payrollData.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No payroll data for this period</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
