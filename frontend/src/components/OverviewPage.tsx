import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Clock,
  Users,
  Flame,
  Calendar,
  Code2,
  Bookmark,
  Check,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { Question, UserStoreState, CompanyMeta } from '../types';
import { sounds } from '../utils/sound';
import { DifficultyBadge } from './ui/DifficultyBadge';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { calculateStreaks, getTodayKey } from '../services/storage';
import { AdBanner } from './AdBanner';

interface OverviewPageProps {
  questions: Question[];
  companies?: Record<string, CompanyMeta>;
  store: UserStoreState;
  onNavigateToQuestions: () => void;
  onNavigateToProblem: (id: number) => void;
  onNavigateToCompany?: (slug: string) => void;
  onOpenMockModal?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  questions,
  store,
  onNavigateToQuestions,
  onNavigateToProblem,
  onOpenMockModal,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { currentStreak } = useMemo(
    () => calculateStreaks(store.activityLog || {}),
    [store.activityLog]
  );
  const todayKey = getTodayKey();
  const todaySolved = (store.activityLog || {})[todayKey] || 0;
  const targetGoal = user.dailyTarget || store.dailyGoal || 3;

  // Bookmarked questions state
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setBookmarkedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Overall progress calculations across all questions
  const totalQuestionsCount = questions.length || 3399;
  const totalSolved = useMemo(() => {
    return Object.values(store.progress || {}).filter(
      (p) => p.status === 'solved' || p.status === 'mastered'
    ).length;
  }, [store.progress]);

  const easyTotal = useMemo(() => questions.filter((q) => q.difficulty === 'Easy').length || 830, [questions]);
  const medTotal = useMemo(() => questions.filter((q) => q.difficulty === 'Medium').length || 1720, [questions]);
  const hardTotal = useMemo(() => questions.filter((q) => q.difficulty === 'Hard').length || 849, [questions]);

  const { easySolved, medSolved, hardSolved, reviewCount, masteredCount } = useMemo(() => {
    let easy = 0;
    let med = 0;
    let hard = 0;
    let review = 0;
    let mastered = 0;

    Object.entries(store.progress || {}).forEach(([qId, p]) => {
      if (p.status === 'review') review++;
      if (p.status === 'mastered') mastered++;
      if (p.status === 'solved' || p.status === 'mastered') {
        const q = questions.find((item) => String(item.id) === String(qId));
        if (q?.difficulty === 'Easy') easy++;
        else if (q?.difficulty === 'Hard') hard++;
        else med++;
      }
    });

    return { easySolved: easy, medSolved: med, hardSolved: hard, reviewCount: review, masteredCount: mastered };
  }, [store.progress, questions]);

  const solveRate = useMemo(() => {
    const denom = totalSolved + reviewCount;
    if (denom === 0) return '0.0%';
    return `${((totalSolved / denom) * 100).toFixed(1)}%`;
  }, [totalSolved, reviewCount]);

  const progressPercent = totalQuestionsCount > 0 ? ((totalSolved / totalQuestionsCount) * 100).toFixed(1) : '0.0';
  const overallRatio = totalQuestionsCount > 0 ? Math.min(1, totalSolved / totalQuestionsCount) : 0;
  const overallDashoffset = 251.32 * (1 - overallRatio);

  // Daily goal checklist state with dynamic progress
  const [goalOverrides, setGoalOverrides] = useState<Record<string, boolean>>({});

  const goals = useMemo(() => {
    const baseGoals = [
      {
        id: '1',
        text: `Solve ${targetGoal} problems (${todaySolved}/${targetGoal} today)`,
        autoCompleted: todaySolved >= targetGoal,
      },
      {
        id: '2',
        text: `Review target company set (${user.targetCompany || 'Google'})`,
        autoCompleted: false,
      },
      {
        id: '3',
        text: 'Take 45-min mock interview simulation',
        autoCompleted: false,
      },
      {
        id: '4',
        text: 'Revise Spaced Repetition queue',
        autoCompleted: reviewCount === 0 && totalSolved > 0,
      },
      {
        id: '5',
        text: 'Read community solutions & patterns',
        autoCompleted: false,
      },
    ];

    return baseGoals.map((g) => ({
      id: g.id,
      text: g.text,
      completed: goalOverrides[g.id] !== undefined ? goalOverrides[g.id] : g.autoCompleted,
    }));
  }, [todaySolved, targetGoal, user.targetCompany, reviewCount, totalSolved, goalOverrides]);

