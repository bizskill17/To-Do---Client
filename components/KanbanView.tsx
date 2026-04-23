import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { Edit2, Trello, CheckCircle2, Circle } from 'lucide-react';

interface KanbanViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onOpenUpdateModal: (task: Task) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onUpdateTask, onEditTask, onOpenUpdateModal }) => {
  // Store custom order for assignees to handle column positioning
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  // Filter logic: show all non-completed tasks + only today's completed tasks
  const todayStr = new Date().toLocaleDateString('en-GB');
  
  const filteredTasks = tasks.filter(t => {
    if (t.status !== 'Completed') return true;
    if (t.lastUpdateDate) {
      // Assuming format is DD/MM/YYYY HH:mm
      const updateDateOnly = t.lastUpdateDate.split(' ')[0];
      return updateDateOnly === todayStr;
    }
    return false;
  });
  
  // Group tasks by assignee
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const key = task.assignee || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Keep group ordering stable without manual move arrows
  const sortedGroupedTasks = useMemo(() => groupedTasks, [groupedTasks]);

  // Determine column order: custom order first, then remaining sorted alphabetically
  const assignees = useMemo(() => {
    const allGroups = Object.keys(groupedTasks);
    const ordered = customOrder.filter(name => allGroups.includes(name));
    const remaining = allGroups.filter(name => !ordered.includes(name)).sort();
    return [...ordered, ...remaining];
  }, [groupedTasks, customOrder]);

  const handleHeaderClick = (assignee: string) => {
    // Reorder Columns: Move clicked assignee to the end
    setCustomOrder(prev => {
      const filtered = prev.filter(name => name !== assignee);
      const allGroups = Object.keys(groupedTasks);
      const others = allGroups.filter(name => name !== assignee && !filtered.includes(name)).sort();
      return [...filtered, ...others, assignee];
    });
  };

  const handleToggleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const now = new Date();
    const timestamp = now.toLocaleString('en-GB').replace(',', '');
    
    const isCurrentlyCompleted = task.status === 'Completed';
    onUpdateTask({
      ...task,
      status: isCurrentlyCompleted ? 'Not Yet Started' : 'Completed',
      lastUpdateDate: timestamp,
      lastUpdateRemarks: isCurrentlyCompleted ? 'Reverted' : 'Completed'
    });
  };

  const getTaskBgColor = (status: string) => {
    if (status === 'Completed') return 'bg-green-50';
    if (status === 'Not Yet Started' || !status) return 'bg-white';
    // Any other status (In Progress, Pending etc.) is Orange
    return 'bg-orange-50';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max h-full items-start">
          {assignees.map(assignee => (
            <div key={assignee} className="w-72 flex flex-col bg-gray-100 rounded-xl border border-gray-200 max-h-full">
              <div 
                onClick={() => handleHeaderClick(assignee)}
                className="p-3 border-b border-indigo-500 flex justify-between items-center bg-indigo-600 text-white rounded-t-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <h3 className="font-black uppercase tracking-wider text-[11px] truncate pr-2">
                  {assignee}
                </h3>
                <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black shadow-inner">
                  {groupedTasks[assignee].length}
                </span>
              </div>
              <div className="p-1.5 space-y-1.5 overflow-y-auto custom-scrollbar flex-1">
                {sortedGroupedTasks[assignee].map(task => (
                  <div 
                    key={task.id} 
                    className={`${getTaskBgColor(task.status)} rounded-lg shadow-sm border border-gray-200 hover:border-indigo-400 transition-all cursor-pointer group relative overflow-hidden flex min-h-0`}
                  >
                    {/* Left Blue Sidebar Area with Toggle */}
                    <div className="w-8 bg-indigo-600 flex items-center justify-center shrink-0 border-r border-indigo-700">
                      <button 
                        onClick={(e) => handleToggleComplete(e, task)}
                        className={`transition-all duration-200 transform active:scale-95 ${task.status === 'Completed' ? 'text-green-400' : 'text-indigo-200 hover:text-white'}`}
                        title={task.status === 'Completed' ? "Click to Revert to Pending" : "Click to Mark as Completed"}
                      >
                        {task.status === 'Completed' ? (
                          <CheckCircle2 size={18} className="fill-indigo-600" />
                        ) : (
                          <div className="relative">
                            <Circle size={18} className="group-hover:hidden stroke-2" />
                            <CheckCircle2 size={18} className="hidden group-hover:block stroke-2" />
                          </div>
                        )}
                      </button>
                    </div>
                    
                    {/* Content Area */}
                    <div className="flex-1 p-2 flex flex-col justify-center" onClick={() => onOpenUpdateModal(task)}>
                      <h4 className={`text-[11px] font-bold text-gray-900 leading-tight ${task.status === 'Completed' ? 'line-through opacity-40' : ''}`}>
                        {task.title}
                        {task.lastUpdateRemarks && (
                          <span className="text-[10px] font-medium text-blue-500 block mt-1 italic leading-tight">
                            ({task.lastUpdateRemarks})
                          </span>
                        )}
                      </h4>
                    </div>

	                  </div>
	                ))}
              </div>
            </div>
          ))}
          {assignees.length === 0 && (
            <div className="w-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Trello size={48} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest">No active tasks found for Kanban View</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
