import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Printer, Edit, Trash2, AlertTriangle, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { getEmployees } from '../lib/employees';
import { getDisciplinaryActions, createDisciplinaryAction, updateDisciplinaryAction, deleteDisciplinaryAction } from '../lib/disciplinary';
import type { DisciplinaryAction, DisciplinaryType, DisciplinarySeverity, DisciplinaryStatus, Employee } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Disciplinary = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState<DisciplinaryAction | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    type: 'verbal_warning' as DisciplinaryType,
    severity: 'minor' as DisciplinarySeverity,
    incidentDate: new Date().toISOString().split('T')[0],
    reportedDate: new Date().toISOString().split('T')[0],
    description: '',
    actionTaken: '',
    reportedBy: '',
    status: 'pending' as DisciplinaryStatus,
    warningLetterIssued: false,
    suspensionDays: '',
    fineAmount: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, discData] = await Promise.all([getEmployees(), getDisciplinaryActions()]);
      setEmployees(empData);
      setDisciplinaryActions(discData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setSelectedEmployee(employee || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    try {
      const actionData = {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.fullName,
        employeeDepartment: selectedEmployee.department,
        employeeDesignation: selectedEmployee.designation,
        type: formData.type,
        severity: formData.severity,
        incidentDate: new Date(formData.incidentDate),
        reportedDate: new Date(formData.reportedDate),
        description: formData.description,
        actionTaken: formData.actionTaken,
        reportedBy: formData.reportedBy,
        status: formData.status,
        warningLetterIssued: formData.warningLetterIssued,
        suspensionDays: formData.suspensionDays ? parseInt(formData.suspensionDays) : undefined,
        fineAmount: formData.fineAmount ? parseFloat(formData.fineAmount) : undefined,
        notes: formData.notes,
      };

      if (editingAction) {
        await updateDisciplinaryAction(editingAction.id, actionData);
      } else {
        await createDisciplinaryAction(actionData);
      }

      setShowForm(false);
      setEditingAction(null);
      resetForm();
      loadData();
    } catch (error) {
      alert('Failed to save disciplinary action: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (action: DisciplinaryAction) => {
    setEditingAction(action);
    setFormData({
      type: action.type,
      severity: action.severity,
      incidentDate: action.incidentDate instanceof Date ? action.incidentDate.toISOString().split('T')[0] : action.incidentDate,
      reportedDate: action.reportedDate instanceof Date ? action.reportedDate.toISOString().split('T')[0] : action.reportedDate,
      description: action.description,
      actionTaken: action.actionTaken,
      reportedBy: action.reportedBy,
      status: action.status,
      warningLetterIssued: action.warningLetterIssued,
      suspensionDays: action.suspensionDays?.toString() || '',
      fineAmount: action.fineAmount?.toString() || '',
      notes: action.notes || '',
    });
    const employee = employees.find(emp => emp.id === action.employeeId);
    setSelectedEmployee(employee || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this disciplinary action?')) {
      try {
        await deleteDisciplinaryAction(id);
        loadData();
      } catch (error) {
        alert('Failed to delete: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'verbal_warning' as DisciplinaryType,
      severity: 'minor' as DisciplinarySeverity,
      incidentDate: new Date().toISOString().split('T')[0],
      reportedDate: new Date().toISOString().split('T')[0],
      description: '',
      actionTaken: '',
      reportedBy: '',
      status: 'pending' as DisciplinaryStatus,
      warningLetterIssued: false,
      suspensionDays: '',
      fineAmount: '',
      notes: '',
    });
    setSelectedEmployee(null);
  };

  const handlePrint = (action: DisciplinaryAction) => {
    const doc = new jsPDF();
    
    // Add Logo
    const logo = new Image();
    logo.src = '/madihaa (1).jpg';
    logo.onload = () => {
      doc.addImage(logo, 'JPEG', 20, 10, 30, 30);
      
      // Company Letterhead
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MADIHAA COMPANY (PTE) LTD', 105, 20, { align: 'center' });
    
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('M.Madihaa, Shaheed Ali Higun, Malè, Republic of Maldives', 105, 28, { align: 'center' });
      doc.text('Tel: 3328827 | Fax: 3313936 | Email: madicom@dhivehinet.net.mv | Web: www.madihaaa.com', 105, 34, { align: 'center' });
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Disciplinary Action Report', 105, 55, { align: 'center' });
      
      // Line separator
      doc.setLineWidth(0.3);
      doc.line(20, 60, 190, 60);
      
      // Employee Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Information', 20, 70);
      doc.setFont('helvetica', 'normal');
      
      const employeeInfo = [
        ['Name:', action.employeeName],
        ['Department:', action.employeeDepartment],
        ['Designation:', action.employeeDesignation],
        ['Employee ID:', action.employeeId],
      ];
      
      let yPos = 80;
      employeeInfo.forEach(([label, value]) => {
        doc.text(label, 20, yPos);
        doc.text(value, 60, yPos);
        yPos += 8;
      });
      
      // Incident Details
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Incident Details', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      const incidentInfo = [
        ['Type:', action.type === 'verbal_warning' ? 'Verbal Warning' :
                   action.type === 'written_warning_1' ? 'Written Warning 1' :
                   action.type === 'written_warning_2' ? 'Written Warning 2' :
                   action.type === 'written_warning_3' ? 'Written Warning 3' :
                   action.type === 'final_warning' ? 'Final Warning' :
                   action.type === 'termination' ? 'Termination' : action.type],
        ['Severity:', action.severity.toUpperCase()],
        ['Incident Date:', action.incidentDate instanceof Date ? action.incidentDate.toLocaleDateString() : 'N/A'],
        ['Reported Date:', action.reportedDate instanceof Date ? action.reportedDate.toLocaleDateString() : 'N/A'],
        ['Status:', action.status.toUpperCase()],
      ];
      
      incidentInfo.forEach(([label, value]) => {
        doc.text(label, 20, yPos);
        doc.text(value, 60, yPos);
        yPos += 8;
      });
      
      // Description
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 8;
      const descriptionLines = doc.splitTextToSize(action.description, 170);
      doc.text(descriptionLines, 20, yPos);
      yPos += descriptionLines.length * 7 + 5;
      
      // Action Taken
      doc.setFont('helvetica', 'bold');
      doc.text('Action Taken:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 8;
      const actionLines = doc.splitTextToSize(action.actionTaken, 170);
      doc.text(actionLines, 20, yPos);
      yPos += actionLines.length * 7 + 5;
      
      // Additional Details
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Details', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 10;
      
      const additionalInfo = [
        ['Reported By:', action.reportedBy],
        ['Approved By:', action.approvedBy || 'N/A'],
        ['Warning Letter Issued:', action.warningLetterIssued ? 'Yes' : 'No'],
      ];
      
      if (action.suspensionDays) {
        additionalInfo.push(['Suspension Days:', action.suspensionDays.toString()]);
      }
      if (action.fineAmount) {
        additionalInfo.push(['Fine Amount:', `$${action.fineAmount}`]);
      }
      
      additionalInfo.forEach(([label, value]) => {
        doc.text(label, 20, yPos);
        doc.text(value, 70, yPos);
        yPos += 8;
      });
      
      // Notes
      if (action.notes) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 8;
        const notesLines = doc.splitTextToSize(action.notes, 170);
        doc.text(notesLines, 20, yPos);
      }
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });
      
      // Open PDF in new tab for printing instead of downloading
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    };
  };

  const filteredActions = disciplinaryActions.filter(action =>
    action.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.employeeDepartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const severityColors = {
    minor: 'bg-blue-100 text-blue-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    serious: 'bg-orange-100 text-orange-800',
    severe: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    investigation: 'bg-purple-100 text-purple-800',
    confirmed: 'bg-green-100 text-green-800',
    appealed: 'bg-orange-100 text-orange-800',
    resolved: 'bg-blue-100 text-blue-800',
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
          <h1 className="text-3xl font-bold text-secondary-900">Disciplinary Actions</h1>
          <p className="text-secondary-600 mt-1">Manage employee disciplinary records</p>
        </div>
        <Button onClick={() => { setShowForm(true); resetForm(); setEditingAction(null); }}>
          <Plus className="w-5 h-5 mr-2" />
          New Disciplinary Action
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-7xl my-8"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAction ? 'Edit Disciplinary Action' : 'New Disciplinary Action'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Employee *
                    </label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Search employee by name, ID, or department..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        icon={<Search className="w-5 h-5 text-secondary-400" />}
                      />
                      <select
                        required
                        value={selectedEmployee?.id || ''}
                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Choose an employee...</option>
                        {employees
                          .filter(emp =>
                            emp.fullName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                            emp.employeeId.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                            emp.department.toLowerCase().includes(employeeSearchTerm.toLowerCase())
                          )
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} - {emp.employeeId} - {emp.department}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Selected Employee Info */}
                  {selectedEmployee && (
                    <Card>
                      <CardContent className="p-4 bg-secondary-50">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-secondary-600">Name</p>
                            <p className="font-medium">{selectedEmployee.fullName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-secondary-600">Department</p>
                            <p className="font-medium">{selectedEmployee.department}</p>
                          </div>
                          <div>
                            <p className="text-sm text-secondary-600">Designation</p>
                            <p className="font-medium">{selectedEmployee.designation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type of Action *
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as DisciplinaryType })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="verbal_warning">Verbal Warning</option>
                        <option value="written_warning_1">Written Warning 1</option>
                        <option value="written_warning_2">Written Warning 2</option>
                        <option value="written_warning_3">Written Warning 3</option>
                        <option value="final_warning">Final Warning</option>
                        <option value="termination">Termination</option>
                      </select>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity *
                      </label>
                      <select
                        required
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as DisciplinarySeverity })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="minor">Minor</option>
                        <option value="moderate">Moderate</option>
                        <option value="serious">Serious</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Incident Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Incident Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.incidentDate}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    {/* Reported Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reported Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.reportedDate}
                        onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as DisciplinaryStatus })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="investigation">Investigation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="appealed">Appealed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    {/* Reported By */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reported By *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.reportedBy}
                        onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Name of reporter"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description of Incident *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the incident in detail..."
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Action Taken */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Taken *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.actionTaken}
                      onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the disciplinary action taken..."
                    />
                  </div>

                  {/* Additional Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Actions
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="warningLetter"
                          checked={formData.warningLetterIssued}
                          onChange={(e) => setFormData({ ...formData, warningLetterIssued: e.target.checked })}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="warningLetter" className="text-sm font-medium text-gray-700">
                          Warning Letter Issued
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Suspension Days
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.suspensionDays}
                            onChange={(e) => setFormData({ ...formData, suspensionDays: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Number of days"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fine Amount (MVR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.fineAmount}
                            onChange={(e) => setFormData({ ...formData, fineAmount: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Any additional notes or comments..."
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setShowForm(false); resetForm(); setEditingAction(null); }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAction ? 'Update' : 'Save'} Disciplinary Action
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employee name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5 text-secondary-400" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disciplinary Actions List */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600">No disciplinary actions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900">{action.employeeName}</h3>
                          <p className="text-sm text-secondary-600">{action.employeeId}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-secondary-600">Department:</span>
                          <span className="ml-2 font-medium">{action.employeeDepartment}</span>
                        </div>
                        <div>
                          <span className="text-secondary-600">Designation:</span>
                          <span className="ml-2 font-medium">{action.employeeDesignation}</span>
                        </div>
                        <div>
                          <span className="text-secondary-600">Type:</span>
                          <span className="ml-2 font-medium">
                            {action.type === 'verbal_warning' ? 'Verbal Warning' :
                             action.type === 'written_warning_1' ? 'Written Warning 1' :
                             action.type === 'written_warning_2' ? 'Written Warning 2' :
                             action.type === 'written_warning_3' ? 'Written Warning 3' :
                             action.type === 'final_warning' ? 'Final Warning' :
                             action.type === 'termination' ? 'Termination' : action.type}
                          </span>
                        </div>
                        <div>
                          <span className="text-secondary-600">Incident Date:</span>
                          <span className="ml-2 font-medium">
                            {action.incidentDate instanceof Date ? action.incidentDate.toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-secondary-600">Description:</p>
                        <p className="text-sm text-secondary-900 mt-1 line-clamp-2">{action.description}</p>
                      </div>
                    </div>

                    {/* Badges and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${severityColors[action.severity]}`}>
                          {action.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[action.status]}`}>
                          {action.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrint(action)}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Print"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(action)}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(action.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
