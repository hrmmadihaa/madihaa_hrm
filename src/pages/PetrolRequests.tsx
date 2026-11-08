import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { getAllWorkLocations } from '../lib/workLocation';
import { getEmployees } from '../lib/employees';
import { Button } from '../components/ui/Button';
import { Plus, Filter, Check, X } from 'lucide-react';

interface PetrolRequest {
  id: string;
  requestDate: Date;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverEmployeeId?: string;
  kmStart: number;
  kmEnd: number;
  drivenKm: number;
  petrolAmount: number;
  receiptNumber?: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt?: Date;
}

interface Vehicle {
  regNo: string;
  type: string;
  make?: string;
  model?: string;
  year?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export const PetrolRequests: React.FC = () => {
  const { isSupervisorOrAbove, isSuperAdmin, role } = usePermissions();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [lastSubmittedRequest, setLastSubmittedRequest] = useState<PetrolRequest | null>(null);
  const [requests, setRequests] = useState<PetrolRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all-time' | 'this-month' | 'last-month'>('all-time');
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    vehicleType: '',
    driverName: '',
    driverEmployeeId: '',
    kmStart: '',
    kmEnd: '',
    drivenKm: '',
    petrolAmount: '',
    receiptNumber: '',
    requestedBy: '',
    approvedBy: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load petrol requests
      const requestsQuery = query(collection(db, 'petrol_requests'), orderBy('createdAt', 'desc'));
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate?.() || new Date(doc.data().requestDate),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      })) as PetrolRequest[];
      setRequests(requestsData);

      // Load vehicles
      const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
      const vehiclesData = vehiclesSnapshot.docs.map(doc => doc.data() as Vehicle);
      setVehicles(vehiclesData);

      // Load work locations
      const workLocationsData = await getAllWorkLocations();
      setWorkLocations(workLocationsData);

      // Load employees using getEmployees function
      const employeesData = await getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate KM values
    const kmStart = parseFloat(formData.kmStart) || 0;
    const kmEnd = parseFloat(formData.kmEnd) || 0;
    
    if (kmEnd <= kmStart) {
      alert('KM End must be greater than KM Start. Please check your values.');
      return;
    }
    
    try {
      // Generate sequential slip number
      const nextSlipNumber = requests.length + 1;
      const slipNumber = `MADPET${String(nextSlipNumber).padStart(4, '0')}`;

      const newRequest: Omit<PetrolRequest, 'id'> = {
        requestDate: new Date(formData.requestDate),
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        driverName: formData.driverName,
        driverEmployeeId: formData.driverEmployeeId,
        kmStart: kmStart,
        kmEnd: kmEnd,
        drivenKm: kmEnd - kmStart,
        petrolAmount: parseFloat(formData.petrolAmount) || 0,
        receiptNumber: formData.receiptNumber,
        requestedBy: formData.requestedBy,
        approvedBy: '',
        status: 'Pending',
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'petrol_requests'), newRequest);
      
      // Find previous request for this vehicle to get previous KM End
      const vehicleRequests = requests.filter(r => r.vehicleNumber === formData.vehicleNumber);
      const sortedVehicleRequests = vehicleRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const previousRequest = sortedVehicleRequests.find(r => r.id !== docRef.id);
      
      const submittedRequest = { 
        ...newRequest, 
        id: docRef.id,
        slipNumber,
        previousKmEnd: previousRequest?.kmEnd || 0
      };
      
      setLastSubmittedRequest(submittedRequest as any);
      setShowForm(false);
      setShowPrintSlip(true);
      setFormData({
        ...formData,
        vehicleNumber: '',
        vehicleType: '',
        driverName: '',
        driverEmployeeId: '',
        kmStart: '',
        kmEnd: '',
        drivenKm: '',
        petrolAmount: '',
        receiptNumber: '',
      });
      loadData();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'petrol_requests', requestId);
      const request = requests.find(r => r.id === requestId);
      
      if (!request) return;

      let newStatus: 'Pending' | 'Approved' | 'Rejected';
      let approvedBy: string;

      if (isSuperAdmin()) {
        // Super admin auto-approves
        newStatus = 'Approved';
        approvedBy = user?.displayName || user?.email || 'Super Admin';
      } else {
        // Supervisor sends to super admin for approval
        newStatus = 'Pending';
        approvedBy = user?.displayName || user?.email || 'Supervisor';
      }

      await updateDoc(requestRef, {
        status: newStatus,
        approvedBy: approvedBy,
        updatedAt: new Date()
      });

      alert(isSuperAdmin() ? 'Request approved successfully!' : 'Request sent to Super Admin for approval');
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    
    try {
      const requestRef = doc(db, 'petrol_requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'Rejected',
        approvedBy: user?.displayName || user?.email || role,
        updatedAt: new Date()
      });

      alert('Request rejected successfully');
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleNumber = e.target.value;
    const selectedVehicle = vehicles.find(v => v.regNo === vehicleNumber);
    
    // Find the most recent request for this vehicle to get the last KM End
    const vehicleRequests = requests.filter(r => r.vehicleNumber === vehicleNumber);
    const sortedVehicleRequests = vehicleRequests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastRequest = sortedVehicleRequests[0];
    
    const lastKmEnd = lastRequest?.kmEnd ? String(lastRequest.kmEnd) : '';
    
    setFormData({
      ...formData,
      vehicleNumber,
      vehicleType: selectedVehicle?.type || '',
      kmStart: lastKmEnd,
      kmEnd: '',
      drivenKm: '',
    });
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    const employee = employees.find(emp => emp.id === employeeId);
    setFormData({
      ...formData,
      driverEmployeeId: employeeId,
      driverName: employee?.fullName || '',
    });
  };

  // Get only drivers from the "Drivers" work location
  const getAssignedStaff = () => {
    console.log('Work locations:', workLocations);
    console.log('Employees:', employees);
    
    const driversLocation = workLocations.find(loc => loc.name === 'Drivers');
    console.log('Drivers location:', driversLocation);
    
    if (!driversLocation || !driversLocation.assignedStaff) {
      console.log('No Drivers location or no assigned staff');
      return [];
    }
    
    console.log('Driver staff IDs:', driversLocation.assignedStaff);
    
    const drivers = employees.filter(emp => driversLocation.assignedStaff.includes(emp.id));
    console.log('Drivers:', drivers);
    
    // Filter by search term
    const filteredDrivers = drivers.filter(emp => {
      const searchLower = driverSearchTerm.toLowerCase();
      return (
        emp.fullName?.toLowerCase().includes(searchLower) ||
        emp.employeeId?.toLowerCase().includes(searchLower)
      );
    });
    
    return filteredDrivers;
  };

  const calculateDrivenKm = () => {
    const start = parseFloat(formData.kmStart) || 0;
    const end = parseFloat(formData.kmEnd) || 0;
    if (end > start) {
      setFormData({
        ...formData,
        drivenKm: (end - start).toFixed(2),
      });
    }
  };

  const getFilteredRequests = () => {
    const now = new Date();
    if (filter === 'all-time') return requests;
    
    if (filter === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return requests.filter(req => {
        const reqDate = new Date(req.createdAt);
        return reqDate >= start && reqDate <= end;
      });
    }
    
    if (filter === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return requests.filter(req => {
        const reqDate = new Date(req.createdAt);
        return reqDate >= start && reqDate <= end;
      });
    }
    
    return requests;
  };

  const filteredRequests = getFilteredRequests();

  // Group by vehicle for summary
  const requestsByVehicle = filteredRequests.reduce((acc, req) => {
    if (!acc[req.vehicleNumber]) acc[req.vehicleNumber] = [];
    acc[req.vehicleNumber].push(req);
    return acc;
  }, {} as Record<string, PetrolRequest[]>);

  if (!isSupervisorOrAbove()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Petrol Requests</h1>
          <p className="text-gray-600">Manage vehicle petrol requests and reports</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">New Petrol Request</h2>
              <Button variant="ghost" onClick={() => setShowForm(false)}>✕</Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                  <input
                    type="date"
                    required
                    value={formData.requestDate}
                    onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <select
                    required
                    value={formData.vehicleNumber}
                    onChange={handleVehicleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.regNo} value={v.regNo}>{v.regNo}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <input
                    type="text"
                    placeholder="Search driver by name or ID..."
                    value={driverSearchTerm}
                    onChange={(e) => setDriverSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <select
                    required
                    value={formData.driverEmployeeId}
                    onChange={handleDriverChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Driver</option>
                    {getAssignedStaff().map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM Start</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.kmStart}
                    onChange={(e) => {
                      setFormData({ ...formData, kmStart: e.target.value });
                      calculateDrivenKm();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM End</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.kmEnd}
                    onChange={(e) => {
                      setFormData({ ...formData, kmEnd: e.target.value });
                      calculateDrivenKm();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driven KM</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.drivenKm}
                    onChange={(e) => setFormData({ ...formData, drivenKm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Petrol Amount (Liters)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.petrolAmount}
                    onChange={(e) => setFormData({ ...formData, petrolAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                  <input
                    type="text"
                    required
                    value={formData.requestedBy}
                    onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('all-time')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all-time' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter('this-month')}
            className={`px-3 py-1 rounded text-sm ${filter === 'this-month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilter('last-month')}
            className={`px-3 py-1 rounded text-sm ${filter === 'last-month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Last Month
          </button>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Vehicle Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Petrol (L)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(requestsByVehicle).map(([vehicleNumber, vehicleRequests]) => {
                const sortedRequests = [...vehicleRequests].sort((a, b) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                const latestRequest = sortedRequests[0];
                const totals = vehicleRequests.reduce((acc, req) => ({
                  totalPetrol: acc.totalPetrol + (req.petrolAmount || 0),
                  totalDrivenKm: acc.totalDrivenKm + (req.drivenKm || 0),
                }), { totalPetrol: 0, totalDrivenKm: 0 });
                
                const costPerKm = totals.totalDrivenKm > 0 
                  ? (totals.totalPetrol / totals.totalDrivenKm).toFixed(2) 
                  : 'N/A';

                return (
                  <tr key={vehicleNumber}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicleNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{latestRequest.driverName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(latestRequest.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{latestRequest.kmEnd}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{totals.totalPetrol.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{totals.totalDrivenKm.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{costPerKm}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        latestRequest.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        latestRequest.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {latestRequest.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {latestRequest.status === 'Pending' && isSupervisorOrAbove() && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(latestRequest.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              {isSuperAdmin() ? 'Approve' : 'Send to Admin'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReject(latestRequest.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const requestWithSlip = {
                              ...latestRequest,
                              slipNumber: `MADPET${String(requests.indexOf(latestRequest) + 1).padStart(4, '0')}`,
                              previousKmEnd: vehicleRequests
                                .filter(r => r.id !== latestRequest.id)
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.kmEnd || 0
                            };
                            setLastSubmittedRequest(requestWithSlip as any);
                            setShowPrintSlip(true);
                          }}
                        >
                          Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Slip Modal */}
      {showPrintSlip && lastSubmittedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Petrol Request Slip</h2>
              <Button variant="ghost" onClick={() => setShowPrintSlip(false)}>✕</Button>
            </div>

            {/* Printable Slip */}
            <div id="print-slip" className="border-2 border-gray-300 p-6 bg-white">
              {/* Letterhead */}
              <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
                <div className="flex items-center justify-center mb-2">
                  <img src="/madihaa (1).jpg" alt="Madihaa Logo" className="h-16 object-contain" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Madihaa Pvt Ltd</h1>
                <p className="text-sm text-gray-600">Human Resource Management System</p>
                <p className="text-xs text-gray-500 mt-1">Petrol Request Slip</p>
              </div>

              {/* Request Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Slip Number:</p>
                    <p className="font-bold text-lg text-primary-600">{(lastSubmittedRequest as any).slipNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Request Date:</p>
                    <p className="font-semibold">{new Date(lastSubmittedRequest.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vehicle Number:</p>
                    <p className="font-semibold">{lastSubmittedRequest.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vehicle Type:</p>
                    <p className="font-semibold">{lastSubmittedRequest.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Driver Name:</p>
                    <p className="font-semibold">{lastSubmittedRequest.driverName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Driver ID:</p>
                    <p className="font-semibold">{lastSubmittedRequest.driverEmployeeId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Previous KM End:</p>
                    <p className="font-semibold text-gray-600">{(lastSubmittedRequest as any).previousKmEnd || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">KM Start:</p>
                    <p className="font-semibold">{lastSubmittedRequest.kmStart}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">KM End:</p>
                    <p className="font-semibold">{lastSubmittedRequest.kmEnd}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Driven KM:</p>
                    <p className="font-semibold">{lastSubmittedRequest.drivenKm}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Petrol Amount (Liters):</p>
                    <p className="font-semibold">{lastSubmittedRequest.petrolAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Receipt Number:</p>
                    <p className="font-semibold">{lastSubmittedRequest.receiptNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Requested By:</p>
                    <p className="font-semibold">{lastSubmittedRequest.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status:</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lastSubmittedRequest.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      lastSubmittedRequest.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lastSubmittedRequest.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Approved By:</p>
                    <p className="font-semibold">{lastSubmittedRequest.approvedBy || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <p className="text-xs text-gray-500 text-center">
                  Generated on: {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  const printContent = document.getElementById('print-slip');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Petrol Request Slip</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 20px; }
                              @media print { body { padding: 0; } }
                            </style>
                          </head>
                          <body>${printContent.innerHTML}</body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }
                }}
                className="flex-1"
              >
                Print Slip
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPrintSlip(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
