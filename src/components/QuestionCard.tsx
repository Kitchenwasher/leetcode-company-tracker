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
        colors: ['#10B981', '#3B82F6', '#F59E0B'],
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Award className="w-3 h-3" /> Mastered
          </span>
        );
      case 'solved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Solved
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <RotateCcw className="w-3 h-3" /> Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
            <Circle className="w-3 h-3 text-slate-500" /> Todo
          </span>
        );
    }
  };

  const getDiffColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(q)}
      className={`flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border transition-all duration-200 shadow-lg cursor-pointer group ${
        isFocused
          ? 'outline-2 outline-indigo-500 border-indigo-500 bg-indigo-950/20'
          : 'border-slate-800 hover:border-indigo-500/40 hover:shadow-indigo-500/10'
      }`}
    >
      <div>
        {/* Top bar: ID, Curated badge, Star */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-slate-400 group-hover:text-slate-200">
              #{q.id}
            </span>
            {q.isBlind75 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Blind 75
              </span>
            )}
            {q.isGrind169 && !q.isBlind75 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Grind 169
              </span>
            )}
            <span title="Multi-approach C++ solution & theory available" className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              <Lightbulb className="w-2.5 h-2.5 text-amber-400" />
              C++
            </span>
            {hasNotes && (
              <span title="Has personal notes" className="text-amber-400">
                <FileText className="w-3.5 h-3.5" />
              </span>
            )}
            {prog.confidence && prog.confidence > 0 ? (
              <span className="text-[10px] text-yellow-400 font-mono">
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
              className={`p-1 rounded-lg transition-transform active:scale-90 ${
                isFav ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400' : ''}`} />
            </button>
            <a
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
              title="Open on LeetCode.com"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors text-base line-clamp-2 mb-2.5">
          {q.title}
        </h3>

        {/* Topics */}
        <div className="flex flex-wrap gap-1 mb-3">
          {q.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/40 font-mono"
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

      {/* Footer Details */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
        {/* Frequency & Acceptance */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-400">
            <span>Acc:</span>
            <span className="text-slate-300">{q.acceptance}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Freq:</span>
            <span className="text-slate-200 font-bold">{freqNum.toFixed(1)}%</span>
            {freqNum > 70 && <span>🔥</span>}
          </div>
        </div>

        {/* Frequency bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              freqNum > 70
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
            style={{ width: `${Math.min(100, freqNum)}%` }}
          />
        </div>

        {/* Difficulty Pill & Status button */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDiffColor(q.difficulty)}`}>
            {q.difficulty}
          </span>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onStartTimer(q)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
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
