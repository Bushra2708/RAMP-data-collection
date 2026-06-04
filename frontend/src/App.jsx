import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import DashboardOverview from './components/DashboardOverview';
import BeneficiaryList from './components/BeneficiaryList';
import ReportCenter from './components/ReportCenter';
import MasterDataPanel from './components/MasterDataPanel';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Smartphone,
  Laptop,
  Menu,
} from 'lucide-react';

function AppContent() {
  const { token, user, simulationMode, setSimulationMode, logout } = useApp();
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard', 'directory', 'reports', 'settings'

  if (!token || !user) {
    return <Login />;
  }

  // Counsellor Role Workspace View (Or Simulation Mode)
  const isCounsellorView = user.role === 'Counsellor' || simulationMode;

  // Sidebar navigation options (Admin)
  const menuOptions = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Beneficiary Directory', icon: Users },
    { id: 'reports', label: 'Report Center', icon: FileText },
    { id: 'settings', label: 'Master Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* Top Header Navbar */}
      <header className="bg-slate-900/80 border-b border-white/5 py-3.5 px-6 flex items-center justify-between sticky top-0 backdrop-blur-md z-30 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400 font-bold text-sm">
            R
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">RBHMS Portal</h1>
            <p className="text-[10px] text-slate-400">Telangana Beneficiary Handholding</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Simulation Toggle Trigger (Visible only to Admin) */}
          {user.role === 'Admin' && (
            <button
              onClick={() => {
                setSimulationMode(!simulationMode);
                if (!simulationMode) setActiveMenu('directory'); // Default to list in mobile simulator
              }}
              className="py-1.5 px-3 rounded-lg border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {simulationMode ? (
                <>
                  <Laptop className="w-3.5 h-3.5" /> Web Admin Mode
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" /> Counsellor Mobile View
                </>
              )}
            </button>
          )}

          {/* Logged User Info */}
          <div className="hidden sm:block text-right">
            <span className="text-xs font-semibold text-white block">{user.fullName}</span>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded mt-0.5 inline-block">
              {isCounsellorView ? 'MSME Counsellor' : 'ALEAP Admin'}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg border border-white/5 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Screen Layout */}
      {isCounsellorView ? (
        /* COUNSELLOR VIEW MODE (Simulated or Real) */
        user.role === 'Admin' && simulationMode ? (
          /* Case A: Admin testing the mobile simulator view */
          <div className="flex-grow flex items-center justify-center p-6 bg-slate-950 relative overflow-y-auto no-print">
            <div className="mobile-device-simulator animate-fade-in flex flex-col">
              {/* Simulated Device Status bar spacing */}
              <div className="h-6 bg-slate-950/40 w-full flex-shrink-0" />
              
              {/* Simulated App Header */}
              <div className="bg-teal-600 p-4 flex items-center justify-between shadow-md flex-shrink-0">
                <div>
                  <h2 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Telangana RBHMS</h2>
                  <h3 className="text-sm font-bold text-white">Counsellor Workspace</h3>
                </div>
                <Smartphone className="w-4 h-4 text-white" />
              </div>

              {/* Simulated Screen Area */}
              <div className="flex-grow overflow-y-auto p-4 bg-slate-950 space-y-4">
                <BeneficiaryList />
              </div>
            </div>
          </div>
        ) : (
          /* Case B: Real MSME Counsellor login (takes full responsive screen space) */
          <main className="flex-grow p-4 sm:p-6 max-w-4xl mx-auto w-full">
            <div className="bg-slate-900 border border-white/5 rounded-xl p-5 mb-6">
              <h2 className="text-md font-bold text-white">Counsellor Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">
                You are registered in the <strong className="text-teal-400">{user.district}</strong> district. You can register new beneficiaries and record handholding milestones.
              </p>
            </div>
            <BeneficiaryList />
          </main>
        )
      ) : (
        /* WEB ADMIN PORTAL MODE (Wide Layout) */
        <div className="flex-grow flex print:block relative">
          
          {/* Desktop Left Navigation Sidebar */}
          <aside className="w-64 bg-slate-900 border-r border-white/5 p-4 space-y-2 flex-shrink-0 no-print hidden md:block">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 block mb-4">Navigation</span>
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveMenu(opt.id)}
                  className={`w-full text-left py-2.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                    activeMenu === opt.id
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {opt.label}
                </button>
              );
            })}
          </aside>

          {/* Desktop View Main panel */}
          <main className="flex-grow p-4 md:p-6 pb-20 md:pb-6 print:p-0">
            {activeMenu === 'dashboard' && <DashboardOverview />}
            {activeMenu === 'directory' && <BeneficiaryList />}
            {activeMenu === 'reports' && <ReportCenter />}
            {activeMenu === 'settings' && <MasterDataPanel />}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around py-2 px-1 z-40 md:hidden no-print">
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveMenu(opt.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg cursor-pointer transition-all ${
                    activeMenu === opt.id
                      ? 'text-teal-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-semibold">{opt.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' } }} />
      <AppContent />
    </AppProvider>
  );
}
