import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, Clock, DollarSign, UserRoundMinus } from 'lucide-react'; 
import { Task, User, Client, ActionLogEntry, Firm } from '../types'; 
import { SearchableSelect } from './SearchableSelect';

interface UpdateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: (task: Task) => void;
  users: User[];
  clients?: Client[]; 
  firms?: Firm[]; 
  actionLogs?: ActionLogEntry[]; 
  currentUser?: User | null; 
}

export const UpdateTaskModal: React.FC<UpdateTaskModalProps> = ({ isOpen, onClose, task, onUpdate, users, clients = [], firms = [], actionLogs = [], currentUser }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [remarksInput, setRemarksInput] = useState<string>('');
  const [billingRateInput, setBillingRateInput] = useState<string>(''); 
  const [firmToBillInput, setFirmToBillInput] = useState<string>(''); 
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const getUserSpecificStatusOptions = () => {
    return [
      'In Progress',
      'Completed'
    ];
  };

  // Initialize form when task changes
  useEffect(() => {
    if (task && isOpen) {
      const options = getUserSpecificStatusOptions();
      
      let initialStatus = task.status;
      if (!options.includes(task.status as any)) {
          initialStatus = options[0] as any;
      }

      setFormData({
        status: initialStatus as any,
      });
      
      setRemarksInput('');
      setBillingRateInput(task.billingRate ? String(task.billingRate) : '');
      setFirmToBillInput(String(task.firmToBill || ''));
      setError('');
      setIsConfirming(false);
    }
  }, [task, isOpen, currentUser]);

  // Effect to set default billing rate/firm when status changes to 'Completed'
  useEffect(() => {
    if (formData.status === 'Completed' && task && !billingRateInput && !firmToBillInput) {
        const client = clients.find(c => c.name === task.clientName);
        if (client) {
            setBillingRateInput(client.billingRate ? String(client.billingRate) : '');
            setFirmToBillInput(client.firmToBill || '');
        }
    }
  }, [formData.status, task?.id, clients, billingRateInput, firmToBillInput]);

  if (!isOpen || !task) return null;

  const firmOptions = firms.map(f => ({ value: f.name, label: f.name }));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRemarkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setRemarksInput(e.target.value);
  };

  const handleBillingRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingRateInput(e.target.value);
  };

  const handleFirmToBillChange = (val: string | string[]) => {
    if (typeof val === 'string') {
        setFirmToBillInput(val);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate remarks
    if (!remarksInput || remarksInput.trim() === '') {
      setError('Remarks are required for status updates.');
      return;
    }
    
    // Billing validation
    if (formData.status === 'Completed' && task.billingApplicable) {
        const rate = parseFloat(billingRateInput) || 0;
        if (rate <= 0) {
            setError('Billing Rate is required.');
            return;
        }
        if (!firmToBillInput || firmToBillInput.trim() === '') {
            setError('Firm to Bill is required.');
            return;
        }
    }

    setIsConfirming(true);
  };

  const handleFinalSubmit = () => {
    // Generate timestamp for immediate UI feedback (DD/MM/YYYY HH:mm)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${day}/${month}/${year} ${hours}:${minutes}`;

    const updatedTask: Task = { 
        ...task, 
        status: formData.status as any,
        lastUpdateRemarks: remarksInput, 
        lastUpdateDate: timestamp, // Crucial for immediate local feedback (Screenshot 4)
        hoursTaken: task.hoursTaken || 0,
        billingRate: parseFloat(billingRateInput) || 0, 
        firmToBill: firmToBillInput,
    };
    
    onUpdate(updatedTask);
    onClose();
  };

  const options = getUserSpecificStatusOptions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-indigo-600">{isConfirming ? 'Confirm Update' : 'Update Status'}</h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isConfirming ? (
          <div className="p-6 space-y-6 flex-grow overflow-y-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Are you sure?</h3>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setIsConfirming(false)} className="flex-1 px-6 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors uppercase tracking-wider">Cancel</button>
              <button onClick={handleFinalSubmit} className="flex-1 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all uppercase tracking-wider">Confirm</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePreSubmit} className="flex flex-col h-full">
            <div className="p-6 space-y-6 flex-grow overflow-y-auto max-h-[70vh]">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900 block mb-1">Status <span className="text-red-500">*</span></label>
                <select 
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {options.map(statusOption => (
                      <option key={statusOption} value={statusOption}>{statusOption}</option>
                    ))}
                  </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900 block mb-1">
                  Update Remark <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="remarks"
                  rows={3}
                  placeholder="What was done?"
                  value={remarksInput}
                  onChange={handleRemarkChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 resize-none"
                ></textarea>
              </div>

              {formData.status === 'Completed' && task.billingApplicable && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-100">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-900 block mb-1">Billing Rate <span className="text-red-500">*</span></label>
                            <input 
                                type="number"
                                step="0.01"
                                min="0"
                                value={billingRateInput}
                                onChange={handleBillingRateChange}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-900 block mb-1">Firm to Bill <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                options={firmOptions}
                                value={firmToBillInput}
                                onChange={handleFirmToBillChange}
                                placeholder="Select Firm..."
                                required
                            />
                        </div>
                    </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3 flex-shrink-0">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm uppercase font-bold tracking-wider">Confirm Update</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};