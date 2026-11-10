import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Printer, Download, Search, Save } from 'lucide-react';
import { getEmployees } from '../lib/employees';
import { getLeaveRequests } from '../lib/leave';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const HolidayStatusLetter: React.FC = () => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSignatory, setSelectedSignatory] = useState('operation-manager');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

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

  const handleEmployeeToggle = (employeeId: string) => {
    const isAdding = !selectedEmployees.includes(employeeId);
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );

    // Auto-fetch leave dates when adding an employee
    if (isAdding) {
      const employeeLeaves = leaveRequests
        .filter(req => req.employeeId === employeeId && req.status === 'approved');

      // Find the most recent leave that has ended (before today)
      const today = new Date();
      const completedLeaves = employeeLeaves.filter(req => {
        const endDate = new Date(req.endDate);
        return endDate < today;
      });

      // Sort by end date descending to get the most recently completed leave
      const employeeLeave = completedLeaves.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

      if (employeeLeave) {
        // Convert dates to yyyy-MM-dd format for date inputs (using local timezone)
        const startDate = new Date(employeeLeave.startDate);
        const endDate = new Date(employeeLeave.endDate);
        
        // Format dates as yyyy-MM-dd in local timezone
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        setHolidayStartDate(formatDate(startDate));
        setHolidayEndDate(formatDate(endDate));
        
        // Set report date to the day after end date
        const reportDate = new Date(endDate);
        reportDate.setDate(reportDate.getDate() + 1);
        setReportDate(formatDate(reportDate));
      }
    }
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
      
      for (const employeeId of selectedEmployees) {
        const employee = employees.find(e => e.id === employeeId);
        
        await addDoc(collection(db, 'holiday_notices'), {
          employeeId,
          employeeName: employee?.fullName,
          holidayStartDate: new Date(holidayStartDate),
          holidayEndDate: new Date(holidayEndDate),
          reportDate: new Date(reportDate),
          actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : null,
          signatoryName: signatory?.name,
          signatoryTitle: signatory?.title,
          createdAt: new Date(),
          status: 'sent'
        });
      }
      
      alert('Holiday notice(s) saved successfully!');
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      alert('Failed to save holiday notice. Please try again.');
    }
  };

  const selectedEmployeeNames = selectedEmployees
    .map(id => employees.find(e => e.id === id)?.fullName)
    .filter(Boolean)
    .join(', ');

  const filteredEmployees = employees.filter(employee =>
    employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Holiday Non-Return Notice</h1>
        <p className="text-gray-600 mt-2">Generate official notices for employees who failed to return from holiday</p>
      </div>

      {!showPreview ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Letter Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employees
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
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeToggle(employee.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
              <p className="text-xs text-gray-500 mt-1">
                {selectedEmployees.length} employee(s) selected
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Start Date
                </label>
                <input
                  type="date"
                  value={holidayStartDate}
                  onChange={(e) => setHolidayStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday End Date
                </label>
                <input
                  type="date"
                  value={holidayEndDate}
                  onChange={(e) => setHolidayEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date to Report Back to Work
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Return Date (Optional)
              </label>
              <input
                type="date"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
              disabled={selectedEmployees.length === 0 || !holidayStartDate || !holidayEndDate || !reportDate}
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
                <img src="/madihaa (1).jpg" alt="Madihaa Logo" className="h-14 w-14 object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Madihaa Pvt Ltd</h1>
              <p className="text-xs text-gray-600">Human Resource Management System</p>
              <p className="text-xs text-gray-500 mt-0">Official Holiday Status Update Notice</p>
            </div>

            {/* Date */}
            <div className="text-right text-xs text-gray-600 mb-3">
              Date: {new Date().toLocaleDateString()}
            </div>

            {/* Employee Names */}
            <div className="mb-3">
              <p className="font-semibold text-sm">To,</p>
              <p className="font-semibold text-base">{selectedEmployeeNames}</p>
            </div>

            {/* Subject */}
            <div className="mb-3">
              <p className="font-semibold text-sm mb-1">Subject: URGENT - Failure to Return from Holiday and Non-Compliance Notice</p>
            </div>

            {/* Letter Body */}
            <div className="space-y-2 text-xs leading-relaxed">
              <p>Dear {selectedEmployeeNames.split(',')[0] || 'Employee'},</p>

              <p>
                This letter serves as an official notice regarding your failure to return to work after your approved holiday period. Our records indicate that you have not reported back to work as required, and you have not provided any valid written explanation for your absence.
              </p>

              <p>
                <strong>Holiday Period Details:</strong><br />
                Holiday Start Date: {new Date(holidayStartDate).toLocaleDateString()}<br />
                Holiday End Date: {new Date(holidayEndDate).toLocaleDateString()}<br />
                Expected Return to Work: {new Date(reportDate).toLocaleDateString()}
                {actualReturnDate && <><br />Actual Return Date: {new Date(actualReturnDate).toLocaleDateString()}</>}
              </p>

              <p>
                You were required to report back to work on {new Date(reportDate).toLocaleDateString()}. As of this date, you have failed to do so without providing any valid written documentation or explanation for your absence.
              </p>

              <p className="bg-red-50 border-l-4 border-red-400 p-4">
                <strong>FINAL NOTICE:</strong><br />
                This is your final notice to comply with company policy. You are required to:<br />
                1. Report back to work immediately<br />
                2. Provide valid written documentation explaining your failure to return<br />
                3. Submit this documentation to the HR department within 24 hours of receiving this notice
              </p>

              <p className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <strong>CONSEQUENCES OF NON-COMPLIANCE:</strong><br />
                Failure to report back to work and provide valid written reasons for your absence within the specified timeframe will result in immediate action:<br />
                - Your work visa will be officially cancelled<br />
                - Your employment with Madihaa Pvt Ltd will be officially and automatically terminated<br />
                - Legal action may be taken for breach of contract
              </p>

              <p>
                This matter is being treated with the utmost seriousness. We urge you to contact the HR department immediately to resolve this situation and avoid the severe consequences outlined above.
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
