import { useState } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { Button } from './ui/Button';
import type { 
  ExpatStaff, 
  ExpatCompany, 
  ExpatEmploymentStatus,
  ExpatRefundStatus,
  MedicalStatus
} from '../types';

interface ExpatStaffFormProps {
  staff?: ExpatStaff;
  onSave: (staff: Omit<ExpatStaff, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ExpatStaffForm = ({ staff, onSave, onCancel }: ExpatStaffFormProps) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState<ExpatStaff>(() => {
    if (staff) return staff;
    
    return {
      id: '',
      employeeId: '',
      internalId: '',
      fullName: '',
      company: 'Madihaa',
      nationality: '',
      dateOfBirth: undefined,
      mobileNumber: '',
      occupation: '',
      workSite: '',
      employmentStatus: 'active',
      joiningDate: new Date(),
      departureDate: undefined,
      departureReason: '',
      personalDetails: {
        firstName: '',
        lastName: '',
        dateOfBirth: undefined,
        nationality: '',
        mobileNumber: '',
        email: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
      },
      passport: {
        passportNumber: '',
        issueDate: undefined,
        expiryDate: new Date(),
        remarks: '',
        documentUrl: '',
        status: 'valid',
        daysRemaining: 0,
      },
      visa: {
        visaNumber: '',
        referenceNumber: '',
        issueDate: undefined,
        expiryDate: new Date(),
        status: '',
        remarks: '',
        documentUrl: '',
        daysRemaining: 0,
      },
      workPermit: {
        workPermitNumber: '',
        issueDate: undefined,
        expiryDate: new Date(),
        fee: 0,
        status: '',
        receiptNumber: '',
        remarks: '',
        documentUrl: '',
        daysRemaining: 0,
      },
      medical: {
        medicalDate: undefined,
        nextDueDate: new Date(),
        status: 'pending',
        remarks: '',
        documentUrl: '',
        daysRemaining: 0,
      },
      insurance: {
        provider: '',
        policyNumber: '',
        startDate: undefined,
        expiryDate: new Date(),
        amount: 0,
        status: '',
        remarks: '',
        documentUrl: '',
        daysRemaining: 0,
      },
      quota: {
        quotaNumber: '',
        slotFee: 0,
        paymentDate: undefined,
        receiptNumber: '',
        status: '',
        remarks: '',
      },
      deposit: {
        depositAmount: 0,
        depositPaid: 0,
        paymentDate: undefined,
        receipt: '',
        depositStatus: '',
        refundAmount: 0,
        refundStatus: 'pending',
        refundDate: undefined,
        refundReference: '',
        remarks: '',
      },
      documents: [],
      remarks: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
      updatedBy: '',
    };
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const sectionData = prev[section as keyof ExpatStaff];
      return {
        ...prev,
        [section]: {
          ...(sectionData as any),
          [field]: value,
        },
      };
    });
  };

