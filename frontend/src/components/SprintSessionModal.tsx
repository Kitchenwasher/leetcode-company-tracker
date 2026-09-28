import React, { useState, useEffect, useRef } from 'react';
import { Question, Difficulty, ProblemStatus } from '../types';
import { CodeEditorRunner } from './CodeEditorRunner';
import { QuestionDescription } from '../types/solution';
import {
  X, Play, Pause, RotateCcw, Clock, Award, CheckCircle2,
  ExternalLink, Zap, ChevronRight, Sparkles, Trophy, ArrowRight
} from 'lucide-react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import { DifficultyBadge } from './ui/DifficultyBadge';

interface SprintSessionModalProps {
  durationMinutes: number; // 15, 30, 45
  questions: Question[];
  onClose: () => void;
  onUpdateStatus: (qId: number | string, status: ProblemStatus) => void;
  onNavigateToProblem?: (id: number | string) => void;
}

export const SprintSessionModal: React.FC<SprintSessionModalProps> = ({
  durationMinutes,
  questions,
  onClose,
  onUpdateStatus,
  onNavigateToProblem,
}) => {
  const [sprintQuestions, setSprintQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(durationMinutes * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [solvedInSession, setSolvedInSession] = useState<Set<number | string>>(new Set());
  const [descriptionData, setDescriptionData] = useState<QuestionDescription | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Initialize randomized sprint queue
  useEffect(() => {
    let questionCount = 3;
    if (durationMinutes === 15) questionCount = 2;
    else if (durationMinutes === 30) questionCount = 3;
    else questionCount = 4;

    const easies = questions.filter((q) => q.difficulty === 'Easy').sort(() => 0.5 - Math.random());
    const mediums = questions.filter((q) => q.difficulty === 'Medium').sort(() => 0.5 - Math.random());
    const hards = questions.filter((q) => q.difficulty === 'Hard').sort(() => 0.5 - Math.random());

    const picked: Question[] = [];
    if (durationMinutes === 15) {
      if (easies[0]) picked.push(easies[0]);
      if (mediums[0]) picked.push(mediums[0]);
    } else if (durationMinutes === 30) {
      if (easies[0]) picked.push(easies[0]);
      if (mediums[0]) picked.push(mediums[0]);
      if (mediums[1]) picked.push(mediums[1]);
    } else {
      if (easies[0]) picked.push(easies[0]);
      if (mediums[0]) picked.push(mediums[0]);
      if (mediums[1]) picked.push(mediums[1]);
      if (hards[0]) picked.push(hards[0]);
    }

    const fallbackPool = [...questions].sort(() => 0.5 - Math.random());
    while (picked.length < questionCount && fallbackPool.length > 0) {
      const candidate = fallbackPool.pop();
      if (candidate && !picked.some((p) => p.id === candidate.id)) {
        picked.push(candidate);
      }
    }

    setSprintQuestions(picked);
    setActiveIndex(0);
    const secs = durationMinutes * 60;
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);
    setIsFinished(false);
  }, [durationMinutes, questions]);

  // Load problem description for active question
  const activeQ = sprintQuestions[activeIndex];
  useEffect(() => {
    if (!activeQ) {
      setDescriptionData(null);
      return;
    }
    let isMounted = true;
    const loadDesc = async () => {
      try {
        setIsLoadingDescription(true);
        let data: QuestionDescription | null = null;
        try {
          const res = await fetch(`/descriptions/${activeQ.id}.json`);
          if (res.ok) {
            const parsed = await res.json();
            if (parsed && parsed.content) data = parsed;
          }
        } catch {}

        if (!data || !data.content) {
          try {
            const res = await fetch(`/api/judge/problem/${activeQ.id}`);
            if (res.ok) {
              const parsed = await res.json();
              if (parsed && parsed.content) data = parsed;
            }
          } catch {}
        }
        if (isMounted) setDescriptionData(data);
      } finally {
        if (isMounted) setIsLoadingDescription(false);
      }
    };
    loadDesc();
    return () => {
      isMounted = false;
    };
  }, [activeQ?.id]);

  // Timer Tick
  useEffect(() => {
    if (isRunning && !isFinished) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            sounds.playTimerAlert();
            handleFinishSprint();
            return 0;
          }
          if (prev === 2 * 60) {
            sounds.playTimerAlert();
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
  }, [isRunning, isFinished]);

  const handleMarkSolved = (qId: number | string) => {
    sounds.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#A855F7', '#FFFFFF', '#C084FC', '#7C3AED'],
    });
    setSolvedInSession((prev) => new Set([...prev, qId]));
    onUpdateStatus(qId, 'solved');
  };

  const handleFinishSprint = () => {
    setIsRunning(false);
    setIsFinished(true);
    sounds.playSuccess();
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-7xl h-[95vh] flex flex-col bg-[#0B0F14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-[#0E1217] border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Zap className="w-4 h-4 fill-primary text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-sans">
                  {durationMinutes}-Minute Speed Run Sprint
                </h2>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  {sprintQuestions.length} Problems
                </span>
              </div>
              <p className="text-xs text-textSecondary hidden sm:block">
                Solve problems rapidly against the clock to build high-stakes interview agility
              </p>
            </div>
          </div>

          {/* Center Timer Controls */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#080B0F] px-3 py-1.5 rounded-xl border border-white/[0.08]">
            <Clock className="w-4 h-4 text-primary" />
            <span
              className={`text-lg sm:text-xl font-bold font-mono tracking-wider ${
                secondsRemaining < 120
                  ? 'text-rose-400 animate-pulse'
                  : secondsRemaining < 300
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {formatTime(secondsRemaining)}
            </span>

            <button
              onClick={() => {
                sounds.playClick();
                setIsRunning(!isRunning);
              }}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-textSecondary hover:text-white transition-colors cursor-pointer"
              title={isRunning ? 'Pause' : 'Resume'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsRemaining(totalSeconds);
              }}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-textSecondary hover:text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Action: Finish & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFinishSprint}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-purple-600 text-white text-xs font-bold shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 fill-white text-white" />
              <span>Finish Sprint</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Countdown Progress Bar */}
        <div className="w-full h-1 bg-white/[0.05]">
          <div
            className={`h-full transition-all duration-300 ${
              secondsRemaining < 120
                ? 'bg-rose-500'
                : secondsRemaining < 300
                ? 'bg-amber-400'
                : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0E1217]/80 border-b border-white/[0.06] overflow-x-auto select-none">
          {sprintQuestions.map((q, idx) => {
            const isSolved = solvedInSession.has(q.id);
            return (
              <button
                key={q.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveIndex(idx);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer shrink-0 font-medium ${
                  activeIndex === idx
                    ? 'bg-primary/15 border-primary/50 text-white shadow-sm'
                    : 'bg-[#12161E]/60 border-white/[0.06] text-textSecondary hover:text-white hover:border-white/15'
                }`}
              >
                <span>P{idx + 1}: {q.title}</span>
                <DifficultyBadge difficulty={q.difficulty} />
                {isSolved && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeQ ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
              {/* Left Column: Problem details (5 cols) */}
              <div className="lg:col-span-5 h-full overflow-y-auto p-4 space-y-4 border-r border-white/[0.08] bg-[#0E1217]/40">
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-textMuted">
                      Problem {activeIndex + 1} of {sprintQuestions.length} • LeetCode #{activeQ.id}
                    </span>
                    <DifficultyBadge difficulty={activeQ.difficulty} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {activeQ.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeQ.topics.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-white/[0.04] text-textSecondary border border-white/[0.06]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={activeQ.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      <span>LeetCode Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {solvedInSession.has(activeQ.id) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solved</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkSolved(activeQ.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Solved</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {descriptionData?.content ? (
                  <div className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] space-y-2 text-xs text-zinc-300 leading-relaxed max-h-96 overflow-y-auto">
                    <h4 className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                      Problem Description
                    </h4>
                    <div
                      className="prose prose-invert prose-xs max-w-none text-zinc-300 space-y-2"
                      dangerouslySetInnerHTML={{ __html: descriptionData.content }}
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] text-xs text-textSecondary">
                    {isLoadingDescription ? (
                      <p>Loading problem description...</p>
                    ) : (
                      <p>
                        Refer to the LeetCode link above for full description and examples. Write your code and test it against the runner on the right.
                      </p>
                    )}
                  </div>
                )}

                {/* Speed Tip */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primaryLight space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span>Sprint Speed Rule</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Aim to identify the optimal pattern within 90 seconds. If stuck past 5 minutes, implement the working brute force first, then optimize!
                  </p>
                </div>
              </div>

              {/* Right Column: Monaco Code Editor & Runner (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col min-h-0 bg-[#080B0F]">
                <CodeEditorRunner
                  question={activeQ}
                  descriptionData={descriptionData}
                  onSolved={() => handleMarkSolved(activeQ.id)}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-textSecondary">
              <p>No problems in sprint queue.</p>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3 bg-[#0E1217] border-t border-white/[0.08] flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs text-textSecondary">
            <span>
              Problem {activeIndex + 1} of {sprintQuestions.length}
            </span>
            <span className="text-textMuted">
              • Solved: {solvedInSession.size}/{sprintQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activeIndex === 0}
              onClick={() => {
                sounds.playClick();
                setActiveIndex((prev) => Math.max(0, prev - 1));
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white transition-colors cursor-pointer"
            >
              Previous
            </button>
            {activeIndex < sprintQuestions.length - 1 ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveIndex((prev) => Math.min(sprintQuestions.length - 1, prev + 1));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-purple-600 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishSprint}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-purple-600 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finish Sprint</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Scorecard Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-[#0E1217] border border-white/[0.1] rounded-2xl p-6 sm:p-7 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto text-primary">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                Sprint Completed
              </span>
              <h3 className="text-2xl font-bold text-white font-sans">
                {durationMinutes}-Min Speed Run Scorecard
              </h3>
              <p className="text-xs text-textSecondary">
                Pacing and execution evaluation for this sprint session.
              </p>
            </div>

            {/* Score Ring */}
            <div className="py-4 bg-[#12161E] rounded-xl border border-white/[0.06] space-y-2">
              <div className="text-5xl font-black font-mono text-primary">
                {sprintQuestions.length > 0
                  ? Math.round((solvedInSession.size / sprintQuestions.length) * 100)
                  : 0}
                %
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/[0.05]">
                {solvedInSession.size === sprintQuestions.length ? (
                  <span className="text-emerald-400">Speed Demon • 100% Cleared</span>
                ) : solvedInSession.size > 0 ? (
                  <span className="text-primary">Solid Pacing</span>
                ) : (
                  <span className="text-rose-400">Needs More Acceleration</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-textMuted">Time</p>
                <p className="font-bold text-white mt-0.5">{elapsedMinutes}m / {durationMinutes}m</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-textMuted">Solved</p>
                <p className="font-bold text-white mt-0.5">
                  {solvedInSession.size}/{sprintQuestions.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-textMuted">Status</p>
                <p className="font-bold text-emerald-400 mt-0.5">Logged</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-primary hover:bg-purple-600 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              Return to Practice Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintSessionModal;
