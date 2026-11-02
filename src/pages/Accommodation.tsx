import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Trash2, Bed as BedIcon, User, ChevronRight, ChevronDown, Edit, Copy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { getEmployees, updateEmployee } from '../lib/employees';
import {
  getAccommodations,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  duplicateAccommodation,
  createFloor,
  updateFloor,
  deleteFloor,
  duplicateFloor,
  createRoom,
  updateRoom,
  deleteRoom,
  duplicateRoom,
  createBed,
  updateBed,
  createAssignment,
  deleteAssignment
} from '../lib/accommodation';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../lib/permissions';
import { collection, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Accommodation as AccommodationType, Bed } from '../types';

export const Accommodation = () => {
  const { can } = usePermissions();
  const [accommodations, setAccommodations] = useState<AccommodationType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFloor, setExpandedFloor] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'accommodation' | 'floor' | 'room' | 'bed' | 'assign'>('accommodation');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [accommodationSearch, setAccommodationSearch] = useState('');
  const [formData, setFormData] = useState<any>({});

  const loadAccommodations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAccommodations();
      setAccommodations(data);
    } catch (error) {
      console.error('Error loading accommodations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, []);

  useEffect(() => {
    loadAccommodations();
    loadEmployees();
  }, [loadAccommodations, loadEmployees]);

  const handleDeleteAccommodation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this accommodation? This will delete all floors, rooms, and beds.')) return;
    
    try {
      await deleteAccommodation(id);
      loadAccommodations();
    } catch (error) {
      alert('Failed to delete accommodation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDuplicateAccommodation = async (id: string) => {
    try {
      await duplicateAccommodation(id);
      loadAccommodations();
    } catch (error) {
      alert('Failed to duplicate accommodation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteFloor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this floor? This will delete all rooms and beds.')) return;
    
    try {
      console.log('Deleting floor with ID:', id);
      await deleteFloor(id);
      console.log('Floor deleted successfully');
      loadAccommodations();
    } catch (error) {
      console.error('Error deleting floor:', error);
      alert('Failed to delete floor: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDuplicateFloor = async (accommodationId: string, floorId?: string) => {
    try {
      await duplicateFloor(accommodationId, floorId);
      loadAccommodations();
    } catch (error) {
      alert('Failed to duplicate floor: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this room? This will delete all beds.')) return;
    
    try {
      await deleteRoom(id);
      loadAccommodations();
    } catch (error) {
      alert('Failed to delete room: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDuplicateRoom = async (floorId: string, roomId?: string) => {
    try {
      await duplicateRoom(floorId, roomId);
      loadAccommodations();
    } catch (error) {
      alert('Failed to duplicate room: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteBed = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) return;
    
    try {
      const bedsSnapshot = await getDocs(query(collection(db, 'beds'), where('__name__', '==', id)));
      if (!bedsSnapshot.empty) {
        const bedData = bedsSnapshot.docs[0].data();
        
        // If bed has assigned employee, unassign them first
        if (bedData.assignedEmployeeId) {
          await deleteAssignment(bedData.assignedEmployeeId);
          await updateEmployee(bedData.assignedEmployeeId, {
            accommodation: undefined
          });
        }
      }
      
      await deleteDoc(doc(db, 'beds', id));
      loadAccommodations();
    } catch (error) {
      alert('Failed to delete bed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUnassignEmployee = async (bed: Bed) => {
    if (!window.confirm('Are you sure you want to unassign this employee?')) return;
    
    try {
      if (bed.assignedEmployeeId) {
        await deleteAssignment(bed.assignedEmployeeId);
      }
      await updateBed(bed.id, {
        assignedEmployeeId: undefined,
        assignedEmployeeName: undefined,
        assignedDate: undefined,
        status: 'available'
      });
      
      // Clear employee's accommodation details
      if (bed.assignedEmployeeId) {
        await updateEmployee(bed.assignedEmployeeId, {
          accommodation: undefined
        });
      }
      
      loadAccommodations();
    } catch (error) {
      alert('Failed to unassign employee: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAddAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const location = (form.elements.namedItem('location') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLInputElement).value;

    try {
      if (selectedItem?.id) {
        await updateAccommodation(selectedItem.id, { name, location, description });
      } else {
        await createAccommodation({ name, location, description });
      }
      setShowModal(false);
      loadAccommodations();
    } catch (error) {
      alert('Failed to save accommodation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    const floorNumber = formData.floorNumber || 1;
    const name = formData.name || '';

    try {
      if (selectedItem?.id && selectedItem.floorNumber) {
        await updateFloor(selectedItem.id, { floorNumber, name });
      } else {
        await createFloor({ accommodationId: selectedItem.id, floorNumber, name });
      }
      setShowModal(false);
      loadAccommodations();
    } catch (error) {
      alert('Failed to save floor: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const roomNumber = (form.elements.namedItem('roomNumber') as HTMLInputElement).value;
    const roomType = (form.elements.namedItem('roomType') as HTMLSelectElement).value as 'single' | 'double' | 'dormitory' | 'suite';
    const capacity = parseInt((form.elements.namedItem('capacity') as HTMLInputElement).value);

    try {
      if (selectedItem?.id && selectedItem.roomNumber) {
        await updateRoom(selectedItem.id, { roomNumber, roomType, capacity });
      } else {
        await createRoom({ floorId: selectedItem.id, roomNumber, roomType, capacity });
      }
      setShowModal(false);
      loadAccommodations();
    } catch (error) {
      alert('Failed to save room: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const bedNumber = (form.elements.namedItem('bedNumber') as HTMLInputElement).value;
    const position = (form.elements.namedItem('position') as HTMLSelectElement).value as 'top' | 'bottom';

    try {
      if (selectedItem?.id && selectedItem.bedNumber) {
        await updateBed(selectedItem.id, { bedNumber, position });
      } else {
        await createBed({ roomId: selectedItem.id, bedNumber, position });
      }
      setShowModal(false);
      loadAccommodations();
    } catch (error) {
      alert('Failed to save bed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const employeeId = (form.elements.namedItem('employeeId') as HTMLSelectElement).value;
    const employee = employees.find(emp => emp.id === employeeId);

    if (!employee) {
      alert('Please select an employee');
      return;
    }

    try {
      // Update bed with employee assignment
      await updateBed(selectedItem.id, {
        assignedEmployeeId: employee.id,
        assignedEmployeeName: employee.fullName,
        assignedDate: new Date(),
        status: 'occupied'
      });
      
      // Create assignment record
      await createAssignment({
        employeeId: employee.id,
        employeeName: employee.fullName,
        bedId: selectedItem.id,
        roomId: selectedItem.roomId,
        floorId: selectedItem.floorId,
        accommodationId: selectedItem.accommodationId,
        assignedDate: new Date()
      });
      
      // Get accommodation details to update employee record
      const accommodation = accommodations.find(a => a.id === selectedItem.accommodationId);
      let floorName = '';
      let roomNumber = '';
      
      if (accommodation) {
        const floor = accommodation.floors.find(f => f.id === selectedItem.floorId);
        if (floor) {
          floorName = floor.name;
          const room = floor.rooms.find(r => r.id === selectedItem.roomId);
          if (room) {
            roomNumber = room.roomNumber;
          }
        }
      }
      
      // Update employee record with accommodation details
      await updateEmployee(employee.id, {
        accommodation: {
          accommodationId: selectedItem.accommodationId,
          accommodationName: accommodation?.name,
          floorId: selectedItem.floorId,
          floorName: floorName,
          roomId: selectedItem.roomId,
          roomNumber: roomNumber,
          bedId: selectedItem.id,
          bedNumber: selectedItem.bedNumber,
          bedPosition: selectedItem.position,
          assignedDate: new Date()
        }
      });
      
      setShowModal(false);
      loadAccommodations();
    } catch (error) {
      alert('Failed to assign employee: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const openModal = (type: 'accommodation' | 'floor' | 'room' | 'bed' | 'assign', item?: any) => {
    setModalType(type);
    setSelectedItem(item || null);
    setEmployeeSearch(''); // Reset search when opening modal
    setFormData(item || {}); // Set form data with item values
    setShowModal(true);
  };

  const filteredAccommodations = accommodations.filter(acc => {
    const searchLower = accommodationSearch.toLowerCase();
    if (!searchLower) return true;

    const matchesName = acc.name.toLowerCase().includes(searchLower);
    const matchesLocation = acc.location.toLowerCase().includes(searchLower);

    // Search by assigned employee names
    const hasMatchingEmployee = acc.floors.some(floor =>
      floor.rooms.some(room =>
        room.beds.some(bed =>
          bed.assignedEmployeeName?.toLowerCase().includes(searchLower)
        )
      )
    );

    return matchesName || matchesLocation || hasMatchingEmployee;
  });

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
          <h1 className="text-3xl font-bold text-secondary-900">Accommodation</h1>
          <p className="text-secondary-600 mt-1">Manage staff accommodation and bed assignments</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, location, or employee..."
            value={accommodationSearch}
            onChange={(e) => setAccommodationSearch(e.target.value)}
            className="sm:w-64 w-full"
          />
          {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
            <Button onClick={() => openModal('accommodation')} className="sm:w-auto w-full">
              <Plus className="w-5 h-5 mr-2" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Total Accommodations</p>
            <p className="text-2xl font-bold text-secondary-900">{accommodations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Total Floors</p>
            <p className="text-2xl font-bold text-secondary-900">
              {accommodations.reduce((sum, acc) => sum + acc.floors.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Total Rooms</p>
            <p className="text-2xl font-bold text-secondary-900">
              {accommodations.reduce((sum, acc) => 
                sum + acc.floors.reduce((floorSum, floor) => floorSum + floor.rooms.length, 0), 0
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Total Beds</p>
            <p className="text-2xl font-bold text-secondary-900">
              {accommodations.reduce((sum, acc) => 
                sum + acc.floors.reduce((floorSum, floor) => 
                  floorSum + floor.rooms.reduce((roomSum, room) => roomSum + room.beds.length, 0), 0
                ), 0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

    {/* Accommodations List */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAccommodations.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
            <p className="text-secondary-600">
              {accommodationSearch ? 'No accommodations found matching your search' : 'No accommodations found'}
            </p>
            <Button onClick={() => openModal('accommodation')} className="mt-4">
              Add First Accommodation
            </Button>
          </CardContent>
        </Card>
      ) : (
        filteredAccommodations.map((accommodation) => (
          <Card key={accommodation.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{accommodation.name}</h3>
                    <p className="text-sm text-secondary-600">{accommodation.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                    <Button variant="secondary" size="sm" onClick={() => handleDuplicateAccommodation(accommodation.id)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                  {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                    <Button variant="secondary" size="sm" onClick={() => openModal('accommodation', accommodation)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                    <Button variant="secondary" size="sm" onClick={() => handleDeleteAccommodation(accommodation.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-secondary-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-secondary-900">
                    {accommodation.floors.reduce((sum, f) => 
                      sum + f.rooms.reduce((rSum, r) => rSum + r.beds.length, 0), 0
                    )}
                  </p>
                  <p className="text-xs text-secondary-600">Total Beds</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {accommodation.floors.reduce((sum, f) => 
                      sum + f.rooms.reduce((rSum, r) => 
                        rSum + r.beds.filter(b => b.assignedEmployeeId).length, 0), 0
                    )}
                  </p>
                  <p className="text-xs text-secondary-600">Occupied</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {accommodation.floors.reduce((sum, f) => 
                      sum + f.rooms.reduce((rSum, r) => 
                        rSum + r.beds.filter(b => !b.assignedEmployeeId).length, 0), 0
                    )}
                  </p>
                  <p className="text-xs text-secondary-600">Vacant</p>
                </div>
              </div>

              {/* Assigned Employees */}
              <div className="mb-4">
                <span className="text-sm font-medium text-secondary-900">Assigned Employees</span>
                <div className="mt-2 space-y-1">
                  {(() => {
                    const assignedEmployees: string[] = [];
                    accommodation.floors.forEach(floor =>
                      floor.rooms.forEach(room =>
                        room.beds.forEach(bed => {
                          if (bed.assignedEmployeeName) {
                            assignedEmployees.push(bed.assignedEmployeeName);
                          }
                        })
                      )
                    );
                    if (assignedEmployees.length === 0) {
                      return <p className="text-xs text-secondary-600">No employees assigned</p>;
                    }
                    return assignedEmployees.sort().map((name, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-secondary-700">
                        <User className="w-3 h-3" />
                        {name}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Floors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-900">Floors ({accommodation.floors.length})</span>
                  {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                    <Button variant="secondary" size="sm" onClick={() => openModal('floor', accommodation)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                {accommodation.floors.length === 0 ? (
                  <p className="text-sm text-secondary-600 text-center py-2">No floors added yet</p>
                ) : (
                  <div className="space-y-2">
                    {[...accommodation.floors].sort((a, b) => a.name.localeCompare(b.name)).map((floor) => (
                      <div key={floor.id} className="border border-secondary-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedFloor(expandedFloor === floor.id ? null : floor.id)}
                            >
                              {expandedFloor === floor.id ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            <span className="text-sm font-medium text-secondary-900">{floor.name}</span>
                            <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">
                              {floor.rooms.length} rooms
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                              <Button variant="secondary" size="sm" onClick={() => handleDuplicateFloor(accommodation.id, floor.id)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                            {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                              <Button variant="secondary" size="sm" onClick={() => openModal('floor', { ...floor, accommodationId: accommodation.id })}>
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                              <Button variant="secondary" size="sm" onClick={() => handleDeleteFloor(floor.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Rooms */}
                        {expandedFloor === floor.id && (
                          <div className="space-y-2 ml-6 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-secondary-600">Rooms</span>
                              {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                <Button variant="secondary" size="sm" onClick={() => openModal('room', floor)}>
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                            {floor.rooms.length === 0 ? (
                              <p className="text-xs text-secondary-600 text-center py-1">No rooms</p>
                            ) : (
                              <div className="space-y-2">
                                {[...floor.rooms].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)).map((room) => (
                                  <div key={room.id} className="bg-secondary-50 rounded p-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-secondary-900">Room {room.roomNumber}</span>
                                      <div className="flex items-center gap-1">
                                        {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                          <Button variant="secondary" size="sm" onClick={() => handleDuplicateRoom(floor.id, room.id)}>
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        )}
                                        {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                          <Button variant="secondary" size="sm" onClick={() => openModal('room', { ...room, floorId: floor.id })}>
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                        )}
                                        {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                          <Button variant="secondary" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Beds */}
                                    <div className="space-y-1 ml-4">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-secondary-600">Beds ({room.beds.length})</span>
                                        {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                          <Button variant="secondary" size="sm" onClick={() => openModal('bed', room)}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add
                                          </Button>
                                        )}
                                      </div>
                                      {room.beds.length === 0 ? (
                                        <p className="text-xs text-secondary-600 text-center py-1">No beds</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {[...room.beds].sort((a, b) => a.bedNumber.localeCompare(b.bedNumber)).map((bed) => (
                                            <div key={bed.id} className="flex items-center justify-between bg-white border border-secondary-200 rounded p-2">
                                              <div className="flex items-center gap-2">
                                                <BedIcon className="w-3 h-3 text-secondary-600" />
                                                <span className="text-xs text-secondary-900">{bed.bedNumber}</span>
                                                <span className="text-xs text-secondary-600">({bed.position})</span>
                                                {bed.assignedEmployeeId ? (
                                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                    {bed.assignedEmployeeName}
                                                  </span>
                                                ) : (
                                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Available</span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1">
                                                {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                                  <Button variant="secondary" size="sm" onClick={() => openModal('bed', { ...bed, roomId: room.id })}>
                                                    <Edit className="w-3 h-3" />
                                                  </Button>
                                                )}
                                                {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                                  <Button variant="secondary" size="sm" onClick={() => handleDeleteBed(bed.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                )}
                                                {can(PERMISSIONS.ACCOMMODATION_MANAGE) && (
                                                  <>
                                                    {bed.assignedEmployeeId ? (
                                                      <Button variant="secondary" size="sm" onClick={() => handleUnassignEmployee(bed)}>
                                                        <User className="w-3 h-3" />
                                                      </Button>
                                                    ) : (
                                                      <Button variant="secondary" size="sm" onClick={() => openModal('assign', { ...bed, accommodationId: accommodation.id, floorId: floor.id, roomId: room.id })}>
                                                        <User className="w-3 h-3" />
                                                      </Button>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </CardContent>
        </Card>
      ))
    )}
  </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {modalType === 'accommodation' && (selectedItem?.id ? 'Edit Accommodation' : 'Add Accommodation')}
                {modalType === 'floor' && (selectedItem?.floorNumber ? 'Edit Floor' : 'Add Floor')}
                {modalType === 'room' && (selectedItem?.roomNumber ? 'Edit Room' : 'Add Room')}
                {modalType === 'bed' && (selectedItem?.bedNumber ? 'Edit Bed' : 'Add Bed')}
                {modalType === 'assign' && 'Assign Employee'}
              </h2>
            </div>

            <div className="p-6">
              <form key={selectedItem?.id || 'new'} onSubmit={
                modalType === 'accommodation' ? handleAddAccommodation :
                modalType === 'floor' ? handleAddFloor :
                modalType === 'room' ? handleAddRoom :
                modalType === 'bed' ? handleAddBed :
                handleAssignEmployee
              } className="space-y-4">
                {modalType === 'accommodation' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input name="name" required placeholder="e.g., Staff Housing Block A" defaultValue={selectedItem?.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <Input name="location" required placeholder="e.g., Male, Hulhumale" defaultValue={selectedItem?.location} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" defaultValue={selectedItem?.description} />
                    </div>
                  </>
                )}

                {modalType === 'floor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                      <Input 
                        name="floorNumber" 
                        type="number" 
                        required 
                        value={formData.floorNumber || 1}
                        onChange={(e) => setFormData({...formData, floorNumber: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input 
                        name="name" 
                        required 
                        placeholder="e.g., Ground Floor" 
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {modalType === 'room' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                      <Input name="roomNumber" required placeholder="e.g., 101" defaultValue={selectedItem?.roomNumber} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                      <select name="roomType" className="w-full px-4 py-2 border border-gray-300 rounded-lg" defaultValue={selectedItem?.roomType || 'single'}>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="dormitory">Dormitory</option>
                        <option value="suite">Suite</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <Input name="capacity" type="number" required defaultValue={selectedItem?.capacity || 2} />
                    </div>
                  </>
                )}

                {modalType === 'bed' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                      <Input name="bedNumber" required placeholder="e.g., 1" defaultValue={selectedItem?.bedNumber} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <select name="position" className="w-full px-4 py-2 border border-gray-300 rounded-lg" defaultValue={selectedItem?.position || 'bottom'}>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'assign' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Employee</label>
                      <Input 
                        type="text" 
                        placeholder="Search by name..." 
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                      <select name="employeeId" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                        <option value="">Select an employee</option>
                        {employees
                          .filter(emp => 
                            emp.fullName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                            emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase())
                          )
                          .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {modalType === 'assign' ? 'Assign' : 'Add'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
