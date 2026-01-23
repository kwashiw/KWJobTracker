
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 sm:space-y-8">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Salary Range
              </div>
              <div className="text-slate-900 font-semibold text-sm sm:text-base">{job.salaryRange}</div>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Date Applied
              </div>
              <div className="text-slate-900 font-semibold text-sm sm:text-base">
                {new Date(job.dateAdded).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Application Status
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Object.values(JobStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(job.id, status)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border-2 ${
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

          {/* Description */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm font-bold text-slate-700">Job Description</label>
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
              {job.description}
            </div>
          </div>
        </div>

        {/* Footer - Optimized for Mobile */}
        <div className="p-3 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 overflow-hidden">
          <button 
            onClick={() => {
              if (window.confirm("Delete this role? This will mark it as a 'Rejection' for your success rate statistics.")) {
                onDelete(job.id);
              }
            }}
            className="flex items-center gap-1.5 text-rose-600 font-bold hover:bg-rose-100 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-[10px] sm:text-sm whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Delete Role
          </button>
          
          <div className="text-[9px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-tight text-right truncate">
            Modified: {new Date(job.dateModified).toLocaleDateString()} {new Date(job.dateModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
