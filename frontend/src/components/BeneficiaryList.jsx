import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, Filter, PlusCircle, Eye, RefreshCw, X,
  FileSpreadsheet, MapPin, Phone, User, ChevronLeft, ChevronRight,
} from 'lucide-react';
import RegisterBeneficiaryModal from './RegisterBeneficiaryModal';
import BeneficiaryDetailsModal from './BeneficiaryDetailsModal';

export default function BeneficiaryList() {
  const { API_BASE, getHeaders, masterData, user } = useApp();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterShgName, setFilterShgName] = useState('');
  const [filterEnterpriseName, setFilterEnterpriseName] = useState('');
  const [filterRegStatus, setFilterRegStatus] = useState('');
  const [filterLoanStatus, setFilterLoanStatus] = useState('');
  const [filterMarketAccess, setFilterMarketAccess] = useState('');
  const [filterCounsellor, setFilterCounsellor] = useState('');
  const [counsellors, setCounsellors] = useState([]);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState(null);

  const fetchCounsellors = async () => {
    if (user.role !== 'Admin') return;
    try {
      const res = await fetch(`${API_BASE}/auth/counsellors`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setCounsellors(data.counsellors);
    } catch (err) {
      console.error('Error fetching counsellors:', err);
    }
  };

  useEffect(() => { fetchCounsellors(); }, []);

  const fetchBeneficiaries = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterDistrict) params.append('district', filterDistrict);
      if (filterVillage) params.append('village', filterVillage);
      if (filterShgName) params.append('shgName', filterShgName);
      if (filterEnterpriseName) params.append('enterpriseName', filterEnterpriseName);
      if (filterRegStatus) params.append('registrationStatus', filterRegStatus);
      if (filterLoanStatus) params.append('loanStatus', filterLoanStatus);
      if (filterMarketAccess) params.append('marketAccessStatus', filterMarketAccess);
      if (filterCounsellor) params.append('counsellorId', filterCounsellor);
      params.append('page', pageNum);
      params.append('limit', LIMIT);

      const res = await fetch(`${API_BASE}/beneficiary?${params.toString()}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setBeneficiaries(data.beneficiaries);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search + filter fetch
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchBeneficiaries(1);
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filterDistrict, filterVillage, filterShgName, filterEnterpriseName, filterRegStatus, filterLoanStatus, filterMarketAccess, filterCounsellor]);

  const goToPage = (p) => {
    setPage(p);
    fetchBeneficiaries(p);
  };

  const clearFilters = () => {
    setFilterDistrict(''); setFilterVillage(''); setFilterShgName('');
    setFilterEnterpriseName(''); setFilterRegStatus(''); setFilterLoanStatus('');
    setFilterMarketAccess(''); setFilterCounsellor(''); setSearch('');
    setShowFilters(false);
  };

  const hasActiveFilters = filterDistrict || filterVillage || filterShgName || filterEnterpriseName
    || filterRegStatus || filterLoanStatus || filterMarketAccess || filterCounsellor;

  const handleExportCSV = () => {
    const headers = ['ID', 'Full Name', 'Mobile', 'District', 'Mandal', 'Village', 'SHG', 'Loan', 'Type'];
    const rows = beneficiaries.map(b => [
      b.beneficiaryId || '',
      b.personalInfo?.fullName || '',
      b.personalInfo?.mobileNumber || '',
      b.personalInfo?.district || '',
      b.personalInfo?.mandal || '',
      b.personalInfo?.village || '',
      b.personalInfo?.shgName || 'N/A',
      b.loanTracking?.loanAmountSanctioned || 0,
      b.entrepreneurProfile?.existingEntrepreneur === 'Yes' ? 'Existing' : 'New',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Beneficiaries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Header Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-grow sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, mobile, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`py-2 px-3 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-white/5 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {hasActiveFilters ? '•' : ''}
          </button>

          {beneficiaries.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="py-2 px-3 text-xs bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setShowRegisterModal(true)}
            className="py-2 px-3.5 text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-teal-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Register</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {showFilters && (
        <div className="glass-panel border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-in">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">District</label>
            <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500">
              <option value="">All Districts</option>
              {masterData.districts.map((d, i) => <option key={i} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Village / Mandal</label>
            <input type="text" placeholder="e.g. Kompally" value={filterVillage} onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">SHG / Group Name</label>
            <input type="text" placeholder="e.g. Prerana" value={filterShgName} onChange={(e) => setFilterShgName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Enterprise Name</label>
            <input type="text" placeholder="e.g. Lakshmi Foods" value={filterEnterpriseName} onChange={(e) => setFilterEnterpriseName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Registration Status</label>
            <select value={filterRegStatus} onChange={(e) => setFilterRegStatus(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500">
              <option value="">All</option>
              <option value="Udyam Registered">Udyam Registered</option>
              <option value="GST Registered">GST Registered</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Loan Status</label>
            <select value={filterLoanStatus} onChange={(e) => setFilterLoanStatus(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500">
              <option value="">All</option>
              <option value="Applied">Loan Applied</option>
              <option value="Sanctioned">Loan Sanctioned</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Market Access</label>
            <select value={filterMarketAccess} onChange={(e) => setFilterMarketAccess(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500">
              <option value="">All</option>
              <option value="ONDC">ONDC Registered</option>
              <option value="GeM">GeM Portal</option>
            </select>
          </div>
          {user.role === 'Admin' && (
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Counsellor</label>
              <select value={filterCounsellor} onChange={(e) => setFilterCounsellor(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500">
                <option value="">All Counsellors</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.district})</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button onClick={clearFilters}
              className="w-full py-2 bg-slate-950 border border-white/10 hover:border-rose-500/30 hover:text-rose-400 text-slate-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        </div>
      )}

      {/* ── Result Count ── */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-300 font-semibold">{beneficiaries.length}</span> of{' '}
            <span className="text-slate-300 font-semibold">{total}</span> beneficiaries
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-rose-400 hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Data Display ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs glass-panel border border-white/5 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mb-3" />
          Loading Beneficiary Profiles…
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs glass-panel border border-white/5 rounded-xl gap-3">
          <User className="w-10 h-10 opacity-30" />
          <p className="font-semibold">No beneficiaries found</p>
          <p className="text-[11px]">{hasActiveFilters || search ? 'Try adjusting your search or filters.' : 'Register the first beneficiary to get started.'}</p>
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-lg hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/60 text-slate-400">
                    <th className="p-4 font-semibold">Beneficiary ID</th>
                    <th className="p-4 font-semibold">Full Name</th>
                    <th className="p-4 font-semibold">Mobile</th>
                    <th className="p-4 font-semibold">District</th>
                    <th className="p-4 font-semibold">Village/Mandal</th>
                    <th className="p-4 font-semibold">Type</th>
                    {user.role === 'Admin' && <th className="p-4 font-semibold">Counsellor</th>}
                    <th className="p-4 font-semibold text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {beneficiaries.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-mono text-[11px] font-bold text-teal-400">{b.beneficiaryId}</td>
                      <td className="p-4 font-semibold text-white">{b.personalInfo?.fullName}</td>
                      <td className="p-4 text-slate-300">{b.personalInfo?.mobileNumber}</td>
                      <td className="p-4 text-slate-300">{b.personalInfo?.district}</td>
                      <td className="p-4 text-slate-400">{b.personalInfo?.village || b.personalInfo?.mandal || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.entrepreneurProfile?.existingEntrepreneur === 'Yes'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {b.entrepreneurProfile?.existingEntrepreneur === 'Yes' ? 'Existing' : 'New / Aspiring'}
                        </span>
                      </td>
                      {user.role === 'Admin' && (
                        <td className="p-4 text-slate-400 text-[11px]">
                          {b.assignedCounsellor ? b.assignedCounsellor.fullName : '—'}
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedBeneficiaryId(b.id)}
                          className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-slate-950 rounded-lg transition-all cursor-pointer group-hover:border-teal-500/50"
                          title="View Full Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Card View ── */}
          <div className="md:hidden space-y-3">
            {beneficiaries.map((b) => (
              <div key={b.id} className="glass-panel border border-white/5 rounded-xl p-4 space-y-3 hover:border-teal-500/20 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-white text-sm truncate">{b.personalInfo?.fullName}</p>
                    <p className="font-mono text-[10px] text-teal-400 mt-0.5">{b.beneficiaryId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedBeneficiaryId(b.id)}
                    className="flex-shrink-0 p-2.5 bg-teal-500 text-slate-950 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{b.personalInfo?.mobileNumber || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{b.personalInfo?.district || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    b.entrepreneurProfile?.existingEntrepreneur === 'Yes'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    {b.entrepreneurProfile?.existingEntrepreneur === 'Yes' ? 'Existing Entrepreneur' : 'New / Aspiring'}
                  </span>
                  {user.role === 'Admin' && b.assignedCounsellor && (
                    <span className="text-[10px] text-slate-500">{b.assignedCounsellor.fullName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Page <span className="text-slate-300 font-semibold">{page}</span> of{' '}
                <span className="text-slate-300 font-semibold">{totalPages}</span>
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {/* Page number buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        p === page
                          ? 'bg-teal-500 text-slate-950'
                          : 'border border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Register Modal ── */}
      {showRegisterModal && (
        <RegisterBeneficiaryModal
          onClose={() => { setShowRegisterModal(false); fetchBeneficiaries(); }}
          onSuccess={(newId) => { setShowRegisterModal(false); fetchBeneficiaries(); setSelectedBeneficiaryId(newId); }}
        />
      )}

      {/* ── Details Modal ── */}
      {selectedBeneficiaryId && (
        <BeneficiaryDetailsModal
          id={selectedBeneficiaryId}
          onClose={() => { setSelectedBeneficiaryId(null); fetchBeneficiaries(); }}
        />
      )}
    </div>
  );
}
