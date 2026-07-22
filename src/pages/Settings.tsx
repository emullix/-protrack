import React from 'react';
import { 
  User, 
  Bell, 
  Lock, 
  Shield, 
  Globe, 
  CreditCard, 
  HelpCircle,
  Camera,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Check
} from 'lucide-react';

import { User as UserType, Role } from '../types';
import api from '../api';

interface SettingsProps {
  currentUser: UserType | null;
  roles: Role[];
  onCreateRole: (role: any) => void;
  onUpdateRole: (id: string, role: any) => void;
  onDeleteRole: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  currentUser, 
  roles, 
  onCreateRole, 
  onUpdateRole, 
  onDeleteRole 
}) => {
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passError, setPassError] = React.useState('');
  const [passSuccess, setPassSuccess] = React.useState('');
  const [passLoading, setPassLoading] = React.useState(false);

  const handlePasswordChange = async () => {
    setPassError('');
    setPassSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }

    try {
      setPassLoading(true);
      await api.auth.changePassword({ currentPassword, newPassword });
      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile Information', icon: User, description: 'Update your personal details and public profile.' },
    { id: 'roles', label: 'Roles Management', icon: ShieldCheck, description: 'Define and maintain roles for your team members.' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure how you receive alerts and updates.' },
    { id: 'security', label: 'Security & Password', icon: Lock, description: 'Manage your password and account security settings.' },
    { id: 'privacy', label: 'Privacy Settings', icon: Shield, description: 'Control who can see your activity and profile.' },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard, description: 'Manage your plan, payment methods, and invoices.' },
    { id: 'language', label: 'Language & Region', icon: Globe, description: 'Set your preferred language and time zone.' },
  ];

  const [isAddingRole, setIsAddingRole] = React.useState(false);
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
  const [roleForm, setRoleForm] = React.useState({ name: '', description: '', color: 'bg-brand-500' });

  const resetForm = () => {
    setRoleForm({ name: '', description: '', color: 'bg-brand-500' });
    setIsAddingRole(false);
    setEditingRoleId(null);
  };

  const handleEditRole = (role: Role) => {
    setRoleForm({ name: role.name, description: role.description, color: role.color });
    setEditingRoleId(role.id);
  };

  const handleSubmitRole = () => {
    if (!roleForm.name) return;
    if (editingRoleId) {
      onUpdateRole(editingRoleId, roleForm);
    } else {
      onCreateRole(roleForm);
    }
    resetForm();
  };

  const colorOptions = [
    'bg-brand-500', 'bg-emerald-500', 'bg-blue-500', 
    'bg-purple-500', 'bg-rose-500', 'bg-amber-500', 
    'bg-indigo-500', 'bg-slate-500'
  ];

  if (activeSection === 'security') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveSection(null)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Security & Password</h2>
            <p className="text-slate-500">Manage your account security and authentication methods.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="p-8 space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Lock size={18} className="text-brand-600" />
              Change Password
            </h3>
            <div className="space-y-4">
              {passError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg">
                  {passSuccess}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button 
                onClick={handlePasswordChange}
                disabled={passLoading}
                className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-50"
              >
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" />
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-slate-200 rounded-full cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 transition duration-200 ease-in-out bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h3 className="font-bold text-slate-800">Active Sessions</h3>
            <div className="space-y-4">
              {[
                { device: 'MacBook Pro 16"', location: 'San Francisco, CA', time: 'Active now', icon: Globe },
                { device: 'iPhone 15 Pro', location: 'San Francisco, CA', time: '2 hours ago', icon: Globe }
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                      <session.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{session.device}</p>
                      <p className="text-xs text-slate-500">{session.location} • {session.time}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-rose-600 hover:underline">Log out</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'roles') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveSection(null)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
            >
              <ChevronRight size={24} className="rotate-180" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Roles Management</h2>
              <p className="text-slate-500">Define and maintain positions for your team.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddingRole(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus size={18} />
            Add Role
          </button>
        </div>

        {(isAddingRole || editingRoleId) && (
          <div className="bg-white p-6 rounded-2xl border-2 border-brand-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800">{editingRoleId ? 'Edit Role' : 'Create New Role'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Role Name</label>
                  <input 
                    type="text" 
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea 
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 h-24" 
                    placeholder="Briefly describe this role's responsibilities..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 block">Theme Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setRoleForm({ ...roleForm, color })}
                      className={`w-full aspect-square rounded-xl ${color} flex items-center justify-center transition-all hover:scale-105 ${roleForm.color === color ? 'ring-4 ring-brand-100 border-2 border-white' : ''}`}
                    >
                      {roleForm.color === color && <Check size={20} className="text-white" />}
                    </button>
                  ))}
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Preview</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${roleForm.color}`}>
                      {roleForm.name || 'New Role'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <button 
                onClick={resetForm}
                className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitRole}
                disabled={!roleForm.name}
                className="px-6 py-2 rounded-lg font-bold bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-50"
              >
                {editingRoleId ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                        <span className="font-bold text-slate-800">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500 max-w-md line-clamp-1">{role.description || 'No description provided.'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEditRole(role)}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all" title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteRole(role.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection && activeSection !== 'security') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveSection(null)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{sections.find(s => s.id === activeSection)?.label}</h2>
            <p className="text-slate-500">This section is coming soon.</p>
          </div>
        </div>
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            {React.createElement(sections.find(s => s.id === activeSection)?.icon || HelpCircle, { size: 32 })}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Under Construction</h3>
          <p className="text-slate-500 max-w-xs mx-auto">We're working hard to bring you more customization options. Stay tuned!</p>
          <button 
            onClick={() => setActiveSection(null)}
            className="mt-6 text-brand-600 font-bold hover:underline"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Manage your account preferences and application settings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                <img src="https://picsum.photos/seed/alex/200/200" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <button className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-2 rounded-lg shadow-lg hover:bg-brand-700 transition-all">
                <Camera size={16} />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-800">{currentUser?.name || 'Esteban Mullix'}</h3>
              <p className="text-slate-500 mb-4">{currentUser?.role || 'Admin'} • San Francisco, CA</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-all">
                  Edit Profile
                </button>
                <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all">
                  View Public Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sections.map((section) => (
            <button 
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                  <section.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{section.label}</h4>
                  <p className="text-sm text-slate-500">{section.description}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-600 transition-all" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-rose-800">Delete Account</h4>
          <p className="text-sm text-rose-600">Permanently delete your account and all associated data.</p>
        </div>
        <button className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition-all">
          Delete Account
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-4">
        <HelpCircle size={16} />
        <span>Need help? Visit our <button className="text-brand-600 hover:underline font-medium">Help Center</button></span>
      </div>
    </div>
  );
};

export default Settings;
