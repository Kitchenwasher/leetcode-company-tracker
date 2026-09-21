import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CompanyMeta, Question, UserProgressItem } from '../types';
import {
  X, Calendar, Target, Flame, CheckCircle2, TrendingUp, Sparkles,
  Clock, ShieldAlert, Award, ArrowRight, Layers, Crown, Lock
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface PrepPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Record<string, CompanyMeta>;
  allQuestions: Question[];
  progress: Record<string, UserProgressItem>;
  onSelectCompany: (companyId: string) => void;
}

export const PrepPlannerModal: React.FC<PrepPlannerModalProps> = ({
  isOpen,
  onClose,
  companies,
  allQuestions,
  progress,
  onSelectCompany,
}) => {
  const { user, updateProfile, isPro, setShowSubscriptionModal } = useAuth();

  // Default target date: 30 days from now
  const defaultDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [selectedCompany, setSelectedCompany] = useState<string>(user.targetCompany || 'google');
  const [targetDate, setTargetDate] = useState<string>(user.targetDate || defaultDateStr());
  const [dailyQuota, setDailyQuota] = useState<number>(user.dailyTarget || 3);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate days remaining
  const now = new Date().getTime();
  const targetTime = new Date(targetDate).getTime();
  const diffDays = Math.max(1, Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24)));

  // Target company stats
  const companyMeta = companies[selectedCompany] || companies['google'];
  const totalPlannedProblems = diffDays * dailyQuota;

  // Company questions count
  const companyQuestions = allQuestions.filter(q => q.companies[selectedCompany]);
  const companySolvedCount = companyQuestions.filter(q => {
    const st = progress[String(q.id)]?.status;
    return st === 'solved' || st === 'mastered';
  }).length;

  const currentVelocity = (companySolvedCount / Math.max(1, totalPlannedProblems)) * 100;

  const handleSavePlan = () => {
    if (!isPro) {
      sounds.playTimerAlert();
      setShowSubscriptionModal(true);
      return;
    }

    sounds.playSuccess();
    updateProfile({
      targetCompany: selectedCompany,
      targetDate,
      dailyTarget: dailyQuota,
    });
    onSelectCompany(selectedCompany);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Company Interview Pacing Planner</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/40">
                  FAANG Milestone Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reverse-engineer your study schedule to peak exactly on interview day
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white capitalize focus:outline-none focus:border-borderActive"
              >
                {Object.keys(companies).slice(0, 50).map((cid) => (
                  <option key={cid} value={cid}>
                    {companies[cid]?.name || cid}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Interview Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-borderActive"
              />
            </div>

            {/* Daily Commitment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Daily Problem Target
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={dailyQuota}
                  onChange={(e) => setDailyQuota(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-borderActive"
                />
                <span className="text-xs text-slate-400 shrink-0">q/day</span>
              </div>
            </div>
          </div>

          {/* Metrics Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Days Remaining
              </span>
              <span className="text-2xl font-black text-medium">
                {diffDays}d
              </span>
            </div>
            <div className="text-center border-x border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Problems
              </span>
              <span className="text-2xl font-black text-primary">
                {totalPlannedProblems}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Hours
              </span>
              <span className="text-2xl font-black text-primary">
                {Math.round(totalPlannedProblems * 0.5)}h
              </span>
            </div>
          </div>

          {/* 4-Phase Milestone Timeline */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Recommended 4-Phase Preparation Schedule</span>
            </h4>

            <div className="space-y-3">
              {/* Phase 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-medium">
                    Phase 1: 30-Day Hot Recency Sprint (Days 1–{Math.max(2, Math.round(diffDays * 0.25))})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ~{Math.round(totalPlannedProblems * 0.25)} questions
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Focus on questions asked by {companyMeta?.name || selectedCompany} in the last 30 days. These have highest likelihood of reappearing in upcoming screening rounds.
                </p>
              </div>

              {/* Phase 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-primary">
                    Phase 2: 3-Month Core Foundation & Deep Patterns (Days {Math.max(3, Math.round(diffDays * 0.25) + 1)}–{Math.round(diffDays * 0.6)})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ~{Math.round(totalPlannedProblems * 0.35)} questions
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Master Trees, Dynamic Programming, Graphs, and medium/hard patterns that recurrently test problem-solving depth.
                </p>
              </div>

              {/* Phase 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-primary">
                    Phase 3: Cross-Company Overlap Matrix (Days {Math.round(diffDays * 0.6) + 1}–{Math.round(diffDays * 0.85)})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ~{Math.round(totalPlannedProblems * 0.25)} questions
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Tackle high-overlap staples asked across Meta, Google, and Amazon to build rock-solid pattern recognition under slight problem variations.
                </p>
              </div>

              {/* Phase 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-hard">
                    Phase 4: Speed Drills & 45-Min Mock Crucible (Days {Math.round(diffDays * 0.85) + 1}–{diffDays})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ~{Math.round(totalPlannedProblems * 0.15)} questions
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Timed simulation rounds using the Mock Interview simulator. Practice verbalizing invariants, dry-running edge cases, and writing production C++.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Target company: <span className="font-semibold text-white capitalize">{selectedCompany}</span>
          </div>

          {isPro ? (
            <button
              onClick={handleSavePlan}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-bold hover:bg-primaryHover text-xs shadow-lg shadow-primary/20 transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Plan Saved to Profile!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Save & Set as Active Pacing Plan</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSavePlan}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Unlock Active Pacing Plan with Pro &rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
