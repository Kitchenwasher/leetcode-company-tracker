import React, { useState, useEffect, useMemo } from 'react';
import { Question, UserProgressItem, ProblemStatus } from '../types';
import { QuestionSolution } from '../types/solution';
import {
  X, Sparkles, RotateCw, CheckCircle2, ChevronRight, ChevronLeft,
  Brain, Clock, ShieldAlert, Code2, Copy, Check, Eye
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  progress: Record<string, UserProgressItem>;
  onUpdateStatus: (questionId: number | string, status: ProblemStatus, reviewIntervalDays?: number) => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  questions,
  progress,
  onUpdateStatus,
}) => {
  const [filterMode, setFilterMode] = useState<'due' | 'solved' | 'all'>('due');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [solution, setSolution] = useState<QuestionSolution | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Filter pool of flashcards
  const flashcardQuestions = useMemo(() => {
    const now = new Date().getTime();
    if (filterMode === 'due') {
      const due = questions.filter((q) => {
        const item = progress[String(q.id)];
        if (!item || !item.nextReviewAt) return false;
        return new Date(item.nextReviewAt).getTime() <= now;
      });
      if (due.length > 0) return due;
      // Fallback if none due
      return questions.filter((q) => {
        const s = progress[String(q.id)]?.status;
        return s === 'solved' || s === 'mastered';
      }).slice(0, 30);
    }
    if (filterMode === 'solved') {
      return questions.filter((q) => {
        const s = progress[String(q.id)]?.status;
        return s === 'solved' || s === 'mastered' || s === 'review';
      });
    }
    return questions.slice(0, 50);
  }, [questions, progress, filterMode]);

  const currentQuestion: Question | undefined = flashcardQuestions[currentIndex];

  // Fetch optimal C++ solution whenever card changes
  useEffect(() => {
    if (!currentQuestion || !isOpen) return;
    setIsFlipped(false);
    setIsLoadingSolution(true);
    fetch(`/solutions/${currentQuestion.id}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: QuestionSolution | null) => {
        setSolution(data);
        setIsLoadingSolution(false);
      })
      .catch(() => {
        setSolution(null);
        setIsLoadingSolution(false);
      });
  }, [currentQuestion?.id, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        sounds.playClick();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1, 'review');
        if (e.key === '2') handleRate(3, 'in-progress');
        if (e.key === '3') handleRate(7, 'solved');
        if (e.key === '4') handleRate(14, 'mastered');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFlipped, currentIndex, flashcardQuestions.length]);

  if (!isOpen) return null;

  const handleNext = () => {
    sounds.playClick();
    if (currentIndex < flashcardQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRate = (intervalDays: number, status: ProblemStatus) => {
    if (!currentQuestion) return;
    sounds.playSuccess();
    onUpdateStatus(currentQuestion.id, status, intervalDays);
    handleNext();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const optimalApproach = solution?.approaches?.[solution.approaches.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/50 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-[#E5FF00]/20 border border-border flex items-center justify-center text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Anki Flashcard Recall Trainer</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-medium/20 text-medium border border-medium/40">
                  SRS Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active recall testing of invariants, complexity bounds, and optimal C++ patterns
              </p>
            </div>
          </div>

          {/* Mode Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => { setFilterMode('due'); setCurrentIndex(0); }}
                className={`px-2 py-1 rounded-md ${filterMode === 'due' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Due for Review
              </button>
              <button
                onClick={() => { setFilterMode('solved'); setCurrentIndex(0); }}
                className={`px-2 py-1 rounded-md ${filterMode === 'solved' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Solved Problems
              </button>
              <button
                onClick={() => { setFilterMode('all'); setCurrentIndex(0); }}
                className={`px-2 py-1 rounded-md ${filterMode === 'all' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All Deck
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col justify-between">
          {flashcardQuestions.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3 opacity-80" />
              <h4 className="text-lg font-bold text-white">All Caught Up!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No questions are currently due for review under this filter. Try switching to "Solved Problems" or "All Deck".
              </p>
            </div>
          ) : !currentQuestion ? null : (
            <div>
              {/* Question Meta Banner */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    #{currentQuestion.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      currentQuestion.difficulty === 'Easy'
                        ? 'bg-easy/10 text-easy border-easy/40'
                        : currentQuestion.difficulty === 'Medium'
                        ? 'bg-medium/10 text-medium border-medium/40'
                        : 'bg-hard/10 text-hard border-hard/40'
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {currentQuestion.acceptance} acceptance
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Card {currentIndex + 1} of {flashcardQuestions.length}
                </div>
              </div>

              {/* Problem Title */}
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4">
                <a
                  href={`/problem/${currentQuestion.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline transition-colors"
                  title="Open dedicated Problem Workspace in new tab"
                >
                  {currentQuestion.title}
                </a>
              </h2>

              {/* Topics Pills */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {currentQuestion.topics.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* FLASHCARD INTERACTIVE FLIP AREA */}
              {!isFlipped ? (
                /* Card Front */
                <div className="rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-900/90 border border-slate-800 p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[260px] shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-surfaceElevated border border-border flex items-center justify-center text-primary mb-4 animate-pulse">
                    <Brain className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">
                    Active Recall Mental Challenge
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed mb-6">
                    Before revealing the solution, ask yourself:
                    <br />
                    <span className="text-medium font-semibold block mt-1.5">
                      1. What is the optimal algorithmic paradigm & invariant?
                    </span>
                    <span className="text-primary font-semibold block">
                      2. What are the tightest Time and Space complexity bounds?
                    </span>
                  </p>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsFlipped(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-bold hover:bg-primary text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Reveal Optimal C++ Solution & Theory</span>
                    <span className="text-[10px] font-mono opacity-70 ml-1">(Space)</span>
                  </button>
                </div>
              ) : (
                /* Card Back (Revealed) */
                <div className="rounded-2xl bg-slate-950 border border-border p-5 sm:p-6 shadow-2xl animate-fadeIn space-y-4">
                  {/* Theory & Invariant Banner */}
                  <div className="p-3.5 rounded-xl bg-surfaceElevated border border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Optimal Pattern & Invariant ({solution?.corePattern || 'Algorithm'})</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {optimalApproach?.theory ||
                        optimalApproach?.intuition ||
                        'Maintain problem invariants using optimal two pointers, hash map lookups, or dynamic programming state transitions.'}
                    </p>
                  </div>

                  {/* Complexity Tags */}
                  {optimalApproach && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Time Complexity
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">
                          {optimalApproach.timeComplexity.complexity}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Space Complexity
                        </span>
                        <span className="font-mono text-xs font-bold text-primary">
                          {optimalApproach.spaceComplexity.complexity}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Optimal C++ Code Snippet */}
                  {optimalApproach && (
                    <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                          <Code2 className="w-3.5 h-3.5 text-primary" />
                          {optimalApproach.name}
                        </span>
                        <button
                          onClick={() => copyCode(optimalApproach.cppCode)}
                          className="flex items-center gap-1 text-[11px] text-primary hover:text-white"
                        >
                          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-48 leading-relaxed">
                        <code>{optimalApproach.cppCode}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Rating & Navigation */}
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Previous / Next buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Card (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
              title="Next Card (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Recall SRS Feedback Ratings */}
          {isFlipped && currentQuestion && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden md:inline">
                Rate Recall:
              </span>
              <button
                onClick={() => handleRate(1, 'review')}
                className="px-2.5 py-1.5 rounded-xl bg-surfaceElevated hover:bg-surfaceElevated border border-hard/40 text-hard text-xs font-bold transition-all shadow-xs"
                title="Forgot or struggled (+1 day)"
              >
                🔴 Again (+1d) <span className="text-[10px] opacity-70">(1)</span>
              </button>
              <button
                onClick={() => handleRate(3, 'in-progress')}
                className="px-2.5 py-1.5 rounded-xl bg-surfaceElevated hover:bg-surfaceElevated border border-medium/40 text-medium text-xs font-bold transition-all shadow-xs"
                title="Recalled with effort (+3 days)"
              >
                🟡 Hard (+3d) <span className="text-[10px] opacity-70">(2)</span>
              </button>
              <button
                onClick={() => handleRate(7, 'solved')}
                className="px-2.5 py-1.5 rounded-xl bg-surfaceElevated hover:bg-surfaceElevated border border-primary/40 text-primary text-xs font-bold transition-all shadow-xs"
                title="Good recall (+7 days)"
              >
                🟢 Good (+7d) <span className="text-[10px] opacity-70">(3)</span>
              </button>
              <button
                onClick={() => handleRate(14, 'mastered')}
                className="px-2.5 py-1.5 rounded-xl bg-surfaceElevated hover:bg-surfaceElevated border border-border text-primary text-xs font-bold transition-all shadow-xs"
                title="Instant mastery (+14 days)"
              >
                🔵 Easy (+14d) <span className="text-[10px] opacity-70">(4)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
