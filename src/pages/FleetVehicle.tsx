import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ExportButton } from '../components/ExportButton';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Plus, Edit, Trash2, X, Search, Truck, Upload, Image as ImageIcon } from 'lucide-react';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, type Vehicle } from '../lib/fleet';
import { getEmployees } from '../lib/employees';
import { uploadImage } from '../lib/cloudinary';

export const FleetVehicle = () => {
  const [data, setData] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'expired' | 'expiring' | 'valid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicleNo: '',
    registration: '',
    model: '',
    type: '',
    insuranceExpiry: '',
    roadTaxExpiry: '',
    assignedEmployeeId: '',
    assignedEmployeeName: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
    loadEmployees();
  }, []);

  const loadData = async () => {
    const vehicles = await getVehicles();
    setData(vehicles);
  };

  const loadEmployees = async () => {
    const empList = await getEmployees();
    setEmployees(empList);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      vehicleNo: '',
      registration: '',
      model: '',
      type: '',
      insuranceExpiry: '',
      roadTaxExpiry: '',
      assignedEmployeeId: '',
      assignedEmployeeName: '',
      imageUrl: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item: Vehicle) => {
    setEditingItem(item);
    setFormData({
      vehicleNo: item.vehicleNo,
      registration: item.registration,
      model: item.model,
      type: item.type,
      insuranceExpiry: item.insuranceExpiry,
      roadTaxExpiry: item.roadTaxExpiry,
      assignedEmployeeId: item.assignedEmployeeId || '',
      assignedEmployeeName: item.assignedEmployeeName || '',
      imageUrl: item.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      await deleteVehicle(id);
      loadData();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'vehicles', formData.vehicleNo || `vehicle_${Date.now()}`);
      setFormData({ ...formData, imageUrl });
    } catch (error) {
      alert('Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.vehicleNo) {
      alert('Please fill in vehicle number');
      return;
    }

    const selectedEmployee = employees.find(e => e.id === formData.assignedEmployeeId);
    const dataToSave = {
      ...formData,
      assignedEmployeeName: selectedEmployee?.fullName || ''
    };

    if (editingItem) {
      await updateVehicle(editingItem.id!, dataToSave);
    } else {
      await addVehicle(dataToSave);
    }

    setShowModal(false);
    loadData();
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData({
      ...formData,
      assignedEmployeeId: employeeId,
      assignedEmployeeName: employee?.fullName || ''
    });
  };

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const filteredData = data.filter(item => {
    if (!item.insuranceExpiry && !item.roadTaxExpiry) return false;
    const insuranceExpiry = item.insuranceExpiry ? new Date(item.insuranceExpiry) : null;
    const roadTaxExpiry = item.roadTaxExpiry ? new Date(item.roadTaxExpiry) : null;
    
    const isExpired = (insuranceExpiry && insuranceExpiry < today) || (roadTaxExpiry && roadTaxExpiry < today);
    const isExpiring = (insuranceExpiry && insuranceExpiry >= today && insuranceExpiry <= thirtyDaysFromNow) || 
                      (roadTaxExpiry && roadTaxExpiry >= today && roadTaxExpiry <= thirtyDaysFromNow);
    const isValid = (!insuranceExpiry || insuranceExpiry > thirtyDaysFromNow) && 
                   (!roadTaxExpiry || roadTaxExpiry > thirtyDaysFromNow);
    
    if (filter === 'expired') return isExpired;
    if (filter === 'expiring') return isExpiring && !isExpired;
    if (filter === 'valid') return isValid;
    return true;
  }).filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return item.vehicleNo.toLowerCase().includes(searchLower) ||
           item.registration.toLowerCase().includes(searchLower) ||
           item.type.toLowerCase().includes(searchLower);
  });

  const getStatus = (expiryDate: string) => {
    if (!expiryDate) return { label: 'N/A', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock };
    
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { label: 'Expired', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle };
    } else if (daysUntil <= 30) {
      return { label: `${daysUntil}d left`, color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle };
    } else {
      return { label: 'Valid', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle };
    }
  };

  const stats = {
    total: data.length,
    expired: data.filter(item => {
      const insuranceExpiry = item.insuranceExpiry ? new Date(item.insuranceExpiry) : null;
      const roadTaxExpiry = item.roadTaxExpiry ? new Date(item.roadTaxExpiry) : null;
      return (insuranceExpiry && insuranceExpiry < today) || (roadTaxExpiry && roadTaxExpiry < today);
    }).length,
    expiring: data.filter(item => {
      const insuranceExpiry = item.insuranceExpiry ? new Date(item.insuranceExpiry) : null;
      const roadTaxExpiry = item.roadTaxExpiry ? new Date(item.roadTaxExpiry) : null;
      const isExpiring = (insuranceExpiry && insuranceExpiry >= today && insuranceExpiry <= thirtyDaysFromNow) || 
                         (roadTaxExpiry && roadTaxExpiry >= today && roadTaxExpiry <= thirtyDaysFromNow);
      const isExpired = (insuranceExpiry && insuranceExpiry < today) || (roadTaxExpiry && roadTaxExpiry < today);
      return isExpiring && !isExpired;
    }).length,
    valid: data.filter(item => {
      const insuranceExpiry = item.insuranceExpiry ? new Date(item.insuranceExpiry) : null;
      const roadTaxExpiry = item.roadTaxExpiry ? new Date(item.roadTaxExpiry) : null;
      return (!insuranceExpiry || insuranceExpiry > thirtyDaysFromNow) && 
             (!roadTaxExpiry || roadTaxExpiry > thirtyDaysFromNow);
    }).length
  };

  // Prepare data for export
  const exportData = filteredData.map(item => ({
    'Vehicle No': item.vehicleNo,
    'Registration': item.registration,
    'Model': item.model,
    'Type': item.type,
    'Insurance Expiry': item.insuranceExpiry,
    'Road Tax Expiry': item.roadTaxExpiry,
    'Assigned Employee': item.assignedEmployeeName || 'Unassigned',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/fleet">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Vehicle</h1>
              <p className="text-sm text-secondary-600">Manage vehicle fleet, insurance and road tax</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={exportData}
            filename={`fleet-vehicles-${new Date().toISOString().split('T')[0]}`}
            title="Fleet Vehicles Report"
          />
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-secondary-200 shadow-sm">
          <div className="text-sm text-secondary-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-secondary-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="text-sm text-red-600 mb-1">Expired</div>
          <div className="text-2xl font-bold text-red-700">{stats.expired}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
          <div className="text-sm text-orange-600 mb-1">Expiring Soon</div>
          <div className="text-2xl font-bold text-orange-700">{stats.expiring}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="text-sm text-green-600 mb-1">Valid</div>
          <div className="text-2xl font-bold text-green-700">{stats.valid}</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by vehicle number, registration, or type..."
            className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'expired' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('expired')}
          >
            Expired
          </Button>
          <Button
            variant={filter === 'expiring' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('expiring')}
          >
            Expiring
          </Button>
          <Button
            variant={filter === 'valid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('valid')}
          >
            Valid
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Vehicle No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Registration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Model</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Insurance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Road Tax</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {filteredData.map((item) => {
                const insuranceStatus = getStatus(item.insuranceExpiry);
                const roadTaxStatus = getStatus(item.roadTaxExpiry);
                const InsuranceIcon = insuranceStatus.icon;
                const RoadTaxIcon = roadTaxStatus.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-900">{item.vehicleNo}</div>
                    </td>
                    <td className="px-6 py-4 text-secondary-600">{item.registration || '-'}</td>
                    <td className="px-6 py-4 text-secondary-600">{item.model || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {item.type || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${insuranceStatus.color}`}>
                        <InsuranceIcon className="w-3 h-3" />
                        {item.insuranceExpiry || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roadTaxStatus.color}`}>
                        <RoadTaxIcon className="w-3 h-3" />
                        {item.roadTaxExpiry || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-secondary-600">{item.assignedEmployeeName || '-'}</td>
                    <td className="px-6 py-4">
                      {item.imageUrl ? (
                        <button
                          onClick={() => window.open(item.imageUrl, '_blank')}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id!)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No records found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-semibold text-secondary-900">
                {editingItem ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Vehicle No *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                  placeholder="Enter vehicle number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Registration
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                  placeholder="Enter registration number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Enter vehicle model"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Type
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Van, Truck, Car"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Insurance Expiry
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Road Tax Expiry
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.roadTaxExpiry}
                  onChange={(e) => setFormData({ ...formData, roadTaxExpiry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Assigned Employee
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.assignedEmployeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                >
                  <option value="">Select Employee (Optional)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Vehicle Image
                </label>
                <div className="space-y-3">
                  {formData.imageUrl && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-secondary-200">
                      <img
                        src={formData.imageUrl}
                        alt="Vehicle preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-secondary-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all">
                      <Upload className="w-5 h-5 text-secondary-400" />
                      <span className="text-sm text-secondary-600">
                        {uploading ? 'Uploading...' : 'Upload image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-secondary-200 bg-secondary-50 rounded-b-2xl">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
