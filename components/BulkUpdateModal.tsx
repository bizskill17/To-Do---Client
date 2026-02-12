
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
// Fix: Removed Vendor from types import.
import { Task, User, Client } from '../types'; 
import { SearchableSelect } from './SearchableSelect';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  onUpdate: (updates: Partial<Task>) => void;
  users: User[];
  // Fix: Replaced vendors with clients. Removed isVendorView.
  clients?: Client[]; 
  mode: 'status' | 'priority' | 'assignee' | 'teamMembers'; // Added 'teamMembers'
}

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({ 
  isOpen, 
  onClose, 
  count, 
  onUpdate, 
  users, 
  // Fix: Renamed vendors to clients
  clients = [],
  // Fix: Removed isVendorView
  mode
}) => {
  const [formData, setFormData] = useState<{status: string; priority: string; remarks: string}>({
    status: '',
    priority: '',
    remarks: ''
  });
  // Fix: Removed isVendorView check, defaulting to multiple for assignees
  const [reassignSelection, setReassignSelection] = useState<string | string[]>([]);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData({ status: '', priority: '', remarks: '' });
        // Fix: Removed isVendorView check
        setReassignSelection([]); 
        setError('');
        setIsConfirming(false);
    }
    // Fix: Removed isVendorView from dependencies
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasValidInput = false;
    if (mode === 'status' && formData.status) hasValidInput = true;
    if (mode === 'priority' && formData.priority) hasValidInput = true;
    if (mode === 'assignee' || mode === 'teamMembers') {
        const selCount = Array.isArray(reassignSelection) ? reassignSelection.length : (reassignSelection ? 1 : 0);
        if (selCount > 0) hasValidInput = true;
    }

    if (!hasValidInput) {
        setError('Please select a value to update.');
        return;
    }

    if (mode === 'status' && ['In Progress', 'Pending for Leader', 'Pending for Partner'].includes(formData.status) && (!formData.remarks || formData.remarks.trim() === '')) {
        setError('Update remark is required for this status.');
        return;
    }

    setIsConfirming(true);
  };

  const handleFinalSubmit = () => {
    const updates: any = {};
    if (mode === 'status' && formData.status) {
        updates.status = formData.status;
        updates.lastUpdateRemarks = formData.remarks;
    }
    if (mode === 'priority' && formData.priority) {
        updates.priority = formData.priority;
        updates.lastUpdateRemarks = `Bulk Priority change to ${formData.priority}`;
    }
    if (mode === 'assignee') { // For Team Leader
        const val = Array.isArray(reassignSelection) ? reassignSelection.join(', ') : reassignSelection;
        if (val) {
            updates.assignees = val; // Single select, but stored as string
            updates.lastUpdateRemarks = `Bulk Team Leader change to ${val}`;
        }
    }
    if (mode === 'teamMembers') { // For Team Members
        const val = Array.isArray(reassignSelection) ? reassignSelection.join(', ') : reassignSelection;
        if (val) {
            updates.teamMembers = val;
            updates.lastUpdateRemarks = `Bulk Team Members change to ${val}`;
        }
    }
    
    onUpdate(updates);
    onClose();
  };

  const teamLeaderUsers = users.filter(u => u.isActive && u.designation === 'Team Leader');
  const teamMemberUsers = users.filter(u => u.isActive && u.designation === 'Team Member');
  
  const assigneeOptions = teamLeaderUsers.map(u => ({ value: u.name, label: u.name }));
  const teamMemberOptions = teamMemberUsers.map(u => ({ value: u.name, label: u.name }));

  const getTitle = () => {
    switch(mode) {
        case 'status': return 'Bulk Status Update';
        case 'priority': return 'Bulk Priority Update';
        case 'assignee': return 'Bulk Team Leader Update';
        case 'teamMembers': return 'Bulk Team Members Update';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-indigo-600">{isConfirming ? 'Confirm Update' : getTitle()}</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {isConfirming ? (
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-50 rounded-full text-amber-600">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Are you sure?</h3>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setIsConfirming(false)} className="flex-1 px-6 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors uppercase tracking-wider">Go Back</button>
              <button onClick={handleFinalSubmit} className="flex-1 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all uppercase tracking-wider">Confirm & Apply</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePreSubmit}>
            <div className="p-6 space-y-6">
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <p className="text-sm text-indigo-700 font-bold uppercase tracking-wider">Updating {count} tasks</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">{error}</div>
              )}

              {mode === 'status' && (
                  <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-900 block mb-1">New Status</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none">
                          <option value="">Select Status...</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending for Partner">Pending for Partner</option>
                          <option value="Pending for Leader">Pending for Leader</option>
                          <option value="Completed">Completed</option>
                      </select>
                  </div>
              )}

              {mode === 'priority' && (
                  <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-900 block mb-1">New Priority</label>
                      <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-100 outline-none">
                          <option value="">Select Priority...</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                      </select>
                  </div>
              )}

              {mode === 'assignee' && ( // Team Leader
                  <div className="space-y-1">
                      <SearchableSelect 
                          label={"New Team Leader"}
                          options={assigneeOptions}
                          value={reassignSelection}
                          onChange={setReassignSelection}
                          multiple={false} // Single-select for Team Leader
                          placeholder={"Select Team Leader..."}
                      />
                  </div>
              )}

              {mode === 'teamMembers' && ( // Team Members
                  <div className="space-y-1">
                      <SearchableSelect 
                          label={"New Team Member(s)"}
                          options={teamMemberOptions}
                          value={reassignSelection}
                          onChange={setReassignSelection}
                          multiple={true} // Multi-select for Team Members
                          placeholder={"Select Team Members..."}
                      />
                  </div>
              )}

              {(mode === 'status' && ['In Progress', 'Pending for Leader', 'Pending for Partner'].includes(formData.status)) && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900 block mb-1">
                      Update Remark <span className="text-red-500">*</span>
                  </label>
                  <textarea name="remarks" rows={3} placeholder="Details of why this bulk update is being performed..." value={formData.remarks} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 resize-none focus:ring-2 focus:ring-indigo-100 outline-none"></textarea>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all uppercase tracking-wider font-bold">Apply Updates</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
