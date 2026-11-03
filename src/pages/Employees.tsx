import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Eye, Edit, Trash2, UserPlus, Upload, Grid, List } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { EmployeeCard } from '../components/EmployeeCard';
import { getEmployees, deleteEmployee, updateEmployee } from '../lib/employees';
import { importEmployeesFromJSON, validateMasterEmployeeJSON, normalizeExistingEmployeeNames, removeDuplicateEmployees } from '../lib/importEmployees';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../lib/permissions';
import type { Employee } from '../types';

export const Employees = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; skipped: number; errors: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'on_leave' | 'no_status' | 'past'>('current');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setAllEmployees(data);
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        loadEmployees();
      } catch (error) {
        alert('Failed to delete employee: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handlePhotoUpload = async (employeeId: string, employee: Employee) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingPhoto(employeeId);
      try {
        const { uploadImage } = await import('../lib/cloudinary');
        const cloudinaryUrl = await uploadImage(file, 'employee_images', employeeId);
        
        await updateEmployee(employee.id, { photo: cloudinaryUrl });
        loadEmployees();
        alert('Photo uploaded successfully!');
      } catch (error) {
        alert('Failed to upload photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setUploadingPhoto(null);
      }
    };
    input.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Validate JSON structure and get valid rows
      const validation = validateMasterEmployeeJSON(jsonData);
      if (!validation.valid) {
        setImportResults({
          success: 0,
          failed: 0,
          skipped: 0,
          errors: validation.errors
        });
        return;
      }

      // Import only valid rows (skips empty rows)
      const results = await importEmployeesFromJSON(validation.validRows);
      setImportResults(results);

      if (results.success > 0) {
        loadEmployees();
      }
    } catch (error) {
      setImportResults({
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Failed to parse JSON file']
      });
    } finally {
      setImporting(false);
    }
  };

  const handleNormalizeNames = async () => {
    if (!window.confirm('This will normalize all employee names to title case format. Continue?')) return;
    
    setImporting(true);
    try {
      const results = await normalizeExistingEmployeeNames();
      alert(`Normalized ${results.updated} employee names. ${results.failed} failed.`);
      loadEmployees();
    } catch (error) {
      alert('Failed to normalize names: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!window.confirm('This will remove duplicate employees from the database (keeping only the most recent version of each employee). Continue?')) return;
    
    setImporting(true);
    try {
      const results = await removeDuplicateEmployees();
      alert(`Removed ${results.removed} duplicate employees. Kept ${results.kept} unique employees. ${results.errors.length} errors.`);
      loadEmployees();
    } catch (error) {
      alert('Failed to remove duplicates: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    
    // Filter based on active tab
    const validStatuses = ['active', 'resigned', 'terminated', 'on_leave'];
    const hasValidStatus = validStatuses.includes(employee.status);
    
    const matchesTab = activeTab === 'current' 
      ? employee.status === 'active'
      : activeTab === 'on_leave'
      ? (employee.status === 'on_leave')
      : activeTab === 'no_status'
      ? !hasValidStatus
      : (employee.status === 'resigned' || employee.status === 'terminated');
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    resigned: 'bg-red-100 text-red-800',
    terminated: 'bg-red-100 text-red-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Employees</h1>
          <p className="text-secondary-600 mt-1">Manage your workforce</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRemoveDuplicates} variant="secondary" className="sm:w-auto w-full">
            Remove Duplicates
          </Button>
          <Button onClick={handleNormalizeNames} variant="secondary" className="sm:w-auto w-full">
            Normalize Names
          </Button>
          {can(PERMISSIONS.EMPLOYEES_CREATE) && (
            <Button onClick={() => navigate('/employees/new')} className="sm:w-auto w-full">
              <UserPlus className="w-5 h-5 mr-2" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-secondary-200 overflow-x-auto pb-2 sm:pb-0">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'current'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          Current Employees
        </button>
        <button
          onClick={() => setActiveTab('on_leave')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'on_leave'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          On Leave
        </button>
        <button
          onClick={() => setActiveTab('no_status')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'no_status'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          No Status
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'past'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-secondary-600 hover:text-secondary-900'
          }`}
        >
          Past Employees
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">
              {activeTab === 'current' ? 'Current' : activeTab === 'on_leave' ? 'On Leave' : activeTab === 'no_status' ? 'No Status' : 'Past'} Employees
            </p>
            <p className="text-2xl font-bold text-secondary-900">
              {activeTab === 'current' 
                ? allEmployees.filter(e => e.status === 'active').length
                : activeTab === 'on_leave'
                ? allEmployees.filter(e => e.status === 'on_leave').length
                : activeTab === 'no_status'
                ? allEmployees.filter(e => !['active', 'resigned', 'terminated', 'on_leave'].includes(e.status)).length
                : allEmployees.filter(e => e.status === 'resigned' || e.status === 'terminated').length
              }
            </p>
          </CardContent>
        </Card>
        {activeTab === 'current' ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {allEmployees.filter(e => e.status === 'active').length}
              </p>
            </CardContent>
          </Card>
        ) : activeTab === 'on_leave' ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600">
                {allEmployees.filter(e => e.status === 'on_leave').length}
              </p>
            </CardContent>
          </Card>
        ) : activeTab === 'no_status' ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-secondary-600">Needs Fixing</p>
              <p className="text-2xl font-bold text-orange-600">
                {allEmployees.filter(e => !['active', 'resigned', 'terminated', 'on_leave'].includes(e.status)).length}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-secondary-600">Resigned</p>
                <p className="text-2xl font-bold text-red-600">
                  {allEmployees.filter(e => e.status === 'resigned').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-secondary-600">Terminated</p>
                <p className="text-2xl font-bold text-red-600">
                  {allEmployees.filter(e => e.status === 'terminated').length}
                </p>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Total in Database</p>
            <p className="text-2xl font-bold text-secondary-900">{allEmployees.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5 text-secondary-400" />}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </select>
            <div className="flex border border-secondary-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-50'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-50'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <Button variant="secondary">
              <Filter className="w-5 h-5 mr-2" />
              More Filters
            </Button>
            <Button variant="secondary">
              <Download className="w-5 h-5 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <EmployeeCard
                employee={employee}
                onClick={() => navigate(`/employees/${employee.fullName.toLowerCase().replace(/\s+/g, '-')}`)}
                onPhotoUpload={handlePhotoUpload}
                uploadingPhoto={uploadingPhoto}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Accommodation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredEmployees.map((employee, index) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-secondary-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {employee.photo ? (
                          <img
                            src={employee.photo}
                            alt={employee.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div 
                          className={`flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center ${employee.photo ? 'hidden' : ''}`}
                        >
                          <span className="text-primary-600 font-medium">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-secondary-900">
                            {employee.fullName}
                          </div>
                          <div className="text-sm text-secondary-600">{employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">{employee.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.accommodation ? (
                        <div className="text-sm text-secondary-900">
                          {employee.accommodation.accommodationName}
                          <div className="text-xs text-secondary-600">
                            {employee.accommodation.floorName} - Room {employee.accommodation.roomNumber} - Bed {employee.accommodation.bedNumber} ({employee.accommodation.bedPosition})
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[employee.status.toLowerCase() as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {employee.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {employee.joinDate instanceof Date && !isNaN(employee.joinDate.getTime())
                        ? employee.joinDate.toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/employees/${employee.fullName.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {can(PERMISSIONS.EMPLOYEES_EDIT) && (
                          <button 
                            onClick={() => navigate(`/employees/${employee.fullName.toLowerCase().replace(/\s+/g, '-')}`)}
                            className="text-secondary-600 hover:text-secondary-900"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                        {can(PERMISSIONS.EMPLOYEES_DELETE) && (
                          <button
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-secondary-600">No employees found</p>
            </div>
          )}
        </Card>
      )}

      {filteredEmployees.length === 0 && viewMode === 'grid' && (
        <div className="text-center py-12">
          <p className="text-secondary-600">No employees found</p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Import Employees</h2>
              <p className="text-sm text-gray-600 mt-1">Upload master_employees.json file</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Select the master_employees.json file to import employee data
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  disabled={importing}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              {importResults && (
                <div className={`p-4 rounded-lg ${importResults.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="font-medium text-gray-900">
                    Import Complete: {importResults.success} successful, {importResults.failed} failed, {importResults.skipped} skipped (duplicates)
                  </p>
                  {importResults.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside max-h-32 overflow-y-auto">
                      {importResults.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {importing && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-gray-600">Importing employees...</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResults(null);
                }}
                disabled={importing}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
