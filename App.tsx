
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Briefcase, 
  Search,
  Settings,
  Calendar, 
  TrendingUp, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { JobApplication, JobStatus, CareerStats } from './types';
import { extractJobDetails } from './services/gemini';
import StatsSection from './components/StatsSection';
import AddJobModal from './components/AddJobModal';
import JobDetailModal from './components/JobDetailModal';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [historicalRejections, setHistoricalRejections] = useState<number>(0);
  const [historicalOffers, setHistoricalOffers] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedJob = useMemo(() => 
    jobs.find(j => j.id === selectedJobId) || null
  , [jobs, selectedJobId]);

  useEffect(() => {
    const savedJobs = localStorage.getItem('kw_track_jobs');
    const savedHistRej = localStorage.getItem('kw_track_historical_rejections');
    const savedHistOff = localStorage.getItem('kw_track_historical_offers');
    
    if (savedJobs) setJobs(JSON.parse(savedJobs));
    if (savedHistRej) setHistoricalRejections(parseInt(savedHistRej, 10));
    if (savedHistOff) setHistoricalOffers(parseInt(savedHistOff, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem('kw_track_jobs', JSON.stringify(jobs));
    localStorage.setItem('kw_track_historical_rejections', historicalRejections.toString());
    localStorage.setItem('kw_track_historical_offers', historicalOffers.toString());
  }, [jobs, historicalRejections, historicalOffers]);

  const stats: CareerStats = useMemo(() => {
    const currentOffersCount = jobs.filter(j => j.status === JobStatus.OFFER).length;
    const totalOffers = historicalOffers + currentOffersCount;
    const totalApplied = jobs.length + historicalRejections + historicalOffers;
    const successRate = totalApplied > 0 ? (totalOffers / totalApplied) * 100 : 0;

    return {
      totalApplied,
      totalRejections: historicalRejections,
      totalOffers,
      successRate: Math.round(successRate)
    };
  }, [jobs, historicalRejections, historicalOffers]);

  const handleAddJob = async (title: string, description: string, url: string) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newJob: JobApplication = {
      id,
      title,
      company: "Analyzing...",
      description,
      salaryRange: "Analyzing...",
      status: JobStatus.APPLIED,
      dateAdded: now,
      dateModified: now,
      link: url
    };
    
    setJobs(prev => [newJob, ...prev]);
    setIsAddModalOpen(false);

    try {
      const enriched = await extractJobDetails(description);
      setJobs(prev => prev.map(j => j.id === id ? { 
        ...j, 
        company: enriched.company, 
        salaryRange: enriched.salaryRange 
      } : j));
    } catch (err) {
      setJobs(prev => prev.map(j => j.id === id ? { 
        ...j, 
        company: "Unknown", 
        salaryRange: "Not found" 
      } : j));
    }
  };

  const handleDeleteJob = (id: string) => {
    setHistoricalRejections(prev => prev + 1);
    setJobs(prev => prev.filter(j => j.id !== id));
    setSelectedJobId(null);
  };

  const updateJobStatus = (id: string, newStatus: JobStatus) => {
    if (newStatus === JobStatus.REJECTED) {
      setHistoricalRejections(prev => prev + 1);
      setJobs(prev => prev.filter(j => j.id !== id));
      setSelectedJobId(null);
    } else {
      setJobs(prev => prev.map(j => j.id === id ? { 
        ...j, 
        status: newStatus, 
        dateModified: new Date().toISOString() 
      } : j));
    }
  };

  const handleImport = (data: { jobs: JobApplication[], historicalRejections: number, historicalOffers?: number }) => {
    setJobs(data.jobs);
    setHistoricalRejections(data.historicalRejections);
    setHistoricalOffers(data.historicalOffers || 0);
    setIsSettingsOpen(false);
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24 md:pb-10 bg-slate-50/50 text-slate-900">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 hidden sm:block tracking-tight">KWJobTracker</h1>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tracker..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-300 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title="Sync & Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-100 active:scale-95 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Job</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-10">
        <StatsSection stats={stats} />

        <div className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight px-1">Active Tracker</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{jobs.length} Items</span>
          </div>

          {/* List/Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
            {filteredJobs.length > 0 ? (
              filteredJobs.map(job => (
                <div 
                  key={job.id} 
                  className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group flex flex-col sm:h-full active:scale-[0.99] relative overflow-hidden"
                  onClick={() => setSelectedJobId(job.id)}
                >
                  {/* Status Strip for Mobile - minimal visual indicator */}
                  <div className={`sm:hidden absolute left-0 top-0 bottom-0 w-1 ${
                    job.status === JobStatus.OFFER ? 'bg-emerald-500' :
                    job.status === JobStatus.INTERVIEWING ? 'bg-amber-500' :
                    'bg-slate-300'
                  }`} />

                  {/* Top Row: Title & Status */}
                  <div className="flex justify-between items-start mb-1 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-lg group-hover:text-indigo-600 transition-colors truncate">
                          {job.title}
                        </h3>
                        {job.link && (
                          <a 
                            href={job.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-300 hover:text-indigo-500 transition-colors shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px] sm:text-sm font-semibold truncate">{job.company}</p>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-[8px] sm:text-[10px] uppercase font-black tracking-widest px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded sm:rounded-lg shrink-0 ${
                      job.status === JobStatus.OFFER ? 'bg-emerald-100 text-emerald-700 sm:border sm:border-emerald-200' :
                      job.status === JobStatus.INTERVIEWING ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  {/* Info Row: Salary & Dates */}
                  <div className="flex flex-col sm:space-y-3 mb-1 sm:mb-6">
                    <div className="flex items-center justify-between sm:justify-start gap-2 text-[10px] sm:text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-slate-400" />
                        <span className="font-bold text-slate-700 sm:bg-slate-50 sm:px-2 sm:py-0.5 sm:rounded sm:border sm:border-slate-100 truncate">
                          {job.salaryRange}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:hidden opacity-60">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(job.dateAdded).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Desktop Only Date Display */}
                    <div className="hidden sm:flex items-center gap-2.5 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Added {new Date(job.dateAdded).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Footer - Modified Date & Icon (Desktop Only Chevron style) */}
                  <div className="hidden sm:flex mt-auto pt-5 border-t border-slate-50 items-center justify-between">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      MODIFIED {new Date(job.dateModified).toLocaleDateString()}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                    </div>
                  </div>
                  
                  {/* Mobile Modified Date Indicator */}
                  <div className="sm:hidden mt-1 pt-1.5 border-t border-slate-50 flex justify-between items-center text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                    <span>Last touch: {new Date(job.dateModified).toLocaleDateString()}</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 sm:py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 rotate-3">
                  <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-black text-xl sm:text-2xl tracking-tight">Tracker is empty</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2 font-medium px-4 text-sm sm:text-base">Add a new job description to start tracking your journey.</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-6 sm:mt-8 bg-slate-900 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                >
                  Add Your First Job
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddJobModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddJob} />
      <JobDetailModal job={selectedJob} onClose={() => setSelectedJobId(null)} onDelete={handleDeleteJob} onUpdateStatus={updateJobStatus} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentData={{ jobs, historicalRejections, historicalOffers }}
        onImport={handleImport}
      />

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-400/50 flex items-center justify-center hover:scale-105 active:scale-90 transition-all z-40 border-2 border-white"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default App;
