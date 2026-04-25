import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, LayoutGrid, LayoutList, Filter, Settings2, X, Download, FileText } from 'lucide-react';
import { TaskTable } from './TaskTable';
import { EditTaskModal } from './EditTaskModal';
import { BulkUpdateModal } from './BulkUpdateModal';
import { SearchableSelect } from './SearchableSelect';
import { Task, User, Category, Client, Firm, ActionLogEntry, TaskTemplate } from '../types'; 
import { parseToISO, parseToTimestamp, formatToIndianDateTime } from '../App';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TasksViewProps {
  title: string;
  description: string;
  onAddTask: () => void;
  tasks: Task[];
  users: User[];
  categories: Category[];
  clients: Client[]; 
  firms: Firm[]; 
  actionLogs: ActionLogEntry[]; 
  onOpenUpdateModal: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onBulkUpdateTask: (ids: (string | number)[], updates: Partial<Task>) => void;
  onDeleteTask: (id: string | number) => void;
  onExportExcel: (tasks: Task[]) => void;
  onViewHistory: (task: Task) => void;
  filterType?: 'all' | 'pending' | 'completed' | 'pending-billing' | 'billed'; 
  onAddCategory: () => void;
  onAddClient: () => void;
  onAddFirm: () => void; 
  syncingIds?: Set<string | number>;
  currentUser?: User | null;
  taskTemplates: TaskTemplate[];
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterPriority: string;
  setFilterPriority: (val: string) => void;
  filterClient: string;
  setFilterClient: (val: string) => void; 
  filterOwner: string;
  setFilterOwner: (val: string) => void;
  filterAssignee: string;
  setFilterAssignee: (val: string) => void;
  dateFrom: string;
  setDateFrom: (val: string) => void;
  dateTo: string;
  setDateTo: (val: string) => void;
  lastUpdateFrom: string;
  setLastUpdateFrom: (val: string) => void;
  lastUpdateTo: string;
  setLastUpdateTo: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  hideCreationInfo?: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({ 
  title, description, onAddTask, tasks, users, categories, clients, firms, actionLogs, onOpenUpdateModal, onEditTask, onBulkUpdateTask, onDeleteTask, onExportExcel, onViewHistory, filterType = 'all', onAddCategory, onAddClient, onAddFirm, syncingIds = new Set(), currentUser, taskTemplates, filterStatus, setFilterStatus, filterPriority, setFilterPriority, filterClient, setFilterClient, filterOwner, setFilterOwner, filterAssignee, setFilterAssignee, dateFrom, setDateFrom, dateTo, setDateTo, lastUpdateFrom, setLastUpdateFrom, lastUpdateTo, setLastUpdateTo, searchTerm, setSearchTerm, hideCreationInfo = false
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Task>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [filterType, filterStatus, filterPriority, filterClient, filterOwner, filterAssignee, dateFrom, dateTo, lastUpdateFrom, lastUpdateTo, searchTerm]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterType === 'pending' && task.status === 'Completed') return false;
      if (filterType === 'completed' && task.status !== 'Completed') return false;
      
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesSearch = Object.values(task).some(val => String(val || '').toLowerCase().includes(lowerTerm));
        if (!matchesSearch) return false;
      }

      if (filterStatus !== 'All Status' && task.status !== filterStatus) return false;
      if (filterAssignee !== 'All Leaders' && !task.assignee.includes(filterAssignee)) return false;
      if (filterClient !== 'All Clients' && task.clientName !== filterClient) return false;

      // Filter by Due Date
      if (dateFrom || dateTo) {
        const dueDateISO = parseToISO(task.dueDate || '');
        if (dateFrom && dueDateISO < dateFrom) return false;
        if (dateTo && dueDateISO > dateTo) return false;
      }

      // Filter by Last Updated Date
      if (lastUpdateFrom || lastUpdateTo) {
        const updateDateISO = parseToISO(task.lastUpdateDate);
        if (lastUpdateFrom && updateDateISO < lastUpdateFrom) return false;
        if (lastUpdateTo && updateDateISO > lastUpdateTo) return false;
      }

      return true;
    });
  }, [tasks, filterType, searchTerm, filterStatus, filterAssignee, filterClient, dateFrom, dateTo, lastUpdateFrom, lastUpdateTo]);

  const paginatedTasks = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => {
        if (sortKey === 'date' || sortKey === 'lastUpdateDate' || sortKey === 'dueDate') {
          const aTime = parseToTimestamp(a[sortKey]);
          const bTime = parseToTimestamp(b[sortKey]);

          if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
          if (Number.isNaN(aTime)) return 1;
          if (Number.isNaN(bTime)) return -1;

          return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
        }

        const aVal = a[sortKey] as any;
        const bVal = b[sortKey] as any;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal ?? '').trim();
        const bStr = String(bVal ?? '').trim();
        if (!aStr && !bStr) return 0;
        if (!aStr) return 1;
        if (!bStr) return -1;

        const cmp = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredTasks, sortKey, sortDir, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handleEditTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleBulkUpdate = (updates: Partial<Task>) => {
    onBulkUpdateTask(selectedIds, updates);
    setSelectedIds([]);
  };

  const clearAllFilters = () => {
    setFilterStatus('All Status');
    setFilterClient('All Clients');
    setFilterAssignee('All Leaders');
    setDateFrom('');
    setDateTo('');
    setLastUpdateFrom('');
    setLastUpdateTo('');
    setSearchTerm('');
  };

  const exportToExcel = () => {
    const headers = ["S.No.", "Created At", "Created By", "Task", "Client", "Client Mobile", "Due Date", "Assignee", "Status", "Last Updated", "Remarks"];
    const csvRows = [headers.join(",")];
    
    filteredTasks.forEach((task, index) => {
      const row = [
        index + 1,
        `"${task.date}"`,
        `"${task.createdBy}"`,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.clientName || ''}"`,
        `"${task.clientMobile || ''}"`,
        `"${task.dueDate || ''}"`,
        `"${task.assignee}"`,
        `"${task.status}"`,
        `"${task.lastUpdateDate}"`,
        `"${(task.lastUpdateRemarks || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 22);

    const tableHeaders = [["S.No", "Created", "Created By", "Task", "Client", "Client Mobile", "Due Date", "Assignee", "Status", "Last Update", "Remarks"]];
    const tableData = filteredTasks.map((t, i) => [
      i + 1,
      t.date,
      t.createdBy,
      t.title,
      t.clientName || '-',
      t.clientMobile || '-',
      t.dueDate || '-',
      t.assignee,
      t.status,
      t.lastUpdateDate,
      t.lastUpdateRemarks || "-"
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [67, 56, 202], lineColor: [30, 58, 138], lineWidth: 0.2 },
      bodyStyles: { lineColor: [30, 58, 138], lineWidth: 0.2 },
      tableLineColor: [30, 58, 138],
      tableLineWidth: 0.2
    });

    doc.save(`Tasks_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const hasActiveFilters = filterStatus !== 'All Status' || filterClient !== 'All Clients' || filterAssignee !== 'All Leaders' || dateFrom || dateTo || lastUpdateFrom || lastUpdateTo || searchTerm;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-indigo-600">{title}</h2>
            <p className="text-sm text-black mt-1">{description}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          {/* Download options requested in screenshot 3 */}
          <div className="flex gap-2 mr-2">
            <button 
              onClick={exportToExcel}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-bold shadow-sm transition-colors uppercase tracking-wider"
              title="Download Excel (CSV)"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-bold shadow-sm transition-colors uppercase tracking-wider"
              title="Download PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button 
              onClick={() => setIsBulkUpdateModalOpen(true)}
              className="flex items-center space-x-1 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm font-medium shadow-sm transition-colors"
            >
              <Settings2 size={16} />
              <span>Bulk Action ({selectedIds.length})</span>
            </button>
          )}
          <button onClick={() => onAddTask()} className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors"><Plus size={16} /><span>Add Task</span></button>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 border rounded-md transition-all ${showFilters || hasActiveFilters ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white'}`}><Filter size={18} /></button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setMobileViewMode('card')} className={`p-1.5 rounded-md ${mobileViewMode === 'card' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setMobileViewMode('table')} className={`p-1.5 rounded-md ${mobileViewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}><LayoutList size={18} /></button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-100 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-bold hover:bg-red-100 transition-colors"
              title="Clear All Filters"
            >
              <X size={16} />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option>All Status</option>
                <option>Not Yet Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <SearchableSelect label="Assignee" options={users.map(u => ({ value: u.name, label: u.name }))} value={filterAssignee === 'All Leaders' ? '' : filterAssignee} onChange={(v) => setFilterAssignee(v || 'All Leaders')} />
            </div>
            <div>
              <SearchableSelect label="Client" options={clients.map(c => ({ value: c.name, label: c.name }))} value={filterClient === 'All Clients' ? '' : filterClient} onChange={(v) => setFilterClient(v || 'All Clients')} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Due Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Due Date To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Last Updated From</label>
              <input type="date" value={lastUpdateFrom} onChange={(e) => setLastUpdateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Last Updated To</label>
              <input type="date" value={lastUpdateTo} onChange={(e) => setLastUpdateTo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
        )}
      </div>

      <TaskTable 
        tasks={paginatedTasks} 
        onUpdateTask={onOpenUpdateModal}
        onEditTask={handleEditTaskClick}
        onDeleteTask={onDeleteTask}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onViewHistory={onViewHistory}
        viewMode={mobileViewMode}
        syncingIds={syncingIds}
        currentUser={currentUser}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        startIndex={(currentPage - 1) * itemsPerPage + 1}
        showSelection={true}
        hideCreationInfo={false}
      />
      
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 pt-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded disabled:opacity-50">Prev</button>
          <span className="px-4 py-2 font-bold text-indigo-700">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded disabled:opacity-50">Next</button>
        </div>
      )}

      <EditTaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} task={selectedTask} onSave={onEditTask} onAddCategory={onAddCategory} onAddClient={onAddClient} onAddFirm={onAddFirm} users={users} categories={categories} clients={clients} firms={firms} taskTemplates={taskTemplates} />
      <BulkUpdateModal isOpen={isBulkUpdateModalOpen} onClose={() => setIsBulkUpdateModalOpen(false)} count={selectedIds.length} onUpdate={handleBulkUpdate} users={users} mode="status" />
    </div>
  );
};
