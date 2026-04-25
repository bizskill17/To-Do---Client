
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, LayoutGrid, LayoutList, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList } from 'lucide-react';
import { TaskTemplate, Category } from '../types';
import { AddTaskTemplateModal } from './AddTaskTemplateModal';
import { ConfirmationModal } from './ConfirmationModal';

interface TaskTemplatesViewProps {
  templates: TaskTemplate[];
  categories: Category[];
  onAdd: (template: Omit<TaskTemplate, 'id'>) => void;
  onUpdate: (template: TaskTemplate) => void;
  onDelete: (id: number) => void;
}

type SortConfig = {
  key: keyof TaskTemplate;
  direction: 'asc' | 'desc';
} | null;

export const TaskTemplatesView: React.FC<TaskTemplatesViewProps> = ({ templates, categories, onAdd, onUpdate, onDelete }) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const requestSort = (key: keyof TaskTemplate) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof TaskTemplate) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-white" /> : <ArrowDown size={14} className="ml-1 text-white" />;
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const sortedTemplates = useMemo(() => {
    let sortableItems = [...filteredTemplates];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredTemplates, sortConfig]);

  const handleEditClick = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
        onDelete(selectedTemplate.id);
        setIsDeleteModalOpen(false);
    }
  };

  const thClass = "px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider border-r border-blue-900 last:border-r-0 cursor-pointer hover:bg-indigo-700 transition-colors select-none";
  const tdClass = "px-6 py-4 text-sm text-gray-900 border-r border-blue-900 last:border-r-0";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <ClipboardList /> Tasks
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage reusable task titles linked to categories</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-300 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-xl">
          <Search className="absolute left-3 top-2.5 text-indigo-600" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="w-full pl-10 pr-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><LayoutList size={18} /></button>
        </div>
      </div>

      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${viewMode === 'card' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-600 border-b border-indigo-700">
                <th className={thClass} onClick={() => requestSort('id')}><div className="flex items-center">S.No. {getSortIcon('id')}</div></th>
                <th className={thClass} onClick={() => requestSort('name')}><div className="flex items-center">TASK NAME {getSortIcon('name')}</div></th>
                <th className={thClass} onClick={() => requestSort('category')}><div className="flex items-center">Category {getSortIcon('category')}</div></th>
                <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider border-r border-blue-900 last:border-r-0 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900">
              {sortedTemplates.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className={tdClass}>{index + 1}</td>
                  <td className={`${tdClass} font-medium`}>{item.name}</td>
                  <td className={tdClass}>{item.category}</td>
                  <td className={`${tdClass} text-center`}>
                    <div className="flex items-center justify-center space-x-3">
                      <button onClick={() => handleEditClick(item)} className="text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 p-1.5 rounded-md border border-indigo-100"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => handleDeleteClick(item)} className="text-red-500 hover:text-red-700 transition-colors bg-red-50 p-1.5 rounded-md border border-red-100"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
               {sortedTemplates.length === 0 && (<tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No tasks found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`space-y-4 md:hidden ${viewMode === 'card' ? 'block' : 'hidden'}`}>
        {sortedTemplates.map((item) => (
             <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-1 uppercase">{item.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(item)} className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 p-2 rounded-md"><Edit2 size={16} /></button>
                        <button type="button" onClick={() => handleDeleteClick(item)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-md"><Trash2 size={16} /></button>
                    </div>
                </div>
             </div>
        ))}
         {templates.length === 0 && <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">No tasks found.</div>}
      </div>

      <AddTaskTemplateModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={onAdd} 
        categories={categories}
      />
      
      <AddTaskTemplateModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={(data) => { onUpdate({...selectedTemplate!, ...data}); setIsEditModalOpen(false); }} 
        initialData={selectedTemplate} 
        categories={categories}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTemplate?.name}"?`}
      />
    </div>
  );
};
