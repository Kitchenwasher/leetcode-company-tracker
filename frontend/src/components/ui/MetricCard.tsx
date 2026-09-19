import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl bg-[#0E1217] border border-white/[0.08] p-4 sm:p-5 transition-all duration-200 hover:border-white/[0.16] hover:bg-[#12161E] group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-400 font-sans tracking-tight uppercase">
          {label}
        </p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-zinc-500 font-sans mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
