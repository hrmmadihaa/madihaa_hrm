import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Printer, Download, Search, Save } from 'lucide-react';
import { getEmployees } from '../lib/employees';
import { getLeaveRequests } from '../lib/leave';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ProbationNonRenewalLetter: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSignatory, setSelectedSignatory] = useState('operation-manager');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [absencesCount, setAbsencesCount] = useState(0);
  const [sickLeavesCount, setSickLeavesCount] = useState(0);
  const [emergencyLeavesCount, setEmergencyLeavesCount] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);

  const signatories = [
    { id: 'operation-manager', name: 'Abdul Rahman Gasim', title: 'Operation Manager' },
    { id: 'general-manager', name: 'Iqbal Mohamed', title: 'General Manager' },
    { id: 'office-manager', name: 'Hussain Mahir', title: 'Office Manager' }
  ];

  React.useEffect(() => {
    loadEmployees();
    loadLeaveRequests();
  }, []);

  const loadEmployees = async () => {
    const data = await getEmployees();
    setEmployees(data);
  };

  const loadLeaveRequests = async () => {
    const data = await getLeaveRequests();
    setLeaveRequests(data);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    
    const employee = employees.find(e => e.id === employeeId);
    
    // Auto-fill join date if available
    if (employee?.joinDate) {
      const joinDate = new Date(employee.joinDate);
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      setJoinDate(formatDate(joinDate));
      
      // Calculate probation end date (3 months after join date)
      const probationEnd = new Date(joinDate);
      probationEnd.setMonth(probationEnd.getMonth() + 3);
      setProbationEndDate(formatDate(probationEnd));
    }

    // Fetch absences and sick leaves for this employee
    const employeeLeaves = leaveRequests.filter(req => req.employeeId === employeeId);
    
    // Count total days of sick/medical leaves
    const sickLeaves = employeeLeaves.filter(req => 
      req.type === 'medical' || 
      (req.type && req.type.toLowerCase() === 'medical')
    );
    const totalSickDays = sickLeaves.reduce((sum, leave) => sum + (leave.days || 0), 0);
    setSickLeavesCount(totalSickDays);
    
    // Count total days of emergency leaves
    const emergencyLeaves = employeeLeaves.filter(req => 
      req.type === 'emergency' || 
      (req.type && req.type.toLowerCase() === 'emergency')
    );
    const totalEmergencyDays = emergencyLeaves.reduce((sum, leave) => sum + (leave.days || 0), 0);
    setEmergencyLeavesCount(totalEmergencyDays);
    
    // Count total days of absences (rejected leaves)
    const absences = employeeLeaves.filter(req => 
      req.status === 'rejected'
    );
    const totalAbsenceDays = absences.reduce((sum, leave) => sum + (leave.days || 0), 0);
    setAbsencesCount(totalAbsenceDays);
    
    // Calculate attendance percentage
    // 3 months = approximately 66 working days (22 days/month * 3)
    const totalWorkingDays = 66;
    const totalLeaveDays = totalSickDays + totalEmergencyDays;
    const presentDays = totalWorkingDays - totalLeaveDays;
    const percentage = Math.max(0, Math.round((presentDays / totalWorkingDays) * 100));
    setAttendancePercentage(percentage);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleSaveToFirebase = async () => {
    try {
      const signatory = signatories.find(s => s.id === selectedSignatory);
      const employee = employees.find(e => e.id === selectedEmployee);
      
      await addDoc(collection(db, 'probation_notices'), {
        employeeId: selectedEmployee,
        employeeName: employee?.fullName,
        joinDate: joinDate ? new Date(joinDate) : null,
        probationEndDate: probationEndDate ? new Date(probationEndDate) : null,
        absencesCount,
        sickLeavesCount,
        signatoryName: signatory?.name,
        signatoryTitle: signatory?.title,
        createdAt: new Date(),
        status: 'sent'
      });
      
      alert('Probation non-renewal notice saved successfully!');
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      alert('Failed to save notice. Please try again.');
    }
  };

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  const filteredEmployees = employees.filter(employee =>
    employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Probation Non-Renewal Letter</h1>
        <p className="text-gray-600 mt-2">Generate official letters for employees whose probation will not be renewed due to health or fitness reasons</p>
      </div>

      {!showPreview ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Letter Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee
              </label>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3">
                {filteredEmployees.map((employee) => (
                  <label key={employee.id} className="flex items-center space-x-3 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
                    <input
                      type="radio"
                      name="employee"
                      checked={selectedEmployee === employee.id}
                      onChange={() => handleEmployeeSelect(employee.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {employee.fullName} ({employee.employeeId})
                    </span>
                  </label>
                ))}
                {filteredEmployees.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No employees found
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Date
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probation End Date
                </label>
                <input
                  type="date"
                  value={probationEndDate}
                  onChange={(e) => setProbationEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Leave Record Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Attendance (3 months)</p>
                  <p className="text-2xl font-bold text-green-600">{attendancePercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Leave Days</p>
                  <p className="text-2xl font-bold text-red-600">{sickLeavesCount + emergencyLeavesCount} days</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-3 gap-4">
                {sickLeavesCount > 0 && (
                  <div>
                    <p className="text-xs text-gray-600">Sick Leaves</p>
                    <p className="text-lg font-bold text-blue-600">{sickLeavesCount} days</p>
                  </div>
                )}
                {emergencyLeavesCount > 0 && (
                  <div>
                    <p className="text-xs text-gray-600">Emergency Leaves</p>
                    <p className="text-lg font-bold text-orange-600">{emergencyLeavesCount} days</p>
                  </div>
                )}
                {absencesCount > 0 && (
                  <div>
                    <p className="text-xs text-gray-600">Unapproved Absences</p>
                    <p className="text-lg font-bold text-red-600">{absencesCount} days</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signatory
              </label>
              <select
                value={selectedSignatory}
                onChange={(e) => setSelectedSignatory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {signatories.map(signatory => (
                  <option key={signatory.id} value={signatory.id}>
                    {signatory.name} - {signatory.title}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => setShowPreview(true)}
              disabled={!selectedEmployee || !joinDate || !probationEndDate}
              className="w-full"
            >
              Generate Letter
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 no-print">
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              ← Back to Edit
            </Button>
            <div className="flex gap-3">
              <Button onClick={handleSaveToFirebase}>
                <Save className="w-4 h-4 mr-2" />
                Save to Firebase
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="secondary" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Letter */}
          <div id="letter-content" className="border border-gray-300 p-6 bg-white">
            {/* Letterhead */}
            <div className="text-center mb-3 pb-3 border-b-2 border-gray-300">
              <div className="flex items-center justify-center mb-1">
                <img src="/Madihaa 2026 (1).png" alt="Madihaa Logo" className="h-14 w-14 object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Madihaa Pvt Ltd</h1>
              <p className="text-xs text-gray-600">Human Resource Management System</p>
              <p className="text-xs text-gray-500 mt-0">Official Probation Non-Renewal Notice</p>
            </div>

            {/* Date */}
            <div className="text-right text-xs text-gray-600 mb-3">
              Date: {new Date().toLocaleDateString()}
            </div>

            {/* Employee Details */}
            <div className="mb-3">
              <p className="font-semibold text-sm">To,</p>
              <p className="font-semibold text-base">{selectedEmployeeData?.fullName}</p>
              <p className="text-sm text-gray-600">Employee ID: {selectedEmployeeData?.employeeId}</p>
            </div>

            {/* Subject */}
            <div className="mb-3">
              <p className="font-semibold text-sm mb-1">Subject: Notice of Non-Renewal of Employment Contract</p>
            </div>

            {/* Letter Body */}
            <div className="space-y-2 text-xs leading-relaxed">
              <p>Dear {selectedEmployeeData?.fullName?.split(' ')[0] || 'Employee'},</p>

              <p>
                This letter serves as formal notification that Madihaa Pvt Ltd has decided not to renew your employment contract upon completion of your probationary period.
              </p>

              <p>
                <strong>Employment Details:</strong><br />
                Join Date: {joinDate ? new Date(joinDate).toLocaleDateString() : 'N/A'}<br />
                Probation End Date: {probationEndDate ? new Date(probationEndDate).toLocaleDateString() : 'N/A'}
              </p>

              <p>
                <strong>Leave Record Summary:</strong><br />
                Attendance During Probation: {attendancePercentage}%<br />
                {sickLeavesCount > 0 && <>Sick Leaves Taken: {sickLeavesCount} days<br /></>}
                {emergencyLeavesCount > 0 && <>Emergency Leaves Taken: {emergencyLeavesCount} days<br /></>}
                {absencesCount > 0 && <>Unapproved Absences: {absencesCount} days<br /></>}
                {sickLeavesCount === 0 && emergencyLeavesCount === 0 && absencesCount === 0 && <>No significant leave records during probation period</>}
              </p>

              <p>
                After careful review of your performance and attendance during the probationary period, management has determined that your health condition and physical fitness for the role do not meet the requirements of the position. The frequency of sick leaves and absences indicates ongoing health concerns that affect your ability to consistently fulfill the duties and responsibilities of your role.
              </p>

              <p>
                Based on these factors, the company has decided not to continue with your employment beyond the one-year contract period. This decision is final and has been made after thorough consideration of all relevant circumstances.
              </p>

              <p className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <strong>IMPORTANT NOTICE:</strong><br />
                - Your employment will officially end on {probationEndDate ? new Date(probationEndDate).toLocaleDateString() : 'the probation end date'}<br />
                - Please complete all exit formalities with the HR department<br />
                - Return all company property including ID card, keys, and any equipment<br />
                - Clear any outstanding dues or advances before the final working day
              </p>

              <p>
                We wish you the best in your future endeavors and hope that your health improves in the future.
              </p>

              <p className="mt-4">
                Sincerely,<br />
                Management<br />
                Madihaa Pvt Ltd
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-center">
                <div className="mb-8">
                  <p className="font-semibold">{signatories.find(s => s.id === selectedSignatory)?.name}</p>
                  <p className="text-sm text-gray-600">{signatories.find(s => s.id === selectedSignatory)?.title}</p>
                </div>
                <div className="border-t border-gray-400 pt-1 inline-block min-w-40">
                  <p className="text-xs text-gray-500">Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #letter-content, #letter-content * {
            visibility: visible;
          }
          #letter-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11pt;
            line-height: 1.25;
          }
          #letter-content p {
            margin-bottom: 0.25em;
          }
          #letter-content .space-y-2 > * + * {
            margin-top: 0.4em;
          }
          #letter-content .mb-3 {
            margin-bottom: 0.4em !important;
          }
          #letter-content .mt-4 {
            margin-top: 0.4em !important;
          }
          #letter-content .pt-4 {
            padding-top: 0.4em !important;
          }
          #letter-content .mb-8 {
            margin-bottom: 1.2em !important;
          }
          #letter-content .text-base {
            font-size: 1.05em !important;
          }
          #letter-content .text-xl {
            font-size: 1.25em !important;
          }
          #letter-content .h-14 {
            height: 2.8rem !important;
          }
          #letter-content .w-14 {
            width: 2.8rem !important;
          }
          #letter-content .text-xs {
            font-size: 0.85em !important;
          }
          #letter-content .border-b-2 {
            border-bottom-width: 1px !important;
          }
        }
      `}</style>
    </div>
  );
};
