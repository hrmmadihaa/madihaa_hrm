import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Calendar, MapPin, IdCard } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeById, getEmployees } from '../lib/employees';
import type { Employee } from '../types';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (user?.employeeId) {
        try {
          console.log('Loading employee for user.employeeId:', user.employeeId);
          // First try to get by employeeId (which is the document ID in some cases)
          let employeeData = await getEmployeeById(user.employeeId);
          
          // If not found, search by employeeId field
          if (!employeeData) {
            console.log('Not found by ID, searching by employeeId field');
            const allEmployees = await getEmployees();
            employeeData = allEmployees.find(e => e.employeeId === user.employeeId) || null;
            console.log('Found employee:', employeeData?.fullName, 'with ID:', employeeData?.id);
          }
          
          setEmployee(employeeData);
        } catch (error) {
          console.error('Error loading employee data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No user.employeeId found');
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        {/* Debug info */}
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>User Email: {user?.email}</p>
          <p>User Role: {user?.role}</p>
          <p>User EmployeeId: {user?.employeeId || 'NOT SET'}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <User className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600">Employee profile not found</p>
        </div>
        {/* Debug info */}
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id}</p>
          <p>User Email: {user?.email}</p>
          <p>User Role: {user?.role}</p>
          <p>User EmployeeId: {user?.employeeId || 'NOT SET'}</p>
          <p className="text-red-600">Employee lookup failed for employeeId: {user?.employeeId}</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">My Profile</h1>
        <p className="text-secondary-600 mt-1">View your personal information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {employee.photo ? (
                <img
                  src={employee.photo}
                  alt={employee.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-16 h-16 text-primary-600" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">{employee.fullName}</h2>
                <p className="text-secondary-600">{employee.designation}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <IdCard className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Employee ID</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Department</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Email</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Phone</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Join Date</p>
                    <p className="text-sm font-medium text-secondary-900">{formatDate(employee.joinDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Work Location</p>
                    <p className="text-sm font-medium text-secondary-900">{employee.workLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Date of Birth</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.dob)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Country</span>
                <span className="font-medium text-secondary-900">{employee.country || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Work Permit No.</span>
                <span className="font-medium text-secondary-900">{employee.wpNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">WP Expiry</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.wpExpDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Passport No.</span>
                <span className="font-medium text-secondary-900">{employee.ppIdNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Passport Expiry</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.ppIdExpDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Salary Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Basic Salary</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.basicSalary || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Living Allowance</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.livingAllowance || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Food Allowance</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.foodAllowance || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Attendance Allowance</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.attendanceAllowance || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">OT Allowances</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.otAllowances || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Other Allowances</span>
                <span className="font-medium text-secondary-900">{employee.salaryAllowances?.otherAllowances || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Name</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Relationship</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.relationship || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Phone</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Email</span>
                <span className="font-medium text-secondary-900">{employee.emergencyContact?.email || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Accommodation</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Accommodation</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.accommodationName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Floor</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.floorName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Room</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.roomNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Bed</span>
                <span className="font-medium text-secondary-900">{employee.accommodation?.bedNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Assigned Date</span>
                <span className="font-medium text-secondary-900">{formatDate(employee.accommodation?.assignedDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
