import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download, Printer, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportCenter() {
  const { API_BASE, getHeaders } = useApp();
  const [activeReport, setActiveReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportHeaders, setReportHeaders] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [schemeFilter, setSchemeFilter] = useState('all');

  const reportsList = [
    { id: 'beneficiary-master', label: 'Beneficiary Master Report' },
    { id: 'district-wise', label: 'District Wise Progress' },
    { id: 'esdp', label: 'ESDP Training Report' },
    { id: 'registration', label: 'Registrations & Certifications' },
    { id: 'loan', label: 'Loan & Finance Tracking' },
    { id: 'scheme', label: 'Govt. Schemes Tracking' },
    { id: 'market-access', label: 'Market Access Channels' },
    { id: 'enterprise-establishment', label: 'Enterprise Establishment Details' },
    { id: 'counsellor-performance', label: 'Counsellor Performance Analytics' },
  ];

  const handleFetchReport = async (reportId, nextSchemeFilter = schemeFilter) => {
    setActiveReport(reportId);
    setLoading(true);
    setReportHeaders([]);
    setReportRows([]);
    try {
      const params = new URLSearchParams();
      if (reportId === 'scheme' && nextSchemeFilter !== 'all') {
        params.append('scheme', nextSchemeFilter);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/reports/${reportId}${query}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.message || `Server error (${res.status})`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setReportHeaders(data.headers || []);
        setReportRows(data.data || []);
      } else {
        toast.error(data.message || 'Failed to compile report.');
      }
    } catch (err) {
      console.error('Report fetch error:', err);
      toast.error('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportRows.length === 0) return;
    const currentReport = reportsList.find(r => r.id === activeReport);
    
    // Construct CSV file string
    const csvContent = "data:text/csv;charset=utf-8," 
      + [reportHeaders.join(','), ...reportRows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentReport.label.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel-compatible CSV downloaded.');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in panel-compact print:block">
      
      {/* Sidebar Report Picker */}
      <div className="md:col-span-3 space-y-2 no-print">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Required Reports</h3>
        {reportsList.map((rep) => (
          <button
            key={rep.id}
            onClick={() => handleFetchReport(rep.id)}
            className={`w-full text-left py-2.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeReport === rep.id
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{rep.label}</span>
          </button>
        ))}
      </div>

      {/* Report View Panel */}
      <div className="md:col-span-9 glass-panel rounded-xl p-5 border border-white/5 space-y-4 print:border-none print:bg-white print:text-black">
        {activeReport ? (
          <>
            {/* Action controls */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 no-print">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {reportsList.find(r => r.id === activeReport)?.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Live spreadsheet logs compiled from central profiles database.</p>
              </div>

              <div className="flex gap-2">
                {activeReport === 'scheme' && (
                  <select
                    value={schemeFilter}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSchemeFilter(nextValue);
                      handleFetchReport('scheme', nextValue);
                    }}
                    className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-teal-500"
                  >
                    <option value="all">All Schemes</option>
                    <option value="PMEGP">PMEGP</option>
                    <option value="PMMY">PMMY</option>
                    <option value="PM Vishwakarma">PM Vishwakarma</option>
                    <option value="PMFME">PMFME</option>
                    <option value="CGTMSE">CGTMSE</option>
                  </select>
                )}
                <button
                  onClick={handlePrintReport}
                  className="py-1.5 px-3 bg-slate-950 border border-white/10 hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={reportRows.length === 0}
                  className="py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Excel
                </button>
              </div>
            </div>

            {/* Print Friendly Header */}
            <div className="hidden print:block mb-6 text-center">
              <h2 className="text-xl font-bold uppercase">Telangana - RBHMS Report Sheet</h2>
              <h3 className="text-md font-semibold text-gray-700 mt-1">
                {reportsList.find(r => r.id === activeReport)?.label}
              </h3>
              <p className="text-[10px] text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Table Display */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-400 mb-2" />
                Compiling Centralized Data...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/5 print:border-collapse">
                <table className="w-full text-left text-[11px] border-collapse print:text-black">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400 print:bg-gray-100 print:text-black print:border-black">
                      {reportHeaders.map((head, idx) => (
                        <th key={idx} className="p-3 font-semibold print:border print:border-gray-300">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200 print:divide-y-0 print:text-black">
                    {reportRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-white/5 print:hover:bg-transparent transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-3 print:border print:border-gray-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                    {reportRows.length === 0 && (
                      <tr>
                        <td colSpan={reportHeaders.length || 1} className="p-6 text-center text-slate-500 print:text-gray-500">
                          No logging entries matching this report sheet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            Select a report from the sidebar panel to query database records.
          </div>
        )}
      </div>
    </div>
  );
}
