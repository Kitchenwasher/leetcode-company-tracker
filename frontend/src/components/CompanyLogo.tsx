import React, { useState, useRef, useEffect } from 'react';

export interface CompanyLogoProps {
  companyId: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
}

const colorPalette = [
  'bg-purple-950/60 text-purple-300 border-purple-800/40',
  'bg-blue-950/60 text-blue-300 border-blue-800/40',
  'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
  'bg-amber-950/60 text-amber-300 border-amber-800/40',
  'bg-rose-950/60 text-rose-300 border-rose-800/40',
  'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
];

function getHashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colorPalette.length;
  return colorPalette[idx];
}

export const getCompanyDisplayName = (slug: string): string => {
  const map: Record<string, string> = {
    google: 'Google',
    amazon: 'Amazon',
    meta: 'Meta',
    facebook: 'Meta',
    microsoft: 'Microsoft',
    apple: 'Apple',
    netflix: 'Netflix',
    uber: 'Uber',
    adobe: 'Adobe',
    bloomberg: 'Bloomberg',
    tiktok: 'TikTok',
    bytedance: 'ByteDance',
    twitter: 'X (Twitter)',
    x: 'X',
    linkedin: 'LinkedIn',
    spotify: 'Spotify',
    oracle: 'Oracle',
    salesforce: 'Salesforce',
    nvidia: 'Nvidia',
    cisco: 'Cisco',
    intel: 'Intel',
    paypal: 'PayPal',
    airbnb: 'Airbnb',
    stripe: 'Stripe',
    tesla: 'Tesla',
    'goldman-sachs': 'Goldman Sachs',
    'jpmorgan': 'JPMorgan',
    'walmart-labs': 'Walmart',
    walmart: 'Walmart',
    accenture: 'Accenture',
    ibm: 'IBM',
    tcs: 'TCS',
    infosys: 'Infosys',
    zoho: 'Zoho',
    snapchat: 'Snapchat',
    flipkart: 'Flipkart',
    yandex: 'Yandex',
    'de-shaw': 'D.E. Shaw',
  };

  if (map[slug.toLowerCase()]) return map[slug.toLowerCase()];
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyId,
  className = '',
  size = 'md',
  showTooltip = true,
}) => {
  const c = companyId.toLowerCase().trim();

  // Consistent sizing matching reference image (~20-24px for md)
  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px] rounded',
    sm: 'w-5 h-5 text-[10px] rounded-md',
    md: 'w-6 h-6 text-xs rounded-md',
    lg: 'w-8 h-8 text-sm rounded-lg',
    xl: 'w-10 h-10 text-base rounded-xl',
  }[size];

  const displayName = getCompanyDisplayName(c);

  const renderOfficialLogo = () => {
    switch (c) {
      case 'google':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full p-0.5 shrink-0" aria-label="Google">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        );

      case 'amazon':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#11161F] border border-[#FF9900]/30 rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full shrink-0">
              {/* Lowercase 'a' */}
              <path fill="#FFFFFF" d="M13.4 12.1c-.1-.02-.2-.03-.35-.03-1.4 0-2.2.9-2.2 2.1 0 1.3.8 2 1.9 2 1 0 1.8-.7 2.2-1.5v1.2h1.8v-5.7h-1.8v.9c-.3-.6-1-.9-1.6-.9-.1 0-.2 0-.35.04.05.3.1.6.1 1 0 .3 0 .6-.05.89h.45zm-.9 2.8c-.6 0-1-.4-1-1.1 0-.7.4-1.1 1.1-1.1.3 0 .5.07.7.2v1.1c-.2.6-.5.9-.8.9z"/>
              {/* Orange smile curve with arrow */}
              <path fill="#FF9900" d="M4.8 17.8c4.5 3.3 10.9 1.7 14-1.7.1-.1 0-.3-.1-.2-2.9 1.9-6.7 2.3-10.2 1.1-1.2-.4-2.4-1.1-3.5-1.9-.2-.1-.3.1-.2.2v.5zm14.6-1c-.2-.2-1.2-.1-1.6.1-.1 0-.2.2 0 .3.9.6 2.3.4 2.4.2.2-.2-.2-1.6-1-2.3-.1-.1-.2 0-.2.1.1.5.6 1.4.4 1.6z"/>
            </svg>
          </div>
        );

      case 'microsoft':
        return (
          <div className="w-full h-full grid grid-cols-2 gap-[1.5px] p-0.5 bg-[#141922] border border-white/[0.08] rounded-md shrink-0">
            <div className="bg-[#F25022] rounded-[1px]" />
            <div className="bg-[#7FBA00] rounded-[1px]" />
            <div className="bg-[#00A4EF] rounded-[1px]" />
            <div className="bg-[#FFB900] rounded-[1px]" />
          </div>
        );

      case 'meta':
      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full p-0.5 shrink-0" aria-label="Meta">
            <path
              fill="#0081FB"
              d="M16.99 3.5c-2.3 0-4.32 1.24-5 3.03-.68-1.79-2.7-3.03-5-3.03C3.23 3.5 0 6.73 0 10.71c0 4.67 4.54 8.79 11.23 9.71.5.07 1.04.07 1.54 0C19.46 19.5 24 15.38 24 10.71c0-3.98-3.23-7.21-7.01-7.21zm-10 11.83c-2.34 0-4.23-1.89-4.23-4.23s1.89-4.23 4.23-4.23c1.79 0 3.32 1.12 3.93 2.72-.25.4-.55.78-.9 1.13-1.07 1.07-2.33 1.61-3.03 1.61zm10.02 0c-.7 0-1.96-.54-3.03-1.61-.35-.35-.65-.73-.9-1.13.61-1.6 2.14-2.72 3.93-2.72 2.34 0 4.23 1.89 4.23 4.23s-1.89 4.23-4.23 4.23z"
            />
          </svg>
        );

      case 'apple':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#14171F] border border-white/[0.08] rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full shrink-0">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
            </svg>
          </div>
        );

      case 'netflix':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black border border-red-500/25 rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#E50914" className="w-full h-full shrink-0">
              <path d="M5.398 0v24c1.196-.134 2.433-.312 3.655-.544V0H5.398zm9.549 0v12.798l3.655 8.163V0h-3.655zm-4.774 0L5.398 21.686c1.238-.232 2.475-.41 3.673-.544L13.846 0H10.173z"/>
            </svg>
          </div>
        );

      case 'uber':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black border border-white/20 rounded-md p-0.5 shrink-0 font-bold text-[10px] text-white tracking-tighter">
            Uber
          </div>
        );

      case 'adobe':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#EB1000] rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full shrink-0">
              <path d="M14.58 3H24v18.25L14.58 3zM9.42 3H0v18.25L9.42 3zM12 10.63l4.13 9.62H12.9l-1.42-3.48H8.55L12 10.63z"/>
            </svg>
          </div>
        );

      case 'bloomberg':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0066FF] rounded-md p-0.5 shrink-0 text-white font-black text-[10px] tracking-tight">
            B
          </div>
        );

      case 'tiktok':
      case 'bytedance':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black border border-white/[0.08] rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full shrink-0">
              <path fill="#25F4EE" d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5 2.536 2.536 0 0 1-2.51-2.5 2.536 2.536 0 0 1 2.51-2.5c.34 0 .66.06.96.17V9.89a5.7 5.7 0 0 0-.96-.09 5.622 5.622 0 0 0-5.63 5.6 5.622 5.622 0 0 0 5.63 5.6 5.622 5.622 0 0 0 5.63-5.6V8.69c1.66 1.18 3.68 1.88 5.86 1.94V7.54a4.34 4.34 0 0 1-4.25-1.72z"/>
              <path fill="#FE2C55" d="M19.74 7.54c-.11 0-.22-.01-.33-.02a4.34 4.34 0 0 1-3.92-1.7c-.11.12-.22.25-.33.36v7.42a5.622 5.622 0 0 1-5.63 5.6 5.56 5.56 0 0 1-2.22-.46 5.622 5.622 0 0 0 5.29 3.26 5.622 5.622 0 0 0 5.63-5.6V8.69c1.66 1.18 3.68 1.88 5.86 1.94V7.54h-4.35z"/>
            </svg>
          </div>
        );

      case 'twitter':
      case 'x':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black border border-white/20 rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full shrink-0">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        );

      case 'linkedin':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0A66C2] rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full shrink-0">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 1 0 0-3.36 1.68 1.68 0 0 0 0 3.36m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
            </svg>
          </div>
        );

      case 'spotify':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black border border-[#1ED760]/30 rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#1ED760" className="w-full h-full shrink-0">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
        );

      case 'oracle':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#F80000] rounded-md p-0.5 shrink-0 text-white font-black text-[9px] uppercase tracking-wider">
            ORCL
          </div>
        );

      case 'salesforce':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#00A1E0] rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full shrink-0">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
            </svg>
          </div>
        );

      case 'nvidia':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black border border-[#76B900]/40 rounded-md p-0.5 shrink-0">
            <span className="text-[#76B900] font-black text-[10px] tracking-tighter">NV</span>
          </div>
        );

      case 'cisco':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#049FD9] rounded-md p-0.5 shrink-0 text-white font-bold text-[8px] tracking-tight">
            CISCO
          </div>
        );

      case 'intel':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0068B5] rounded-md p-0.5 shrink-0 text-white font-bold text-[9px] lowercase tracking-tight">
            intel
          </div>
        );

      case 'paypal':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#003087] rounded-md p-0.5 shrink-0 text-[#0079C1] font-black text-[10px] italic">
            P
          </div>
        );

      case 'airbnb':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#FF5A5F] rounded-md p-0.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full shrink-0">
              <path d="M12 0c-4.1 0-6.9 2.9-6.9 6.7 0 4.8 5.6 13.5 6.4 14.7.3.4.8.6 1.3.6s1-.2 1.3-.6c.8-1.2 6.4-9.9 6.4-14.7C20.5 2.9 17.7 0 12 0zm0 9.2c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/>
            </svg>
          </div>
        );

      case 'stripe':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#635BFF] rounded-md p-0.5 shrink-0 text-white font-black text-[11px]">
            S
          </div>
        );

      case 'tesla':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#E82127] rounded-md p-0.5 shrink-0 text-white font-black text-[10px]">
            T
          </div>
        );

      case 'goldman-sachs':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#7399C6] rounded-md p-0.5 shrink-0 text-white font-black text-[8px] tracking-tight">
            GS
          </div>
        );

      case 'jpmorgan':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#005EB8] rounded-md p-0.5 shrink-0 text-white font-bold text-[8px]">
            JPM
          </div>
        );

      case 'walmart-labs':
      case 'walmart':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0071CE] rounded-md p-0.5 shrink-0 text-[#FFC220] font-black text-sm">
            ✻
          </div>
        );

      case 'accenture':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#A100FF]/15 border border-[#A100FF]/40 rounded-md p-0.5 shrink-0 text-[#A100FF] font-black text-[11px]">
            &gt;
          </div>
        );

      case 'ibm':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0062FF] rounded-md p-0.5 shrink-0 text-white font-black text-[8px] tracking-tight">
            IBM
          </div>
        );

      case 'tcs':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#002D62] rounded-md p-0.5 shrink-0 text-white font-bold text-[8px]">
            TCS
          </div>
        );

      case 'infosys':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#007CC3] rounded-md p-0.5 shrink-0 text-white font-bold text-[7px]">
            INFO
          </div>
        );

      case 'zoho':
        return (
          <div className="w-full h-full grid grid-cols-2 gap-[1px] p-0.5 bg-black border border-white/10 rounded-md shrink-0">
            <div className="bg-[#E42528] rounded-[1px]" />
            <div className="bg-[#219244] rounded-[1px]" />
            <div className="bg-[#1C75BC] rounded-[1px]" />
            <div className="bg-[#F8A01D] rounded-[1px]" />
          </div>
        );

      default: {
        const initials = c
          .split('-')
          .map((part) => part[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() || c.slice(0, 2).toUpperCase();

        const colorClass = getHashColor(c);

        return (
          <div
            className={`w-full h-full ${colorClass} rounded-md border flex items-center justify-center font-bold tracking-tight shadow-sm shrink-0`}
          >
            {initials}
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`${sizeClasses} ${className} relative shrink-0 flex items-center justify-center select-none`}
      title={showTooltip ? displayName : undefined}
    >
      {renderOfficialLogo()}
    </div>
  );
};

const PROMINENT_COMPANIES_ORDER = [
  'google',
  'amazon',
  'meta',
  'facebook',
  'microsoft',
  'apple',
  'netflix',
  'uber',
  'bloomberg',
  'tiktok',
  'bytedance',
  'twitter',
  'x',
  'adobe',
  'linkedin',
  'spotify',
  'oracle',
  'salesforce',
  'nvidia',
  'intel',
  'paypal',
  'stripe',
  'airbnb',
  'tesla',
  'goldman-sachs',
  'jpmorgan',
  'walmart',
  'walmart-labs',
  'cisco',
  'ibm',
  'accenture',
  'tcs',
  'infosys',
  'zoho',
];

export interface CompanyLogoStackProps {
  companies: string[];
  maxDisplay?: number;
  size?: 'xs' | 'sm' | 'md';
  onSelectCompany?: (company: string) => void;
  className?: string;
}

export const CompanyLogoStack: React.FC<CompanyLogoStackProps> = ({
  companies = [],
  maxDisplay = 3,
  size = 'sm',
  onSelectCompany,
  className = '',
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  const sortedCompanies = React.useMemo(() => {
    if (!companies || companies.length === 0) return [];
    const list = [...companies];
    return list.sort((a, b) => {
      const idxA = PROMINENT_COMPANIES_ORDER.indexOf(a.toLowerCase());
      const idxB = PROMINENT_COMPANIES_ORDER.indexOf(b.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [companies]);

  if (!sortedCompanies || sortedCompanies.length === 0) {
    return <span className="text-xs text-zinc-600 font-mono">—</span>;
  }

  const visible = sortedCompanies.slice(0, maxDisplay);
  const remaining = sortedCompanies.slice(maxDisplay);

  return (
    <div className={`flex items-center gap-1.5 relative ${className}`}>
      {visible.map((comp) => (
        <button
          key={comp}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectCompany) onSelectCompany(comp);
          }}
          className="cursor-pointer hover:scale-110 transition-transform focus:outline-hidden"
          title={getCompanyDisplayName(comp)}
        >
          <CompanyLogo companyId={comp} size={size} />
        </button>
      ))}

      {remaining.length > 0 && (
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(!showPopover);
            }}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
            title={`+${remaining.length} more companies`}
          >
            +{remaining.length}
          </button>

          {showPopover && (
            <div
              className="absolute left-0 top-full mt-2 w-52 p-2 bg-[#0D1117] border border-white/[0.12] rounded-xl shadow-2xl z-50 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2 py-1 border-b border-white/[0.06] mb-1.5 font-mono">
                All Tagged Companies ({companies.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {companies.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => {
                      setShowPopover(false);
                      if (onSelectCompany) onSelectCompany(comp);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.06] text-left text-xs text-zinc-200 transition-colors cursor-pointer group"
                  >
                    <CompanyLogo companyId={comp} size="xs" showTooltip={false} />
                    <span className="truncate group-hover:text-primary transition-colors">
                      {getCompanyDisplayName(comp)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
