import React from 'react';

interface CompanyLogoProps {
  companyId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const colorPalette = [
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-indigo-600 text-white',
  'bg-purple-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-teal-600 text-white',
  'bg-cyan-600 text-white',
  'bg-violet-600 text-white',
  'bg-pink-600 text-white',
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

  // Specific high-profile SVG icons
  if (c === 'google') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-white shadow-sm border border-slate-200 dark:border-slate-800 shrink-0 p-1`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.14z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.26v3.15C3.25 21.3 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26A11.95 11.95 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.06-3.15z"/>
          <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.7 1.26 6.58l4.06 3.15c.94-2.83 3.58-4.96 6.68-4.96z"/>
        </svg>
      </div>
    );
  }

  if (c === 'meta' || c === 'facebook') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-[#0081FB] text-white shadow-sm shrink-0 p-1`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </div>
    );
  }

  if (c === 'amazon') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-[#232F3E] text-[#FF9900] shadow-sm shrink-0 p-1`}>
        <span className="font-bold text-xs">a</span>
      </div>
    );
  }

  if (c === 'apple') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm shrink-0 p-1`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
        </svg>
      </div>
    );
  }

  if (c === 'microsoft') {
    return (
      <div className={`${sizeClasses} ${className} grid grid-cols-2 gap-0.5 p-1.5 bg-slate-900 shadow-sm shrink-0`}>
        <div className="bg-[#F25022] rounded-sm"></div>
        <div className="bg-[#7FBA00] rounded-sm"></div>
        <div className="bg-[#00A4EF] rounded-sm"></div>
        <div className="bg-[#FFB900] rounded-sm"></div>
      </div>
    );
  }

  if (c === 'netflix') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-black text-[#E50914] font-black text-sm shadow-sm shrink-0`}>
        N
      </div>
    );
  }

  if (c === 'bloomberg') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-[#1E293B] text-[#0068FF] font-bold text-xs shadow-sm shrink-0`}>
        BBG
      </div>
    );
  }

  if (c === 'uber') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-black text-white font-bold text-xs shadow-sm shrink-0`}>
        Uber
      </div>
    );
  }

  if (c === 'tiktok' || c === 'bytedance') {
    return (
      <div className={`${sizeClasses} ${className} flex items-center justify-center bg-black text-[#00F2FE] font-bold text-xs shadow-sm shrink-0 border border-slate-700`}>
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
