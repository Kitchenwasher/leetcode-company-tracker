import React, { useMemo } from 'react';
import { Question, UserProgressItem, CompanyMeta, UserStoreState } from '../types';
import { X, BarChart3, Flame, Award, Calendar, CheckCircle2, Download, Upload, RefreshCw, Trash2, Sparkles, Target } from 'lucide-react';
import { calculateStreaks, exportBackupJSON } from '../services/storage';
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
    const total = targetQ.length || 1;
    return {
      solved: solvedInCompany,
      total: targetQ.length,
      percentage: Math.round((solvedInCompany / total) * 100),
    };
  }, [questions, progress, selectedCompany]);

  // 52-week activity cells
  const heatmapData = useMemo(() => {
    const cells: { date: string; count: number }[] = [];
    const totalDays = 52 * 7;
    const today = new Date();

    for (let i = totalDays - 1; i >= 0; i--) {
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
    if (count === 0) return 'bg-white/[0.04] border border-white/[0.04]';
    if (count === 1) return 'bg-primary/20 border border-primary/30';
    if (count === 2) return 'bg-primary/45 border border-primary/55';
    if (count <= 4) return 'bg-primary/75 border border-primary';
    return 'bg-primary border border-primary shadow-sm shadow-primary/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0E1217] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Analytics &amp; Performance Telemetry
              </h2>
              <p className="text-xs text-textSecondary mt-0.5">
                Interview readiness index, solve velocity, and consistency streaks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Total Solved */}
            <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.06]">
              <span className="text-xs text-textMuted font-medium uppercase tracking-wider block">Total Solved</span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-bold font-mono text-primary">{stats.totalSolved}</span>
                <span className="text-xs text-textMuted font-mono">/ {questions.length}</span>
              </div>
              <div className="text-xs text-textSecondary mt-1">
                {stats.mastered} mastered • {stats.dueReview} review
              </div>
            </div>

            {/* Target Company Readiness */}
            <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.06]">
              <span className="text-xs text-textMuted font-medium uppercase tracking-wider truncate block">
                {companies[selectedCompany]?.name || selectedCompany} Prep
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-bold font-mono text-white">{companyProgress.percentage}%</span>
                <span className="text-xs text-textMuted font-mono">
                  ({companyProgress.solved}/{companyProgress.total})
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${companyProgress.percentage}%` }}
                />
              </div>
            </div>

            {/* Current Streak */}
            <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.06]">
              <span className="text-xs text-textMuted font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-primary fill-primary" />
                <span>Streak</span>
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-bold font-mono text-primary">{currentStreak}</span>
                <span className="text-xs text-textMuted font-mono">days</span>
              </div>
              <div className="text-xs text-textSecondary mt-1 font-mono">
                Peak: {longestStreak} days
              </div>
            </div>

            {/* Daily Goal */}
            <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.06]">
              <span className="text-xs text-textMuted font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Target</span>
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-bold font-mono text-emerald-400">{state.dailyGoal}</span>
                <span className="text-xs text-textMuted font-mono">problems</span>
              </div>
              <div className="text-xs text-emerald-400/80 mt-1">
                Cadence Active
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown Progress Bars */}
          <div className="p-5 rounded-xl bg-[#12161E]/60 border border-white/[0.06] space-y-3.5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Solved by Difficulty Breakdown
            </h3>

            <div className="space-y-3">
              {/* Easy */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-400">Easy ({stats.easy})</span>
                  <span className="font-mono text-textMuted text-xs">
                    {stats.totalSolved > 0 ? ((stats.easy / stats.totalSolved) * 100).toFixed(0) : 0}% of solved
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${stats.totalSolved > 0 ? (stats.easy / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-400">Medium ({stats.medium})</span>
                  <span className="font-mono text-textMuted text-xs">
                    {stats.totalSolved > 0 ? ((stats.medium / stats.totalSolved) * 100).toFixed(0) : 0}% of solved
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${stats.totalSolved > 0 ? (stats.medium / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-rose-400">Hard ({stats.hard})</span>
                  <span className="font-mono text-textMuted text-xs">
                    {stats.totalSolved > 0 ? ((stats.hard / stats.totalSolved) * 100).toFixed(0) : 0}% of solved
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${stats.totalSolved > 0 ? (stats.hard / stats.totalSolved) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="p-5 rounded-xl bg-[#12161E]/60 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Activity Consistency Heatmap (52 Weeks)</span>
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-textMuted font-mono">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-white/[0.04]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-primary/20" />
                <span className="w-2.5 h-2.5 rounded-xs bg-primary/50" />
                <span className="w-2.5 h-2.5 rounded-xs bg-primary/80" />
                <span className="w-2.5 h-2.5 rounded-xs bg-primary" />
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
          <div className="p-4 rounded-xl bg-[#12161E]/40 border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-white">Data Management &amp; Backup</h4>
              <p className="text-xs text-textMuted mt-0.5">Export progress JSON or load demo telemetry.</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Load Demo Data */}
              <button
                onClick={() => {
                  if (confirm('Load demo progress data to preview charts & streaks?')) {
                    onLoadDemoData();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-textSecondary hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
                title="Populate demo solved problems"
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                <span>Demo Data</span>
              </button>

              {/* Export JSON */}
              <button
                onClick={() => exportBackupJSON(state)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-textSecondary hover:text-white transition-colors border border-white/[0.06] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Export JSON</span>
              </button>

              {/* Import JSON */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-textSecondary hover:text-white transition-colors border border-white/[0.06] cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Restore</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Reset */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all solved progress and notes?')) {
                    onResetProgress();
                  }
                }}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                title="Reset All Progress"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0E1217] flex items-center justify-end px-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white text-xs font-semibold cursor-pointer font-sans"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
