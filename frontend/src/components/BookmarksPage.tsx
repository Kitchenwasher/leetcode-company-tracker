import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Star,
  RotateCcw,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
  Code2,
  CheckCircle2,
  Filter,
  Download,
  BookOpen,
  Edit3,
  Save,
  Check,
  Zap,
  Trash2
} from 'lucide-react';
import { Question, UserStoreState, ProblemStatus, Difficulty, UserProgressItem } from '../types';
import { sounds } from '../utils/sound';
import { DifficultyBadge } from './ui/DifficultyBadge';
import GlideSelect, { GlideSelectOption } from './ui/GlideSelect';

interface BookmarksPageProps {
  questions: Question[];
  store: UserStoreState;
  onNavigateToProblem: (id: number | string) => void;
  onToggleFavorite: (id: number | string) => void;
  onUpdateStatus: (id: number | string, status: ProblemStatus) => void;
  onSaveProgressPatch?: (id: number | string, patch: Partial<UserProgressItem>) => void;
  onOpenReviewDrill?: () => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  questions,
  store,
  onNavigateToProblem,
  onToggleFavorite,
  onUpdateStatus,
  onSaveProgressPatch,
  onOpenReviewDrill,
}) => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'solved' | 'todo'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | Difficulty>('all');
  const [expandedNotesId, setExpandedNotesId] = useState<string | number | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [justSavedNoteId, setJustSavedNoteId] = useState<string | number | null>(null);

  // All bookmarked / starred questions
  const bookmarkedQuestions = useMemo(() => {
    return questions.filter((q) => {
      return !!store.progress[String(q.id)]?.isFavorite;
    });
  }, [questions, store.progress]);

  // Questions due for review
  const reviewQuestions = useMemo(() => {
    return questions.filter((q) => {
      const p = store.progress[String(q.id)];
      return p?.status === 'review';
    });
  }, [questions, store.progress]);

  // Solved from saved count
  const solvedFromSavedCount = useMemo(() => {
    return bookmarkedQuestions.filter((q) => {
      const p = store.progress[String(q.id)];
      return p?.status === 'solved' || p?.status === 'mastered';
    }).length;
  }, [bookmarkedQuestions, store.progress]);

  // Retention index based on user recall accuracy
  const retentionIndex = useMemo(() => {
    let mastered = 0;
    let solved = 0;
    let review = 0;

    Object.values(store.progress).forEach((p) => {
      if (p.status === 'mastered') mastered++;
      else if (p.status === 'solved') solved++;
      else if (p.status === 'review') review++;
    });

    const totalEvaluated = mastered + solved + review;
    if (totalEvaluated === 0) return { pct: '--', label: 'No review data yet' };

    const score = Math.round(((mastered + solved) / totalEvaluated) * 100);
    return { pct: `${score}%`, label: 'Recall accuracy' };
  }, [store.progress]);

  // Filtered bookmarked questions based on search query, filter tabs, and difficulty
  const filteredQuestions = useMemo(() => {
    return bookmarkedQuestions.filter((q) => {
      const p = store.progress[String(q.id)];
      const status = p?.status || 'todo';

      // 1. Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesId = String(q.id) === query.trim();
        const matchesTopic = q.topics.some((t) => t.toLowerCase().includes(query));
        const matchesNotes = p?.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesId && !matchesTopic && !matchesNotes) return false;
      }

      // 2. Status filter tab
      if (activeFilter === 'due' && status !== 'review') return false;
      if (activeFilter === 'solved' && status !== 'solved' && status !== 'mastered') return false;
      if (activeFilter === 'todo' && status !== 'todo' && status !== 'in-progress') return false;

      // 3. Difficulty filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;

      return true;
    });
  }, [bookmarkedQuestions, store.progress, searchQuery, activeFilter, selectedDifficulty]);

  const rowStatusOptions: GlideSelectOption[] = useMemo(() => [
    {
      value: 'todo',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span>Todo</span>
        </span>
      ),
      searchText: 'Todo',
    },
    {
      value: 'in-progress',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>In Progress</span>
        </span>
      ),
      searchText: 'In Progress',
    },
    {
      value: 'solved',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>Solved</span>
        </span>
      ),
      searchText: 'Solved',
    },
    {
      value: 'review',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
          <span>Review</span>
        </span>
      ),
      searchText: 'Review',
    },
    {
      value: 'mastered',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span>Mastered</span>
        </span>
      ),
      searchText: 'Mastered',
    },
  ], []);

  const getRowStatusTheme = (st: ProblemStatus) => {
    switch (st) {
      case 'solved':
        return {
          accentColor: '#10b981',
          textColor: '#34d399',
          surfaceColor: 'rgba(16, 185, 129, 0.12)',
          highlightColor: '#133526',
        };
      case 'mastered':
        return {
          accentColor: '#06b6d4',
          textColor: '#22d3ee',
          surfaceColor: 'rgba(6, 182, 212, 0.12)',
          highlightColor: '#10333d',
        };
      case 'in-progress':
        return {
          accentColor: '#f59e0b',
          textColor: '#fbbf24',
          surfaceColor: 'rgba(245, 158, 11, 0.12)',
          highlightColor: '#2b2210',
        };
      case 'review':
        return {
          accentColor: '#a855f7',
          textColor: '#c084fc',
          surfaceColor: 'rgba(168, 85, 247, 0.12)',
          highlightColor: '#261538',
        };
      default:
        return {
          accentColor: '#71717a',
          textColor: '#d1d5db',
          surfaceColor: '#11141A',
          highlightColor: '#1C222D',
        };
    }
  };

  const handleToggleNotes = (q: Question) => {
    sounds.playClick();
    if (expandedNotesId === q.id) {
      setExpandedNotesId(null);
    } else {
      setExpandedNotesId(q.id);
      setNoteDraft(store.progress[String(q.id)]?.notes || '');
    }
  };

  const handleSaveNotes = (qId: number | string) => {
    sounds.playSuccess();
    if (onSaveProgressPatch) {
      onSaveProgressPatch(qId, { notes: noteDraft });
    }
    setJustSavedNoteId(qId);
    setTimeout(() => {
      setJustSavedNoteId(null);
    }, 2000);
  };

  const handleExport = (format: 'markdown' | 'csv') => {
    sounds.playSuccess();
    if (format === 'markdown') {
      let md = '# Starred LeetCode Problems\n\n';
      md += '| ID | Title | Difficulty | Status | Notes | LeetCode Link |\n';
      md += '| --- | --- | --- | --- | --- | --- |\n';
      bookmarkedQuestions.forEach((q) => {
        const p = store.progress[String(q.id)];
        const cleanNote = (p?.notes || '').replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
        md += `| ${q.id} | ${q.title} | ${q.difficulty} | ${p?.status || 'todo'} | ${cleanNote} | [View](${q.url}) |\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leetcode-bookmarks-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = 'ID,Title,Difficulty,Status,Topics,Notes,URL\n';
      bookmarkedQuestions.forEach((q) => {
        const p = store.progress[String(q.id)];
        const topicsStr = `"${q.topics.join(';')}"`;
        const notesStr = `"${(p?.notes || '').replace(/"/g, '""')}"`;
        csv += `${q.id},"${q.title}",${q.difficulty},${p?.status || 'todo'},${topicsStr},${notesStr},"${q.url}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leetcode-bookmarks-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Saved & Revision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-sans">
            Bookmarks & Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
            Quick access to starred questions, spaced repetition revision reminders, and in-place study notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {reviewQuestions.length > 0 && onOpenReviewDrill && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenReviewDrill();
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer font-sans"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Review Drill ({reviewQuestions.length} Due)</span>
            </button>
          )}

          {bookmarkedQuestions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport('markdown')}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Export as Markdown"
              >
                <Download className="w-3.5 h-3.5 text-textMuted" />
                <span>Export MD</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Export as CSV"
              >
                <Download className="w-3.5 h-3.5 text-textMuted" />
                <span>CSV</span>
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/questions')}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 cursor-pointer font-sans shrink-0"
          >
            <span>Find More Problems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 1: KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Starred Questions</p>
          <p className="text-2xl font-bold text-primary font-mono mt-1">
            {bookmarkedQuestions.length}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">Saved for deep practice</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Due for Review</p>
          <p className="text-2xl font-bold text-purple-400 font-mono mt-1">
            {reviewQuestions.length}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">Spaced repetition queue</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Solved from Saved</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {solvedFromSavedCount}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">Successfully closed</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Retention Index</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">{retentionIndex.pct}</p>
          <p className="text-xs text-textSecondary mt-0.5">{retentionIndex.label}</p>
        </div>
      </div>

      {/* Row 2: Filter & Search Bar */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-textMuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved problems, topics, notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#12161E] border border-white/[0.08] text-xs text-white placeholder-textMuted focus:outline-none focus:border-primary/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-textMuted hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#12161E] p-1 rounded-xl border border-white/[0.08] text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'due', label: 'Due for Review' },
              { id: 'solved', label: 'Solved' },
              { id: 'todo', label: 'Todo / Progress' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveFilter(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textSecondary hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => {
                  sounds.playClick();
                  setSelectedDifficulty(diff);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                  selectedDifficulty === diff
                    ? 'bg-white/[0.1] border-white/30 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-textMuted hover:text-white'
                }`}
              >
                {diff === 'all' ? 'All Diff' : diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Bookmarked Questions Table */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary fill-primary" />
            <h2 className="text-base font-semibold text-white">Saved Problems</h2>
          </div>
          <span className="text-xs text-textMuted font-mono">
            {filteredQuestions.length} of {bookmarkedQuestions.length} Problems
          </span>
        </div>

        {bookmarkedQuestions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-textMuted">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No Starred Questions Yet</h3>
            <p className="text-xs text-textSecondary max-w-sm mx-auto leading-relaxed">
              Click the bookmark star on any problem in the Questions Explorer or Problem Workspace to organize it here.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/questions')}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-purple-600 transition-colors cursor-pointer font-sans"
              >
                Browse All Questions
              </button>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-sm font-semibold text-white">No questions match your current filters</p>
            <p className="text-xs text-textSecondary">Try clearing your search query or reset status/difficulty filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
                setSelectedDifficulty('all');
              }}
              className="mt-2 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-zinc-300 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[360px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[11px] text-textMuted uppercase tracking-wider border-b border-white/[0.06]">
                  <th className="py-3 px-3 w-12 font-mono">#</th>
                  <th className="py-3 px-3 font-medium">Question Title</th>
                  <th className="py-3 px-3 font-medium">Difficulty</th>
                  <th className="py-3 px-3 font-medium">Topics</th>
                  <th className="py-3 px-3 font-medium">Status</th>
                  <th className="py-3 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredQuestions.map((q) => {
                  const p = store.progress[String(q.id)];
                  const status = (p?.status || 'todo') as ProblemStatus;
                  const statusTheme = getRowStatusTheme(status);
                  const isNotesOpen = expandedNotesId === q.id;
                  const hasNotes = !!p?.notes && p.notes.trim().length > 0;

                  return (
                    <React.Fragment key={q.id}>
                      <tr className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-3 font-mono text-textMuted text-xs">#{q.id}</td>
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              onNavigateToProblem(q.id);
                            }}
                            className="font-medium text-white hover:text-primary transition-colors text-left flex items-center gap-1.5"
                          >
                            <span>{q.title}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-textMuted" />
                          </button>
                        </td>
                        <td className="py-3.5 px-3">
                          <DifficultyBadge difficulty={q.difficulty} />
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {q.topics.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded text-[11px] bg-white/[0.03] text-textSecondary border border-white/[0.05]"
                              >
                                {t}
                              </span>
                            ))}
                            {q.topics.length > 2 && (
                              <span className="text-[10px] text-textMuted font-mono">
                                +{q.topics.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className="py-3.5 px-3 relative z-0 has-[[aria-expanded=true]]:z-30"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <GlideSelect
                            options={rowStatusOptions}
                            value={status}
                            onChange={(val) => {
                              sounds.playClick();
                              onUpdateStatus(q.id, val as ProblemStatus);
                            }}
                            showTags={false}
                            size="sm"
                            menuWidth={136}
                            radius={8}
                            accentColor={statusTheme.accentColor}
                            surfaceColor={statusTheme.surfaceColor}
                            highlightColor={statusTheme.highlightColor}
                            textColor={statusTheme.textColor}
                            className="shrink-0"
                            ariaLabel={`Status for ${q.title}`}
                          />
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* In-place Notes Button */}
                            <button
                              onClick={() => handleToggleNotes(q)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isNotesOpen
                                  ? 'bg-primary/20 border-primary/40 text-primary'
                                  : hasNotes
                                  ? 'bg-white/[0.05] border-white/[0.1] text-amber-300 hover:text-white'
                                  : 'border-transparent text-textMuted hover:text-white hover:bg-white/[0.04]'
                              }`}
                              title={hasNotes ? 'View/Edit Notes' : 'Add Notes'}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Unbookmark Button */}
                            <button
                              onClick={() => {
                                sounds.playClick();
                                onToggleFavorite(q.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-primary transition-colors cursor-pointer"
                              title="Remove bookmark"
                            >
                              <Bookmark className="w-4 h-4 fill-primary" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable In-Place Notes Drawer */}
                      {isNotesOpen && (
                        <tr className="bg-[#12161E]/80 border-b border-white/[0.06]">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="space-y-3 max-w-3xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Edit3 className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-semibold text-white">
                                    Study Notes • {q.title}
                                  </span>
                                </div>
                                {p?.lastSolvedAt && (
                                  <span className="text-[11px] text-textMuted font-mono">
                                    Last solved: {new Date(p.lastSolvedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <textarea
                                rows={4}
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                placeholder="Jot down time/space complexity notes, tricky edge cases, or optimal intuition..."
                                className="w-full p-3 rounded-xl bg-[#0E1217] border border-white/[0.08] text-xs text-white placeholder-textMuted focus:outline-none focus:border-primary/50 resize-y"
                              />

                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-textSecondary">
                                  Notes automatically sync to your cloud account.
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setExpandedNotesId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    Close
                                  </button>
                                  <button
                                    onClick={() => handleSaveNotes(q.id)}
                                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                                  >
                                    {justSavedNoteId === q.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Saved!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save Notes</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;
