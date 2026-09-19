import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Check, Sparkles, Shield, Zap, Crown, CreditCard,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

export const SubscriptionModal: React.FC = () => {
  const { showSubscriptionModal, setShowSubscriptionModal, isPro, upgradeToPro } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!showSubscriptionModal) return null;

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      upgradeToPro();
      setIsProcessing(false);
      sounds.playMastered();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E5FF00', '#FFFFFF', '#D4ED00', '#F3F4F6']
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-[#0E1217] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="font-semibold text-white text-sm">
              Upgrade to Cheat Code Pro
            </h3>
          </div>
          <button
            onClick={() => setShowSubscriptionModal(false)}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {/* Header Description */}
          <div className="text-center max-w-lg mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2.5">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span>Full Platform Access</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Supercharge Your Interview Readiness
            </h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-1.5">
              Unlimited mock simulations, real company pacing roadmaps, exportable study cards, and live telemetry.
            </p>

            {/* Billing Cycle Switcher */}
            <div className="inline-flex rounded-xl bg-[#12161E] p-1 border border-white/[0.08] mt-4">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-primary text-black shadow-md shadow-primary/20' : 'text-textSecondary hover:text-white'
                }`}
              >
                Monthly: $9/mo
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly' ? 'bg-primary text-black shadow-md shadow-primary/20' : 'text-textSecondary hover:text-white'
                }`}
              >
                <span>Yearly: $4.90/mo</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${billingCycle === 'yearly' ? 'bg-black text-primary' : 'bg-primary/20 text-primary'}`}>
                  Save 45%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === 'lifetime' ? 'bg-primary text-black shadow-md shadow-primary/20' : 'text-textSecondary hover:text-white'
                }`}
              >
                Lifetime: $79
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="rounded-xl bg-[#12161E]/60 border border-white/[0.06] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Free Explorer</span>
                  {!isPro && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-textMuted border border-white/[0.06]">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold font-mono text-white mb-4">
                  $0 <span className="text-xs font-normal text-textMuted">/ forever</span>
                </div>

                <ul className="space-y-2.5 text-xs text-textSecondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>All 659 companies & 3,399 questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Full algorithmic hints & approaches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Local progress tracking</span>
                  </li>
                  <li className="flex items-center gap-2 text-textMuted">
                    <X className="w-3.5 h-3.5 text-textMuted shrink-0" />
                    <span>Limited to 1 Mock Interview / day</span>
                  </li>
                  <li className="flex items-center gap-2 text-textMuted">
                    <X className="w-3.5 h-3.5 text-textMuted shrink-0" />
                    <span>No Anki / Obsidian Exporters</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled
                  className="w-full py-2 rounded-xl bg-white/[0.04] text-textMuted text-xs font-medium cursor-not-allowed text-center"
                >
                  Included Free
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-xl bg-[#12161E] border-2 border-primary/50 p-5 flex flex-col justify-between shadow-lg shadow-primary/5">
              <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-primary text-black text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Recommended</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span>Pro Candidate</span>
                  </span>
                  {isPro && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-black">
                      Active
                    </span>
                  )}
                </div>

                <div className="text-2xl font-bold font-mono text-primary mb-4">
                  {billingCycle === 'monthly' && '$9 '}
                  {billingCycle === 'yearly' && '$4.90 '}
                  {billingCycle === 'lifetime' && '$79 '}
                  <span className="text-xs font-normal text-textMuted">
                    {billingCycle === 'monthly' && '/ month'}
                    {billingCycle === 'yearly' && '/ mo (billed $59/yr)'}
                    {billingCycle === 'lifetime' && 'one-time'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-textPrimary">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium">Unlimited Timed Mock Interviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium">Anki Deck & CSV Exporters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium">Interactive Whiteboard Workspace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium">Curated Tracks (Blind 75, NeetCode 150)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Priority recency question indexing</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06]">
                {isPro ? (
                  <div className="text-center py-2 text-xs font-bold text-primary flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Pro Plan Active</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-[#D4ED00] text-black text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 font-sans shadow-md shadow-primary/20"
                  >
                    {isProcessing ? (
                      <span>Activating Pro Plan...</span>
                    ) : (
                      <>
                        <Crown className="w-3.5 h-3.5" />
                        <span>Upgrade to Pro Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Guarantee Footer */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-textMuted">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              14-Day Money-Back Guarantee
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Instant Access
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary" />
              Encrypted Checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
