import React, { useState, useEffect, useRef } from 'react';
import { Question, CompanyMeta, ProblemStatus } from '../types';
import { X, Play, Pause, RotateCcw, ExternalLink, CheckCircle2, Award, Clock, AlertTriangle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import { DifficultyBadge } from './ui/DifficultyBadge';

import { saveMockInterview } from '../utils/mockInterviewStorage';

interface MockInterviewModalProps {
  company: string;
  companyMeta?: CompanyMeta;
  questions: Question[];
  onClose: () => void;
  onUpdateStatus: (qId: number | string, status: ProblemStatus) => void;
}

export const MockInterviewModal: React.FC<MockInterviewModalProps> = ({
  company,
  companyMeta,
  questions,
  onClose,
  onUpdateStatus,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(45 * 60); // 45 mins
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [solvedInSession, setSolvedInSession] = useState<Set<number | string>>(new Set());
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    clarify: false,
    bruteForce: false,
    optimal: false,
    complexities: false,
    edgeCases: false,
    dryRun: false,
  });

  const timerRef = useRef<number | null>(null);

  // Pick 2 questions suitable for the interview
  const pickQuestions = () => {
    const companyQuestions = questions.filter((q) => !!q.companies[company]);
    const easies = companyQuestions.filter((q) => q.difficulty === 'Easy');
    const mediums = companyQuestions.filter((q) => q.difficulty === 'Medium');
    const hards = companyQuestions.filter((q) => q.difficulty === 'Hard');

    // Default: 1 Medium + 1 Hard (or Medium if hard is unavailable)
    const q1 = mediums.length > 0
      ? mediums[Math.floor(Math.random() * mediums.length)]
      : easies[Math.floor(Math.random() * easies.length)];

    const q2 = hards.length > 0
      ? hards[Math.floor(Math.random() * hards.length)]
      : mediums[Math.floor(Math.random() * mediums.length)];

    const picked = [q1, q2].filter(Boolean);
    setSelectedQuestions(picked);
    setActiveQuestionIndex(0);
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
  };

  useEffect(() => {
    pickQuestions();
  }, [company]);

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            sounds.playTimerAlert();
            return 0;
          }
          if (prev === 5 * 60) {
            sounds.playTimerAlert(); // 5 min warning
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleChecklist = (key: string) => {
    sounds.playClick();
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSolveActive = () => {
    const activeQ = selectedQuestions[activeQuestionIndex];
    if (!activeQ) return;

    sounds.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#A855F7', '#FFFFFF', '#C084FC', '#7C3AED'],
    });
    setSolvedInSession((prev) => new Set([...prev, activeQ.id]));
    onUpdateStatus(activeQ.id, 'solved');
  };

  const handleEndSession = () => {
    const elapsedSecs = totalSeconds - secondsRemaining;
    const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60));
    const rubricCheckedCount = Object.values(checklist).filter(Boolean).length;
    const solvedCount = solvedInSession.size;

    if (rubricCheckedCount > 0 || solvedCount > 0 || elapsedMins >= 2) {
      const rubricScore = (rubricCheckedCount / 6) * 50;
      const solveScore = selectedQuestions.length > 0 ? (solvedCount / selectedQuestions.length) * 50 : 0;
      const finalScore = Math.min(100, Math.round(rubricScore + solveScore));

      saveMockInterview({
        id: 'mock_' + Date.now(),
        company: companyMeta?.name || company,
        role: 'SWE Candidate',
        type: 'Coding',
        difficulty: selectedQuestions[0]?.difficulty || 'Medium',
        score: finalScore,
        durationMinutes: elapsedMins,
        solvedCount,
        totalQuestions: selectedQuestions.length,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: Date.now(),
      });
    }
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeQ = selectedQuestions[activeQuestionIndex];
  const progressPercent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0E1217] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Mock Interview • {companyMeta?.name || company}
              </h2>
              <p className="text-xs text-textSecondary mt-0.5">
                45-minute timed simulation with verified interview questions
              </p>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Close session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timer Bar */}
        <div className="p-4 bg-[#12161E] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-primary bg-[#080B0F] px-4 py-1 rounded-xl border border-white/[0.08]">
              {formatTime(secondsRemaining)}
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setIsRunning(!isRunning);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isRunning
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-primary text-white hover:bg-purple-600 shadow-md shadow-primary/20'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Start Timer'}</span>
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsRemaining(totalSeconds);
              }}
              className="p-2 rounded-xl bg-white/[0.04] text-textSecondary hover:text-white hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={pickQuestions}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-textSecondary hover:text-white text-xs font-medium transition-colors border border-white/[0.06] cursor-pointer"
            >
              Reroll Questions 🎲
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/[0.06]">
          <div
            className={`h-full transition-all duration-300 ${
              secondsRemaining < 300
                ? 'bg-rose-500'
                : secondsRemaining < 900
                ? 'bg-amber-400'
                : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Question Selector Tabs */}
          <div className="flex items-center gap-3">
            {selectedQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`flex-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeQuestionIndex === idx
                    ? 'bg-[#12161E] border-primary/50 text-white shadow-md shadow-primary/5'
                    : 'bg-[#12161E]/40 border-white/[0.06] hover:border-white/15 text-textSecondary'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="text-textMuted font-mono">Problem #{idx + 1}</span>
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <h4 className="font-semibold text-white truncate text-xs sm:text-sm">{q.title}</h4>
              </button>
            ))}
          </div>

          {/* Active Question Display */}
          {activeQ && (
            <div className="p-5 rounded-xl bg-[#12161E]/60 border border-white/[0.06] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-textMuted">LeetCode #{activeQ.id}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{activeQ.title}</h3>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSolveActive}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Solved</span>
                  </button>

                  <a
                    href={activeQ.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] text-xs font-medium transition-colors"
                  >
                    <span>LeetCode</span>
                    <ExternalLink className="w-3.5 h-3.5 text-textMuted" />
                  </a>
                </div>
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5">
                {activeQ.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-xs rounded-md bg-white/[0.03] text-textSecondary border border-white/[0.05]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview Evaluation Checklist */}
          <div className="p-5 rounded-xl bg-[#12161E]/60 border border-white/[0.06] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Interview Evaluation Rubric</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'clarify', label: 'Asked clarifying questions & input boundaries' },
                { id: 'bruteForce', label: 'Explained naive brute-force baseline' },
                { id: 'optimal', label: 'Proposed optimal algorithm & data structure' },
                { id: 'complexities', label: 'Analyzed Time O(...) and Space O(...) upfront' },
                { id: 'edgeCases', label: 'Tested null, empty, or boundary edge cases' },
                { id: 'dryRun', label: 'Walked through code with an example trace' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleChecklist(id)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                    checklist[id]
                      ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                      : 'bg-[#12161E] border-white/[0.06] text-textSecondary hover:text-white'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    checklist[id] ? 'bg-primary border-primary text-black' : 'border-zinc-600'
                  }`}>
                    {checklist[id] && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0E1217] flex items-center justify-between px-5">
          <span className="text-xs text-textSecondary">
            Tip: State your thought process aloud before writing code.
          </span>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewModal;
