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
  mvrAmount?: number;
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
    const firestoreId = e.target.value;
    const employee = employees.find(emp => emp.id === firestoreId);
    setFormData({
      ...formData,
      driverEmployeeId: employee?.employeeId || '',
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
                    value={employees.find(emp => emp.employeeId === formData.driverEmployeeId)?.id || ''}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Petrol Amount (MVR)</label>
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
            <div id="print-slip" style={{ width: '148mm', height: '210mm', fontFamily: 'Arial, sans-serif', border: '2px solid #d1d5db', padding: '16px', backgroundColor: 'white', boxSizing: 'border-box' }}>
              {/* Letterhead */}
              <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #1f2937', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                  <img src={`${window.location.origin}/madihaa (1).jpg`} alt="Madihaa Logo" style={{ height: '60px', objectFit: 'contain' }} />
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>Madihaa Pvt Ltd</h1>
                <p style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500', margin: '0 0 6px 0' }}>Human Resource Management System</p>
                <div style={{ marginTop: '6px', display: 'inline-block', backgroundColor: '#2563eb', color: 'white', padding: '3px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
                  Petrol Request Slip
                </div>
              </div>

              {/* Slip Number & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>Slip Number</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>{(lastSubmittedRequest as any).slipNumber || 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>Request Date</p>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{new Date(lastSubmittedRequest.requestDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Vehicle Information Section */}
              <div style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid #d1d5db', paddingBottom: '3px', margin: '0 0 6px 0' }}>Vehicle Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Vehicle Number</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.vehicleNumber}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Vehicle Type</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.vehicleType}</p>
                  </div>
                </div>
              </div>

              {/* Driver Information Section */}
              <div style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid #d1d5db', paddingBottom: '3px', margin: '0 0 6px 0' }}>Driver Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Driver Name</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.driverName}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Driver ID</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>
                      {(() => {
                        const storedId = lastSubmittedRequest.driverEmployeeId;
                        // Check if it's a Firestore ID (starts with letter, longer than 10 chars)
                        if (storedId && /^[a-zA-Z]/.test(storedId) && storedId.length > 10) {
                          // Look up employee by Firestore ID and return actual employeeId
                          const employee = employees.find(emp => emp.id === storedId);
                          return employee?.employeeId || storedId;
                        }
                        return storedId || 'N/A';
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kilometer Details Section */}
              <div style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid #d1d5db', paddingBottom: '3px', margin: '0 0 6px 0' }}>Kilometer Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Previous KM End</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', margin: '0' }}>{(lastSubmittedRequest as any).previousKmEnd || 'N/A'}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>KM Start</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.kmStart}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>KM End</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.kmEnd}</p>
                  </div>
                  <div style={{ backgroundColor: '#eff6ff', padding: '6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                    <p style={{ fontSize: '10px', color: '#2563eb', fontWeight: '500', margin: '0 0 2px 0' }}>Driven KM</p>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8', margin: '0' }}>{lastSubmittedRequest.drivenKm}</p>
                  </div>
                </div>
              </div>

              {/* Petrol Details Section */}
              <div style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid #d1d5db', paddingBottom: '3px', margin: '0 0 6px 0' }}>Petrol Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    <p style={{ fontSize: '10px', color: '#16a34a', fontWeight: '500', margin: '0 0 2px 0' }}>Petrol Amount (MVR)</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803d', margin: '0' }}>{lastSubmittedRequest.petrolAmount}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Receipt Number</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.receiptNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Approval Section */}
              <div style={{ marginBottom: '10px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', borderBottom: '1px solid #d1d5db', paddingBottom: '3px', margin: '0 0 6px 0' }}>Approval Status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Requested By</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.requestedBy}</p>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Status</p>
                    <span style={{ display: 'inline-block', padding: '3px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '9999px', backgroundColor: lastSubmittedRequest.status === 'Approved' ? '#dcfce7' : lastSubmittedRequest.status === 'Rejected' ? '#fee2e2' : '#fef9c3', color: lastSubmittedRequest.status === 'Approved' ? '#166534' : lastSubmittedRequest.status === 'Rejected' ? '#991b1b' : '#854d0e' }}>
                      {lastSubmittedRequest.status}
                    </span>
                  </div>
                  <div style={{ gridColumn: 'span 2', backgroundColor: '#f9fafb', padding: '6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px 0' }}>Approved By</p>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: '0' }}>{lastSubmittedRequest.approvedBy || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '2px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0' }}>
                    Generated: {new Date().toLocaleString()}
                  </p>
                  <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0' }}>
                    Madihaa HRMS - Petrol Management
                  </p>
                </div>
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
                              @page {
                                size: A5;
                                margin: 10mm;
                              }
                              body {
                                font-family: Arial, sans-serif;
                                margin: 0;
                                padding: 0;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                              }
                              @media print {
                                body { padding: 0; }
                              }
                            </style>
                          </head>
                          <body>${printContent.innerHTML}</body>
                        </html>
                      `);
                      printWindow.document.close();
                      setTimeout(() => {
                        printWindow.print();
                      }, 100);
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
