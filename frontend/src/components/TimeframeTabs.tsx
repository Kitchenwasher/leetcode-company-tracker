import React from 'react';
import { Timeframe, CompanyMeta } from '../types';
import { Flame, Clock, Calendar, History, Globe } from 'lucide-react';

interface TimeframeTabsProps {
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  companyMeta?: CompanyMeta;
}

const TIMEFRAMES: { id: Timeframe; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'thirty-days', label: 'Last 30 Days', shortLabel: '30 Days', icon: Flame },
  { id: 'three-months', label: 'Last 3 Months', shortLabel: '3 Months', icon: Clock },
  { id: 'six-months', label: 'Last 6 Months', shortLabel: '6 Months', icon: Calendar },
  { id: 'more-than-six-months', label: '1 Year+', shortLabel: '1 Year+', icon: History },
  { id: 'all', label: 'All Time', shortLabel: 'All Time', icon: Globe },
];

export const TimeframeTabs: React.FC<TimeframeTabsProps> = ({
  selectedTimeframe,
  onSelectTimeframe,
  companyMeta,
}) => {
  const getCount = (id: Timeframe): number | null => {
    if (!companyMeta) return null;
    switch (id) {
      case 'thirty-days':
        return companyMeta.thirtyDaysCount;
      case 'three-months':
        return companyMeta.threeMonthsCount;
      case 'six-months':
        return companyMeta.sixMonthsCount;
      case 'all':
        return companyMeta.allCount;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar shadow-inner">
      {TIMEFRAMES.map(({ id, label, shortLabel, icon: Icon }) => {
        const isSelected = selectedTimeframe === id;
        const count = getCount(id);

        return (
          <button
            key={id}
            onClick={() => onSelectTimeframe(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : id === 'thirty-days' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
            {count !== null && count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
