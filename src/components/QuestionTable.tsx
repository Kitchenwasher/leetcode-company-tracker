import React from 'react';
import { Question, UserProgressItem, ProblemStatus, Timeframe } from '../types';
import { ExternalLink, Star, CheckCircle2, Clock, RotateCcw, Award, Circle, FileText, Timer, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

interface QuestionTableProps {
  questions: Question[];
  progress: Record<string, UserProgressItem>;
  selectedCompany: string;
  selectedTimeframe: Timeframe;
  focusedIndex: number;
  onUpdateStatus: (questionId: string | number, status: ProblemStatus) => void;
  onToggleFavorite: (questionId: string | number) => void;
  onOpenDetail: (question: Question) => void;
  onStartTimer: (question: Question) => void;
  onSelectRow: (index: number) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  progress,
  selectedCompany,
  selectedTimeframe,
  focusedIndex,
  onUpdateStatus,
  onToggleFavorite,
  onOpenDetail,
  onStartTimer,
  onSelectRow,
}) => {
  const handleStatusCycle = (e: React.MouseEvent, q: Question) => {
    e.stopPropagation();
    const current = progress[String(q.id)]?.status || 'todo';
    const nextMap: Record<ProblemStatus, ProblemStatus> = {
      'todo': 'in-progress',
      'in-progress': 'solved',
      'solved': 'review',
      'review': 'mastered',
      'mastered': 'todo',
    };
    const nextStatus = nextMap[current];

    if (nextStatus === 'solved' || nextStatus === 'mastered') {
      sounds.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1'],
      });
    } else {
      sounds.playClick();
    }

    onUpdateStatus(q.id, nextStatus);
  };

  const getStatusIcon = (status: ProblemStatus = 'todo') => {
    switch (status) {
      case 'mastered':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'solved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'review':
        return <RotateCcw className="w-4 h-4 text-amber-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />;
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs">
            Hard
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs text-slate-400">{diff}</span>;
    }
  };

  const getFrequencyVal = (q: Question): number => {
    const freqStr =
      q.companies[selectedCompany]?.[selectedTimeframe] ||
      q.companies[selectedCompany]?.all ||
      '0.0%';
    return parseFloat(freqStr.replace('%', '')) || 0;
  };

  const getAcceptanceColor = (accStr: string) => {
    const acc = parseFloat(accStr.replace('%', '')) || 50;
    if (acc >= 60) return 'text-emerald-400 font-medium';
    if (acc >= 40) return 'text-slate-300';
    return 'text-rose-400';
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 dark:border-slate-800 bg-slate-900/70 dark:bg-slate-900/70 bg-white/90 shadow-xl backdrop-blur-sm transition-colors">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-950/70 dark:bg-slate-950/70 bg-slate-100/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
            <th className="py-3.5 px-3 w-12 text-center">Status</th>
            <th className="py-3.5 px-2 w-10 text-center">Star</th>
            <th className="py-3.5 px-3 w-16 text-center">ID</th>
            <th className="py-3.5 px-4">Problem Title & Topics</th>
            <th className="py-3.5 px-3 w-28 text-center">Difficulty</th>
            <th className="py-3.5 px-3 w-40">Frequency</th>
            <th className="py-3.5 px-3 w-24 text-center">Acceptance</th>
            <th className="py-3.5 px-4 w-28 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 divide-slate-200 text-sm">
          {questions.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-slate-400">
                <div className="max-w-sm mx-auto flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 dark:bg-slate-800/80 bg-slate-100 flex items-center justify-center text-slate-500 mb-3 border border-slate-700/50">
                    🔍
                  </div>
                  <p className="font-semibold text-slate-200 text-base">No matching questions found.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try broadening your filters, changing timeframes, or searching another topic.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            questions.map((q, idx) => {
              const prog = progress[String(q.id)] || {};
              const status = prog.status || 'todo';
              const isFav = !!prog.isFavorite;
              const hasNotes = !!prog.notes;
              const freqNum = getFrequencyVal(q);
              const isFocused = idx === focusedIndex;

              return (
                <tr
                  key={q.id}
                  onClick={() => {
                    onSelectRow(idx);
                    onOpenDetail(q);
                  }}
                  className={`group transition-all cursor-pointer ${
                    isFocused
                      ? 'focused-row'
                      : 'hover:bg-slate-800/40 dark:hover:bg-slate-800/40 hover:bg-slate-50'
                  }`}
                >
                  {/* Status Button (Click to cycle) */}
                  <td className="py-3 px-3 text-center" onClick={(e) => handleStatusCycle(e, q)}>
                    <button
                      className="p-1 rounded-lg hover:bg-slate-800/70 transition-transform active:scale-90"
                      title={`Status: ${status}. Click to cycle (or press Space when focused).`}
                    >
                      {getStatusIcon(status)}
                    </button>
                  </td>

                  {/* Favorite Star */}
                  <td
                    className="py-3 px-2 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onToggleFavorite(q.id);
                    }}
                  >
                    <button
                      className={`p-1 rounded-lg transition-transform active:scale-90 ${
                        isFav ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={isFav ? 'Remove from favorites (press b)' : 'Add to favorites (press b)'}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400' : ''}`} />
                    </button>
                  </td>

                  {/* LeetCode ID */}
                  <td className="py-3 px-3 text-center font-mono text-xs text-slate-400 group-hover:text-slate-200">
                    {q.id}
                  </td>

                  {/* Title, Badges & Topics */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 dark:text-slate-100 text-slate-900 group-hover:text-indigo-400 transition-colors">
                          {q.title}
                        </span>

                        {q.isBlind75 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                            Blind 75
                          </span>
                        )}
                        {q.isGrind169 && !q.isBlind75 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs">
                            Grind 169
                          </span>
                        )}
                        {hasNotes && (
                          <span title="Contains personal notes" className="text-amber-400">
                            <FileText className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                        {prog.confidence && prog.confidence > 0 ? (
                          <span className="text-[10px] text-yellow-400 font-mono flex items-center">
                            ★{prog.confidence}
                          </span>
                        ) : null}
                      </div>

                      {/* Topic Tags */}
                      <div className="flex flex-wrap gap-1">
                        {q.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800/80 dark:bg-slate-800/80 bg-slate-200 text-slate-300 dark:text-slate-400 text-slate-700 border border-slate-700/40 font-mono"
                          >
                            {topic}
                          </span>
                        ))}
                        {q.topics.length > 3 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{q.topics.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3 px-3 text-center">
                    {getDifficultyBadge(q.difficulty)}
                  </td>

                  {/* Frequency with Progress Bar */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 w-full max-w-[140px]">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-200 font-semibold">{freqNum.toFixed(1)}%</span>
                        {freqNum > 70 ? (
                          <span className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-0.5">
                            🔥 Hot
                          </span>
                        ) : freqNum > 40 ? (
                          <span className="text-[10px] text-blue-400 font-sans">Common</span>
                        ) : null}
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 dark:bg-slate-800 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            freqNum > 70
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : freqNum > 30
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-slate-500'
                          }`}
                          style={{ width: `${Math.min(100, freqNum)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Acceptance Rate */}
                  <td className="py-3 px-3 text-center font-mono text-xs">
                    <span className={getAcceptanceColor(q.acceptance)}>
                      {q.acceptance}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Timer trigger */}
                      <button
                        onClick={() => onStartTimer(q)}
                        className="p-1.5 rounded-lg bg-slate-800/60 dark:bg-slate-800/60 bg-slate-100 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                        title="Practice with Timer (press t)"
                      >
                        <Timer className="w-3.5 h-3.5" />
                      </button>

                      {/* Direct LeetCode link */}
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800/60 dark:bg-slate-800/60 bg-slate-100 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                        title="Open on LeetCode.com"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => onOpenDetail(q)}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
