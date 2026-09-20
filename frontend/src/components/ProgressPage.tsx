import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  Clock,
  Target,
  Award,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Question, UserStoreState } from '../types';

interface ProgressPageProps {
  questions: Question[];
  store: UserStoreState;
}

const CORE_TOPICS = [
  { topic: 'Arrays & Hashing', tags: ['Array', 'Hash Table', 'String'], color: 'bg-emerald-500' },
  { topic: 'Two Pointers', tags: ['Two Pointers'], color: 'bg-emerald-500' },
  { topic: 'Sliding Window', tags: ['Sliding Window'], color: 'bg-emerald-500' },
  { topic: 'Trees & BST', tags: ['Tree', 'Binary Tree', 'Binary Search Tree'], color: 'bg-primary' },
  { topic: 'Dynamic Programming', tags: ['Dynamic Programming'], color: 'bg-primary' },
  { topic: 'Graphs & BFS/DFS', tags: ['Graph', 'Breadth-First Search', 'Depth-First Search'], color: 'bg-primary' },
  { topic: 'Binary Search', tags: ['Binary Search'], color: 'bg-blue-400' },
  { topic: 'Backtracking', tags: ['Backtracking'], color: 'bg-blue-400' },
  { topic: 'Heap & Priority Queue', tags: ['Heap (Priority Queue)', 'Heap'], color: 'bg-purple-400' },
];

