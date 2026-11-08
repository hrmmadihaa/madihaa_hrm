import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDisciplinaryActionsByEmployee } from '../lib/disciplinary';
import { getEmployees } from '../lib/employees';
import type { DisciplinaryAction } from '../types';
import jsPDF from 'jspdf';

export const StaffDisciplinary = () => {
  const { user } = useAuth();
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState<{ show: boolean; action: DisciplinaryAction | null }>({ show: false, action: null });

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all employees to find the one matching the logged-in user
        const employees = await getEmployees();
        const currentEmployee = employees.find(emp => emp.email === user.email);
        
        if (currentEmployee) {
          // Load disciplinary actions for this employee
          const actions = await getDisciplinaryActionsByEmployee(currentEmployee.id);
          setDisciplinaryActions(actions);
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
    </div>
  );
};
