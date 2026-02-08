
import React from 'react';
import { Calendar, User, MapPin, ExternalLink, Clock, Briefcase, Bell } from 'lucide-react';

interface AgendaItem {
  id: string;
  stage: string;
  interviewer: string;
  date: string;
  mode: string;
  link?: string;
  jobTitle: string;
  company: string;
  jobId: string;
  remindersSet?: boolean;
}

interface InterviewAgendaProps {
  interviews: AgendaItem[];
  onSelectJob: (id: string) => void;
}

const InterviewAgenda: React.FC<InterviewAgendaProps> = ({ interviews, onSelectJob }) => {
  const upcoming = interviews.filter(i => new Date(i.date) >= new Date());
  const past = interviews.filter(i => new Date(i.date) < new Date()).reverse();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Interview Schedule</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Your upcoming hiring milestones</p>
      </header>

      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Upcoming Events</h3>
        {upcoming.length === 0 ? (
          <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">Clear schedule. Go get some interviews!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map(item => (
              <AgendaCard key={item.id} item={item} onSelect={onSelectJob} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">History</h3>
          <div className="grid gap-4">
            {past.map(item => (
              <AgendaCard key={item.id} item={item} onSelect={onSelectJob} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Use React.FC to properly handle standard React props like 'key' in JSX maps
const AgendaCard: React.FC<{ item: AgendaItem, onSelect: (id: string) => void }> = ({ item, onSelect }) => {
  const dateObj = new Date(item.date);
  const isToday = dateObj.toDateString() === new Date().toDateString();

  return (
    <div 
      onClick={() => onSelect(item.jobId)}
      className={`bg-white border p-5 sm:p-6 rounded-[2rem] hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 ${isToday ? 'border-indigo-400 shadow-xl shadow-indigo-100' : 'border-slate-200'}`}
    >
      {isToday && <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />}
      
      <div className="flex sm:flex-col items-center gap-2 sm:w-20 shrink-0">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <span className="text-[9px] sm:text-xs font-black uppercase">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</span>
          <span className="text-lg sm:text-xl font-black leading-none">{dateObj.getDate()}</span>
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">{dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest ${isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
            {item.stage}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Briefcase className="w-3 h-3 text-indigo-300" /> {item.company}
          </div>
          {item.remindersSet && (
            <div className="flex items-center gap-1 text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-black uppercase animate-pulse border border-amber-100">
              <Bell className="w-2.5 h-2.5" /> Follow Up Due
            </div>
          )}
        </div>
        <h4 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate mb-3">{item.jobTitle}</h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {item.interviewer && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-600">
              <User className="w-3.5 h-3.5 text-indigo-400" /> {item.interviewer}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {item.mode}
          </div>
          {item.link && (
            <a 
              href={item.link} target="_blank" rel="noreferrer" 
              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-indigo-600 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Join Call
            </a>
          )}
        </div>
      </div>
      
      <div className="sm:w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors hidden sm:flex">
        <Clock className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
      </div>
    </div>
  );
};

export default InterviewAgenda;
