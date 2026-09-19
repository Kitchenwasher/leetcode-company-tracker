import React from 'react';

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard' | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  size = 'md',
  className = '',
}) => {
  const diffLower = difficulty?.toLowerCase() || 'medium';

  let colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  let label = 'Medium';

  if (diffLower === 'easy') {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    label = 'Easy';
  } else if (diffLower === 'hard') {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    label = 'Hard';
  }

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px] font-medium'
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border font-sans tracking-tight transition-colors ${sizeClasses} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};
