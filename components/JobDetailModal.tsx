import React from 'react';
import { X, Trash2, ExternalLink, Calendar, Briefcase, TrendingUp, Clock } from 'lucide-react';
import { JobApplication, JobStatus } from '../types';

interface JobDetailModalProps {
  job: JobApplication | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onDelete, onUpdateStatus }) => {
  if (!job) return null;

  const handleConfirmDelete = (e: React.MouseEvent) => {
    // Prevent any bubbling or default actions that might interfere with state updates
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = window.confirm("Are you sure? This will remove the role from your tracker and all statistics.");
    
    if (confirmed) {
      // The parent App.tsx handler is optimized to close this window first and then filter state
      onDelete(job.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex-1 mr-4 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {job.link ? (
                <a 
                  href={job.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 min-w-0"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {job.title}
                  </h2>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                </a>
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{job.title}</h2>
              )}
            </div>
            <p className="text-slate-500 font-medium text-base sm:text-lg flex items-center gap-2 truncate">
              <Briefcase className="w-4 h-4 shrink-0" /> {job.company}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <X className="w-5 sm:w-6 h-5 sm:h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Salary Range
              </div>
              <div className="text-slate-900 font-semibold">{job.salaryRange}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Date Added
              </div>
              <div className="text-slate-900 font-semibold">
                {new Date(job.dateAdded).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Application Status
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(JobStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(job.id, status)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border-2 ${
                    job.status === status
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-bold text-slate-700">Job Description</label>
            <div className="bg-slate-50 rounded-xl p-4 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
              {job.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <button 
            type="button"
            onClick={handleConfirmDelete}
            className="flex items-center gap-2 text-rose-600 font-bold hover:bg-rose-100 px-4 py-2 rounded-lg transition-all text-sm group"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Delete Role
          </button>
          
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-right">
            Modified: {new Date(job.dateModified).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;