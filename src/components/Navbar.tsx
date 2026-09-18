import React from 'react';
import { CompanyMeta, UserStoreState, Question } from '../types';
import { CompanySelector } from './CompanySelector';
import {
  Flame, BarChart3, Layers, Clock, Dices, Download, Volume2, VolumeX,
  Sun, Moon, Keyboard, CheckCircle2, Sparkles
} from 'lucide-react';
import { exportQuestionsCSV } from '../services/storage';
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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Brand & Company Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 p-0.5 shadow-glow-brand flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-black text-sm bg-gradient-to-r from-amber-400 to-indigo-400 bg-clip-text text-transparent">
                  LT
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">LeetTracker</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Company-Wise Interview Prep</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Company Selector */}
          <CompanySelector
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={onSelectCompany}
          />
        </div>

        {/* Right Side: Solved Stats, Flame Streak, Feature Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Solved Stat Pill */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors shadow-xs"
            title="Total Solved (Click to view Analytics)"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalSolved}</span>
            <span className="text-emerald-500/70 hidden md:inline">solved</span>
          </button>

          {/* Streak Flame Pill */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-colors shadow-xs"
            title="Current Solved Streak"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{currentStreak}d</span>
          </button>

          {/* Random Roulette */}
          <button
            onClick={() => {
              sounds.playClick();
              onRandomRoulette();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-xs"
            title="Random Problem Roulette (Press 'r')"
          >
            <Dices className="w-4 h-4 text-indigo-400" />
            <span className="hidden lg:inline">Roulette</span>
          </button>

          {/* Overlap Finder */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenOverlap();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-indigo-400 transition-colors"
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
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
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
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
            title="Analytics & Heatmap (Press 'a')"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Export CSV */}
          <button
            onClick={() => {
              sounds.playClick();
              exportQuestionsCSV(filteredQuestions, state.progress, selectedCompanyId);
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-blue-400 transition-colors hidden md:flex"
            title="Export current list to CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !state.soundEnabled;
              sounds.setEnabled(next);
              onUpdateState({ soundEnabled: next });
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={state.soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4 text-slate-300" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={() => {
              const nextDark = !state.darkMode;
              onUpdateState({ darkMode: nextDark });
              if (nextDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {state.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenShortcuts();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Keyboard Shortcuts ('?')"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
