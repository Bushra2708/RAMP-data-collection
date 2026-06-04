import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Save, AlertTriangle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import BeneficiaryDetailsModal from './BeneficiaryDetailsModal';

export default function RegisterBeneficiaryModal({ onClose, onSuccess }) {
  const { API_BASE, getHeaders, masterData } = useApp();
  const [loading, setLoading] = useState(false);
  
  // Duplicate catch state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateId, setDuplicateId] = useState(null);
  const [viewDuplicateId, setViewDuplicateId] = useState(null);

  // Form Fields State (Module 2 Personal Info only)
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    mobileNumber: '',
    emailId: '',
    gender: 'Male',
    age: '',
    district: '',
    mandal: '',
    village: '',
    address: '',
    shgName: '',
    educationalQualification: 'SSC',
    aadhaarNumber: '',
    panNumber: '',
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!personalInfo.fullName || !personalInfo.mobileNumber || !personalInfo.district || !personalInfo.mandal || !personalInfo.village || !personalInfo.address) {
      return toast.error('Please fill all required fields marked with *');
    }

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const payload = { personalInfo };

      const res = await fetch(`${API_BASE}/beneficiary`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Beneficiary registered successfully! Now please complete the details form.');
        if (onSuccess) {
          onSuccess(data.beneficiary._id);
        } else {
          onClose();
        }
      } else if (data.duplicateField) {
        setDuplicateWarning(data.message);
        setDuplicateId(data.existingId);
        setViewDuplicateId(data.existingId);
        toast.error('Registration Blocked: Profile already exists.');
      } else {
        toast.error(data.message || 'Error creating profile.');
      }
    } catch (err) {
      toast.error('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fade-in animate-slide-in">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-teal-400" /> Beneficiary Registration
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Step 1: Create a central profile record in the database. Duplicates will be blocked.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-lg border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/10 cursor-pointer transition-all" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error/Duplicate Warnings Banner */}
        {duplicateWarning && (
          <div className="m-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slide-in">
            <div className="flex gap-2.5 items-start">
              <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-rose-300 font-medium">{duplicateWarning}</p>
                <p className="text-[10px] text-rose-400/80 mt-0.5">Please update the existing profile instead of creating duplicates.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewDuplicateId(duplicateId)}
              className="py-1.5 px-3 bg-rose-500 text-white hover:bg-rose-400 text-xs font-bold rounded-lg cursor-pointer"
            >
              Open Profile
            </button>
          </div>
        )}

        {/* Form area */}
        <form onSubmit={handleRegister} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                placeholder="10-digit mobile number"
                value={personalInfo.mobileNumber}
                onChange={(e) => setPersonalInfo({ ...personalInfo, mobileNumber: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Aadhaar Card Number</label>
              <input
                type="text"
                pattern="[0-9]{12}"
                placeholder="12-digit Aadhaar number"
                value={personalInfo.aadhaarNumber}
                onChange={(e) => setPersonalInfo({ ...personalInfo, aadhaarNumber: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">PAN Card Number</label>
              <input
                type="text"
                placeholder="10-digit PAN alphanumeric"
                value={personalInfo.panNumber}
                onChange={(e) => setPersonalInfo({ ...personalInfo, panNumber: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email ID</label>
              <input
                type="email"
                placeholder="e.g. name@email.com"
                value={personalInfo.emailId}
                onChange={(e) => setPersonalInfo({ ...personalInfo, emailId: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Gender *</label>
                <select
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min={18}
                  max={100}
                  placeholder="Years"
                  value={personalInfo.age}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">District *</label>
              <select
                required
                value={personalInfo.district}
                onChange={(e) => setPersonalInfo({ ...personalInfo, district: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="">Select District</option>
                {masterData.districts.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Mandal *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter mandal"
                  value={personalInfo.mandal}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, mandal: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Village *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter village"
                  value={personalInfo.village}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, village: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">SHG Name (If applicable)</label>
              <input
                type="text"
                placeholder="Enter SHG/Group Name"
                value={personalInfo.shgName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, shgName: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Educational Qualification *</label>
              <select
                value={personalInfo.educationalQualification}
                onChange={(e) => setPersonalInfo({ ...personalInfo, educationalQualification: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="Illiterate">Illiterate</option>
                <option value="Below SSC">Below SSC</option>
                <option value="SSC">SSC / 10th Standard</option>
                <option value="Intermediate">Intermediate / 12th Standard</option>
                <option value="Diploma">Diploma / ITI</option>
                <option value="Graduate">Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Address for Communication *</label>
              <textarea
                required
                placeholder="Enter detailed street address"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 h-20"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> {loading ? 'Registering...' : 'Register Beneficiary'}
            </button>
          </div>
        </form>
      </div>

      {/* Render details overlay of duplicate directly if user wants to see it */}
      {viewDuplicateId && (
        <BeneficiaryDetailsModal
          id={viewDuplicateId}
          onClose={() => {
            setViewDuplicateId(null);
            setDuplicateWarning(null);
          }}
        />
      )}
    </div>
  );
}
