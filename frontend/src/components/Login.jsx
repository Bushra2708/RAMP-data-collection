import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, Mail, Lock, Shield, KeyRound, AlertCircle, UserPlus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, API_BASE, masterData } = useApp();
  const [activeTab, setActiveTab] = useState('counsellor'); // 'counsellor' or 'admin'
  const [loading, setLoading] = useState(false);
  const [isRegisteringCounsellor, setIsRegisteringCounsellor] = useState(false);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);

  // Forms
  const [mobileNumber, setMobileNumber] = useState('');
  const [counsellorPassword, setCounsellorPassword] = useState('');
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Counsellor Self-Registration Form
  const [registerName, setRegisterName] = useState('');
  const [registerMobile, setRegisterMobile] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerDistrict, setRegisterDistrict] = useState('');

  // Admin Self-Registration Form
  const [adminRegisterName, setAdminRegisterName] = useState('');
  const [adminRegisterEmail, setAdminRegisterEmail] = useState('');
  const [adminRegisterPassword, setAdminRegisterPassword] = useState('');

  // Password Reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMobile, setResetMobile] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: request, 2: verify & change
  const [receivedOTP, setReceivedOTP] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    if (showResetModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showResetModal]);


  // Districts fallback if masterData not loaded yet
  const districtsList = masterData.districts && masterData.districts.length > 0
    ? masterData.districts
    : [
        'Hyderabad',
        'Warangal',
        'Medchal-Malkajgiri',
        'Rangareddy',
        'Sangareddy',
        'Karimnagar',
        'Nizamabad',
        'Nalgonda',
        'Khammam',
        'Mahabubnagar',
      ];

  const handleCounsellorLogin = async (e) => {
    e.preventDefault();
    if (!mobileNumber || !counsellorPassword) {
      return toast.error('Please enter mobile number and password');
    }
    setLoading(true);
    const res = await login({ mobileNumber, password: counsellorPassword }, 'Counsellor');
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !adminPassword) {
      return toast.error('Please enter email and password');
    }
    setLoading(true);
    const res = await login({ email, password: adminPassword }, 'Admin');
    setLoading(false);
  };

  const handleCounsellorRegister = async (e) => {
    e.preventDefault();
    if (!registerName || !registerMobile || !registerPassword || !registerDistrict) {
      return toast.error('Please fill in all details');
    }
    if (registerMobile.length !== 10 || isNaN(registerMobile)) {
      return toast.error('Please enter a valid 10-digit mobile number');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/counsellor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registerName,
          mobileNumber: registerMobile,
          password: registerPassword,
          district: registerDistrict,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Registration successful! Please log in with your credentials.');
        setMobileNumber(registerMobile);
        setCounsellorPassword(registerPassword);
        setIsRegisteringCounsellor(false);
        // Clear registration form
        setRegisterName('');
        setRegisterMobile('');
        setRegisterPassword('');
        setRegisterDistrict('');
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error('Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    if (!adminRegisterName || !adminRegisterEmail || !adminRegisterPassword) {
      return toast.error('Please fill in all details');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: adminRegisterName,
          email: adminRegisterEmail,
          password: adminRegisterPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin registered successfully! Please log in.');
        setEmail(adminRegisterEmail);
        setAdminPassword(adminRegisterPassword);
        setIsRegisteringAdmin(false);
        // Clear registration form
        setAdminRegisterName('');
        setAdminRegisterEmail('');
        setAdminRegisterPassword('');
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error('Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };


  // Reset OTP Workflow
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!resetMobile) return toast.error('Please enter mobile number');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/counsellor/reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: resetMobile }),
      });
      const data = await res.json();
      if (data.success) {
        setReceivedOTP(data.otp); // Save demo OTP
        setResetStep(2);
        toast.success('OTP sent successfully (Simulated)');
      } else {
        toast.error(data.message || 'Mobile number not found.');
      }
    } catch (err) {
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!enteredOTP || !newPassword) return toast.error('Please fill all fields');
    if (enteredOTP !== receivedOTP) {
      return toast.error(`Incorrect OTP. For demo verification, please use: ${receivedOTP}`);
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/counsellor/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: resetMobile,
          otp: enteredOTP,
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password updated. Please login.');
        setShowResetModal(false);
        setResetMobile('');
        setEnteredOTP('');
        setNewPassword('');
        setResetStep(1);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-950/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-950/25 blur-[100px] pointer-events-none" />

      {/* Main Grid Wrapper */}
      <div className="w-full max-w-4xl grid md:grid-cols-12 rounded-2xl overflow-hidden glass-panel glow-teal shadow-2xl animate-fade-in relative z-10">
        
        {/* Left Graphics Panel */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-teal-900/40 to-slate-900 p-8 flex flex-col justify-between border-r border-white/5">
          <div>
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-teal-500/10 text-teal-400 mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">RBHMS</h1>
            <p className="text-teal-400 font-medium text-sm mb-4">Government of Telangana</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Centralized Beneficiary Handholding Management System (RBHMS) for field-level MSME counsellors and ALEAP Head Office.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Developed for</span>
            <span className="text-xs font-semibold text-slate-300">ALEAP India (Association of Lady Entrepreneurs of India)</span>
          </div>
        </div>

        {/* Right Input Form Panel */}
        <div className="col-span-12 md:col-span-7 bg-slate-900 p-8 flex flex-col justify-center">
          {/* Tab Headers */}
          {!isRegisteringCounsellor && !isRegisteringAdmin && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg mb-8">
              <button
                onClick={() => setActiveTab('counsellor')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'counsellor'
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Counsellor
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALEAP Admin
              </button>
            </div>
          )}

          {/* Counsellor Login Form */}
          {activeTab === 'counsellor' && !isRegisteringCounsellor && (
            <form onSubmit={handleCounsellorLogin} className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Counsellor Login</h3>
                <p className="text-[10px] text-slate-400">Log in to register and track MSME beneficiaries.</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Mobile Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="Enter registered mobile (e.g., 9999999999)"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-xs text-teal-400 hover:underline hover:text-teal-300"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Enter password (e.g., counsellor123)"
                    value={counsellorPassword}
                    onChange={(e) => setCounsellorPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Access Counsellor Dashboard'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisteringCounsellor(true)}
                  className="text-xs text-teal-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" /> New Counsellor? Register here
                </button>
              </div>
            </form>
          )}

          {/* Counsellor Self-Registration Form */}
          {activeTab === 'counsellor' && isRegisteringCounsellor && (
            <form onSubmit={handleCounsellorRegister} className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Counsellor Registration</h3>
                <p className="text-[10px] text-slate-400">Sign up to gain access to the field agent beneficiary tracking workspace.</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Mobile Number (Login ID)</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit mobile number"
                  value={registerMobile}
                  onChange={(e) => setRegisterMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Choose Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Assigned District</label>
                <select
                  required
                  value={registerDistrict}
                  onChange={(e) => setRegisterDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select District</option>
                  {districtsList.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Register Counsellor Account'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisteringCounsellor(false)}
                  className="text-xs text-teal-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Already registered? Log in here
                </button>
              </div>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === 'admin' && !isRegisteringAdmin && (
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Admin Login</h3>
                <p className="text-[10px] text-slate-400">ALEAP Head Office administrator login gateway.</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Enter admin email (e.g., admin@aleap.org)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Enter password (e.g., admin123)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Access Admin Portal'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisteringAdmin(true)}
                  className="text-xs text-teal-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" /> New Admin? Register here
                </button>
              </div>
            </form>
          )}

          {/* Admin Registration Form */}
          {activeTab === 'admin' && isRegisteringAdmin && (
            <form onSubmit={handleAdminRegister} className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Admin Registration</h3>
                <p className="text-[10px] text-slate-400">Register a new Admin account for the ALEAP Head Office.</p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={adminRegisterName}
                  onChange={(e) => setAdminRegisterName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter admin email"
                  value={adminRegisterEmail}
                  onChange={(e) => setAdminRegisterEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Choose secure password"
                  value={adminRegisterPassword}
                  onChange={(e) => setAdminRegisterPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? 'Creating Admin Account...' : 'Register Admin Account'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisteringAdmin(false)}
                  className="text-xs text-teal-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Already registered? Log in here
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Simulated OTP Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-400" /> OTP Password Reset
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Counsellors can reset their passwords using mobile OTP verification.
            </p>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Registered Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9999999999"
                    value={resetMobile}
                    onChange={(e) => setResetMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-xs bg-teal-500 text-slate-950 rounded-lg font-bold cursor-pointer"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {receivedOTP && (
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs text-teal-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold block mb-0.5">Demo OTP Generated:</span>
                      Use verification OTP: <strong className="text-teal-400 text-sm tracking-wider">{receivedOTP}</strong>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={enteredOTP}
                    onChange={(e) => setEnteredOTP(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500 text-center font-mono tracking-widest text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">New Secure Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Choose new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-xs bg-teal-500 text-slate-950 rounded-lg font-bold cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
