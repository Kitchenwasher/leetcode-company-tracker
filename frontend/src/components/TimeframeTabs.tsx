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
    <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-[2px] overflow-x-auto no-scrollbar font-mono">
      {TIMEFRAMES.map(({ id, label, shortLabel, icon: Icon }) => {
        const isSelected = selectedTimeframe === id;
        const count = getCount(id);

        return (
          <button
            key={id}
            onClick={() => onSelectTimeframe(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap border ${
              isSelected
                ? 'bg-primary text-black border-borderActive shadow-terminal-glow'
                : 'border-transparent text-textSecondary hover:text-primaryDim hover:bg-surfaceElevated'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : id === 'thirty-days' ? 'text-medium' : 'text-textMuted'}`} />
            <span className="hidden sm:inline">[{label.toUpperCase()}]</span>
            <span className="sm:hidden">[{shortLabel.toUpperCase()}]</span>
            {count !== null && count > 0 && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded-[1px] font-mono font-bold ${
                  isSelected ? 'bg-black text-primary' : 'bg-surfaceElevated text-textMuted'
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
