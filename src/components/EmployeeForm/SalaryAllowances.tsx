import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Employee, SalaryAllowances as SalaryAllowancesType } from '../../types';

interface SalaryAllowancesProps {
  employee?: Partial<Employee>;
  onNext: (data: Partial<Employee>) => void;
  onPrev: () => void;
  onCancel: () => void;
  onSave?: (data: Partial<Employee>) => Promise<void>;
}

export const SalaryAllowances = ({ employee, onNext, onPrev, onCancel, onSave }: SalaryAllowancesProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SalaryAllowancesType>({
    basicSalary: '',
    otAllowances: '',
    otherAllowances: '',
    attendanceAllowance: '',
    livingAllowance: '',
    foodAllowance: '',
    fridayAllowance: '',
  });

  useEffect(() => {
    if (employee?.salaryAllowances) {
      const allowances = employee.salaryAllowances;
      setFormData({
        basicSalary: allowances.basicSalary?.toString() || '',
        otAllowances: allowances.otAllowances?.toString() || '',
        otherAllowances: allowances.otherAllowances?.toString() || '',
        attendanceAllowance: allowances.attendanceAllowance?.toString() || '',
        livingAllowance: allowances.livingAllowance?.toString() || '',
        foodAllowance: allowances.foodAllowance?.toString() || '',
        fridayAllowance: allowances.fridayAllowance?.toString() || '',
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert string values back to numbers for storage
    const allowancesForStorage = {
      basicSalary: formData.basicSalary || '0',
      otAllowances: formData.otAllowances || '0',
      otherAllowances: formData.otherAllowances || '0',
      attendanceAllowance: formData.attendanceAllowance || '0',
      livingAllowance: formData.livingAllowance || '0',
      foodAllowance: formData.foodAllowance || '0',
      fridayAllowance: formData.fridayAllowance || '0',
    };
    onNext({ salaryAllowances: allowancesForStorage });
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const allowancesForStorage = {
        basicSalary: formData.basicSalary || '0',
        otAllowances: formData.otAllowances || '0',
        otherAllowances: formData.otherAllowances || '0',
        attendanceAllowance: formData.attendanceAllowance || '0',
        livingAllowance: formData.livingAllowance || '0',
        foodAllowance: formData.foodAllowance || '0',
        fridayAllowance: formData.fridayAllowance || '0',
      };
      await onSave({ salaryAllowances: allowancesForStorage });
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {employee?.fullName || employee?.firstName && employee?.lastName 
            ? `${employee.firstName} ${employee.lastName}`
            : 'Employee Details'}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Basic Salary (MVR)
          </label>
          <Input
            type="text"
            name="basicSalary"
            value={formData.basicSalary || ''}
            onChange={handleChange}
            placeholder="MVR 8,000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            OT Allowances (MVR)
          </label>
          <Input
            type="text"
            name="otAllowances"
            value={formData.otAllowances || ''}
            onChange={handleChange}
            placeholder="MVR 8,500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Other Allowances (MVR)
          </label>
          <Input
            type="text"
            name="otherAllowances"
            value={formData.otherAllowances || ''}
            onChange={handleChange}
            placeholder="MVR 4,500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Attendance Allowance (MVR)
          </label>
          <Input
            type="text"
            name="attendanceAllowance"
            value={formData.attendanceAllowance || ''}
            onChange={handleChange}
            placeholder="MVR 3,000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Living Allowance (MVR)
          </label>
          <Input
            type="text"
            name="livingAllowance"
            value={formData.livingAllowance || ''}
            onChange={handleChange}
            placeholder="MVR 4,000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Food Allowance (MVR)
          </label>
          <Input
            type="text"
            name="foodAllowance"
            value={formData.foodAllowance || ''}
            onChange={handleChange}
            placeholder="MVR 1,500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Friday Allowance (MVR)
          </label>
          <Input
            type="text"
            name="fridayAllowance"
            value={formData.fridayAllowance || ''}
            onChange={handleChange}
            placeholder="MVR 500"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onPrev}>
            Previous
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="flex gap-2">
          {onSave && (
            <Button type="button" variant="secondary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
          <Button type="submit">
            Next
          </Button>
        </div>
      </div>
    </form>
  );
};
