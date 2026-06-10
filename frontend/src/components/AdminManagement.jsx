import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield, 
  UserPlus, 
  Search, 
  Edit2, 
  KeyRound, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  ShieldAlert 
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardModal from './common/DashboardModal';

export default function AdminManagement() {
  const { API_BASE, getHeaders, user } = useApp();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

  // Reset password results
  const [resetResult, setResetResult] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    role: 'Manager',
    password: '',
    confirmPassword: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    email: '',
    role: 'Admin',
    status: 'Active'
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admins`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins);
      } else {
        toast.error(data.message || 'Failed to load administrators.');
      }
    } catch (err) {
      toast.error('Network error loading administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!addForm.fullName.trim() || !addForm.email || !addForm.password) {
      return toast.error('Please fill in all fields.');
    }
    if (addForm.password.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }
    if (addForm.password !== addForm.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    try {
      const res = await fetch(`${API_BASE}/auth/admin/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: addForm.fullName,
          email: addForm.email,
          role: addForm.role,
          password: addForm.password
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Admin account created successfully.');
        setShowAddModal(false);
        setAddForm({
          fullName: '',
          email: '',
          role: 'Manager',
          password: '',
          confirmPassword: ''
        });
        fetchAdmins();
      } else {
        toast.error(data.message || 'Admin creation failed.');
      }
    } catch (err) {
      toast.error('Unable to connect to the backend server.');
    }
  };

  const handleEditClick = (adminUser) => {
    setEditForm({
      id: adminUser.id,
      fullName: adminUser.fullName,
      email: adminUser.email,
      role: adminUser.role || 'Admin',
      status: adminUser.status || 'Active'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.email) {
      return toast.error('Please fill in all required fields.');
    }

    try {
      const res = await fetch(`${API_BASE}/auth/admins/${editForm.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          status: editForm.status
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Administrator details updated.');
        setShowEditModal(false);
        fetchAdmins();
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error('Network error updating details.');
    }
  };

  const handleToggleStatus = async (adminUser) => {
    const newStatus = adminUser.status === 'Active' ? 'Inactive' : 'Active';
    
    // Safety check: Cannot deactivate the logged-in admin user
    if (adminUser.id === user.id && newStatus === 'Inactive') {
      return toast.error('Self-deactivation is disabled for safety.');
    }

    if (!window.confirm(`Are you sure you want to make ${adminUser.fullName} ${newStatus}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/auth/admins/${adminUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Admin account status set to ${newStatus}.`);
        fetchAdmins();
      } else {
        toast.error(data.message || 'Operation failed.');
      }
    } catch (err) {
      toast.error('Network error updating admin status.');
    }
  };

  const handleResetPassword = async (adminUser) => {
    if (!window.confirm(`Are you sure you want to reset password for administrator ${adminUser.fullName}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/auth/admins/${adminUser.id}/reset-password`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setResetResult({
          name: adminUser.fullName,
          tempPassword: data.tempPassword
        });
        setShowResetSuccessModal(true);
        toast.success('Admin password reset successfully.');
      } else {
        toast.error(data.message || 'Reset failed.');
      }
    } catch (err) {
      toast.error('Network error performing password reset.');
    }
  };

  // Filter admins
  const filteredAdmins = admins.filter(a => {
    const query = searchQuery.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(query) || 
      a.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 border border-white/5 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" /> Admin Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrative credentials, system control profiles, and status blocks.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Add Administrator
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table List of Admins */}
      <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {loading && admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <span className="text-xs">Loading administrators...</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No administrator matches the query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400 font-semibold">
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredAdmins.map((a) => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">{a.fullName}</td>
                    <td className="p-4 font-mono">{a.email}</td>
                    <td className="p-4 text-slate-400">{a.role || 'Admin'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (a.status || 'Active') === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${(a.status || 'Active') === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {a.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(a)}
                          className="p-1.5 text-slate-400 hover:text-teal-400 rounded hover:bg-teal-500/10 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(a)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-amber-500/10 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {a.id !== user.id && (
                          <button
                            onClick={() => handleToggleStatus(a)}
                            className={`p-1.5 rounded transition-colors ${
                              (a.status || 'Active') === 'Active'
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={(a.status || 'Active') === 'Active' ? 'Deactivate Admin' : 'Activate Admin'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD ADMIN MODAL */}
      {showAddModal && (
        <DashboardModal title="Register Admin Account" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddSubmit} className="p-2 sm:p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="Enter admin email address"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Authority *</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={addForm.confirmPassword}
                  onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Register Admin
                </button>
              </div>
            </form>
        </DashboardModal>
      )}

      {/* EDIT ADMIN MODAL */}
      {showEditModal && (
        <DashboardModal title="Edit Admin Profile" onClose={() => setShowEditModal(false)}>
            <form onSubmit={handleEditSubmit} className="p-2 sm:p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Authority</label>
                <input
                  type="text"
                  value={editForm.role}
                  disabled
                  className="w-full bg-slate-950/60 border border-white/5 rounded-lg p-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
                <p className="text-[9px] text-slate-500 mt-1">Authority is locked after account creation.</p>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  disabled={editForm.id === user.id}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {editForm.id === user.id && (
                  <p className="text-[9px] text-slate-500 mt-1">Self status locking prevents self-deactivation.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
        </DashboardModal>
      )}

      {/* PASSWORD RESET SUCCESS MODAL */}
      {showResetSuccessModal && resetResult && (
        <DashboardModal title="Temporary Password Generated" onClose={() => { setShowResetSuccessModal(false); setResetResult(null); }}>
          <div className="mx-auto max-w-md p-2 sm:p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-full mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Temporary Password Generated</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Password for administrator <strong>{resetResult.name}</strong> has been reset. Please copy the temporary password below:
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 border border-white/10 rounded-xl font-mono text-base font-bold text-teal-400 tracking-wider select-all cursor-pointer">
              {resetResult.tempPassword}
            </div>

            <p className="text-[9px] text-slate-500">
              Note: Provide this temporary password to the administrator. They should log in and update their credentials immediately.
            </p>

            <button
              onClick={() => {
                setShowResetSuccessModal(false);
                setResetResult(null);
              }}
              className="py-2 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors w-full"
            >
              Done
            </button>
          </div>
        </DashboardModal>
      )}
    </div>
  );
}
