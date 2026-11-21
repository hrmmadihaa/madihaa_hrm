import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { EmployeeDocument } from '../../types';
import { formatDate } from '../../lib/dateUtils';

interface PassportIDProps {
  documents?: EmployeeDocument[];
  onNext: (data: EmployeeDocument[]) => void;
  onPrev: () => void;
  onSave?: () => Promise<void>;
}

export const PassportIDDetails = ({ documents = [], onNext, onPrev, onSave }: PassportIDProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [docs, setDocs] = useState<EmployeeDocument[]>(documents);
  const [formData, setFormData] = useState({
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    idCardNumber: '',
    idCardIssueDate: '',
    idCardExpiryDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addPassport = () => {
    if (!formData.passportNumber || !formData.passportExpiryDate) {
      alert('Please fill in passport number and expiry date');
      return;
    }
    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'passport',
      name: `Passport - ${formData.passportNumber}`,
      url: '', // URL would be set when document is uploaded
      uploadedAt: new Date(),
      expiryDate: new Date(formData.passportExpiryDate),
    };
    setDocs([...docs, newDoc]);
    setFormData(prev => ({
      ...prev,
      passportNumber: '',
      passportIssueDate: '',
      passportExpiryDate: '',
    }));
  };

  const addIDCard = () => {
    if (!formData.idCardNumber || !formData.idCardExpiryDate) {
      alert('Please fill in ID card number and expiry date');
      return;
    }
    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'id_card',
      name: `ID Card - ${formData.idCardNumber}`,
      url: '',
      uploadedAt: new Date(),
      expiryDate: new Date(formData.idCardExpiryDate),
    };
    setDocs([...docs, newDoc]);
    setFormData(prev => ({
      ...prev,
      idCardNumber: '',
      idCardIssueDate: '',
      idCardExpiryDate: '',
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

  const passportDocs = docs.filter(d => d.type === 'passport');
  const idDocs = docs.filter(d => d.type === 'id_card');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Passport & ID Card Details</h2>
        <p className="text-secondary-600 mt-1">Add document details and expiry information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Passport Section */}
        <div className="border border-secondary-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-secondary-900">Passport Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Passport Number"
              name="passportNumber"
              value={formData.passportNumber}
              onChange={handleChange}
              placeholder="Enter passport number"
            />
            <Input
              label="Issue Date"
              name="passportIssueDate"
              type="date"
              value={formData.passportIssueDate}
              onChange={handleChange}
            />
            <Input
              label="Expiry Date *"
              name="passportExpiryDate"
              type="date"
              value={formData.passportExpiryDate}
              onChange={handleChange}
              required={!!formData.passportNumber}
            />
          </div>
          
          <Button type="button" variant="secondary" onClick={addPassport} className="w-full">
            Add Passport
          </Button>

          {passportDocs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary-600">Added Passports:</p>
              {passportDocs.map(doc => (
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

        {/* ID Card Section */}
        <div className="border border-secondary-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-secondary-900">ID Card Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="ID Card Number"
              name="idCardNumber"
              value={formData.idCardNumber}
              onChange={handleChange}
              placeholder="Enter ID card number"
            />
            <Input
              label="Issue Date"
              name="idCardIssueDate"
              type="date"
              value={formData.idCardIssueDate}
              onChange={handleChange}
            />
            <Input
              label="Expiry Date *"
              name="idCardExpiryDate"
              type="date"
              value={formData.idCardExpiryDate}
              onChange={handleChange}
              required={!!formData.idCardNumber}
            />
          </div>
          
          <Button type="button" variant="secondary" onClick={addIDCard} className="w-full">
            Add ID Card
          </Button>

          {idDocs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary-600">Added ID Cards:</p>
              {idDocs.map(doc => (
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
            Next: Work Permit & Visa
          </Button>
        </div>
      </form>
    </div>
  );
};
