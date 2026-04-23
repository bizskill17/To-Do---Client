import React from 'react';
import { Task, User as UserType } from '../types'; 
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2 } from 'lucide-react';
import { formatToIndianDateTime } from '../App';

interface TaskTableProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string | number) => void;
  selectedIds: (string | number)[];
  onSelectionChange: (ids: (string | number)[]) => void;
  onViewHistory: (task: Task) => void;
  showSelection?: boolean;
  viewMode?: 'card' | 'table';
  syncingIds?: Set<string | number>;
  currentUser?: UserType | null;
  sortKey: keyof Task;
  sortDir: 'asc' | 'desc';
  onSort: (key: keyof Task, dir: 'asc' | 'desc') => void;
  startIndex: number;
  hideCreationInfo?: boolean;
}

export const TaskTable: React.FC<TaskTableProps> = ({ 
  tasks, 
  onUpdateTask, 
  onEditTask,
  onDeleteTask,
  selectedIds, 
  onSelectionChange, 
  viewMode = 'card',
  syncingIds = new Set(),
  sortKey,
  sortDir,
  onSort,
  startIndex,
  hideCreationInfo = false,
  currentUser
}) => {

  const requestSort = (key: keyof Task) => {
    onSort(key, sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
  };

  const getSortIcon = (key: keyof Task) => {
    if (sortKey !== key) return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    return sortDir === 'asc' ? <ArrowUp size={14} className="ml-1 text-white" /> : <ArrowDown size={14} className="ml-1 text-white" />;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange(e.target.checked ? tasks.map(t => t.id) : []);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed' || status === 'Complete') {
      return 'bg-green-100 text-green-700 border border-green-200';
    }
    if (status === 'Not Yet Started' || !status) {
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
    // Any other status (In Progress, Pending etc.) is Orange
    return 'bg-orange-100 text-orange-700 border border-orange-200';
  };

  const getRowBgColor = (status: string) => {
    if (status === 'Completed' || status === 'Complete') {
      return 'bg-green-50';
    }
    if (status === 'Not Yet Started' || !status) {
      return 'bg-white';
    }
    // Any other status (In Progress, Pending etc.) is Orange
    return 'bg-orange-50';
  };

  const canModifyTask = (task: Task) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    const taskCreator = (task.createdBy || '').toLowerCase().trim();
    const currentUserName = (currentUser.name || '').toLowerCase().trim();
    return taskCreator === currentUserName;
  };

  const thClass = "px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider border-r border-blue-600 last:border-r-0 cursor-pointer hover:bg-blue-800 transition-colors select-none";
  const tdClass = "px-4 py-3 text-sm text-black border-r border-gray-200 last:border-r-0 align-top";

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${viewMode === 'card' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-700 border-b border-blue-800">
                <th className="px-4 py-3 w-10 text-center border-r border-blue-600">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 h-4 w-4" checked={tasks.length > 0 && selectedIds.length === tasks.length} onChange={handleSelectAll} />
                </th>
                <th className={thClass} onClick={() => requestSort('id')}><div className="flex items-center">S.No. {getSortIcon('id')}</div></th>
                <th className={thClass} onClick={() => requestSort('date')}><div className="flex items-center">Create Date/Time {getSortIcon('date')}</div></th>
                <th className={thClass} onClick={() => requestSort('createdBy')}><div className="flex items-center">Created By {getSortIcon('createdBy')}</div></th>
                <th className={`${thClass} min-w-[300px]`} onClick={() => requestSort('title')}><div className="flex items-center">Task {getSortIcon('title')}</div></th>
                <th className={thClass} onClick={() => requestSort('assignee')}><div className="flex items-center">Assignee {getSortIcon('assignee')}</div></th>
                <th className={thClass} onClick={() => requestSort('status')}><div className="flex items-center">Status {getSortIcon('status')}</div></th>
                <th className={thClass} onClick={() => requestSort('lastUpdateDate')}><div className="flex items-center">Last Updated {getSortIcon('lastUpdateDate')}</div></th>
                {/* Increased column size for Remarks to satisfy Screenshot 2 */}
                <th className={`${thClass} min-w-[400px]`} onClick={() => requestSort('lastUpdateRemarks')}><div className="flex items-center">Remarks {getSortIcon('lastUpdateRemarks')}</div></th>
                <th className="px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider border-r border-blue-600 last:border-r-0 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task, index) => {
	                const isSyncing = syncingIds.has(task.id);
	                const hasModificationRights = canModifyTask(task);
	                return (
	                  <tr
	                    key={task.id}
	                    onDoubleClick={() => onUpdateTask(task)}
	                    className={`${getRowBgColor(task.status)} hover:brightness-95 transition-all ${isSyncing ? 'opacity-60' : ''} cursor-pointer`}
	                  >
	                    <td className={`${tdClass} text-center`}>
	                      <input
	                        type="checkbox"
	                        className="rounded border-gray-300 text-blue-600 h-4 w-4"
	                        checked={selectedIds.includes(task.id)}
	                        onChange={() => onSelectionChange(selectedIds.includes(task.id) ? selectedIds.filter(i => i !== task.id) : [...selectedIds, task.id])}
	                        onDoubleClick={(e) => e.stopPropagation()}
	                      />
	                    </td>
                    <td className={`${tdClass} text-center font-bold text-blue-600`}>{startIndex + index}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatToIndianDateTime(task.date)}</td>
                    <td className={tdClass}>{task.createdBy}</td>
                    <td className={`${tdClass} font-medium`}>{task.title}</td>
                    <td className={tdClass}>{task.assignee}</td>
                    <td className={tdClass}><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusColor(task.status)}`}>{task.status}</span></td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatToIndianDateTime(task.lastUpdateDate)}</td>
                    <td className={tdClass}>{task.lastUpdateRemarks || '-'}</td>
	                    <td className={tdClass}>
	                      <div className="flex items-center space-x-2 justify-center">
	                        <button onClick={() => onUpdateTask(task)} onDoubleClick={(e) => e.stopPropagation()} disabled={isSyncing} className="px-2 py-1 bg-blue-600 rounded text-xs font-medium text-white hover:bg-blue-700">Update</button>
	                        {/* Edit and Delete icons restricted based on Screenshot 1: only Admin or task creator */}
	                        {hasModificationRights && (
	                          <>
	                            <button onClick={() => onEditTask(task)} onDoubleClick={(e) => e.stopPropagation()} disabled={isSyncing} className="p-1 text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
	                            <button onClick={() => onDeleteTask(task.id)} onDoubleClick={(e) => e.stopPropagation()} disabled={isSyncing} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
	                          </>
	                        )}
	                      </div>
	                    </td>
	                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`space-y-4 md:hidden ${viewMode === 'card' ? 'block' : 'hidden'}`}>
	        {tasks.map((task, index) => {
	          const hasModificationRights = canModifyTask(task);
	          return (
	            <div key={task.id} onDoubleClick={() => onUpdateTask(task)} className={`${getRowBgColor(task.status)} rounded-xl shadow p-4 border border-gray-200 cursor-pointer`}>
	              <div className="flex justify-between mb-2">
	                <div className="flex items-center gap-2">
	                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 h-4 w-4" checked={selectedIds.includes(task.id)} onChange={() => onSelectionChange(selectedIds.includes(task.id) ? selectedIds.filter(i => i !== task.id) : [...selectedIds, task.id])} onDoubleClick={(e) => e.stopPropagation()} />
	                  <span className="text-xs font-bold text-blue-600">S.No: {startIndex + index}</span>
	                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusColor(task.status)}`}>{task.status}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{task.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                <div><span className="font-bold block uppercase text-[10px] text-gray-400">Assignee</span>{task.assignee}</div>
                <div><span className="font-bold block uppercase text-[10px] text-gray-400">Created By</span>{task.createdBy}</div>
                <div className="col-span-2"><span className="font-bold block uppercase text-[10px] text-gray-400">Created At</span>{formatToIndianDateTime(task.date)}</div>
              </div>
	              <div className="flex justify-end gap-2 border-t pt-3">
	                {hasModificationRights && (
	                  <>
	                    <button onClick={() => onDeleteTask(task.id)} onDoubleClick={(e) => e.stopPropagation()} className="p-2 text-red-600 bg-red-50 rounded"><Trash2 size={18} /></button>
	                    <button onClick={() => onEditTask(task)} onDoubleClick={(e) => e.stopPropagation()} className="p-2 text-blue-600 bg-blue-50 rounded"><Edit2 size={18} /></button>
	                  </>
	                )}
	                <button onClick={() => onUpdateTask(task)} onDoubleClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded uppercase">Update</button>
	              </div>
	            </div>
	          );
	        })}
      </div>
    </>
  );
};