export const ProgressPage: React.FC<ProgressPageProps> = ({
  questions,
  store,
}) => {
  const navigate = useNavigate();

  // Dynamic progress stats
  const totalQuestions = questions.length || 3399;
  const totalSolved = useMemo(() => {
    return Object.values(store.progress).filter(
      (p) => p.status === 'solved' || p.status === 'mastered'
    ).length;
  }, [store.progress]);

  const completionPct = totalQuestions > 0 ? ((totalSolved / totalQuestions) * 100).toFixed(1) : '0.0';
  const progressRatio = totalQuestions > 0 ? Math.min(1, totalSolved / totalQuestions) : 0;
  const dashoffset = 251.32 * (1 - progressRatio);

  const { easySolved, medSolved, hardSolved, reviewCount, masteredCount, easyTotal, medTotal, hardTotal } = useMemo(() => {
    let easy = 0, med = 0, hard = 0, review = 0, mastered = 0;
    let totalE = 0, totalM = 0, totalH = 0;

    questions.forEach((q) => {
      if (q.difficulty === 'Easy') totalE++;
      else if (q.difficulty === 'Hard') totalH++;
      else totalM++;
    });

    Object.entries(store.progress).forEach(([qId, p]) => {
      if (p.status === 'review') review++;
      if (p.status === 'mastered') mastered++;
      if (p.status === 'solved' || p.status === 'mastered') {
        const q = questions.find((item) => String(item.id) === String(qId));
        if (q?.difficulty === 'Easy') easy++;
        else if (q?.difficulty === 'Hard') hard++;
        else med++;
      }
    });

    return {
      easySolved: easy,
      medSolved: med,
      hardSolved: hard,
      reviewCount: review,
      masteredCount: mastered,
      easyTotal: totalE || 830,
      medTotal: totalM || 1720,
      hardTotal: totalH || 849,
    };
  }, [store.progress, questions]);

  // Dynamically compute real Topic Mastery from user progress
  const topicMasteryList = useMemo(() => {
    return CORE_TOPICS.map((ct) => {
      const matching = questions.filter((q) =>
        q.topics?.some((t) => ct.tags.some((tag) => tag.toLowerCase() === t.toLowerCase()))
      );
      const total = matching.length;
      const solved = matching.filter((q) => {
        const p = store.progress[String(q.id)];
        return p?.status === 'solved' || p?.status === 'mastered';
      }).length;
      const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
      return {
        topic: ct.topic,
        solved,
        total,
        pct,
        color: ct.color,
      };
    });
  }, [questions, store.progress]);

  const globalAccuracy = useMemo(() => {
    const attempted = totalSolved + reviewCount;
    if (attempted === 0) return '--';
    return `${((totalSolved / attempted) * 100).toFixed(1)}%`;
  }, [totalSolved, reviewCount]);

  const consistencyText = useMemo(() => {
    if (totalSolved === 0) return 'Start solving questions to establish consistency telemetry.';
    if (totalSolved < 10) return 'Solid start! Continue solving to advance in percentiles.';
    if (totalSolved < 50) return 'Top 35% consistency among active engineering candidates.';
    return 'Top 15% consistency among active interview candidates.';
  }, [totalSolved]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Progress & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-sans">
            Skill Mastery & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
            Detailed performance telemetry across all 3,399 interview questions, algorithmic categories, and consistency metrics.
          </p>
        </div>

        <button
          onClick={() => navigate('/questions')}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-[#D4ED00] text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 cursor-pointer font-sans shrink-0"
        >
          <span>Continue Solving</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 1: Macro Solved Ring Card (5 cols) + Difficulty Breakdown Card (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Overall Mastery (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">Overall Completion</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">Macro Index</span>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-white/[0.06]"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-primary transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray="251.32"
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white font-mono">
                {totalSolved}
              </span>
              <span className="text-xs text-textMuted font-mono">
                / {totalQuestions}
              </span>
            </div>
          </div>

          <div className="w-full">
            <p className="text-lg font-bold text-primary font-mono">
              {completionPct}% Complete
            </p>
            <p className="text-xs text-textSecondary mt-1">
              {consistencyText}
            </p>
          </div>

          <div className="w-full grid grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.06]">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-textMuted uppercase font-medium">Mastered</p>
              <p className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">{masteredCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-textMuted uppercase font-medium">Review</p>
              <p className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">{reviewCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-textMuted uppercase font-medium">Global Acc</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-400 font-mono mt-0.5">{globalAccuracy}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Difficulty Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">Difficulty Breakdown</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">3 Tiers</span>
          </div>

          <div className="space-y-4">
            {/* Easy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Easy Problems
                </span>
                <span className="font-mono text-zinc-300">
                  {easySolved} / {easyTotal} <span className="text-textMuted text-[11px]">({easyTotal > 0 ? ((easySolved / easyTotal) * 100).toFixed(0) : 0}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${easyTotal > 0 ? Math.min(100, Math.max(2, (easySolved / easyTotal) * 100)) : 0}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Medium Problems
                </span>
                <span className="font-mono text-zinc-300">
                  {medSolved} / {medTotal} <span className="text-textMuted text-[11px]">({medTotal > 0 ? ((medSolved / medTotal) * 100).toFixed(0) : 0}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${medTotal > 0 ? Math.min(100, Math.max(2, (medSolved / medTotal) * 100)) : 0}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  Hard Problems
                </span>
                <span className="font-mono text-zinc-300">
                  {hardSolved} / {hardTotal} <span className="text-textMuted text-[11px]">({hardTotal > 0 ? ((hardSolved / hardTotal) * 100).toFixed(0) : 0}%)</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${hardTotal > 0 ? Math.min(100, Math.max(2, (hardSolved / hardTotal) * 100)) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-textSecondary flex-wrap gap-2">
            <span>Target recommendation for Tier-1 SWE: <strong>120+ Medium, 30+ Hard</strong></span>
            <button
              onClick={() => navigate('/questions?difficulty=Medium')}
              className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer font-sans"
            >
              <span>Solve Mediums</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Topic Mastery Card */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm sm:text-base font-semibold text-white">Algorithmic Topic Mastery</h2>
          </div>
          <span className="text-xs text-textMuted font-mono">Core Paradigms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicMasteryList.map((t) => (
            <div
              key={t.topic}
              onClick={() => navigate(`/questions?topic=${encodeURIComponent(t.topic)}`)}
              className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] hover:border-primary/50 transition-all cursor-pointer group space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 group-hover:text-primary transition-colors">
                  {t.topic}
                </span>
                <span className="font-mono text-textMuted text-[11px]">
                  {t.solved} / {t.total}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${t.color}`}
                  style={{ width: `${t.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
