import React, { useMemo } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Question, UserStoreState, ProblemStatus, Difficulty } from '../types';
import { sounds } from '../utils/sound';
import { DifficultyBadge } from './ui/DifficultyBadge';

interface BookmarksPageProps {
  questions: Question[];
  store: UserStoreState;
  onNavigateToProblem: (id: number | string) => void;
  onToggleFavorite: (id: number | string) => void;
  onUpdateStatus: (id: number | string, status: ProblemStatus) => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  questions,
  store,
  onNavigateToProblem,
  onToggleFavorite,
  onUpdateStatus,
}) => {
  const navigate = useNavigate();

  // Find all starred questions
  const bookmarkedQuestions = useMemo(() => {
    return questions.filter((q) => {
      return !!store.progress[String(q.id)]?.isFavorite;
    });
  }, [questions, store.progress]);

  // Find questions due for review
  const reviewQuestions = useMemo(() => {
    return questions.filter((q) => {
      const p = store.progress[String(q.id)];
      return p?.status === 'review';
    });
  }, [questions, store.progress]);

  // Real solved from saved count
  const solvedFromSavedCount = useMemo(() => {
    return bookmarkedQuestions.filter((q) => {
      const p = store.progress[String(q.id)];
      return p?.status === 'solved' || p?.status === 'mastered';
    }).length;
  }, [bookmarkedQuestions, store.progress]);

  // Real retention index based on user recall accuracy
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
            Quick access to starred questions, spaced repetition revision reminders, and interview favorites.
          </p>
        </div>

        <button
          onClick={() => navigate('/questions')}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-[#D4ED00] text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 cursor-pointer font-sans shrink-0"
        >
          <span>Find More Problems</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
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

      {/* Row 2: Bookmarked Questions Table Card */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary fill-primary" />
            <h2 className="text-base font-semibold text-white">Starred Questions</h2>
          </div>
          <span className="text-xs text-textMuted font-mono">{bookmarkedQuestions.length} Problems</span>
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
                className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-[#D4ED00] transition-colors cursor-pointer font-sans"
              >
                Browse All Questions
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {bookmarkedQuestions.map((q) => {
                  const status = store.progress[String(q.id)]?.status || 'todo';
                  return (
                    <tr key={q.id} className="hover:bg-white/[0.02] transition-colors group">
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
                            <span key={t} className="px-2 py-0.5 rounded text-[11px] bg-white/[0.03] text-textSecondary border border-white/[0.05]">
                              {t}
                            </span>
                          ))}
                          {q.topics.length > 2 && (
                            <span className="text-[10px] text-textMuted font-mono">+{q.topics.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <select
                          value={status}
                          onChange={(e) => {
                            sounds.playClick();
                            onUpdateStatus(q.id, e.target.value as ProblemStatus);
                          }}
                          className="bg-[#12161E] border border-white/[0.08] text-xs text-white rounded-lg px-2 py-1 outline-none cursor-pointer"
                        >
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="solved">Solved</option>
                          <option value="mastered">Mastered</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-3 text-right">
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
                      </td>
                    </tr>
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
