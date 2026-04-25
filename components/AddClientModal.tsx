
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Client, Firm } from '../types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'>) => void; 
  clients: Client[];
  firms: Firm[];
  onAddFirm: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave, clients, firms, onAddFirm }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: ''
  });
  const [errors, setErrors] = useState<{name?: string, mobile?: string}>({});

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateMobile = (mobile: string) => {
    if (!mobile.trim()) return "Client mobile number is required.";
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) return "Please enter 10 Digit Number";
    return null;
  };

  const validate = () => {
    const newErrors: any = {};
    
    if (clients.some(c => c.name.toLowerCase().trim() === formData.name.toLowerCase().trim())) {
      newErrors.name = "This client name already exists.";
    }

    const mobileError = validateMobile(formData.mobile);
    if (mobileError) newErrors.mobile = mobileError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (formData.name.trim() === '') return;

    onSave(formData);
    setFormData({ name: '', mobile: '' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-indigo-600">Add Client</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Client Name *</label>
              <input 
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-gray-900 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="e.g. Acme Corp"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Client Mobile Number *</label>
              <input
                name="mobile"
                type="text"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-gray-900 ${errors.mobile ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="10 digits"
              />
              {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">Add Client</button>
          </div>
        </form>
      </div>
    </div>
  );
};
