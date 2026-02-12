
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, LayoutGrid, LayoutList, Banknote } from 'lucide-react';
import { Firm } from '../types';
import { AddFirmModal } from './AddFirmModal';
import { EditFirmModal } from './EditFirmModal';
import { ConfirmationModal } from './ConfirmationModal';

interface FirmsViewProps {
  firms: Firm[];
  onAddFirm: (firm: Omit<Firm, 'id'>) => void;
  onDeleteFirm: (id: number) => void;
  onEditFirm: (firm: Firm) => void;
}

export const FirmsView: React.FC<FirmsViewProps> = ({ firms, onAddFirm, onDeleteFirm, onEditFirm }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFirms = useMemo(() => {
    return firms.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [firms, searchTerm]);

  const handleEditClick = (firm: Firm) => {
    setSelectedFirm(firm);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (firm: Firm) => {
    setSelectedFirm(firm);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <Banknote /> Billing Firms
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage entities that you issue bills from</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>Add New Firm</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-xl">
          <Search className="absolute left-3 top-2.5 text-indigo-600" size={18} />
          <input 
            type="text" 
            placeholder="Search firms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Firm Name</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">GSTIN</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFirms.map(firm => (
              <tr key={firm.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{firm.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 uppercase">{firm.gstNumber || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{firm.email || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <button onClick={() => handleEditClick(firm)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => handleDeleteClick(firm)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddFirmModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={onAddFirm} firms={firms} />
      <EditFirmModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} firm={selectedFirm} onSave={onEditFirm} firms={firms} />
      <ConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={() => { onDeleteFirm(selectedFirm!.id); setIsDeleteModalOpen(false); }}
        title="Delete Firm"
        message={`Confirm deletion of ${selectedFirm?.name}?`}
      />
    </div>
  );
};
