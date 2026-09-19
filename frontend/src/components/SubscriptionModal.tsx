import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Check, Sparkles, Shield, Zap, Flame, Crown, CreditCard,
  Gift, Award, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

export const SubscriptionModal: React.FC = () => {
  const { showSubscriptionModal, setShowSubscriptionModal, isPro, upgradeToPro, user } = useAuth();
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
        origin: { y: 0.6 }
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/60 overflow-hidden">
        {/* Top Glow Ribbon */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400" />

        {/* Close Button */}
        <button
          onClick={() => setShowSubscriptionModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center max-w-lg mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5" />
              LeetTracker Pro SaaS
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Supercharge Your FAANG Interview Prep
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Unlock unlimited mock interviews, Anki active recall exports, interactive whiteboard canvas, and AI-optimized C++ sandbox execution.
            </p>

            {/* Billing Cycle Switcher */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly ($9/mo)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Yearly ($4.90/mo)</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SAVE 45%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === 'lifetime' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lifetime ($79)
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-300">Free Explorer</span>
                  {!isPro && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      CURRENT PLAN
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-white mb-4">
                  $0 <span className="text-xs font-normal text-slate-400">/ forever</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Access all 659 companies & 3,399 questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full C++ multi-approach solutions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Core Spaced Repetition (SRS) tracking</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Limited to 1 Mock Interview / day</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>No Anki Deck or Obsidian Export</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>No Whiteboard Canvas</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled
                  className="w-full py-2 rounded-lg bg-slate-800/50 text-slate-500 text-xs font-semibold cursor-not-allowed text-center"
                >
                  Included Free
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-950/80 border-2 border-indigo-500/50 p-5 flex flex-col justify-between shadow-lg shadow-indigo-950/40">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                RECOMMENDED
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Pro Candidate
                  </span>
                  {isPro && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-white mb-4">
                  {billingCycle === 'monthly' && '$9 '}
                  {billingCycle === 'yearly' && '$4.90 '}
                  {billingCycle === 'lifetime' && '$79 '}
                  <span className="text-xs font-normal text-slate-400">
                    {billingCycle === 'monthly' && '/ month'}
                    {billingCycle === 'yearly' && '/ mo ($59/yr)'}
                    {billingCycle === 'lifetime' && '/ lifetime access'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">Unlimited Timed Mock Interviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">Anki Deck (.csv) & Obsidian (.md) Exporters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">Interactive In-Browser Whiteboard Canvas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">Company Prep Milestone Pacing Planner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-white">Curated Roadmaps (Blind 75, NeetCode 150)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>In-Browser C++ Code Runner Sandbox</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-indigo-900/60">
                {isPro ? (
                  <div className="text-center py-2 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    You are currently enjoying Pro benefits!
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 hover:from-amber-400 hover:via-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Activating Pro Plan...</span>
                    ) : (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
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
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              14-Day Money Back Guarantee
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Instant Activation
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              Secure 256-Bit Checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
