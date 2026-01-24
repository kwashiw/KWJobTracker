import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText, Type, Sparkles, Loader2 } from 'lucide-react';
import { fetchJobFromUrl } from '../services/gemini';

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

  if (!isOpen) return null;

  const handleMagicImport = async () => {
    if (!url || !url.startsWith('http')) {
      alert("Please enter a valid URL first.");
      return;
    }
    setIsFetching(true);
    try {
      const data = await fetchJobFromUrl(url);
      if (data.description) setDescription(data.description);
      // Optional: if we could also get title we would set it, 
      // but for now we let the user confirm.
      alert(`AI found details for ${data.company}! Description populated.`);
    } catch (err) {
      alert("Could not fetch details from this URL. Please paste description manually.");
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
              placeholder="Paste LinkedIn or Indeed link..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
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