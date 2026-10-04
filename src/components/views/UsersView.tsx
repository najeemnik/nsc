import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Key, 
  UserCheck 
} from 'lucide-react';
import { User, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const { users, currentUser, addUser, deleteUser, t, language } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('accountant');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      alert('Please fill name, username and password');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      username,
      password,
      role,
      phone,
      email,
      active: true,
      createdAt: new Date().toISOString(),
      permissions: {
        allowedTabs: role === 'admin' ? ['*'] : ['dashboard', 'expenses', 'steel', 'concrete', 'contractors', 'suppliers', 'payments', 'documents', 'reports']
      }
    };

    addUser(newUser);
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setEmail('');
    setIsAdding(false);
  };

  const handleDelete = (id: string, userName: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own account while logged in');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${userName}"?`)) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>{t('staffManagement') || 'Staff & User Access Management'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('staffManagementDesc') || 'Control roles, permissions, accountants, site engineers, and viewers'}
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? t('cancel') || 'Cancel' : t('addUser') || 'New Staff Member'}</span>
        </button>
      </div>

      {/* Add User Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{t('createNewUser') || 'Create New Staff Account'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('fullName') || 'Full Name'} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ahmad Tariq"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('username') || 'Username (Login)'} *</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. tariq_nik"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('password') || 'Password'} *</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('role') || 'System Role'}</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="accountant">{t('accountant') || 'Accountant / Site Engineer'}</option>
                <option value="admin">{t('admin') || 'Administrator'}</option>
                <option value="viewer">{t('viewer') || 'Viewer (Read-only)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('phone') || 'Phone'}</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+93 70..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('email') || 'Email'}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700"
            >
              {t('saveUser') || 'Save User'}
            </button>
          </div>
        </form>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div 
            key={u.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    u.role === 'admin' 
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600' 
                      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.isMasterSuperAdmin && (
                        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">Owner</span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                  </div>
                </div>

                {!u.isMasterSuperAdmin && u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex justify-between">
                  <span>{t('role')}:</span>
                  <span className="font-bold capitalize text-slate-700 dark:text-slate-200">{u.role}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{u.phone}</span>
                  </div>
                )}
                {u.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{u.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>{t('status') || 'Status'}: Active</span>
              {u.id === currentUser?.id && (
                <span className="text-blue-600 font-bold">Current Session</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
