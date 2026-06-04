import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Plus, Trash, Save, GraduationCap, Download, Database, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MasterDataPanel() {
  const { masterData, fetchMasterData, API_BASE, getHeaders } = useApp();
  const [activeTab, setActiveTab] = useState('districts'); // 'districts', 'esdpBatches', 'supportCategories', 'sectors', 'backups'
  const [newItem, setNewItem] = useState('');

  // Backup State
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [triggeringBackup, setTriggeringBackup] = useState(false);

  const fetchBackupsList = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch(`${API_BASE}/backup/list`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setBackups(data.backups);
      } else {
        toast.error('Failed to load backup files list.');
      }
    } catch (err) {
      toast.error('Network error loading backups.');
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'backups') {
      fetchBackupsList();
    }
  }, [activeTab]);

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    try {
      const res = await fetch(`${API_BASE}/backup/trigger`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Backup compiled and stored on server.');
        fetchBackupsList();
      } else {
        toast.error(data.message || 'Backup failed.');
      }
    } catch (err) {
      toast.error('Network error triggering database backup.');
    } finally {
      setTriggeringBackup(false);
    }
  };

  const handleDownloadBackup = async (fileName) => {
    try {
      const res = await fetch(`${API_BASE}/backup/download/${fileName}`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        throw new Error('Failed to download file.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully.');
    } catch (err) {
      toast.error('Failed to download backup file.');
    }
  };
  
  // ESDP Batch Form State
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    batchName: '',
    district: '',
    venue: '',
    startDate: '',
    endDate: '',
  });

  const handleSaveList = async (category, updatedItems) => {
    try {
      const res = await fetch(`${API_BASE}/master-data/${category}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items: updatedItems }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Master data configuration saved.');
        fetchMasterData();
      }
    } catch (err) {
      toast.error('Failed to update master data.');
    }
  };

  const handleAddTextItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const currentList = masterData[activeTab] || [];
    if (currentList.includes(newItem.trim())) {
      return toast.error('Item already exists in this master list.');
    }
    const updated = [...currentList, newItem.trim()];
    handleSaveList(activeTab, updated);
    setNewItem('');
  };

  const handleAddBatchItem = (e) => {
    e.preventDefault();
    if (!newBatch.batchNumber || !newBatch.batchName || !newBatch.district || !newBatch.venue) {
      return toast.error('Please fill all batch details.');
    }
    const currentList = masterData.esdpBatches || [];
    const exists = currentList.some(b => b.batchNumber === newBatch.batchNumber);
    if (exists) {
      return toast.error('Batch code already exists.');
    }
    const updated = [...currentList, newBatch];
    handleSaveList('esdpBatches', updated);
    setNewBatch({
      batchNumber: '',
      batchName: '',
      district: '',
      venue: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleDeleteItem = (indexToDelete) => {
    if (!window.confirm('Are you sure you want to delete this configuration item?')) return;
    const currentList = masterData[activeTab] || [];
    const updated = currentList.filter((_, idx) => idx !== indexToDelete);
    handleSaveList(activeTab, updated);
  };

  const tabClass = 'py-2 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer';
  const activeTabClass = 'bg-teal-500 text-slate-950 shadow-md';
  const inactiveTabClass = 'text-slate-400 hover:text-slate-200 hover:bg-white/5';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Sidebar Controls */}
      <div className="md:col-span-3 space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Master Categories</h3>
        <button
          onClick={() => setActiveTab('districts')}
          className={`w-full text-left ${tabClass} ${activeTab === 'districts' ? activeTabClass : inactiveTabClass}`}
        >
          Districts
        </button>
        <button
          onClick={() => setActiveTab('supportCategories')}
          className={`w-full text-left ${tabClass} ${activeTab === 'supportCategories' ? activeTabClass : inactiveTabClass}`}
        >
          Support Categories
        </button>
        <button
          onClick={() => setActiveTab('sectors')}
          className={`w-full text-left ${tabClass} ${activeTab === 'sectors' ? activeTabClass : inactiveTabClass}`}
        >
          Enterprise Sectors
        </button>
        <button
          onClick={() => setActiveTab('esdpBatches')}
          className={`w-full text-left ${tabClass} ${activeTab === 'esdpBatches' ? activeTabClass : inactiveTabClass}`}
        >
          ESDP Batches
        </button>
        <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">System</h3>
          <button
            onClick={() => setActiveTab('backups')}
            className={`w-full text-left ${tabClass} ${activeTab === 'backups' ? activeTabClass : inactiveTabClass}`}
          >
            Database Backups
          </button>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="md:col-span-9 glass-panel rounded-xl p-5 border border-white/5 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === 'backups' ? 'Database Backup Control' : `Configure ${activeTab.replace(/([A-Z])/g, ' $1')}`}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {activeTab === 'backups' 
                ? 'Create, manage, and download system data dumps for recovery and compliance.' 
                : 'Manage details populated in drop-down fields across the platform.'}
            </p>
          </div>
        </div>

        {/* INPUT FORMS */}
        {activeTab !== 'backups' && (
          activeTab !== 'esdpBatches' ? (
            <form onSubmit={handleAddTextItem} className="flex gap-2">
              <input
                type="text"
                required
                placeholder={`Add new ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-grow bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddBatchItem} className="p-4 bg-slate-950/40 border border-white/5 rounded-xl space-y-4">
            <h5 className="text-xs font-bold text-teal-400 flex items-center gap-1"><GraduationCap className="w-4 h-4" /> Schedule New ESDP Batch</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Batch Code ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESDP-2026-B04"
                  value={newBatch.batchNumber}
                  onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1">Batch Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Panel Installer Training"
                  value={newBatch.batchName}
                  onChange={(e) => setNewBatch({ ...newBatch, batchName: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Venue District *</label>
                <select
                  required
                  value={newBatch.district}
                  onChange={(e) => setNewBatch({ ...newBatch, district: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-slate-300"
                >
                  <option value="">Select District</option>
                  {masterData.districts.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1">Venue Full Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ITI Campus, Karimnagar"
                  value={newBatch.venue}
                  onChange={(e) => setNewBatch({ ...newBatch, venue: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newBatch.startDate}
                  onChange={(e) => setNewBatch({ ...newBatch, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={newBatch.endDate}
                  onChange={(e) => setNewBatch({ ...newBatch, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  className="py-2 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Save Batch
                </button>
              </div>
            </div>
          </form>
        )}
      )}

      {/* LIST PREVIEWS */}
      {activeTab !== 'backups' && (
        <div className="bg-slate-950/20 rounded-xl border border-white/5 overflow-hidden">
          {activeTab !== 'esdpBatches' ? (
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {(masterData[activeTab] || []).map((item, idx) => (
                <div key={idx} className="p-3.5 flex justify-between items-center text-xs text-slate-200 hover:bg-white/5 transition-colors">
                  <span className="font-semibold">{item}</span>
                  <button
                    onClick={() => handleDeleteItem(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(!masterData[activeTab] || masterData[activeTab].length === 0) && (
                <div className="p-8 text-center text-slate-500 text-xs">No configuration items logged yet.</div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400">
                    <th className="p-3">Batch Code</th>
                    <th className="p-3">Course Name</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Venue Address</th>
                    <th className="p-3">Dates</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {(masterData.esdpBatches || []).map((b, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-3 font-mono font-bold text-teal-400">{b.batchNumber}</td>
                      <td className="p-3 font-semibold text-white">{b.batchName}</td>
                      <td className="p-3">{b.district}</td>
                      <td className="p-3 truncate max-w-[150px]">{b.venue}</td>
                      <td className="p-3 whitespace-nowrap">{b.startDate} to {b.endDate}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!masterData.esdpBatches || masterData.esdpBatches.length === 0) && (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500">No scheduled batches yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 p-4 border border-white/5 rounded-xl">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <Database className="w-4 h-4" /> Trigger Manual Backup
              </h5>
              <p className="text-[10px] text-slate-400">Instantly generate a JSON dump containing all tables.</p>
            </div>
            <button
              onClick={handleTriggerBackup}
              disabled={triggeringBackup}
              className="py-2 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${triggeringBackup ? 'animate-spin' : ''}`} />
              {triggeringBackup ? 'Generating...' : 'Backup Now'}
            </button>
          </div>

          <div className="bg-slate-950/20 rounded-xl border border-white/5 overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-slate-950/40 font-semibold text-xs text-white">
              Saved Backup Files
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/40 text-slate-400">
                    <th className="p-3">File Name</th>
                    <th className="p-3">File Size</th>
                    <th className="p-3">Created At</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {backups.map((b, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-3 font-mono font-bold text-teal-400">{b.fileName}</td>
                      <td className="p-3">{(b.sizeBytes / 1024).toFixed(2)} KB</td>
                      <td className="p-3">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDownloadBackup(b.fileName)}
                          className="p-1 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                          title="Download backup file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 && !loadingBackups && (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-500">
                        No backup files found. Trigger one above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </div>
  );
}
