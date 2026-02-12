
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Firm } from '../types';

interface EditFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (firm: Firm) => void;
  firm: Firm | null;
  firms: Firm[];
}

export const EditFirmModal: React.FC<EditFirmModalProps> = ({ isOpen, onClose, onSave, firm, firms }) => {
  const [formData, setFormData] = useState({ name: '', gstNumber: '', address: '', email: '', mobile: '' });

  useEffect(() => {
    // Fix: Correctly initialize state from firm prop, ensuring optional properties are handled as strings to avoid type mismatch
    if (firm) {
      setFormData({
        name: firm.name,
        gstNumber: firm.gstNumber || '',
        address: firm.address || '',
        email: firm.email || '',
        mobile: firm.mobile || ''
      });
    }
  }, [firm, isOpen]);

  if (!isOpen || !firm) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...firm, ...formData });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-indigo-600">Edit Billing Firm</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold">Firm Name *</label>
            <input required className="w-full px-4 py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">GSTIN</label>
            <input className="w-full px-4 py-2 border rounded-lg uppercase" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold">Email</label>
              <input type="email" className="w-full px-4 py-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Mobile</label>
              <input className="w-full px-4 py-2 border rounded-lg" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Address</label>
            <textarea rows={2} className="w-full px-4 py-2 border rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="flex justify-end pt-4 gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Update Firm</button>
          </div>
        </form>
      </div>
    </div>
  );
};
