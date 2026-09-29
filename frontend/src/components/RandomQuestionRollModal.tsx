import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Dices,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Building2,
  Tag,
  Zap,
  Flame,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, Difficulty, ProblemStatus } from '../types';
import { sounds } from '../utils/sound';
import CompanyLogo, { getCompanyDisplayName } from './CompanyLogo';

interface RandomQuestionRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateQuestions: Question[];
  activeFilterSummary: string;
  onSelectQuestion: (questionId: number | string) => void;
  animationEnabled: boolean;
}

export const RandomQuestionRollModal: React.FC<RandomQuestionRollModalProps> = ({
  isOpen,
  onClose,
  candidateQuestions,
  activeFilterSummary,
  onSelectQuestion,
  animationEnabled,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplayQuestion, setCurrentDisplayQuestion] = useState<Question | null>(null);
  const [winnerQuestion, setWinnerQuestion] = useState<Question | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  const startRoll = useCallback(() => {
    if (candidateQuestions.length === 0) {
      setWinnerQuestion(null);
      setCurrentDisplayQuestion(null);
      return;
    }

    // Pick random winning question
    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    const chosen = candidateQuestions[randomIndex];

    if (!animationEnabled) {
      // Instant pick without animation
      setWinnerQuestion(chosen);
      setCurrentDisplayQuestion(chosen);
      setIsSpinning(false);
      sounds.playSuccess();
      return;
    }

    // Begin thrilling roll animation
    setIsSpinning(true);
    setWinnerQuestion(null);
    sounds.playClick();

    // Generate random sequence of candidate previews ending with the winner
    const steps = 18;
    const sequence: Question[] = [];
    for (let i = 0; i < steps - 1; i++) {
      const idx = Math.floor(Math.random() * candidateQuestions.length);
      sequence.push(candidateQuestions[idx]);
    }
    sequence.push(chosen);

    let step = 0;
    const delays = [
      40, 45, 50, 55, 60, 70, 85, 100, 125, 155, 195, 245, 305, 375, 460, 560, 680, 820,
    ];

    const runStep = () => {
      if (step < sequence.length) {
        setCurrentDisplayQuestion(sequence[step]);
        try {
          sounds.playClick();
        } catch {}

        const delay = delays[step] || 300;
        step++;
        spinTimerRef.current = window.setTimeout(runStep, delay);
      } else {
        // Landed on winner!
        setIsSpinning(false);
        setWinnerQuestion(chosen);
        setCurrentDisplayQuestion(chosen);

        try {
          sounds.playSuccess();
          confetti({
            particleCount: 75,
            spread: 65,
            origin: { y: 0.6 },
            colors: ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
          });
        } catch {}
      }
    };

    runStep();
  }, [candidateQuestions, animationEnabled]);

  // Trigger roll when modal opens
  useEffect(() => {
    if (isOpen) {
      startRoll();
    } else {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
      setIsSpinning(false);
      setWinnerQuestion(null);
      setCurrentDisplayQuestion(null);
    }

    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const display = winnerQuestion || currentDisplayQuestion;

  const getDifficultyBadge = (diff?: Difficulty) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={isSpinning ? undefined : onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#0E1217] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Glow Accent Header Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-primary" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-sans tracking-tight">
                <span>{isSpinning ? 'Rolling Question...' : 'Random Question Selected!'}</span>
                {!isSpinning && winnerQuestion && <Sparkles className="w-4 h-4 text-amber-400" />}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs font-mono">
                From: {activeFilterSummary || 'All Questions'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            disabled={isSpinning}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/[0.06] disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {candidateQuestions.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <Dices className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">No questions match your filters</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Adjust or clear your active company, topic, or difficulty filters to roll a random question.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Spinning Roulette Stage */}
              <div
                className={`relative rounded-2xl p-5 border transition-all overflow-hidden ${
                  isSpinning
                    ? 'bg-[#121620] border-primary/50 shadow-lg shadow-primary/20 scale-[0.99]'
                    : 'bg-[#12161E] border-white/[0.1] shadow-xl'
                }`}
              >
                {/* Decorative Reel Motion Bars */}
                {isSpinning && (
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0E1217] via-transparent to-[#0E1217] opacity-60 z-10" />
                )}

                {display ? (
                  <div className="space-y-3.5 relative z-0">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          #{display.id}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(
                            display.difficulty
                          )}`}
                        >
                          {display.difficulty}
                        </span>
                        {display.acceptance && (
                          <span className="text-[11px] font-mono text-zinc-400">
                            {display.acceptance}
                          </span>
                        )}
                      </div>

                      {/* Animated Spinner Icon or Winner Crown */}
                      <div>
                        {isSpinning ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider animate-pulse">
                            Spinning...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Match</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Title */}
                    <h3
                      className={`text-base sm:text-lg font-bold text-white leading-snug tracking-tight font-sans transition-all ${
                        isSpinning ? 'opacity-80 blur-[0.3px]' : 'opacity-100'
                      }`}
                    >
                      {display.title}
                    </h3>

                    {/* Topics Chips */}
                    {display.topics && display.topics.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <Tag className="w-3 h-3 text-zinc-500 shrink-0" />
                        {display.topics.slice(0, 4).map((top) => (
                          <span
                            key={top}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-300"
                          >
                            {top}
                          </span>
                        ))}
                        {display.topics.length > 4 && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            +{display.topics.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Company Tagging Preview */}
                    {display.companies && Object.keys(display.companies).length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-xs text-zinc-400 font-sans">
                        <Building2 className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-[11px]">Asked by:</span>
                        <span className="text-[11px] font-medium text-white truncate">
                          {Object.keys(display.companies)
                            .slice(0, 3)
                            .map((c) => getCompanyDisplayName(c))
                            .join(', ')}
                          {Object.keys(display.companies).length > 3 &&
                            ` +${Object.keys(display.companies).length - 3} others`}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-zinc-500">
                    <span className="text-xs font-mono">Selecting question...</span>
                  </div>
                )}
              </div>

              {/* Candidate Pool Indicator */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                <span>Total candidates in filter:</span>
                <span className="font-bold text-white">
                  {candidateQuestions.length.toLocaleString()} questions
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 pt-2 bg-[#0B0E13] border-t border-white/[0.06] flex items-center gap-3 justify-end flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              startRoll();
            }}
            disabled={isSpinning || candidateQuestions.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/[0.08] disabled:opacity-40"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>Roll Again</span>
          </button>

          {winnerQuestion && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSelectQuestion(winnerQuestion.id);
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/25 font-sans"
            >
              <span>Solve Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
