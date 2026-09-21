import React, { useState } from 'react';
import { CompanyMeta, UserStoreState, Question } from '../types';
import { CompanySelector } from './CompanySelector';
import { UserMenu } from './UserMenu';
import {
  Flame, BarChart3, Layers, Clock, Dices, Download, Volume2, VolumeX,
  Sun, Moon, Keyboard, CheckCircle2, Sparkles, Brain, Calendar, FileText, ChevronDown,
  LayoutDashboard, Menu, Lock
} from 'lucide-react';
import { exportQuestionsCSV } from '../services/storage';
import { exportToAnkiCSV, exportToObsidianMarkdown } from '../utils/exporters';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/sound';

interface NavbarProps {
  companies: Record<string, CompanyMeta>;
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  state: UserStoreState;
  onUpdateState: (patch: Partial<UserStoreState>) => void;
  filteredQuestions: Question[];
  totalSolved: number;
  currentStreak: number;
  onOpenOverlap: () => void;
  onOpenMock: () => void;
  onOpenAnalytics: () => void;
  onOpenShortcuts: () => void;
  onRandomRoulette: () => void;
  onOpenPlanner: () => void;
  onOpenFlashcards: () => void;
  onOpenLeetCodeSync: () => void;
  onGoHome?: () => void;
  onNavigateOverview?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  state,
  onUpdateState,
  filteredQuestions,
  totalSolved,
  currentStreak,
  onOpenOverlap,
  onOpenMock,
  onOpenAnalytics,
  onOpenShortcuts,
  onRandomRoulette,
  onOpenPlanner,
  onOpenFlashcards,
  onOpenLeetCodeSync,
  onGoHome,
  onNavigateOverview,
}) => {
  const { user, isPro, setShowSubscriptionModal } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#080B0F]/90 backdrop-blur-md transition-colors font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Brand & Company Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="Return to Home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary group-hover:bg-primary group-hover:text-black transition-colors">
              CC
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-primary transition-colors">
                  Cheat Code
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30 font-semibold">
                  Beta
                </span>
              </div>
              <span className="text-[10px] text-textMuted hidden sm:inline">Company Tracker</span>
            </div>
          </button>

          {/* Mobile Sidebar Drawer Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              window.dispatchEvent(new CustomEvent('cheatcode_open_sidebar'));
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-textSecondary hover:text-white lg:hidden cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Company Selector */}
          <CompanySelector
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={onSelectCompany}
          />

          {onNavigateOverview && (
            <button
              onClick={() => {
                sounds.playClick();
                onNavigateOverview();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-md shadow-primary/20 hover:bg-purple-600 transition-all cursor-pointer"
              title="Personalized Overview Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          )}
        </div>

        {/* Right Side: Solved Stats, Flame Streak, Feature Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Solved Stat Pill */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-primary/40 text-primary text-xs font-semibold transition-colors cursor-pointer"
            title="Total Solved (Click to view Analytics)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono font-bold text-white">{totalSolved}</span>
            <span className="text-textSecondary hidden md:inline text-[11px]">Solved</span>
          </button>

          {/* Streak Flame Pill */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-amber-400/40 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
            title="Current Solved Streak"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-mono font-bold text-white">{currentStreak}d</span>
          </button>

          {/* Random Roulette */}
          <button
            onClick={() => {
              sounds.playClick();
              onRandomRoulette();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-primary/40 text-textSecondary hover:text-white text-xs font-medium transition-all cursor-pointer"
            title="Random Problem Roulette (Press 'r')"
          >
            <Dices className="w-4 h-4 text-primary" />
            <span className="hidden lg:inline">Roulette</span>
          </button>

          {/* Overlap Finder */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenOverlap();
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-white/20 text-textSecondary hover:text-white transition-colors cursor-pointer"
            title="Company Overlap Matrix (Press 'o')"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Mock Interview */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenMock();
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-white/20 text-textSecondary hover:text-white transition-colors cursor-pointer"
            title="Mock Interview Simulator (Press 'm')"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Analytics */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAnalytics();
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-primary/40 text-textSecondary hover:text-white transition-colors cursor-pointer"
            title="Analytics & Heatmap (Press 'a')"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Prep Planner Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenPlanner();
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-white/20 text-textSecondary hover:text-white transition-colors hidden sm:flex cursor-pointer"
            title="Company Prep Planner"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Flashcard Recall Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFlashcards();
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-primary/40 text-textSecondary hover:text-white transition-colors hidden sm:flex cursor-pointer"
            title="Anki Flashcard Recall Trainer"
          >
            <Brain className="w-4 h-4" />
          </button>

          {/* Export Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                sounds.playClick();
                setShowExportMenu(!showExportMenu);
              }}
              className="flex items-center gap-1 p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-white/20 text-textSecondary hover:text-white transition-colors cursor-pointer"
              title="Export Tools (CSV, Anki, Obsidian)"
            >
              <Download className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-textMuted" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0E1217] border border-white/[0.1] shadow-2xl py-1 z-50 animate-fadeIn divide-y divide-white/[0.06]">
                <button
                  onClick={() => {
                    sounds.playClick();
                    exportQuestionsCSV(filteredQuestions, state.progress, selectedCompanyId);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-textSecondary hover:text-white hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                >
                  <span>Export CSV</span>
                  <span className="text-[10px] text-textMuted font-mono">.csv</span>
                </button>
                {isPro ? (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      exportToAnkiCSV(filteredQuestions, state.progress, `Cheat_Code_${selectedCompanyId}`);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-textSecondary hover:text-white hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                  >
                    <span>Export Anki Deck</span>
                    <span className="text-[10px] text-primary font-mono">.csv</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sounds.playTimerAlert();
                      setShowSubscriptionModal(true);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-textSecondary hover:text-amber-400 hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Export Anki Deck</span>
                    </div>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-400 font-extrabold uppercase font-mono">
                      PRO
                    </span>
                  </button>
                )}
                {isPro ? (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      exportToObsidianMarkdown(filteredQuestions, state.progress, user);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-textSecondary hover:text-white hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                  >
                    <span>Export Obsidian</span>
                    <span className="text-[10px] text-primary font-mono">.md</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sounds.playTimerAlert();
                      setShowSubscriptionModal(true);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-textSecondary hover:text-amber-400 hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Export Obsidian</span>
                    </div>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-400 font-extrabold uppercase font-mono">
                      PRO
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !state.soundEnabled;
              sounds.setEnabled(next);
              onUpdateState({ soundEnabled: next });
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] text-textMuted hover:text-white transition-colors cursor-pointer"
            title={state.soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4 text-textSecondary" /> : <VolumeX className="w-4 h-4 text-textMuted" />}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenShortcuts();
            }}
            className="p-2 rounded-xl bg-[#0E1217] hover:bg-[#12161E] border border-white/[0.08] hover:border-white/20 text-textMuted hover:text-white transition-colors cursor-pointer"
            title="Keyboard Shortcuts ('?')"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-white/[0.08] hidden sm:block" />

          {/* User Menu Dropdown */}
          <UserMenu
            onOpenPlanner={onOpenPlanner}
            onOpenFlashcards={onOpenFlashcards}
            onOpenLeetCodeSync={onOpenLeetCodeSync}
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
