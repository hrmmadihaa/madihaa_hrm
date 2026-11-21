import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Trash2 } from 'lucide-react';
import type { EmploymentRecord } from '../../types';
import { formatDate } from '../../lib/dateUtils';

interface EmploymentHistoryProps {
  records?: EmploymentRecord[];
  employee?: { fullName?: string; firstName?: string; lastName?: string };
  onNext: (data: EmploymentRecord[]) => void;
  onPrev: () => void;
  onSave?: () => Promise<void>;
}

export const EmploymentHistory = ({ records = [], employee, onNext, onPrev, onSave }: EmploymentHistoryProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<EmploymentRecord[]>(records);
  const [formData, setFormData] = useState<EmploymentRecord>({
    id: '',
    type: 'promotion',
    description: '',
    effectiveDate: new Date(),
    previousValue: '',
    newValue: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'effectiveDate') {
      setFormData(prev => ({ ...prev, [name]: new Date(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addRecord = () => {
    const newRecord: EmploymentRecord = {
      ...formData,
      id: Date.now().toString(),
    };
    setHistoryRecords([...historyRecords, newRecord]);
    setFormData({
      id: '',
      type: 'promotion',
      description: '',
      effectiveDate: new Date(),
      previousValue: '',
      newValue: '',
    });
  };

  const removeRecord = (id: string) => {
    setHistoryRecords(historyRecords.filter(record => record.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Employment history is optional
    onNext(historyRecords);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      promotion: 'Promotion',
      demotion: 'Demotion',
      salary_change: 'Salary Change',
      contract_renewal: 'Contract Renewal',
    };
    return labels[type] || type;
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
        <h2 className="text-2xl font-bold text-secondary-900">Employment History</h2>
        <p className="text-secondary-600 mt-1">Track employment changes and milestones</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Add Record Form */}
        <div className="border border-secondary-200 rounded-lg p-6 space-y-4 bg-secondary-50">
          <h3 className="text-lg font-semibold text-secondary-900">Add Employment Record</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="promotion">Promotion</option>
              <option value="demotion">Demotion</option>
              <option value="salary_change">Salary Change</option>
              <option value="contract_renewal">Contract Renewal</option>
            </select>
            <Input
              label="Effective Date"
              name="effectiveDate"
              type="date"
              value={formData.effectiveDate.toISOString().split('T')[0]}
              onChange={handleChange}
            />
          </div>

          <textarea
            name="description"
            placeholder="Enter description of the employment change"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Previous Value (optional)"
              name="previousValue"
              value={formData.previousValue}
              onChange={handleChange}
              placeholder="e.g., Previous Salary, Previous Designation"
            />
            <Input
              label="New Value (optional)"
              name="newValue"
              value={formData.newValue}
              onChange={handleChange}
              placeholder="e.g., New Salary, New Designation"
            />
          </div>

          <Button type="button" variant="secondary" onClick={addRecord} className="w-full">
            Add Record
          </Button>
        </div>

        {/* History List */}
        {historyRecords.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-secondary-900">Employment Records</h3>
            {historyRecords
              .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())
              .map((record) => (
                <div key={record.id} className="border border-secondary-200 rounded-lg p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {getTypeLabel(record.type)}
                      </span>
                      <p className="text-sm text-secondary-600">
                        {formatDate(record.effectiveDate)}
                      </p>
                    </div>
                    <p className="mt-2 text-secondary-900">{record.description}</p>
                    {(record.previousValue || record.newValue) && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {record.previousValue && (
                          <div>
                            <p className="text-secondary-600">From: {record.previousValue}</p>
                          </div>
                        )}
                        {record.newValue && (
                          <div>
                            <p className="text-secondary-600">To: {record.newValue}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecord(record.id)}
                    className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4 border-t border-secondary-200">
          <Button variant="secondary" onClick={onPrev}>
            Previous
          </Button>
          {onSave && (
            <Button variant="secondary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button type="submit">
            Next: Contract & Probation
          </Button>
        </div>
      </form>
    </div>
  );
};
