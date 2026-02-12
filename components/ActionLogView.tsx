import React, { useState, useMemo, useEffect } from 'react';
import { Search, History, Filter, X, FileText, Download, ArrowUpDown, ArrowUp, ArrowDown, Trash2, LayoutGrid, LayoutList, Calendar, Tag, User, Building2, Clock, Briefcase } from 'lucide-react'; 
import { ActionLogEntry, Client } from '../types'; 
import { SearchableSelect } from './SearchableSelect';
import { formatToIndianDate, formatToIndianDateTime, parseToISO } from '../App';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


interface ActionLogViewProps {
  logs?: ActionLogEntry[];
  /* Updated taskId to string | number */
  onDeleteLog: (logId: number, taskId: string | number) => void;
  clients?: Client[]; 
  dashboardFilter?: { type: string; value: string; dateFrom?: string; dateTo?: string } | null;
  onClearDashboardFilter?: () => void;
}

type SortConfig = {
  key: keyof ActionLogEntry;
  direction: 'asc' | 'desc';
} | null;

export const ActionLogView: React.FC<ActionLogViewProps> = ({ 
    logs = [], 
    onDeleteLog, 
    clients = [], 
    dashboardFilter = null,
    onClearDashboardFilter 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updateDateFrom, setUpdateDateFrom] = useState('');
  const [updateDateTo, setUpdateDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterOwner, setFilterOwner] = useState('All Owners');
  const [filterAssignee, setFilterAssignee] = useState('All Assignees');
  const [filterClient, setFilterClient] = useState('All Clients'); 
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setshowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (dashboardFilter) {
      if (dashboardFilter.type === 'owner') {
          setFilterOwner(dashboardFilter.value);
          setSearchTerm(''); 
      } else if (dashboardFilter.type === 'assignee') { 
          setFilterAssignee(dashboardFilter.value);
          setSearchTerm('');
      }

      if (dashboardFilter.dateFrom) setUpdateDateFrom(dashboardFilter.dateFrom);
      if (dashboardFilter.dateTo) setUpdateDateTo(dashboardFilter.dateTo);
      
      if (dashboardFilter.dateFrom || dashboardFilter.dateTo) setshowFilters(true);
    }
  }, [dashboardFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, updateDateFrom, updateDateTo, filterStatus, filterOwner, filterAssignee, filterClient]); 

  const requestSort = (key: keyof ActionLogEntry) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ActionLogEntry) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-white" /> : <ArrowDown size={14} className="ml-1 text-white" />;
  };

  const uniqueOwners = useMemo(() => Array.from(new Set(logs.flatMap(l => String(l.owner || '').split(',').map(s => s.trim()).filter(Boolean)))), [logs]);
  const uniqueAssignees = useMemo(() => Array.from(new Set(logs.flatMap(l => String(l.assignees || '').split(',').map(s => s.trim()).filter(Boolean)))), [logs]);
  
  const uniqueClients = useMemo(() => Array.from(new Set(logs.map(l => l.clientName).filter(Boolean) as string[])), [logs]);

  const uniqueStatuses = useMemo(() => Array.from(new Set(logs.map(l => l.status))), [logs]);

  const ownerOptions = [{ value: 'All Owners', label: 'All Owners' }, ...uniqueOwners.map(o => ({ value: o, label: o }))];
  const assigneeOptions = [{ value: 'All Assignees', label: 'All Assignees' }, ...uniqueAssignees.map(a => ({ value: a, label: a }))];
  const clientOptions = [{ value: 'All Clients', label: 'All Clients' }, ...uniqueClients.map(c => ({ value: c, label: c }))]; 
  const statusOptions = [{ value: 'All Status', label: 'All Status' }, ...uniqueStatuses.map(s => ({ value: s, label: s }))];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const matchesSearch = Object.values(log).some(val => 
          String(val || '').toLowerCase().includes(lowerTerm)
        );
        if (!matchesSearch) return false;
      }
      
      const logISO = parseToISO(log.updateDate);
      if (updateDateFrom && logISO < updateDateFrom) return false;
      if (updateDateTo && logISO > updateDateTo) return false;

      if (filterStatus !== 'All Status' && log.status !== filterStatus) return false;
      if (filterOwner !== 'All Owners' && !String(log.owner || '').includes(filterOwner)) return false;
      
      if (filterClient !== 'All Clients' && log.clientName !== filterClient) return false;
      
      if (filterAssignee !== 'All Assignees' && !String(log.assignees || '').includes(filterAssignee)) return false;
      
      return true;
    });
  }, [logs, searchTerm, updateDateFrom, updateDateTo, filterStatus, filterOwner, filterAssignee, filterClient]); 

  const sortedLogs = useMemo(() => {
    let sortableItems = [...filteredLogs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'updateDate' || sortConfig.key === 'taskDate') {
            const isoA = parseToISO(String(a[sortConfig.key]));
            const isoB = parseToISO(String(b[sortConfig.key]));
            if (isoA < isoB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (isoA > isoB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
        if (sortConfig.key === 'hoursTaken') {
          const hoursA = parseFloat(String(a[sortConfig.key]));
          const hoursB = parseFloat(String(b[sortConfig.key]));
          if (hoursA < hoursB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (hoursA > hoursB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }

        // Default comparison for other string/number keys
        aValue = a[sortConfig.key] ?? '';
        bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
        // Default sort by updateDate descending if no explicit sort config
        sortableItems.sort((a, b) => {
            const dateA = new Date(a.updateDate.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) (AM|PM)/, '$3-$2-$1 $4:$5 $6'));
            const dateB = new Date(b.updateDate.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) (AM|PM)/, '$3-$2-$1 $4:$5 $6'));
            return dateB.getTime() - dateA.getTime();
        });
    }
    return sortableItems;
  }, [filteredLogs, sortConfig]);

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLogs, currentPage]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('Action Log Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 26);

    const headers = [['S.No', 'Task Date', 'Update Date', 'Status', 'Remarks', 'Owner(s)', 'Client', 'Assignee(s)', 'Hours', 'Updater']];
    const data = sortedLogs.map((log, i) => [
      i + 1,
      formatToIndianDate(log.taskDate),
      formatToIndianDateTime(log.updateDate),
      log.status,
      log.remarks || '-',
      log.owner || '-',
      log.clientName || '-',
      log.assignees || '-',
      log.hoursTaken || 0,
      log.updaterName || '-'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`Task_Action_Log_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Started': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Pending Billing': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Pending for Leader': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Pending for Member': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Pending for Partner': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setUpdateDateFrom('');
    setUpdateDateTo('');
    setFilterStatus('All Status');
    setFilterOwner('All Owners');
    setFilterAssignee('All Assignees');
    setFilterClient('All Clients');
    if (onClearDashboardFilter) onClearDashboardFilter();
  };
  
  const thClass = "px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500 last:border-r-0 cursor-pointer hover:bg-blue-700 transition-colors select-none";
  const tdClass = "px-4 py-3 text-xs text-black border-r border-blue-50 last:border-r-0 align-top";

  const startEntry = sortedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endEntry = Math.min(currentPage * itemsPerPage, sortedLogs.length);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h2 className="text-2xl font-black text-blue-600 uppercase tracking-tight">Task Update Log</h2><p className="text-sm text-gray-600 mt-1">Detailed history of all task updates and actions</p></div>
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex bg-blue-50 p-1 rounded-lg md:hidden border border-blue-200">
                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white shadow text-blue-600' : 'text-blue-500'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-blue-500'}`}><LayoutList size={18} /></button>
            </div>
            <button onClick={() => setshowFilters(!showFilters)} className={`flex items-center space-x-1 px-3 py-2 border-2 rounded-md text-xs font-black shadow-sm transition-all duration-200 uppercase tracking-widest ${showFilters ? 'bg-blue-600 border-blue-700 text-white' : 'bg-blue-50 border-blue-300 text-blue-600'}`}><Filter size={16} /><span>Filters</span></button>
            <button onClick={handleDownloadPDF} className="flex items-center space-x-1 px-3 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-xs font-black shadow-sm transition-colors uppercase tracking-widest"><Download size={16} className="text-red-500" /><span>PDF</span></button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-blue-400 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-blue-600" size={18} />
          <input 
            type="text" 
            placeholder="Search all columns (Task, Client, Assignee, Remarks, etc)..." 
            className={`w-full pl-10 pr-4 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm transition-colors font-bold ${searchTerm ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-blue-200'}`} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <SearchableSelect label={<span className="text-[10px] font-black uppercase">Client</span>} options={clientOptions} value={filterClient} onChange={setFilterClient} />
            <SearchableSelect label={<span className="text-[10px] font-black uppercase">Principal Partner</span>} options={ownerOptions} value={filterOwner} onChange={setFilterOwner} />
            <SearchableSelect label={<span className="text-[10px] font-black uppercase">Team Leader</span>} options={assigneeOptions} value={filterAssignee} onChange={setFilterAssignee} />
            <SearchableSelect label={<span className="text-[10px] font-black uppercase">Status</span>} options={statusOptions} value={filterStatus} onChange={setFilterStatus} />
            <div className="space-y-1"><label className="text-[10px] font-black text-blue-600 uppercase block mb-1">Updated From</label><input type="date" value={updateDateFrom} onChange={(e) => setUpdateDateFrom(e.target.value)} className="w-full px-3 py-2 border-2 border-blue-200 rounded-md text-sm"/></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-blue-600 uppercase block mb-1">Updated To</label><input type="date" value={updateDateTo} onChange={(e) => setUpdateDateTo(e.target.value)} className="w-full px-3 py-2 border-2 border-blue-200 rounded-md text-sm"/></div>
            <div className="flex items-end"><button onClick={handleClearFilters} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white border-2 border-red-700 rounded-md hover:bg-red-700 text-xs font-black uppercase tracking-widest h-[42px] transition-colors"><X size={16} />Clear</button></div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className={`space-y-4 md:hidden ${viewMode === 'card' ? 'block' : 'hidden'}`}>
        {paginatedLogs.map((log) => (
             <div key={log.id} className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm space-y-3 relative">
                <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[70%]">
                        <h4 className="text-sm font-black text-blue-900 leading-tight">{log.task}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold uppercase">
                            <Calendar size={12} />
                            {formatToIndianDateTime(log.updateDate)}
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-blue-100 ${getStatusColor(log.status)}`}>
                        {log.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-blue-50">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Client</span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-900 font-bold uppercase">
                             <Building2 size={10} /> {log.clientName || '-'}
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Assignee</span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-900 font-bold">
                            <Briefcase size={10} /> {log.assignees}
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Updater</span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-900 font-bold">
                            <User size={10} /> {log.updaterName}
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Hours</span>
                        <div className="flex items-center gap-1 text-[10px] text-blue-900 font-bold">
                            <Clock size={10} /> {log.hoursTaken || 0}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <p className="text-[11px] text-blue-800 italic leading-relaxed">"{log.remarks}"</p>
                </div>

                <button onClick={() => onDeleteLog(log.id, log.taskId)} className="absolute bottom-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                </button>
             </div>
        ))}
        {paginatedLogs.length === 0 && <div className="text-center py-10 text-blue-300 font-bold uppercase text-xs">No activity history found.</div>}
      </div>

      <div className={`bg-white rounded-lg border-2 border-blue-400 shadow-sm overflow-hidden ${viewMode === 'card' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600">
                <th className="px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500 w-12 text-center">S.No.</th>
                <th className={thClass} onClick={() => requestSort('taskDate')}><div className="flex items-center">Task Date {getSortIcon('taskDate')}</div></th>
                <th className={thClass} onClick={() => requestSort('task')}><div className="flex items-center">Task {getSortIcon('task')}</div></th>
                <th className={thClass} onClick={() => requestSort('clientName')}><div className="flex items-center">Client {getSortIcon('clientName')}</div></th>
                <th className={thClass} onClick={() => requestSort('owner')}><div className="flex items-center">Principal Partner {getSortIcon('owner')}</div></th>
                <th className={thClass} onClick={() => requestSort('assignees')}><div className="flex items-center">Team Leader {getSortIcon('assignees')}</div></th>
                <th className={thClass} onClick={() => requestSort('updateDate')}><div className="flex items-center">Update Date {getSortIcon('updateDate')}</div></th>
                <th className={thClass} onClick={() => requestSort('status')}><div className="flex items-center">Status {getSortIcon('status')}</div></th>
                <th className={thClass} onClick={() => requestSort('remarks')}><div className="flex items-center">Remarks {getSortIcon('remarks')}</div></th>
                <th className={thClass} onClick={() => requestSort('hoursTaken')}><div className="flex items-center">Hours {getSortIcon('hoursTaken')}</div></th>
                <th className={thClass} onClick={() => requestSort('updaterName')}><div className="flex items-center">Updater {getSortIcon('updaterName')}</div></th>
                <th className="px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {paginatedLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-blue-50 transition-colors">
                  <td className={`${tdClass} text-center font-bold text-blue-600`}>{startEntry + idx}</td>
                  <td className={`${tdClass} whitespace-nowrap font-bold`}>{formatToIndianDate(log.taskDate)}</td>
                  <td className={`${tdClass} font-bold`}>{log.task}</td>
                  <td className={`${tdClass} font-bold uppercase text-[10px]`}>{log.clientName || '-'}</td>
                  <td className={tdClass}>{log.owner}</td>
                  <td className={tdClass}>{log.assignees}</td>
                  <td className={`${tdClass} whitespace-nowrap font-bold`}>{formatToIndianDateTime(log.updateDate)}</td>
                  <td className={tdClass}><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${getStatusColor(log.status)}`}>{log.status}</span></td>
                  <td className={`${tdClass} italic text-blue-900`}>"{log.remarks}"</td>
                  <td className={`${tdClass} font-bold text-center`}>{log.hoursTaken || 0}</td>
                  <td className={`${tdClass} font-bold`}>{log.updaterName}</td>
                  <td className={`${tdClass} text-center`}>
                    <button onClick={() => onDeleteLog(log.id, log.taskId)} className="p-1.5 text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-600 rounded-md transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (<tr><td colSpan={12} className="px-6 py-10 text-center text-blue-300 font-black uppercase">No activity found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-blue-600 font-bold px-1 uppercase tracking-wider">
          <span>Showing {startEntry} to {endEntry} of {filteredLogs.length} entries</span>
          <div className="flex space-x-2">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="px-4 py-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors uppercase text-[10px]" disabled={currentPage === 1}>Previous</button>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="px-4 py-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors uppercase text-[10px]" disabled={currentPage === totalPages || totalPages === 0}>Next</button>
          </div>
      </div>
    </div>
  );
};