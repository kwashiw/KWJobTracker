import React from 'react';
import { Archive, Trash2, RefreshCw, Briefcase, Calendar } from 'lucide-react';
import { JobApplication, JobStatus } from '../types';

interface ArchiveViewProps {
  jobs: JobApplication[];
  onSelectJob: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ jobs, onSelectJob, onRestore, onDelete }) => {
  const archivedJobs = jobs.filter(j => j.isArchived || j.status === JobStatus.REJECTED);

  return (
    <div className="space-y-10 kw-slide-up">
      <header>
        <h2 className="font-display text-3xl font-bold text-slate-900">The Archive</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Closed records and rejected opportunities</p>
      </header>

      {archivedJobs.length === 0 ? (
        <div className="py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
          <Archive className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest">Nothing Archived</h3>
          <p className="text-slate-300 font-bold text-[11px] mt-2">Only rejected or explicitly deleted jobs end up here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {archivedJobs.map(job => (
            <div
              key={job.id}
              className="bg-white border border-slate-200 p-5 sm:p-6 rounded-[2rem] hover:shadow-xl transition-all group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 opacity-80 hover:opacity-100 min-w-0 overflow-hidden"
            >
              <div className="flex-1 min-w-0" onClick={() => onSelectJob(job.id)}>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest ${job.status === JobStatus.REJECTED ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {job.status}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Briefcase className="w-3 h-3" style={{ color: 'var(--gold)' }} /> {job.company}
                  </div>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 truncate cursor-pointer transition-colors group-hover:text-[#C8933A]">
                  {job.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1">
                  <Calendar className="w-3.5 h-3.5" /> Added {new Date(job.dateAdded).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onRestore(job.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  style={{ color: 'var(--gold)', background: 'var(--gold-dim)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-mid)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold-dim)')}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restore
                </button>
                <button
                  onClick={() => { if(window.confirm("Permanently delete this record? This action cannot be undone.")) onDelete(job.id); }}
                  className="p-2.5 text-rose-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-4">
          <h3 className="font-display text-2xl font-bold">Historical Data Preservation</h3>
          <p className="text-xs font-bold leading-relaxed opacity-80">
            Archived records are kept to ensure your Career Engine stats remain accurate. Every application represents growth and experience, regardless of the outcome.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/4" />
      </div>
    </div>
  );
};

export default ArchiveView;
