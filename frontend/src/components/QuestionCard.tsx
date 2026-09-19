import React from 'react';
import { Question, UserProgressItem, ProblemStatus, Timeframe } from '../types';
import { ExternalLink, Star, CheckCircle2, Clock, RotateCcw, Award, Circle, FileText, Timer, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

interface QuestionCardProps {
  question: Question;
  progress?: UserProgressItem;
  selectedCompany: string;
  selectedTimeframe: Timeframe;
  isFocused?: boolean;
  onUpdateStatus: (questionId: string | number, status: ProblemStatus) => void;
  onToggleFavorite: (questionId: string | number) => void;
  onOpenDetail: (question: Question) => void;
  onStartTimer: (question: Question) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question: q,
  progress: prog = { questionId: q.id, status: 'todo', isFavorite: false },
  selectedCompany,
  selectedTimeframe,
  isFocused = false,
  onUpdateStatus,
  onToggleFavorite,
  onOpenDetail,
  onStartTimer,
}) => {
  const status = prog.status || 'todo';
  const isFav = !!prog.isFavorite;
  const hasNotes = !!prog.notes;

  const freqStr =
    q.companies[selectedCompany]?.[selectedTimeframe] ||
    q.companies[selectedCompany]?.all ||
    '0.0%';
  const freqNum = parseFloat(freqStr.replace('%', '')) || 0;

  const handleStatusCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMap: Record<ProblemStatus, ProblemStatus> = {
      'todo': 'in-progress',
      'in-progress': 'solved',
      'solved': 'review',
      'review': 'mastered',
      'mastered': 'todo',
    };
    const nextStatus = nextMap[status];

    if (nextStatus === 'solved' || nextStatus === 'mastered') {
      sounds.playSuccess();
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#FFFF00', '#FFF94D', '#B8B800'],
      });
    } else {
      sounds.playClick();
    }

    onUpdateStatus(q.id, nextStatus);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'mastered':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold font-mono bg-primary/15 text-primary border border-primary/40 shadow-terminal-glow">
            <Award className="w-3 h-3" /> [MASTERED]
          </span>
        );
      case 'solved':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold font-mono bg-primary/15 text-primary border border-primary/40">
            <CheckCircle2 className="w-3 h-3" /> [SOLVED]
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold font-mono bg-medium/15 text-medium border border-medium/40">
            <Clock className="w-3 h-3" /> [IN_PROG]
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold font-mono bg-surfaceElevated text-textSecondary border border-border">
            <RotateCcw className="w-3 h-3" /> [REVIEW]
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold font-mono bg-surfaceElevated text-textMuted border border-border/60">
            <Circle className="w-2.5 h-2.5 text-textMuted" /> [TODO]
          </span>
        );
    }
  };

  const getDiffColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-easy/10 text-easy border-easy/40';
      case 'Medium':
        return 'bg-medium/10 text-medium border-medium/40';
      case 'Hard':
        return 'bg-hard/10 text-hard border-hard/40';
      default:
        return 'bg-surfaceElevated text-textSecondary border-border';
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(q)}
      className={`flex flex-col justify-between p-3.5 rounded-[2px] terminal-panel transition-all duration-200 cursor-pointer group font-mono ${
        isFocused
          ? 'border-borderActive shadow-terminal bg-surfaceElevated'
          : 'border-border hover:border-borderActive'
      }`}
    >
      <div>
        {/* Top bar: ID, Curated badge, Star */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-textMuted group-hover:text-primary">
              #{q.id}
            </span>
            {q.isBlind75 && (
              <span className="px-1.5 py-0.2 rounded-[1px] text-[9px] font-bold bg-surfaceElevated text-primary border border-primary/40 font-mono">
                [BLIND_75]
              </span>
            )}
            {q.isGrind169 && !q.isBlind75 && (
              <span className="px-1.5 py-0.2 rounded-[1px] text-[9px] font-bold bg-surfaceElevated text-primaryDim border border-primaryDim/40 font-mono">
                [GRIND_169]
              </span>
            )}
            <span title="Multi-approach C++ solution & theory available" className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded-[1px] bg-surfaceElevated text-textSecondary border border-border font-mono">
              <Lightbulb className="w-2.5 h-2.5 text-primary" />
              [C++]
            </span>
            {hasNotes && (
              <span title="Has personal notes" className="text-primary">
                <FileText className="w-3 h-3" />
              </span>
            )}
            {prog.confidence && prog.confidence > 0 ? (
              <span className="text-[10px] text-medium font-mono">
                ★{prog.confidence}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                sounds.playClick();
                onToggleFavorite(q.id);
              }}
              className={`p-1 rounded-[2px] transition-transform active:scale-90 ${
                isFav ? 'text-medium fill-medium' : 'text-textMuted hover:text-textSecondary'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-medium' : ''}`} />
            </button>
            <a
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-textMuted hover:text-primary transition-colors"
              title="Open on LeetCode.com"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-textPrimary group-hover:text-primary transition-colors text-xs sm:text-sm line-clamp-2 mb-2">
          <a
            href={`/problem/${q.id}`}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                e.preventDefault();
                onOpenDetail(q);
              }
            }}
            className="hover:underline"
          >
            {q.title}
          </a>
        </h3>

        {/* Topics */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {q.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="px-1.5 py-0.2 text-[9px] rounded-[1px] bg-surfaceElevated text-textMuted hover:text-primary hover:border-primaryDim border border-border font-mono transition-colors"
            >
              {topic}
            </span>
          ))}
          {q.topics.length > 3 && (
            <span className="text-[9px] text-textMuted self-center font-mono">
              +{q.topics.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Details */}
      <div className="pt-2.5 border-t border-border flex flex-col gap-2">
        {/* Frequency & Acceptance */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1 text-textMuted">
            <span>ACC:</span>
            <span className="text-textSecondary">{q.acceptance}</span>
          </div>
          <div className="flex items-center gap-1 text-textMuted">
            <span>FREQ:</span>
            <span className="text-primaryDim font-bold">{freqNum.toFixed(1)}%</span>
            {freqNum > 70 && <span className="text-medium">⚡</span>}
          </div>
        </div>

        {/* Frequency bar */}
        <div className="w-full h-1 bg-surfaceElevated overflow-hidden rounded-[1px]">
          <div
            className={`h-full ${
              freqNum > 70 ? 'bg-primary shadow-terminal-glow' : 'bg-textSecondary'
            }`}
            style={{ width: `${Math.min(100, freqNum)}%` }}
          />
        </div>

        {/* Difficulty Pill & Status button */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={`px-2 py-0.2 rounded-[1px] text-[10px] font-mono font-bold border ${getDiffColor(q.difficulty)}`}>
            [{q.difficulty.toUpperCase()}]
          </span>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onStartTimer(q)}
              className="p-1 rounded-[2px] bg-surfaceElevated hover:bg-border text-textMuted hover:text-primary transition-colors border border-border"
              title="Practice with Timer"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleStatusCycle}
              className="transition-transform active:scale-95"
              title="Click to cycle status"
            >
              {getStatusBadge()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
