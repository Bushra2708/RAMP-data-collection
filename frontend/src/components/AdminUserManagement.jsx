import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  KeyRound, 
  Trash2, 
  Check, 
  X, 
  Plus, 
  Loader2, 
  ShieldAlert 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUserManagement() {
  const { API_BASE, getHeaders, masterData } = useApp();
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);

  // Reset password results
  const [resetResult, setResetResult] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    district: '',
    password: '',
    confirmPassword: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    mobileNumber: '',
    email: '',
    district: '',
    status: 'Active',
    password: ''
  });

  const fetchCounsellors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/counsellors`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setCounsellors(data.counsellors);
      } else {
        toast.error(data.message || 'Failed to load counsellors list.');
      }
    } catch (err) {
      toast.error('Network error loading counsellors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounsellors();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!addForm.fullName.trim() || !addForm.mobileNumber || !addForm.password || !addForm.district) {
      return toast.error('Please fill in all required fields.');
    }
    if (addForm.mobileNumber.length !== 10 || isNaN(addForm.mobileNumber)) {
      return toast.error('Mobile number must be exactly 10 digits.');
    }
    if (addForm.password.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }
    if (addForm.password !== addForm.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    try {
      const res = await fetch(`${API_BASE}/auth/counsellor/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName: addForm.fullName,
          mobileNumber: addForm.mobileNumber,
          email: addForm.email || undefined,
          password: addForm.password,
          district: addForm.district
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Counsellor account created successfully.');
        setShowAddModal(false);
        setAddForm({
          fullName: '',
          mobileNumber: '',
          email: '',
          district: '',
          password: '',
          confirmPassword: ''
        });
        fetchCounsellors();
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error('Unable to connect to the backend server.');
    }
  };

  const handleEditClick = (counsellor) => {
    setEditForm({
      id: counsellor.id,
      fullName: counsellor.fullName,
      mobileNumber: counsellor.mobileNumber,
      email: counsellor.email || '',
      district: counsellor.district,
      status: counsellor.status,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.district) {
      return toast.error('Please fill in all required fields.');
    }
    if (editForm.password && editForm.password.length < 8) {
      return toast.error('Password must be at least 8 characters long.');
    }

    try {
      const payload = {
        fullName: editForm.fullName,
        district: editForm.district,
        status: editForm.status
      };
      if (editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }

      const res = await fetch(`${API_BASE}/auth/counsellors/${editForm.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Counsellor details updated.');
        setShowEditModal(false);
        fetchCounsellors();
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error('Network error updating details.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this counsellor? Inactive counsellors cannot log in.')) return;
    try {
      const res = await fetch(`${API_BASE}/auth/counsellors/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Counsellor deactivated successfully.');
        fetchCounsellors();
      } else {
        toast.error(data.message || 'Operation failed.');
      }
    } catch (err) {
      toast.error('Network error during deactivation.');
    }
  };

  const handleResetPassword = async (counsellor) => {
    if (!window.confirm(`Are you sure you want to reset password for ${counsellor.fullName}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/auth/counsellors/${counsellor.id}/reset-password`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setResetResult({
          name: counsellor.fullName,
          tempPassword: data.tempPassword
        });
        setShowResetSuccessModal(true);
        toast.success('Password reset successfully.');
      } else {
        toast.error(data.message || 'Password reset failed.');
      }
    } catch (err) {
      toast.error('Network error performing password reset.');
    }
  };

  const districtsList = masterData.districts && masterData.districts.length > 0
    ? masterData.districts
    : ['Hyderabad', 'Warangal', 'Medchal-Malkajgiri', 'Rangareddy', 'Karimnagar'];

  // Filter counsellors based on query & district
  const filteredCounsellors = counsellors.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      c.fullName.toLowerCase().includes(query) || 
      c.mobileNumber.includes(query) || 
      (c.email && c.email.toLowerCase().includes(query));
    
    const matchesDistrict = selectedDistrict === '' || c.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 sm:p-5 border border-white/5 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" /> User Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create, manage details, and activate/deactivate field counsellor accounts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Create Counsellor
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="min-w-[180px]">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Districts</option>
            {districtsList.map((d, i) => (
              <option key={i} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List of Counsellors */}
      <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {loading && counsellors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <span className="text-xs">Loading counsellors...</span>
          </div>
        ) : filteredCounsellors.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No counsellors match the search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400 font-semibold">
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Mobile Number</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredCounsellors.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">{c.fullName}</td>
                    <td className="p-4 font-mono">{c.mobileNumber}</td>
                    <td className="p-4 max-w-[180px] truncate">{c.email || <span className="text-slate-600">—</span>}</td>
                    <td className="p-4">{c.district}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 text-slate-400 hover:text-teal-400 rounded hover:bg-teal-500/10 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(c)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-amber-500/10 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {c.status === 'Active' && (
                          <button
                            onClick={() => handleDeactivate(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                            title="Deactivate Counsellor"
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

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-slate-955 p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-400" /> Create Counsellor Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Mobile Number (Login ID) *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="Enter 10-digit mobile number"
                    value={addForm.mobileNumber}
                    onChange={(e) => setAddForm({ ...addForm, mobileNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Assigned District *</label>
                  <select
                    required
                    value={addForm.district}
                    onChange={(e) => setAddForm({ ...addForm, district: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select District</option>
                    {districtsList.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="bg-slate-955 p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-400" /> Edit Counsellor Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Mobile Number (Read-only)</label>
                  <input
                    type="text"
                    disabled
                    value={editForm.mobileNumber}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-lg p-2.5 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Assigned District *</label>
                  <select
                    required
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    {districtsList.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Enter new password to override"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
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
          </div>
        </div>
      )}

      {/* PASSWORD RESET SUCCESS MODAL */}
      {showResetSuccessModal && resetResult && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center rounded-full mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Temporary Password Generated</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Password for <strong>{resetResult.name}</strong> has been reset. Please copy the temporary password below:
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 border border-white/10 rounded-xl font-mono text-base font-bold text-teal-400 tracking-wider select-all cursor-pointer">
              {resetResult.tempPassword}
            </div>

            <p className="text-[9px] text-slate-500">
              Note: Provide this temporary password to the counsellor. They should log in and update their password immediately.
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
        </div>
      )}
    </div>
  );
}
