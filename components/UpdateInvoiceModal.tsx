
import React, { useState, useEffect } from 'react';
import { X, Clock, DollarSign, Building2, Calculator } from 'lucide-react';
import { Task } from '../types';
import { formatToIndianDate, parseToISO } from '../App';

interface UpdateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: (task: Task) => void;
}

export const UpdateInvoiceModal: React.FC<UpdateInvoiceModalProps> = ({ isOpen, onClose, task, onUpdate }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: ''
  });

  useEffect(() => {
    if (task && isOpen) {
      // Per new requirement: billingRate is the invoice amount, not hours * rate.
      // So, pre-fill invoiceAmount directly with task.billingRate if available,
      // otherwise fallback to existing invoiceAmount or empty.
      
      setFormData({
        invoiceNumber: task.invoiceNumber || '',
        invoiceDate: task.invoiceDate ? parseToISO(task.invoiceDate) : new Date().toISOString().split('T')[0],
        invoiceAmount: task.invoiceAmount ? String(task.invoiceAmount) : (task.billingRate ? String(task.billingRate) : '')
      });
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTask = {
      ...task,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate ? formatToIndianDate(formData.invoiceDate) : '',
      invoiceAmount: parseFloat(formData.invoiceAmount) || 0,
      skipLog: true // Skip normal action log as this is a billing update
    };
    onUpdate(updatedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-indigo-600">Update Invoice Details</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            
            {/* Reference Information (Read Only) */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Billing Reference</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Hours Taken:</span>
                  <span className="font-bold text-indigo-700">{task.hoursTaken || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Billing Rate:</span>
                  <span className="font-bold text-indigo-700">₹ {task.billingRate || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Firm to Bill:</span>
                  <span className="font-bold text-indigo-700">{task.firmToBill || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 block mb-1">Invoice Number *</label>
              <input
                type="text"
                required
                placeholder="Enter Invoice #"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
                value={formData.invoiceNumber}
                onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 block mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
                value={formData.invoiceDate}
                onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 block mb-1 flex items-center gap-2">
                Invoice Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-indigo-200 bg-indigo-50/30 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-indigo-700"
                  value={formData.invoiceAmount}
                  onChange={e => setFormData({ ...formData, invoiceAmount: e.target.value })}
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">Pre-filled with Billing Rate. You can edit this if needed.</p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm uppercase tracking-wider">Update Billing Data</button>
          </div>
        </form>
      </div>
    </div>
  );
};
