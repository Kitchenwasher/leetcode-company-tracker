import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100 or current count
  max?: number;
  label?: string;
  sublabel?: string;
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  color = 'primary',
  size = 'md',
  showPercentage = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorStyles = {
    primary: 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7]',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    blue: 'bg-sky-400',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-1.5">
            {label && <span className="font-medium text-zinc-300">{label}</span>}
            {sublabel && <span className="text-zinc-500">({sublabel})</span>}
          </div>
          {showPercentage && (
            <span className="font-medium text-zinc-400 font-mono text-[11px]">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full rounded-full bg-white/[0.06] overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
