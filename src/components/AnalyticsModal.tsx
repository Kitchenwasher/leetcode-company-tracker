import React, { useMemo } from 'react';
import { Question, UserProgressItem, CompanyMeta, UserStoreState } from '../types';
import { X, BarChart3, Flame, Award, Calendar, CheckCircle2, Download, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { calculateStreaks, exportBackupJSON, generateDemoProgress } from '../services/storage';
import { sounds } from '../utils/sound';

interface AnalyticsModalProps {
  state: UserStoreState;
  questions: Question[];
  companies: Record<string, CompanyMeta>;
  onClose: () => void;
  onImportBackup: (imported: UserStoreState) => void;
  onLoadDemoData: () => void;
  onResetProgress: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  state,
  questions,
  companies,
  onClose,
  onImportBackup,
  onLoadDemoData,
  onResetProgress,
}) => {
  const { progress, activityLog, selectedCompany } = state;
  const { currentStreak, longestStreak } = useMemo(() => calculateStreaks(activityLog), [activityLog]);

  // Solved Stats
  const stats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0, totalSolved = 0, mastered = 0, dueReview = 0;
    const now = new Date().getTime();

    Object.values(progress).forEach((item) => {
      const q = questions.find((x) => String(x.id) === String(item.questionId));
      if (!q) return;

      if (item.status === 'solved' || item.status === 'mastered') {
        totalSolved++;
        if (item.status === 'mastered') mastered++;
        if (q.difficulty === 'Easy') easy++;
        else if (q.difficulty === 'Medium') medium++;
        else if (q.difficulty === 'Hard') hard++;
      }

      if (item.nextReviewAt && new Date(item.nextReviewAt).getTime() <= now) {
        dueReview++;
      }
    });

    return { easy, medium, hard, totalSolved, mastered, dueReview };
  }, [progress, questions]);

  // Company specific progress
  const companyProgress = useMemo(() => {
    const targetQ = questions.filter((q) => !!q.companies[selectedCompany]);
    let solvedInCompany = 0;
    targetQ.forEach((q) => {
      const p = progress[String(q.id)];
      if (p && (p.status === 'solved' || p.status === 'mastered')) {
        solvedInCompany++;
      }
    });
    const pct = targetQ.length > 0 ? (solvedInCompany / targetQ.length) * 100 : 0;
    return {
      total: targetQ.length,
      solved: solvedInCompany,
      percentage: pct.toFixed(1),
    };
  }, [questions, progress, selectedCompany]);

  // Generate 52-week activity grid data (364 days)
  const heatmapData = useMemo(() => {
    const cells = [];
    const today = new Date();
    const daysToShow = 52 * 7; // 364 days

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const count = activityLog[dateStr] || 0;
      cells.push({ date: dateStr, count });
    }
    return cells;
  }, [activityLog]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.progress) {
          onImportBackup(parsed);
          sounds.playSuccess();
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/80';
    if (count === 1) return 'bg-emerald-900 border border-emerald-700/50';
    if (count === 2) return 'bg-emerald-700 border border-emerald-600/60';
    if (count <= 4) return 'bg-emerald-500 border border-emerald-400/80';
    return 'bg-emerald-400 border border-white/60';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Analytics & Preparation Metrics</h2>
              <p className="text-xs text-slate-400">Track interview readiness, solve velocity, and consistency streaks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Solved */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total Solved</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">{stats.totalSolved}</span>
                <span className="text-xs text-slate-500">/ {questions.length}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {stats.mastered} mastered, {stats.dueReview} due review
              </div>
            </div>

            {/* Target Company Readiness */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium capitalize">
                {companies[selectedCompany]?.name || selectedCompany} Prep
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-indigo-400">{companyProgress.percentage}%</span>
                <span className="text-xs text-slate-500">
                  ({companyProgress.solved}/{companyProgress.total})
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${companyProgress.percentage}%` }}
                />
              </div>
            </div>

            {/* Current Streak */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Current Streak
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-amber-400">{currentStreak}</span>
                <span className="text-xs text-slate-500">days</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Longest: {longestStreak} days
              </div>
            </div>

            {/* Daily Goal */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Daily Target</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{state.dailyGoal}</span>
                <span className="text-xs text-slate-500">problems / day</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                Keep the momentum going!
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown Progress Bars */}
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Solved by Difficulty Breakdown
            </h3>

            <div className="space-y-2.5">
              {/* Easy */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-400">Easy ({stats.easy})</span>
                  <span className="font-mono text-slate-400">
                    {stats.totalSolved > 0 ? ((stats.easy / stats.totalSolved) * 100).toFixed(0) : 0}% of solved
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${stats.totalSolved > 0 ? (stats.easy / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-400">Medium ({stats.medium})</span>
                  <span className="font-mono text-slate-400">
                    {stats.totalSolved > 0 ? ((stats.medium / stats.totalSolved) * 100).toFixed(0) : 0}% of solved
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${stats.totalSolved > 0 ? (stats.medium / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-400">Hard ({stats.hard})</span>
                  <span className="font-mono text-slate-400">
                    {stats.totalSolved > 0 ? ((stats.hard / stats.totalSolved) * 100).toFixed(0) : 0}% of solved
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${stats.totalSolved > 0 ? (stats.hard / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Activity Consistency Heatmap (Last 52 Weeks)
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-900" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-700" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
                <span>More</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div
                className="grid grid-flow-col gap-1 w-max"
                style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
              >
                {heatmapData.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} questions solved`}
                    className={`w-3 h-3 rounded-xs ${getHeatColor(cell.count)} transition-transform hover:scale-125 cursor-pointer`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Backup, Restore & Demo Data Management */}
          <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">Data Management & Backup</h4>
              <p className="text-[11px] text-slate-400">Export your solved questions and notes, or restore from a previous JSON backup.</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Load Demo Data */}
              <button
                onClick={() => {
                  if (confirm('Load demo progress data to preview charts & streaks?')) {
                    onLoadDemoData();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                title="Populate 35 demo solved problems"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                Load Demo Data
              </button>

              {/* Export JSON */}
              <button
                onClick={() => exportBackupJSON(state)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Export JSON
              </button>

              {/* Import JSON */}
              <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                Import JSON
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Reset */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all solved progress and notes?')) {
                    onResetProgress();
                  }
                }}
                className="flex items-center gap-1 p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40"
                title="Reset All Progress"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end px-5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
