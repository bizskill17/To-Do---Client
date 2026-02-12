
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TaskTemplate, Category } from '../types';
import { SearchableSelect } from './SearchableSelect';

interface AddTaskTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<TaskTemplate, 'id'>) => void;
  initialData?: TaskTemplate | null;
  categories: Category[];
}

export const AddTaskTemplateModal: React.FC<AddTaskTemplateModalProps> = ({ isOpen, onClose, onSave, initialData, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, category: initialData.category });
    } else {
      setFormData({ name: '', category: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const categoryOptions = categories.map(c => ({ value: c.name, label: c.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.category) {
        onSave(formData);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-indigo-600">{initialData ? 'Edit Task' : 'Add Task'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Category *</label>
              <SearchableSelect
                options={categoryOptions}
                value={formData.category}
                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                placeholder="Select Category..."
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Task Title *</label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-gray-900"
                placeholder="e.g. Audit Completion"
              />
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">{initialData ? 'Save Changes' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