  const toggleGoal = (id: string) => {
    sounds.playClick();
    setGoalOverrides((prev) => {
      const current = goals.find((g) => g.id === id)?.completed ?? false;
      return { ...prev, [id]: !current };
    });
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progressRatio = completedCount / goals.length;
  const strokeDashoffset = 251.32 * (1 - progressRatio);

  // Recent Questions data derived from real store.progress
  const solvedProgressEntries = useMemo(() => {
    return Object.entries(store.progress || {})
      .filter(([_, p]) => p.status === 'solved' || p.status === 'mastered')
      .map(([id, p]) => ({
        id: Number(id),
        status: p.status,
        lastSolved: p.lastSolvedAt ? new Date(p.lastSolvedAt).getTime() : 0,
      }))
      .sort((a, b) => b.lastSolved - a.lastSolved);
  }, [store.progress]);

  const recentQuestions = useMemo(() => {
    return solvedProgressEntries.slice(0, 5).map((entry, idx) => {
      const q = questions.find((item) => item.id === entry.id);
      const companyNames = q ? Object.keys(q.companies || {}) : [];
      const primaryCompany = companyNames[0] || 'General';

      let solvedAt = 'Recently';
      if (entry.lastSolved > 0) {
        const diffMs = Date.now() - entry.lastSolved;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) solvedAt = `${diffDays}d ago`;
        else if (diffHours > 0) solvedAt = `${diffHours}h ago`;
        else solvedAt = 'Just now';
      }

      return {
        id: entry.id,
        num: idx + 1,
        title: q ? q.title : `Question #${entry.id}`,
        difficulty: (q ? q.difficulty : 'Medium') as any,
        company: primaryCompany,
        companySlug: primaryCompany.toLowerCase(),
        solvedAt,
      };
    });
  }, [solvedProgressEntries, questions]);

  // Dynamic 7-day practice activity bar chart
  const { chartBars, weekSolved, avgDaily, totalTimeDisplay } = useMemo(() => {
    const log = store.activityLog || {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const bars = [];
    let weekTotal = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = log[key] || 0;
      weekTotal += count;
      bars.push({
        day: days[d.getDay()],
        key,
        count,
        isToday: i === 0,
      });
    }

    const maxCount = Math.max(...bars.map((b) => b.count), 1);
    const formattedBars = bars.map((b) => ({
      day: b.day,
      height: b.count === 0 ? '8%' : `${Math.min(100, Math.round((b.count / maxCount) * 85) + 15)}%`,
      count: b.count,
      active: b.isToday && b.count > 0,
    }));

    const dailyAvg = (weekTotal / 7).toFixed(1);
    const estTimeMinutes = weekTotal * 20;
    const timeDisplay = estTimeMinutes >= 60 
      ? `${Math.floor(estTimeMinutes / 60)}h ${estTimeMinutes % 60}m` 
      : `${estTimeMinutes}m`;

    return {
      chartBars: formattedBars,
      weekSolved: weekTotal,
      avgDaily: dailyAvg,
      totalTimeDisplay: timeDisplay,
    };
  }, [store.activityLog]);

