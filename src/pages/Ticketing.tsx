import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, Search, ArrowRight, CheckCircle, ArrowLeft, AlertCircle, Edit2, ChevronDown, ChevronUp, Plane, DollarSign, Car, FileText, X, Save, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { getLeaveRequests } from '../lib/leave';
import { getEmployees } from '../lib/employees';
import { getAllTicketRequests, updateTicketStatus, updateTicketRequest, deleteTicketRequest } from '../lib/ticket';
import { getAttendance } from '../lib/attendance';
import { getOvertimeRequests } from '../lib/overtime';
import { TICKET_WORKFLOW_STEPS, TICKET_WORKFLOW_LABELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import type { LeaveRequest, TicketRequest, OvertimeRequest } from '../types';
import { logActivity } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';
import { uploadFile } from '../lib/cloudinary';

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
  const [uploadingTicketFile, setUploadingTicketFile] = useState<string | null>(null);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [viewingTicket, setViewingTicket] = useState<TicketRequest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementTicket, setSettlementTicket] = useState<TicketRequest | null>(null);
  const [showFlightDetailsModal, setShowFlightDetailsModal] = useState(false);
  const [pendingTicketStatusChange, setPendingTicketStatusChange] = useState<{ ticketId: string; newStatus: string } | null>(null);
  const [flightFormData, setFlightFormData] = useState({
    departureTime: '',
    arrivalTime: '',
    flightNumber: ''
  });

  // Settlement form state
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [overtimeStartDate, setOvertimeStartDate] = useState('');
  const [overtimeEndDate, setOvertimeEndDate] = useState('');
  const [settlementAttendance, setSettlementAttendance] = useState<any[]>([]);
  const [settlementOvertime, setSettlementOvertime] = useState<OvertimeRequest[]>([]);

  const [settlementForm, setSettlementForm] = useState({
    monthlySalary: 0,
    salaryDays: 23,
    salaryDivisor: 30,
    overtimeAmount: 0,
    overtimeHours: 0,
    overtimeRate: 10,
    foodAllowanceDays: 0,
    foodAllowancePerDay: 0,
    presentDays: 0,
    fridayCount: 0,
    offDays: 0,
    mc: 0,
    el: 0,
    al: 0,
    sus: 0,
    fl: 0,
    sick: 0,
    halfDay: 0,
    absent: 0,
    noPayLeave: 0,
    specialLeave: 0,
    otherEarnings: 0,
    deductions: 0,
    advanceDeduction: 0,
    remarks: '',
  });

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
    const ticket = ticketRequests.find(t => t.id === ticketId);
    
    // If changing to ticket_received, show modal to collect flight details
    if (newStatus === 'ticket_received') {
      setPendingTicketStatusChange({ ticketId, newStatus });
      // Auto-fill existing flight details
      setFlightFormData({
        departureTime: ticket?.departureTime || '',
        arrivalTime: ticket?.arrivalTime || '',
        flightNumber: ticket?.flightNumber || ''
      });
      setShowFlightDetailsModal(true);
      return;
    }

    try {
      await updateTicketStatus(ticketId, newStatus);
      await logActivity(
        'updated',
        'ticket_request',
        ticketId,
        `Changed ticket status to ${newStatus}`
      );

      await loadData(); // Reload data to reflect changes
      setTicketFile(null);
      setUploadingTicketFile(null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleFlightDetailsSubmit = async () => {
    if (!pendingTicketStatusChange) return;

    const { ticketId, newStatus } = pendingTicketStatusChange;
    const ticket = ticketRequests.find(t => t.id === ticketId);

    try {
      // Upload ticket file if provided
      if (ticketFile) {
        setUploadingTicketFile(ticketId);
        const fileName = `${ticket?.employeeId}_${ticketId}`;
        const fileUrl = await uploadFile(ticketFile, 'tickets', fileName);
        await updateTicketRequest(ticketId, { ticketPdfUrl: fileUrl });
        setUploadingTicketFile(null);
      }

      // Update flight details and status
      await updateTicketRequest(ticketId, {
        departureTime: flightFormData.departureTime,
        arrivalTime: flightFormData.arrivalTime,
        flightNumber: flightFormData.flightNumber
      });
      await updateTicketStatus(ticketId, newStatus as TicketRequest['status']);
      await logActivity(
        'updated',
        'ticket_request',
        ticketId,
        `Ticket received for ${getEmployeeName(ticket?.employeeId || '')} - Flight ${flightFormData.flightNumber} ${ticket?.departureCity} → ${ticket?.destinationCity} on ${formatDate(new Date(ticket?.departureDate || new Date()))} at ${flightFormData.departureTime || 'TBD'}`
      );

      setShowFlightDetailsModal(false);
      setPendingTicketStatusChange(null);
      setFlightFormData({ departureTime: '', arrivalTime: '', flightNumber: '' });
      setTicketFile(null);
      loadData();
    } catch (error) {
      console.error('Error updating ticket with flight details:', error);
      alert('Failed to update ticket');
      setUploadingTicketFile(null);
    }
  };

  const handleEditTicket = (ticket: TicketRequest) => {
    setEditingTicket(ticket);
    setShowEditModal(true);
  };

  const handleViewTicket = (ticket: TicketRequest) => {
    setViewingTicket(ticket);
    setShowViewModal(true);
  };

  const handleSaveTicketDetails = async () => {
    if (!editingTicket) return;
    try {
      const updateData: any = {
        ticketType: editingTicket.ticketType,
        departureDate: editingTicket.departureDate,
        returnDate: editingTicket.returnDate,
        arrangedBy: user?.id,
      };

      // Only include fields that have values
      if (editingTicket.ticketPrice !== undefined) updateData.ticketPrice = editingTicket.ticketPrice;
      if (editingTicket.vanArrangedTime) updateData.vanArrangedTime = editingTicket.vanArrangedTime;
      if (editingTicket.arrangedByName) updateData.arrangedByName = editingTicket.arrangedByName;
      if (editingTicket.departureTime) updateData.departureTime = editingTicket.departureTime;
      if (editingTicket.arrivalTime) updateData.arrivalTime = editingTicket.arrivalTime;
      if (editingTicket.settlementAmount !== undefined) updateData.settlementAmount = editingTicket.settlementAmount;
      if (editingTicket.settlementDate) updateData.settlementDate = editingTicket.settlementDate;
      if (editingTicket.settlementHandedTo) updateData.settlementHandedTo = editingTicket.settlementHandedTo;
      if (editingTicket.passportCollectedBy) updateData.passportCollectedBy = editingTicket.passportCollectedBy;
      if (editingTicket.passportCollectedDate) updateData.passportCollectedDate = editingTicket.passportCollectedDate;
      if (editingTicket.passportHandedTo) updateData.passportHandedTo = editingTicket.passportHandedTo;
      if (editingTicket.passportHandedDate) updateData.passportHandedDate = editingTicket.passportHandedDate;
      if (editingTicket.vehicleDriver) updateData.vehicleDriver = editingTicket.vehicleDriver;
      if (editingTicket.vehicleNumber) updateData.vehicleNumber = editingTicket.vehicleNumber;

      await updateTicketRequest(editingTicket.id, updateData);
      await logActivity(
        'updated',
        'ticket_request',
        editingTicket.id,
        `Updated ticket details for ${editingTicket.ticketType}`
      );
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
      await logActivity(
        'updated',
        'ticket_request',
        ticket.id,
        `Extended leave for ticket`
      );
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
      await logActivity(
        'updated',
        'ticket_request',
        ticket.id,
        `Changed ticket: ${reason}`
      );
      await loadData();
      setShowTicketChangeModal(false);
    } catch (error) {
      console.error('Error changing ticket:', error);
      alert('Failed to update ticket change');
    }
  };

  const handleDeleteTicket = async (ticket: TicketRequest) => {
    if (!confirm(`Are you sure you want to delete this ticket for ${getEmployeeName(ticket.employeeId)}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteTicketRequest(ticket.id);
      await logActivity(
        'deleted',
        'ticket_request',
        ticket.id,
        `Deleted ticket request for ${getEmployeeName(ticket.employeeId)}`
      );
      await loadData();
      alert('Ticket deleted successfully');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Ticket Management</h1>
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
                          {formatDate(new Date(ticket.departureDate))}
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
                      {ticket.ticketPdfUrl && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span className="text-secondary-600">
                            <a href={ticket.ticketPdfUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                              View Ticket PDF
                            </a>
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
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
                        <>
                          {selectedStatusChange.status === 'ticket_received' && (
                            <div className="mt-2 space-y-2">
                              <div className="bg-gray-50 p-2 rounded-lg">
                                <p className="text-xs font-medium text-gray-700 mb-1">Ticket Details</p>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <p><strong>Departure:</strong> {formatDate(new Date(ticket.departureDate))} {ticket.departureTime ? `at ${ticket.departureTime}` : ''}</p>
                                  {ticket.ticketType === 'round_trip' && (
                                    <p><strong>Return:</strong> {formatDate(new Date(ticket.returnDate))} {ticket.arrivalTime ? `at ${ticket.arrivalTime}` : ''}</p>
                                  )}
                                  <p><strong>Type:</strong> {ticket.ticketType === 'round_trip' ? 'Round Trip' : 'One Way'}</p>
                                  <p><strong>Route:</strong> {ticket.departureCity} → {ticket.destinationCity}</p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Upload Ticket PDF (Optional)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file && file.type === 'application/pdf') {
                                        setTicketFile(file);
                                      } else if (file) {
                                        alert('Please select a PDF file');
                                        e.target.value = '';
                                      }
                                    }}
                                    className="flex-1 text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                  />
                                  {ticketFile && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      {ticketFile.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSettlementTicket(ticket);
                                  setShowSettlementModal(true);
                                  // Pre-fill settlement form with employee data
                                  const employee = employees.find(e => e.id === ticket.employeeId);
                                  if (employee) {
                                    setSettlementForm(prev => ({
                                      ...prev,
                                      monthlySalary: employee.salary ? Number(employee.salary) : 0,
                                    }));
                                  }
                                }}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm flex items-center justify-center gap-2 shadow-md"
                              >
                                <FileText className="w-4 h-4" />
                                Create Settlement
                              </button>
                            </div>
                          )}
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => {
                              handleTicketStatusChange(ticket.id, selectedStatusChange.status as TicketRequest['status']);
                              setSelectedStatusChange(null);
                            }}
                            disabled={uploadingTicketFile === ticket.id}
                            className="w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingTicketFile === ticket.id ? (
                              <>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <span>Confirm Change to {TICKET_WORKFLOW_LABELS[selectedStatusChange.status as TicketRequest['status']]}</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </motion.button>
                        </>
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
                              <span className="ml-2">{formatDate(new Date(ticket.returnDate))}</span>
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
                              <span className="ml-2">{ticket.settlementDate ? formatDate(new Date(ticket.settlementDate)) : '-'}</span>
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
                            onClick={() => handleDeleteTicket(ticket)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                          <button
                            onClick={() => setShowLeaveExtensionModal(true)}
                            className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                          >
                            Extend Leave
                          </button>
                          <button
                            onClick={() => setShowTicketChangeModal(true)}
                            className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
                <select
                  value={editingTicket.ticketType || 'round_trip'}
                  onChange={(e) => setEditingTicket({ ...editingTicket, ticketType: e.target.value as 'one_way' | 'round_trip' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="round_trip">Round Trip</option>
                  <option value="one_way">One Way</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={editingTicket.departureDate ? new Date(editingTicket.departureDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, departureDate: e.target.value ? new Date(e.target.value) : editingTicket.departureDate })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <input
                  type="date"
                  value={editingTicket.returnDate ? new Date(editingTicket.returnDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setEditingTicket({ ...editingTicket, returnDate: e.target.value ? new Date(e.target.value) : editingTicket.returnDate })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
              Current return date: {formatDate(new Date(editingTicket.returnDate))}
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

      {/* Flight Details Modal for Ticket Received */}
      {showFlightDetailsModal && pendingTicketStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-bold mb-4">Flight Details</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please enter flight details before marking ticket as received
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number</label>
                <input
                  type="text"
                  value={flightFormData.flightNumber}
                  onChange={(e) => setFlightFormData({ ...flightFormData, flightNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter flight number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                <input
                  type="time"
                  value={flightFormData.departureTime}
                  onChange={(e) => setFlightFormData({ ...flightFormData, departureTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={flightFormData.arrivalTime}
                  onChange={(e) => setFlightFormData({ ...flightFormData, arrivalTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Ticket PDF (Optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setTicketFile(file);
                    } else if (file) {
                      alert('Please select a PDF file');
                      e.target.value = '';
                    }
                  }}
                  className="w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {ticketFile && (
                  <p className="mt-1 text-xs text-green-600">Selected: {ticketFile.name}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowFlightDetailsModal(false);
                  setPendingTicketStatusChange(null);
                  setFlightFormData({ departureTime: '', arrivalTime: '', flightNumber: '' });
                  setTicketFile(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlightDetailsSubmit}
                disabled={uploadingTicketFile !== null}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingTicketFile ? 'Uploading...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showViewModal && viewingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Ticket Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Employee Information</h3>
                <p className="text-sm text-gray-600"><strong>Name:</strong> {getEmployeeName(viewingTicket.employeeId)}</p>
                <p className="text-sm text-gray-600"><strong>Employee ID:</strong> {viewingTicket.employeeId}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Flight Information</h3>
                <p className="text-sm text-gray-600"><strong>Route:</strong> {viewingTicket.departureCity} → {viewingTicket.destinationCity}</p>
                <p className="text-sm text-gray-600"><strong>Type:</strong> {viewingTicket.ticketType === 'round_trip' ? 'Round Trip' : 'One Way'}</p>
                <p className="text-sm text-gray-600"><strong>Departure Date:</strong> {formatDate(new Date(viewingTicket.departureDate))}</p>
                {viewingTicket.departureTime && <p className="text-sm text-gray-600"><strong>Departure Time:</strong> {viewingTicket.departureTime}</p>}
                {viewingTicket.ticketType === 'round_trip' && (
                  <>
                    <p className="text-sm text-gray-600"><strong>Return Date:</strong> {formatDate(new Date(viewingTicket.returnDate))}</p>
                    {viewingTicket.arrivalTime && <p className="text-sm text-gray-600"><strong>Arrival Time:</strong> {viewingTicket.arrivalTime}</p>}
                  </>
                )}
                <p className="text-sm text-gray-600"><strong>Passengers:</strong> {viewingTicket.passengers}</p>
                {viewingTicket.specialRequests && <p className="text-sm text-gray-600"><strong>Special Requests:</strong> {viewingTicket.specialRequests}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Ticket Details</h3>
                <p className="text-sm text-gray-600"><strong>Status:</strong> {TICKET_WORKFLOW_LABELS[viewingTicket.status]}</p>
                <p className="text-sm text-gray-600"><strong>Price:</strong> {viewingTicket.ticketPrice ? `$${viewingTicket.ticketPrice.toLocaleString()}` : 'Pending'}</p>
                {viewingTicket.ticketPdfUrl && (
                  <p className="text-sm text-gray-600">
                    <strong>Ticket PDF:</strong>{' '}
                    <a href={viewingTicket.ticketPdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      View PDF
                    </a>
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Vehicle & Transportation</h3>
                <p className="text-sm text-gray-600"><strong>Vehicle Number:</strong> {viewingTicket.vehicleNumber || 'Not assigned'}</p>
                <p className="text-sm text-gray-600"><strong>Driver:</strong> {viewingTicket.vehicleDriver || 'Not assigned'}</p>
                {viewingTicket.vanArrangedTime && <p className="text-sm text-gray-600"><strong>Van Arranged Time:</strong> {formatDate(new Date(viewingTicket.vanArrangedTime))}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Settlement Information</h3>
                <p className="text-sm text-gray-600"><strong>Settlement Amount:</strong> {viewingTicket.settlementAmount ? `$${viewingTicket.settlementAmount.toLocaleString()}` : 'Not set'}</p>
                {viewingTicket.settlementDate && <p className="text-sm text-gray-600"><strong>Settlement Date:</strong> {formatDate(new Date(viewingTicket.settlementDate))}</p>}
                <p className="text-sm text-gray-600"><strong>Handed To:</strong> {viewingTicket.settlementHandedTo || 'Not set'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Passport Information</h3>
                <p className="text-sm text-gray-600"><strong>Collected By:</strong> {viewingTicket.passportCollectedBy || 'Not collected'}</p>
                {viewingTicket.passportCollectedDate && <p className="text-sm text-gray-600"><strong>Collected Date:</strong> {formatDate(new Date(viewingTicket.passportCollectedDate))}</p>}
                <p className="text-sm text-gray-600"><strong>Handed To:</strong> {viewingTicket.passportHandedTo || 'Not handed'}</p>
                {viewingTicket.passportHandedDate && <p className="text-sm text-gray-600"><strong>Handed Date:</strong> {formatDate(new Date(viewingTicket.passportHandedDate))}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Arrangement Information</h3>
                <p className="text-sm text-gray-600"><strong>Arranged By:</strong> {viewingTicket.arrangedByName || viewingTicket.arrangedBy || 'Not set'}</p>
              </div>

              {viewingTicket.isLeaveExtended && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">Leave Extension</h3>
                  <p className="text-sm text-orange-600"><strong>Original Return Date:</strong> {viewingTicket.originalReturnDate ? formatDate(new Date(viewingTicket.originalReturnDate)) : 'Not set'}</p>
                </div>
              )}

              {viewingTicket.isTicketChanged && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2">Ticket Change</h3>
                  <p className="text-sm text-red-600"><strong>Reason:</strong> {viewingTicket.changeReason || 'Not specified'}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4">
                <p><strong>Booked Date:</strong> {formatDate(new Date(viewingTicket.bookedDate))}</p>
                {viewingTicket.updatedAt && <p><strong>Last Updated:</strong> {formatDate(new Date(viewingTicket.updatedAt))}</p>}
              </div>
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

      {/* Settlement Modal */}
      {showSettlementModal && settlementTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Staff Settlement</h2>
              <button onClick={() => setShowSettlementModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Employee Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Employee Information</h3>
              <p className="text-sm text-gray-600"><strong>Name:</strong> {getEmployeeName(settlementTicket.employeeId)}</p>
              <p className="text-sm text-gray-600"><strong>Employee ID:</strong> {settlementTicket.employeeId}</p>
            </div>

            {/* Attendance Selection */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Attendance Data</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={attendanceStartDate} onChange={(e) => setAttendanceStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={attendanceEndDate} onChange={(e) => setAttendanceEndDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button onClick={async () => {
                    console.log('Load Attendance clicked');
                    console.log('attendanceStartDate:', attendanceStartDate);
                    console.log('attendanceEndDate:', attendanceEndDate);
                    console.log('settlementTicket:', settlementTicket);
                    if (attendanceStartDate && attendanceEndDate && settlementTicket?.employeeId) {
                      try {
                        console.log('Calling getAttendance with:', settlementTicket.employeeId, new Date(attendanceStartDate), new Date(attendanceEndDate));
                        const data = await getAttendance(settlementTicket.employeeId, new Date(attendanceStartDate), new Date(attendanceEndDate));
                        console.log('Attendance data received:', data);
                        setSettlementAttendance(data);
                        const presentDays = data.filter((a: any) => a.status === 'present').length;
                        const absentDays = data.filter((a: any) => a.status === 'absent').length;
                        const halfDays = data.filter((a: any) => a.status === 'half_day').length;
                        const fridays = data.filter((a: any) => new Date(a.date).getDay() === 5).length;
                        setSettlementForm(prev => ({ ...prev, presentDays, absent: absentDays, halfDay: halfDays, fridayCount: fridays }));
                      } catch (error) {
                        console.error('Error loading attendance:', error);
                        alert('Error loading attendance. Please check the console for details.');
                      }
                    } else {
                      alert('Please fill in all attendance date fields');
                    }
                  }} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Load Attendance
                  </button>
                </div>
              </div>
              {settlementAttendance.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Day</th>
                        <th className="border p-2">IN</th>
                        <th className="border p-2">OUT</th>
                        <th className="border p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlementAttendance.map((att: any, i: number) => (
                        <tr key={i}>
                          <td className="border p-2">{formatDate(att.date)}</td>
                          <td className="border p-2">{new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                          <td className="border p-2">{att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                          <td className="border p-2">{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                          <td className="border p-2">{att.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Overtime Selection */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Overtime Data</h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={overtimeStartDate} onChange={(e) => setOvertimeStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={overtimeEndDate} onChange={(e) => setOvertimeEndDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rate per Hour (MVR)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.overtimeRate} onChange={(e) => setSettlementForm(prev => ({ ...prev, overtimeRate: Number(e.target.value) }))} />
                </div>
                <div className="flex items-end">
                  <button onClick={async () => {
                    console.log('Load Overtime clicked');
                    console.log('overtimeStartDate:', overtimeStartDate);
                    console.log('overtimeEndDate:', overtimeEndDate);
                    console.log('settlementTicket:', settlementTicket);
                    if (overtimeStartDate && overtimeEndDate && settlementTicket?.employeeId) {
                      try {
                        console.log('Calling getOvertimeRequests with:', settlementTicket.employeeId);
                        const data = await getOvertimeRequests(settlementTicket.employeeId);
                        console.log('Overtime data received:', data);
                        const filteredData = data.filter((ot: OvertimeRequest) => {
                          const otDate = new Date(ot.date);
                          const startDate = new Date(overtimeStartDate);
                          const endDate = new Date(overtimeEndDate);
                          return otDate >= startDate && otDate <= endDate;
                        });
                        console.log('Filtered overtime data:', filteredData);
                        setSettlementOvertime(filteredData);
                        const totalHours = filteredData.reduce((sum: number, ot: OvertimeRequest) => sum + (ot.hours || 0), 0);
                        setSettlementForm(prev => ({ ...prev, overtimeHours: totalHours, overtimeAmount: totalHours * prev.overtimeRate }));
                      } catch (error) {
                        console.error('Error loading overtime:', error);
                        alert('Error loading overtime. Please check the console for details.');
                      }
                    } else {
                      alert('Please fill in all overtime date fields');
                    }
                  }} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Load Overtime
                  </button>
                </div>
              </div>
              {settlementOvertime.length > 0 && (
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Hours</th>
                        <th className="border p-2">Rate</th>
                        <th className="border p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlementOvertime.map((ot: OvertimeRequest, i: number) => (
                        <tr key={i}>
                          <td className="border p-2">{formatDate(ot.date)}</td>
                          <td className="border p-2">{ot.hours?.toFixed(2) || 0}</td>
                          <td className="border p-2">{settlementForm.overtimeRate}</td>
                          <td className="border p-2">{new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((ot.hours || 0) * settlementForm.overtimeRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Total Hours</p>
                  <p className="text-lg font-bold">{settlementForm.overtimeHours.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Total Overtime Amount</p>
                  <p className="text-lg font-bold text-blue-700">MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.overtimeAmount)}</p>
                </div>
              </div>
            </div>

            {/* Salary Calculation */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Salary Calculation</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Salary (MVR)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.monthlySalary} onChange={(e) => setSettlementForm(prev => ({ ...prev, monthlySalary: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Salary Days</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.salaryDays} onChange={(e) => setSettlementForm(prev => ({ ...prev, salaryDays: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Salary Divisor</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.salaryDivisor} onChange={(e) => setSettlementForm(prev => ({ ...prev, salaryDivisor: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Daily Salary</label>
                  <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm font-semibold">MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.salaryDivisor > 0 ? settlementForm.monthlySalary / settlementForm.salaryDivisor : 0)}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Basic Pay</label>
                  <div className="w-full px-3 py-2 bg-blue-50 rounded-lg text-sm font-semibold text-blue-800">MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((settlementForm.monthlySalary / settlementForm.salaryDivisor) * settlementForm.salaryDays)}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Food Allowance Days</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.foodAllowanceDays} onChange={(e) => setSettlementForm(prev => ({ ...prev, foodAllowanceDays: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Food Allowance Per Day (MVR)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.foodAllowancePerDay} onChange={(e) => setSettlementForm(prev => ({ ...prev, foodAllowancePerDay: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Food Allowance</label>
                  <div className="w-full px-3 py-2 bg-orange-50 rounded-lg text-sm font-semibold text-orange-800">MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.foodAllowanceDays * settlementForm.foodAllowancePerDay)}</div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Deductions</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Other Deductions (MVR)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.deductions} onChange={(e) => setSettlementForm(prev => ({ ...prev, deductions: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Advance / Loan (MVR)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={settlementForm.advanceDeduction} onChange={(e) => setSettlementForm(prev => ({ ...prev, advanceDeduction: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Deductions</label>
                  <div className="w-full px-3 py-2 bg-red-50 rounded-lg text-sm font-semibold text-red-700">MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.deductions + settlementForm.advanceDeduction)}</div>
                </div>
              </div>
            </div>

            {/* Settlement Summary */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Final Settlement Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between px-4 py-2"><span>Basic Salary</span><span>MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((settlementForm.monthlySalary / settlementForm.salaryDivisor) * settlementForm.salaryDays)}</span></div>
                <div className="flex justify-between px-4 py-2"><span>Overtime</span><span>MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.overtimeAmount)}</span></div>
                <div className="flex justify-between px-4 py-2"><span>Food Allowance</span><span>MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.foodAllowanceDays * settlementForm.foodAllowancePerDay)}</span></div>
                <div className="flex justify-between px-4 py-2 font-semibold"><span>Total Earnings</span><span>MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(((settlementForm.monthlySalary / settlementForm.salaryDivisor) * settlementForm.salaryDays) + settlementForm.overtimeAmount + (settlementForm.foodAllowanceDays * settlementForm.foodAllowancePerDay))}</span></div>
                <div className="flex justify-between px-4 py-2"><span>Total Deductions</span><span>MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(settlementForm.deductions + settlementForm.advanceDeduction)}</span></div>
                <div className="flex justify-between px-4 py-3 bg-gray-900 text-white font-bold"><span>NET SETTLEMENT</span><span>MVR {new Intl.NumberFormat('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(((settlementForm.monthlySalary / settlementForm.salaryDivisor) * settlementForm.salaryDays) + settlementForm.overtimeAmount + (settlementForm.foodAllowanceDays * settlementForm.foodAllowancePerDay) - (settlementForm.deductions + settlementForm.advanceDeduction))}</span></div>
              </div>
            </div>

            {/* Remarks */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Remarks</h3>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]" value={settlementForm.remarks} onChange={(e) => setSettlementForm(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Enter settlement notes..." />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSettlementModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save Settlement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
