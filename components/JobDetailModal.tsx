
import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, ExternalLink, Calendar, Briefcase, TrendingUp, Clock, 
  Plus, CheckCircle2, Circle, Link as LinkIcon, User, MapPin, Sparkles, Loader2,
  Bell, BellOff, Send, Globe, AlertTriangle, Edit2, Save, RotateCcw, RefreshCw, Archive
} from 'lucide-react';
import { JobApplication, JobStatus, Interview, TodoItem } from '../types';
import { analyzeJobMatch } from '../services/gemini';

interface JobDetailModalProps {
  job: JobApplication | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateJob: (updates: Partial<JobApplication>) => void;
  resume: string;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onDelete, onUpdateJob, resume }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState<{ [key: string]: string }>({});
  const [activeTaskInput, setActiveTaskInput] = useState<{ id: string, type: 'pre' | 'post' | null }>({ id: '', type: null });
  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    title: '',
    company: '',
    salaryRange: '',
    description: ''
  });

  // Sync edit fields when entering edit mode or when job changes
  useEffect(() => {
    if (job) {
      setEditFields({
        title: job.title,
        company: job.company,
        salaryRange: job.salaryRange,
        description: job.description
      });
    }
  }, [job, isEditing]);

  if (!job) return null;

  const handleStatusChange = (status: JobStatus) => {
    onUpdateJob({ status });
  };

  const handleSaveChanges = () => {
    onUpdateJob({
      title: editFields.title,
      company: editFields.company,
      salaryRange: editFields.salaryRange,
      description: editFields.description
    });
    setIsEditing(false);
  };

  const handleRestore = () => {
    onUpdateJob({ isArchived: false, status: JobStatus.APPLIED });
    onClose();
  };

  const handleAddInterview = () => {
    const newInterview: Interview = {
      id: crypto.randomUUID(),
      stage: "New Step",
      interviewer: "",
      date: new Date().toISOString().slice(0, 16),
      mode: 'Remote',
      preTodos: [],
      postTodos: [],
      remindersSet: false
    };
    onUpdateJob({ interviews: [...job.interviews, newInterview], status: JobStatus.INTERVIEWING });
  };

  const updateInterview = (id: string, updates: Partial<Interview>) => {
    onUpdateJob({
      interviews: job.interviews.map(i => i.id === id ? { ...i, ...updates } : i)
    });
  };

  const deleteInterview = (id: string) => {
    onUpdateJob({
      interviews: job.interviews.filter(i => i.id !== id)
    });
  };

  const handleAddTask = (interviewId: string, type: 'pre' | 'post') => {
    const text = newTaskText[`${interviewId}-${type}`];
    if (!text?.trim()) return;

    const interview = job.interviews.find(i => i.id === interviewId);
    if (!interview) return;

    const newItem = { id: crypto.randomUUID(), text: text.trim(), completed: false };
    const list = type === 'pre' ? interview.preTodos : interview.postTodos;
    
    updateInterview(interviewId, type === 'pre' ? { preTodos: [...list, newItem] } : { postTodos: [...list, newItem] });
    setNewTaskText(prev => ({ ...prev, [`${interviewId}-${type}`]: '' }));
    setActiveTaskInput({ id: '', type: null });
  };

  const toggleTodo = (interviewId: string, todoId: string, type: 'pre' | 'post') => {
    const interview = job.interviews.find(i => i.id === interviewId);
    if (!interview) return;

    const list = type === 'pre' ? interview.preTodos : interview.postTodos;
    const newList = list.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
    
    updateInterview(interviewId, type === 'pre' ? { preTodos: newList } : { postTodos: newList });
  };

  const runAnalysis = async () => {
    if (!resume) {
      alert("Please upload your resume in 'Resume Lab' first!");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeJobMatch(resume, job.description);
      if (result.strengths.length === 0 && result.gaps.length === 0 && result.score === 0) {
        throw new Error("Analysis failed to generate results. Please try again.");
      }
      onUpdateJob({ analysis: result });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      const status = err?.status || err?.code;
      
      if (msg.toLowerCase().includes('overloaded') || status === 503) {
        setError("AI Engine Overloaded: Google's servers are currently at capacity. We tried retrying, but they're still busy. Please try again in a few minutes.");
      } else if (msg.toLowerCase().includes('429') || status === 429) {
        setError("Rate Limit Reached: Too many requests at once. Please wait about 60 seconds before retrying.");
      } else if (msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('safety')) {
        setError("Content Blocked: The AI safety filters flagged your resume content. Try simplifying the text.");
      } else {
        const cleanMsg = msg.length > 100 ? msg.slice(0, 100) + "..." : msg;
        setError(`Analysis Error: ${cleanMsg || "The service is temporarily unavailable. Please check your connection."}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-white z-20">
          <div className="flex-1 min-w-0 pr-4">
            {isEditing ? (
              <div className="space-y-2 max-w-xl">
                <input 
                  value={editFields.title}
                  onChange={e => setEditFields({ ...editFields, title: e.target.value })}
                  placeholder="Job Title"
                  className="w-full text-lg sm:text-2xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <input 
                    value={editFields.company}
                    onChange={e => setEditFields({ ...editFields, company: e.target.value })}
                    placeholder="Company Name"
                    className="flex-1 text-[10px] sm:text-xs font-black text-indigo-600 uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 truncate">{job.title}</h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs mt-1">
                  <span className="flex items-center gap-1 shrink-0 truncate max-w-[120px] sm:max-w-none font-black text-indigo-600/80"><Briefcase className="w-3.5 h-3.5" /> {job.company}</span>
                  {job.link && (
                    <a 
                      href={job.link} target="_blank" rel="noreferrer" 
                      className="text-indigo-600 hover:underline flex items-center gap-1 shrink-0 px-2 py-0.5 bg-indigo-50 rounded"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" /> Job Link
                    </a>
                  )}
                  {job.isArchived && (
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black text-[8px] sm:text-[9px] uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Archived
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                  title="Cancel Changes"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSaveChanges} 
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </>
            ) : (
              !job.isArchived && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                  title="Edit Details"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 bg-slate-50/50">
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* AI Match Display */}
              {!isEditing && !job.isArchived && (
                <div className="bg-slate-900 rounded-2xl p-3 sm:p-5 text-white flex items-center justify-between gap-4 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${job.analysis ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">AI Compatibility Score</h3>
                      <div className="flex items-center gap-2">
                         <p className="text-xs sm:text-sm font-black">{job.analysis ? `${job.analysis.score}% Fit` : 'Ready to Analyze'}</p>
                         <button 
                          onClick={runAnalysis} 
                          disabled={isAnalyzing} 
                          className="text-[8px] sm:text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                        >
                          {isAnalyzing ? 'Thinking Deeply...' : (job.analysis ? 'Re-Analyze' : 'Run Fit Check')}
                         </button>
                      </div>
                    </div>
                  </div>
                  {isAnalyzing && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-indigo-500" />}
                </div>
              )}

              {error && !isEditing && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-700 animate-in slide-in-from-top-2">
                  <div className="p-2 bg-rose-100 rounded-lg shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider mb-0.5">Engine Hiccup</p>
                    <p className="text-[11px] font-bold leading-tight opacity-80">{error}</p>
                  </div>
                </div>
              )}

              {job.analysis && !isEditing && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 sm:p-3 rounded-xl">
                    <h4 className="text-[7px] sm:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 sm:mb-1.5">Top Strengths</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.analysis.strengths.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-[7px] sm:text-[8px] bg-white text-emerald-700 px-1 py-0.5 rounded font-bold border border-emerald-100">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-2 sm:p-3 rounded-xl">
                    <h4 className="text-[7px] sm:text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1 sm:mb-1.5">Focus Areas</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.analysis.gaps.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-[7px] sm:text-[8px] bg-white text-rose-700 px-1 py-0.5 rounded font-bold border border-rose-100">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-4 sm:p-7 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-slate-50 pb-3 sm:pb-4">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Description</h3>
                  {isEditing ? (
                    <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-lg">
                      <TrendingUp className="w-3 h-3 text-indigo-600" />
                      <input 
                        value={editFields.salaryRange}
                        onChange={e => setEditFields({ ...editFields, salaryRange: e.target.value })}
                        placeholder="Salary Range"
                        className="text-[9px] sm:text-[10px] font-black text-indigo-600 bg-transparent border-none p-0 focus:ring-0 outline-none w-24"
                      />
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {job.salaryRange}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <textarea 
                    value={editFields.description}
                    onChange={e => setEditFields({ ...editFields, description: e.target.value })}
                    rows={12}
                    className="w-full text-[11px] sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                    placeholder="Paste the full job description here..."
                  />
                ) : (
                  <div className="text-[11px] sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {job.description}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Area */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm lg:sticky lg:top-6">
                <div className="space-y-6">
                  {/* Status Control */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Current Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(JobStatus).map(s => (
                        <button 
                          key={s} 
                          onClick={() => handleStatusChange(s)} 
                          className={`px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${job.status === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interview Timeline */}
                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Interviews</h3>
                      {!job.isArchived && (
                        <button onClick={handleAddInterview} className="bg-slate-900 text-white p-1.5 rounded-lg transition-transform active:scale-90 shadow-lg shadow-slate-200">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {job.interviews.map((interview, idx) => (
                        <div key={interview.id} className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100 relative shadow-sm">
                          {!job.isArchived && (
                            <button 
                              onClick={() => deleteInterview(interview.id)} 
                              className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-white text-indigo-600 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm border border-slate-100">
                              {idx + 1}
                            </div>
                            <input 
                              disabled={job.isArchived}
                              value={interview.stage} 
                              onChange={e => updateInterview(interview.id, { stage: e.target.value })}
                              className="bg-transparent border-none font-black text-slate-800 focus:ring-0 text-xs p-0 flex-1 outline-none disabled:opacity-70"
                              placeholder="Step name..."
                            />
                          </div>

                          <div className="space-y-2.5">
                             <div className="flex items-center gap-2 text-slate-500">
                               <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                               <input 
                                  disabled={job.isArchived}
                                  type="datetime-local" 
                                  value={interview.date} 
                                  onChange={e => updateInterview(interview.id, { date: e.target.value })}
                                  className="bg-transparent border-none text-[10px] font-bold focus:ring-0 p-0 w-full disabled:opacity-70"
                                />
                             </div>
                             <div className="flex items-center gap-2 text-slate-500">
                               <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                               <select 
                                 disabled={job.isArchived}
                                 value={interview.mode}
                                 onChange={e => updateInterview(interview.id, { mode: e.target.value as any })}
                                 className="bg-transparent border-none text-[10px] font-bold focus:ring-0 p-0 w-full cursor-pointer disabled:opacity-70"
                               >
                                 <option value="Remote">Remote</option>
                                 <option value="In-Person">In-Person</option>
                               </select>
                             </div>
                             {interview.mode === 'Remote' && (
                               <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                                 <LinkIcon className="w-3 h-3 text-indigo-600 shrink-0" />
                                 <input 
                                    disabled={job.isArchived}
                                    placeholder="Meeting link..." 
                                    value={interview.link || ""} 
                                    onChange={e => updateInterview(interview.id, { link: e.target.value })}
                                    className="bg-transparent border-none text-[10px] font-black text-indigo-600 focus:ring-0 p-0 flex-1 truncate disabled:opacity-70"
                                  />
                                  {interview.link && (
                                    <a 
                                      href={interview.link} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 shrink-0"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      Join
                                    </a>
                                  )}
                               </div>
                             )}
                          </div>

                          <button 
                            disabled={job.isArchived}
                            onClick={() => updateInterview(interview.id, { remindersSet: !interview.remindersSet })}
                            className={`w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest px-2.5 py-2 rounded-lg transition-all ${interview.remindersSet ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'} disabled:opacity-50`}
                          >
                            {interview.remindersSet ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                            {interview.remindersSet ? 'Alerts On' : 'Set Alerts'}
                          </button>

                          <div className="space-y-4 pt-2">
                             <div>
                               <div className="flex items-center justify-between mb-2">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasks & Prep</span>
                                 {!job.isArchived && <button onClick={() => setActiveTaskInput({ id: interview.id, type: 'post' })} className="text-indigo-600 p-0.5"><Plus className="w-3.5 h-3.5" /></button>}
                               </div>
                               {activeTaskInput.id === interview.id && activeTaskInput.type === 'post' && (
                                 <div className="flex items-center gap-1 mb-2 animate-in slide-in-from-top-1">
                                   <input 
                                     autoFocus placeholder="New task..."
                                     className="text-[10px] bg-white border border-slate-200 rounded-lg p-2 flex-1 focus:outline-none shadow-sm"
                                     value={newTaskText[`${interview.id}-post`] || ''}
                                     onChange={e => setNewTaskText(prev => ({ ...prev, [`${interview.id}-post`]: e.target.value }))}
                                     onKeyDown={e => e.key === 'Enter' && handleAddTask(interview.id, 'post')}
                                   />
                                   <button onClick={() => handleAddTask(interview.id, 'post')} className="bg-slate-900 text-white p-2 rounded-lg shadow-sm"><Send className="w-3 h-3" /></button>
                                 </div>
                               )}
                               <div className="space-y-2">
                                 {interview.postTodos.map(todo => (
                                   <div key={todo.id} onClick={() => !job.isArchived && toggleTodo(interview.id, todo.id, 'post')} className={`flex items-start gap-2 ${job.isArchived ? '' : 'cursor-pointer group/todo'}`}>
                                     {todo.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className={`w-3.5 h-3.5 ${job.isArchived ? 'text-slate-200' : 'text-slate-300 group-hover/todo:text-indigo-400'} shrink-0 mt-0.5 transition-colors`} />}
                                     <span className={`text-[10px] leading-tight flex-1 ${todo.completed ? 'text-slate-400 line-through font-medium' : 'text-slate-700 font-bold'}`}>{todo.text}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0 z-20">
          {job.isArchived ? (
            <button onClick={handleRestore} className="text-emerald-600 font-black text-[9px] sm:text-xs uppercase flex items-center gap-2 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Restore to Funnel
            </button>
          ) : (
            <button onClick={() => onDelete(job.id)} className="text-rose-600 font-black text-[9px] sm:text-xs uppercase flex items-center gap-2 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all">
              <Archive className="w-3.5 h-3.5" /> Archive Application
            </button>
          )}
          <div className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest text-right">
            Updated: {new Date(job.dateModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
