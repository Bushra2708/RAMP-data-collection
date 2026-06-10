import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Search, Calendar, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogViewer() {
  const { API_BASE, getHeaders } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(25);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [userRole, setUserRole] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state for showing log details
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search,
        action,
        userRole,
        status,
        startDate,
        endDate
      });

      const res = await fetch(`${API_BASE}/audit?${params.toString()}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message || 'Failed to fetch audit logs.');
      }
    } catch (err) {
      toast.error('Network error fetching audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, userRole, status, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const resetFilters = () => {
    setSearch('');
    setAction('');
    setUserRole('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadgeColor = (actionName) => {
    if (actionName.includes('LOGIN_FAILED') || actionName.includes('DELETE')) {
      return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    }
    if (actionName.includes('LOGIN') || actionName.includes('CREATE')) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
    if (actionName.includes('UPDATE')) {
      return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
    }
    return 'bg-slate-500/10 border-slate-500/30 text-slate-300';
  };

  return (
    <div className="space-y-6 animate-fade-in panel-compact">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-400" />
            Audit Logging & Activity Trail
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor administrative updates, counselor activities, and logins to ensure security compliance.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start sm:self-center py-2 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Trails
        </button>
      </div>

      {/* Filters Form */}
      <form onSubmit={handleSearchSubmit} className="glass-panel border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/30">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Search Keywords</label>
          <div className="relative">
            <input
              type="text"
              placeholder="User, IP, Entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Action Type</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CREATE_BENEFICIARY">CREATE_BENEFICIARY</option>
            <option value="UPDATE_BENEFICIARY">UPDATE_BENEFICIARY</option>
            <option value="ADD_ACTIVITY">ADD_ACTIVITY</option>
            <option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option>
            <option value="DELETE_DOCUMENT">DELETE_DOCUMENT</option>
            <option value="REGISTER_COUNSELLOR">REGISTER_COUNSELLOR</option>
            <option value="UPDATE_COUNSELLOR">UPDATE_COUNSELLOR</option>
            <option value="DEACTIVATE_COUNSELLOR">DEACTIVATE_COUNSELLOR</option>
            <option value="DATABASE_BACKUP">DATABASE_BACKUP</option>
            <option value="MANUAL_BACKUP_TRIGGER">MANUAL_BACKUP_TRIGGER</option>
            <option value="DOWNLOAD_BACKUP">DOWNLOAD_BACKUP</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">User Role</label>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin Only</option>
            <option value="Counsellor">Counsellor Only</option>
            <option value="System">System Only</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="sm:col-span-2 md:col-span-2 flex items-end gap-2">
          <button
            type="submit"
            className="flex-grow py-2 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer text-center"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer border border-white/5"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Logs Table Area */}
      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden bg-slate-900/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">User Details</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr className={`hover:bg-white/5 transition-colors ${isExpanded ? 'bg-white/5' : ''}`}>
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white truncate max-w-[150px]">{log.userIdentifier || 'System'}</div>
                        <div className="text-[10px] text-slate-500">{log.userRole}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{log.entity || 'N/A'}</div>
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">{log.entityId || ''}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">{log.ipAddress || 'unknown'}</td>
                      <td className="p-3.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-950/40 border-l border-teal-500">
                        <td colSpan="7" className="p-4">
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Metadata Payload Details</h4>
                            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-w-[95vw] md:max-w-5xl border border-white/5 shadow-inner">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No matching audit trails found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="bg-slate-950/20 px-4 py-3 flex items-center justify-between border-t border-white/5">
            <span className="text-xs text-slate-500">
              Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total} total trails)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
