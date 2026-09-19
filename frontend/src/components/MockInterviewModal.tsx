import React, { useState, useEffect, useRef } from 'react';
import { Question, CompanyMeta, ProblemStatus } from '../types';
import { X, Play, Pause, RotateCcw, ExternalLink, CheckCircle2, Award, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';

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
      colors: ['#10B981', '#6366F1', '#F59E0B'],
    });
    onUpdateStatus(activeQ.id, 'solved');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeQ = selectedQuestions[activeQuestionIndex];
  const progressPercent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Mock Interview Simulation • {companyMeta?.name || company}
              </h2>
              <p className="text-xs text-slate-400">
                45-minute timed interview simulation with company-frequent questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="font-mono text-2xl font-black text-white bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
              {formatTime(secondsRemaining)}
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setIsRunning(!isRunning);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause Interview' : 'Start Timer'}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsRemaining(totalSeconds);
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={pickQuestions}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Reroll Questions 🎲
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              secondsRemaining < 300
                ? 'bg-rose-500'
                : secondsRemaining < 900
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Question Selector Tabs */}
          <div className="flex items-center gap-2">
            {selectedQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestionIndex(idx)}
                className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                  activeQuestionIndex === idx
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span>Problem #{idx + 1}</span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                      q.difficulty === 'Easy'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : q.difficulty === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>
                <h4 className="font-semibold text-white truncate text-sm">{q.title}</h4>
              </button>
            ))}
          </div>

          {/* Active Question Display */}
          {activeQ && (
            <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-slate-400">LeetCode #{activeQ.id}</span>
                  <h3 className="text-lg font-bold text-white">{activeQ.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSolveActive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Solved
                  </button>

                  <a
                    href={activeQ.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                  >
                    <span>Open in LeetCode</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5">
                {activeQ.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 text-xs rounded-md bg-slate-800 text-slate-300 border border-slate-700/50 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interview Evaluation Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Interview Evaluation Rubric (Check as you go)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { id: 'clarify', label: 'Asked clarifying questions & constraints' },
                { id: 'bruteForce', label: 'Explained brute-force approach first' },
                { id: 'optimal', label: 'Proposed and explained optimal data structure' },
                { id: 'complexities', label: 'Analyzed Time O(...) and Space O(...) upfront' },
                { id: 'edgeCases', label: 'Identified null, empty, or boundary edge cases' },
                { id: 'dryRun', label: 'Dry-ran with an example walkthrough before submission' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleChecklist(id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                    checklist[id]
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      checklist[id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700'
                    }`}
                  >
                    {checklist[id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between px-5">
          <span className="text-xs text-slate-400">
            Simulation tip: Keep talking out loud while coding to simulate real interview feedback.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
};
