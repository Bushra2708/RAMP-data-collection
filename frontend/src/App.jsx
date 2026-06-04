import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import DashboardOverview from './components/DashboardOverview';
import BeneficiaryList from './components/BeneficiaryList';
import ReportCenter from './components/ReportCenter';
import MasterDataPanel from './components/MasterDataPanel';
import AuditLogViewer from './components/AuditLogViewer';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Smartphone,
  Laptop,
  ChevronRight,
  Shield,
} from 'lucide-react';

function AppContent() {
  const { token, user, simulationMode, setSimulationMode, logout } = useApp();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  if (!token || !user) {
    return <Login />;
  }

  const isCounsellorView = user.role === 'Counsellor' || simulationMode;

  const menuOptions = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'directory', label: 'Beneficiary Directory', icon: Users },
    { id: 'reports', label: 'Report Center', icon: FileText },
    { id: 'settings', label: 'Master Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">

      {/* Top Header — z-50 so sticky header stays above page content but below modals (z-[9999]) */}
      <header className="bg-slate-900 border-b border-white/5 py-3 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30 flex-shrink-0">
            <Shield className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">RBHMS Portal</h1>
            <p className="text-[10px] text-slate-500 hidden sm:block">ALEAP · Telangana RAMP</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Simulation Toggle — Admin only */}
          {user.role === 'Admin' && (
            <button
              onClick={() => {
                setSimulationMode(!simulationMode);
                if (!simulationMode) setActiveMenu('directory');
              }}
              className="py-1.5 px-2 sm:px-3 rounded-lg border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {simulationMode ? (
                <><Laptop className="w-3.5 h-3.5" /><span className="hidden sm:inline">Admin Mode</span></>
              ) : (
                <><Smartphone className="w-3.5 h-3.5" /><span className="hidden sm:inline">Counsellor View</span></>
              )}
            </button>
          )}

          {/* User info */}
          <div className="hidden sm:block text-right">
            <span className="text-xs font-semibold text-white block leading-tight">{user.fullName}</span>
            <span className="text-[10px] text-slate-500">
              {isCounsellorView ? `Counsellor · ${user.district || ''}` : 'ALEAP Admin'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-lg border border-white/5 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 cursor-pointer transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Area */}
      {isCounsellorView ? (
        /* ── COUNSELLOR VIEW ── */
        user.role === 'Admin' && simulationMode ? (
          /* Admin previewing mobile counsellor view */
          <div className="flex-grow flex items-center justify-center p-6 bg-slate-950 overflow-y-auto">
            <div className="mobile-device-simulator animate-fade-in flex flex-col">
              <div className="h-6 bg-slate-950/40 w-full flex-shrink-0" />
              <div className="bg-teal-600 px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">Telangana RBHMS</p>
                  <h2 className="text-sm font-bold text-white">Counsellor Workspace</h2>
                </div>
                <Smartphone className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-grow overflow-y-auto p-4 bg-slate-950">
                <BeneficiaryList />
              </div>
            </div>
          </div>
        ) : (
          /* Real counsellor login */
          <main className="flex-grow p-4 sm:p-6 max-w-4xl mx-auto w-full pb-6">
            <div className="bg-slate-900 border border-white/5 rounded-xl p-4 mb-4">
              <h2 className="text-sm font-bold text-white">Counsellor Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">
                District: <strong className="text-teal-400">{user.district}</strong> — Register new beneficiaries and log handholding milestones.
              </p>
            </div>
            <BeneficiaryList />
          </main>
        )
      ) : (
        /* ── ADMIN WEB PORTAL ── */
        <div className="flex-grow flex min-h-0">

          {/* Desktop Sidebar */}
          <aside className="w-56 bg-slate-900 border-r border-white/5 p-3 flex-shrink-0 hidden md:flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 py-2 block">Navigation</span>
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveMenu(opt.id)}
                  className={`w-full text-left py-2.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                    activeMenu === opt.id
                      ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {opt.label}
                  {activeMenu === opt.id && <ChevronRight className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}

            {/* Sidebar footer */}
            <div className="mt-auto pt-3 border-t border-white/5">
              <div className="px-3 py-2">
                <p className="text-[10px] text-slate-500">Logged in as</p>
                <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-teal-400">ALEAP Admin</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
              {activeMenu === 'dashboard' && <DashboardOverview />}
              {activeMenu === 'directory' && <BeneficiaryList />}
              {activeMenu === 'reports' && <ReportCenter />}
              {activeMenu === 'settings' && <MasterDataPanel />}
              {activeMenu === 'audit' && <AuditLogViewer />}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around py-2 z-50 md:hidden">
            {menuOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveMenu(opt.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg cursor-pointer transition-all ${
                    activeMenu === opt.id ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
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
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' },
          success: { iconTheme: { primary: '#14b8a6', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#0f172a' } },
        }}
      />
      <AppContent />
    </AppProvider>
  );
}
