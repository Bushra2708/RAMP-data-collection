import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Briefcase,
  GraduationCap,
  History,
  FolderOpen,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Upload,
  CheckCircle,
  Clock,
  Check,
  ChevronRight,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

const FileSlotUpload = ({ label, slotKey, beneficiaryId, files, API_BASE, getHeaders, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'Registration Documents');
    formData.append('documentName', label);
    formData.append('fileSlot', slotKey);

    try {
      const res = await fetch(`${API_BASE}/beneficiary/${beneficiaryId}/upload`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${label} attached successfully.`);
        onUploadSuccess(data.beneficiary);
      } else {
        toast.error(data.message || 'Upload failed.');
      }
    } catch (err) {
      toast.error('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  const fileData = files?.[slotKey];

  return (
    <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 flex flex-col justify-between gap-2">
      <div className="flex justify-between items-start">
        <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{label}</span>
        {fileData?.path && (
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Attached</span>
        )}
      </div>
      
      {fileData?.path ? (
        <div className="flex items-center justify-between gap-2 mt-1">
          <a
            href={fileData.path.startsWith('http') ? fileData.path : `http://localhost:5000${fileData.path}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-teal-400 hover:underline truncate max-w-[150px]"
            title="Click to view file"
          >
            View File
          </a>
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="text-[10px] text-slate-400 hover:text-white border border-white/10 px-2 py-1 rounded bg-slate-900 cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Replace'}
          </button>
        </div>
      ) : (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="w-full text-center py-2 border border-dashed border-white/10 hover:border-teal-500/50 rounded text-xs text-slate-400 hover:text-teal-400 transition-colors bg-slate-950/50 cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Attach Image/File'}
          </button>
        </div>
      )}
      <input
        type="file"
        ref={fileRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
      />
    </div>
  );
};

