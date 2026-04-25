
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task, User, Category, Client, Firm, TaskTemplate } from '../types';
import { SearchableSelect } from './SearchableSelect';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (task: Task) => void;
  onAddCategory: () => void;
  onAddClient: () => void;
  onAddFirm: () => void;
  users: User[];
  categories: Category[];
  clients: Client[];
  firms: Firm[];
  taskTemplates: TaskTemplate[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onSave, users, clients }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (task && isOpen) setFormData({ ...task });
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  // Showing all names present in User Table (no filtering for active status)
  const userOptions = users.map(u => ({ value: String(u.id), label: u.name }));
  const clientOptions = clients.map(c => ({ value: String(c.id), label: c.name }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-indigo-600">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <form 
            onSubmit={e => { e.preventDefault(); onSave(formData as Task); onClose(); }} 
            onKeyDown={handleKeyDown}
            className="p-6 space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Task *</label>
            <input required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-1">
            <SearchableSelect 
              label="Assignee" 
              options={userOptions} 
              value={formData.assigneeId || ''} 
              onChange={(val) => {
                const selected = users.find(u => String(u.id) === String(val));
                const digitsOnly = String(selected?.mobile || '').replace(/\D/g, '');
                const normalizedNumber = digitsOnly.length <= 10 ? digitsOnly : digitsOnly.slice(-10);
                setFormData({...formData, assigneeId: val, assignee: userOptions.find(o => o.value === val)?.label || '', assigneeNumber: normalizedNumber});
              }} 
              required 
            />
          </div>
          <div className="space-y-1">
            <SearchableSelect
              label="Client"
              options={clientOptions}
              value={String(formData.clientId || '')}
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
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Due Date *</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
              value={(() => {
                const due = String(formData.dueDate || '');
                if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due;
                const match = due.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
              })()}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end pt-4 gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 rounded-lg text-gray-600 uppercase font-bold text-xs">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold uppercase text-xs shadow-md shadow-indigo-100">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};
