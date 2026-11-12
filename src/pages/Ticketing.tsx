import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, MapPin, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getLeaveRequests } from '../lib/leave';
import { getEmployees } from '../lib/employees';
import { getAllTicketRequests } from '../lib/ticket';
import { TICKET_WORKFLOW_STEPS, TICKET_WORKFLOW_LABELS } from '../types';
import type { LeaveRequest, TicketRequest } from '../types';

export const Ticketing = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [ticketRequests, setTicketRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('approved');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, empData, tickets] = await Promise.all([
        getLeaveRequests(),
        getEmployees(),
        getAllTicketRequests()
      ]);
      setLeaveRequests(requests);
      setEmployees(empData);
      setTicketRequests(tickets);
    } catch (error) {
      console.error('Error loading ticketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.fullName || employee?.name || 'Unknown';
  };

  const getEmployeeDesignation = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.designation || '-';
  };

  const getEmployeeDepartment = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.department || '-';
  };

  const getTicketForLeave = (leaveId: string) => {
    return ticketRequests.find(t => t.leaveId === leaveId);
  };

  const filteredRequests = leaveRequests.filter(request => {
    const employeeName = getEmployeeName(request.employeeId).toLowerCase();
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) || 
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const activeLeaveCount = filteredRequests.filter(r => r.status === 'approved').length;
  const pendingLeaveCount = filteredRequests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Ticketing</h1>
          <p className="text-secondary-600 mt-1">Staff on leave and ticketing details</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">On Leave</p>
                <p className="text-3xl font-bold text-secondary-900">{activeLeaveCount}</p>
              </div>
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Pending</p>
                <p className="text-3xl font-bold text-secondary-900">{pendingLeaveCount}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Total Requests</p>
                <p className="text-3xl font-bold text-secondary-900">{filteredRequests.length}</p>
              </div>
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Total Days</p>
                <p className="text-3xl font-bold text-secondary-900">
                  {filteredRequests.reduce((sum, r) => sum + r.days, 0)}
                </p>
              </div>
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="annual">Annual</option>
                <option value="medical">Medical</option>
                <option value="emergency">Emergency</option>
                <option value="duty">Duty</option>
                <option value="unpaid">Unpaid</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="compassionate">Compassionate</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Staff on Leave</h2>
            <span className="text-sm text-secondary-600">{filteredRequests.length} requests</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Ticket Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Applied Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-sm text-secondary-500">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, index) => {
                    const ticket = getTicketForLeave(request.id);
                    return (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-secondary-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 font-medium">
                          {getEmployeeName(request.employeeId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {getEmployeeDepartment(request.employeeId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {getEmployeeDesignation(request.employeeId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 capitalize">
                          {request.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 font-medium">
                          {request.days}
                        </td>
                        <td className="px-6 py-4 text-sm text-secondary-600 max-w-xs truncate">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.ticketRequired ? (
                            ticket ? (
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  ticket.status === 'departed' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {TICKET_WORKFLOW_LABELS[ticket.status]}
                                </span>
                                <div className="flex gap-1">
                                  {TICKET_WORKFLOW_STEPS.map((step, idx) => {
                                    const currentIndex = TICKET_WORKFLOW_STEPS.indexOf(ticket.status);
                                    const isCompleted = idx < currentIndex;
                                    const isActive = idx === currentIndex;
                                    return (
                                      <span
                                        key={step}
                                        className={`w-2 h-2 rounded-full ${
                                          isCompleted ? 'bg-green-500' :
                                          isActive ? 'bg-blue-500' :
                                          'bg-gray-300'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                Not Booked
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                          {new Date(request.appliedDate).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
