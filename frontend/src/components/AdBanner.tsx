import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, X, ArrowRight, ExternalLink } from 'lucide-react';
import { sounds } from '../utils/sound';

export type AdVariant = 'google-cloud' | 'aws' | 'jetbrains' | 'copilot' | 'auto';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'sidebar' | 'rectangle';
  variant?: AdVariant;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = 'default-slot',
  format = 'horizontal',
  variant = 'auto',
  className = '',
}) => {
  const { isPro, setShowSubscriptionModal } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Pro members get 100% ad-free experience - return null immediately
  if (isPro || dismissed) {
    return null;
  }

  const clientId = (import.meta as any).env?.VITE_GOOGLE_ADSENSE_CLIENT_ID || '';
  const isRealAdSense = !!clientId && clientId !== 'ca-pub-placeholder';

  // Dynamically inject AdSense script if client ID is configured
  useEffect(() => {
    if (isRealAdSense) {
      const scriptId = 'google-adsense-sdk';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch {
        // Suppress adblocker/pre-render errors
      }
    }
  }, [slotId, isRealAdSense, clientId]);

  // Determine active display variant
  const activeVariant: AdVariant = (() => {
    if (variant !== 'auto') return variant;
    if (format === 'sidebar' || format === 'rectangle') return 'copilot';
    if (slotId.includes('community')) return 'jetbrains';
    if (slotId.includes('dash') || slotId.includes('overview')) return 'google-cloud';
    return 'aws';
  })();

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setDismissed(true);
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setShowSubscriptionModal(true);
  };

  return (
    <div className={`relative group select-none font-sans ${className}`}>
      {/* Real AdSense Unit when configured */}
      {isRealAdSense ? (
        <div className="w-full overflow-hidden rounded-2xl bg-[#0B0F15] border border-white/[0.08] p-2 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between text-[10px] text-zinc-500 pb-1 px-1">
            <span className="font-mono text-[9px] uppercase tracking-wider font-semibold">AD</span>
            <button
              onClick={handleUpgradeClick}
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <Crown className="w-3 h-3" />
              <span>Remove Ads with Pro</span>
            </button>
          </div>
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minHeight: format === 'horizontal' ? '90px' : '250px' }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format === 'horizontal' ? 'horizontal' : 'auto'}
            data-full-width-responsive="true"
          />
        </div>
      ) : format === 'sidebar' || format === 'rectangle' ? (
        /* ========================================================= */
        /* AD SLOT 2: SIDEBAR / RIGHT RAIL (GitHub Copilot)          */
        /* ========================================================= */
        <div
          onClick={() => window.open('https://github.com/features/copilot', '_blank')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#131926] via-[#0F1420] to-[#0A0D15] border border-indigo-500/25 p-5 transition-all hover:border-indigo-400/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.15)] cursor-pointer group flex flex-col justify-between min-h-[290px]"
        >
          {/* Top Row: AD Tag + Close */}
          <div className="flex items-center justify-between z-10">
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-bold text-zinc-300 font-mono tracking-wider">
              AD
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUpgradeClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                title="Remove ads with Pro"
              >
                <Crown className="w-3 h-3" />
                <span>Ad-Free</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
                title="Dismiss ad"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-2 mt-3 z-10">
            {/* GitHub Copilot Logo */}
            <div className="flex items-center gap-2 text-white">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span className="font-bold text-sm tracking-tight font-sans">GitHub Copilot</span>
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
              Code faster with AI
            </h3>
            <p className="text-xs text-zinc-400 max-w-[220px] leading-relaxed">
              Turn ideas into working software, instantly.
            </p>
          </div>

          {/* CTA + Isometric Graphic */}
          <div className="flex items-end justify-between mt-4 z-10">
            <button className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 group-hover:translate-x-0.5">
              <span>Try for free</span>
              <span>&rarr;</span>
            </button>

            {/* 3D Glowing Isometric Graphic */}
            <div className="relative w-24 h-24 -mr-3 -mb-3 opacity-90">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                {/* Isometric Cube 1 */}
                <polygon points="50,15 80,32 50,49 20,32" fill="#818CF8" />
                <polygon points="20,32 50,49 50,85 20,68" fill="#4F46E5" />
                <polygon points="80,32 50,49 50,85 80,68" fill="#6366F1" />
                {/* Secondary step cube */}
                <polygon points="75,55 95,66 75,77 55,66" fill="#A5B4FC" opacity="0.8" />
                <polygon points="55,66 75,77 75,95 55,84" fill="#6366F1" opacity="0.8" />
                <polygon points="95,66 75,77 75,95 95,84" fill="#818CF8" opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        </div>
      ) : activeVariant === 'google-cloud' ? (
        /* ========================================================= */
        /* AD SLOT 1: TOP BANNER (Google Cloud)                      */
        /* ========================================================= */
        <div
          onClick={() => window.open('https://cloud.google.com/', '_blank')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C101A] via-[#101626] to-[#0A0D15] border border-blue-500/20 px-4 py-3.5 sm:px-6 sm:py-4 transition-all hover:border-blue-400/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] cursor-pointer group flex items-center justify-between gap-4"
        >
          {/* Left: AD Pill + Logo + Copy */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            {/* AD Badge */}
            <span className="shrink-0 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-bold text-zinc-300 font-mono tracking-wider">
              AD
            </span>

            {/* Google Cloud 3D Polygonal Prism Graphic */}
            <div className="shrink-0 w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
                <polygon points="20,4 36,34 20,28" fill="#4285F4" />
                <polygon points="20,4 4,34 20,28" fill="#8AB4F8" />
                <polygon points="20,28 36,34 20,38" fill="#1A73E8" />
                <polygon points="20,28 4,34 20,38" fill="#669DF6" />
              </svg>
            </div>

            {/* Text Content */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Build what&apos;s next.
                </h4>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md mt-0.5">
                Deploy faster with cloud tools for developers.
              </p>
            </div>
          </div>

          {/* Right: Brand Text + CTA Button + Close */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="hidden md:inline-block text-xs font-semibold text-zinc-300 font-sans tracking-tight">
              Google Cloud
            </span>

            <button className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 group-hover:translate-x-0.5">
              <span>Get Started</span>
              <span className="text-sm">&rarr;</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
              title="Dismiss ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-40 h-full bg-blue-500/5 blur-xl pointer-events-none" />
        </div>
      ) : activeVariant === 'jetbrains' ? (
        /* ========================================================= */
        /* AD SLOT 1: TOP BANNER (JetBrains)                         */
        /* ========================================================= */
        <div
          onClick={() => window.open('https://www.jetbrains.com/', '_blank')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#120D1A] via-[#161026] to-[#0D0A14] border border-pink-500/20 px-4 py-3.5 sm:px-6 sm:py-4 transition-all hover:border-pink-400/40 hover:shadow-[0_0_24px_rgba(236,72,153,0.12)] cursor-pointer group flex items-center justify-between gap-4"
        >
          {/* Left: AD Pill + Logo + Copy */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <span className="shrink-0 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-bold text-zinc-300 font-mono tracking-wider">
              AD
            </span>

            {/* JetBrains Logo Square */}
            <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-tr from-[#FC1963] via-[#FF318C] to-[#FE5E57] p-1.5 flex flex-col justify-between shadow-md">
              <div className="w-3 h-0.5 bg-black" />
              <div className="font-black text-[8px] tracking-tighter text-black leading-none uppercase">
                JET<br/>BRAINS
              </div>
            </div>

            {/* Text */}
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Build Better Developers
              </h4>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md mt-0.5">
                Tools for every step of your coding journey.
              </p>
            </div>
          </div>

          {/* Right: Products + CTA Button + Close */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-semibold text-zinc-200">
                IntelliJ IDEA &bull; PyCharm &bull; WebStorm
              </p>
              <p className="text-[11px] text-zinc-500">Smarter tools. Brighter developers.</p>
            </div>

            <button className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#FC1963] hover:bg-[#E01050] text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5 group-hover:translate-x-0.5">
              <span>Try for Free</span>
              <span className="text-sm">&rarr;</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
              title="Dismiss ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-40 h-full bg-pink-500/5 blur-xl pointer-events-none" />
        </div>
      ) : (
        /* ========================================================= */
        /* AD SLOT 1: TOP BANNER (Amazon Web Services / AWS)         */
        /* ========================================================= */
        <div
          onClick={() => window.open('https://aws.amazon.com/', '_blank')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E121A] via-[#141224] to-[#0A0D15] border border-amber-500/20 px-4 py-3.5 sm:px-6 sm:py-4 transition-all hover:border-amber-400/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] cursor-pointer group flex items-center justify-between gap-4"
        >
          {/* Left: AD Pill + AWS Logo + Copy */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <span className="shrink-0 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-bold text-zinc-300 font-mono tracking-wider">
              AD
            </span>

            {/* AWS Logo */}
            <div className="shrink-0 w-12 flex flex-col items-center">
              <span className="text-white font-black text-base tracking-tighter leading-none font-sans">
                aws
              </span>
              <svg className="w-10 h-2.5 fill-[#FF9900]" viewBox="0 0 60 15">
                <path d="M5 2 Q30 15 55 2 Q30 9 5 2 Z" />
              </svg>
            </div>

            {/* Text */}
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Build what&apos;s next.
              </h4>
              <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md mt-0.5">
                Get started with AWS and turn your ideas into real-world solutions.
              </p>
            </div>
          </div>

          {/* Center Graphic: 3D Wireframe Cube */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="w-8 h-8 opacity-80">
              <svg viewBox="0 0 40 40" className="w-full h-full stroke-purple-400/60 fill-purple-500/20 stroke-[1.5]">
                <polygon points="20,5 35,14 20,23 5,14" />
                <polygon points="5,14 20,23 20,37 5,28" />
                <polygon points="35,14 20,23 20,37 35,28" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-200">Amazon Web Services</p>
              <p className="text-[10px] text-zinc-500">Scalable. Reliable. Secure.</p>
            </div>
          </div>

          {/* Right: CTA Button + Close */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#FF9900] hover:bg-[#E88B00] text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 group-hover:translate-x-0.5">
              <span>Get Started</span>
              <span className="text-sm">&rarr;</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
              title="Dismiss ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-40 h-full bg-purple-500/5 blur-xl pointer-events-none" />
        </div>
      )}
    </div>
  );
};
