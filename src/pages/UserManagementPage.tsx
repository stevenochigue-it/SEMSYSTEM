import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit, Power } from 'lucide-react';
import type { User } from '../types';

export const UserManagementPage: React.FC = () => {
  const { users, addUser, updateUser } = useData();
  const { user: currentLoggedUser } = useAuth();

  // Modal Control state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Fields state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'admin' | 'guard'>('guard');
  const [error, setError] = useState<string | null>(null);

  const openFormModal = (user: User | null = null) => {
    setError(null);
    setSelectedUser(user);
    if (user) {
      setUsername(user.username);
      setPassword(''); // Keep blank unless resetting
      setFirstName(user.first_name || user.full_name?.split(' ')[0] || '');
      setMiddleName(user.middle_name || '');
      setLastName(user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '');
      setRole((user.role as any) || 'guard');
    } else {
      setUsername('');
      setPassword('');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setRole('guard');
    }
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Username, First Name, and Last Name are required.');
      return;
    }

    if (!selectedUser && !password.trim()) {
      setError('Password is required for new accounts.');
      return;
    }

    const computedFullName = `${firstName.trim()} ${middleName.trim() ? middleName.trim() + ' ' : ''}${lastName.trim()}`;

    try {
      if (selectedUser) {
        // Edit mode
        const data: Partial<User> = {
          username: username.trim(),
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          full_name: computedFullName,
          role,
        };
        if (password.trim()) {
          data.password_hash = password.trim();
        }
        await updateUser(selectedUser.id, data);
      } else {
        // Add mode
        await addUser({
          username: username.trim(),
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          full_name: computedFullName,
          password_hash: password.trim(),
          role,
          active: true,
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the user account.');
    }
  };

  const toggleUserActiveStatus = async (user: User) => {
    if (user.id === currentLoggedUser?.id) {
      alert("You cannot disable your own administrator account.");
      return;
    }
    await updateUser(user.id, { active: !user.active });
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500">Configure administrative and security guard login credentials.</p>
        </div>
        <Button onClick={() => openFormModal(null)} className="shadow-md">
          <Plus className="h-4 w-4" />
          Create User Account
        </Button>
      </div>

      {/* Main Users Table */}
      <Table headers={['Username', 'Full Name', 'Role', 'Status', 'Actions']}>
        {users.length > 0 ? (
          users.map((user) => (
            <TableRow key={user.id}>
              {/* Username */}
              <TableCell className="font-semibold text-slate-805">
                {user.username}
              </TableCell>

              {/* Full Name */}
              <TableCell className="font-bold text-slate-700">
                {user.full_name}
              </TableCell>

              {/* Role */}
              <TableCell className="text-xs">
                <Badge variant={user.role === 'admin' ? 'emerald' : 'info'}>
                  {user.role === 'admin' ? 'Administrator' : 'Security Guard'}
                </Badge>
              </TableCell>

              {/* Active status */}
              <TableCell>
                <Badge variant={user.active ? 'success' : 'danger'}>
                  {user.active ? 'Active' : 'Disabled'}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    title="Edit Details"
                    onClick={() => openFormModal(user)}
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title={user.active ? 'Disable Account' : 'Enable Account'}
                    onClick={() => toggleUserActiveStatus(user)}
                    disabled={user.id === currentLoggedUser?.id}
                  >
                    <Power className={`h-4 w-4 ${user.active ? 'text-red-500' : 'text-green-500'}`} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-10 text-slate-400">
              No user accounts found.
            </TableCell>
          </TableRow>
        )}
      </Table>

      {/* Register / Edit User Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedUser ? 'Modify User Account' : 'Create User Account'}
        size="sm"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-55 border border-red-200 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. guard_john"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* First Name, Middle Name, Last Name */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Middle Name
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Dela"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Cruz"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password {selectedUser ? '(Leave blank to keep same)' : <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={selectedUser ? 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢' : 'Enter account password'}
              required={!selectedUser}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Role select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'guard')}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="guard">Security Guard</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedUser ? 'Save Account' : 'Register Account'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};


