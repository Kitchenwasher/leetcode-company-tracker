import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  Target,
  Trophy,
  Zap,
  Play,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Question, UserStoreState, Difficulty, ProblemStatus } from '../types';
import { sounds } from '../utils/sound';
import { DifficultyBadge } from './ui/DifficultyBadge';
import { calculateStreaks, getTodayKey } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { isQuestionInTrack } from '../data/curatedLists';
import { SprintSessionModal } from './SprintSessionModal';

interface PracticePageProps {
  questions: Question[];
  store: UserStoreState;
  onNavigateToProblem: (id: number | string) => void;
  onUpdateStatus?: (qId: number | string, status: ProblemStatus) => void;
}

const CURATED_TRACKS = [
  {
    id: 'sprint30',
    title: 'Top 30 Sprint',
    description: 'High-yield interview questions asked most frequently in the last 30 days.',
    total: 30,
    color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  },
  {
    id: 'blind75',
    title: 'Blind 75',
    description: 'The definitive standard list of 75 essential algorithmic interview questions.',
    total: 75,
    color: 'from-blue-500/10 to-cyan-500/5 border-blue-500/20',
  },
  {
    id: 'neetcode150',
    title: 'NeetCode 150',
    description: 'Comprehensive roadmap covering all core algorithmic patterns and data structures.',
    total: 150,
    color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
  },
  {
    id: 'striver180',
    title: 'Striver SDE Sheet',
    description: '180 core problems organized by topic for top-tier software engineering interviews.',
    total: 180,
    color: 'from-purple-500/10 to-indigo-500/5 border-purple-500/20',
  },
  {
    id: 'grind169',
    title: 'Grind 169',
    description: 'Curated by the author of Blind 75, weighted by time investment vs interview ROI.',
    total: 169,
    color: 'from-rose-500/10 to-red-500/5 border-rose-500/20',
  },
];

const PARADIGM_DEFS = [
  { name: 'Dynamic Programming', slug: 'Dynamic Programming', icon: '⚡', diff: 'Hard' as Difficulty },
  { name: 'Trees & BST', slug: 'Tree', icon: '🌲', diff: 'Medium' as Difficulty },
  { name: 'Graphs & BFS/DFS', slug: 'Graph', icon: '🕸️', diff: 'Hard' as Difficulty },
  { name: 'Two Pointers', slug: 'Two Pointers', icon: '↔️', diff: 'Medium' as Difficulty },
  { name: 'Binary Search', slug: 'Binary Search', icon: '🔍', diff: 'Medium' as Difficulty },
  { name: 'Greedy Algorithms', slug: 'Greedy', icon: '🎯', diff: 'Medium' as Difficulty },
];

