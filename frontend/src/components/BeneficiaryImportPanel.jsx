import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const TEMPLATE_HEADERS = [
  'Beneficiary ID',
  'Full Name',
  'Mobile Number',
  'Email',
  'Gender',
  'Age',
  'District',
  'Mandal',
  'Village',
  'Address',
  'SHG Name',
  'Qualification',
  'Aadhaar Number',
  'PAN Number',
  'Counsellor Mobile',
  'Existing Entrepreneur',
  'Enterprise Name',
  'Enterprise Sector',
  'Enterprise Type',
  'Business Status',
  'ESDP Batch Number',
  'ESDP Batch Name',
  'ESDP Batch District',
  'ESDP Batch Venue',
  'ESDP Batch Start Date',
  'ESDP Batch End Date',
  'Training Completed',
  'Loan Applied',
  'Loan Scheme',
  'Loan Amount Sanctioned',
  'Udyam Registration Number',
];

const SAMPLE_ROW = {
  'Beneficiary ID': '',
  'Full Name': 'Sample Beneficiary',
  'Mobile Number': '9876543210',
  'Email': 'sample@example.com',
  'Gender': 'Female',
  'Age': '32',
  'District': 'Hyderabad',
  'Mandal': 'Kukatpally',
  'Village': 'Madhapur',
  'Address': 'Sample address line',
  'SHG Name': 'Sample SHG',
  'Qualification': 'Graduate',
  'Aadhaar Number': '',
  'PAN Number': '',
  'Counsellor Mobile': '9999999999',
  'Existing Entrepreneur': 'No',
  'Enterprise Name': '',
  'Enterprise Sector': 'Food Processing',
  'Enterprise Type': '',
  'Business Status': '',
  'ESDP Batch Number': 'ESDP-2026-B04',
  'ESDP Batch Name': 'Solar Panel Installer Training',
  'ESDP Batch District': 'Hyderabad',
  'ESDP Batch Venue': 'ALEAP Skill Center, Hyderabad',
  'ESDP Batch Start Date': '2026-04-01',
  'ESDP Batch End Date': '2026-04-30',
  'Training Completed': 'No',
  'Loan Applied': 'No',
  'Loan Scheme': '',
  'Loan Amount Sanctioned': '',
  'Udyam Registration Number': '',
};

export default function BeneficiaryImportPanel() {
  const { API_BASE, getHeaders, fetchMasterData } = useApp();
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([SAMPLE_ROW], { header: TEMPLATE_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiaries');
    XLSX.writeFile(workbook, 'RBHMS_Beneficiary_Import_Template.xlsx');
    toast.success('Template downloaded.');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    setLastResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        return toast.error('The Excel file has no data rows.');
      }

      const res = await fetch(`${API_BASE}/beneficiary/import`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();

      if (data.success) {
        setLastResult(data.results);
        toast.success(data.message);
        if (data.results?.batchesCreated > 0) {
          fetchMasterData();
        }
      } else {
        toast.error(data.message || 'Import failed.');
      }
    } catch (err) {
      toast.error('Unable to read Excel file. Please upload a valid .xlsx or .csv file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="glass-panel rounded-xl p-6 border border-white/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Beneficiary Excel Import</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload a spreadsheet to create new beneficiary records or update existing ones.
              Rows are matched against the database using <strong className="text-slate-300">Beneficiary ID</strong>, then
              <strong className="text-slate-300"> Mobile Number</strong>, then <strong className="text-slate-300">Aadhaar Number</strong>.
              Matching records are merged; new rows are registered automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-5 py-4 text-sm font-semibold text-slate-200 hover:border-teal-500/40 hover:text-teal-300 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Excel Template
        </button>

        <label className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm font-bold transition-all cursor-pointer ${
          importing
            ? 'border-slate-700 bg-slate-800 text-slate-500 cursor-wait'
            : 'border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
        }`}>
          <Upload className="w-4 h-4" />
          {importing ? 'Importing...' : 'Upload Excel File'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          Column Mapping Guide
        </h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li><span className="text-slate-300">Required:</span> Full Name, Mobile Number, SHG Name</li>
          <li><span className="text-slate-300">Counsellor Mobile</span> links the record to an existing counsellor account</li>
          <li><span className="text-slate-300">ESDP Batch Number</span> — if the batch does not exist, it is auto-created from batch name/venue/district columns before import</li>
          <li>Leave Beneficiary ID blank for new records; fill it to update an existing profile</li>
          <li>Yes/No fields: Existing Entrepreneur, Training Completed, Loan Applied</li>
        </ul>
      </div>

      {lastResult && (
        <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white">Last Import Result</h3>
          {lastResult.batchesCreated > 0 && (
            <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-300">
              Auto-created {lastResult.batchesCreated} ESDP batch(es): {lastResult.createdBatchNumbers?.join(', ')}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{lastResult.created}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Created</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{lastResult.updated}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Updated</p>
            </div>
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-rose-400">{lastResult.failed}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Failed</p>
            </div>
          </div>

          {lastResult.errors?.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lastResult.errors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/5 border border-rose-500/10 rounded-lg p-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Row {err.row}: {err.message}</span>
                </div>
              ))}
            </div>
          )}

          {lastResult.failed === 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              All rows processed successfully.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
