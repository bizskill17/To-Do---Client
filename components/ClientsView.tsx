
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, LayoutGrid, LayoutList, Phone, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'; 
import { Client, Firm } from '../types'; 
import { AddClientModal } from './AddClientModal';
import { EditClientModal } from './EditClientModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ClientsViewProps {
  clients: Client[];
  firms: Firm[]; 
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onDeleteClient: (id: number) => void;
  onEditClient: (client: Client) => void;
  // Added onAddFirm prop to resolve IntrinsicAttributes error in App.tsx
  onAddFirm: () => void;
}

type SortConfig = {
  key: keyof Client;
  direction: 'asc' | 'desc';
} | null;

export const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  firms, 
  onAddClient, 
  onDeleteClient, 
  onEditClient,
  onAddFirm // Added to destructuring
}) => {
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const requestSort = (key: keyof Client) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Client) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-white" /> : <ArrowDown size={14} className="ml-1 text-white" />;
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.mobile || '').includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const sortedClients = useMemo(() => {
    let sortableItems = [...filteredClients];
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
  }, [filteredClients, sortConfig]);

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClient) {
        onDeleteClient(selectedClient.id);
        setIsDeleteModalOpen(false);
    }
  };

  const thClass = "px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider border-r border-indigo-500 last:border-r-0 cursor-pointer hover:bg-indigo-700 transition-colors select-none";
  const tdClass = "px-6 py-4 text-sm text-gray-900 border-r border-gray-200 last:border-r-0";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-600">Client Master</h2>
          <p className="text-sm text-gray-500 mt-1">Manage client name and mobile number</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-300 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-xl">
           <Search className="absolute left-3 top-2.5 text-indigo-600" size={18} />
          <input 
            type="text" 
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg md:hidden">
                <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                <LayoutGrid size={18} />
                </button>
                <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                <LayoutList size={18} />
                </button>
            </div>

            <button 
            onClick={() => setIsAddClientModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
            >
            <Plus size={16} />
            <span>Add Client</span>
            </button>
        </div>
      </div>

      {/* Table View */}
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${viewMode === 'card' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-600">
                <th className={thClass} onClick={() => requestSort('name')}>
                  <div className="flex items-center">Client Name {getSortIcon('name')}</div>
                </th>
                <th className={thClass} onClick={() => requestSort('mobile')}>
                  <div className="flex items-center">Client Mobile Number {getSortIcon('mobile')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className={`${tdClass} font-medium`}>{client.name}</td>
                  <td className={tdClass}>{client.mobile || '-'}</td>
                  <td className={`${tdClass} text-center`}>
                    <div className="flex items-center justify-center space-x-3">
                      <button onClick={() => handleEditClick(client)} className="text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 p-1.5 rounded-md border border-indigo-100"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteClick(client)} className="text-red-500 hover:text-red-700 transition-colors bg-red-50 p-1.5 rounded-md border border-red-100"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={`space-y-4 md:hidden ${viewMode === 'card' ? 'block' : 'hidden'}`}>
        {sortedClients.map((client) => (
             <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                 <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900">{client.name}</h3>
                 </div>
                 <div className="space-y-2 text-sm text-gray-600 mb-4">
                     <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{client.mobile || 'N/A'}</span></div>
                </div>
                 <div className="flex gap-2 pt-3 border-t border-gray-100">
                     <button onClick={() => handleEditClick(client)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"><Edit2 size={16} />Edit</button>
                     <button onClick={() => handleDeleteClick(client)} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16} />Delete</button>
                 </div>
             </div>
        ))}
      </div>

      <AddClientModal 
        isOpen={isAddClientModalOpen} 
        onClose={() => setIsAddClientModalOpen(false)} 
        onSave={onAddClient} 
        clients={clients} 
        firms={firms} 
        onAddFirm={onAddFirm}
      />
      <EditClientModal 
        isOpen={isEditClientModalOpen} 
        onClose={() => setIsEditClientModalOpen(false)} 
        client={selectedClient} 
        onSave={onEditClient} 
        clients={clients} 
        firms={firms} 
        onAddFirm={onAddFirm}
      />
      <ConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete client "${selectedClient?.name}"?`}
      />
    </div>
  );
};
