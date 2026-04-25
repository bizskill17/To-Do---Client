
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react'; 
import { Task, User, Category, Client, Firm, TaskTemplate } from '../types'; 
import { SearchableSelect } from './SearchableSelect';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'status' | 'date' | 'lastUpdateDate' | 'lastUpdateRemarks' | 'createdBy'>) => void; 
  onAddCategory: () => void;
  onAddClient: () => void; 
  onAddFirm: () => void;
  users: User[];
  categories: Category[];
  clients: Client[];
  firms: Firm[];
  taskTemplates: TaskTemplate[]; 
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, users, clients }) => {
  const [formData, setFormData] = useState({
    title: '',
    assigneeId: '',
    assignee: '',
    assigneeNumber: '',
    clientId: '',
    clientName: '',
    clientMobile: '',
    dueDate: ''
  });

  useEffect(() => {
    if (isOpen) setFormData({ title: '', assigneeId: '', assignee: '', assigneeNumber: '', clientId: '', clientName: '', clientMobile: '', dueDate: '' });
  }, [isOpen]);

  if (!isOpen) return null;

  // Showing all names present in User Table (no filtering for active status)
  const userOptions = users.map(u => ({ value: String(u.id), label: u.name }));
  const clientOptions = clients.map(c => ({ value: String(c.id), label: c.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assigneeId || !formData.clientId || !formData.dueDate) return;
    onSave({
      title: formData.title,
      assigneeId: formData.assigneeId,
      assignee: formData.assignee,
      assigneeNumber: formData.assigneeNumber,
      clientId: formData.clientId,
      clientName: formData.clientName,
      clientMobile: formData.clientMobile,
      dueDate: formData.dueDate
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-indigo-600">New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Task *</label>
            <input 
                required 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. GST Filing" 
            />
          </div>
          <div className="space-y-1">
            <SearchableSelect 
              label="Assignee" 
              options={userOptions} 
              value={formData.assigneeId} 
              onChange={(val) => {
                const selected = users.find(u => String(u.id) === String(val));
                const digitsOnly = String(selected?.mobile || '').replace(/\D/g, '');
                const normalizedNumber = digitsOnly.length <= 10 ? digitsOnly : digitsOnly.slice(-10);
                setFormData({
                  ...formData,
                  assigneeId: val,
                  assignee: userOptions.find(o => o.value === val)?.label || '',
                  assigneeNumber: normalizedNumber
                });
              }} 
              required 
              placeholder="Select User..." 
            />
          </div>
          <div className="space-y-1">
            <SearchableSelect
              label="Client"
              options={clientOptions}
              value={formData.clientId}
              onChange={(val) => {
                const selectedClient = clients.find(c => String(c.id) === String(val));
                setFormData({
                  ...formData,
                  clientId: val,
                  clientName: selectedClient?.name || '',
                  clientMobile: selectedClient?.mobile || ''
                });
              }}
              required
              placeholder="Select Client..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Due Date *</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end pt-4 gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 rounded-lg text-gray-600 uppercase font-bold text-xs">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold uppercase text-xs shadow-md shadow-indigo-100">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};
