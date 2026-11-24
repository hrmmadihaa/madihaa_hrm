import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ExportButton } from '../components/ExportButton';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Plus, Edit, Trash2, X, Search, CreditCard, Upload, Image as ImageIcon } from 'lucide-react';
import { getLicenses, addLicense, updateLicense, deleteLicense, type License } from '../lib/fleet';
import { getEmployees } from '../lib/employees';
import { uploadImage } from '../lib/cloudinary';

export const FleetLicense = () => {
  const [data, setData] = useState<License[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'expired' | 'expiring' | 'valid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<License | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    category: '',
    licenseNo: '',
    expiryDate: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
    loadEmployees();
  }, []);

  const loadData = async () => {
    const licenses = await getLicenses();
    setData(licenses);
  };

  const loadEmployees = async () => {
    const empList = await getEmployees();
    setEmployees(empList);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      employeeId: '',
      employeeName: '',
      category: '',
      licenseNo: '',
      expiryDate: '',
      imageUrl: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item: License) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      category: item.category,
      licenseNo: item.licenseNo,
      expiryDate: item.expiryDate,
      imageUrl: item.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this license?')) {
      await deleteLicense(id);
      loadData();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, 'licenses', formData.employeeId || `license_${Date.now()}`);
      setFormData({ ...formData, imageUrl });
    } catch (error) {
      alert('Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.employeeId || !formData.licenseNo || !formData.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedEmployee = employees.find(e => e.id === formData.employeeId);
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const dataToSave = {
      ...formData,
      employeeName: selectedEmployee.fullName,
      daysLeft
    };

    if (editingItem) {
      await updateLicense(editingItem.id!, dataToSave);
    } else {
      await addLicense(dataToSave);
    }

    setShowModal(false);
    loadData();
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData({
      ...formData,
      employeeId,
      employeeName: employee?.fullName || ''
    });
  };

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const filteredData = data.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    
    if (filter === 'expired') return expiryDate < today;
    if (filter === 'expiring') return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    if (filter === 'valid') return expiryDate > thirtyDaysFromNow;
    return true;
  }).filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return item.employeeName.toLowerCase().includes(searchLower) ||
           item.category.toLowerCase().includes(searchLower) ||
           item.licenseNo.toLowerCase().includes(searchLower);
  });

  const getStatus = (expiryDate: string) => {
    if (!expiryDate) return { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock };
    
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
    expired: data.filter(item => item.expiryDate && new Date(item.expiryDate) < today).length,
    expiring: data.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      return expiry >= today && expiry <= thirtyDaysFromNow;
    }).length,
    valid: data.filter(item => item.expiryDate && new Date(item.expiryDate) > thirtyDaysFromNow).length
  };

  // Prepare data for export
  const exportData = filteredData.map(item => ({
    'Employee Name': item.employeeName,
    'Category': item.category,
    'License No': item.licenseNo,
    'Expiry Date': item.expiryDate,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/fleet">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">License</h1>
              <p className="text-sm text-secondary-600">Track driver license information</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:w-auto w-full">
          <ExportButton
            data={exportData}
            filename={`fleet-licenses-${new Date().toISOString().split('T')[0]}`}
            title="Fleet Licenses Report"
          />
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add License
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            placeholder="Search by name, category, or license number..."
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">License No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider">Image</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {filteredData.map((item) => {
                const status = getStatus(item.expiryDate);
                const StatusIcon = status.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-900">{item.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 text-secondary-600">{item.category || '-'}</td>
                    <td className="px-6 py-4 text-secondary-600">{item.licenseNo || '-'}</td>
                    <td className="px-6 py-4 text-secondary-600">{item.expiryDate || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
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
            <CreditCard className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
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
                {editingItem ? 'Edit License' : 'Add License'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Employee *
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., B1 C1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  License No *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.licenseNo}
                  onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                  placeholder="Enter license number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  License Image
                </label>
                <div className="space-y-3">
                  {formData.imageUrl && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-secondary-200">
                      <img
                        src={formData.imageUrl}
                        alt="License preview"
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
