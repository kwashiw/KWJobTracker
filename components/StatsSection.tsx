
import React from 'react';
import { Briefcase, XCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { CareerStats } from '../types';

interface StatsSectionProps {
  stats: CareerStats;
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        label="Total Applied" 
        value={stats.totalApplied.toString()} 
        icon={<Briefcase className="w-5 h-5" />} 
        color="indigo" 
      />
      <StatCard 
        label="Rejections" 
        value={stats.totalRejections.toString()} 
        icon={<XCircle className="w-5 h-5" />} 
        color="rose" 
      />
      <StatCard 
        label="Offers" 
        value={stats.totalOffers.toString()} 
        icon={<CheckCircle2 className="w-5 h-5" />} 
        color="emerald" 
      />
      <StatCard 
        label="Success Rate" 
        value={`${stats.successRate}%`} 
        icon={<TrendingUp className="w-5 h-5" />} 
        color="amber" 
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'indigo' | 'rose' | 'emerald' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</div>
        <div className="text-xs sm:text-sm font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
};

export default StatsSection;
