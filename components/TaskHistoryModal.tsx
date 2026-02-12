
import React, { useMemo } from 'react';
import { X, Download, Clock, History, FileText } from 'lucide-react';
import { ActionLogEntry, Task } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatToIndianDate, formatToIndianDateTime } from '../App';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  logs: ActionLogEntry[];
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({ isOpen, onClose, task, logs }) => {
  if (!isOpen || !task) return null;

  const taskLogs = logs.filter(log => {
    const logTaskId = Number(log.taskId || 0);
    const currentTaskId = Number(task.id || 0);
    return logTaskId > 0 && logTaskId === currentTaskId;
  }).sort((a, b) => { 
    const dateA = new Date(a.updateDate.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) (AM|PM)/, '$3-$2-$1 $4:$5 $6'));
    const dateB = new Date(b.updateDate.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}) (AM|PM)/, '$3-$2-$1 $4:$5 $6'));
    return dateB.getTime() - dateA.getTime();
  });
  
  const hoursSummary = useMemo(() => {
    const summary: { [key: string]: number } = {};
    taskLogs.forEach(log => {
        if (log.hoursTaken && log.hoursTaken > 0 && log.updaterName) {
            const key = log.updaterName;
            summary[key] = (summary[key] || 0) + log.hoursTaken;
        }
    });
    return summary;
  }, [taskLogs]);

  const handleDownloadExcel = () => {
    const headers = ["S.No", "Task Date", "Update Date", "Status", "Remarks", "Principal Partner", "Client", "Team Leader", "Hours Taken", "Updater"];
    const csvRows = [
      headers.join(','),
      ...taskLogs.map((log, index) => [
        index + 1,
        `"${formatToIndianDate(log.taskDate)}"`,
        `"${formatToIndianDateTime(log.updateDate)}"`,
        `"${log.status}"`,
        `"${(log.remarks || '').replace(/"/g, '""')}"`,
        `"${log.owner}"`,
        `"${(log.clientName || '').replace(/"/g, '""')}"`,
        `"${log.assignees}"`,
        log.hoursTaken || 0,
        `"${log.updaterName || ''}${log.updaterDesignation ? ' (' + log.updaterDesignation + ')' : ''}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `TaskHistory_${task.id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Task History', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Updates for: ${task.title}`, 14, 30);
    doc.setFontSize(10);
    doc.text(`Client: ${task.clientName || '-'}`, 14, 36);

    let currentY = 42;

    if (Object.keys(hoursSummary).length > 0) {
      doc.setFontSize(12);
      doc.text("Total Hours Spent Summary:", 14, currentY + 5);
      currentY += 10;
      const summaryTableRows = Object.entries(hoursSummary).map(([name, hours]) => [name, (hours as number).toFixed(1)]);
      autoTable(doc, {
        head: [['Updater Name', 'Hours']],
        body: summaryTableRows,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    doc.setFontSize(12);
    doc.text("Update History Log:", 14, currentY);
    currentY += 5;

    let tableColumn: string[] = ["Task Date", "Update Date", "Status", "Remarks", "Principal Partner", "Client", "Team Leader", "Hours Taken", "Updater"];
    let tableRows: any[] = [];

    tableRows = taskLogs.map(log => [
        formatToIndianDate(log.taskDate),
        formatToIndianDate(log.updateDate),
        log.status,
        log.remarks || '-',
        log.owner || '-',
        log.assignees || '-', 
        log.hoursTaken || 0,
        log.updaterName ? (log.updaterDesignation ? `${log.updaterName} (${log.updaterDesignation})` : log.updaterName) : '-' 
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`Task_History_${task.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border-2 border-blue-500">
        
        <div className="flex items-center justify-between p-6 border-b border-blue-100 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-blue-600">Task Details & History</h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">TASK:</span>
                   <span className="text-sm font-black text-black uppercase">{task.title}</span>
                </div>
                
                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">CATEGORY:</span>
                    <div className="text-xs font-black text-indigo-700 uppercase">{task.category || 'N/A'}</div>
                </div>

                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">CLIENT:</span>
                    <div className="text-xs font-black text-pink-600 uppercase">{task.clientName || 'N/A'}</div>
                </div>

                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">PRINCIPAL PARTNER:</span>
                    <div className="text-xs font-black text-blue-800 uppercase">{task.owner || 'N/A'}</div>
                </div>

                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">TEAM LEADER:</span>
                    <div className="text-xs font-black text-indigo-800 uppercase">{task.assignees || 'N/A'}</div>
                </div>

                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">TEAM MEMBER(S):</span>
                    <div className="text-xs font-black text-purple-800 uppercase">{task.teamMembers || 'N/A'}</div>
                </div>

                <div className="bg-gray-50 border-2 border-blue-100 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">CURRENT STATUS:</span>
                    <div className="mt-0.5">
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">{task.status}</span>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <button onClick={handleDownloadExcel} className="p-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-lg" title="Download History Excel">
                  <FileText size={24} className="text-green-600" />
              </button>
              <button onClick={handleDownloadPDF} className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg" title="Download History PDF">
                  <Download size={24} />
              </button>
              <button onClick={onClose} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors">
                <X size={28} />
              </button>
          </div>
        </div>

        <div className="overflow-auto p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-sm flex flex-col md:col-start-3">
               <div className="bg-indigo-600 px-4 py-2.5 flex items-center gap-2">
                 <Clock size={16} className="text-white" />
                 <span className="text-xs font-black text-white uppercase tracking-widest">Total Hours Spent</span>
               </div>
               <div className="flex-1 overflow-auto">
                 <table className="w-full text-left">
                   <thead className="bg-indigo-50 border-b border-indigo-100">
                     <tr>
                       <th className="px-4 py-2 text-[10px] font-black text-indigo-700 uppercase">Updater Name</th>
                       <th className="px-4 py-2 text-[10px] font-black text-indigo-700 uppercase text-center">Hours</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-indigo-50">
                     {Object.entries(hoursSummary).map(([name, hours]) => (
                       <tr key={name} className="hover:bg-indigo-50/50">
                         <td className="px-4 py-2 text-xs font-bold text-gray-900">{name}</td>
                         <td className="px-4 py-2 text-xs font-black text-indigo-600 text-center">{(hours as number).toFixed(1)}</td>
                       </tr>
                     ))}
                     {Object.keys(hoursSummary).length === 0 && (
                       <tr><td colSpan={2} className="px-4 py-10 text-center text-[10px] font-black text-gray-300 uppercase italic tracking-widest">No hours logged</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
               <History className="text-blue-600" size={16} /> UPDATE HISTORY LOG
            </h3>
            <div className="border-2 border-blue-100 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-blue-600">
                  <tr className="border-b border-blue-700">
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500">Remarks</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500">Principal Partner</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500">Client</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500">Team Leader</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest border-r border-blue-500 text-center">Hours Taken</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Updater</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {taskLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs border-r border-blue-50">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase whitespace-nowrap border-2 border-blue-200">
                            {log.status}
                        </span>
                        <div className="mt-1 text-[9px] text-gray-400 font-bold uppercase">{formatToIndianDate(log.updateDate)}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-black max-w-[300px] font-bold italic border-r border-blue-50 leading-relaxed">"{log.remarks}"</td>
                      <td className="px-6 py-4 text-xs text-black font-black uppercase border-r border-blue-50">{log.owner}</td>
                      <td className="px-6 py-4 text-xs text-black font-black uppercase border-r border-blue-50 max-w-[150px] truncate" title={log.clientName}>{log.clientName || '-'}</td>
                      <td className="px-6 py-4 text-xs text-black font-black uppercase border-r border-blue-50">{log.assignees}</td>
                      <td className="px-6 py-4 text-xs text-indigo-700 font-black border-r border-blue-50 text-center">{log.hoursTaken || 0}</td>
                      <td className="px-6 py-4 text-xs text-black font-black">
                        <div>{log.updaterName}</div>
                        {log.updaterDesignation && <div className="text-[9px] text-indigo-400 font-bold uppercase mt-0.5">{log.updaterDesignation}</div>}
                      </td>
                    </tr>
                  ))}
                  {taskLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-gray-300 font-black uppercase tracking-[0.3em] text-sm bg-gray-50/20">
                        No update history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-blue-100 bg-gray-50/50 rounded-b-xl flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-10 py-3 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest shadow-xl shadow-blue-200">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
