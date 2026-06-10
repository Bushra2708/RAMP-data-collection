import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  GraduationCap,
  Store,
  FileCheck,
  TrendingUp,
  CreditCard,
  Briefcase,
  Layers,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export default function DashboardOverview() {
  const { API_BASE, getHeaders, user } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data);
      } else {
        setError(data.message || 'Unable to load dashboard data.');
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Cannot reach the backend server. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">{error || 'Failed to load analytics.'}</p>
        <button
          type="button"
          onClick={fetchStats}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, districtStats, sectorStats, monthlyTrend } = stats;

  const kpis = [
    { label: user?.role === 'Counsellor' ? 'My Beneficiaries' : 'Total Beneficiaries', value: summary.totalBeneficiaries, icon: Users, color: 'text-teal-400 bg-teal-500/10' },
    { label: user?.role === 'Counsellor' ? 'My Activities Logged' : 'Activities Logged', value: summary.totalActivities, icon: ClipboardList, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'ESDP Participants', value: summary.totalEsdp, icon: GraduationCap, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Existing Entrepreneurs', value: summary.existingEntrepreneurs, icon: Store, color: 'text-violet-400 bg-violet-500/10' },
    { label: 'New Entrepreneurs', value: summary.newEntrepreneurs, icon: Briefcase, color: 'text-pink-400 bg-pink-500/10' },
    { label: 'Udyam Registrations', value: summary.udyamCount, icon: FileCheck, color: 'text-yellow-400 bg-yellow-500/10' },
    { label: 'ONDC Registrations', value: summary.ondcCount, icon: Layers, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'GeM Registrations', value: summary.gemCount, icon: MapPin, color: 'text-indigo-400 bg-indigo-500/10' },
    { label: 'Loans Facilitated', value: summary.loansFacilitated, icon: CreditCard, color: 'text-rose-400 bg-rose-500/10' },
    { label: 'Enterprises Setup', value: summary.enterprisesEstablished, icon: TrendingUp, color: 'text-lime-400 bg-lime-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in panel-compact">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-panel rounded-xl p-5 border border-white/5 flex items-center gap-4 hover:border-teal-500/20 transition-all">
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{(kpi.value ?? 0).toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* District Wise Bar Chart */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">District-Wise Beneficiary Analysis</h3>
          <div className="h-64">
            {districtStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="district" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar name="Beneficiaries" dataKey="beneficiaries" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar name="Existing Entrepreneurs" dataKey="entrepreneurs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar name="Loans Facilitated" dataKey="loansCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No records available.</div>
            )}
          </div>
        </div>

        {/* Sector Distribution Pie Chart */}
        <div className="lg:col-span-4 glass-panel rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">Enterprise Sector Breakdown</h3>
          <div className="h-64 flex flex-col justify-between">
            {sectorStats.length > 0 ? (
              <>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sectorStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Sector Legend */}
                <div className="flex flex-wrap gap-2 justify-center max-h-20 overflow-y-auto">
                  {sectorStats.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No enterprise data configured.</div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Trends Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Registration Line Trend */}
        <div className="md:col-span-7 glass-panel rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Registration Trend</h3>
          <div className="h-56">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" name="New Registrations" dataKey="beneficiaries" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">No registrations logged in the last 6 months.</div>
            )}
          </div>
        </div>

        {/* District Detail Table */}
        <div className="md:col-span-5 glass-panel rounded-xl p-5 border border-white/5 overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Progress Table by District</h3>
          <div className="overflow-x-auto flex-grow max-h-52">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-2 font-semibold">District</th>
                  <th className="pb-2 font-semibold text-center">Beneficiaries</th>
                  <th className="pb-2 font-semibold text-center">Loans</th>
                  <th className="pb-2 font-semibold text-right">Sanctioned (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {districtStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-medium">{item.district}</td>
                    <td className="py-2.5 text-center">{item.beneficiaries}</td>
                    <td className="py-2.5 text-center">{item.loansCount}</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-400">₹{item.totalLoans.toLocaleString()}</td>
                  </tr>
                ))}
                {districtStats.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-500">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
