import { useState, useEffect } from 'react';
import { Calendar, Eye } from 'lucide-react';
import { getLeaveRequests } from '../../lib/leave';
import type { LeaveRequest, Employee, LeaveType } from '../../types';

interface LeaveHistoryProps {
  employee?: Partial<Employee>;
  onPrev?: () => void;
  onNext?: () => void;
}

export const LeaveHistory = ({ employee, onPrev, onNext }: LeaveHistoryProps) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState<{ show: boolean; request: LeaveRequest | null }>({ show: false, request: null });
  const [leaveStats, setLeaveStats] = useState<Record<LeaveType, number>>({
    annual: 0,
    medical: 0,
    emergency: 0,
    duty: 0,
    unpaid: 0,
    maternity: 0,
    paternity: 0,
    compassionate: 0,
    off_day: 0,
  });

  const [leavePeriod, setLeavePeriod] = useState<{ start: Date; end: Date } | null>(null);

  const typeLabels: Record<LeaveType, string> = {
    annual: 'Annual Leave',
    medical: 'Sick Leave',
    emergency: 'Emergency Leave',
    duty: 'Duty Leave',
    unpaid: 'Unpaid Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    compassionate: 'Compassionate Leave',
    off_day: 'Off Day',
  };

  useEffect(() => {
    const loadLeaveHistory = async () => {
      if (!employee?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const requests = await getLeaveRequests(employee.id);
        setLeaveRequests(requests);

        // Calculate leave period based on hire date (rolling year)
        const hireDate = employee.joinDate ? new Date(employee.joinDate) : new Date();
        const now = new Date();

        // Calculate the current leave year
        const yearsSinceHire = now.getFullYear() - hireDate.getFullYear();
        const periodStart = new Date(hireDate);
        periodStart.setFullYear(periodStart.getFullYear() + yearsSinceHire);

        // If current date is before the anniversary date, use previous year
        if (now < periodStart) {
          periodStart.setFullYear(periodStart.getFullYear() - 1);
        }

        const periodEnd = new Date(periodStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);

        setLeavePeriod({ start: periodStart, end: periodEnd });

        const stats: Record<LeaveType, number> = {
          annual: 0,
          medical: 0,
          emergency: 0,
          duty: 0,
          unpaid: 0,
          maternity: 0,
          paternity: 0,
          compassionate: 0,
          off_day: 0,
        };

        requests.forEach(request => {
          if (request.status === 'approved') {
            stats[request.type] += request.days;
          }
        });

        setLeaveStats(stats);
      } catch (error) {
        console.error('Error loading leave history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaveHistory();
  }, [employee?.id, employee?.joinDate]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const typeColors: Record<string, string> = {
    annual: 'bg-blue-100 text-blue-800',
    medical: 'bg-purple-100 text-purple-800',
    emergency: 'bg-red-100 text-red-800',
    duty: 'bg-green-100 text-green-800',
    unpaid: 'bg-gray-100 text-gray-800',
    maternity: 'bg-pink-100 text-pink-800',
    paternity: 'bg-cyan-100 text-cyan-800',
    compassionate: 'bg-amber-100 text-amber-800',
    off_day: 'bg-indigo-100 text-indigo-800',
  };

  const handleViewRequest = (request: LeaveRequest) => {
    setViewModal({ show: true, request });
  };

  const handleCloseViewModal = () => {
    setViewModal({ show: false, request: null });
  };

  const formatDateWithDay = (date: Date) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = d.toLocaleDateString();
    return `${dateStr} (${dayName})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Name Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {employee?.fullName || employee?.firstName && employee?.lastName 
            ? `${employee.firstName} ${employee.lastName}`
            : 'Employee Details'}
        </h2>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900">Leave History</h2>
        <div className="flex gap-2">
          {onPrev && (
            <button
              onClick={onPrev}
              className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition"
            >
              Previous
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Leave Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Annual Leave</p>
          <p className="text-2xl font-bold text-blue-600">{leaveStats.annual}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Medical Leave</p>
          <p className="text-2xl font-bold text-purple-600">{leaveStats.medical}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Emergency Leave</p>
          <p className="text-2xl font-bold text-red-600">{leaveStats.emergency}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Duty Leave</p>
          <p className="text-2xl font-bold text-green-600">{leaveStats.duty}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Unpaid Leave</p>
          <p className="text-2xl font-bold text-gray-600">{leaveStats.unpaid}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Maternity Leave</p>
          <p className="text-2xl font-bold text-pink-600">{leaveStats.maternity}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Paternity Leave</p>
          <p className="text-2xl font-bold text-cyan-600">{leaveStats.paternity}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Compassionate Leave</p>
          <p className="text-2xl font-bold text-amber-600">{leaveStats.compassionate}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <p className="text-sm text-secondary-600">Off Day</p>
          <p className="text-2xl font-bold text-indigo-600">{leaveStats.off_day}</p>
          <p className="text-xs text-secondary-500">days</p>
        </div>
      </div>

      {/* Period Info */}
      {leavePeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Leave Period:</strong> {leavePeriod.start.toLocaleDateString()} to {leavePeriod.end.toLocaleDateString()}
          </p>
          <p className="text-xs text-blue-600 mt-1">Showing approved leave days within the current leave year (based on hire date)</p>
        </div>
      )}

      {/* Leave Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
        {leaveRequests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No leave history found for this employee</p>
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
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {leaveRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColors[request.type]}`}>
                        {typeLabels[request.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {formatDateWithDay(request.startDate)}
                      </div>
                      {request.startDate.getTime() !== request.endDate.getTime() && (
                        <div className="text-sm text-secondary-600">
                          to {formatDateWithDay(request.endDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{request.days} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {new Date(request.appliedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewModal.show && viewModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Leave Request Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeColors[viewModal.request.type]}`}>
                  {typeLabels[viewModal.request.type]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Duration:</span>
                <span className="font-medium">
                  {formatDateWithDay(viewModal.request.startDate)}
                </span>
              </div>
              {viewModal.request.startDate.getTime() !== viewModal.request.endDate.getTime() && (
                <div className="flex justify-between">
                  <span className="text-secondary-600">To:</span>
                  <span className="font-medium">
                    {formatDateWithDay(viewModal.request.endDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-secondary-600">Days:</span>
                <span className="font-medium">{viewModal.request.days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[viewModal.request.status]}`}>
                  {viewModal.request.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Applied Date:</span>
                <span className="font-medium">{new Date(viewModal.request.appliedDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-secondary-600">Reason:</span>
                <p className="font-medium mt-1">{viewModal.request.reason}</p>
              </div>
              {viewModal.request.approvals && viewModal.request.approvals.length > 0 && (
                <div>
                  <span className="text-secondary-600">Approval Details:</span>
                  <div className="mt-1 space-y-1">
                    {viewModal.request.approvals.map((approval, index) => (
                      <div key={index} className="text-xs bg-secondary-50 p-2 rounded">
                        <div><strong>Approver:</strong> {approval.approverName}</div>
                        <div><strong>Status:</strong> {approval.status}</div>
                        {approval.comments && <div><strong>Comments:</strong> {approval.comments}</div>}
                        {approval.actionDate && <div><strong>Date:</strong> {new Date(approval.actionDate).toLocaleDateString()}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
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
