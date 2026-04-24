
import React, { useState, useMemo } from 'react';
import { Calendar, User, MapPin, ExternalLink, Clock, Briefcase, Bell, ChevronLeft, ChevronRight, List, LayoutGrid } from 'lucide-react';

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
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const upcoming = interviews.filter(i => new Date(i.date) >= new Date());
  const past = interviews.filter(i => new Date(i.date) < new Date()).reverse();

  return (
    <div className="space-y-10 kw-slide-up">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Interview Schedule</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Your upcoming hiring milestones</p>
        </div>
        <div className="flex items-center bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </header>

      {view === 'list' ? (
        <ListView upcoming={upcoming} past={past} onSelectJob={onSelectJob} />
      ) : (
        <CalendarView interviews={interviews} onSelectJob={onSelectJob} />
      )}
    </div>
  );
};

const ListView: React.FC<{ upcoming: AgendaItem[]; past: AgendaItem[]; onSelectJob: (id: string) => void }> = ({ upcoming, past, onSelectJob }) => (
  <>
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
  </>
);

const CalendarView: React.FC<{ interviews: AgendaItem[]; onSelectJob: (id: string) => void }> = ({ interviews, onSelectJob }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const interviewsByDate = useMemo(() => {
    const map: Record<string, AgendaItem[]> = {};
    interviews.forEach(item => {
      const key = new Date(item.date).toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [interviews]);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const monthLabel = firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h3 className="font-display text-base sm:text-xl font-bold text-slate-900 text-center w-28 sm:w-48">{monthLabel}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            onClick={goToToday}
            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--gold)', background: 'var(--gold-dim)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-mid)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold-dim)')}
          >
            Today
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[100px] bg-slate-50/50 border-b border-r border-slate-100 last:border-r-0" />;
            }

            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayInterviews = interviewsByDate[dateKey] || [];
            const isToday = day === today.getDate() && isCurrentMonth;
            const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={dateKey}
                className={`min-h-[100px] p-1.5 border-b border-r border-slate-100 transition-colors ${
                  isPast ? 'bg-slate-50/30' : 'bg-white'
                }`}
                style={isToday ? { background: 'var(--gold-dim)' } : {}}
              >
                <div className="text-right mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${
                      isPast && !isToday ? 'text-slate-300' : isToday ? 'text-white' : 'text-slate-600'
                    }`}
                    style={isToday ? { background: 'var(--gold)' } : {}}
                  >
                    {day}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayInterviews.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onSelectJob(item.jobId)}
                      className={`w-full text-left px-1.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-bold truncate transition-all hover:opacity-80 ${
                        isPast ? 'bg-slate-100 text-slate-400' : ''
                      }`}
                      style={!isPast ? { background: 'var(--gold-mid)', color: 'var(--gold-hover)' } : {}}
                      title={`${item.jobTitle} at ${item.company} — ${item.stage}`}
                    >
                      <span className="font-black">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {' '}{item.company}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border" style={{ background: 'var(--gold-dim)', borderColor: 'var(--gold-border)' }} />
          <span className="text-[9px] font-bold text-slate-400 uppercase">Interview</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--gold)' }} />
          <span className="text-[9px] font-bold text-slate-400 uppercase">Today</span>
        </div>
      </div>
    </div>
  );
};

const AgendaCard: React.FC<{ item: AgendaItem, onSelect: (id: string) => void }> = ({ item, onSelect }) => {
  const dateObj = new Date(item.date);
  const isToday = dateObj.toDateString() === new Date().toDateString();

  return (
    <div
      onClick={() => onSelect(item.jobId)}
      className={`bg-white border p-5 sm:p-6 rounded-[2rem] hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 ${isToday ? 'shadow-xl' : 'border-slate-200'}`}
      style={isToday ? { borderColor: 'var(--gold)', boxShadow: '0 8px 32px rgba(200,147,58,0.15)' } : {}}
    >
      {isToday && <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'var(--gold)' }} />}

      <div className="flex sm:flex-col items-center gap-2 sm:w-20 shrink-0">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'text-white' : 'bg-slate-100 text-slate-600'}`}
          style={isToday ? { background: 'var(--gold)' } : {}}
        >
          <span className="text-[9px] sm:text-xs font-black uppercase">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</span>
          <span className="text-lg sm:text-xl font-black leading-none">{dateObj.getDate()}</span>
        </div>
        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">{dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span
            className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest ${isToday ? '' : 'bg-slate-100 text-slate-500'}`}
            style={isToday ? { background: 'var(--gold-dim)', color: 'var(--gold-hover)' } : {}}
          >
            {item.stage}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Briefcase className="w-3 h-3" style={{ color: 'var(--gold)' }} /> {item.company}
          </div>
          {item.remindersSet && (
            <div className="flex items-center gap-1 text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-black uppercase animate-pulse border border-amber-100">
              <Bell className="w-2.5 h-2.5" /> Follow Up Due
            </div>
          )}
        </div>
        <h4 className="text-sm sm:text-base font-black text-slate-900 transition-colors truncate mb-3 group-hover:text-[#C8933A]">{item.jobTitle}</h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {item.interviewer && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-600">
              <User className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} /> {item.interviewer}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-600">
            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} /> {item.mode}
          </div>
          {item.link && (
            <a
              href={item.link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black hover:underline"
              style={{ color: 'var(--gold)' }}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Join Call
            </a>
          )}
        </div>
      </div>

      <div className="sm:w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 transition-colors hidden sm:flex group-hover:bg-amber-50">
        <Clock className="w-5 h-5 text-slate-300 group-hover:text-[#C8933A]" />
      </div>
    </div>
  );
};

export default InterviewAgenda;
