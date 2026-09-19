import React from 'react';
import { Question, UserProgressItem, ProblemStatus, Timeframe } from '../types';
import { ExternalLink, Star, CheckCircle2, Clock, RotateCcw, Award, Circle, FileText, Timer, ChevronRight, Lightbulb } from 'lucide-react';
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
        colors: ['#FFFF00', '#FFF94D', '#B8B800'],
      });
    } else {
      sounds.playClick();
    }

    onUpdateStatus(q.id, nextStatus);
  };

  const getStatusIcon = (status: ProblemStatus = 'todo') => {
    switch (status) {
      case 'mastered':
        return <span className="font-mono text-xs font-bold text-primary">[M]</span>;
      case 'solved':
        return <CheckCircle2 className="w-4 h-4 text-easy" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'review':
        return <RotateCcw className="w-4 h-4 text-medium" />;
      default:
        return <Circle className="w-4 h-4 text-textMuted hover:text-textSecondary transition-colors" />;
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return (
          <span className="font-mono text-xs font-bold text-easy tracking-wider">
            [EASY]
          </span>
        );
      case 'Medium':
        return (
          <span className="font-mono text-xs font-bold text-medium tracking-wider">
            [MEDIUM]
          </span>
        );
      case 'Hard':
        return (
          <span className="font-mono text-xs font-bold text-hard tracking-wider">
            [HARD]
          </span>
        );
      default:
        return <span className="font-mono text-xs text-textMuted">[{diff.toUpperCase()}]</span>;
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
    if (acc >= 60) return 'text-easy font-semibold';
    if (acc >= 40) return 'text-textSecondary';
    return 'text-hard';
  };

  return (
    <div className="terminal-panel overflow-x-auto shadow-xl transition-colors font-mono">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface text-[11px] font-bold uppercase tracking-wider text-textSecondary select-none">
            <th className="py-3 px-3 w-12 text-center">Status</th>
            <th className="py-3 px-2 w-10 text-center">Star</th>
            <th className="py-3 px-3 w-16 text-center">ID</th>
            <th className="py-3 px-4">Problem Title & Topics</th>
            <th className="py-3 px-3 w-28 text-center">Difficulty</th>
            <th className="py-3 px-3 w-40">Frequency</th>
            <th className="py-3 px-3 w-24 text-center">Acceptance</th>
            <th className="py-3 px-4 w-28 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-xs">
          {questions.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-textMuted">
                <div className="max-w-sm mx-auto flex flex-col items-center">
                  <div className="w-12 h-12 rounded-[2px] bg-surfaceElevated flex items-center justify-center text-textSecondary mb-3 border border-border font-mono">
                    [?]
                  </div>
                  <p className="font-bold text-sm text-textPrimary mb-1">&gt; No matching interview questions found</p>
                  <p className="text-xs text-textMuted">
                    Try adjusting search query, clearing filters, or switching timeframe.
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
                      : 'hover:bg-surfaceElevated'
                  }`}
                >
                  {/* Status Button (Click to cycle) */}
                  <td className="py-2.5 px-3 text-center" onClick={(e) => handleStatusCycle(e, q)}>
                    <button
                      className="p-1 rounded-[2px] hover:bg-surface transition-transform active:scale-90"
                      title={`Status: ${status}. Click to cycle (or press Space when focused).`}
                    >
                      {getStatusIcon(status)}
                    </button>
                  </td>

                  {/* Favorite Star */}
                  <td
                    className="py-2.5 px-2 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onToggleFavorite(q.id);
                    }}
                  >
                    <button
                      className={`p-1 rounded-[2px] transition-transform active:scale-90 ${
                        isFav ? 'text-medium fill-medium' : 'text-textMuted hover:text-textSecondary'
                      }`}
                      title={isFav ? 'Remove from favorites (press b)' : 'Add to favorites (press b)'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-medium' : ''}`} />
                    </button>
                  </td>

                  {/* LeetCode ID */}
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-textMuted group-hover:text-primary">
                    #{q.id}
                  </td>

                  {/* Title, Badges & Topics */}
                  <td className="py-2.5 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/problem/${q.id}`}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                              e.preventDefault();
                              onOpenDetail(q);
                            }
                          }}
                          className="font-mono font-semibold text-textPrimary group-hover:text-primary hover:text-primary hover:underline transition-colors"
                        >
                          {q.title}
                        </a>

                        {q.isBlind75 && (
                          <span className="px-1 py-0.2 rounded-[2px] text-[10px] font-mono font-bold bg-surface border border-primary/40 text-primary">
                            [BLIND_75]
                          </span>
                        )}
                        {q.isGrind169 && !q.isBlind75 && (
                          <span className="px-1 py-0.2 rounded-[2px] text-[10px] font-mono font-bold bg-surface border border-primaryDim/40 text-primaryDim">
                            [GRIND_169]
                          </span>
                        )}
                        <span title="Multi-approach C++ solution & theory available" className="inline-flex items-center gap-0.5 text-[10px] px-1 py-0.2 rounded-[2px] bg-surface text-medium border border-medium/30 font-mono">
                          <Lightbulb className="w-2.5 h-2.5 text-medium" />
                          C++
                        </span>
                        {hasNotes && (
                          <span title="Contains personal notes" className="text-medium">
                            <FileText className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                        {prog.confidence && prog.confidence > 0 ? (
                          <span className="text-[10px] text-medium font-mono flex items-center">
                            ★{prog.confidence}
                          </span>
                        ) : null}
                      </div>

                      {/* Topic Tags */}
                      <div className="flex flex-wrap gap-1">
                        {q.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="px-1.5 py-0.2 text-[10px] rounded-[2px] bg-surfaceElevated text-textMuted hover:text-primary hover:border-primaryDim border border-border font-mono transition-colors"
                          >
                            #{topic}
                          </span>
                        ))}
                        {q.topics.length > 3 && (
                          <span className="text-[10px] text-textMuted self-center">
                            +{q.topics.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="py-2.5 px-3 text-center">
                    {getDifficultyBadge(q.difficulty)}
                  </td>

                  {/* Frequency with Progress Bar */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col gap-1 w-full max-w-[140px]">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-textSecondary font-semibold">{freqNum.toFixed(1)}%</span>
                        {freqNum > 70 ? (
                          <span className="text-[10px] text-primary font-mono font-bold">
                            &gt; HOT
                          </span>
                        ) : null}
                      </div>
                      <div className="w-full h-1 bg-surface border border-border rounded-[1px] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            freqNum > 70
                              ? 'bg-primary'
                              : freqNum > 30
                              ? 'bg-primaryDim'
                              : 'bg-textMuted'
                          }`}
                          style={{ width: `${Math.min(100, freqNum)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Acceptance Rate */}
                  <td className="py-2.5 px-3 text-center font-mono text-xs">
                    <span className={getAcceptanceColor(q.acceptance)}>
                      {q.acceptance}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Timer trigger */}
                      <button
                        onClick={() => onStartTimer(q)}
                        className="p-1 rounded-[2px] bg-surface hover:bg-surfaceElevated border border-border hover:border-primary text-textMuted hover:text-primary transition-colors"
                        title="Practice with Timer (press t)"
                      >
                        <Timer className="w-3.5 h-3.5" />
                      </button>

                      {/* Direct LeetCode link */}
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-[2px] bg-surface hover:bg-surfaceElevated border border-border hover:border-primaryDim text-textMuted hover:text-primary transition-colors"
                        title="Open on LeetCode.com"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => onOpenDetail(q)}
                        className="p-1 rounded-[2px] text-textMuted hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
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
