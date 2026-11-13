import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, Search, ArrowRight, CheckCircle, ArrowLeft, AlertCircle, Edit2, ChevronDown, ChevronUp, Plane, DollarSign, Car, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { getLeaveRequests } from '../lib/leave';
import { getEmployees } from '../lib/employees';
import { getAllTicketRequests, updateTicketStatus, updateTicketRequest } from '../lib/ticket';
import { TICKET_WORKFLOW_STEPS, TICKET_WORKFLOW_LABELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import type { LeaveRequest, TicketRequest } from '../types';

export const Ticketing = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [ticketRequests, setTicketRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketRequest['status'] | 'all'>('all');
  const [editingTicket, setEditingTicket] = useState<TicketRequest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveExtensionModal, setShowLeaveExtensionModal] = useState(false);
  const [showTicketChangeModal, setShowTicketChangeModal] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [selectedStatusChange, setSelectedStatusChange] = useState<{ ticketId: string; status: string } | null>(null);

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

  const handleTicketStatusChange = async (ticketId: string, newStatus: TicketRequest['status']) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      await loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleEditTicket = (ticket: TicketRequest) => {
    setEditingTicket(ticket);
    setShowEditModal(true);
  };

  const handleSaveTicketDetails = async () => {
    if (!editingTicket) return;
    try {
      await updateTicketRequest(editingTicket.id, {
        ticketPrice: editingTicket.ticketPrice,
        vanArrangedTime: editingTicket.vanArrangedTime,
        arrangedByName: editingTicket.arrangedByName,
        arrangedBy: user?.id,
        departureTime: editingTicket.departureTime,
        arrivalTime: editingTicket.arrivalTime,
        settlementAmount: editingTicket.settlementAmount,
        settlementDate: editingTicket.settlementDate,
        settlementHandedTo: editingTicket.settlementHandedTo,
        passportCollectedBy: editingTicket.passportCollectedBy,
        passportCollectedDate: editingTicket.passportCollectedDate,
        passportHandedTo: editingTicket.passportHandedTo,
        passportHandedDate: editingTicket.passportHandedDate,
        vehicleDriver: editingTicket.vehicleDriver,
        vehicleNumber: editingTicket.vehicleNumber,
      });
      await loadData();
      setShowEditModal(false);
      setEditingTicket(null);
    } catch (error) {
      console.error('Error updating ticket details:', error);
      alert('Failed to update ticket details');
    }
  };

  const handleLeaveExtension = async (ticket: TicketRequest) => {
    if (!confirm('Are you sure you want to extend the leave for this ticket?')) return;
    try {
      await updateTicketRequest(ticket.id, {
        isLeaveExtended: true,
        originalReturnDate: ticket.returnDate
      });
      await loadData();
    } catch (error) {
      console.error('Error extending leave:', error);
      alert('Failed to extend leave');
    }
  };

  const handleTicketChange = async (ticket: TicketRequest, reason: string) => {
    try {
      await updateTicketRequest(ticket.id, {
        isTicketChanged: true,
        changeReason: reason
      });
      await loadData();
      setShowTicketChangeModal(false);
    } catch (error) {
      console.error('Error changing ticket:', error);
      alert('Failed to update ticket change');
    }
  };

  const getWorkflowIcon = (step: string) => {
    const icons: Record<string, any> = {
      price_requested: DollarSign,
      price_received: DollarSign,
      approval_submitted: FileText,
      approved: CheckCircle,
      waiting_payment: DollarSign,
      payment_done: CheckCircle,
      ticket_received: Plane,
      settlement_submitted: DollarSign,
      settlement_handed_over: CheckCircle,
      vehicle_arranged: Car,
      passport_collected: FileText,
      passport_handed_over: CheckCircle,
      vehicle_left: Car,
      departed: Plane,
    };
    return icons[step] || CheckCircle;
  };

  const getWorkflowColor = (step: string) => {
    const colors: Record<string, string> = {
      price_requested: 'bg-yellow-500',
      price_received: 'bg-blue-500',
      approval_submitted: 'bg-purple-500',
      approved: 'bg-green-500',
      waiting_payment: 'bg-orange-500',
      payment_done: 'bg-green-500',
      ticket_received: 'bg-blue-500',
      settlement_submitted: 'bg-purple-500',
      settlement_handed_over: 'bg-green-500',
      vehicle_arranged: 'bg-blue-500',
      passport_collected: 'bg-orange-500',
      passport_handed_over: 'bg-green-500',
      vehicle_left: 'bg-blue-500',
      departed: 'bg-green-500',
    };
    return colors[step] || 'bg-gray-500';
  };

  const getNextStatus = (currentStatus: TicketRequest['status']): TicketRequest['status'] | null => {
    const currentIndex = TICKET_WORKFLOW_STEPS.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === TICKET_WORKFLOW_STEPS.length - 1) {
      return null;
    }
    return TICKET_WORKFLOW_STEPS[currentIndex + 1];
  };

  const getPreviousStatus = (currentStatus: TicketRequest['status']): TicketRequest['status'] | null => {
    const currentIndex = TICKET_WORKFLOW_STEPS.indexOf(currentStatus);
    if (currentIndex <= 0) {
      return null;
    }
    return TICKET_WORKFLOW_STEPS[currentIndex - 1];
  };

  const filteredTickets = ticketRequests.filter(ticket => {
    const leaveRequest = leaveRequests.find(lr => lr.id === ticket.leaveId);
    if (!leaveRequest) return false;
    
    const employeeName = getEmployeeName(ticket.employeeId).toLowerCase();
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) || 
                         leaveRequest.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeTicketCount = filteredTickets.filter(t => t.status !== 'departed' && t.status !== 'cancelled').length;
  const completedTicketCount = filteredTickets.filter(t => t.status === 'departed').length;

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
          <h1 className="text-3xl font-bold text-secondary-900">Ticket Management</h1>
          <p className="text-secondary-600 mt-1">Manage and track ticket requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Active Tickets</p>
                <p className="text-3xl font-bold text-secondary-900">{activeTicketCount}</p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Completed</p>
                <p className="text-3xl font-bold text-secondary-900">{completedTicketCount}</p>
              </div>
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Total Tickets</p>
                <p className="text-3xl font-bold text-secondary-900">{filteredTickets.length}</p>
              </div>
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name..."
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
                {TICKET_WORKFLOW_STEPS.map(status => (
                  <option key={status} value={status}>{TICKET_WORKFLOW_LABELS[status]}</option>
                ))}
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-sm text-secondary-500">No ticket requests found</p>
          </div>
        ) : (
          filteredTickets.map((ticket, index) => {
            const isExpanded = expandedTicket === ticket.id;
            const currentIndex = TICKET_WORKFLOW_STEPS.indexOf(ticket.status);
            const WorkflowIcon = getWorkflowIcon(ticket.status);
            
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWorkflowColor(ticket.status)} text-white`}>
                              {TICKET_WORKFLOW_LABELS[ticket.status]}
                            </span>
                            {ticket.isLeaveExtended && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Extended
                              </span>
                            )}
                            {ticket.isTicketChanged && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Changed
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-secondary-900">{getEmployeeName(ticket.employeeId)}</h3>
                          <p className="text-sm text-secondary-600 mt-1">
                            {ticket.departureCity} → {ticket.destinationCity}
                          </p>
                        </div>
                        <WorkflowIcon className={`w-8 h-8 ${getWorkflowColor(ticket.status).replace('bg-', 'text-')}`} />
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-gray-400" />
                        <span className="text-secondary-600">
                          {new Date(ticket.departureDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-secondary-600">
                          {ticket.ticketPrice ? `$${ticket.ticketPrice.toLocaleString()}` : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-secondary-600">
                          {ticket.vehicleNumber || 'Not assigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-secondary-600">
                          {ticket.status === 'passport_collected' || ticket.status === 'passport_handed_over' ? 'Collected' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Status Change - Always Visible */}
                    <div className="px-4 pb-4 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Change Status</label>
                        <select
                          value={ticket.status}
                          onChange={(e) => {
                            setSelectedStatusChange({ ticketId: ticket.id, status: e.target.value });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                          {TICKET_WORKFLOW_STEPS.map(status => (
                            <option key={status} value={status}>{TICKET_WORKFLOW_LABELS[status]}</option>
                          ))}
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      {selectedStatusChange?.ticketId === ticket.id && selectedStatusChange.status !== ticket.status && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => {
                            handleTicketStatusChange(ticket.id, selectedStatusChange.status as TicketRequest['status']);
                            setSelectedStatusChange(null);
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all text-sm flex items-center justify-center gap-2 shadow-md"
                        >
                          <span>Confirm Change to {TICKET_WORKFLOW_LABELS[selectedStatusChange.status as TicketRequest['status']]}</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                      className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 text-sm text-secondary-600 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show Details
                        </>
                      )}
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t p-4 space-y-4"
                      >
                        {/* Workflow Progress */}
                        <div>
                          <h4 className="text-sm font-semibold text-secondary-900 mb-3">Workflow Progress</h4>
                          <div className="flex items-center gap-1 overflow-x-auto pb-2">
                            {TICKET_WORKFLOW_STEPS.map((step, idx) => {
                              const StepIcon = getWorkflowIcon(step);
                              const isCompleted = idx < currentIndex;
                              const isActive = idx === currentIndex;
                              
                              return (
                                <div key={step} className="flex flex-col items-center min-w-[60px]">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isCompleted ? 'bg-green-500 text-white' :
                                    isActive ? 'bg-blue-500 text-white' :
                                    'bg-gray-200 text-gray-400'
                                  }`}>
                                    <StepIcon className="w-5 h-5" />
                                  </div>
                                  <span className={`text-xs mt-1 text-center ${
                                    isActive ? 'font-semibold text-blue-600' :
                                    isCompleted ? 'text-green-600' :
                                    'text-gray-400'
                                  }`}>
                                    {TICKET_WORKFLOW_LABELS[step].split(' ')[0]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Flight Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-secondary-900 mb-2">Flight Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Departure:</span>
                              <span className="ml-2">{ticket.departureTime || 'TBD'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Arrival:</span>
                              <span className="ml-2">{ticket.arrivalTime || 'TBD'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Return:</span>
                              <span className="ml-2">{new Date(ticket.returnDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Passengers:</span>
                              <span className="ml-2">{ticket.passengers}</span>
                            </div>
                          </div>
                        </div>

                        {/* Settlement Info */}
                        <div>
                          <h4 className="text-sm font-semibold text-secondary-900 mb-2">Settlement</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-2">{ticket.settlementAmount ? `$${ticket.settlementAmount.toLocaleString()}` : '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2">{ticket.settlementDate ? new Date(ticket.settlementDate).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Handed To:</span>
                              <span className="ml-2">{ticket.settlementHandedTo || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <button
                            onClick={() => handleEditTicket(ticket)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setShowLeaveExtensionModal(true)}
                            className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                          >
                            Extend Leave
                          </button>
                          <button
                            onClick={() => setShowTicketChangeModal(true)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            Change Ticket
                          </button>
                          {(() => {
                            const nextStatus = getNextStatus(ticket.status);
                            return nextStatus ? (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleTicketStatusChange(ticket.id, nextStatus)}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all text-sm flex items-center justify-center gap-1"
                              >
                                <span>{TICKET_WORKFLOW_LABELS[nextStatus]}</span>
                                <ArrowRight className="w-4 h-4" />
                              </motion.button>
                            ) : null;
                          })()}
                          {user?.role === 'super_admin' || user?.role === 'supervisor' ? (() => {
                            const previousStatus = getPreviousStatus(ticket.status);
                            return previousStatus ? (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleTicketStatusChange(ticket.id, previousStatus)}
                                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center justify-center gap-1"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back</span>
                              </motion.button>
                            ) : null;
                          })() : null}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Edit Ticket Details Modal */}
      {showEditModal && editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">Edit Ticket Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price</label>
                <input
                  type="number"
                  value={editingTicket.ticketPrice || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, ticketPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter ticket price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                <input
                  type="time"
                  value={editingTicket.departureTime || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, departureTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={editingTicket.arrivalTime || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, arrivalTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Amount</label>
                <input
                  type="number"
                  value={editingTicket.settlementAmount || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, settlementAmount: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter settlement amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Date</label>
                <input
                  type="date"
                  value={editingTicket.settlementDate ? new Date(editingTicket.settlementDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, settlementDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Handed To</label>
                <input
                  type="text"
                  value={editingTicket.settlementHandedTo || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, settlementHandedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Collected By</label>
                <input
                  type="text"
                  value={editingTicket.passportCollectedBy || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, passportCollectedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Collected Date</label>
                <input
                  type="date"
                  value={editingTicket.passportCollectedDate ? new Date(editingTicket.passportCollectedDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, passportCollectedDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Handed To</label>
                <input
                  type="text"
                  value={editingTicket.passportHandedTo || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, passportHandedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Driver</label>
                <input
                  type="text"
                  value={editingTicket.vehicleDriver || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, vehicleDriver: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter driver name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={editingTicket.vehicleNumber || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter vehicle number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Van Arranged Time</label>
                <input
                  type="datetime-local"
                  value={editingTicket.vanArrangedTime ? new Date(editingTicket.vanArrangedTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, vanArrangedTime: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Arranged By</label>
                <input
                  type="text"
                  value={editingTicket.arrangedByName || editingTicket.arrangedBy || ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, arrangedByName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter name of person who arranged"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTicketDetails}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Extension Modal */}
      {showLeaveExtensionModal && editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Extend Leave</h2>
            <p className="text-sm text-gray-600 mb-4">
              Current return date: {new Date(editingTicket.returnDate).toLocaleDateString()}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Return Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLeaveExtensionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLeaveExtension(editingTicket)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Extend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Change Modal */}
      {showTicketChangeModal && editingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Change Ticket</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Enter reason for ticket change (e.g., flight delayed)"
                id="ticketChangeReason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTicketChangeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = (document.getElementById('ticketChangeReason') as HTMLTextAreaElement)?.value;
                  if (reason) handleTicketChange(editingTicket, reason);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Change Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
