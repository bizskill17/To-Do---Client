
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

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onSave, users }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (task && isOpen) setFormData({ ...task });
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  // Showing all names present in User Table (no filtering for active status)
  const userOptions = users.map(u => ({ value: String(u.id), label: u.name }));

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
              onChange={(val) => setFormData({...formData, assigneeId: val, assignee: userOptions.find(o => o.value === val)?.label || ''})} 
              required 
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
