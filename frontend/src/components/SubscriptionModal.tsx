import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Check, Sparkles, Shield, Zap, Crown, CreditCard,
  ArrowRight, Loader2, Lock, Tag, Coffee, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { paymentApi } from '../api/paymentApi';

const BMC_PAGE_URL = 'https://buymeacoffee.com/cheatcode69';

export const SubscriptionModal: React.FC = () => {
  const { showSubscriptionModal, setShowSubscriptionModal, isPro, user, updateProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly'>('lifetime');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!showSubscriptionModal) return null;

  const handleBuyMeACoffeeCheckout = () => {
    sounds.playClick();
    // Open Buy Me a Coffee in a new window with user email hint
    const url = BMC_PAGE_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSuccessMsg(`Buy Me a Coffee opened in a new tab. Complete your ${selectedPlan === 'lifetime' ? 'Lifetime Pass' : '1-Month'} payment using "${user?.email || 'your account email'}", then click "Verify & Activate Pro" below.`);
  };

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    setErrorMsg(null);
    sounds.playClick();

    try {
      const res = await paymentApi.verifyBMC(user?.email);
      if (res?.isPro) {
        await updateProfile({ tier: 'pro' });
        sounds.playMastered();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFDD00', '#E5FF00', '#FFFFFF', '#D4ED00']
        });
        setSuccessMsg('🎉 Pro access successfully verified and activated!');
        setTimeout(() => {
          setShowSubscriptionModal(false);
        }, 1800);
      } else {
        throw new Error(res.message || 'Payment not found yet. If you just paid, please wait 30 seconds.');
      }
    } catch (err: unknown) {
      console.error('BMC verification error:', err);
      const msg = err instanceof Error ? err.message : 'Could not verify payment yet. Please ensure payment was completed.';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    sounds.playClick();

    try {
      const res = await paymentApi.createCheckoutSession(selectedPlan);

      if (res?.url) {
        if (res.isMock || res.url.includes('session_id=mock_')) {
          // Instant upgrade in Neon database
          await updateProfile({ tier: 'pro' });
          sounds.playMastered();
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#E5FF00', '#FFFFFF', '#D4ED00', '#F3F4F6']
          });
          setIsProcessing(false);
          setShowSubscriptionModal(false);
          window.location.hash = `/subscription-success?session_id=mock_${Date.now()}&plan=${selectedPlan}`;
          return;
        }

        // Real Stripe Gateway redirect
        window.location.href = res.url;
      } else {
        throw new Error('No checkout URL received from payment gateway');
      }
    } catch (err: unknown) {
      console.error('Stripe checkout error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to launch Stripe checkout. Please try again.';
      setErrorMsg(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-[#0E1217] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#12161E]/50">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">
                Cheat Code Pro • Upgrade Plan
              </h3>
            </div>
          </div>
          <button
            onClick={() => setShowSubscriptionModal(false)}
            className="p-1.5 rounded-xl text-textMuted hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* Hero Banner */}
          <div className="text-center max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified FAANG Prep Platform</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Unlock Full Pro Access
            </h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-1.5 leading-relaxed">
              Targeted company patterns for 659 top engineering firms, unlimited timed mock interviews, and spaced repetition analytics.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* 2 Offerings Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Offer 1: Lifetime Pass */}
            <div
              onClick={() => {
                sounds.playClick();
                setSelectedPlan('lifetime');
              }}
              className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlan === 'lifetime'
                  ? 'bg-[#12161E] border-amber-400 shadow-xl shadow-amber-400/10 ring-1 ring-amber-400/40'
                  : 'bg-[#12161E]/40 border-white/[0.08] hover:border-white/20'
              }`}
            >
              {/* Top Banner Tag */}
              <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Best Value • Pay Once, Own Forever</span>
              </div>

              <div>
                <div className="flex items-center justify-between pt-1 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Lifetime Access Pass
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlan === 'lifetime' ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                  }`}>
                    {selectedPlan === 'lifetime' && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 my-3">
                  <span className="text-3xl font-extrabold text-white font-mono">₹2,000</span>
                  <span className="text-xs text-textSecondary font-sans font-medium">/ one-time</span>
                </div>

                <p className="text-[11px] text-amber-400 font-medium bg-amber-400/10 border border-amber-400/20 rounded-lg p-2 leading-relaxed">
                  Pay once and get lifetime access to everything. Zero recurring subscriptions or fees.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-textSecondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Lifetime unlock for all 3,399 questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Unlimited timed mock interviews forever</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>All 659 company frequency roadmaps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>All future platform updates included</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400">
                One-time payment • Never charged again.
              </div>
            </div>

            {/* Offer 2: 1-Month Membership */}
            <div
              onClick={() => {
                sounds.playClick();
                setSelectedPlan('monthly');
              }}
              className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedPlan === 'monthly'
                  ? 'bg-[#12161E] border-amber-400 shadow-xl shadow-amber-400/10 ring-1 ring-amber-400/40'
                  : 'bg-[#12161E]/40 border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    1-Month Membership
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlan === 'monthly' ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                  }`}>
                    {selectedPlan === 'monthly' && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 my-3">
                  <span className="text-3xl font-extrabold text-white font-mono">₹299</span>
                  <span className="text-xs text-textSecondary font-sans font-medium">/ month</span>
                </div>

                <p className="text-[11px] text-zinc-300 bg-white/[0.03] border border-white/[0.06] rounded-lg p-2 leading-relaxed">
                  Billed monthly. Full platform unlock with complete flexibility to cancel anytime.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-textSecondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Full platform unlock for 1 month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Unlimited timed mock simulations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>All 659 company frequency roadmaps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Cancel with 1-click anytime</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400">
                Billed monthly at ₹299 • Cancel anytime.
              </div>
            </div>
          </div>

          {/* Action Buttons: Buy Me a Coffee + Verification */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleBuyMeACoffeeCheckout}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FFDD00] hover:bg-[#F2D100] text-black text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-lg shadow-[#FFDD00]/20 group"
            >
              <Coffee className="w-4 h-4 fill-black" />
              <span>
                Pay {selectedPlan === 'lifetime' ? '₹2,000 via Buy Me a Coffee (Lifetime Access)' : '₹299/mo via Buy Me a Coffee (1 Month)'}
              </span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center gap-2 justify-center">
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={isVerifying}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 py-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with database...</span>
                  </>
                ) : (
                  <span>Already paid? Click here to Verify & Activate Pro</span>
                )}
              </button>
            </div>
          </div>

          {/* Security & Payment Badges */}
          <div className="border-t border-white/[0.06] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-textMuted">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>UPI, Cards, Apple Pay, Google Pay & NetBanking Supported</span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">UPI</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">GPay</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">PayTM</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Cards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;

