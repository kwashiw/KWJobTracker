
import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText, Type } from 'lucide-react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string, url: string) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    onAdd(title, description, url);
    setTitle("");
    setUrl("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">New Application</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" /> Job Title
            </label>
            <input 
              required
              type="text" 
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Job URL (Optional)
            </label>
            <input 
              type="url" 
              placeholder="https://linkedin.com/jobs/..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Job Description
            </label>
            <textarea 
              required
              rows={8}
              placeholder="Paste the job description here. Our AI will automatically extract the salary range and company name..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
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