  // Brand logos
  const renderCompanyLogo = (company: string) => {
    switch (company.toLowerCase()) {
      case 'google':
        return (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        );
      case 'amazon':
        return (
          <div className="w-4 h-4 rounded bg-[#FF9900] text-black font-black text-[10px] flex items-center justify-center shrink-0">
            a
          </div>
        );
      case 'microsoft':
        return (
          <div className="w-4 h-4 grid grid-cols-2 gap-0.5 shrink-0">
            <div className="bg-[#F25022] rounded-[1px]" />
            <div className="bg-[#7FBA00] rounded-[1px]" />
            <div className="bg-[#00A4EF] rounded-[1px]" />
            <div className="bg-[#FFB900] rounded-[1px]" />
          </div>
        );
      case 'meta':
        return (
          <svg className="w-4 h-4 shrink-0 text-[#0081FB]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
          </svg>
        );
      default:
        return <Code2 className="w-4 h-4 text-accent" />;
    }
  };


  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-[#F3F4F6] font-sans">
      {/* Top Banner Ad (Free Tier only) */}
      <AdBanner format="horizontal" variant="google-cloud" slotId="dash-top-banner" className="mb-2" />

      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {user.name ? user.name.split(' ')[0] : 'Developer'}</span>
            <span className="inline-block hover:rotate-12 transition-transform cursor-default select-none">👋</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Consistency today. Opportunities tomorrow. Track your journey to top-tier engineering roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToQuestions()}
          >
            Explore 3,399 Qs
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => {
              if (onOpenMockModal) onOpenMockModal();
            }}
          >
            Start Mock Interview
          </Button>
        </div>
      </div>

      {/* Main Grid: Left (8 cols) + Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Row 1: 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Companies */}
            <div
              onClick={() => {
                sounds.playClick();
                navigate('/companies');
              }}
              className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] hover:border-accent/30 rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Companies</span>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tracking-tight">659</span>
                <span className="text-xs text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </div>

            {/* Card 2: Questions */}
            <div
              onClick={() => {
                sounds.playClick();
                onNavigateToQuestions();
              }}
              className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] hover:border-accent/30 rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Questions</span>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tracking-tight">3,399</span>
                <span className="text-xs text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </div>

            {/* Card 3: Recent Windows */}
            <div
              onClick={() => {
                sounds.playClick();
                onNavigateToQuestions();
              }}
              className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] hover:border-accent/30 rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Timeframes</span>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tracking-tight">5 Windows</span>
                <span className="text-xs text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </div>

            {/* Card 4: Community */}
            <div
              onClick={() => {
                sounds.playClick();
                navigate('/community');
              }}
              className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] hover:border-accent/30 rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Access</span>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-accent transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tracking-tight">100% Free</span>
                <span className="text-xs text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Practice Activity + Today's Goal */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Practice Activity Card (7 Columns) */}
            <div className="md:col-span-7 bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <h2 className="text-sm font-semibold text-white">Practice Activity</h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">Past 7 Days</span>
              </div>

              {/* Body: 7-day Bar Chart + Stats */}
              <div className="flex items-end justify-between gap-5 pt-2">
                {/* 7-Day Vertical Bar Chart */}
                <div className="flex-1 flex items-end justify-between gap-2 h-28 pb-1">
                  {chartBars.map((bar, idx) => (
                    <div key={`${bar.day}-${idx}`} className="flex flex-col items-center gap-2 flex-1 h-full justify-end" title={`${bar.count} solved`}>
                      <div
                        className={`w-full max-w-[14px] rounded-md transition-all duration-300 ${
                          bar.active
                            ? 'bg-accent shadow-[0_0_14px_rgba(229,255,0,0.35)]'
                            : bar.count > 0
                            ? 'bg-accent/70 hover:bg-accent'
                            : 'bg-zinc-800 hover:bg-zinc-700'
                        }`}
                        style={{ height: bar.height }}
                      />
                      <span className={`text-[11px] font-sans ${bar.active ? 'text-accent font-semibold' : 'text-zinc-500'}`}>
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Stat Summary */}
                <div className="shrink-0 space-y-3 pl-4 border-l border-white/[0.08]">
                  <div>
                    <p className="text-xs text-zinc-500">This Week</p>
                    <p className="text-2xl font-bold text-white tracking-tight mt-0.5">{weekSolved}</p>
                    <p className="text-[11px] text-zinc-400">questions solved</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] space-y-1">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span className="text-zinc-500">Time:</span>
                      <span className="font-semibold text-white font-mono">{totalTimeDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span className="text-zinc-500">Streak:</span>
                      <span className="font-semibold text-accent font-mono">{currentStreak} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Goal Card (5 Columns) */}
            <div className="md:col-span-5 bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-white">Daily Target</h2>
                </div>
                <span className="text-xs font-mono text-zinc-400">{completedCount} of {goals.length}</span>
              </div>

              {/* Progress Ring + Checklist */}
              <div className="flex items-center gap-4 pt-1">
                {/* Progress Ring */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-white/[0.06]"
                      strokeWidth="7"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-accent transition-all duration-500 ease-out"
                      strokeWidth="7"
                      strokeDasharray="251.32"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">
                      {Math.round(progressRatio * 100)}%
                    </span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="flex-1 space-y-1.5 text-xs">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className="w-full flex items-center gap-2 text-left group cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                          goal.completed
                            ? 'bg-accent text-black font-bold'
                            : 'border border-zinc-700 bg-transparent group-hover:border-zinc-500'
                        }`}
                      >
                        {goal.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span
                        className={`text-xs transition-colors truncate font-sans ${
                          goal.completed ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      >
                        {goal.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Recent Questions Card */}
          <div className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">Recent Questions</h2>
              </div>
              <button
                onClick={() => onNavigateToQuestions()}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All Questions</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Modern Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-xs text-zinc-400 border-b border-white/[0.06]">
                    <th className="py-2.5 px-3 w-10 font-mono text-[11px]">#</th>
                    <th className="py-2.5 px-3 font-medium">Question</th>
                    <th className="py-2.5 px-3 font-medium">Difficulty</th>
                    <th className="py-2.5 px-3 font-medium">Company</th>
                    <th className="py-2.5 px-3 font-medium">Solved</th>
                    <th className="py-2.5 px-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentQuestions.length > 0 ? (
                    recentQuestions.map((q) => (
                      <tr
                        key={q.id}
                        onClick={() => {
                          sounds.playClick();
                          onNavigateToProblem(q.id);
                        }}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-mono text-zinc-500 text-xs">{q.num}</td>
                        <td className="py-3 px-3 font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {q.title}
                        </td>
                        <td className="py-3 px-3">
                          <DifficultyBadge difficulty={q.difficulty} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {renderCompanyLogo(q.company)}
                            <span className="text-zinc-300 text-xs">{q.company}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-xs font-sans">
                          {q.solvedAt}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => toggleBookmark(String(q.id), e)}
                            className="p-1.5 rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Bookmark"
                          >
                            <Bookmark
                              className={`w-4 h-4 ${
                                bookmarkedIds[String(q.id)]
                                  ? 'text-accent fill-accent'
                                  : 'text-zinc-500'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-7 h-7 text-zinc-600" />
                          <p className="text-zinc-300 font-medium">No solved questions yet</p>
                          <p className="text-zinc-500 text-[11px] max-w-sm">
                            Pick problems from top companies or curated lists. Your solved questions will appear here automatically.
                          </p>
                          <button
                            onClick={() => onNavigateToQuestions()}
                            className="mt-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-black font-semibold text-xs hover:bg-[#d4ed00] transition-colors cursor-pointer"
                          >
                            Solve Your First Question
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Top Target Companies */}
          <div className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">Top Companies</h2>
              </div>
              <button
                onClick={() => navigate('/companies')}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Browse All 659</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'google', name: 'Google', badge: 'Tier 1', diff: 'Medium' as const },
                { id: 'amazon', name: 'Amazon', badge: 'Tier 1', diff: 'Medium' as const },
                { id: 'meta', name: 'Meta', badge: 'Tier 1', diff: 'Hard' as const },
                { id: 'microsoft', name: 'Microsoft', badge: 'Tier 1', diff: 'Medium' as const },
                { id: 'apple', name: 'Apple', badge: 'Tier 1', diff: 'Hard' as const },
                { id: 'netflix', name: 'Netflix', badge: 'Tier 1', diff: 'Hard' as const },
                { id: 'uber', name: 'Uber', badge: 'Unicorn', diff: 'Medium' as const },
                { id: 'adobe', name: 'Adobe', badge: 'Enterprise', diff: 'Medium' as const },
              ].map((c) => {
                const count = questions.filter((q) => !!q.companies[c.name]).length;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      sounds.playClick();
                      navigate(`/questions?company=${c.id}`);
                    }}
                    className="p-3.5 rounded-xl bg-[#11141A]/70 backdrop-blur-xs border border-white/[0.06] hover:border-white/[0.16] hover:bg-[#141820]/80 transition-all cursor-pointer group flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {renderCompanyLogo(c.name)}
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans font-medium text-zinc-500">
                        {c.badge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-mono text-zinc-400">
                        {count > 0 ? `${count} Qs` : 'Tagged'}
                      </span>
                      <DifficultyBadge difficulty={c.diff} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Your Progress Overview */}
          <div className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">Your Progress Overview</h2>
              </div>
              <button
                onClick={() => navigate('/progress')}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Detailed Analytics</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Circular Completion Ring */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 bg-[#11141A] rounded-xl border border-white/[0.06]">
                <div className="relative w-28 h-28 flex items-center justify-center">
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
                      className="text-accent transition-all duration-700 ease-out"
                      strokeWidth="8"
                      strokeDasharray="251.32"
                      strokeDashoffset={overallDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white font-sans">
                      {totalSolved}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-sans">
                      / {totalQuestionsCount}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-accent font-sans">
                  {progressPercent}% Complete
                </p>
              </div>

              {/* Difficulty Breakdown Bars */}
              <div className="sm:col-span-8 space-y-3.5">
                {/* Easy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Easy
                    </span>
                    <span className="font-mono text-zinc-400 text-xs">
                      {easySolved} / {easyTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (easySolved / easyTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Medium
                    </span>
                    <span className="font-mono text-zinc-400 text-xs">
                      {medSolved} / {medTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (medSolved / medTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Hard */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Hard
                    </span>
                    <span className="font-mono text-zinc-400 text-xs">
                      {hardSolved} / {hardTotal}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (hardSolved / hardTotal) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Mastery Status Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
                  <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                    <p className="text-[10px] text-zinc-500">Mastered</p>
                    <p className="text-xs font-bold text-white mt-0.5">{masteredCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                    <p className="text-[10px] text-zinc-500">In Review</p>
                    <p className="text-xs font-bold text-amber-400 mt-0.5">{reviewCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] text-center">
                    <p className="text-[10px] text-zinc-500">Solve Rate</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">{solveRate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Actions (4 Columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Target Focus / Recommended Action */}
          <div className="rounded-xl border border-white/[0.08] p-5 bg-[#0E1217]/75 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-accent uppercase font-sans">
                TARGET INTERVIEW TRACK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.06] text-zinc-400">
                FAANG L4/E4
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {user.targetCompany ? `${user.targetCompany} Technical Loop` : 'Tier-1 FAANG Technical Loop'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Focus on Dynamic Programming, Graph Traversals, and optimal space invariants.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#11141A]/70 backdrop-blur-xs border border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[11px] text-zinc-400">Recommended Next:</p>
                <p className="text-xs font-semibold text-white">45-min Timed Simulation</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onOpenMockModal) onOpenMockModal();
                }}
              >
                Launch
              </Button>
            </div>
          </div>

          {/* Card 2: Real Streak Card */}
          <div className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                currentStreak > 0
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-white/[0.03] border border-white/[0.06] text-zinc-500'
              }`}>
                <Flame className={`w-6 h-6 ${currentStreak > 0 ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'}`} />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white font-sans tracking-tight">{currentStreak}</span>
                  <span className="text-xs text-zinc-400">day streak</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {currentStreak > 0
                    ? currentStreak >= 30
                      ? 'Top 1% consistency on platform'
                      : currentStreak >= 7
                      ? 'Top 10% consistency among peers'
                      : 'Keep practicing daily to grow streak'
                    : 'Solve 1 question today to start your streak'}
                </p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              currentStreak > 0
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-zinc-500 bg-white/[0.04] border border-white/[0.06]'
            }`}>
              {currentStreak > 0 ? 'Active 🔥' : '0 Days'}
            </span>
          </div>

          {/* Ad Slot 2: Sidebar / Right Rail (Free Tier only) */}
          <AdBanner format="sidebar" variant="copilot" slotId="dash-sidebar-banner" className="my-2" />

          {/* Card 3: Upcoming Schedule Card */}
          <div className="bg-[#0E1217]/75 backdrop-blur-md border border-white/[0.08] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Practice Milestones</h3>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  if (onOpenMockModal) onOpenMockModal();
                }}
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                Schedule &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => {
                  sounds.playClick();
                  if (onOpenMockModal) onOpenMockModal();
                }}
                className="p-3 rounded-lg bg-[#11141A] border border-white/[0.04] hover:border-white/[0.12] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-accent transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                    {user.targetCompany || 'Google'} Loop Simulation
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">45-min timed session • On demand</p>
                </div>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  navigate('/bookmarks');
                }}
                className="p-3 rounded-lg bg-[#11141A] border border-white/[0.04] hover:border-white/[0.12] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-accent transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                    Spaced Repetition Review Queue
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {reviewCount > 0 ? `${reviewCount} questions due for spaced repetition` : 'All caught up • 0 pending'}
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  navigate('/practice');
                }}
                className="p-3 rounded-lg bg-[#11141A] border border-white/[0.04] hover:border-white/[0.12] transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-accent transition-colors">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                    Daily Targeted Drill
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {todaySolved} of {targetGoal} questions solved today
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Start Practice CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full text-center"
            onClick={() => {
              sounds.playSuccess();
              onNavigateToQuestions();
            }}
          >
            <span>Start Practice Session</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