  const handleMainInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const sections = [
    { id: 'personal', label: 'Personal Details' },
    { id: 'passport', label: 'Passport' },
    { id: 'visa', label: 'Visa' },
    { id: 'workPermit', label: 'Work Permit' },
    { id: 'medical', label: 'Medical' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'quota', label: 'Quota/Slot' },
    { id: 'deposit', label: 'Deposit' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-secondary-900">
            {staff ? 'Edit Expat Staff' : 'Add New Expat Staff'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-secondary-200 px-6">
          <nav className="flex space-x-4 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'personal' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => handleMainInputChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Internal ID</label>
                  <input
                    type="text"
                    value={formData.internalId}
                    onChange={(e) => handleMainInputChange('internalId', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.personalDetails.firstName}
                    onChange={(e) => handleInputChange('personalDetails', 'firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.personalDetails.lastName}
                    onChange={(e) => handleInputChange('personalDetails', 'lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Nationality *</label>
                  <input
                    type="text"
                    required
                    value={formData.personalDetails.nationality}
                    onChange={(e) => handleInputChange('personalDetails', 'nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.personalDetails.dateOfBirth ? new Date(formData.personalDetails.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('personalDetails', 'dateOfBirth', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.personalDetails.mobileNumber}
                    onChange={(e) => handleInputChange('personalDetails', 'mobileNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.personalDetails.email}
                    onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Company *</label>
                  <select
                    required
                    value={formData.company}
                    onChange={(e) => handleMainInputChange('company', e.target.value as ExpatCompany)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Madihaa">Madihaa</option>
                    <option value="Batuta">Batuta</option>
                    <option value="Madigrand">Madigrand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Occupation *</label>
                  <input
                    type="text"
                    required
                    value={formData.occupation}
                    onChange={(e) => handleMainInputChange('occupation', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Work Site *</label>
                  <input
                    type="text"
                    required
                    value={formData.workSite}
                    onChange={(e) => handleMainInputChange('workSite', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Employment Status *</label>
                  <select
                    required
                    value={formData.employmentStatus}
                    onChange={(e) => handleMainInputChange('employmentStatus', e.target.value as ExpatEmploymentStatus)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="departed">Departed</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate ? new Date(formData.joiningDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleMainInputChange('joiningDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'passport' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Passport Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Passport Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.passport.passportNumber}
                    onChange={(e) => handleInputChange('passport', 'passportNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.passport.issueDate ? new Date(formData.passport.issueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('passport', 'issueDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.passport.expiryDate ? new Date(formData.passport.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('passport', 'expiryDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.passport.remarks}
                    onChange={(e) => handleInputChange('passport', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Passport Document</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="secondary" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'visa' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Visa Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Visa Number</label>
                  <input
                    type="text"
                    value={formData.visa.visaNumber}
                    onChange={(e) => handleInputChange('visa', 'visaNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={formData.visa.referenceNumber}
                    onChange={(e) => handleInputChange('visa', 'referenceNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.visa.issueDate ? new Date(formData.visa.issueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('visa', 'issueDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.visa.expiryDate ? new Date(formData.visa.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('visa', 'expiryDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={formData.visa.status}
                    onChange={(e) => handleInputChange('visa', 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.visa.remarks}
                    onChange={(e) => handleInputChange('visa', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Visa Document</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="secondary" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'workPermit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Work Permit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Work Permit Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.workPermit.workPermitNumber}
                    onChange={(e) => handleInputChange('workPermit', 'workPermitNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.workPermit.issueDate ? new Date(formData.workPermit.issueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('workPermit', 'issueDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.workPermit.expiryDate ? new Date(formData.workPermit.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('workPermit', 'expiryDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Fee</label>
                  <input
                    type="number"
                    value={formData.workPermit.fee}
                    onChange={(e) => handleInputChange('workPermit', 'fee', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={formData.workPermit.status}
                    onChange={(e) => handleInputChange('workPermit', 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={formData.workPermit.receiptNumber}
                    onChange={(e) => handleInputChange('workPermit', 'receiptNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.workPermit.remarks}
                    onChange={(e) => handleInputChange('workPermit', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Work Permit Document</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="secondary" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'medical' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Medical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Medical Date</label>
                  <input
                    type="date"
                    value={formData.medical.medicalDate ? new Date(formData.medical.medicalDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('medical', 'medicalDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Next Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.medical.nextDueDate ? new Date(formData.medical.nextDueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('medical', 'nextDueDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                  <select
                    value={formData.medical.status}
                    onChange={(e) => handleInputChange('medical', 'status', e.target.value as MedicalStatus)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.medical.remarks}
                    onChange={(e) => handleInputChange('medical', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Medical Document</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="secondary" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'insurance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Insurance Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Provider *</label>
                  <input
                    type="text"
                    required
                    value={formData.insurance.provider}
                    onChange={(e) => handleInputChange('insurance', 'provider', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    value={formData.insurance.policyNumber}
                    onChange={(e) => handleInputChange('insurance', 'policyNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.insurance.startDate ? new Date(formData.insurance.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('insurance', 'startDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.insurance.expiryDate ? new Date(formData.insurance.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('insurance', 'expiryDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.insurance.amount}
                    onChange={(e) => handleInputChange('insurance', 'amount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={formData.insurance.status}
                    onChange={(e) => handleInputChange('insurance', 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.insurance.remarks}
                    onChange={(e) => handleInputChange('insurance', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Insurance Document</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button variant="secondary" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'quota' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quota / Slot Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Quota / Slot Number</label>
                  <input
                    type="text"
                    value={formData.quota.quotaNumber}
                    onChange={(e) => handleInputChange('quota', 'quotaNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Slot Fee</label>
                  <input
                    type="number"
                    value={formData.quota.slotFee}
                    onChange={(e) => handleInputChange('quota', 'slotFee', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={formData.quota.paymentDate ? new Date(formData.quota.paymentDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('quota', 'paymentDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={formData.quota.receiptNumber}
                    onChange={(e) => handleInputChange('quota', 'receiptNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={formData.quota.status}
                    onChange={(e) => handleInputChange('quota', 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.quota.remarks}
                    onChange={(e) => handleInputChange('quota', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'deposit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Deposit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Deposit Amount</label>
                  <input
                    type="number"
                    value={formData.deposit.depositAmount}
                    onChange={(e) => handleInputChange('deposit', 'depositAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Deposit Paid</label>
                  <input
                    type="number"
                    value={formData.deposit.depositPaid}
                    onChange={(e) => handleInputChange('deposit', 'depositPaid', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={formData.deposit.paymentDate ? new Date(formData.deposit.paymentDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('deposit', 'paymentDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Receipt / Reference</label>
                  <input
                    type="text"
                    value={formData.deposit.receipt}
                    onChange={(e) => handleInputChange('deposit', 'receipt', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Deposit Status</label>
                  <input
                    type="text"
                    value={formData.deposit.depositStatus}
                    onChange={(e) => handleInputChange('deposit', 'depositStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Refund Amount</label>
                  <input
                    type="number"
                    value={formData.deposit.refundAmount}
                    onChange={(e) => handleInputChange('deposit', 'refundAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Refund Status</label>
                  <select
                    value={formData.deposit.refundStatus}
                    onChange={(e) => handleInputChange('deposit', 'refundStatus', e.target.value as ExpatRefundStatus)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="applied_for_refund">Applied for Refund</option>
                    <option value="refund_received">Refund Received</option>
                    <option value="refund_received_to_wallet">Refund Received to Wallet</option>
                    <option value="reported_missing">Reported Missing</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="not_available">Not Available</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Refund Date</label>
                  <input
                    type="date"
                    value={formData.deposit.refundDate ? new Date(formData.deposit.refundDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('deposit', 'refundDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Refund Reference</label>
                  <input
                    type="text"
                    value={formData.deposit.refundReference}
                    onChange={(e) => handleInputChange('deposit', 'refundReference', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.deposit.remarks}
                    onChange={(e) => handleInputChange('deposit', 'remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => handleSubmit(new Event('submit') as any)}>
            <Save className="w-4 h-4 mr-2" />
            Save Staff
          </Button>
        </div>
      </div>
    </div>
  );
};
