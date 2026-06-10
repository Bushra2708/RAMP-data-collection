import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, AlertTriangle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import BeneficiaryDetailsModal from './BeneficiaryDetailsModal';
import DashboardModal from './common/DashboardModal';

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

  const [entrepreneurProfile, setEntrepreneurProfile] = useState({
    enterpriseSector: '',
    esdpBatch: '',
  });


  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!personalInfo.fullName || !personalInfo.mobileNumber || !personalInfo.district || !personalInfo.mandal || !personalInfo.village || !personalInfo.address || !personalInfo.shgName) {
      return toast.error('Please fill all required fields marked with *');
    }

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const payload = { personalInfo, entrepreneurProfile };

      const res = await fetch(`${API_BASE}/beneficiary`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Beneficiary registered successfully! Now please complete the details form.');
        if (onSuccess) {
          onSuccess(data.beneficiary.id);
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
    <>
      <DashboardModal
        title="Beneficiary Registration"
        description="Step 1: Create a central profile record in the database. Duplicates will be blocked."
        onClose={onClose}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="registerBeneficiaryForm"
              disabled={loading}
              className="w-full sm:w-auto rounded-xl bg-teal-500 px-4 py-3 text-xs font-bold text-slate-950 transition-colors hover:bg-teal-400 disabled:opacity-60"
            >
              <div className="flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Registering...' : 'Register Beneficiary'}
              </div>
            </button>
          </div>
        }
      >
        {duplicateWarning && (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-rose-100">{duplicateWarning}</p>
                <p className="text-xs text-rose-200/80 mt-1">Please update the existing profile instead of creating duplicates.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewDuplicateId(duplicateId)}
              className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-400"
            >
              Open Profile
            </button>
          </div>
        )}

        <form id="registerBeneficiaryForm" onSubmit={handleRegister} className="space-y-6">
          <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Personal Information</h4>
                <p className="text-xs text-slate-400 mt-1">Core beneficiary details required for registration.</p>
              </div>
              <span className="text-xs text-slate-500">Required fields marked *</span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  value={personalInfo.mobileNumber}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, mobileNumber: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Email ID</label>
                <input
                  type="email"
                  placeholder="e.g. name@email.com"
                  value={personalInfo.emailId}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, emailId: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Gender *</label>
                <select
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Age *</label>
                <input
                  type="number"
                  required
                  min={18}
                  max={100}
                  placeholder="Years"
                  value={personalInfo.age}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Qualification *</label>
                <select
                  value={personalInfo.educationalQualification}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, educationalQualification: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Identity Details</h4>
                <p className="text-xs text-slate-400 mt-1">Aadhaar and PAN information for the beneficiary.</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Aadhaar Number</label>
                <input
                  type="text"
                  pattern="[0-9]{12}"
                  placeholder="12-digit Aadhaar number"
                  value={personalInfo.aadhaarNumber}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, aadhaarNumber: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">PAN Card Number</label>
                <input
                  type="text"
                  placeholder="10-digit PAN alphanumeric"
                  value={personalInfo.panNumber}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, panNumber: e.target.value.toUpperCase() })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-white">Address Details</h4>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">District *</label>
                <select
                  required
                  value={personalInfo.district}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, district: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Select District</option>
                  {masterData.districts.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Mandal *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter mandal"
                  value={personalInfo.mandal}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, mandal: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Village *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter village"
                  value={personalInfo.village}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, village: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Address for Communication *</label>
                <textarea
                  required
                  placeholder="Enter detailed street address"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                  className="mt-2 h-28 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-white">Business Details</h4>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Sector</label>
                <select
                  value={entrepreneurProfile.enterpriseSector}
                  onChange={(e) => setEntrepreneurProfile({ ...entrepreneurProfile, enterpriseSector: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Select Sector</option>
                  {masterData.sectors.map((sector, i) => (
                    <option key={i} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">SHG / Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter SHG / Group Name"
                  value={personalInfo.shgName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, shgName: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">ESDP Batch</label>
                <select
                  value={entrepreneurProfile.esdpBatch}
                  onChange={(e) => setEntrepreneurProfile({ ...entrepreneurProfile, esdpBatch: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Select ESDP Batch</option>
                  {(masterData.esdpBatches || []).map((batch, i) => (
                    <option key={i} value={batch.batchNumber}>{batch.batchName || batch.batchNumber}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Attachments</h4>
                <p className="text-xs text-slate-400 mt-1">Upload supporting documents after beneficiary registration.</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {['Passport Photo', 'Signature', 'Aadhaar', 'PAN', 'Education', 'Passbook'].map((label) => (
                <div
                  key={label}
                  className="min-h-[140px] rounded-xl border-2 border-dashed border-cyan-500/30 bg-slate-950/30 p-5 flex flex-col items-center justify-center gap-3 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-400">Available after profile creation</p>
                </div>
              ))}
            </div>
          </section>
        </form>
      </DashboardModal>

      {viewDuplicateId && (
        <BeneficiaryDetailsModal
          id={viewDuplicateId}
          onClose={() => {
            setViewDuplicateId(null);
            setDuplicateWarning(null);
          }}
        />
      )}
    </>
  );
}
