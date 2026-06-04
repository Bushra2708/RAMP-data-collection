import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Filter, PlusCircle, Eye, RefreshCw, X, FileSpreadsheet } from 'lucide-react';
import RegisterBeneficiaryModal from './RegisterBeneficiaryModal';
import BeneficiaryDetailsModal from './BeneficiaryDetailsModal';

export default function BeneficiaryList() {
  const { API_BASE, getHeaders, masterData, user } = useApp();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
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
      const res = await fetch(`${API_BASE}/auth/counsellors`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setCounsellors(data.counsellors);
      }
    } catch (err) {
      console.error('Error fetching counsellors:', err);
    }
  };

  useEffect(() => {
    fetchCounsellors();
  }, []);

  const fetchBeneficiaries = async () => {
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

      const res = await fetch(`${API_BASE}/beneficiary?${params.toString()}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setBeneficiaries(data.beneficiaries);
      }
    } catch (err) {
      console.error('Error fetching beneficiaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchBeneficiaries();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [
    search,
    filterDistrict,
    filterVillage,
    filterShgName,
    filterEnterpriseName,
    filterRegStatus,
    filterLoanStatus,
    filterMarketAccess,
    filterCounsellor
  ]);

  const clearFilters = () => {
    setFilterDistrict('');
    setFilterVillage('');
    setFilterShgName('');
    setFilterEnterpriseName('');
    setFilterRegStatus('');
    setFilterLoanStatus('');
    setFilterMarketAccess('');
    setFilterCounsellor('');
    setSearch('');
    setShowFilters(false);
  };

  const handleExportCSV = () => {
    // Generate CSV data from table
    const headers = ['Beneficiary ID', 'Full Name', 'Mobile Number', 'District', 'Mandal', 'Village', 'SHG Name', 'Loan Sanctioned', 'Type'];
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

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beneficiary_List_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, mobile, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`py-2 px-3 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
              showFilters || filterDistrict || filterRegStatus || filterLoanStatus || filterMarketAccess
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-white/5 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>

          {beneficiaries.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="py-2 px-3 text-xs bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>
          )}

          <button
            onClick={() => setShowRegisterModal(true)}
            className="py-2 px-3.5 text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Register Beneficiary
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="glass-panel border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-slide-in">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">District</label>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Districts</option>
              {masterData.districts.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Mandal/Village</label>
            <input
              type="text"
              placeholder="e.g. Kompally"
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">SHG / Group Name</label>
            <input
              type="text"
              placeholder="e.g. Prerana"
              value={filterShgName}
              onChange={(e) => setFilterShgName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Enterprise Name</label>
            <input
              type="text"
              placeholder="e.g. Lakshmi Foods"
              value={filterEnterpriseName}
              onChange={(e) => setFilterEnterpriseName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Registration Types</label>
            <select
              value={filterRegStatus}
              onChange={(e) => setFilterRegStatus(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Registrations</option>
              <option value="Udyam Registered">Udyam Registered</option>
              <option value="GST Registered">GST Registered</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Loan Scheme Status</label>
            <select
              value={filterLoanStatus}
              onChange={(e) => setFilterLoanStatus(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Loans</option>
              <option value="Applied">Applied (PMEGP/PMMY)</option>
              <option value="Sanctioned">Sanctioned & Active</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">Market Access</label>
            <select
              value={filterMarketAccess}
              onChange={(e) => setFilterMarketAccess(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="">All Channels</option>
              <option value="ONDC">ONDC Registered</option>
              <option value="GeM">GeM Portal Active</option>
            </select>
          </div>

          {user.role === 'Admin' && (
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">MSME Counsellor</label>
              <select
                value={filterCounsellor}
                onChange={(e) => setFilterCounsellor(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="">All Counsellors</option>
                {counsellors.map((c) => (
                  <option key={c._id} value={c._id}>{c.fullName} ({c.district})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end justify-end gap-2 md:col-start-4">
            <button
              onClick={clearFilters}
              className="w-full py-2 bg-slate-950 border border-white/10 hover:border-rose-500/30 hover:text-rose-400 text-slate-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Data Grid table */}
      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mb-2" />
            Loading Beneficiary Profiles...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400">
                  <th className="p-4 font-semibold">Beneficiary ID</th>
                  <th className="p-4 font-semibold">Full Name</th>
                  <th className="p-4 font-semibold">Mobile Number</th>
                  <th className="p-4 font-semibold">District</th>
                  <th className="p-4 font-semibold">Village/Mandal</th>
                  <th className="p-4 font-semibold">Entrepreneur status</th>
                  {user.role === 'Admin' && <th className="p-4 font-semibold">Counsellor</th>}
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {beneficiaries.map((b) => (
                  <tr key={b._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-teal-400">{b.beneficiaryId}</td>
                    <td className="p-4 font-semibold text-white">{b.personalInfo?.fullName}</td>
                    <td className="p-4">{b.personalInfo?.mobileNumber}</td>
                    <td className="p-4">{b.personalInfo?.district}</td>
                    <td className="p-4">{b.personalInfo?.village}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.entrepreneurProfile?.existingEntrepreneur === 'Yes'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {b.entrepreneurProfile?.existingEntrepreneur === 'Yes' ? 'Existing' : 'Interested (New)'}
                      </span>
                    </td>
                    {user.role === 'Admin' && (
                      <td className="p-4 text-slate-400">
                        {b.assignedCounsellor ? b.assignedCounsellor.fullName : 'ALEAP Admin'}
                      </td>
                    )}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedBeneficiaryId(b._id)}
                        className="p-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-slate-950 rounded transition-all cursor-pointer"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {beneficiaries.length === 0 && (
                  <tr>
                    <td colSpan={user.role === 'Admin' ? 8 : 7} className="p-8 text-center text-slate-500">
                      No beneficiaries matched your query parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Beneficiary Registration Wizard Modal */}
      {showRegisterModal && (
        <RegisterBeneficiaryModal
          onClose={() => {
            setShowRegisterModal(false);
            fetchBeneficiaries();
          }}
          onSuccess={(newId) => {
            setShowRegisterModal(false);
            fetchBeneficiaries();
            setSelectedBeneficiaryId(newId);
          }}
        />
      )}

      {/* Beneficiary Profile Details Modal */}
      {selectedBeneficiaryId && (
        <BeneficiaryDetailsModal
          id={selectedBeneficiaryId}
          onClose={() => {
            setSelectedBeneficiaryId(null);
            fetchBeneficiaries();
          }}
        />
      )}
    </div>
  );
}
