import React from 'react';
import { Timeframe, CompanyMeta } from '../types';
import { Flame, Clock, Calendar, History, Globe, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isTimeframePro } from '../utils/tierPermissions';
import { sounds } from '../utils/sound';

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
  const { isPro, setShowSubscriptionModal } = useAuth();

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

  const handleTabClick = (id: Timeframe) => {
    if (!isPro && isTimeframePro(id)) {
      sounds.playTimerAlert();
      setShowSubscriptionModal(true);
      return;
    }
    sounds.playClick();
    onSelectTimeframe(id);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-[2px] overflow-x-auto no-scrollbar font-mono">
      {TIMEFRAMES.map(({ id, label, shortLabel, icon: Icon }) => {
        const isSelected = selectedTimeframe === id;
        const count = getCount(id);
        const isLocked = !isPro && isTimeframePro(id);

        return (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            title={isLocked ? 'Pro Exclusive: Unlock 30d/90d recency frequency filters' : label}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
              isSelected
                ? 'bg-primary text-black border-borderActive shadow-terminal-glow'
                : isLocked
                ? 'border-transparent text-textMuted/70 hover:text-amber-400 hover:bg-amber-400/5'
                : 'border-transparent text-textSecondary hover:text-primaryDim hover:bg-surfaceElevated'
            }`}
          >
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : id === 'thirty-days' ? 'text-medium' : 'text-textMuted'}`} />
            )}
            <span className="hidden sm:inline">[{label.toUpperCase()}]</span>
            <span className="sm:hidden">[{shortLabel.toUpperCase()}]</span>
            {isLocked && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-400 font-extrabold uppercase tracking-wider">
                PRO
              </span>
            )}
            {count !== null && count > 0 && !isLocked && (
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

