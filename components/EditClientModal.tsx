
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Client, Firm } from '../types';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  client: Client | null;
  clients: Client[];
  firms: Firm[];
  onAddFirm: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, onSave, client, clients, firms, onAddFirm }) => {
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    if (client) setFormData({ ...client });
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-indigo-600">Edit Client</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(formData as Client); onClose(); }} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold">Client Name *</label>
            <input required className="w-full px-4 py-2 border rounded-lg" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Client Mobile Number *</label>
            <input required className="w-full px-4 py-2 border rounded-lg" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};
