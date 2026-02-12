import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';

interface BulkAddTaskViewProps {
  users: User[];
  onBulkAdd: (tasks: any[]) => Promise<void>;
  onCancel: () => void;
}

export const BulkAddTaskView: React.FC<BulkAddTaskViewProps> = ({ users, onBulkAdd, onCancel }) => {
  const [selectedAssignee, setSelectedAssignee] = useState({ id: '', name: '' });
  const [taskTitles, setTaskTitles] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userOptions = users.map(u => ({ value: String(u.id), label: u.name }));

  useEffect(() => {
    // Focus the last added input
    const lastInput = inputRefs.current[taskTitles.length - 1];
    if (lastInput) {
      lastInput.focus();
    }
  }, [taskTitles.length]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Always add a new row on Enter, even if current is empty (per visual request)
      // or only if it's the last one
      if (index === taskTitles.length - 1) {
        setTaskTitles([...taskTitles, '']);
      } else {
          // If not the last one, just move focus down
          const nextInput = inputRefs.current[index + 1];
          if (nextInput) nextInput.focus();
      }
    }
  };

  const handleTitleChange = (index: number, val: string) => {
    const updated = [...taskTitles];
    updated[index] = val;
    setTaskTitles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignee.id || isSubmitting) return;
    
    const validTitles = taskTitles.filter(t => t.trim() !== '');
    if (validTitles.length === 0) return;

    const tasks = validTitles.map(title => ({
      title,
      assigneeId: selectedAssignee.id,
      assignee: selectedAssignee.name
    }));

    setIsSubmitting(true);
    try {
      await onBulkAdd(tasks);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="max-w-md">
            <SearchableSelect 
              label={<span className="text-lg font-black uppercase tracking-wider text-indigo-700">Select Assignee *</span>}
              options={userOptions}
              value={selectedAssignee.id}
              onChange={(val) => setSelectedAssignee({ 
                id: val, 
                name: userOptions.find(o => o.value === val)?.label || '' 
              })}
              required
              placeholder="Select Assignee"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest">Tasks to create</h3>
              <p className="text-[10px] font-bold text-indigo-400 uppercase italic">Press Enter to add more</p>
            </div>

            <div className="space-y-3">
              {taskTitles.map((title, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-3.5 text-[10px] font-black text-indigo-300 uppercase">{idx + 1}</span>
                    <input 
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      placeholder="e.g. File GST return..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none text-gray-900 font-medium transition-all"
                      value={title}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      required={idx === 0}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
            <button 
              type="submit"
              disabled={isSubmitting || !selectedAssignee.id || taskTitles.every(t => t.trim() === '')}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Creating Tasks...</span>
                </>
              ) : (
                'Create Tasks'
              )}
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-8 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-colors uppercase tracking-widest text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};