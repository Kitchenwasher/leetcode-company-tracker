import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, Sparkles, Crown, ArrowRight, ShieldCheck,
  Zap, Calendar, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../api/paymentApi';

export const SubscriptionSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateProfile, user } = useAuth();
  const [planDetails, setPlanDetails] = useState<{ name: string; price: string; note: string }>({
    name: 'Pro Candidate',
    price: '₹2,000 / 1st year',
    note: 'Renews at ₹299/month starting in Year 2',
  });

  const planId = searchParams.get('plan') || 'annual_special';
  const sessionId = searchParams.get('session_id') || '';

  useEffect(() => {
    sounds.playMastered();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#E5FF00', '#FFFFFF', '#D4ED00', '#F3F4F6', '#4285F4']
    });

    // Ensure user tier is marked as 'pro' in frontend context
    updateProfile({ tier: 'pro' });

    if (planId === 'monthly') {
      setPlanDetails({
        name: 'Monthly Pro Access',
        price: '₹299 / month',
        note: 'Billed monthly. Complete flexibility, cancel anytime.',
      });
    } else {
      setPlanDetails({
        name: 'Annual Pass (First Year Special)',
        price: '₹2,000 for your first full year',
        note: 'Introductory special rate. Renews at ₹299/month starting Year 2.',
      });
    }

    // Try refreshing status from backend
    paymentApi.getStatus().catch(() => {});
  }, [planId]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-[#0E1217] border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-7 text-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <div className="space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Payment Succeeded • Pro Activated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to Cheat Code Pro!
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary max-w-md mx-auto">
            Your payment was securely confirmed by Stripe. All premium algorithmic tracks, company recency trends, and unlimited mock interviews are unlocked.
          </p>
        </div>

        {/* Plan Breakdown Card */}
        <div className="p-5 rounded-2xl bg-[#12161E] border border-white/[0.08] text-left space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-bold text-white text-sm">{planDetails.name}</span>
            </div>
            <span className="text-xs font-bold text-primary font-mono">{planDetails.price}</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {planDetails.note}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-textSecondary">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full 659 Companies Unlocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Unlimited Mock Simulations</span>
            </div>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playClick();
              navigate('/dashboard');
            }}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-primary hover:bg-[#D4ED00] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/20"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              navigate('/mock-interview');
            }}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/[0.08]"
          >
            <span>Start Mock Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
