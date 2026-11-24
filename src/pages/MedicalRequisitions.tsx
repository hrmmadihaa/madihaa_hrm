import { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Edit, Check, Stethoscope, FileText, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { getEmployees } from '../lib/employees';
import { getAllWorkLocations } from '../lib/workLocation';
import {
  addMedicalRequisition,
  getMedicalRequisitions,
  updateMedicalRequisition,
  approveMedicalRequisition,
  assignMedicalRequisition,
  completeMedicalRequisition,
  deleteMedicalRequisition,
  type MedicalRequisition,
  type Consultation,
  type Medicine
} from '../lib/medicalRequisition';
import { printMedicalRequisition } from '../lib/printMedicalRequisition';
import { logActivity } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';

export const MedicalRequisitions = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [hrStaff, setHrStaff] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<MedicalRequisition[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'consultation'>('list');
  const [selectedRequisition, setSelectedRequisition] = useState<MedicalRequisition | null>(null);

  // Form state
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('');
  const [staffSickness, setStaffSickness] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [requestedByPosition, setRequestedByPosition] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [approvedByPosition, setApprovedByPosition] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [approvalModal, setApprovalModal] = useState<{ show: boolean; requisitionId: string }>({ show: false, requisitionId: '' });
  const [viewConsultationModal, setViewConsultationModal] = useState<{ show: boolean; requisition: MedicalRequisition | null }>({ show: false, requisition: null });
  const [assignModal, setAssignModal] = useState<{ show: boolean; requisitionId: string; assignedTo: string }>({ show: false, requisitionId: '', assignedTo: '' });

  // Consultation state
  const [hospital, setHospital] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorComments, setDoctorComments] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [medicineTaken, setMedicineTaken] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', tablets: 0, value: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Starting to load data...');
      const [empData, locations, reqData] = await Promise.all([
        getEmployees(),
        getAllWorkLocations(),
        getMedicalRequisitions()
      ]);
      console.log('Data loaded:', { empData, locations, reqData });
      setEmployees(empData.filter(emp => emp.status === 'active'));
      setWorkLocations(locations || []);
      setRequisitions(reqData);
      console.log('Work locations loaded:', locations);

      // Filter HR staff
      const hrLocation = locations.find(loc => loc.name.toLowerCase() === 'human resources');
      if (hrLocation && hrLocation.assignedStaff) {
        const hrEmployees = empData.filter(emp => hrLocation.assignedStaff.includes(emp.id));
        setHrStaff(hrEmployees);
      } else {
        setHrStaff(empData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleStaffNameChange = (value: string) => {
    setStaffName(value);
    setStaffSearchTerm(value);
    // Auto-populate department and designation when staff name is selected
    if (value) {
      const selectedEmployee = employees.find(emp => emp.fullName === value);
      if (selectedEmployee) {
        setStaffDesignation(selectedEmployee.designation || selectedEmployee.position || '');
        // Find the employee's work location
        const employeeLocation = workLocations.find(loc => 
          loc.assignedStaff?.includes(selectedEmployee.id)
        );
        if (employeeLocation) {
          setDepartment(employeeLocation.name);
        }
      }
    }
  };

  const addMedicineRow = () => {
    setMedicines(prev => [...prev, { name: '', tablets: 0, value: 0 }]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedicineRow = (index: number, field: keyof Medicine, value: string | number) => {
    setMedicines(prev => prev.map((med, i) => (i === index ? { ...med, [field]: value } : med)));
  };

  const handleSave = async () => {
    if (!department || !date || !staffName || !staffSickness || !requestedBy) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      // Find the selected employee to get their ID
      const selectedEmployee = employees.find(emp => emp.fullName === staffName);
      
      const requisitionData: Omit<MedicalRequisition, 'id' | 'createdAt' | 'updatedAt'> = {
        department,
        date: new Date(date),
        staff: [{
          id: crypto.randomUUID(),
          name: staffName,
          designation: staffDesignation,
          sickness: staffSickness
        }],
        remarks: remarks || undefined,
        requestedBy,
        requestedByPosition: requestedByPosition || undefined,
        approvedBy: approvedBy || undefined,
        approvedByPosition: approvedByPosition || undefined,
        ...(assignedTo && { assignedTo }),
        status: 'pending',
        ...(selectedEmployee && { employeeId: selectedEmployee.employeeId })
      };

      if (selectedRequisition) {
        await updateMedicalRequisition(selectedRequisition.id!, requisitionData);
        await logActivity('update', 'medical_requisition', `Updated medical requisition for ${department}`);
        alert('Medical requisition updated successfully');
      } else {
        await addMedicalRequisition(requisitionData);
        await logActivity('create', 'medical_requisition', `Created medical requisition for ${department}`);
        alert('Medical requisition created successfully');
      }

      resetForm();
      await loadData();
      setViewMode('list');
    } catch (error) {
      console.error('Error saving medical requisition:', error);
      alert('Error saving medical requisition');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovalModal({ show: true, requisitionId: id });
  };

  const confirmApproval = async () => {
    if (!approvedBy) {
      alert('Please enter Approved By name');
      return;
    }

    try {
      await approveMedicalRequisition(approvalModal.requisitionId, approvedBy, approvedByPosition);
      await logActivity('approve', 'medical_requisition', `Approved medical requisition ${approvalModal.requisitionId}`);
      alert('Medical requisition approved successfully');
      setApprovalModal({ show: false, requisitionId: '' });
      setApprovedBy('');
      setApprovedByPosition('');
      await loadData();
    } catch (error) {
      console.error('Error approving requisition:', error);
      alert('Error approving requisition');
    }
  };

  const handleAssign = async (id: string) => {
    if (!assignedTo) {
      alert('Please select an HR staff to assign');
      return;
    }

    try {
      await assignMedicalRequisition(id, assignedTo);
      await logActivity('assign', 'medical_requisition', `Assigned medical requisition ${id} to ${assignedTo}`);
      alert('Medical requisition assigned successfully');
      await loadData();
    } catch (error) {
      console.error('Error assigning requisition:', error);
      alert('Error assigning requisition');
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedRequisition) return;

    if (!hospital || !doctorName || !visitTime) {
      alert('Please fill in hospital, doctor name, and visit time');
      return;
    }

    const validMedicines = medicineTaken ? medicines.filter(m => m.name && m.tablets > 0) : [];

    try {
      setSaving(true);
      const consultation: Consultation = {
        hospital,
        doctorName,
        doctorComments: doctorComments || '',
        visitTime: new Date(visitTime),
        medicineTaken,
        medicines: medicineTaken ? validMedicines : undefined
      };

      await completeMedicalRequisition(selectedRequisition.id!, consultation);
      await logActivity('complete', 'medical_requisition', `Completed consultation for medical requisition ${selectedRequisition.id}`);
      alert('Consultation details saved successfully');
      await loadData();
      setViewMode('list');
      resetConsultationForm();
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Error saving consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medical requisition?')) {
      return;
    }

    try {
      await deleteMedicalRequisition(id);
      await logActivity('delete', 'medical_requisition', `Deleted medical requisition ${id}`);
      alert('Medical requisition deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting requisition:', error);
      alert('Error deleting requisition');
    }
  };

  const handlePrint = async (requisition: MedicalRequisition) => {
    try {
      await printMedicalRequisition(requisition);
      await logActivity('print', 'medical_requisition', `Printed medical requisition ${requisition.id}`);
    } catch (error) {
      console.error('Error printing requisition:', error);
      alert('Error printing requisition');
    }
  };

  const handleEdit = (requisition: MedicalRequisition) => {
    setSelectedRequisition(requisition);
    setDepartment(requisition.department);
    setDate(requisition.date.toISOString().split('T')[0]);
    setRemarks(requisition.remarks || '');
    if (requisition.staff && requisition.staff.length > 0) {
      setStaffName(requisition.staff[0].name);
      setStaffDesignation(requisition.staff[0].designation);
      setStaffSickness(requisition.staff[0].sickness);
    }
    setRequestedBy(requisition.requestedBy);
    setRequestedByPosition(requisition.requestedByPosition || '');
    setApprovedBy(requisition.approvedBy || '');
    setApprovedByPosition(requisition.approvedByPosition || '');
    setAssignedTo(requisition.assignedTo || '');
    setViewMode('edit');
  };

  const resetForm = () => {
    setSelectedRequisition(null);
    setDepartment('');
    setDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    setStaffName('');
    setStaffDesignation('');
    setStaffSickness('');
    setRequestedBy('');
    setRequestedByPosition('');
    setApprovedBy('');
    setApprovedByPosition('');
    setAssignedTo('');
  };

  const resetConsultationForm = () => {
    setHospital('');
    setDoctorName('');
    setDoctorComments('');
    setVisitTime('');
    setMedicineTaken(false);
    setMedicines([{ name: '', tablets: 0, value: 0 }]);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">
          {viewMode === 'list' ? 'Medical Requisitions' : (viewMode === 'create' ? 'New Medical Requisition' : 'Edit Medical Requisition')}
        </h1>
        <p className="text-secondary-600">
          {viewMode === 'list' ? 'Manage medical requisitions and approvals' : 'Fill in the form to create a medical requisition'}
        </p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => { resetForm(); setViewMode('create'); }}
          variant={viewMode === 'create' ? 'primary' : 'secondary'}
          className="sm:w-auto w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Requisition
        </Button>
        <Button
          onClick={() => setViewMode('list')}
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          className="sm:w-auto w-full"
        >
          <FileText className="w-4 h-4 mr-2" />
          View All
        </Button>
      </div>

      <Card>
        <CardContent>
          {viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Department</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Staff Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {requisitions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-secondary-500">
                        No medical requisitions found
                      </td>
                    </tr>
                  ) : (
                    requisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-4 text-sm text-secondary-900 font-medium">{req.department}</td>
                        <td className="px-4 py-4 text-sm text-secondary-600">{formatDate(req.date)}</td>
                        <td className="px-4 py-4 text-sm text-secondary-600">{req.staff[0]?.name || '-'}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(req.status)}`}>
                            {getStatusLabel(req.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary-600">{req.assignedTo || '-'}</td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => handleEdit(req)} variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handlePrint(req)} variant="ghost" size="sm">
                              <Printer className="w-4 h-4" />
                            </Button>
                            {req.status === 'pending' && (
                              <Button onClick={() => handleApprove(req.id!)} variant="ghost" size="sm" className="text-green-600">
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {req.status === 'approved' && !req.assignedTo && (
                              <Button onClick={() => setAssignModal({ show: true, requisitionId: req.id!, assignedTo: '' })} variant="ghost" size="sm" className="text-orange-600">
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}
                            {(req.status === 'approved' || req.status === 'in_progress') && req.assignedTo && !req.consultation && (
                              <Button onClick={() => { setSelectedRequisition(req); setViewMode('consultation'); }} variant="ghost" size="sm" className="text-blue-600">
                                <Stethoscope className="w-4 h-4" />
                              </Button>
                            )}
                            {req.consultation && (
                              <Button onClick={() => setViewConsultationModal({ show: true, requisition: req })} variant="ghost" size="sm" className="text-purple-600">
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button onClick={() => handleDelete(req.id!)} variant="ghost" size="sm" className="text-red-600">
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

          {(viewMode === 'create' || viewMode === 'edit') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Department</option>
                    {workLocations && workLocations.length > 0 ? (
                      workLocations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No departments available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Staff Name *</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => handleStaffNameChange(e.target.value)}
                    placeholder="Search or type name"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {staffSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {employees
                        .filter(emp => 
                          emp.fullName.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                          emp.employeeId.toLowerCase().includes(staffSearchTerm.toLowerCase())
                        )
                        .slice(0, 5)
                        .map(emp => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              handleStaffNameChange(emp.fullName);
                              setStaffSearchTerm('');
                            }}
                            className="px-3 py-2 hover:bg-secondary-100 cursor-pointer text-sm"
                          >
                            {emp.fullName} ({emp.employeeId})
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    placeholder="Designation"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Detail of Sickness *</label>
                  <input
                    type="text"
                    value={staffSickness}
                    onChange={(e) => setStaffSickness(e.target.value)}
                    placeholder="Detail of sickness"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Requested By *</label>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={requestedByPosition}
                    onChange={(e) => setRequestedByPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={approvedByPosition}
                    onChange={(e) => setApprovedByPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {selectedRequisition && selectedRequisition.status === 'approved' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Assign HR Staff</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select HR Staff</option>
                    {hrStaff.map(emp => (
                      <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                    ))}
                  </select>
                  {assignedTo && (
                    <Button onClick={() => handleAssign(selectedRequisition.id!)} variant="primary" size="sm" className="mt-2">
                      Assign
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : selectedRequisition ? 'Update' : 'Save'}
                </Button>
                <Button onClick={() => { resetForm(); setViewMode('list'); }} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {viewMode === 'consultation' && selectedRequisition && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Update Consultation Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Hospital *</label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Visit Time *</label>
                  <input
                    type="datetime-local"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Doctor Comments</label>
                <textarea
                  value={doctorComments}
                  onChange={(e) => setDoctorComments(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={medicineTaken}
                    onChange={(e) => setMedicineTaken(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">Medicine Taken</span>
                </label>
              </div>

              {medicineTaken && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Medicines</label>
                  <div className="space-y-2">
                    {medicines.map((med, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => updateMedicineRow(index, 'name', e.target.value)}
                          placeholder="Medicine Name"
                          className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="number"
                          value={med.tablets}
                          onChange={(e) => updateMedicineRow(index, 'tablets', parseInt(e.target.value) || 0)}
                          placeholder="Tablets"
                          className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="number"
                          value={med.value}
                          onChange={(e) => updateMedicineRow(index, 'value', parseFloat(e.target.value) || 0)}
                          placeholder="Value (MVR)"
                          className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <Button onClick={() => removeMedicineRow(index)} variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={addMedicineRow} variant="secondary" size="sm" className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleCompleteConsultation} disabled={saving}>
                  {saving ? 'Saving...' : 'Complete Consultation'}
                </Button>
                <Button onClick={() => { setViewMode('list'); resetConsultationForm(); }} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      {approvalModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Approve Medical Requisition</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Approved By *</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={approvedByPosition}
                    onChange={(e) => setApprovedByPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={confirmApproval} className="flex-1">
                  Approve
                </Button>
                <Button onClick={() => setApprovalModal({ show: false, requisitionId: '' })} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Consultation Modal */}
      {viewConsultationModal.show && viewConsultationModal.requisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Consultation Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-secondary-600">Hospital</p>
                    <p className="font-medium text-secondary-900">{viewConsultationModal.requisition.consultation?.hospital}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600">Doctor</p>
                    <p className="font-medium text-secondary-900">{viewConsultationModal.requisition.consultation?.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600">Visit Time</p>
                    <p className="font-medium text-secondary-900">{formatDate(viewConsultationModal.requisition.consultation?.visitTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600">Medicine Taken</p>
                    <p className="font-medium text-secondary-900">{viewConsultationModal.requisition.consultation?.medicineTaken ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {viewConsultationModal.requisition.consultation?.doctorComments && (
                  <div>
                    <p className="text-sm text-secondary-600">Doctor Comments</p>
                    <p className="text-secondary-900">{viewConsultationModal.requisition.consultation.doctorComments}</p>
                  </div>
                )}
                {viewConsultationModal.requisition.consultation?.medicineTaken && viewConsultationModal.requisition.consultation.medicines && viewConsultationModal.requisition.consultation.medicines.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-secondary-700 mb-2">Medicines Prescribed</h5>
                    <div className="space-y-2">
                      {viewConsultationModal.requisition.consultation.medicines.map((med, idx) => (
                        <div key={idx} className="bg-secondary-50 rounded p-3 text-sm">
                          <p className="font-medium text-secondary-900">{med.name}</p>
                          <p className="text-secondary-600">Tablets: {med.tablets} | Value: MVR {med.value.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={() => setViewConsultationModal({ show: false, requisition: null })} variant="secondary" className="flex-1">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign HR Staff Modal */}
      {assignModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Assign HR Staff</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Select HR Staff</label>
                  <select
                    value={assignModal.assignedTo}
                    onChange={(e) => setAssignModal({ ...assignModal, assignedTo: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select HR Staff</option>
                    {hrStaff.map(emp => (
                      <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={async () => {
                    if (!assignModal.assignedTo) {
                      alert('Please select an HR staff');
                      return;
                    }
                    try {
                      await assignMedicalRequisition(assignModal.requisitionId, assignModal.assignedTo);
                      await logActivity('assign', 'medical_requisition', `Assigned medical requisition ${assignModal.requisitionId} to ${assignModal.assignedTo}`);
                      alert('Medical requisition assigned successfully');
                      await loadData();
                      setAssignModal({ show: false, requisitionId: '', assignedTo: '' });
                    } catch (error) {
                      console.error('Error assigning requisition:', error);
                      alert('Error assigning requisition');
                    }
                  }} 
                  className="flex-1"
                >
                  Assign
                </Button>
                <Button onClick={() => setAssignModal({ show: false, requisitionId: '', assignedTo: '' })} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
