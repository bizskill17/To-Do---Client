import React, { useMemo, useState } from 'react';
import { KeyRound, Pencil, Save, Trash2, X } from 'lucide-react';
import { MessageSettings } from '../types';

interface MessageSettingsViewProps {
  settings: MessageSettings;
  onSave: (next: MessageSettings) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export const MessageSettingsView: React.FC<MessageSettingsViewProps> = ({ settings, onSave, onDelete }) => {
  const hasRow = useMemo(() => {
    return Boolean(String(settings.userId || '').trim() || String(settings.password || '').trim() || String(settings.ownerNumber || '').trim());
  }, [settings]);

  const [isEditing, setIsEditing] = useState(!hasRow);
  const [form, setForm] = useState<MessageSettings>({ ...settings });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const normalizeOwnerNumber = (val: string) => {
    const digitsOnly = String(val || '').replace(/\D/g, '');
    if (digitsOnly.length <= 10) return digitsOnly;
    // If user pastes with country code (e.g. +91...), keep last 10 digits
    return digitsOnly.slice(-10);
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-white border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-gray-900 transition-all";
  const labelClass = "text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1.5";

  const startEdit = () => {
    setForm({ ...settings });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm({ ...settings });
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerNumberNormalized = normalizeOwnerNumber(form.ownerNumber);
    if (ownerNumberNormalized && ownerNumberNormalized.length !== 10) {
      alert('Owner Number must be exactly 10 digits.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        userId: String(form.userId || '').trim(),
        password: String(form.password || '').trim(),
        ownerNumber: ownerNumberNormalized
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete Message Settings?')) return;
    setSaving(true);
    try {
      await onDelete();
      setIsEditing(true);
      setForm({ userId: '', password: '', ownerNumber: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-indigo-600">Message Settings</h2>
        </div>

        {hasRow && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-bold text-xs uppercase"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm font-bold text-xs uppercase disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
          <KeyRound className="text-indigo-600" size={18} />
          <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">Credentials</h3>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>User Id</label>
              <input
                value={form.userId}
                onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
                className={inputClass}
                placeholder=""
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Password</label>
              <div className="flex gap-2">
                <input
                  value={form.password}
                  type={showPassword ? 'text' : 'password'}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="px-3 py-2.5 border border-indigo-300 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Owner Number</label>
              <input
                value={form.ownerNumber}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                onChange={(e) => setForm((p) => ({ ...p, ownerNumber: normalizeOwnerNumber(e.target.value) }))}
                className={inputClass}
                placeholder=""
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              {hasRow && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-bold text-xs uppercase disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-bold text-xs uppercase disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : hasRow ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className={labelClass}>User Id</div>
              <div className="font-bold text-gray-900 break-words">{settings.userId || '-'}</div>
            </div>
            <div>
              <div className={labelClass}>Password</div>
              <div className="font-bold text-gray-900 break-words">{settings.password ? '••••••••' : '-'}</div>
            </div>
            <div>
              <div className={labelClass}>Owner Number</div>
              <div className="font-bold text-gray-900 break-words">{settings.ownerNumber || '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
