import { useState, useEffect, useMemo } from 'react';
import { Plus, MapPin, Users, Trash2, Edit2, X, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import type { WorkLocation } from '../types';
import { 
  getAllWorkLocations, 
  getWorkLocation,
  createWorkLocation, 
  updateWorkLocation, 
  deleteWorkLocation,
  assignStaffToWorkLocation 
} from '../lib/workLocation';
import { getEmployees } from '../lib/employees';

export const WorkLocationPage = () => {
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorkLocation | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkSelectedStaff, setBulkSelectedStaff] = useState<string[]>([]);
  const [bulkSelectedLocation, setBulkSelectedLocation] = useState<string>('');
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLocation, setDetailsLocation] = useState<any>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveSelectedStaff, setMoveSelectedStaff] = useState<string[]>([]);
  const [moveTargetLocation, setMoveTargetLocation] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    lateThresholdSundayToThursday: '08:30',
    lateThresholdFriday: '08:30',
    lateThresholdSaturday: '08:30',
    assignedStaff: [] as string[]
  });

  // Calculate statistics for each work location
  const locationStats = useMemo(() => {
    return workLocations.map(location => {
      const assignedEmployees = employees.filter(emp =>
        location.assignedStaff?.includes(emp.id)
      );

      const positions = assignedEmployees.reduce((acc, emp) => {
        const position = emp.designation || 'Unknown';
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topPositions = Object.entries(positions)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3);

      return {
        ...location,
        totalStaff: assignedEmployees.length,
        positions,
        topPositions
      };
    });
  }, [workLocations, employees]);

  // Filter work locations based on search term
  const filteredLocations = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return locationStats;

    return locationStats.filter(location => {
      const matchesName = location.name.toLowerCase().includes(searchLower);
      const matchesAddress = location.address?.toLowerCase().includes(searchLower);

      // Search by assigned employee names
      const hasMatchingEmployee = location.assignedStaff?.some(staffId => {
        const employee = employees.find(emp => emp.id === staffId);
        return employee?.fullName?.toLowerCase().includes(searchLower);
      });

      return matchesName || matchesAddress || hasMatchingEmployee;
    });
  }, [locationStats, searchTerm, employees]);

  // Separate locations by assignment status
  const locationsWithStaff = filteredLocations.filter(loc => loc.totalStaff > 0);
  const locationsWithoutStaff = filteredLocations.filter(loc => loc.totalStaff === 0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [locationsData, employeesData] = await Promise.all([
        getAllWorkLocations(),
        getEmployees()
      ]);
      setWorkLocations(locationsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation?.id) {
        await updateWorkLocation(editingLocation.id, formData);
      } else {
        await createWorkLocation(formData);
      }
      setShowModal(false);
      setEditingLocation(null);
      setFormData({ name: '', description: '', address: '', lateThresholdSundayToThursday: '08:30', lateThresholdFriday: '08:30', lateThresholdSaturday: '08:30', assignedStaff: [] });
      loadData();
    } catch (error) {
      console.error('Error saving work location:', error);
      alert('Failed to save work location');
    }
  };

  const handleEdit = (location: WorkLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      address: location.address || '',
      lateThresholdSundayToThursday: location.lateThresholdSundayToThursday || '08:30',
      lateThresholdFriday: location.lateThresholdFriday || '08:30',
      lateThresholdSaturday: location.lateThresholdSaturday || '08:30',
      assignedStaff: location.assignedStaff || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work location?')) return;
    try {
      await deleteWorkLocation(id);
      loadData();
    } catch (error) {
      console.error('Error deleting work location:', error);
      alert('Failed to delete work location');
    }
  };

  const handleAssignStaff = async (location: WorkLocation) => {
    setSelectedLocation(location);
    setSelectedStaff(location.assignedStaff || []);
    setSearchTerm('');
    setShowAssignModal(true);
  };

  const handleStaffAssignment = async () => {
    if (!selectedLocation?.id) return;
    try {
      await assignStaffToWorkLocation(selectedLocation.id, selectedStaff);
      setShowAssignModal(false);
      setSelectedLocation(null);
      setSelectedStaff([]);
      setSearchTerm('');
      loadData();
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff');
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    const isActive = emp.status === 'active';
    const matchesSearch = 
      emp.fullName?.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower);
    return isActive && matchesSearch;
  });

  const getEmployeeAssignedLocation = (empId: string) => {
    return workLocations.find(loc => 
      loc.id !== selectedLocation?.id && 
      loc.assignedStaff?.includes(empId)
    );
  };

  const getUnassignedStaff = () => {
    return employees.filter(emp => 
      emp.status === 'active' &&
      !workLocations.some(loc => loc.assignedStaff?.includes(emp.id))
    );
  };

  const getFilteredUnassignedStaff = () => {
    const unassigned = getUnassignedStaff();
    const searchLower = bulkSearchTerm.toLowerCase();
    return unassigned.filter(emp => 
      emp.fullName?.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower)
    );
  };

  const handleBulkAssign = async () => {
    if (!bulkSelectedLocation || bulkSelectedStaff.length === 0) {
      alert('Please select a work location and at least one staff member');
      return;
    }
    try {
      const location = await getWorkLocation(bulkSelectedLocation);
      if (location) {
        const currentStaff = location.assignedStaff || [];
        const updatedStaff = [...currentStaff, ...bulkSelectedStaff];
        await assignStaffToWorkLocation(bulkSelectedLocation, updatedStaff);
        setShowBulkAssignModal(false);
        setBulkSelectedStaff([]);
        setBulkSelectedLocation('');
        setBulkSearchTerm('');
        loadData();
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff');
    }
  };

  const handleViewDetails = (location: any) => {
    setDetailsLocation(location);
    setShowDetailsModal(true);
  };

  const handleMoveStaff = async () => {
    if (!moveTargetLocation || moveSelectedStaff.length === 0) {
      alert('Please select a target location and at least one staff member');
      return;
    }
    
    try {
      // Remove staff from current location
      const currentLocation = await getWorkLocation(detailsLocation.id);
      if (currentLocation) {
        const currentStaff = currentLocation.assignedStaff || [];
        const updatedCurrentStaff = currentStaff.filter((id: string) => !moveSelectedStaff.includes(id));
        await assignStaffToWorkLocation(detailsLocation.id, updatedCurrentStaff);
      }
      
      // Add staff to target location
      const targetLocation = await getWorkLocation(moveTargetLocation);
      if (targetLocation) {
        const targetStaff = targetLocation.assignedStaff || [];
        const updatedTargetStaff = [...targetStaff, ...moveSelectedStaff];
        await assignStaffToWorkLocation(moveTargetLocation, updatedTargetStaff);
      }
      
      setShowMoveModal(false);
      setMoveSelectedStaff([]);
      setMoveTargetLocation('');
      loadData();
      // Refresh details modal
      const updatedLocation = locationStats.find(loc => loc.id === detailsLocation.id);
      setDetailsLocation(updatedLocation);
    } catch (error) {
      console.error('Error moving staff:', error);
      alert('Failed to move staff');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Work Locations</h1>
          <p className="text-secondary-600 mt-1">Manage work locations and staff assignments</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, address, or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-64 w-full"
          />
          <Button onClick={() => { setEditingLocation(null); setFormData({ name: '', description: '', address: '', lateThresholdSundayToThursday: '08:30', lateThresholdFriday: '08:30', lateThresholdSaturday: '08:30', assignedStaff: [] }); setShowModal(true); }}>
            <Plus className="w-5 h-5 mr-2" />
            Add Work Location
          </Button>
          <Button variant="secondary" onClick={() => { setShowBulkAssignModal(true); setBulkSelectedStaff([]); setBulkSelectedLocation(''); setBulkSearchTerm(''); }}>
            <Users className="w-5 h-5 mr-2" />
            Assign Employee
          </Button>
        </div>
      </div>

      {/* Work Locations Grid */}
      {locationsWithStaff.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Locations with Staff Assigned</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {locationsWithStaff.map((location) => (
              <Card key={location.id} className="group relative bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 overflow-hidden">
                {/* Decorative gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-bl-full -mr-16 -mt-16 transition-all duration-300 group-hover:from-primary-500/20 group-hover:to-primary-600/10" />
                
                <CardHeader className="flex flex-row items-start justify-between relative">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-3 shadow-lg">
                      <MapPin className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                        {location.name}
                      </h3>
                      {location.address && (
                        <p className="text-sm text-secondary-600 mt-1 truncate">{location.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-secondary-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id!)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {location.description && (
                    <p className="text-sm text-secondary-600 mb-4 line-clamp-2">{location.description}</p>
                  )}
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500 font-medium">Total Staff</p>
                        <p className="text-lg font-bold text-secondary-900">{location.totalStaff}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500 font-medium">Positions</p>
                        <p className="text-lg font-bold text-secondary-900">{Object.keys(location.positions).length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Positions */}
                  {location.topPositions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-secondary-500 font-medium mb-2">Top Positions:</p>
                      <div className="space-y-2">
                        {(location.topPositions as [string, number][]).map(([position, count]) => (
                          <div key={position} className="flex items-center justify-between text-xs">
                            <span className="text-secondary-700 truncate flex-1">{position}</span>
                            <span className="text-secondary-900 font-semibold ml-2">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned Staff Names */}
                  {location.assignedStaff && location.assignedStaff.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-secondary-500 font-medium mb-2">Assigned Staff:</p>
                      <div className="flex flex-wrap gap-2">
                        {location.assignedStaff.slice(0, 6).map((staffId) => {
                          const employee = employees.find(emp => emp.id === staffId);
                          if (!employee) return null;
                          return (
                            <div
                              key={staffId}
                              className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 px-3 py-1.5 rounded-full border border-primary-200"
                              title={employee.fullName}
                            >
                              <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-xs font-semibold text-primary-700">
                                {employee.fullName?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="text-xs font-medium text-primary-900 truncate max-w-[100px]">
                                {employee.fullName}
                              </span>
                            </div>
                          );
                        })}
                        {location.assignedStaff.length > 6 && (
                          <div className="flex items-center gap-2 bg-secondary-100 px-3 py-1.5 rounded-full border border-secondary-200">
                            <span className="text-xs font-medium text-secondary-700">
                              +{location.assignedStaff.length - 6} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAssignStaff(location)}
                      className="shadow-sm flex-1"
                    >
                      Assign Staff
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDetails(location)}
                      className="shadow-sm flex-1"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locationsWithoutStaff.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Locations Without Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locationsWithoutStaff.map((location) => (
              <Card key={location.id} className="group relative bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 overflow-hidden">
                {/* Decorative gradient accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-bl-full -mr-16 -mt-16 transition-all duration-300 group-hover:from-primary-500/20 group-hover:to-primary-600/10" />
                
                <CardHeader className="flex flex-row items-start justify-between relative">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-3 shadow-lg">
                      <MapPin className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                        {location.name}
                      </h3>
                      {location.address && (
                        <p className="text-sm text-secondary-600 mt-1 truncate">{location.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-secondary-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id!)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {location.description && (
                    <p className="text-sm text-secondary-600 mb-4 line-clamp-2">{location.description}</p>
                  )}
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500 font-medium">Total Staff</p>
                        <p className="text-lg font-bold text-secondary-900">{location.totalStaff}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500 font-medium">Positions</p>
                        <p className="text-lg font-bold text-secondary-900">{Object.keys(location.positions).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAssignStaff(location)}
                      className="shadow-sm flex-1"
                    >
                      Assign Staff
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleViewDetails(location)}
                  className="shadow-sm flex-1"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>
        </div>
      )}

      {filteredLocations.length === 0 && (
        <div className="text-center py-12 text-secondary-600">
          No work locations found
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-secondary-900">
                  {editingLocation ? 'Edit Work Location' : 'Add Work Location'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setEditingLocation(null); }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter location name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Late Threshold (Sun-Thu)
                    </label>
                    <input
                      type="text"
                      value={formData.lateThresholdSundayToThursday}
                      onChange={(e) => setFormData({ ...formData, lateThresholdSundayToThursday: e.target.value })}
                      pattern="[0-9]{2}:[0-9]{2}"
                      placeholder="HH:mm"
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-secondary-500 mt-1">Enter 24-hour format (e.g., 09:00, 13:00)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Late Threshold (Friday)
                    </label>
                    <input
                      type="text"
                      value={formData.lateThresholdFriday}
                      onChange={(e) => setFormData({ ...formData, lateThresholdFriday: e.target.value })}
                      pattern="[0-9]{2}:[0-9]{2}"
                      placeholder="HH:mm"
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-secondary-500 mt-1">Enter 24-hour format (e.g., 09:00, 13:00)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Late Threshold (Saturday)
                    </label>
                    <input
                      type="text"
                      value={formData.lateThresholdSaturday}
                      onChange={(e) => setFormData({ ...formData, lateThresholdSaturday: e.target.value })}
                      pattern="[0-9]{2}:[0-9]{2}"
                      placeholder="HH:mm"
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-secondary-500 mt-1">Enter 24-hour format (e.g., 09:00, 13:00)</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setShowModal(false); setEditingLocation(null); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingLocation ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Assign Staff to {selectedLocation.name}
                  </h2>
                  <p className="text-sm text-secondary-600 mt-1">
                    {selectedStaff.length} staff selected
                  </p>
                </div>
                <button
                  onClick={() => { setShowAssignModal(false); setSelectedLocation(null); setSelectedStaff([]); setSearchTerm(''); }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or employee ID..."
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const assignedLocation = getEmployeeAssignedLocation(employee.id);
                  const isDisabled = !!assignedLocation;
                  
                  return (
                    <label
                      key={employee.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isDisabled
                          ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                          : selectedStaff.includes(employee.id)
                          ? 'bg-primary-50 border-2 border-primary-500 cursor-pointer'
                          : 'bg-secondary-50 border-2 border-transparent hover:bg-secondary-100 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStaff.includes(employee.id)}
                        onChange={() => !isDisabled && toggleStaffSelection(employee.id)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-900">{employee.fullName}</p>
                        <p className="text-xs text-secondary-600">{employee.employeeId}</p>
                        {isDisabled && (
                          <p className="text-xs text-red-600 mt-1">
                            Already assigned to {assignedLocation?.name}
                          </p>
                        )}
                      </div>
                      {employee.department && (
                        <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded">
                          {employee.department}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </CardContent>
            <CardContent className="border-t border-secondary-200 pt-4">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { setShowAssignModal(false); setSelectedLocation(null); setSelectedStaff([]); setSearchTerm(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleStaffAssignment} className="flex-1">
                  Save Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">
                    Assign Unassigned Staff
                  </h2>
                  <p className="text-sm text-secondary-600 mt-1">
                    {bulkSelectedStaff.length} staff selected
                  </p>
                </div>
                <button
                  onClick={() => { setShowBulkAssignModal(false); setBulkSelectedStaff([]); setBulkSelectedLocation(''); setBulkSearchTerm(''); }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Select Work Location *
                </label>
                <select
                  value={bulkSelectedLocation}
                  onChange={(e) => setBulkSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a location...</option>
                  {workLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={bulkSearchTerm}
                  onChange={(e) => setBulkSearchTerm(e.target.value)}
                  placeholder="Search by name or employee ID..."
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-2">
                {getFilteredUnassignedStaff().map((employee) => (
                  <label
                    key={employee.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      bulkSelectedStaff.includes(employee.id)
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'bg-secondary-50 border-2 border-transparent hover:bg-secondary-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelectedStaff.includes(employee.id)}
                      onChange={() => {
                        setBulkSelectedStaff(prev => 
                          prev.includes(employee.id)
                            ? prev.filter(id => id !== employee.id)
                            : [...prev, employee.id]
                        );
                      }}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">{employee.fullName}</p>
                      <p className="text-xs text-secondary-600">{employee.employeeId}</p>
                    </div>
                    {employee.department && (
                      <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded">
                        {employee.department}
                      </span>
                    )}
                  </label>
                ))}
                {getFilteredUnassignedStaff().length === 0 && (
                  <p className="text-center text-secondary-600 py-8">
                    No unassigned staff found
                  </p>
                )}
              </div>
            </CardContent>
            <CardContent className="border-t border-secondary-200 pt-4">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { setShowBulkAssignModal(false); setBulkSelectedStaff([]); setBulkSelectedLocation(''); setBulkSearchTerm(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkAssign} className="flex-1">
                  Assign Staff
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && detailsLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">{detailsLocation.name}</h2>
                    {detailsLocation.address && (
                      <p className="text-sm text-secondary-600">{detailsLocation.address}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setShowDetailsModal(false); setDetailsLocation(null); }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {detailsLocation.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-secondary-700 mb-2">Description</h3>
                  <p className="text-sm text-secondary-600">{detailsLocation.description}</p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-secondary-500">Total Staff</p>
                      <p className="text-2xl font-bold text-secondary-900">{detailsLocation.totalStaff}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-secondary-500">Positions</p>
                      <p className="text-2xl font-bold text-secondary-900">{Object.keys(detailsLocation.positions).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Positions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-secondary-700 mb-3">All Positions</h3>
                <div className="bg-secondary-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {(Object.entries(detailsLocation.positions) as [string, number][])
                      .sort(([, a], [, b]) => b - a)
                      .map(([position, count]) => (
                        <div key={position} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-700">{position}</span>
                          <span className="text-secondary-900 font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Assigned Staff */}
              {detailsLocation.assignedStaff && detailsLocation.assignedStaff.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-secondary-700">Assigned Staff ({detailsLocation.assignedStaff.length})</h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setShowMoveModal(true); setMoveSelectedStaff([]); setMoveTargetLocation(''); }}
                    >
                      Move Staff
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {detailsLocation.assignedStaff.map((staffId: string) => {
                      const emp = employees.find(e => e.id === staffId);
                      return emp ? (
                        <div key={staffId} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                          {emp.photo ? (
                            <img
                              src={emp.photo}
                              alt={emp.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900">{emp.fullName}</p>
                            <p className="text-xs text-secondary-600">{emp.employeeId}</p>
                          </div>
                          <div className="flex gap-2">
                            {emp.designation && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {emp.designation}
                              </span>
                            )}
                            {emp.department && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                {emp.department}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            <CardContent className="border-t border-secondary-200 pt-4">
              <Button
                variant="secondary"
                onClick={() => { setShowDetailsModal(false); setDetailsLocation(null); }}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Move Staff Modal */}
      {showMoveModal && detailsLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-secondary-900">Move Staff</h2>
                <button
                  onClick={() => { setShowMoveModal(false); setMoveSelectedStaff([]); setMoveTargetLocation(''); }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {/* Select Staff to Move */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-secondary-700 mb-3">Select Staff to Move</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {detailsLocation.assignedStaff && detailsLocation.assignedStaff.map((staffId: string) => {
                    const emp = employees.find(e => e.id === staffId);
                    return emp ? (
                      <label
                        key={staffId}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          moveSelectedStaff.includes(staffId)
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-secondary-50 border-2 border-transparent hover:bg-secondary-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={moveSelectedStaff.includes(staffId)}
                          onChange={() => {
                            setMoveSelectedStaff(prev => 
                              prev.includes(staffId)
                                ? prev.filter(id => id !== staffId)
                                : [...prev, staffId]
                            );
                          }}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        {emp.photo ? (
                          <img
                            src={emp.photo}
                            alt={emp.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900">{emp.fullName}</p>
                          <p className="text-xs text-secondary-600">{emp.employeeId}</p>
                        </div>
                      </label>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Select Target Location */}
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-3">Select Target Location</h3>
                <select
                  value={moveTargetLocation}
                  onChange={(e) => setMoveTargetLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a location...</option>
                  {workLocations
                    .filter(loc => loc.id !== detailsLocation.id)
                    .map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                </select>
              </div>
            </CardContent>
            <CardContent className="border-t border-secondary-200 pt-4">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { setShowMoveModal(false); setMoveSelectedStaff([]); setMoveTargetLocation(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleMoveStaff} className="flex-1">
                  Move Staff ({moveSelectedStaff.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
