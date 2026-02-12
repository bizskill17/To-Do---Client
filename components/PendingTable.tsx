
import React, { useState } from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';

interface PendingTableProps {
  title: string;
  headerLabel: string;
  data: { 
    name: string; 
    total: number; 
    notStarted: number; 
    inProgress: number 
  }[];
  onRowClick: (name: string) => void;
  className?: string;
}

export const PendingTable: React.FC<PendingTableProps> = ({ title, headerLabel, data, onRowClick, className = '' }) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const thClass = "px-4 py-4 font-bold text-[10px] uppercase tracking-wider text-center border-r border-blue-700 last:border-r-0";
  const tdClass = "px-4 py-4 text-xs text-center font-bold border-r border-blue-50 last:border-r-0";

  return (
    <div className={`${className || 'bg-white'} rounded-xl shadow-sm border-2 border-blue-400 overflow-hidden`}>
      <div className="p-4 md:p-6 border-b border-blue-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-blue-700 uppercase tracking-tight">{title}</h3>
        
        <div className="flex bg-blue-50 p-1 rounded-lg md:hidden border border-blue-200">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-all border ${viewMode === 'card' ? 'bg-white shadow text-blue-600 border-blue-600' : 'text-blue-400 border-transparent'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all border ${viewMode === 'table' ? 'bg-white shadow text-blue-600 border-blue-600' : 'text-blue-400 border-transparent'}`}
            >
              <LayoutList size={16} />
            </button>
        </div>
      </div>
      
      <div className={`overflow-x-auto ${viewMode === 'card' ? 'hidden md:block' : 'block'}`}>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider border-r border-blue-700 last:border-r-0">{headerLabel}</th>
              <th className={thClass}>Total Pending</th>
              <th className={thClass}>Not Started</th>
              <th className={thClass}>In Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  onClick={() => onRowClick(row.name)}
                >
                  <td className="px-6 py-4 text-xs text-black font-black uppercase border-r border-blue-50">{row.name}</td>
                  <td className={`${tdClass} text-blue-800`}>{row.total}</td>
                  <td className={`${tdClass} text-red-600`}>{row.notStarted}</td>
                  <td className={`${tdClass} text-green-700`}>{row.inProgress}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-blue-900/40 text-sm font-bold uppercase">
                  No pending data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`p-4 space-y-3 md:hidden ${viewMode === 'card' ? 'block' : 'hidden'}`}>
        {data.length > 0 ? (
            data.map((row, idx) => (
                <div 
                    key={idx} 
                    onClick={() => onRowClick(row.name)}
                    className="bg-white/80 border-2 border-blue-200 rounded-lg p-4 shadow-sm active:bg-blue-50 transition-colors cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-base font-bold text-blue-800 uppercase">{row.name}</h4>
                        <div className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            {row.total}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-blue-100">
                        <div className="text-center p-2 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-[8px] font-bold text-red-400 uppercase mb-0.5">Not Started</div>
                            <div className="text-sm font-black text-red-600">{row.notStarted}</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-[8px] font-bold text-green-600 uppercase mb-0.5">In Progress</div>
                            <div className="text-sm font-black text-green-700">{row.inProgress}</div>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-6 text-blue-400 text-sm font-bold uppercase">
                No pending tasks.
            </div>
        )}
      </div>
    </div>
  );
};
