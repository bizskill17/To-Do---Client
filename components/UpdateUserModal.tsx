import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface UpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (user: User) => void;
  users: User[];
}

export const UpdateUserModal: React.FC<UpdateUserModalProps> = ({ isOpen, onClose, user, onUpdate, users }) => { 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    designation: '',
    role: 'Employee',
    isActive: true,
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{name?: string, email?: string, mobile?: string}>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        designation: user.designation || '',
        role: user.role,
        isActive: user.isActive,
        password: user.password || ''
      });
      setErrors({});
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'isActive' ? value === 'true' : value 
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateEmail = (email: string) => {
    if (!email.includes('@')) return "Please enter Correct Email Id";
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!regex.test(email)) return "Please enter Correct Email Id";
    if (users.some(u => u.id !== user.id && u.email.toLowerCase().trim() === email.toLowerCase().trim() && email.trim() !== '')) {
        return "This email is already associated with another user.";
    }
    return null;
  };

  const validate = () => {
    const newErrors: {name?: string, email?: string, mobile?: string} = {};
    if (users.some(u => u.id !== user.id && u.name.toLowerCase().trim() === formData.name.toLowerCase().trim())) {
        newErrors.name = "This user name already exists.";
    }
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
        newErrors.mobile = "Please enter 10 Digit Number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onUpdate({ ...user, ...formData });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-indigo-600">Update User</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-900">Full Name <span className="text-red-500">*</span></label>
              <input name="name" type="text" required placeholder="Enter full name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 placeholder-gray-400 ${errors.name ? 'border-red-500' : 'border-gray-200'}`} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Email <span className="text-red-500">*</span></label>
                <input name="email" type="text" required placeholder="Enter email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 placeholder-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-200'}`} />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Mobile Number <span className="text-red-500">*</span></label>
                <input name="mobile" type="text" required placeholder="Enter mobile number" value={formData.mobile} onChange={handleChange} className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 placeholder-gray-400 ${errors.mobile ? 'border-red-500' : 'border-gray-200'}`} />
                {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900">
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Designation</label>
                <input name="designation" type="text" placeholder="Enter designation" value={formData.designation} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 placeholder-gray-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input name="password" type={showPassword ? "text" : "password"} required placeholder="Update login password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 placeholder-gray-400" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">Account Status</label>
                <select name="isActive" value={String(formData.isActive)} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors uppercase font-bold text-xs">Cancel</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md uppercase font-bold text-xs">Update User</button>
          </div>
        </form>
      </div>
    </div>
  );
};