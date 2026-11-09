import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { getEmployees } from '../lib/employees';
import { Button } from '../components/ui/Button';
import { DollarSign, History, Plus } from 'lucide-react';

interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  otAllowances: number;
  otherAllowances: number;
  attendanceAllowance: number;
  livingAllowance: number;
  foodAllowance: number;
  fridayAllowance: number;
  currency: string;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt?: Date;
}

interface SalaryIncrement {
  id: string;
  employeeId: string;
  employeeName: string;
  previousSalary: number;
  newSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  reason: string;
  effectiveDate: Date;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt?: Date;
}

export const Salary: React.FC = () => {
  const { isSuperAdmin, isHRManager, isSupervisorOrAbove } = usePermissions();
  const { user } = useAuth();
  const [showIncrementForm, setShowIncrementForm] = useState(false);
  const [showEditSalaryForm, setShowEditSalaryForm] = useState(false);
  const [showIncrementLetter, setShowIncrementLetter] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salaryIncrements, setSalaryIncrements] = useState<SalaryIncrement[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncrement, setSelectedIncrement] = useState<SalaryIncrement | null>(null);
  const [selectedApprover, setSelectedApprover] = useState('chairman');
  const [historyEmployeeId, setHistoryEmployeeId] = useState('');

  const [incrementForm, setIncrementForm] = useState({
    employeeId: '',
    employeeName: '',
    currentSalary: 0,
    newSalary: '',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [editSalaryForm, setEditSalaryForm] = useState({
    id: '',
    employeeId: '',
    employeeName: '',
    basicSalary: 0,
    otAllowances: 0,
    otherAllowances: 0,
    attendanceAllowance: 0,
    livingAllowance: 0,
    foodAllowance: 0,
    fridayAllowance: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load employees
      const employeesData = await getEmployees();
      setEmployees(employeesData);

      // Load salary records
      const salaryQuery = query(collection(db, 'salary_records'), orderBy('createdAt', 'desc'));
      const salarySnapshot = await getDocs(salaryQuery);
      const salaryData = salarySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        effectiveDate: doc.data().effectiveDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as SalaryRecord[];
      setSalaryRecords(salaryData);

      // Load salary increments
      const incrementQuery = query(collection(db, 'salary_increments'), orderBy('createdAt', 'desc'));
      const incrementSnapshot = await getDocs(incrementQuery);
      const incrementData = incrementSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        effectiveDate: doc.data().effectiveDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as SalaryIncrement[];
      setSalaryIncrements(incrementData);
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditSalary = (salaryRecord: SalaryRecord) => {
    setEditSalaryForm({
      id: salaryRecord.id,
      employeeId: salaryRecord.employeeId,
      employeeName: salaryRecord.employeeName,
      basicSalary: salaryRecord.basicSalary,
      otAllowances: salaryRecord.otAllowances,
      otherAllowances: salaryRecord.otherAllowances,
      attendanceAllowance: salaryRecord.attendanceAllowance,
      livingAllowance: salaryRecord.livingAllowance,
      foodAllowance: salaryRecord.foodAllowance,
      fridayAllowance: salaryRecord.fridayAllowance,
      effectiveDate: salaryRecord.effectiveDate instanceof Date ? 
        salaryRecord.effectiveDate.toISOString().split('T')[0] : 
        new Date(salaryRecord.effectiveDate).toISOString().split('T')[0],
    });
    setShowEditSalaryForm(true);
  };

  const handleSubmitEditSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editSalaryForm.id) {
      alert('Invalid salary record');
      return;
    }

    try {
      await updateDoc(doc(db, 'salary_records', editSalaryForm.id), {
        basicSalary: parseFloat(editSalaryForm.basicSalary.toString()),
        otAllowances: parseFloat(editSalaryForm.otAllowances.toString()),
        otherAllowances: parseFloat(editSalaryForm.otherAllowances.toString()),
        attendanceAllowance: parseFloat(editSalaryForm.attendanceAllowance.toString()),
        livingAllowance: parseFloat(editSalaryForm.livingAllowance.toString()),
        foodAllowance: parseFloat(editSalaryForm.foodAllowance.toString()),
        fridayAllowance: parseFloat(editSalaryForm.fridayAllowance.toString()),
        effectiveDate: new Date(editSalaryForm.effectiveDate),
        updatedAt: new Date(),
      });

      alert('Salary updated successfully');
      setShowEditSalaryForm(false);
      loadData();
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary');
    }
  };

  const handlePrintIncrementLetter = (increment: SalaryIncrement) => {
    setSelectedIncrement(increment);
    setShowIncrementLetter(true);
  };

  const handleSubmitIncrement = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentSalary = incrementForm.currentSalary;
    const newSalary = parseFloat(incrementForm.newSalary);
    const incrementAmount = newSalary - currentSalary;
    const incrementPercentage = currentSalary > 0 ? (incrementAmount / currentSalary) * 100 : 0;

    if (newSalary <= currentSalary) {
      alert('New salary must be greater than current salary');
      return;
    }

    try {
      // Create salary increment record
      const newIncrement: Omit<SalaryIncrement, 'id'> = {
        employeeId: incrementForm.employeeId,
        employeeName: incrementForm.employeeName,
        previousSalary: currentSalary,
        newSalary: newSalary,
        incrementAmount,
        incrementPercentage,
        reason: incrementForm.reason,
        effectiveDate: new Date(incrementForm.effectiveDate),
        status: isSuperAdmin() ? 'Approved' : 'Pending',
        approvedBy: isSuperAdmin() ? user?.displayName || user?.email : undefined,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'salary_increments'), newIncrement);

      // If approved, update salary record
      if (isSuperAdmin()) {
        const existingRecord = salaryRecords.find(r => r.employeeId === incrementForm.employeeId);
        if (existingRecord) {
          await updateDoc(doc(db, 'salary_records', existingRecord.id), {
            currentSalary: newSalary,
            effectiveDate: new Date(incrementForm.effectiveDate),
            updatedAt: new Date(),
          });
        } else {
          await addDoc(collection(db, 'salary_records'), {
            employeeId: incrementForm.employeeId,
            employeeName: incrementForm.employeeName,
            currentSalary: newSalary,
            currency: 'MVR',
            effectiveDate: new Date(incrementForm.effectiveDate),
            createdAt: new Date(),
          });
        }
      }

      alert(isSuperAdmin() ? 'Salary increment approved and updated!' : 'Salary increment request submitted for approval');
      setShowIncrementForm(false);
      setIncrementForm({
        employeeId: '',
        employeeName: '',
        currentSalary: 0,
        newSalary: '',
        reason: '',
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('Error submitting increment:', error);
      alert('Failed to submit increment request');
    }
  };

  const handleApproveIncrement = async (incrementId: string) => {
    try {
      const increment = salaryIncrements.find(i => i.id === incrementId);
      if (!increment) return;

      await updateDoc(doc(db, 'salary_increments', incrementId), {
        status: 'Approved',
        approvedBy: user?.displayName || user?.email,
        updatedAt: new Date(),
      });

      // Update salary record
      const existingRecord = salaryRecords.find(r => r.employeeId === increment.employeeId);
      if (existingRecord) {
        await updateDoc(doc(db, 'salary_records', existingRecord.id), {
          currentSalary: increment.newSalary,
          effectiveDate: increment.effectiveDate,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'salary_records'), {
          employeeId: increment.employeeId,
          employeeName: increment.employeeName,
          currentSalary: increment.newSalary,
          currency: 'MVR',
          effectiveDate: increment.effectiveDate,
          createdAt: new Date(),
        });
      }

      alert('Salary increment approved');
      loadData();
    } catch (error) {
      console.error('Error approving increment:', error);
      alert('Failed to approve increment');
    }
  };

  const handleRejectIncrement = async (incrementId: string) => {
    if (!confirm('Are you sure you want to reject this increment?')) return;

    try {
      await updateDoc(doc(db, 'salary_increments', incrementId), {
        status: 'Rejected',
        approvedBy: user?.displayName || user?.email,
        updatedAt: new Date(),
      });

      alert('Salary increment rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting increment:', error);
      alert('Failed to reject increment');
    }
  };

  const getEmployeeSalary = (employeeId: string) => {
    return salaryRecords.find(r => r.employeeId === employeeId);
  };

  const getEmployeeIncrements = (employeeId: string) => {
    return salaryIncrements.filter(i => i.employeeId === employeeId);
  };

  if (!isSupervisorOrAbove()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading salary data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
        <p className="text-gray-600 mt-2">View and manage employee salaries and increments</p>
        <div className="flex gap-3 mt-4">
          {(isHRManager() || isSuperAdmin()) && (
            <Button onClick={() => setShowIncrementForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Salary Increment
            </Button>
          )}
          <Button onClick={() => setShowHistoryModal(true)} variant="secondary">
            <History className="w-4 h-4 mr-2" />
            View Increment History
          </Button>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Current Salaries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">Employee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT Allowances</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other Allowances</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Living</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Friday</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => {
                const salary = getEmployeeSalary(employee.id);
                const totalSalary = salary ?
                  salary.basicSalary + salary.otAllowances + salary.otherAllowances +
                  salary.attendanceAllowance + salary.livingAllowance +
                  salary.foodAllowance + salary.fridayAllowance : 0;
                return (
                  <tr key={employee.id}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.fullName}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.employeeId}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.basicSalary.toLocaleString()}` : 'Not set'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.otAllowances.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.otherAllowances.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.attendanceAllowance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.livingAllowance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.foodAllowance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary ? `MVR ${salary.fridayAllowance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {salary ? `MVR ${totalSalary.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isSuperAdmin() && salary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditSalary(salary)}
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Salary Increment History</h2>
              <Button variant="ghost" onClick={() => setShowHistoryModal(false)}>✕</Button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
              <select
                value={historyEmployeeId}
                onChange={(e) => setHistoryEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an employee...</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.employeeId}
                  </option>
                ))}
              </select>
            </div>

            {historyEmployeeId && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Increment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getEmployeeIncrements(historyEmployeeId).map((increment) => (
                      <tr key={increment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(increment.effectiveDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          MVR {increment.previousSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          MVR {increment.newSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="text-green-600">
                            +MVR {increment.incrementAmount.toLocaleString()} ({increment.incrementPercentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {increment.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            increment.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            increment.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {increment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {increment.status === 'Approved' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handlePrintIncrementLetter(increment)}
                            >
                              Print Letter
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {getEmployeeIncrements(historyEmployeeId).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No increment history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Increments (for HR Manager and Super Admin) */}
      {(isHRManager() || isSuperAdmin()) && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Pending Salary Increments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Increment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryIncrements.filter(i => i.status === 'Pending').map((increment) => (
                  <tr key={increment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {increment.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      MVR {increment.previousSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      MVR {increment.newSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="text-green-600">
                        +MVR {increment.incrementAmount.toLocaleString()} ({increment.incrementPercentage.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {increment.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSuperAdmin() && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveIncrement(increment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRejectIncrement(increment.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {salaryIncrements.filter(i => i.status === 'Pending').length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No pending increments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Increment Form Modal */}
      {showIncrementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Salary Increment</h2>
              <Button variant="ghost" onClick={() => setShowIncrementForm(false)}>✕</Button>
            </div>

            <form onSubmit={handleSubmitIncrement}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                  <select
                    required
                    value={incrementForm.employeeId}
                    onChange={(e) => {
                      const employee = employees.find(emp => emp.id === e.target.value);
                      if (employee) {
                        const salaryRecord = salaryRecords.find(r => r.employeeId === employee.id);
                        const totalSalary = salaryRecord ?
                          salaryRecord.basicSalary + salaryRecord.otAllowances + salaryRecord.otherAllowances +
                          salaryRecord.attendanceAllowance + salaryRecord.livingAllowance +
                          salaryRecord.foodAllowance + salaryRecord.fridayAllowance : 0;
                        setIncrementForm({
                          ...incrementForm,
                          employeeId: employee.id,
                          employeeName: employee.fullName,
                          currentSalary: totalSalary,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an employee...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName} - {employee.employeeId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={`MVR ${incrementForm.currentSalary.toLocaleString()}`}
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Salary</label>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="number"
                      required
                      value={incrementForm.newSalary}
                      onChange={(e) => setIncrementForm({ ...incrementForm, newSalary: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={incrementForm.effectiveDate}
                    onChange={(e) => setIncrementForm({ ...incrementForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={incrementForm.reason}
                    onChange={(e) => setIncrementForm({ ...incrementForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reason for salary increment..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowIncrementForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {isSuperAdmin() ? 'Approve & Update' : 'Submit for Approval'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Salary Form Modal */}
      {showEditSalaryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Edit Salary</h2>
              <Button variant="ghost" onClick={() => setShowEditSalaryForm(false)}>✕</Button>
            </div>

            <form onSubmit={handleSubmitEditSalary}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <input
                    type="text"
                    value={editSalaryForm.employeeName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.basicSalary}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, basicSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OT Allowances</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.otAllowances}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, otAllowances: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.otherAllowances}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, otherAllowances: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Allowance</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.attendanceAllowance}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, attendanceAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Living Allowance</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.livingAllowance}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, livingAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Allowance</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.foodAllowance}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, foodAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Friday Allowance</label>
                    <input
                      type="number"
                      required
                      value={editSalaryForm.fridayAllowance}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, fridayAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                    <input
                      type="date"
                      required
                      value={editSalaryForm.effectiveDate}
                      onChange={(e) => setEditSalaryForm({ ...editSalaryForm, effectiveDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowEditSalaryForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Increment Letter Modal */}
      {showIncrementLetter && selectedIncrement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Salary Increment Letter</h2>
              <Button variant="ghost" onClick={() => setShowIncrementLetter(false)}>✕</Button>
            </div>

            <div id="increment-letter" className="border border-gray-300 p-8 bg-white">
              {/* Letterhead */}
              <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
                <div className="flex items-center justify-center mb-2">
                  <img src="/madihaa (1).jpg" alt="Madihaa Logo" className="h-16 w-16 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Madihaa Pvt Ltd</h1>
                <p className="text-sm text-gray-600">Human Resource Management System</p>
                <p className="text-xs text-gray-500 mt-1">Salary Increment Letter</p>
              </div>

              {/* Letter Content */}
              <div className="space-y-4">
                <div className="text-right text-sm text-gray-600">
                  Date: {new Date().toLocaleDateString()}
                </div>

                <div className="mb-4">
                  <p className="font-semibold">To,</p>
                  <p className="font-semibold">{selectedIncrement.employeeName}</p>
                  <p className="text-sm text-gray-600">Employee ID: {selectedIncrement.employeeId}</p>
                </div>

                <div className="mb-4">
                  <p className="font-semibold mb-2">Subject: Salary Increment Notification</p>
                </div>

                <div className="space-y-2 text-sm">
                  <p>Dear {selectedIncrement.employeeName},</p>
                  <p className="mb-4">
                    We are delighted to inform you that, in recognition of your outstanding performance and valuable contributions to Madihaa Pvt Ltd, your salary has been reviewed and increased. This increment is effective from {new Date(selectedIncrement.effectiveDate).toLocaleDateString()}.
                  </p>

                  <table className="w-full border-collapse border border-gray-300 mb-4">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">Increment Amount</td>
                        <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">+MVR {selectedIncrement.incrementAmount.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">New Total Salary</td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold">MVR {selectedIncrement.newSalary.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="mb-4">
                    We truly appreciate your dedication, hard work, and commitment to excellence. This increment reflects our confidence in your abilities and our desire to see you continue to grow with the organization.
                  </p>

                  <p className="mb-4">
                    We look forward to your continued success and contributions to our team.
                  </p>

                  <p className="mb-6">
                    Sincerely,<br />
                    Management<br />
                    Madihaa Pvt Ltd
                  </p>

                  <div className="mt-8 pt-4 border-t border-gray-300">
                    <p className="font-semibold mb-2">Approved By:</p>
                    {selectedApprover === 'chairman' ? (
                      <div className="mt-8">
                        <p className="font-semibold text-lg">Moosa Ahmed</p>
                        <p className="text-gray-600">Chairman</p>
                      </div>
                    ) : (
                      <div className="mt-8">
                        <p className="font-semibold text-lg">Ahmed Marzooq</p>
                        <p className="text-gray-600">Managing Director</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Approver Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Approver:</label>
              <select
                value={selectedApprover}
                onChange={(e) => setSelectedApprover(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="chairman">Moosa Ahmed - Chairman</option>
                <option value="md">Ahmed Marzooq - Managing Director</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  const printContent = document.getElementById('increment-letter');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Salary Increment Letter</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 20px; }
                              @media print { body { padding: 0; } }
                            </style>
                          </head>
                          <body>${printContent.innerHTML}</body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
                className="flex-1"
              >
                Print Letter
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowIncrementLetter(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
