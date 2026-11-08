import { useState, useEffect } from 'react';
import { User, DollarSign, Backpack, Building2, Calendar, AlertTriangle } from 'lucide-react';
import { PersonalInfo } from './PersonalInfo';
import { SalaryAllowances } from './SalaryAllowances';
import { StaffEquipment } from './StaffEquipment';
import { AccommodationSelection } from './AccommodationSelection';
import { LeaveHistory } from './LeaveHistory';
import { DisciplinaryHistory } from './DisciplinaryHistory';
import { useAuth } from '../../contexts/AuthContext';
import type { Employee, EmployeeAccommodation } from '../../types';

interface EmployeeFormWizardProps {
  employee?: Partial<Employee>;
  onSave: (data: Partial<Employee>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export const EmployeeFormWizard = ({ employee, onSave, onCancel, isEditing }: EmployeeFormWizardProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});

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
        salaryAllowances: employee.salaryAllowances,
        staffEquipment: employee.staffEquipment,
        accommodation: employee.accommodation,
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

  const steps = [
    { title: 'Personal Information', icon: <User className="w-5 h-5" /> },
    ...(user?.role === 'super_admin' ? [{ title: 'Salary & Allowances', icon: <DollarSign className="w-5 h-5" /> }] : []),
    { title: 'Equipment & Items', icon: <Backpack className="w-5 h-5" /> },
    { title: 'Accommodation', icon: <Building2 className="w-5 h-5" /> },
    { title: 'Leave History', icon: <Calendar className="w-5 h-5" /> },
    { title: 'Disciplinary History', icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const handlePersonalInfoNext = (data: Partial<Employee>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // If salary step is available (superadmin), go to step 1, otherwise go to equipment step (step 1)
    setCurrentStep(1);
  };

  const handleSalaryAllowancesNext = (data: Partial<Employee>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStaffEquipmentNext = (data: Partial<Employee>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // If salary step exists, accommodation is step 3, otherwise step 2
    setCurrentStep(user?.role === 'super_admin' ? 3 : 2);
  };

  const handleAccommodationNext = (accommodation: EmployeeAccommodation | undefined) => {
    setFormData(prev => ({ ...prev, accommodation }));
    // Move to Leave History step
    setCurrentStep(user?.role === 'super_admin' ? 4 : 3);
  };

  const handleLeaveHistoryNext = () => {
    // Move to Disciplinary History step
    setCurrentStep(user?.role === 'super_admin' ? 5 : 4);
  };

  const handleDisciplinaryHistoryNext = () => {
    // Disciplinary History is the final step - complete the form
    handleComplete();
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`,
      });
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrent = async (data?: Partial<Employee>) => {
    setIsSaving(true);
    try {
      // If data is provided (from PersonalInfo save), use it directly
      const dataToSave = data ? {
        ...data,
        fullName: `${data.firstName || formData.firstName} ${data.lastName || formData.lastName}`,
      } : {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`,
      };
      
      await onSave(dataToSave);
      // Update formData with the saved data to ensure status is preserved
      setFormData(prev => ({ ...prev, ...dataToSave }));
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    const hasSalaryStep = user?.role === 'super_admin';

    switch (currentStep) {
      case 0:
        return (
          <PersonalInfo
            employee={employee}
            onNext={handlePersonalInfoNext}
            onCancel={onCancel}
            onSave={async (data) => {
              setFormData(prev => ({ ...prev, ...data }));
              await handleSaveCurrent(data);
            }}
          />
        );
      case 1:
        if (hasSalaryStep) {
          return (
            <SalaryAllowances
              employee={formData}
              onNext={handleSalaryAllowancesNext}
              onPrev={() => setCurrentStep(0)}
              onCancel={onCancel}
              onSave={handleSaveCurrent}
            />
          );
        }
        return (
          <StaffEquipment
            employee={formData}
            onNext={handleStaffEquipmentNext}
            onPrev={() => setCurrentStep(0)}
            onCancel={onCancel}
            onSave={handleSaveCurrent}
          />
        );
      case 2:
        if (hasSalaryStep) {
          return (
            <StaffEquipment
              employee={formData}
              onNext={handleStaffEquipmentNext}
              onPrev={() => setCurrentStep(1)}
              onCancel={onCancel}
              onSave={handleSaveCurrent}
            />
          );
        }
        return (
          <AccommodationSelection
            accommodation={formData.accommodation}
            employee={formData}
            onNext={handleAccommodationNext}
            onPrev={() => setCurrentStep(1)}
            onCancel={onCancel}
            onSave={handleSaveCurrent}
          />
        );
      case 3:
        if (hasSalaryStep) {
          return (
            <AccommodationSelection
              accommodation={formData.accommodation}
              employee={formData}
              onNext={handleAccommodationNext}
              onPrev={() => setCurrentStep(2)}
              onCancel={onCancel}
              onSave={handleSaveCurrent}
            />
          );
        }
        return (
          <LeaveHistory
            employee={formData}
            onPrev={() => setCurrentStep(2)}
            onNext={handleLeaveHistoryNext}
          />
        );
      case 4:
        if (hasSalaryStep) {
          return (
            <LeaveHistory
              employee={formData}
              onPrev={() => setCurrentStep(3)}
              onNext={handleLeaveHistoryNext}
            />
          );
        }
        return (
          <DisciplinaryHistory
            employee={formData}
            onPrev={() => setCurrentStep(2)}
            onNext={handleDisciplinaryHistoryNext}
          />
        );
      case 5:
        return (
          <DisciplinaryHistory
            employee={formData}
            onPrev={() => setCurrentStep(4)}
            onNext={handleDisciplinaryHistoryNext}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            {steps[currentStep].icon} {steps[currentStep].title}
          </h1>
          <p className="text-sm text-secondary-600">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        <div className="w-full bg-secondary-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => isEditing ? setCurrentStep(index) : index < currentStep && setCurrentStep(index)}
            disabled={!isEditing && index > currentStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
              index === currentStep
                ? 'bg-primary-600 text-white'
                : index < currentStep || isEditing
                ? 'bg-green-100 text-green-700 cursor-pointer'
                : 'bg-secondary-200 text-secondary-600 cursor-not-allowed'
            }`}
          >
            {step.icon}
            <span className="text-sm font-medium">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {renderStep()}
      </div>

      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-900 font-medium">Saving employee profile...</p>
          </div>
        </div>
      )}
    </div>
  );
};