export default function BeneficiaryDetailsModal({ id, onClose }) {
  const { API_BASE, getHeaders, user, masterData } = useApp();
  const [beneficiary, setBeneficiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  // Activity Log State
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    supportCategory: '',
    description: '',
    status: 'Not Started',
    remarks: '',
    nextFollowUpDate: '',
  });

  // Document Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [docCategory, setDocCategory] = useState('Personal Documents');
  const [docName, setDocName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Edit details toggle
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/beneficiary/${id}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const b = data.beneficiary;
        // Ensure all nested schemas are initialized as objects to prevent binding crashes
        b.personalInfo = b.personalInfo || {};
        b.esdpTraining = b.esdpTraining || {};
        b.entrepreneurProfile = b.entrepreneurProfile || {};
        b.dprTracking = b.dprTracking || { dprPrepared: 'No' };
        b.loanTracking = b.loanTracking || { loanApplied: 'No' };
        b.compliance = b.compliance || {};
        b.marketAccess = b.marketAccess || { eCommercePlatforms: {} };
        b.marketAccess.eCommercePlatforms = b.marketAccess.eCommercePlatforms || {};
        b.certifications = b.certifications || {};
        b.files = b.files || {};

        setBeneficiary(b);
        setEditData(JSON.parse(JSON.stringify(b))); // Deep clone for safe inputs binding
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBatchChange = (batchNo) => {
    if (!batchNo) {
      setEditData({
        ...editData,
        esdpTraining: {
          batchNumber: '',
          batchName: '',
          district: '',
          trainingVenue: '',
          trainingCompleted: 'No',
          certificateIssued: 'No',
        }
      });
      return;
    }
    const selectedBatch = masterData.esdpBatches.find(b => b.batchNumber === batchNo);
    if (selectedBatch) {
      setEditData({
        ...editData,
        esdpTraining: {
          ...editData.esdpTraining,
          batchNumber: selectedBatch.batchNumber,
          batchName: selectedBatch.batchName,
          district: selectedBatch.district,
          trainingVenue: selectedBatch.venue,
          startDate: selectedBatch.startDate,
          endDate: selectedBatch.endDate,
          trainingCompleted: 'Yes',
          certificateIssued: 'Yes',
        }
      });
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/beneficiary/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully.');
        setBeneficiary(data.beneficiary);
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Log Handholding support
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.supportCategory || !newActivity.description) {
      return toast.error('Please fill category and description.');
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/beneficiary/${id}/activity`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newActivity),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Handholding support logged.');
        setBeneficiary(data.beneficiary);
        setShowActivityForm(false);
        setNewActivity({
          supportCategory: '',
          description: '',
          status: 'Not Started',
          remarks: '',
          nextFollowUpDate: '',
        });
      }
    } catch (err) {
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Upload Document
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!selectedFile || !docName || !docCategory) {
      return toast.error('Please select a file and enter details.');
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', docCategory);
      formData.append('documentName', docName);

      const res = await fetch(`${API_BASE}/beneficiary/${id}/upload`, {
        method: 'POST',
        headers: getHeaders(true), // Multipart headers (no content-type)
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Document uploaded.');
        setBeneficiary(data.beneficiary);
        setSelectedFile(null);
        setDocName('');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document (Admin Only)
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API_BASE}/beneficiary/${id}/document/${docId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Document deleted successfully.');
        setBeneficiary(data.beneficiary);
      }
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  if (loading && !beneficiary) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-6 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-2"></div>
          <span className="text-xs text-slate-400">Loading Beneficiary Profile...</span>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'training', label: 'ESDP Training', icon: GraduationCap },
    { id: 'enterprise', label: 'Enterprise Profile', icon: Briefcase },
    { id: 'handholding', label: 'Handholding Tracker', icon: Clock },
    { id: 'documents', label: 'Compliance & Documents', icon: FolderOpen },
    { id: 'timeline', label: 'Timeline', icon: History },
  ];

  const activeTabClass = 'border-teal-500 text-teal-400 bg-teal-500/5';
  const inactiveTabClass = 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5';

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Section */}
        <div className="p-5 border-b border-white/5 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{beneficiary.personalInfo?.fullName}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400">
                {beneficiary.beneficiaryId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mobile: {beneficiary.personalInfo?.mobileNumber} | Location: {beneficiary.personalInfo?.village}, {beneficiary.personalInfo?.district}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-all"
              >
                Edit Profile Details
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer flex items-center gap-1 border border-white/15 px-2 bg-slate-950/40"
              title="Close Panel"
            >
              <span className="text-xs font-semibold">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Horizontal Tabs */}
        <div className="flex border-b border-white/5 overflow-x-auto bg-slate-950/20 no-print">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }}
                className={`py-3.5 px-5 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id ? activeTabClass : inactiveTabClass
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-grow overflow-y-auto p-6">
          
          {/* EDIT PROFILE VIEW */}
          {isEditing && (
            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fade-in pb-12">
              
              {/* 1. Personal & Contact details */}
              <div className="bg-slate-950/20 p-4 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">1. Personal & Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editData.personalInfo.fullName || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, fullName: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={editData.personalInfo.mobileNumber || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, mobileNumber: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Email ID</label>
                    <input
                      type="email"
                      value={editData.personalInfo.emailId || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, emailId: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Gender</label>
                    <select
                      value={editData.personalInfo.gender || 'Male'}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, gender: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Age</label>
                    <input
                      type="number"
                      value={editData.personalInfo.age || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, age: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Qualification</label>
                    <select
                      value={editData.personalInfo.educationalQualification || 'SSC'}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, educationalQualification: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
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
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Aadhaar Card</label>
                    <input
                      type="text"
                      pattern="[0-9]{12}"
                      value={editData.personalInfo.aadhaarNumber || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, aadhaarNumber: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">PAN Card</label>
                    <input
                      type="text"
                      value={editData.personalInfo.panNumber || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, panNumber: e.target.value.toUpperCase() }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">SHG Name</label>
                    <input
                      type="text"
                      value={editData.personalInfo.shgName || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, shgName: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">District *</label>
                    <select
                      value={editData.personalInfo.district || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, district: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="">Select District</option>
                      {masterData.districts.map((d, i) => (
                        <option key={i} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Mandal *</label>
                    <input
                      type="text"
                      value={editData.personalInfo.mandal || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, mandal: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Village *</label>
                    <input
                      type="text"
                      value={editData.personalInfo.village || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, village: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">Communication Address *</label>
                    <textarea
                      value={editData.personalInfo.address || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        personalInfo: { ...editData.personalInfo, address: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white h-12"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ESDP details */}
              <div className="bg-slate-950/20 p-4 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">2. ESDP Training Batch</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Assign ESDP Batch Course</label>
                    <select
                      value={editData.esdpTraining?.batchNumber || ''}
                      onChange={(e) => handleEditBatchChange(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="">No Batch Allocation</option>
                      {masterData.esdpBatches.map((b, i) => (
                        <option key={i} value={b.batchNumber}>{b.batchName} ({b.batchNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Training Completed?</label>
                    <select
                      value={editData.esdpTraining?.trainingCompleted || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        esdpTraining: { ...editData.esdpTraining, trainingCompleted: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Skill Before Training</label>
                    <input
                      type="text"
                      value={editData.esdpTraining?.skillBeforeTraining || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        esdpTraining: { ...editData.esdpTraining, skillBeforeTraining: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                      placeholder="e.g. None"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Skill After Training</label>
                    <input
                      type="text"
                      value={editData.esdpTraining?.skillAfterTraining || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        esdpTraining: { ...editData.esdpTraining, skillAfterTraining: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                      placeholder="e.g. Tailoring Skill"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Entrepreneur details */}
              <div className="bg-slate-950/20 p-4 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">3. Entrepreneur & Enterprise details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Existing Entrepreneur?</label>
                    <select
                      value={editData.entrepreneurProfile.existingEntrepreneur || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        entrepreneurProfile: { ...editData.entrepreneurProfile, existingEntrepreneur: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Interested in New Business?</label>
                    <select
                      value={editData.entrepreneurProfile.interestedInNewBusiness || 'Yes'}
                      onChange={(e) => setEditData({
                        ...editData,
                        entrepreneurProfile: { ...editData.entrepreneurProfile, interestedInNewBusiness: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Interested in Expansion?</label>
                    <select
                      value={editData.entrepreneurProfile.interestedInBusinessExpansion || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        entrepreneurProfile: { ...editData.entrepreneurProfile, interestedInBusinessExpansion: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {editData.entrepreneurProfile.existingEntrepreneur === 'Yes' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">Enterprise Name</label>
                        <input
                          type="text"
                          value={editData.entrepreneurProfile.enterpriseName || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            entrepreneurProfile: { ...editData.entrepreneurProfile, enterpriseName: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Sector</label>
                        <select
                          value={editData.entrepreneurProfile.enterpriseSector || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            entrepreneurProfile: { ...editData.entrepreneurProfile, enterpriseSector: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                        >
                          <option value="">Select Sector</option>
                          {masterData.sectors.map((s, i) => (
                            <option key={i} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Constitution Type</label>
                        <select
                          value={editData.entrepreneurProfile.enterpriseType || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            entrepreneurProfile: { ...editData.entrepreneurProfile, enterpriseType: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                        >
                          <option value="">Select Constitution</option>
                          <option value="Proprietorship">Proprietorship</option>
                          <option value="Partnership">Partnership</option>
                          <option value="LLP">LLP</option>
                          <option value="Private Limited">Private Limited</option>
                          <option value="Franchise">Franchise</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Business Status</label>
                        <select
                          value={editData.entrepreneurProfile.businessStatus || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            entrepreneurProfile: { ...editData.entrepreneurProfile, businessStatus: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Product Details</label>
                        <input
                          type="text"
                          placeholder="e.g. Spices, Garments"
                          value={editData.entrepreneurProfile.productDetails || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            entrepreneurProfile: { ...editData.entrepreneurProfile, productDetails: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-1">Business Unit Address</label>
                        <textarea
                          value={editData.entrepreneurProfile.businessAddress || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            entrepreneurProfile: { ...editData.entrepreneurProfile, businessAddress: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white h-12"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4. DPR & Loans */}
              <div className="bg-slate-950/20 p-4 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">4. DPR & Loan / Finance Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">DPR Prepared?</label>
                    <select
                      value={editData.dprTracking?.dprPrepared || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        dprTracking: { ...editData.dprTracking, dprPrepared: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">DPR Submission Date</label>
                    <input
                      type="date"
                      value={editData.dprTracking?.dprSubmissionDate ? new Date(editData.dprTracking.dprSubmissionDate).toISOString().slice(0,10) : ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        dprTracking: { ...editData.dprTracking, dprSubmissionDate: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">DPR Status</label>
                    <select
                      value={editData.dprTracking?.dprStatus || 'N/A'}
                      onChange={(e) => setEditData({
                        ...editData,
                        dprTracking: { ...editData.dprTracking, dprStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="N/A">N/A</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">DPR Remarks</label>
                    <input
                      type="text"
                      value={editData.dprTracking?.remarks || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        dprTracking: { ...editData.dprTracking, remarks: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <h5 className="sm:col-span-3 text-xs font-semibold text-slate-400 border-t border-white/5 pt-3 mt-1">Loan Information</h5>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Loan Applied?</label>
                    <select
                      value={editData.loanTracking?.loanApplied || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        loanTracking: { ...editData.loanTracking, loanApplied: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Loan Scheme</label>
                    <input
                      type="text"
                      placeholder="e.g. PMEGP"
                      value={editData.loanTracking?.loanScheme || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        loanTracking: { ...editData.loanTracking, loanScheme: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Requested Amount (₹)</label>
                    <input
                      type="number"
                      value={editData.loanTracking?.loanAmountRequested || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        loanTracking: { ...editData.loanTracking, loanAmountRequested: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Sanctioned Amount (₹)</label>
                    <input
                      type="number"
                      value={editData.loanTracking?.loanAmountSanctioned || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        loanTracking: { ...editData.loanTracking, loanAmountSanctioned: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Sanction Date</label>
                    <input
                      type="date"
                      value={editData.loanTracking?.sanctionDate ? new Date(editData.loanTracking.sanctionDate).toISOString().slice(0,10) : ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        loanTracking: { ...editData.loanTracking, sanctionDate: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Release Date</label>
                    <input
                      type="date"
                      value={editData.loanTracking?.releaseDate ? new Date(editData.loanTracking.releaseDate).toISOString().slice(0,10) : ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        loanTracking: { ...editData.loanTracking, releaseDate: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Compliance & Market Access */}
              <div className="bg-slate-950/20 p-4 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">5. Business Compliance & Market Channels</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={editData.compliance?.gstNumber || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        compliance: { ...editData.compliance, gstNumber: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Dedicated Business Premises?</label>
                    <select
                      value={editData.compliance?.dedicatedBusinessPremises || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        compliance: { ...editData.compliance, dedicatedBusinessPremises: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Supply Orders Available?</label>
                    <select
                      value={editData.compliance?.supplyOrdersAvailable || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        compliance: { ...editData.compliance, supplyOrdersAvailable: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <h5 className="sm:col-span-3 text-xs font-semibold text-slate-400 border-t border-white/5 pt-3 mt-1">E-Commerce & Portals</h5>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">ONDC Registered?</label>
                    <select
                      value={editData.marketAccess?.ondcRegistered || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, ondcRegistered: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">ONDC Transaction Details</label>
                    <input
                      type="text"
                      value={editData.marketAccess?.ondcTransactionDetails || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, ondcTransactionDetails: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">GeM Registered?</label>
                    <select
                      value={editData.marketAccess?.gemRegistered || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, gemRegistered: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">GeM Transaction Details</label>
                    <input
                      type="text"
                      value={editData.marketAccess?.gemTransactionDetails || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, gemTransactionDetails: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-3 bg-slate-950/40 p-3 rounded-lg border border-white/5 my-1">
                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">Platform Listings</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.marketAccess?.eCommercePlatforms?.amazon || false}
                          onChange={(e) => setEditData({
                            ...editData,
                            marketAccess: {
                              ...editData.marketAccess,
                              eCommercePlatforms: {
                                ...editData.marketAccess.eCommercePlatforms,
                                amazon: e.target.checked
                              }
                            }
                          })}
                          className="rounded border-white/10 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
                        /> Amazon
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.marketAccess?.eCommercePlatforms?.flipkart || false}
                          onChange={(e) => setEditData({
                            ...editData,
                            marketAccess: {
                              ...editData.marketAccess,
                              eCommercePlatforms: {
                                ...editData.marketAccess.eCommercePlatforms,
                                flipkart: e.target.checked
                              }
                            }
                          })}
                          className="rounded border-white/10 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
                        /> Flipkart
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.marketAccess?.eCommercePlatforms?.meesho || false}
                          onChange={(e) => setEditData({
                            ...editData,
                            marketAccess: {
                              ...editData.marketAccess,
                              eCommercePlatforms: {
                                ...editData.marketAccess.eCommercePlatforms,
                                meesho: e.target.checked
                              }
                            }
                          })}
                          className="rounded border-white/10 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
                        /> Meesho
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Brand Promotion Support?</label>
                    <select
                      value={editData.marketAccess?.brandPromotionSupportAvailed || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, brandPromotionSupportAvailed: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Market Support?</label>
                    <select
                      value={editData.marketAccess?.marketSupportAvailed || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, marketSupportAvailed: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Raw Material Support?</label>
                    <select
                      value={editData.marketAccess?.rawMaterialSupportAvailed || 'No'}
                      onChange={(e) => setEditData({
                        ...editData,
                        marketAccess: { ...editData.marketAccess, rawMaterialSupportAvailed: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 6. Certifications */}
              <div className="bg-slate-950/20 p-4 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">6. Quality Certifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">ZED Status</label>
                    <select
                      value={editData.certifications?.zedStatus || 'Not Applied'}
                      onChange={(e) => setEditData({
                        ...editData,
                        certifications: { ...editData.certifications, zedStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Not Applied">Not Applied</option>
                      <option value="Applied">Applied</option>
                      <option value="Certified">Certified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">LEAN Status</label>
                    <select
                      value={editData.certifications?.leanStatus || 'Not Applied'}
                      onChange={(e) => setEditData({
                        ...editData,
                        certifications: { ...editData.certifications, leanStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Not Applied">Not Applied</option>
                      <option value="Applied">Applied</option>
                      <option value="Certified">Certified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Trademark Status</label>
                    <select
                      value={editData.certifications?.trademarkStatus || 'Not Applied'}
                      onChange={(e) => setEditData({
                        ...editData,
                        certifications: { ...editData.certifications, trademarkStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Not Applied">Not Applied</option>
                      <option value="Applied">Applied</option>
                      <option value="Registered">Registered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Barcode Status</label>
                    <select
                      value={editData.certifications?.barcodeStatus || 'Not Applied'}
                      onChange={(e) => setEditData({
                        ...editData,
                        certifications: { ...editData.certifications, barcodeStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Not Applied">Not Applied</option>
                      <option value="Applied">Applied</option>
                      <option value="Registered">Registered</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">FSSAI Status</label>
                    <select
                      value={editData.certifications?.fssaiStatus || 'Not Applied'}
                      onChange={(e) => setEditData({
                        ...editData,
                        certifications: { ...editData.certifications, fssaiStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Not Applied">Not Applied</option>
                      <option value="Applied">Applied</option>
                      <option value="Licensed">Licensed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Trade License Status</label>
                    <select
                      value={editData.certifications?.tradeLicenseStatus || 'Not Applied'}
                      onChange={(e) => setEditData({
                        ...editData,
                        certifications: { ...editData.certifications, tradeLicenseStatus: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300"
                    >
                      <option value="Not Applied">Not Applied</option>
                      <option value="Applied">Applied</option>
                      <option value="Licensed">Licensed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-white/5 no-print">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Save Profile Updates
                </button>
              </div>
            </form>
          )}

          {/* ACTIVE TAB: PERSONAL INFO */}
          {!isEditing && activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Demographics</h4>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Gender & Age</span>
                  <p className="text-xs text-slate-200 mt-0.5">{beneficiary.personalInfo?.gender}, {beneficiary.personalInfo?.age} years</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Educational Qualification</span>
                  <p className="text-xs text-slate-200 mt-0.5">{beneficiary.personalInfo?.educationalQualification}</p>
                </div>
                {beneficiary.personalInfo?.shgName && (
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">SHG Group Name</span>
                    <p className="text-xs text-teal-300 font-semibold mt-0.5">{beneficiary.personalInfo?.shgName}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Verification Cards</h4>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Aadhaar Card Number</span>
                  <p className="text-xs text-slate-200 font-mono mt-0.5">{beneficiary.personalInfo?.aadhaarNumber || 'Not Captured'}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">PAN Card Number</span>
                  <p className="text-xs text-slate-200 font-mono mt-0.5">{beneficiary.personalInfo?.panNumber || 'Not Captured'}</p>
                </div>
                {beneficiary.personalInfo?.emailId && (
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Email Address</span>
                    <p className="text-xs text-slate-200 mt-0.5">{beneficiary.personalInfo?.emailId}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5 space-y-3 sm:col-span-2 md:col-span-1">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Address details</h4>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">District & Mandal</span>
                  <p className="text-xs text-slate-200 mt-0.5">{beneficiary.personalInfo?.district} / {beneficiary.personalInfo?.mandal}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Village</span>
                  <p className="text-xs text-slate-200 mt-0.5">{beneficiary.personalInfo?.village}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Street Address</span>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{beneficiary.personalInfo?.address}</p>
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-3 border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">Required Attachments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <FileSlotUpload
                    label="Passport Size Photo"
                    slotKey="passportPhoto"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Signature"
                    slotKey="signature"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Education Certificate"
                    slotKey="educationCertificate"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Aadhar Card File"
                    slotKey="aadharCard"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="PAN Card File"
                    slotKey="panCard"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Front page of Pass book"
                    slotKey="passbookFrontPage"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Cancelled Cheque"
                    slotKey="cancelledCheque"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: TRAINING */}
          {!isEditing && activeTab === 'training' && (
            <div className="bg-slate-950/30 p-5 rounded-xl border border-white/5 animate-fade-in space-y-4">
              {beneficiary.esdpTraining?.batchNumber ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">ESDP Batch Number</span>
                    <p className="text-sm font-mono font-bold text-teal-400 mt-0.5">{beneficiary.esdpTraining.batchNumber}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Batch Name / Skill Course</span>
                    <p className="text-xs font-semibold text-white mt-0.5">{beneficiary.esdpTraining.batchName}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">District Venue</span>
                    <p className="text-xs text-slate-300 mt-0.5">{beneficiary.esdpTraining.district} - {beneficiary.esdpTraining.trainingVenue}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Training Duration</span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {beneficiary.esdpTraining.startDate ? new Date(beneficiary.esdpTraining.startDate).toLocaleDateString() : 'N/A'} to{' '}
                      {beneficiary.esdpTraining.endDate ? new Date(beneficiary.esdpTraining.endDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Training Completed?</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded ${
                      beneficiary.esdpTraining.trainingCompleted === 'Yes' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {beneficiary.esdpTraining.trainingCompleted === 'Yes' ? <Check className="w-3.5 h-3.5" /> : null}
                      {beneficiary.esdpTraining.trainingCompleted}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Certificate Issued?</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded ${
                      beneficiary.esdpTraining.certificateIssued === 'Yes' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {beneficiary.esdpTraining.certificateIssued}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Skill Before Training</span>
                    <p className="text-xs text-slate-200 mt-0.5">{beneficiary.esdpTraining.skillBeforeTraining || 'Not Captured'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Skill After Training</span>
                    <p className="text-xs text-slate-200 mt-0.5">{beneficiary.esdpTraining.skillAfterTraining || 'Not Captured'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  This beneficiary has not been allocated to any ESDP training batches.
                </div>
              )}
            </div>
          )}

          {/* ACTIVE TAB: ENTERPRISE PROFILE */}
          {!isEditing && activeTab === 'enterprise' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Existing Entrepreneur?</span>
                  <p className="text-xs text-white font-bold mt-0.5">{beneficiary.entrepreneurProfile?.existingEntrepreneur || 'No'}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Interested in New Business?</span>
                  <p className="text-xs text-white font-bold mt-0.5">{beneficiary.entrepreneurProfile?.interestedInNewBusiness || 'Yes'}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Interested in Expansion?</span>
                  <p className="text-xs text-white font-bold mt-0.5">{beneficiary.entrepreneurProfile?.interestedInBusinessExpansion || 'No'}</p>
                </div>
              </div>

              {beneficiary.entrepreneurProfile?.enterpriseName && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-slate-950/30 p-5 rounded-xl border border-white/5">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Enterprise Name</span>
                    <p className="text-sm font-semibold text-teal-400 mt-0.5">{beneficiary.entrepreneurProfile.enterpriseName}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Sector & Category</span>
                    <p className="text-xs text-slate-200 mt-0.5">{beneficiary.entrepreneurProfile.enterpriseSector} ({beneficiary.entrepreneurProfile.enterpriseType})</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Business Status</span>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${
                      beneficiary.entrepreneurProfile.businessStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {beneficiary.entrepreneurProfile.businessStatus}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] text-slate-500 uppercase">Business Unit Address</span>
                    <p className="text-xs text-slate-300 mt-0.5">{beneficiary.entrepreneurProfile.businessAddress}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">Products Offered</span>
                    <p className="text-xs text-slate-300 mt-0.5">{beneficiary.entrepreneurProfile.productDetails || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* GST & Compliance Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">GST Register Number</span>
                  <p className="text-xs text-slate-200 mt-0.5 font-mono font-bold">{beneficiary.compliance?.gstNumber || 'Not Registered'}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Dedicated Premises?</span>
                  <p className="text-xs text-slate-200 mt-0.5">{beneficiary.compliance?.dedicatedBusinessPremises || 'No'}</p>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Supply Orders Available?</span>
                  <p className="text-xs text-slate-200 mt-0.5">{beneficiary.compliance?.supplyOrdersAvailable || 'No'}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">Enterprise & Unit Attachments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <FileSlotUpload
                    label="Business Registration Cert"
                    slotKey="businessRegistration"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Business Address Proof"
                    slotKey="businessAddressProof"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Photos of the Unit"
                    slotKey="unitPhotos"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                  <FileSlotUpload
                    label="Udyam Certificate / DPIIT"
                    slotKey="udyamCertificate"
                    beneficiaryId={beneficiary.id}
                    files={beneficiary.files}
                    API_BASE={API_BASE}
                    getHeaders={getHeaders}
                    onUploadSuccess={(updated) => setBeneficiary(updated)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: HANDHOLDING TRACKER */}
          {!isEditing && activeTab === 'handholding' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest">Logged Activities</h4>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Support Activity
                </button>
              </div>

              {/* Inline Form Panel */}
              {showActivityForm && (
                <form onSubmit={handleAddActivity} className="p-4 bg-slate-950/50 border border-teal-500/20 rounded-xl space-y-4 animate-slide-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Support Category *</label>
                      <select
                        required
                        value={newActivity.supportCategory}
                        onChange={(e) => setNewActivity({ ...newActivity, supportCategory: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="">Select Support Category</option>
                        {masterData.supportCategories.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Status</label>
                        <select
                          value={newActivity.status}
                          onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Next Follow-Up</label>
                        <input
                          type="date"
                          value={newActivity.nextFollowUpDate}
                          onChange={(e) => setNewActivity({ ...newActivity, nextFollowUpDate: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Description of Support *</label>
                      <input
                        type="text"
                        required
                        placeholder="Detailed details of support provided"
                        value={newActivity.description}
                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Remarks</label>
                      <input
                        type="text"
                        placeholder="Optional remarks"
                        value={newActivity.remarks}
                        onChange={(e) => setNewActivity({ ...newActivity, remarks: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowActivityForm(false)}
                      className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-slate-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Save Activity
                    </button>
                  </div>
                </form>
              )}

              {/* Log table */}
              <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400">
                      <th className="p-3">Date</th>
                      <th className="p-3">Counsellor</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Next Follow-Up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {beneficiary.handholdingActivities?.map((a, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 whitespace-nowrap">{new Date(a.activityDate).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold text-white">{a.counsellorName}</td>
                        <td className="p-3 font-medium text-teal-300">{a.supportCategory}</td>
                        <td className="p-3">{a.description}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            a.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-400' :
                            a.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {a.nextFollowUpDate ? new Date(a.nextFollowUpDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {(!beneficiary.handholdingActivities || beneficiary.handholdingActivities.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No activities logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: DOCUMENTS */}
          {!isEditing && activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              {/* Upload Form */}
              <form onSubmit={handleUploadDoc} className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1">
                  <Upload className="w-4 h-4" /> Upload Document Vault
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Doc Category</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="Personal Documents">Personal Documents</option>
                      <option value="Enterprise Documents">Enterprise Documents</option>
                      <option value="Registration Documents">Registration Documents</option>
                      <option value="Scheme Documents">Scheme Documents</option>
                      <option value="Financial Documents">Financial Documents</option>
                      <option value="Market Access Documents">Market Access Documents</option>
                      <option value="Other Documents">Other Documents</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Document Title Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aadhaar Card, GST Cert"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Select File (PDF, PNG, JPG)</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-1.5 text-xs text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="py-1.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </form>

              {/* Documents grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {beneficiary.documents?.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-950/30 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-colors">
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-widest">{d.category}</span>
                      <span className="text-xs font-semibold text-white truncate block mt-0.5">{d.name}</span>
                      <span className="text-[10px] font-mono text-teal-400/80 block mt-1">Format: {d.format}</span>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={`http://localhost:5000${d.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {user.role === 'Admin' && (
                        <button
                          onClick={() => handleDeleteDoc(d.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded transition-colors cursor-pointer"
                          title="Delete (Admin Only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!beneficiary.documents || beneficiary.documents.length === 0) && (
                  <div className="sm:col-span-2 text-center py-8 text-slate-500 text-xs">
                    No documents uploaded to vault yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE TAB: TIMELINE */}
          {!isEditing && activeTab === 'timeline' && (
            <div className="relative pl-6 border-l border-white/10 space-y-6 py-2 ml-4 animate-fade-in">
              {beneficiary.timeline?.slice().reverse().map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline icon dot */}
                  <span className="absolute top-1 -left-[31px] w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-teal-400 outline-4 outline-slate-900 ring-4 ring-teal-500/10" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h5 className="text-xs font-bold text-white mt-0.5">{event.title}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
              {(!beneficiary.timeline || beneficiary.timeline.length === 0) && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No timeline milestones registered.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