export const PracticePage: React.FC<PracticePageProps> = ({
  questions,
  store,
  onNavigateToProblem,
  onUpdateStatus,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [showSprintModal, setShowSprintModal] = useState<boolean>(false);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  // Today's featured daily question picked deterministically
  const dailyQuestion = useMemo(() => {
    if (!questions.length) {
      return {
        id: 42,
        title: 'Trapping Rain Water',
        difficulty: 'Hard' as Difficulty,
        acceptance: '61.2%',
        topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
        companies: { google: { all: '85%' }, amazon: { all: '92%' } }
      };
    }
    const d = new Date();
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const idx = dayOfYear % questions.length;
    return questions[idx] || questions[0];
  }, [questions]);

  // Overall solved counts
  const totalSolved = useMemo(() => {
    return Object.values(store.progress).filter(
      (p) => p.status === 'solved' || p.status === 'mastered'
    ).length;
  }, [store.progress]);

  // Real streak calculation from user activityLog
  const { currentStreak } = useMemo(() => {
    return calculateStreaks(store.activityLog || {});
  }, [store.activityLog]);

  // Real today's goal calculation
  const todayKey = getTodayKey();
  const todaySolved = (store.activityLog && store.activityLog[todayKey]) || 0;
  const targetGoal = user?.dailyTarget || store.dailyGoal || 3;

  // Real paradigm question counts & solved counts
  const paradigms = useMemo(() => {
    return PARADIGM_DEFS.map((p) => {
      const pQs = questions.filter((q) =>
        q.topics?.some((t) => t.toLowerCase().includes(p.slug.toLowerCase()))
      );
      const solvedCount = pQs.filter((q) => {
        const st = store.progress[String(q.id)]?.status;
        return st === 'solved' || st === 'mastered';
      }).length;
      return { ...p, count: pQs.length, solvedCount };
    });
  }, [questions, store.progress]);

  // Dynamic roadmap progress for Blind 75, NeetCode 150, Striver 180, Grind 169, and Top 30
  const trackProgress = useMemo(() => {
    const result: Record<string, { solved: number; total: number; percent: number }> = {};
    CURATED_TRACKS.forEach((track) => {
      let trackQs = questions.filter((q) => isQuestionInTrack(q.id, track.id as any));
      if (track.id === 'sprint30') {
        trackQs = questions.slice(0, 30);
      }
      const total = trackQs.length || track.total;
      const solved = trackQs.filter((q) => {
        const st = store.progress[String(q.id)]?.status;
        return st === 'solved' || st === 'mastered';
      }).length;
      const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
      result[track.id] = { solved, total, percent };
    });
    return result;
  }, [questions, store.progress]);

  const isDailySolved =
    store.progress[String(dailyQuestion.id)]?.status === 'solved' ||
    store.progress[String(dailyQuestion.id)]?.status === 'mastered';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-white font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Practice Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-sans">
            Targeted Practice & Drills
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
            Sharpen your problem-solving speed with daily challenges, curated roadmaps, and timed speed runs.
          </p>
        </div>

        {/* Quick Stats Strip */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2.5 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-textMuted uppercase font-medium">Solved</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">{totalSolved}</p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-primary fill-primary" />
            <div className="text-left">
              <p className="text-[10px] text-textMuted uppercase font-medium">Streak</p>
              <p className="text-sm sm:text-base font-bold text-white font-mono">{currentStreak} Days</p>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-textMuted uppercase font-medium">Daily Goal</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">
              <span className={todaySolved >= targetGoal ? 'text-primary' : 'text-white'}>
                {todaySolved}
              </span>
              <span className="text-textMuted">/{targetGoal}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Daily Challenge + Timed Sprint */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Today's Featured Challenge (7 cols) */}
        <div className="lg:col-span-7 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Daily Focus Challenge
              </span>
              <span className="text-xs text-textMuted font-mono">• {todayFormatted}</span>
            </div>
            <DifficultyBadge difficulty={dailyQuestion.difficulty} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-textMuted">#{dailyQuestion.id}</span>
              <h2
                className="text-lg sm:text-xl font-bold text-white hover:text-primary transition-colors cursor-pointer"
                onClick={() => {
                  sounds.playSuccess();
                  onNavigateToProblem(dailyQuestion.id);
                }}
              >
                {dailyQuestion.title}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              {dailyQuestion.topics.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-md text-xs bg-white/[0.03] text-textSecondary border border-white/[0.06]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 text-xs text-textSecondary">
              <span>Acceptance: <strong className="text-white font-mono">{dailyQuestion.acceptance}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span>Frequently asked at <strong>Google, Amazon</strong></span>
              </span>
            </div>

            {isDailySolved ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Solved Today</span>
                </span>
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onNavigateToProblem(dailyQuestion.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Review Code
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sounds.playSuccess();
                  onNavigateToProblem(dailyQuestion.id);
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 cursor-pointer font-sans"
              >
                <span>Solve Challenge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Timed Speed Run Sprint (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-semibold text-white">Timed Sprint Session</h2>
            </div>
            <span className="text-[11px] text-primary uppercase font-mono font-medium px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Speed Run
            </span>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            Simulate fast-paced technical assessments. Pick a time limit and solve randomized problem sets against the clock.
          </p>

          <div className="space-y-2">
            <span className="text-xs text-textSecondary font-medium">Select Duration:</span>
            <div className="grid grid-cols-3 gap-2.5">
              {[15, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedDuration(mins);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer font-sans ${
                    selectedDuration === mins
                      ? 'bg-primary text-white shadow-md shadow-primary/25 font-bold'
                      : 'bg-[#12161E] border border-white/[0.08] text-textSecondary hover:text-white hover:border-white/20'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playSuccess();
              setShowSprintModal(true);
            }}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-primary/25"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Launch {selectedDuration}-Min Sprint</span>
          </button>
        </div>
      </div>

      {/* Row 2: Curated Practice Tracks Card */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-semibold text-white">Curated Practice Roadmaps</h2>
          </div>
          <button
            onClick={() => navigate('/questions')}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer font-sans"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURATED_TRACKS.map((track) => {
            const prog = trackProgress[track.id] || { solved: 0, total: track.total, percent: 0 };
            return (
              <div
                key={track.id}
                onClick={() => {
                  sounds.playClick();
                  navigate(`/questions?curated=${track.id}`);
                }}
                className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] hover:border-primary/50 hover:bg-[#12161E] transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <span className="text-[11px] font-mono text-textMuted px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      {prog.total} Qs
                    </span>
                  </div>
                  <p className="text-xs text-textSecondary mt-1.5 line-clamp-2">
                    {track.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs text-textMuted">
                    <span>Track Progress</span>
                    <span className="text-primary font-mono font-medium">
                      {prog.solved} / {prog.total} ({prog.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${prog.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Algorithm Paradigm Workouts Card */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-semibold text-white">Algorithm Paradigm Workouts</h2>
          </div>
          <span className="text-xs text-textMuted">Master core DSA patterns</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {paradigms.map((p) => (
            <div
              key={p.name}
              onClick={() => {
                sounds.playClick();
                navigate(`/questions?topic=${encodeURIComponent(p.slug)}`);
              }}
              className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] hover:border-primary/50 hover:bg-[#12161E] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl select-none">{p.icon}</span>
                <h4 className="text-xs font-semibold text-white group-hover:text-primary transition-colors mt-2">
                  {p.name}
                </h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-textMuted font-mono">
                <span>{p.solvedCount}/{p.count} Solved</span>
                <ArrowRight className="w-3 h-3 text-textMuted group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Speed Run Sprint Modal */}
      {showSprintModal && (
        <SprintSessionModal
          durationMinutes={selectedDuration}
          questions={questions}
          onClose={() => setShowSprintModal(false)}
          onUpdateStatus={onUpdateStatus || (() => {})}
          onNavigateToProblem={onNavigateToProblem}
        />
      )}
    </div>
  );
};

export default PracticePage;
