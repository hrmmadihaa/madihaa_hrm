import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Upload, X } from 'lucide-react';
import type { Employee } from '../../types';

interface PersonalInfoProps {
  employee?: Partial<Employee>;
  onNext: (data: Partial<Employee>) => void;
  onCancel: () => void;
  onSave?: (data: Partial<Employee>) => Promise<void>;
}

export const PersonalInfo = ({ employee, onNext, onCancel, onSave }: PersonalInfoProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employeeId: '',
    registrationNumber: '',
    photo: '',
    status: 'active',
    country: '',
    wpNo: '',
    ppIdNumber: '',
    insuranceNumber: '',
    workSite: '',
    workLocation: '',
    jobLevel: '',
    salary: '',
    slot: '',
    qtaPaid: '',
    sn: '',
  });

  // Update formData when employee prop changes
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        joinDate: employee.joinDate,
        employeeId: employee.employeeId || '',
        registrationNumber: employee.registrationNumber || '',
        photo: employee.photo || '',
        status: employee.status || 'active',
        country: employee.country || '',
        dob: employee.dob,
        wpNo: employee.wpNo || '',
        wpExpDate: employee.wpExpDate,
        ppIdNumber: employee.ppIdNumber || '',
        ppIdExpDate: employee.ppIdExpDate,
        medExpDate: employee.medExpDate,
        insuranceNumber: employee.insuranceNumber || '',
        insuranceExpDate: employee.insuranceExpDate,
        workSite: employee.workSite || '',
        workLocation: employee.workLocation || '',
        jobLevel: employee.jobLevel || '',
        salary: employee.salary || '',
        slot: employee.slot || '',
        qtaPaid: employee.qtaPaid || '',
        sn: employee.sn || '',
      });
    }
  }, [employee]);

  const [photoPreview, setPhotoPreview] = useState<string | null>(employee?.photo || null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'joinDate' || name === 'dob' || name === 'wpExpDate' || name === 'ppIdExpDate' || name === 'medExpDate' || name === 'insuranceExpDate') {
      setFormData(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
    } else if (name === 'status') {
      setFormData(prev => ({ ...prev, [name]: value.toLowerCase() as any }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      try {
        const { uploadImage } = await import('../../lib/cloudinary');
        const employeeId = formData.employeeId || employee?.employeeId;
        const cloudinaryUrl = await uploadImage(file, 'employee_images', employeeId);
        setFormData(prev => ({ ...prev, photo: cloudinaryUrl }));
      } catch (error) {
        console.error('Failed to upload photo:', error);
        alert('Failed to upload photo. Please try again.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`,
      status: formData.status,
    });
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`,
        status: formData.status,
      };
      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {employee?.fullName || employee?.firstName && employee?.lastName 
            ? `${employee.firstName} ${employee.lastName}`
            : 'Employee Details'}
        </h2>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Personal Information</h2>
        <p className="text-secondary-600 mt-1">Enter employee's basic details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex flex-col items-center">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Employee"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-200"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setFormData(prev => ({ ...prev, photo: '' }));
                }}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-32 h-32 border-2 border-dashed border-primary-300 rounded-full flex items-center justify-center cursor-pointer hover:border-primary-500 transition">
              <div className="text-center">
                <Upload className="w-6 h-6 text-primary-500 mx-auto" />
                <span className="text-xs text-secondary-600">Upload Photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
          />
          <Input
            label="Employee ID"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            placeholder="e.g., MAD0001"
          />
          <Input
            label="Registration Number"
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleChange}
            placeholder="Enter registration number"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
          />
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
          <Input
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Select department"
          />
          <Input
            label="Designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="Enter designation"
          />
          <Input
            label="Job Level"
            name="jobLevel"
            value={formData.jobLevel}
            onChange={handleChange}
            placeholder="e.g., Junior, Senior"
          />
          <Input
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Enter country"
          />
          <Input
            label="Join Date"
            name="joinDate"
            type="date"
            value={formData.joinDate?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
          />
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
          />
          <Input
            label="Work Permit Number"
            name="wpNo"
            value={formData.wpNo}
            onChange={handleChange}
            placeholder="e.g., WP00648199"
          />
          <Input
            label="Work Permit Expiry Date"
            name="wpExpDate"
            type="date"
            value={formData.wpExpDate?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
          />
          <Input
            label="Passport/ID Number"
            name="ppIdNumber"
            value={formData.ppIdNumber}
            onChange={handleChange}
            placeholder="Enter passport/ID number"
          />
          <Input
            label="Passport/ID Expiry Date"
            name="ppIdExpDate"
            type="date"
            value={formData.ppIdExpDate?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
          />
          <Input
            label="Medical Expiry Date"
            name="medExpDate"
            type="date"
            value={formData.medExpDate?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
          />
          <Input
            label="Insurance Number"
            name="insuranceNumber"
            value={formData.insuranceNumber}
            onChange={handleChange}
            placeholder="Enter insurance number"
          />
          <Input
            label="Insurance Expiry Date"
            name="insuranceExpDate"
            type="date"
            value={formData.insuranceExpDate?.toISOString().split('T')[0] || ''}
            onChange={handleChange}
          />
          <Input
            label="Work Site"
            name="workSite"
            value={formData.workSite}
            onChange={handleChange}
            placeholder="Enter work site"
          />
          <Input
            label="Work Location"
            name="workLocation"
            value={formData.workLocation}
            onChange={handleChange}
            placeholder="Enter work location"
          />
          <Input
            label="Salary"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            placeholder="e.g., 134.54 MVR"
          />
          <Input
            label="Slot"
            name="slot"
            value={formData.slot}
            onChange={handleChange}
            placeholder="Enter slot"
          />
          <Input
            label="QTA Paid"
            name="qtaPaid"
            value={formData.qtaPaid}
            onChange={handleChange}
            placeholder="Enter QTA paid date"
          />
          <Input
            label="Serial Number"
            name="sn"
            value={formData.sn}
            onChange={handleChange}
            placeholder="Enter serial number"
          />
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4 border-t border-secondary-200">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          {onSave && (
            <Button variant="secondary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button type="submit">
            Next: Passport/ID Details
          </Button>
        </div>
      </form>
    </div>
  );
};
