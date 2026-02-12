import React, { useMemo } from 'react';
import { Plus, UserPlus, CheckSquare, Clock, AlertTriangle, CheckCircle, Users, LayoutList, History, ClipboardCheck } from 'lucide-react'; 
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { PendingTable } from './PendingTable';
import { Task, User as UserType, Client, ActionLogEntry, RecurringTaskAction } from '../types'; 
import { parseToISO } from '../App';

interface DashboardProps {
  isAdmin: boolean;
  onOpenNewTask: () => void;
  onOpenAddUser: () => void;
  onFilterChange: (type: string, value: string) => void;
  onNavigate: (tab: string) => void;
  tasks: Task[];
  users: UserType[];
  clients: Client[];
  actionLogs: ActionLogEntry[]; 
  recurringActions: RecurringTaskAction[]; 
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  isAdmin,
  onOpenNewTask, 
  onOpenAddUser,
  onFilterChange,
  onNavigate,
  tasks, 
  users, 
  clients,
  actionLogs, 
  recurringActions, 
}) => {
  
  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'Completed'), [tasks]);

  const stats = useMemo(() => {
    const totalTasks = activeTasks.length;
    const pendingTasks = activeTasks.length;
    
    const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
    
    const totalUsers = users.length;
    return { totalTasks, pendingTasks, completedTasksCount, totalUsers };
  }, [activeTasks, tasks, users]);

  const todayUpdates = useMemo(() => {
    // Correctly get current date in DD/MM/YYYY format for robust comparison
    const todayStr = new Date().toLocaleDateString('en-GB');
    
    const mainMap = new Map<string, number>();
    // Updated logic: Use tasks and assignee where Last Update Date matches today's date part
    tasks.forEach(task => {
      if (task.lastUpdateDate) {
        const updateDateOnly = task.lastUpdateDate.split(' ')[0]; // Gets the DD/MM/YYYY part
        if (updateDateOnly === todayStr && task.assignee) {
          mainMap.set(task.assignee, (mainMap.get(task.assignee) || 0) + 1);
        }
      }
    });
    
    const mainList = Array.from(mainMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { main: mainList };
  }, [tasks]);

  const getGroupedData = (groupKey: keyof Task) => {
    const map = new Map<string, { 
      name: string; 
      total: number; 
      notStarted: number; 
      inProgress: number 
    }>();

    activeTasks.forEach(task => {
      const val = task[groupKey];
      const keys = (typeof val === 'string' && (groupKey === 'teamMembers' || groupKey === 'assignees'))
        ? (val ? val.split(',').map(s => s.trim()) : ['Unassigned'])
        : [String(val || 'Unassigned')];

      keys.forEach(key => {
        if (!map.has(key)) {
          map.set(key, { 
            name: key, 
            total: 0, 
            notStarted: 0, 
            inProgress: 0 
          });
        }
        const entry = map.get(key)!;
        entry.total += 1;
        if (task.status === 'Not Yet Started') {
          entry.notStarted += 1;
        } else {
          // General mapping for In Progress status
          entry.inProgress += 1;
        }
      });
    });
    return Array.from(map.values());
  };

  const assigneeData = useMemo(() => 
    getGroupedData('assignee').sort((a, b) => a.name.localeCompare(b.name)), 
  [activeTasks]);

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-4">
        <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">{icon}</span>
        <h3 className="text-lg font-black text-blue-800 uppercase tracking-tight">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-center">
        <h2 className="text-3xl font-black text-blue-700 uppercase tracking-widest border-b-4 border-blue-600 pb-2">TASK Dashboard</h2>
      </div>

      {isAdmin && (
        <div className="bg-sky-50 p-6 rounded-2xl shadow-md border-2 border-blue-300">
          <SectionHeader title="Quick Add" icon={<LayoutList size={20}/>} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction label="New Task" icon={<Plus size={18} />} colorClass="bg-blue-600 hover:bg-blue-700 text-white" onClick={onOpenNewTask} />
            <QuickAction label="Add User" icon={<UserPlus size={18} />} colorClass="bg-indigo-500 hover:bg-indigo-600 text-white" onClick={onOpenAddUser} />
          </div>
        </div>
      )}

      <div className="bg-blue-50/70 p-6 rounded-2xl border-2 border-blue-300 shadow-sm">
        <SectionHeader title="Pending Tasks Summary" icon={<Clock size={20}/>} />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Pending Tasks" value={stats.totalTasks} icon={<CheckSquare size={20}/>} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
            <StatCard title="Pending" value={stats.pendingTasks} icon={<Clock size={20}/>} iconBgColor="bg-amber-100" iconColor="text-amber-600" onClick={() => onNavigate('pending')} />
            <StatCard title="Completed" value={stats.completedTasksCount} icon={<CheckCircle size={20}/>} iconBgColor="bg-green-100" iconColor="text-green-600" onClick={() => onNavigate('completed')} />
            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={20}/>} iconBgColor="bg-indigo-100" iconColor="text-indigo-600" onClick={isAdmin ? () => onNavigate('users') : undefined} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <PendingTable title="Pending by Assignee" headerLabel="Assignee Name" data={assigneeData} onRowClick={(name) => onFilterChange('assignee-pending', name)} />
      </div>

      <div className="bg-blue-50/70 p-6 rounded-2xl border-2 border-blue-300 shadow-sm mt-8">
        <SectionHeader title="Today's Updates Summary" icon={<History size={20}/>} />
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden flex flex-col">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} />
                <span className="text-sm font-black uppercase tracking-wider">Main Task Updates</span>
              </div>
              <span className="text-[10px] font-bold opacity-80">{new Date().toLocaleDateString('en-GB')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-100">
                    <th className="px-4 py-2 text-[10px] font-black text-blue-700 uppercase tracking-widest">Assignee</th>
                    <th className="px-4 py-2 text-[10px] font-black text-blue-700 uppercase tracking-widest text-center">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {todayUpdates.main.length > 0 ? todayUpdates.main.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => onFilterChange('assignee-today', row.name)}>
                      <td className="px-4 py-3 text-xs font-bold text-gray-800 uppercase">{row.name}</td>
                      <td className="px-4 py-3 text-xs font-black text-blue-600 text-center">{row.count}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-10 text-center text-blue-300 text-[10px] font-bold uppercase italic">No updates recorded today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};