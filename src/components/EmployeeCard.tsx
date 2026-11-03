import { User, Calendar, Briefcase, MapPin, MoreVertical, Camera } from 'lucide-react';
import type { Employee } from '../types';
import { calculateDuration } from '../lib/employees';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
  onPhotoUpload?: (employeeId: string, employee: Employee) => void;
  uploadingPhoto?: string | null;
}

export const EmployeeCard = ({ employee, onClick, onPhotoUpload, uploadingPhoto }: EmployeeCardProps) => {
  const duration = calculateDuration(employee.joinDate);

  return (
    <div
      onClick={onClick}
      className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-primary-200"
    >
      {/* Decorative gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-bl-full -mr-16 -mt-16 transition-all duration-300 group-hover:from-primary-500/20 group-hover:to-primary-600/10" />
      
      <div className="relative p-6">
        {/* Header with Image and Basic Info */}
        <div className="flex items-start gap-4">
          {/* Employee Photo */}
          <div className="flex-shrink-0 relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 p-1 shadow-lg">
              {employee.photo ? (
                <img
                  src={employee.photo}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="w-full h-full rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              employee.status === 'active' ? 'bg-green-500' :
              employee.status === 'on_leave' ? 'bg-yellow-500' :
              employee.status === 'resigned' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            {/* Photo upload button */}
            {onPhotoUpload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPhotoUpload(employee.employeeId || employee.id, employee);
                }}
                disabled={uploadingPhoto === employee.employeeId || uploadingPhoto === employee.id}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto === employee.employeeId || uploadingPhoto === employee.id ? (
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-primary-600" />
                )}
              </button>
            )}
          </div>

          {/* Name and Occupation */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary-600 transition-colors">
              {employee.fullName || `${employee.firstName} ${employee.lastName}`}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600 font-medium truncate">
                {employee.designation || 'Not specified'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-500 truncate">
                {employee.department || employee.workSite || 'Not specified'}
              </p>
            </div>
          </div>

          {/* More options button */}
          <button 
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* Join Date and Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Joined</p>
              <p className="text-sm font-semibold text-gray-900">
                {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
          {duration && (
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Duration</p>
              <p className="text-sm font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                {duration}
              </p>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            employee.status === 'active' 
              ? 'bg-green-100 text-green-700 border border-green-200' :
            employee.status === 'on_leave' 
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
            employee.status === 'resigned' 
              ? 'bg-red-100 text-red-700 border border-red-200' :
            'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {employee.status ? employee.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Active'}
          </span>
        </div>
      </div>
    </div>
  );
};
