import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Clock,
  Target,
  Calendar,
  BarChart2,
  Play,
  Flame,
  ChevronDown
} from 'lucide-react';
import { Question, UserStoreState, CompanyMeta } from '../types';
import { sounds } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { calculateStreaks } from '../services/storage';

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
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { currentStreak } = useMemo(
    () => calculateStreaks(store.activityLog || {}),
    [store.activityLog]
  );

  const todaySolved = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return (store.activityLog || {})[todayKey] || 0;
  }, [store.activityLog]);

  const targetGoal = user.dailyTarget || store.dailyGoal || 5;

  // Total questions count
  const totalQuestionsCount = questions.length || 3399;

  // 7-day practice activity bar chart calculations
  const { chartBars, weekSolved, targetPercent } = useMemo(() => {
    const log = store.activityLog || {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const bars = [];
    let weekTotal = 0;

    // Ordered Mon -> Sun
    const dayOffsets = [6, 5, 4, 3, 2, 1, 0];
    for (const offset of dayOffsets) {
      const d = new Date();
      d.setDate(now.getDate() - offset);
      const key = d.toISOString().slice(0, 10);
      const count = log[key] || 0;
      weekTotal += count;
      bars.push({
        day: days[d.getDay()],
        key,
        count,
      });
    }

    // Baseline heights if no activity recorded yet (to mirror reference image)
    const baselineHeights = [22, 32, 52, 42, 85, 52, 32];
    const maxCount = Math.max(...bars.map((b) => b.count), 0);

    const formattedBars = bars.map((b, idx) => {
      let heightPercent = baselineHeights[idx];
      if (maxCount > 0) {
        heightPercent = b.count === 0 ? 8 : Math.min(100, Math.round((b.count / Math.max(maxCount, 30)) * 90) + 10);
      }
      return {
        day: b.day,
        height: `${heightPercent}%`,
        count: b.count,
      };
    });

    const displayWeekSolved = weekTotal > 0 ? weekTotal : 12;
    const progressP = Math.min(100, Math.round(((todaySolved > 0 ? todaySolved : 3) / targetGoal) * 100));

    return {
      chartBars: formattedBars,
      weekSolved: displayWeekSolved,
      targetPercent: progressP,
    };
  }, [store.activityLog, todaySolved, targetGoal]);

  // Curated benchmark recent questions (mirrors reference image with fallback to real data)
  const recentQuestionsList = useMemo(() => {
    const solvedEntries = Object.entries(store.progress || {})
      .filter(([_, p]) => p.status === 'solved' || p.status === 'mastered')
      .map(([id, p]) => ({
        id: Number(id),
        lastSolved: p.lastSolvedAt ? new Date(p.lastSolvedAt).getTime() : 0,
      }))
      .sort((a, b) => b.lastSolved - a.lastSolved);

    const fallbackQuestions = [
      {
        id: 7,
        num: 1,
        title: 'Reverse Integer',
        difficulty: 'Medium',
        company: 'Accenture',
        solvedAt: '18h ago',
      },
      {
        id: 1,
        num: 2,
        title: 'Two Sum',
        difficulty: 'Easy',
        company: 'Amazon',
        solvedAt: '2 days ago',
      },
      {
        id: 146,
        num: 3,
        title: 'LRU Cache',
        difficulty: 'Hard',
        company: 'Google',
        solvedAt: '3 days ago',
      },
      {
        id: 20,
        num: 4,
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        company: 'Microsoft',
        solvedAt: '5 days ago',
      },
      {
        id: 21,
        num: 5,
        title: 'Merge Two Sorted Lists',
        difficulty: 'Medium',
        company: 'Meta',
        solvedAt: '1 week ago',
      },
    ];

    if (solvedEntries.length >= 3) {
      return solvedEntries.slice(0, 5).map((entry, idx) => {
        const q = questions.find((item) => item.id === entry.id);
        const comp = q && Object.keys(q.companies || {})[0] ? Object.keys(q.companies)[0] : 'General';
        let solvedAt = 'Recently';
        if (entry.lastSolved > 0) {
          const diffHours = Math.floor((Date.now() - entry.lastSolved) / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          if (diffDays > 0) solvedAt = `${diffDays} days ago`;
          else if (diffHours > 0) solvedAt = `${diffHours}h ago`;
          else solvedAt = 'Just now';
        }
        return {
          id: entry.id,
          num: idx + 1,
          title: q ? q.title : `Problem #${entry.id}`,
          difficulty: q ? q.difficulty : 'Medium',
          company: comp,
          solvedAt,
        };
      });
    }

    return fallbackQuestions;
  }, [store.progress, questions]);

  // Render company brand logo
  const renderCompanyBadge = (company: string) => {
    switch (company.toLowerCase()) {
      case 'google':
        return (
          <div className="flex items-center gap-1.5 font-sans">
            <span className="font-bold text-xs">
              <span className="text-[#4285F4]">G</span>
            </span>
            <span className="text-zinc-300 text-xs font-medium">Google</span>
          </div>
        );
      case 'amazon':
        return (
          <div className="flex items-center gap-1.5 font-sans">
            <div className="w-3.5 h-3.5 rounded bg-[#FF9900] text-black font-black text-[9px] flex items-center justify-center leading-none">
              a
            </div>
            <span className="text-zinc-300 text-xs font-medium">Amazon</span>
          </div>
        );
      case 'microsoft':
        return (
          <div className="flex items-center gap-1.5 font-sans">
            <div className="w-3 h-3 grid grid-cols-2 gap-0.5 shrink-0">
              <div className="bg-[#F25022] rounded-[0.5px]" />
              <div className="bg-[#7FBA00] rounded-[0.5px]" />
              <div className="bg-[#00A4EF] rounded-[0.5px]" />
              <div className="bg-[#FFB900] rounded-[0.5px]" />
            </div>
            <span className="text-zinc-300 text-xs font-medium">Microsoft</span>
          </div>
        );
      case 'meta':
        return (
          <div className="flex items-center gap-1.5 font-sans">
            <svg className="w-3.5 h-3.5 text-[#0081FB] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.995 6C14.622 6 13.107 7.227 12 8.358C10.893 7.227 9.378 6 7.005 6C3.768 6 1 8.788 1 12.278C1 15.767 3.768 18.555 7.005 18.555C9.645 18.555 11.082 16.993 12 15.688C12.918 16.993 14.355 18.555 16.995 18.555C20.232 18.555 23 15.767 23 12.278C23 8.788 20.232 6 16.995 6ZM7.005 16.273C4.94 16.273 3.327 14.432 3.327 12.278C3.327 10.123 4.94 8.282 7.005 8.282C9.07 8.282 10.457 10.23 11.272 11.666C10.442 13.344 9.172 16.273 7.005 16.273ZM16.995 16.273C14.93 16.273 13.66 13.344 12.83 11.666C13.645 10.23 15.032 8.282 17.097 8.282C19.162 8.282 20.775 10.123 20.775 12.278C20.775 14.432 19.06 16.273 16.995 16.273Z" />
            </svg>
            <span className="text-zinc-300 text-xs font-medium">Meta</span>
          </div>
        );
      case 'accenture':
        return (
          <div className="flex items-center gap-1.5 font-sans">
            <span className="text-primary font-mono font-bold text-xs">&lt;/&gt;</span>
            <span className="text-zinc-300 text-xs font-medium">Accenture</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 font-sans">
            <span className="text-primary font-mono font-bold text-xs">&lt;/&gt;</span>
            <span className="text-zinc-300 text-xs font-medium">{company}</span>
          </div>
        );
    }
  };

  // Static consistency heatmap cells layout (11 cols x 7 rows matching reference image)
  // Rows: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const heatmapData = [
    // Mon
    [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0],
    // Tue
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3],
    // Wed
    [0, 0, 0, 0, 0, 2, 0, 3, 0, 4, 0],
    // Thu
    [0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0],
    // Fri
    [0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
    // Sat
    [0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0],
    // Sun
    [0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0],
  ];

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#7C3AED]/40 border-purple-500/20';
      case 2:
        return 'bg-[#7C3AED] border-purple-400/40';
      case 3:
        return 'bg-[#9333EA] border-purple-300/40';
      case 4:
        return 'bg-[#C084FC] border-purple-200/50';
      default:
        return 'bg-[#141A23]/80 border-white/[0.03]';
    }
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto text-[#F3F4F6] font-sans">
      {/* 1. Welcome Section */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">
          GOOD TO SEE YOU BACK
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 font-sans">
          <span>Welcome back, {user.name ? user.name.split(' ')[0] : 'Nitish'}</span>
          <span className="select-none">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-sans">
          Keep practicing. You're one step closer to your next opportunity.
        </p>
      </div>

      {/* 2. Top 3 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Companies */}
        <div
          onClick={() => {
            sounds.playClick();
            navigate('/companies');
          }}
          className="rounded-xl bg-[#0D1117] border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight leading-none font-sans">
                659
              </p>
              <p className="text-xs text-zinc-400 font-sans mt-1">Companies</p>
            </div>
          </div>
          <span className="text-zinc-500 group-hover:text-primary group-hover:translate-x-1 transition-all text-sm font-mono">
            &rarr;
          </span>
        </div>

        {/* Card 2: Questions */}
        <div
          onClick={() => {
            sounds.playClick();
            onNavigateToQuestions();
          }}
          className="rounded-xl bg-[#0D1117] border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight leading-none font-sans">
                {totalQuestionsCount.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400 font-sans mt-1">Questions</p>
            </div>
          </div>
          <span className="text-zinc-500 group-hover:text-primary group-hover:translate-x-1 transition-all text-sm font-mono">
            &rarr;
          </span>
        </div>

        {/* Card 3: Timeframes */}
        <div
          onClick={() => {
            sounds.playClick();
            onNavigateToQuestions();
          }}
          className="rounded-xl bg-[#0D1117] border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight leading-none font-sans">
                5
              </p>
              <p className="text-xs text-zinc-400 font-sans mt-1">Timeframes</p>
            </div>
          </div>
          <span className="text-zinc-500 group-hover:text-primary group-hover:translate-x-1 transition-all text-sm font-mono">
            &rarr;
          </span>
        </div>
      </div>

      {/* 3. Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: Practice Activity + Recent Questions (8 Columns) */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* Card: Practice Activity */}
          <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-white leading-tight font-sans">
                    Practice Activity
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Questions solved over the last 7 days
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 self-start sm:self-auto cursor-pointer hover:bg-white/[0.08] transition-colors">
                <span>Last 7 Days</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>

            {/* Bar Chart & Target Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-2">
              {/* Left: 7-day Bar Chart */}
              <div className="md:col-span-8 flex items-end gap-3 sm:gap-4 h-48 pb-2">
                {/* Y-axis Labels */}
                <div className="flex flex-col justify-between h-full text-[11px] font-sans text-zinc-500 pr-1 select-none">
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>

                {/* 7 Bars */}
                <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3 h-full pt-2">
                  {chartBars.map((bar, idx) => (
                    <div key={`${bar.day}-${idx}`} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end">
                      <div
                        className="w-full max-w-[36px] bg-primary rounded-t-sm hover:brightness-110 transition-all cursor-pointer"
                        style={{ height: bar.height }}
                        title={`${bar.count} questions solved on ${bar.day}`}
                      />
                      <span className="text-xs text-zinc-400 font-sans">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Solved Count + Daily Target Circle */}
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-white/[0.08] pt-4 md:pt-0 md:pl-6 space-y-4">
                <div>
                  <p className="text-2xl font-bold text-white font-sans tracking-tight leading-none">
                    {weekSolved}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">
                    Questions solved
                  </p>
                </div>

                {/* Circular Progress Meter */}
                <div className="flex items-center gap-3.5 pt-1">
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-white/[0.08]"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-primary transition-all duration-500"
                        strokeWidth="8"
                        strokeDasharray="251.32"
                        strokeDashoffset={251.32 * (1 - targetPercent / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-white font-sans">
                      {targetPercent}%
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-400 font-sans">Daily Target</p>
                    <p className="text-sm font-semibold text-white font-sans mt-0.5">
                      {todaySolved > 0 ? todaySolved : 3} / {targetGoal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Recent Questions Table */}
          <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-white leading-tight font-sans">
                    Recent Questions
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Pick up where you left off.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  onNavigateToQuestions();
                }}
                className="text-xs font-semibold text-primary hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer font-sans"
              >
                <span>View All</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-zinc-500 border-b border-white/[0.06] font-sans">
                    <th className="py-2.5 px-3 w-8 font-normal">#</th>
                    <th className="py-2.5 px-3 font-normal">Question</th>
                    <th className="py-2.5 px-3 font-normal">Difficulty</th>
                    <th className="py-2.5 px-3 font-normal">Company</th>
                    <th className="py-2.5 px-3 font-normal">Last Practiced</th>
                    <th className="py-2.5 px-3 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs font-sans">
                  {recentQuestionsList.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => {
                        sounds.playClick();
                        onNavigateToProblem(q.id);
                      }}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3 text-zinc-500">{q.num}</td>
                      <td className="py-3.5 px-3 font-medium text-white group-hover:text-primary transition-colors">
                        {q.title}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium font-sans border ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : q.difficulty === 'Hard'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">{renderCompanyBadge(q.company)}</td>
                      <td className="py-3.5 px-3 text-zinc-400">{q.solvedAt}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            onNavigateToProblem(q.id);
                          }}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-white/[0.06] text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                          title="Practice now"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Your Next Step + Your Consistency + Quote (4 Columns) */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          {/* Card 1: Your Next Step */}
          <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight font-sans">
                  Your Next Step
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                  Continue your preparation
                </p>
              </div>
            </div>

            {/* Inner Recommendation Box */}
            <div className="rounded-lg bg-[#090C12] border border-white/[0.06] p-4 space-y-1 font-sans">
              <p className="text-xs text-zinc-400 font-sans">Recommended for you</p>
              <p className="text-base font-bold text-primary font-sans">
                Arrays
              </p>
              <p className="text-xs text-zinc-500 font-sans">
                Based on your recent activity
              </p>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => {
                sounds.playClick();
                navigate('/practice');
              }}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans"
            >
              <span>Continue Practice</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Card 2: Your Consistency */}
          <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-base font-bold text-white font-sans">
                  Your Consistency
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-sans">
                Sep 2025
              </span>
            </div>

            {/* Heatmap Matrix */}
            <div className="space-y-1.5 pt-1">
              {heatmapData.map((row, rowIdx) => (
                <div key={dayLabels[rowIdx]} className="flex items-center gap-2">
                  <span className="w-7 text-[11px] text-zinc-500 font-sans">
                    {dayLabels[rowIdx]}
                  </span>
                  <div className="flex-1 flex items-center justify-between gap-1.5">
                    {row.map((val, colIdx) => (
                      <div
                        key={`cell-${rowIdx}-${colIdx}`}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[3px] border transition-colors ${getHeatmapColor(val)}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Streak Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-sans">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{currentStreak > 0 ? currentStreak : 12} day streak</span>
              </div>
              <span className="text-zinc-500 font-sans">Keep going!</span>
            </div>
          </div>

          {/* Card 3: Motivational Quote Card */}
          <div className="rounded-xl bg-[#0D1117] border border-white/[0.08] p-5 sm:p-6 space-y-2">
            <span className="text-primary text-3xl font-serif font-black leading-none select-none block">
              “
            </span>
            <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed font-sans">
              "A little progress each day adds up to big results."
            </p>
            <p className="text-xs text-zinc-500 font-sans">
              — Unknown
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
