import React, { useState, useRef, useEffect } from 'react';
import { X, Link as LinkIcon, FileText, Type, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { magicImport } from '../services/gemini';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, url: string) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const prevUrlRef = useRef(url);

  // Clear import status when URL changes
  useEffect(() => {
    if (prevUrlRef.current !== url) {
      setImportStatus(null);
      prevUrlRef.current = url;
    }
  }, [url]);

  if (!isOpen) return null;

  const handleMagicImport = async () => {
    if (!url || !url.startsWith('http')) {
      setImportStatus({ type: 'error', message: "Please enter a valid URL starting with http." });
      return;
    }
    setIsFetching(true);
    setImportStatus(null);
    try {
      const result = await magicImport(url);
      const { data, warning } = result;

      // Populate fields with whatever we got
      if (data.description && data.description.length > 10) {
        setDescription(data.description);
      }
      if (data.title && data.title !== "Not found" && !title) {
        setTitle(data.title);
      }

      // Determine feedback
      const populated: string[] = [];
      if (data.title && data.title !== "Not found") populated.push("title");
      if (data.description && data.description.length > 10) populated.push("description");
      if (data.company && data.company !== "Unknown") populated.push("company");

      if (populated.length > 0) {
        setImportStatus({
          type: warning ? 'warning' : 'success',
          message: warning
            ? warning
            : `Found ${populated.join(", ")} for ${data.company || "this job"}.`
        });
      } else {
        setImportStatus({
          type: 'error',
          message: warning || "Could not extract job details. Please paste the description manually."
        });
      }
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: "An unexpected error occurred. Please paste the job description manually."
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    onAdd(title, description, url);
    setTitle("");
    setUrl("");
    setDescription("");
    setImportStatus(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">New Application</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Type className="w-3.5 h-3.5" /> Job Title
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5" /> Job URL
              </label>
              <button
                type="button"
                onClick={handleMagicImport}
                disabled={isFetching || !url}
                className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 disabled:opacity-50 transition-all"
              >
                {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Magic Import
              </button>
            </div>
            <input
              type="url"
              placeholder="Paste job posting link..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {importStatus && (
              <div className={`mt-2 px-3 py-2.5 rounded-xl text-[11px] font-bold flex items-start gap-2 ${
                importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                importStatus.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {importStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span className="leading-relaxed flex-1">{importStatus.message}</span>
                <button
                  type="button"
                  onClick={() => setImportStatus(null)}
                  className="shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Job Description
            </label>
            <textarea
              required
              rows={6}
              placeholder="Paste details here. AI will extract company & salary automatically..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-xs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
            >
              Add to Tracker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobModal;
