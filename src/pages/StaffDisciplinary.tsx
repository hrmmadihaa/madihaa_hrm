import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Printer, PenTool, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDisciplinaryActionsByEmployee, updateDisciplinaryAction } from '../lib/disciplinary';
import { getEmployees } from '../lib/employees';
import { getAllWorkLocations } from '../lib/workLocation';
import { printDisciplinaryReport } from '../lib/printDisciplinaryReport';
import type { DisciplinaryAction } from '../types';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePermissions } from '../hooks/usePermissions';

export const StaffDisciplinary = () => {
  const { user } = useAuth();
  const { } = usePermissions();
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState<{ show: boolean; action: DisciplinaryAction | null }>({ show: false, action: null });
  const [signatureModal, setSignatureModal] = useState<{ show: boolean; action: DisciplinaryAction | null }>({ show: false, action: null });
  const [editModal, setEditModal] = useState<{ show: boolean; action: DisciplinaryAction | null }>({ show: false, action: null });
  const [_employees, setEmployees] = useState<any[]>([]);
  const [_workLocations, setWorkLocations] = useState<any[]>([]);
  const [preparedBy, setPreparedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [hrStaff, setHrStaff] = useState<any[]>([]);
  const [headOfficeStaff, setHeadOfficeStaff] = useState<any[]>([]);
  const [signatureData, setSignatureData] = useState<string | undefined>(undefined);
  const [isSigning, setIsSigning] = useState(false);
  const [editFormData, setEditFormData] = useState({
    description: '',
    actionTaken: '',
    notes: '',
    preparedBy: '',
    approvedBy: '',
    employeeSignature: undefined as string | undefined
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all employees to find the one matching the logged-in user
        const employeesData = await getEmployees();
        setEmployees(employeesData);
        
        const currentEmployee = employeesData.find(emp => emp.email === user.email);
        
        if (currentEmployee) {
          // Load disciplinary actions for this employee
          const actions = await getDisciplinaryActionsByEmployee(currentEmployee.employeeId);
          setDisciplinaryActions(actions);
        }

        // Get work locations
        const locations = await getAllWorkLocations();
        setWorkLocations(locations);

        console.log('Work locations:', locations);
        console.log('Employees:', employeesData);

        // Filter HR staff from Human Resources location (case-insensitive)
        const hrLocation = locations.find(loc => loc.name.toLowerCase() === 'human resources');
        console.log('HR Location:', hrLocation);
        if (hrLocation && hrLocation.assignedStaff && hrLocation.assignedStaff.length > 0) {
          const hrEmployees = employeesData.filter(emp => hrLocation.assignedStaff.includes(emp.id));
          console.log('HR Employees:', hrEmployees);
          setHrStaff(hrEmployees);
        } else {
          // Fallback: show all employees if HR location not found or empty
          console.log('HR location not found or empty, showing all employees as fallback');
          setHrStaff(employeesData);
        }

        // Filter Head Office staff from Head Office location (case-insensitive)
        const headOfficeLocation = locations.find(loc => loc.name.toLowerCase() === 'head office');
        console.log('Head Office Location:', headOfficeLocation);
        if (headOfficeLocation && headOfficeLocation.assignedStaff && headOfficeLocation.assignedStaff.length > 0) {
          const headOfficeEmployees = employeesData.filter(emp => headOfficeLocation.assignedStaff.includes(emp.id));
          console.log('Head Office Employees:', headOfficeEmployees);
          setHeadOfficeStaff(headOfficeEmployees);
        } else {
          // Fallback: show all employees if Head Office location not found or empty
          console.log('Head Office location not found or empty, showing all employees as fallback');
          setHeadOfficeStaff(employeesData);
        }
      } catch (error) {
        console.error('Error loading disciplinary actions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.email]);

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

  const handleViewAction = (action: DisciplinaryAction) => {
    setViewModal({ show: true, action });
  };

  const handleCloseViewModal = () => {
    setViewModal({ show: false, action: null });
  };

  const handleOpenSignatureModal = (action: DisciplinaryAction) => {
    setSignatureModal({ show: true, action });
    setPreparedBy(action.preparedBy || '');
    setApprovedBy(action.approvedBy || '');
    setSignatureData(action.employeeSignature || undefined);
  };

  const handleCloseSignatureModal = () => {
    setSignatureModal({ show: false, action: null });
    setPreparedBy('');
    setApprovedBy('');
    setSignatureData(undefined);
  };

  const handleSaveSignatories = async () => {
    if (!signatureModal.action) return;
    
    try {
      setIsSigning(true);
      await updateDoc(doc(db, 'disciplinaryActions', signatureModal.action.id), {
        preparedBy,
        approvedBy,
        employeeSignature: signatureData || undefined,
        signatureDate: signatureData ? new Date() : null
      });
      
      // Update local state
      setDisciplinaryActions(prev => prev.map(action => 
        action.id === signatureModal.action?.id 
          ? { ...action, preparedBy, approvedBy, employeeSignature: signatureData || undefined }
          : action
      ));
      
      handleCloseSignatureModal();
      alert('Signatories and signature saved successfully');
    } catch (error) {
      console.error('Error saving signatories:', error);
      alert('Failed to save signatories');
    } finally {
      setIsSigning(false);
    }
  };

  const handleOpenEditModal = (action: DisciplinaryAction) => {
    setEditModal({ show: true, action });
    setEditFormData({
      description: action.description,
      actionTaken: action.actionTaken,
      notes: action.notes || '',
      preparedBy: action.preparedBy || '',
      approvedBy: action.approvedBy || '',
      employeeSignature: action.employeeSignature || undefined
    });
  };

  const handleCloseEditModal = () => {
    setEditModal({ show: false, action: null });
    setEditFormData({ description: '', actionTaken: '', notes: '', preparedBy: '', approvedBy: '', employeeSignature: undefined });
  };

  const handleSaveEdit = async () => {
    if (!editModal.action) return;
    
    try {
      setIsSaving(true);
      await updateDisciplinaryAction(editModal.action.id, {
        description: editFormData.description,
        actionTaken: editFormData.actionTaken,
        notes: editFormData.notes,
        preparedBy: editFormData.preparedBy,
        approvedBy: editFormData.approvedBy,
        employeeSignature: editFormData.employeeSignature
      });
      
      // Update local state
      setDisciplinaryActions(prev => prev.map(action => 
        action.id === editModal.action?.id 
          ? { ...action, ...editFormData }
          : action
      ));
      
      handleCloseEditModal();
      alert('Disciplinary action updated successfully');
    } catch (error) {
      console.error('Error updating disciplinary action:', error);
      alert('Failed to update disciplinary action');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = (action: DisciplinaryAction) => {
    printDisciplinaryReport(action);
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
        <h1 className="text-3xl font-bold text-secondary-900">My Disciplinary Actions</h1>
        <p className="text-secondary-600 mt-1">View your disciplinary records</p>
      </div>

      {/* Disciplinary Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden"
      >
        {disciplinaryActions.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No disciplinary actions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Incident Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Reported Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {disciplinaryActions.map((action) => (
                  <tr key={action.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {action.type === 'verbal_warning' ? 'Verbal Warning' :
                         action.type === 'written_warning_1' ? 'Written Warning 1' :
                         action.type === 'written_warning_2' ? 'Written Warning 2' :
                         action.type === 'written_warning_3' ? 'Written Warning 3' :
                         action.type === 'final_warning' ? 'Final Warning' :
                         action.type === 'termination' ? 'Termination' : action.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${severityColors[action.severity]}`}>
                        {action.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {action.incidentDate instanceof Date ? action.incidentDate.toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[action.status]}`}>
                        {action.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {action.reportedDate instanceof Date ? action.reportedDate.toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewAction(action)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(action)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenSignatureModal(action)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Add Signature & Signatories"
                        >
                          <PenTool className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrint(action)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Print"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* View Details Modal */}
      {viewModal.show && viewModal.action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Disciplinary Action Details</h3>
            
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-secondary-600">Type:</span>
                  <p className="font-medium">
                    {viewModal.action.type === 'verbal_warning' ? 'Verbal Warning' :
                     viewModal.action.type === 'written_warning_1' ? 'Written Warning 1' :
                     viewModal.action.type === 'written_warning_2' ? 'Written Warning 2' :
                     viewModal.action.type === 'written_warning_3' ? 'Written Warning 3' :
                     viewModal.action.type === 'final_warning' ? 'Final Warning' :
                     viewModal.action.type === 'termination' ? 'Termination' : viewModal.action.type}
                  </p>
                </div>
                <div>
                  <span className="text-secondary-600">Severity:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${severityColors[viewModal.action.severity]}`}>
                    {viewModal.action.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-600">Incident Date:</span>
                  <p className="font-medium">
                    {viewModal.action.incidentDate instanceof Date ? viewModal.action.incidentDate.toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-secondary-600">Reported Date:</span>
                  <p className="font-medium">
                    {viewModal.action.reportedDate instanceof Date ? viewModal.action.reportedDate.toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-secondary-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[viewModal.action.status]}`}>
                    {viewModal.action.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-600">Reported By:</span>
                  <p className="font-medium">{viewModal.action.reportedBy}</p>
                </div>
              </div>

              <div>
                <span className="text-secondary-600">Description:</span>
                <p className="font-medium mt-1 bg-secondary-50 p-3 rounded">{viewModal.action.description}</p>
              </div>

              <div>
                <span className="text-secondary-600">Action Taken:</span>
                <p className="font-medium mt-1 bg-secondary-50 p-3 rounded">{viewModal.action.actionTaken}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-secondary-600">Warning Letter Issued:</span>
                  <p className="font-medium">{viewModal.action.warningLetterIssued ? 'Yes' : 'No'}</p>
                </div>
                {viewModal.action.suspensionDays && (
                  <div>
                    <span className="text-secondary-600">Suspension Days:</span>
                    <p className="font-medium">{viewModal.action.suspensionDays}</p>
                  </div>
                )}
                {viewModal.action.fineAmount && (
                  <div>
                    <span className="text-secondary-600">Fine Amount:</span>
                    <p className="font-medium">${viewModal.action.fineAmount}</p>
                  </div>
                )}
                <div>
                  <span className="text-secondary-600">Approved By:</span>
                  <p className="font-medium">{viewModal.action.approvedBy || 'N/A'}</p>
                </div>
              </div>

              {viewModal.action.notes && (
                <div>
                  <span className="text-secondary-600">Notes:</span>
                  <p className="font-medium mt-1 bg-secondary-50 p-3 rounded">{viewModal.action.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handlePrint(viewModal.action!)}
                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature & Signatories Modal */}
      {signatureModal.show && signatureModal.action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Add Signature & Signatories</h3>
            
            <div className="space-y-4">
              {/* Prepared By Selector */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Prepared By (Human Resources)
                </label>
                <select
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select HR Staff</option>
                  {hrStaff.map(emp => (
                    <option key={emp.id} value={emp.fullName}>
                      {emp.fullName} - {emp.designation || emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approved By Selector */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Approved By (Head Office)
                </label>
                <select
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Head Office Staff</option>
                  {headOfficeStaff.map(emp => (
                    <option key={emp.id} value={emp.fullName}>
                      {emp.fullName} - {emp.designation || emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Signature */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Employee Signature
                </label>
                <div className="border-2 border-secondary-300 rounded-lg p-2 bg-white">
                  {signatureData ? (
                    <div className="relative">
                      <img src={signatureData} alt="Signature" className="max-h-32" />
                      <button
                        onClick={() => setSignatureData(undefined)}
                        className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-secondary-400 text-sm">
                      <p>Click below to add signature</p>
                      <button
                        onClick={() => {
                          // Simple signature input using prompt for now
                          const signature = prompt('Enter signature (text):');
                          if (signature) {
                            setSignatureData(signature);
                          }
                        }}
                        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                      >
                        Add Signature
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleSaveSignatories}
                disabled={isSigning}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {isSigning ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCloseSignatureModal}
                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && editModal.action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Edit Disciplinary Action</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Action Taken
                </label>
                <textarea
                  value={editFormData.actionTaken}
                  onChange={(e) => setEditFormData({ ...editFormData, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Prepared By Selector */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Prepared By (Human Resources)
                </label>
                <select
                  value={editFormData.preparedBy}
                  onChange={(e) => setEditFormData({ ...editFormData, preparedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select HR Staff</option>
                  {hrStaff.map(emp => (
                    <option key={emp.id} value={emp.fullName}>
                      {emp.fullName} - {emp.designation || emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approved By Selector */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Approved By (Head Office)
                </label>
                <select
                  value={editFormData.approvedBy}
                  onChange={(e) => setEditFormData({ ...editFormData, approvedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Head Office Staff</option>
                  {headOfficeStaff.map(emp => (
                    <option key={emp.id} value={emp.fullName}>
                      {emp.fullName} - {emp.designation || emp.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Signature */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Employee Signature
                </label>
                <div className="border-2 border-secondary-300 rounded-lg p-2 bg-white">
                  {editFormData.employeeSignature ? (
                    <div className="relative">
                      <img src={editFormData.employeeSignature} alt="Signature" className="max-h-32" />
                      <button
                        onClick={() => setEditFormData({ ...editFormData, employeeSignature: undefined })}
                        className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-secondary-400 text-sm">
                      <p>Click below to add signature</p>
                      <button
                        onClick={() => {
                          const signature = prompt('Enter signature (text):');
                          if (signature) {
                            setEditFormData({ ...editFormData, employeeSignature: signature });
                          }
                        }}
                        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                      >
                        Add Signature
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
