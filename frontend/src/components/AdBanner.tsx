import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = 'default-slot',
  format = 'horizontal',
  className = '',
}) => {
  const { isPro, setShowSubscriptionModal } = useAuth();

  // Pro members get 100% ad-free experience - return null immediately
  if (isPro) {
    return null;
  }

  const clientId = (import.meta as any).env?.VITE_GOOGLE_ADSENSE_CLIENT_ID || 'ca-pub-placeholder';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ignore adsbygoogle push error if adblocker or script not loaded yet
    }
  }, [slotId]);

  return (
    <div
      className={`my-3 p-3 rounded-xl bg-surfaceElevated/60 border border-white/[0.06] flex flex-col items-center justify-center text-center overflow-hidden font-sans relative group ${className}`}
    >
      {/* Top micro-bar: Ad disclosure & Remove Ads CTA */}
      <div className="w-full flex items-center justify-between text-[10px] text-textMuted px-1 pb-2 border-b border-white/[0.04] mb-2">
        <span className="uppercase tracking-wider font-mono text-[9px] text-zinc-500 font-semibold">
          Sponsored
        </span>
        <button
          onClick={() => {
            sounds.playClick();
            setShowSubscriptionModal(true);
          }}
          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
        >
          <Crown className="w-2.5 h-2.5" />
          <span>Remove Ads with Pro &rarr;</span>
        </button>
      </div>

      {/* Google AdSense Slot */}
      <div className="w-full min-h-[60px] flex items-center justify-center">
        {clientId !== 'ca-pub-placeholder' ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format === 'horizontal' ? 'horizontal' : 'auto'}
            data-full-width-responsive="true"
          />
        ) : (
          <div
            onClick={() => {
              sounds.playClick();
              setShowSubscriptionModal(true);
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.08] hover:border-amber-400/40 hover:bg-amber-400/[0.03] transition-all cursor-pointer flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">
                  Cheat Code Pro • Crack Your FAANG Interview
                </p>
                <p className="text-[11px] text-textMuted">
                  Unlock 30-day recency frequency roadmaps, cross-company overlap matrices, and enjoy 100% ad-free prep.
                </p>
              </div>
            </div>

            <span className="shrink-0 px-2.5 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-bold border border-amber-400/30">
              Upgrade
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
