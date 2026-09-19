import React from 'react';

interface CompanyLogoProps {
  companyId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const colorPalette = [
  'bg-surfaceElevated text-primary border border-border',
  'bg-surfaceElevated text-primaryDim border border-border',
  'bg-surfaceElevated text-primary border border-primaryDim/30',
  'bg-surfaceElevated text-textPrimary border border-border',
];

function getHashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colorPalette.length;
  return colorPalette[idx];
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ companyId, className = '', size = 'md' }) => {
  const c = companyId.toLowerCase();

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs rounded-md',
    md: 'w-8 h-8 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
    xl: 'w-12 h-12 text-lg rounded-2xl',
  }[size];

  // Specific high-profile icons in retro-terminal palette
  if (c === 'google') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-primary font-bold font-mono shrink-0 p-1`}>
        <span>G</span>
      </div>
    );
  }

  if (c === 'meta' || c === 'facebook') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-primary shrink-0 p-1`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </div>
    );
  }

  if (c === 'amazon') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-primary font-bold text-xs shrink-0 p-1`}>
        <span>a</span>
      </div>
    );
  }

  if (c === 'apple') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-textPrimary shadow-sm shrink-0 p-1`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
        </svg>
      </div>
    );
  }

  if (c === 'microsoft') {
    return (
      <div className={`${sizeClasses} ${className} grid grid-cols-2 gap-0.5 p-1.5 bg-surface border border-border shrink-0`}>
        <div className="bg-primary rounded-[1px]"></div>
        <div className="bg-primaryDim rounded-[1px]"></div>
        <div className="bg-primaryDim rounded-[1px]"></div>
        <div className="bg-primary rounded-[1px]"></div>
      </div>
    );
  }

  if (c === 'netflix') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-primary font-black text-sm shrink-0`}>
        N
      </div>
    );
  }

  if (c === 'bloomberg') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-primaryDim font-bold text-xs shrink-0`}>
        BBG
      </div>
    );
  }

  if (c === 'uber') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-textPrimary font-bold text-xs shrink-0`}>
        Uber
      </div>
    );
  }

  if (c === 'tiktok' || c === 'bytedance') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-surface border border-border text-primary font-bold text-xs shrink-0`}>
        TT
      </div>
    );
  }

  // Dynamic stylized fallback with letters
  const initials = companyId
    .split('-')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || companyId.slice(0, 2).toUpperCase();

  const colorClass = getHashColor(companyId);

  return (
    <div className={`${sizeClasses} ${colorClass} ${className} flex items-center justify-center font-bold tracking-tight shadow-sm shrink-0`}>
      {initials}
    </div>
  );
};
