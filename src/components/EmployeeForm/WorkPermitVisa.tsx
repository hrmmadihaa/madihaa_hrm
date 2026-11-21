import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { EmployeeDocument } from '../../types';
import { formatDate } from '../../lib/dateUtils';

interface VisaPermitData {
  workPermitNumber: string;
  workPermitIssueDate: string;
  workPermitExpiryDate: string;
  visaType: string;
  visaNumber: string;
  visaIssueDate: string;
  visaExpiryDate: string;
  visaStatus: string;
  sponsoredBy: string;
}

interface WorkPermitVisaProps {
  documents?: EmployeeDocument[];
  onNext: (data: EmployeeDocument[]) => void;
  onPrev: () => void;
  onSave?: () => Promise<void>;
}

export const WorkPermitVisa = ({ documents = [], onNext, onPrev, onSave }: WorkPermitVisaProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [docs, setDocs] = useState<EmployeeDocument[]>(documents);
  const [formData, setFormData] = useState<VisaPermitData>({
    workPermitNumber: '',
    workPermitIssueDate: '',
    workPermitExpiryDate: '',
    visaType: '',
    visaNumber: '',
    visaIssueDate: '',
    visaExpiryDate: '',
    visaStatus: 'active',
    sponsoredBy: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addWorkPermit = () => {
    if (!formData.workPermitNumber || !formData.workPermitExpiryDate) {
      alert('Please fill in work permit number and expiry date');
      return;
    }
    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'other',
      name: `Work Permit - ${formData.workPermitNumber}`,
      url: '',
      uploadedAt: new Date(),
      expiryDate: new Date(formData.workPermitExpiryDate),
    };
    setDocs([...docs, newDoc]);
    setFormData(prev => ({
      ...prev,
      workPermitNumber: '',
      workPermitIssueDate: '',
      workPermitExpiryDate: '',
    }));
  };

  const addVisa = () => {
    if (!formData.visaNumber || !formData.visaExpiryDate) {
      alert('Please fill in visa number and expiry date');
      return;
    }
    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'other',
      name: `${formData.visaType} Visa - ${formData.visaNumber}`,
      url: '',
      uploadedAt: new Date(),
      expiryDate: new Date(formData.visaExpiryDate),
    };
    setDocs([...docs, newDoc]);
    setFormData(prev => ({
      ...prev,
      visaType: '',
      visaNumber: '',
      visaIssueDate: '',
      visaExpiryDate: '',
    }));
  };

  const removeDoc = (id: string) => {
    setDocs(docs.filter(doc => doc.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(docs);
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

  const workPermits = docs.filter(d => d.name.includes('Work Permit'));
  const visas = docs.filter(d => d.name.includes('Visa'));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Work Permit & Visa Tracking</h2>
        <p className="text-secondary-600 mt-1">Manage work authorization documents</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Work Permit Section */}
        <div className="border border-secondary-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-secondary-900">Work Permit Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Work Permit Number"
              name="workPermitNumber"
              value={formData.workPermitNumber}
              onChange={handleChange}
              placeholder="Enter permit number"
            />
            <Input
              label="Issue Date"
              name="workPermitIssueDate"
              type="date"
              value={formData.workPermitIssueDate}
              onChange={handleChange}
            />
            <Input
              label="Expiry Date *"
              name="workPermitExpiryDate"
              type="date"
              value={formData.workPermitExpiryDate}
              onChange={handleChange}
              required={!!formData.workPermitNumber}
            />
          </div>
          
          <Button type="button" variant="secondary" onClick={addWorkPermit} className="w-full">
            Add Work Permit
          </Button>

          {workPermits.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary-600">Work Permits on File:</p>
              {workPermits.map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-secondary-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-secondary-600">
                      Expires: {doc.expiryDate ? formatDate(new Date(doc.expiryDate)) : 'N/A'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visa Section */}
        <div className="border border-secondary-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-secondary-900">Visa Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="visaType"
              value={formData.visaType}
              onChange={handleChange}
              className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Visa Type</option>
              <option value="Employment">Employment Visa</option>
              <option value="Residency">Residency Visa</option>
              <option value="Multiple Entry">Multiple Entry Visa</option>
              <option value="Tourist">Tourist Visa</option>
              <option value="Other">Other</option>
            </select>
            <Input
              label="Sponsored By"
              name="sponsoredBy"
              value={formData.sponsoredBy}
              onChange={handleChange}
              placeholder="Enter sponsor name or company"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Visa Number"
              name="visaNumber"
              value={formData.visaNumber}
              onChange={handleChange}
              placeholder="Enter visa number"
            />
            <Input
              label="Issue Date"
              name="visaIssueDate"
              type="date"
              value={formData.visaIssueDate}
              onChange={handleChange}
            />
            <Input
              label="Expiry Date *"
              name="visaExpiryDate"
              type="date"
              value={formData.visaExpiryDate}
              onChange={handleChange}
              required={!!formData.visaNumber}
            />
          </div>

          <select
            name="visaStatus"
            value={formData.visaStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending Renewal</option>
            <option value="under_process">Under Process</option>
          </select>
          
          <Button type="button" variant="secondary" onClick={addVisa} className="w-full">
            Add Visa
          </Button>

          {visas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary-600">Visas on File:</p>
              {visas.map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-secondary-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-secondary-600">
                      Expires: {doc.expiryDate ? formatDate(new Date(doc.expiryDate)) : 'N/A'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
            Next: Emergency Contacts
          </Button>
        </div>
      </form>
    </div>
  );
};
