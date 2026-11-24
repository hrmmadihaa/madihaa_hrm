import { useState, useEffect } from 'react';
import { Save, Edit, X, History, Trash2, DollarSign, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getEmployees } from '../lib/employees';
import { addCustomDeduction, getCustomDeductions, updateCustomDeduction, deleteCustomDeduction, type CustomDeduction } from '../lib/payroll';
import { printDeductionLetter } from '../lib/printDeductionLetter';
import { logActivity } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';

export const Deductions = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [deductionName, setDeductionName] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionType, setDeductionType] = useState<'fixed' | 'percentage'>('fixed');
  const [deductionMonth, setDeductionMonth] = useState(new Date().getMonth() + 1);
  const [deductionYear, setDeductionYear] = useState(new Date().getFullYear());
  const [isRecurring, setIsRecurring] = useState(false);
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'create' | 'history'>('create');
  const [deductionHistory, setDeductionHistory] = useState<CustomDeduction[]>([]);
  const [editingDeduction, setEditingDeduction] = useState<CustomDeduction | null>(null);
  const [preparedBy, setPreparedBy] = useState('');
  const [preparedByPosition, setPreparedByPosition] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [approvedByPosition, setApprovedByPosition] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (viewMode === 'history') {
      loadDeductionHistory();
    }
  }, [viewMode]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const empData = await getEmployees();
      setEmployees(empData.filter(emp => emp.status === 'active'));
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeductionHistory = async () => {
    try {
      setLoading(true);
      const history = await getCustomDeductions();
      setDeductionHistory(history);
    } catch (error) {
      console.error('Error loading deduction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !deductionName || !deductionAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) {
      alert('Please select a valid employee');
      return;
    }

    try {
      setSaving(true);
      const deductionData: Omit<CustomDeduction, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: employee.id,
        employeeName: employee.fullName,
        employeeIdNumber: employee.employeeId,
        name: deductionName,
        amount: parseFloat(deductionAmount),
        type: deductionType,
        month: deductionMonth,
        year: deductionYear,
        isRecurring,
        ...(isRecurring && { numberOfMonths }),
        reason: reason || undefined
      };

      if (editingDeduction) {
        await updateCustomDeduction(editingDeduction.id!, deductionData);
        await logActivity('update', 'deduction', `Updated deduction ${deductionName} for ${employee.fullName}`);
        alert('Deduction updated successfully');
      } else {
        await addCustomDeduction(deductionData);
        await logActivity('create', 'deduction', `Created deduction ${deductionName} for ${employee.fullName}`);
        alert('Deduction added successfully');
      }

      // Reset form
      setSelectedEmployee('');
      setDeductionName('');
      setDeductionAmount('');
      setDeductionType('fixed');
      setIsRecurring(false);
      setReason('');
      setEditingDeduction(null);

      if (viewMode === 'history') {
        loadDeductionHistory();
      }
    } catch (error) {
      console.error('Error saving deduction:', error);
      alert('Error saving deduction');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (deduction: CustomDeduction) => {
    setEditingDeduction(deduction);
    setSelectedEmployee(deduction.employeeId);
    setDeductionName(deduction.name);
    setDeductionAmount(deduction.amount.toString());
    setDeductionType(deduction.type);
    setDeductionMonth(deduction.month || new Date().getMonth() + 1);
    setDeductionYear(deduction.year || new Date().getFullYear());
    setIsRecurring(deduction.isRecurring);
    setNumberOfMonths(deduction.numberOfMonths || 1);
    setReason(deduction.reason || '');
    setViewMode('create');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete deduction "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteCustomDeduction(id);
      await logActivity('delete', 'deduction', `Deleted deduction ${name}`);
      alert('Deduction deleted successfully');
      loadDeductionHistory();
    } catch (error) {
      console.error('Error deleting deduction:', error);
      alert('Error deleting deduction');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLetter = async (deduction: CustomDeduction) => {
    if (!preparedBy || !approvedBy) {
      alert('Please enter Prepared By and Approved By names before printing the letter.');
      return;
    }

    try {
      await printDeductionLetter(deduction, preparedBy, preparedByPosition, approvedBy, approvedByPosition);
      await logActivity('print', 'deduction', `Printed deduction letter for ${deduction.employeeName}`);
    } catch (error) {
      console.error('Error printing letter:', error);
      alert('Error printing letter');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = deductionHistory.filter(d =>
    d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.employeeIdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">Deductions Management</h1>
        <p className="text-secondary-600">Manage custom payroll deductions for employees</p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => setViewMode('create')}
          variant={viewMode === 'create' ? 'primary' : 'secondary'}
        >
          <Save className="w-4 h-4 mr-2" />
          Add Deduction
        </Button>
        <Button
          onClick={() => setViewMode('history')}
          variant={viewMode === 'history' ? 'primary' : 'secondary'}
        >
          <History className="w-4 h-4 mr-2" />
          View History
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search by employee name, ID, or deduction name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-md"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Prepared By"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
              />
              <input
                type="text"
                placeholder="Position"
                value={preparedByPosition}
                onChange={(e) => setPreparedByPosition(e.target.value)}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
              />
              <input
                type="text"
                placeholder="Approved By"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
              />
              <input
                type="text"
                placeholder="Position"
                value={approvedByPosition}
                onChange={(e) => setApprovedByPosition(e.target.value)}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'create' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Employee *</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    <option value="">Select Employee</option>
                    {filteredEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Deduction Name *</label>
                  <input
                    type="text"
                    value={deductionName}
                    onChange={(e) => setDeductionName(e.target.value)}
                    placeholder="e.g., Loan Repayment, Equipment Damage"
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Amount *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                    <input
                      type="number"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Type *</label>
                  <select
                    value={deductionType}
                    onChange={(e) => setDeductionType(e.target.value as 'fixed' | 'percentage')}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage of Salary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Month</label>
                  <select
                    value={deductionMonth}
                    onChange={(e) => setDeductionMonth(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={deductionYear}
                    onChange={(e) => setDeductionYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-secondary-700">Recurring Deduction (applies every month)</span>
                  </label>
                </div>

                {isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Number of Months *</label>
                    <input
                      type="number"
                      value={numberOfMonths}
                      onChange={(e) => setNumberOfMonths(Number(e.target.value))}
                      min="1"
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Reason (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason for this deduction..."
                    rows={3}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving || loading}>
                  {saving ? 'Saving...' : editingDeduction ? 'Update Deduction' : 'Add Deduction'}
                </Button>
                {editingDeduction && (
                  <Button
                    onClick={() => {
                      setEditingDeduction(null);
                      setSelectedEmployee('');
                      setDeductionName('');
                      setDeductionAmount('');
                      setDeductionType('fixed');
                      setIsRecurring(false);
                      setReason('');
                    }}
                    variant="secondary"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Employee</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">ID</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Deduction Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Period</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Recurring</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Months</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Reason</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Created</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-sm text-secondary-500">
                        No deduction records found
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((deduction) => (
                      <tr key={deduction.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-4 text-sm text-secondary-900 font-medium">
                          {deduction.employeeName}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600">
                          {deduction.employeeIdNumber}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-900">
                          {deduction.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-900 font-medium">
                          {deduction.amount.toFixed(2)} {deduction.type === 'percentage' ? '%' : ''}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600">
                          {deduction.type === 'fixed' ? 'Fixed' : 'Percentage'}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600">
                          {deduction.month && deduction.year ? `${months[deduction.month - 1]} ${deduction.year}` : 'All periods'}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {deduction.isRecurring ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-secondary-100 text-secondary-600 rounded-full text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600">
                          {deduction.isRecurring ? deduction.numberOfMonths || '-' : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600 max-w-xs truncate">
                          {deduction.reason || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600">
                          {deduction.createdAt ? formatDate(deduction.createdAt) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEdit(deduction)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handlePrintLetter(deduction)}
                              variant="ghost"
                              size="sm"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(deduction.id!, deduction.name)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
