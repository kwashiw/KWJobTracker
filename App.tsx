import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Briefcase, Search, Settings, Calendar, TrendingUp, 
  ChevronRight, LayoutDashboard, FileText, CheckCircle,
  Sparkles, Award, Bell, X, Archive
} from 'lucide-react';
import { JobApplication, JobStatus, CareerStats, ResumeData } from './types';
import { extractJobDetails } from './services/gemini';
import StatsSection from './components/StatsSection';
import AddJobModal from './components/AddJobModal';
import JobDetailModal from './components/JobDetailModal';
import SettingsModal from './components/SettingsModal';
import InterviewAgenda from './components/InterviewAgenda';
import ResumeLab from './components/ResumeLab';
import OfferComparisonModal from './components/OfferComparisonModal';
import ArchiveView from './components/ArchiveView';

type Tab = 'tracker' | 'interviews' | 'resume' | 'archive';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tracker');
  const [resumeData, setResumeData] = useState<ResumeData>({ type: 'text', content: '', extractedText: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId) || null, [jobs, selectedJobId]);
  const offers = useMemo(() => jobs.filter(j => j.status === JobStatus.OFFER && !j.isArchived), [jobs]);

  useEffect(() => {
    const savedJobs = localStorage.getItem('kw_track_jobs');
    const savedResume = localStorage.getItem('kw_resume_data');
    if (savedJobs) setJobs(JSON.parse(savedJobs));
    if (savedResume) setResumeData(JSON.parse(savedResume));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kw_track_jobs', JSON.stringify(jobs));
    } catch (e) {
      console.error("Failed to save jobs to localStorage", e);
    }
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem('kw_resume_data', JSON.stringify(resumeData));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        alert("Warning: Resume file is too large for local storage. Try a smaller PDF or copy-paste text.");
      }
    }
  }, [resumeData]);

  const stats: CareerStats = useMemo(() => {
    const totalOffers = jobs.filter(j => j.status === JobStatus.OFFER).length;
    const totalRejections = jobs.filter(j => j.status === JobStatus.REJECTED).length;
    // Total Applied reflects everything in the DB as requested
    return {
      totalApplied: jobs.length,
      totalRejections,
      totalOffers,
      successRate: jobs.length > 0 ? Math.round((totalOffers / jobs.length) * 100) : 0
    };
  }, [jobs]);

  const handleAddJob = async (title: string, description: string, url: string) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newJob: JobApplication = {
      id, title, company: "Analyzing...", description, salaryRange: "Analyzing...",
      status: JobStatus.APPLIED, dateAdded: now, dateModified: now, link: url,
      interviews: [], isArchived: false
    };
    setJobs(prev => [newJob, ...prev]);
    setIsAddModalOpen(false);
    try {
      const enriched = await extractJobDetails(description);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, company: enriched.company, salaryRange: enriched.salaryRange } : j));
    } catch {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, company: "Unknown", salaryRange: "Not found" } : j));
    }
  };

  const updateJob = useCallback((id: string, updates: Partial<JobApplication>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates, dateModified: new Date().toISOString() } : j));
  }, []);

  const handleDeleteJob = (id: string) => {
    // Instead of deleting, we archive by default
    updateJob(id, { isArchived: true });
    setSelectedJobId(null);
  };

  const handlePermanentDelete = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setSelectedJobId(null);
  };

  const upcomingInterviews = useMemo(() => {
    return jobs
      .filter(job => job.status !== JobStatus.REJECTED && !job.isArchived)
      .flatMap(job => job.interviews.map(i => ({ ...i, jobTitle: job.title, company: job.company, jobId: job.id })))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [jobs]);

  const pendingActions = useMemo(() => {
    return upcomingInterviews.filter(i => i.remindersSet && i.postTodos.some(t => !t.completed));
  }, [upcomingInterviews]);

  const filteredJobs = useMemo(() => 
    jobs.filter(j => !j.isArchived && j.status !== JobStatus.REJECTED && (
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      j.company.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  , [jobs, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter truncate">KWJobTracker</h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button 
                onClick={() => pendingActions.length > 0 && setShowPending(!showPending)}
                className={`p-2 rounded-full transition-all relative ${pendingActions.length > 0 ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300'}`}
              >
                <Bell className={`w-6 h-6 ${pendingActions.length > 0 && !showPending && 'animate-bounce'}`} />
                {pendingActions.length > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {pendingActions.length}
                  </span>
                )}
              </button>
              
              {showPending && pendingActions.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-[60]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400">Outreach Tasks</h4>
                    <button onClick={() => setShowPending(false)}><X className="w-4 h-4 text-slate-300" /></button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {pendingActions.map(action => (
                      <div key={action.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => { setSelectedJobId(action.jobId); setShowPending(false); }}>
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{action.company}</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight mb-2">{action.stage} Follow-up</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase">
                          <Calendar className="w-3 h-3" /> Due Soon
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 mb-24 lg:mb-16 relative">
        {activeTab === 'tracker' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <StatsSection stats={stats} />
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Funnel</h2>
                {offers.length > 1 && (
                  <button 
                    onClick={() => setIsCompareOpen(true)}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Award className="w-3 h-3" /> Compete Offers
                  </button>
                )}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" placeholder="Filter apps..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedJobId(job.id)} 
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group min-h-[160px] flex flex-col"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                       <h3 className="font-black text-sm group-hover:text-indigo-600 transition-colors truncate">{job.title}</h3>
                       <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest truncate">{job.company}</p>
                    </div>
                    {job.analysis && (
                       <div className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1 shrink-0">
                         <Sparkles className="w-2.5 h-2.5" />
                         {job.analysis.score}%
                       </div>
                    )}
                  </div>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between gap-3 text-slate-400 border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <TrendingUp className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="font-bold text-slate-600 text-[10px] truncate">{job.salaryRange}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="font-medium text-[10px]">{new Date(job.dateAdded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        job.status === JobStatus.OFFER ? 'bg-emerald-50 text-emerald-600' :
                        job.status === JobStatus.INTERVIEWING ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>{job.status}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-all translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setIsAddModalOpen(true)} className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all bg-white/50 h-full min-h-[160px]">
                <Plus className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Add Opportunity</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && <InterviewAgenda interviews={upcomingInterviews} onSelectJob={setSelectedJobId} />}
        {activeTab === 'resume' && <ResumeLab resumeData={resumeData} jobs={jobs} onSaveResume={setResumeData} onUpdateJob={updateJob} />}
        {activeTab === 'archive' && <ArchiveView jobs={jobs} onSelectJob={setSelectedJobId} onRestore={(id) => updateJob(id, { isArchived: false, status: JobStatus.APPLIED })} onDelete={handlePermanentDelete} />}
        
        <div className="lg:hidden text-center mt-12 mb-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] opacity-40 select-none">
          KNAW Labs
        </div>
      </main>

      <div className="hidden lg:block fixed bottom-6 right-6 text-[10px] font-black text-slate-400/60 uppercase tracking-widest z-[100] pointer-events-none select-none">
        KNAW Labs
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 lg:p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <NavButton icon={<LayoutDashboard />} label="Funnel" active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} />
          <NavButton icon={<Calendar />} label="Schedule" active={activeTab === 'interviews'} onClick={() => setActiveTab('interviews')} />
          <NavButton icon={<FileText />} label="Resume" active={activeTab === 'resume'} onClick={() => setActiveTab('resume')} />
          <NavButton icon={<Archive />} label="Archive" active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} />
        </div>
      </nav>

      <AddJobModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddJob} />
      <JobDetailModal 
        job={selectedJob} onClose={() => setSelectedJobId(null)} 
        onDelete={handleDeleteJob} 
        onUpdateJob={(updates) => selectedJob && updateJob(selectedJob.id, updates)} 
        resume={resumeData.extractedText}
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentData={{ jobs }} onImport={data => setJobs(data.jobs)} onReset={() => setJobs([])} />
      <OfferComparisonModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} offers={offers} />
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default App;