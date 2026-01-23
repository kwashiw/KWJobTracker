
import React, { useState, useRef } from 'react';
import { X, Download, Upload, Copy, Check, ShieldCheck, Terminal } from 'lucide-react';
import { JobApplication } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: { jobs: JobApplication[], historicalRejections: number, historicalOffers: number };
  onImport: (data: { jobs: JobApplication[], historicalRejections: number, historicalOffers: number }) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentData, onImport }) => {
  const [copying, setCopying] = useState(false);
  const [syncInput, setSyncInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper: UTF-8 safe base64 encoding
  const encodeBase64 = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  // Helper: UTF-8 safe base64 decoding
  const decodeBase64 = (base64: string) => {
    return decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `kw_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleCopySyncString = () => {
    try {
      const dataStr = encodeBase64(JSON.stringify(currentData));
      navigator.clipboard.writeText(dataStr);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Sync code generation failed", err);
      alert("Failed to generate sync code. Please try exporting to a file instead.");
    }
  };

  const handleImportSyncCode = () => {
    const cleanInput = syncInput.trim();
    if (!cleanInput) return;
    
    try {
      const decodedStr = decodeBase64(cleanInput);
      const decoded = JSON.parse(decodedStr);
      
      if (decoded.jobs && Array.isArray(decoded.jobs)) {
        if (window.confirm("Overwrite current device data with this Sync Code?")) {
          onImport(decoded);
          setSyncInput("");
        }
      } else {
        alert("Invalid Sync Code format.");
      }
    } catch (err) {
      console.error("Sync code import failed", err);
      alert("Failed to read Sync Code. Make sure you copied the whole string exactly as it was generated.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.jobs && Array.isArray(json.jobs)) {
          if (window.confirm("Restore this backup? Current data will be replaced.")) {
            onImport(json);
          }
        } else {
          alert("Selected file is not a valid KWJobTracker backup.");
        }
      } catch (err) {
        alert("Invalid backup file: could not parse JSON.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Sync & Privacy</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-indigo-900 leading-relaxed">
              KWJobTracker is device-local. All your data, including historical rejections and offers, is synced via this code.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share to other device</h3>
            <button 
              onClick={handleCopySyncString}
              className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
            >
              <div className="flex items-center gap-3">
                {copying ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                <div className="text-left">
                  <div className="font-bold">{copying ? "Code Copied!" : "Copy Sync Code"}</div>
                  <div className="text-[10px] opacity-70">Transfer everything to your other device</div>
                </div>
              </div>
            </button>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Terminal className="w-3 h-3" /> Paste Sync Code here
              </label>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20"
                placeholder="Paste code from your other device..."
                value={syncInput}
                onChange={(e) => setSyncInput(e.target.value)}
              />
              <button 
                onClick={handleImportSyncCode}
                disabled={!syncInput.trim()}
                className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import from Code
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">File Backups</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm"
              >
                <Upload className="w-4 h-4" /> Restore
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
            KWJobTracker Engine • Privacy First
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
