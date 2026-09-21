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
} from 'lucide-react';
import { Question, UserStoreState, CompanyMeta } from '../types';
import { sounds } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { calculateStreaks, getTodayKey } from '../services/storage';
import CompanyLogo, { getCompanyDisplayName } from './CompanyLogo';
import GlideSelect from './ui/GlideSelect';

interface OverviewPageProps {
  questions: Question[];
  companies?: Record<string, CompanyMeta>;
  store: UserStoreState;
  onNavigateToQuestions: () => void;
  onNavigateToProblem: (id: number | string) => void;
  onNavigateToCompany?: (slug: string) => void;
  onOpenMockModal?: () => void;
}

export const getDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  questions,
  store,
  onNavigateToQuestions,
  onNavigateToProblem,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'7' | '14' | '30'>('7');

  // Unified live activity: sync between store.activityLog and all store.progress records
  const unifiedActivity = useMemo(() => {
    const activity: Record<string, number> = { ...(store.activityLog || {}) };
    Object.values(store.progress || {}).forEach((p) => {
      if ((p?.status === 'solved' || p?.status === 'mastered') && p?.lastSolvedAt) {
        try {
          const dateKey = getDateKey(new Date(p.lastSolvedAt));
          if (!activity[dateKey]) {
            activity[dateKey] = 1;
          }
        } catch {}
      }
    });
    return activity;
  }, [store.activityLog, store.progress]);

  const { currentStreak } = useMemo(
    () => calculateStreaks(unifiedActivity),
    [unifiedActivity]
  );

  const todayKey = getTodayKey();
  const todaySolved = useMemo(() => {
    return unifiedActivity[todayKey] || 0;
  }, [unifiedActivity, todayKey]);

  const targetGoal = user.dailyTarget || store.dailyGoal || 5;

  // Total questions count
  const totalQuestionsCount = questions.length || 3399;

  // Live Practice activity bar chart calculations based on selected timeframe
  const { chartBars, periodSolved, targetPercent, yMax } = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const numDays = parseInt(timeframe, 10) || 7;
    const bars = [];
    let periodTotal = 0;

    for (let offset = numDays - 1; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(now.getDate() - offset);
      const key = getDateKey(d);
      const count = unifiedActivity[key] || 0;
      periodTotal += count;
      bars.push({
        day: days[d.getDay()],
        key,
        count,
        isToday: key === todayKey,
      });
    }

    const maxSolved = Math.max(...bars.map((b) => b.count), 0);
    const calculatedYMax = Math.max(Math.ceil((maxSolved || targetGoal) / 5) * 5, 5);

    const formattedBars = bars.map((b) => {
      const heightPercent = b.count === 0 ? 4 : Math.min(100, Math.round((b.count / calculatedYMax) * 100));
      return {
        day: b.day,
        key: b.key,
        height: `${heightPercent}%`,
        count: b.count,
        isToday: b.isToday,
      };
    });

    const progressP = Math.min(100, Math.round((todaySolved / targetGoal) * 100));

    return {
      chartBars: formattedBars,
      periodSolved: periodTotal,
      targetPercent: progressP,
      yMax: calculatedYMax,
    };
  }, [unifiedActivity, timeframe, todayKey, todaySolved, targetGoal]);

  // Current month & year for Consistency Heatmap
  const currentMonthName = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());
  }, []);

  // Real live 11-week activity heatmap
  const { liveHeatmapData, dayLabels } = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const cols = 11;
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const matrix: { count: number; key: string; dateStr: string }[][] = Array.from({ length: 7 }, () => []);

    for (let c = 0; c < cols; c++) {
      const weekOffset = cols - 1 - c;
      for (let r = 0; r < 7; r++) {
        const d = new Date(now);
        const daysAgo = weekOffset * 7 + (currentDay - r);
        d.setDate(now.getDate() - daysAgo);
        const key = getDateKey(d);
        const count = unifiedActivity[key] || 0;
        const isFuture = daysAgo < 0;
        matrix[r].push({
          count: isFuture ? 0 : count,
          key,
          dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    return { liveHeatmapData: matrix, dayLabels: labels };
  }, [unifiedActivity]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-white/[0.03] border-white/[0.05]';
    if (count <= 1) return 'bg-purple-900/60 border-purple-700/50 text-purple-300';
    if (count <= 3) return 'bg-purple-700/80 border-purple-500/60 text-purple-200';
    return 'bg-purple-500 border-purple-400 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]';
  };

  // Real Next Step Recommendation based on actual problem activity
  const recommendation = useMemo(() => {
    // 1. Check if user has an in-progress question
    const inProgressEntries = Object.entries(store.progress || {}).filter(
      ([_, p]) => p?.status === 'in-progress'
    );
    if (inProgressEntries.length > 0) {
      const q = questions.find((item) => String(item.id) === inProgressEntries[0][0]);
      if (q && q.topics && q.topics[0]) {
        return {
          topic: q.topics[0],
          reason: 'Pick up where you left off',
          qId: q.id,
        };
      }
    }

    // 2. Count solved per algorithm topic to find least practiced area
    const topicSolveCount: Record<string, number> = {};
    const TOP_DSA = [
      'Arrays',
      'Two Pointers',
      'Sliding Window',
      'Binary Search',
      'Trees',
      'Dynamic Programming',
      'Graphs',
      'Stack',
      'Heap',
    ];

    TOP_DSA.forEach((t) => {
      topicSolveCount[t] = 0;
    });

    Object.entries(store.progress || {}).forEach(([id, p]) => {
      if (p?.status === 'solved' || p?.status === 'mastered') {
        const q = questions.find((item) => String(item.id) === id);
        if (q && q.topics) {
          q.topics.forEach((top) => {
            const match = TOP_DSA.find((dsa) => top.toLowerCase().includes(dsa.toLowerCase()));
            if (match) topicSolveCount[match] = (topicSolveCount[match] || 0) + 1;
          });
        }
      }
    });

    const sortedTopics = TOP_DSA.slice().sort((a, b) => (topicSolveCount[a] || 0) - (topicSolveCount[b] || 0));
    const recommendedTopic = sortedTopics[0] || 'Arrays';

    return {
      topic: recommendedTopic,
      reason: 'Recommended based on your practice progress',
      qId: null,
    };
  }, [store.progress, questions]);

  // Live recent questions from store progress
  const recentQuestionsList = useMemo(() => {
    const activeEntries = Object.entries(store.progress || {})
      .filter(([_, p]) => p?.status === 'solved' || p?.status === 'mastered' || p?.status === 'in-progress')
      .map(([id, p]) => ({
        id: Number(id),
        lastSolved: p.lastSolvedAt ? new Date(p.lastSolvedAt).getTime() : 0,
        status: p.status,
      }))
      .sort((a, b) => b.lastSolved - a.lastSolved);

    if (activeEntries.length > 0) {
      return activeEntries.slice(0, 5).map((entry, idx) => {
        const q = questions.find((item) => Number(item.id) === entry.id);
        const compKeys = Object.keys(q?.companies || {});
        const primaryComp = compKeys[0] ? compKeys[0] : 'general';
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
          title: q?.title || `Problem #${entry.id}`,
          difficulty: q?.difficulty || 'Medium',
          company: primaryComp,
          status: entry.status,
          solvedAt,
        };
      });
    }

    // Default top curated questions if user has 0 activity yet
    const defaultIds = [1, 7, 146, 20, 21];
    return defaultIds.map((id, idx) => {
      const q = questions.find((item) => Number(item.id) === id);
      const compKeys = Object.keys(q?.companies || {});
      return {
        id,
        num: idx + 1,
        title: q?.title || `Problem #${id}`,
        difficulty: q?.difficulty || 'Medium',
        company: compKeys[0] || 'amazon',
        status: 'todo',
        solvedAt: 'Recommended',
      };
    });
  }, [store.progress, questions]);

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1550px] mx-auto text-[#F3F4F6] font-sans">
      {/* 1. Welcome Section */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-sans">
          GOOD TO SEE YOU BACK
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2 font-sans">
          <span>Welcome back, {user.name ? user.name.split(' ')[0] : 'Bismeet'}</span>
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
          className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer group"
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
          className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer group"
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
          className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer group"
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

      {/* 3. Main Split Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT COLUMN: Practice Activity + Recent Questions (8 Columns) */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* Card: Practice Activity */}
          <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-white leading-tight font-sans">
                    Practice Activity
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Questions solved over the last {timeframe} days
                  </p>
                </div>
              </div>

              <GlideSelect
                options={[
                  { value: '7', label: 'Last 7 Days', searchText: 'Last 7 Days' },
                  { value: '14', label: 'Last 14 Days', searchText: 'Last 14 Days' },
                  { value: '30', label: 'Last 30 Days', searchText: 'Last 30 Days' },
                ]}
                value={timeframe}
                onChange={(val) => {
                  sounds.playClick();
                  setTimeframe(val as '7' | '14' | '30');
                }}
                size="sm"
                menuWidth={140}
                radius={8}
                accentColor="var(--theme-accent, #A855F7)"
                surfaceColor="#11141A"
                highlightColor="#1C222D"
                textColor="#F3F4F6"
                className="shrink-0 self-start sm:self-auto"
                ariaLabel="Practice activity timeframe"
              />
            </div>

            {/* Bar Chart & Target Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-2">
              {/* Left: Bar Chart */}
              <div className="md:col-span-8 flex items-end gap-3 sm:gap-4 h-48 pb-2">
                {/* Y-axis Labels */}
                <div className="flex flex-col justify-between h-full text-[11px] font-sans text-zinc-500 pr-1 select-none">
                  <span>{yMax}</span>
                  <span>{Math.round(yMax * 0.66)}</span>
                  <span>{Math.round(yMax * 0.33)}</span>
                  <span>0</span>
                </div>

                {/* Dynamic Bars */}
                <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2.5 h-full pt-2">
                  {chartBars.map((bar, idx) => (
                    <div
                      key={`${bar.key}-${idx}`}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group/bar relative"
                    >
                      <div className="absolute -top-7 px-2 py-0.5 rounded bg-[#161B22] border border-white/[0.12] text-[10px] text-white whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg font-sans">
                        {bar.count} solved • {bar.day}
                      </div>
                      <div
                        className={`w-full max-w-[36px] rounded-t-sm transition-all cursor-pointer ${
                          bar.count > 0
                            ? bar.isToday
                              ? 'bg-purple-500 hover:bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                              : 'bg-primary/90 hover:bg-primary'
                            : 'bg-white/[0.05] hover:bg-white/[0.1]'
                        }`}
                        style={{ height: bar.height }}
                        title={`${bar.count} questions solved on ${bar.day} (${bar.key})`}
                      />
                      <span
                        className={`text-[10px] sm:text-xs font-sans truncate max-w-[28px] sm:max-w-none text-center ${
                          bar.isToday ? 'text-primary font-bold' : 'text-zinc-400'
                        }`}
                      >
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
                    {periodSolved}
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
                      {todaySolved} / {targetGoal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Recent Questions Table */}
          <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-5 sm:p-6 space-y-4">
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
                      <td className="py-3 px-3 text-zinc-500 font-mono">{q.num}</td>
                      <td className="py-3 px-3 font-medium text-white group-hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{q.title}</span>
                          <span className="text-[10px] font-mono text-zinc-500">#{q.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <CompanyLogo companyId={q.company} size="xs" showTooltip={false} />
                          <span className="text-zinc-300 text-xs font-medium">
                            {getCompanyDisplayName(q.company)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{q.solvedAt}</td>
                      <td className="py-3 px-3 text-right">
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
          <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-5 sm:p-6 space-y-4">
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
            <div className="rounded-lg bg-[#090C12]/80 border border-white/[0.06] p-4 space-y-1 font-sans">
              <p className="text-xs text-zinc-400 font-sans">Recommended for you</p>
              <p className="text-base font-bold text-primary font-sans">
                {recommendation.topic}
              </p>
              <p className="text-xs text-zinc-500 font-sans">
                {recommendation.reason}
              </p>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => {
                sounds.playClick();
                if (recommendation.qId) {
                  onNavigateToProblem(recommendation.qId);
                } else {
                  navigate(`/questions?topic=${encodeURIComponent(recommendation.topic)}`);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans"
            >
              <span>Continue Practice</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* Card 2: Your Consistency */}
          <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-base font-bold text-white font-sans">
                  Your Consistency
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-sans">
                {currentMonthName}
              </span>
            </div>

            {/* Heatmap Matrix */}
            <div className="space-y-1.5 pt-1">
              {liveHeatmapData.map((row, rowIdx) => (
                <div key={dayLabels[rowIdx]} className="flex items-center gap-2">
                  <span className="w-7 text-[11px] text-zinc-500 font-sans">
                    {dayLabels[rowIdx]}
                  </span>
                  <div className="flex-1 flex items-center justify-between gap-1 sm:gap-1.5">
                    {row.map((cell, colIdx) => (
                      <div
                        key={`cell-${rowIdx}-${colIdx}`}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] border transition-colors cursor-pointer relative group/cell ${getHeatmapColor(
                          cell.count
                        )}`}
                        title={`${cell.count} questions solved on ${cell.dateStr}`}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#161B22] border border-white/[0.12] text-[9px] text-white whitespace-nowrap opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-20 shadow-md font-sans">
                          {cell.count} solved • {cell.dateStr}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Streak Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-sans">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Flame className={`w-4 h-4 shrink-0 ${currentStreak > 0 ? 'text-amber-500' : 'text-zinc-600'}`} />
                <span>{currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak today'}</span>
              </div>
              <span className="text-zinc-500 font-sans">{currentStreak > 0 ? 'Keep going!' : 'Solve a problem'}</span>
            </div>
          </div>

          {/* Card 3: Motivational Quote Card */}
          <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-5 sm:p-6 space-y-2">
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
