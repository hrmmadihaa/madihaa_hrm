import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Calendar, MapPin, IdCard, AlertTriangle, Eye, Printer } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeById, getEmployees } from '../lib/employees';
import { getDisciplinaryActionsByEmployee } from '../lib/disciplinary';
import type { Employee, DisciplinaryAction } from '../types';
import jsPDF from 'jspdf';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [viewModal, setViewModal] = useState<{ show: boolean; action: DisciplinaryAction | null }>({ show: false, action: null });

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (user?.employeeId) {
        try {
          console.log('Loading employee for user.employeeId:', user.employeeId);
          // First try to get by employeeId (which is the document ID in some cases)
          let employeeData = await getEmployeeById(user.employeeId);
          
          // If not found, search by employeeId field
          if (!employeeData) {
            console.log('Not found by ID, searching by employeeId field');
            const allEmployees = await getEmployees();
            employeeData = allEmployees.find(e => e.employeeId === user.employeeId) || null;
            console.log('Found employee:', employeeData?.fullName, 'with ID:', employeeData?.id);
          }
          
          setEmployee(employeeData);
          
          // Load disciplinary actions for this employee
          if (employeeData?.id) {
            try {
              const actions = await getDisciplinaryActionsByEmployee(employeeData.id);
              setDisciplinaryActions(actions);
            } catch (error) {
              console.error('Error loading disciplinary actions:', error);
            }
          }
        } catch (error) {
          console.error('Error loading employee data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No user.employeeId found');
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        {/* Debug info */}
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>User Email: {user?.email}</p>
          <p>User Role: {user?.role}</p>
          <p>User EmployeeId: {user?.employeeId || 'NOT SET'}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600">Employee profile not found</p>
        </div>
        {/* Debug info */}
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>User Email: {user?.email}</p>
          <p>User Role: {user?.role}</p>
          <p>User EmployeeId: {user?.employeeId || 'NOT SET'}</p>
          <p className="text-red-600">Employee lookup failed for employeeId: {user?.employeeId}</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">My Profile</h1>
        <p className="text-secondary-600 mt-1">View your personal information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {employee.photo ? (
                <img
                  src={employee.photo}
                  alt={employee.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-16 h-16 text-primary-600" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">{employee.fullName}</h2>
                <p className="text-secondary-600">{employee.designation}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <IdCard className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Employee ID</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Department</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Email</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Phone</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Join Date</p>
                    <p className="text-sm font-medium text-secondary-900">{formatDate(employee.joinDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Work Location</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.workLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Date of Birth</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.dob)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Country</span>
                <span className="font-medium text-secondary-900">{employee.country || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Work Permit No.</span>
                <span className="font-medium text-secondary-900">{employee.wpNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">WP Expiry</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.wpExpDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Passport No.</span>
                <span className="font-medium text-secondary-900">{employee.ppIdNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Passport Expiry</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.ppIdExpDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Salary Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Basic Salary</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.basicSalary || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Living Allowance</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.livingAllowance || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Food Allowance</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.foodAllowance || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Attendance Allowance</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.attendanceAllowance || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">OT Allowances</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.otAllowances || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Other Allowances</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.otherAllowances || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Name</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Relationship</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.relationship || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Phone</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Email</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.email || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Accommodation</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Accommodation</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.accommodationName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Floor</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.floorName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Room</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.roomNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Bed</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.bedNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Assigned Date</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.accommodation?.assignedDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disciplinary Actions */}
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Disciplinary Actions
            </h3>
            {disciplinaryActions.length === 0 ? (
              <p className="text-secondary-600">No disciplinary actions found</p>
            ) : (
              <div className="space-y-3">
                {disciplinaryActions.map((action) => (
                  <div key={action.id} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-secondary-900">
                          {action.type === 'verbal_warning' ? 'Verbal Warning' :
                           action.type === 'written_warning_1' ? 'Written Warning 1' :
                           action.type === 'written_warning_2' ? 'Written Warning 2' :
                           action.type === 'written_warning_3' ? 'Written Warning 3' :
                           action.type === 'final_warning' ? 'Final Warning' :
                           action.type === 'termination' ? 'Termination' : action.type}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${severityColors[action.severity]}`}>
                          {action.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAction(action)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(action)}
                          className="text-secondary-600 hover:text-secondary-900"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-secondary-600">
                      <p>Date: {action.incidentDate instanceof Date ? action.incidentDate.toLocaleDateString() : 'N/A'}</p>
                      <p className="mt-1">{action.description.substring(0, 100)}{action.description.length > 100 ? '...' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};
