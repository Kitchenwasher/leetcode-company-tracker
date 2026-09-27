import React, { useState, useEffect, useRef } from 'react';
import { Question, CompanyMeta, ProblemStatus, MockSessionConfig } from '../types';
import { BehavioralQuestion, getBehavioralQuestions } from '../data/behavioralQuestions';
import { CodeEditorRunner } from './CodeEditorRunner';
import { mockApi } from '../api/mockApi';
import { saveMockInterview } from '../utils/mockInterviewStorage';
import { QuestionDescription } from '../types/solution';
import {
  X, Play, Pause, RotateCcw, ExternalLink, CheckCircle2, Award, Clock,
  ShieldCheck, Check, Sparkles, Code2, MessageSquare, ArrowRight, ChevronRight,
  TrendingUp, CheckCircle, HelpCircle, Layers, FileText
} from 'lucide-react';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import { DifficultyBadge } from './ui/DifficultyBadge';
import { useAuth } from '../context/AuthContext';

export interface MockItem {
  id: string | number;
  type: 'coding' | 'behavioral';
  codingQuestion?: Question;
  behavioralQuestion?: BehavioralQuestion;
}

interface MockInterviewModalProps {
  company: string;
  companyMeta?: CompanyMeta;
  questions: Question[];
  config?: MockSessionConfig;
  onClose: () => void;
  onUpdateStatus: (qId: number | string, status: ProblemStatus) => void;
}

export const MockInterviewModal: React.FC<MockInterviewModalProps> = ({
  company,
  companyMeta,
  questions,
  config,
  onClose,
  onUpdateStatus,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<MockItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(45 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [solvedInSession, setSolvedInSession] = useState<Set<number | string>>(new Set());
  
  // Technical checklist for each coding question
  const [techChecklist, setTechChecklist] = useState<Record<string, Record<string, boolean>>>({});
  
  // STAR responses for behavioral questions
  const [starNotes, setStarNotes] = useState<Record<string, { situation: string; task: string; action: string; result: string }>>({});
  
  // Behavioral checklist for each question
  const [behChecklist, setBehChecklist] = useState<Record<string, Record<string, boolean>>>({});

  // Active coding question description
  const [descriptionData, setDescriptionData] = useState<QuestionDescription | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState<boolean>(false);

  // Scorecard / Finish State
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Pick questions based on company, config difficulty, question count, and interview type
  const setupInterviewItems = () => {
    const interviewType = config?.type || 'Coding';
    const targetCount = config?.questionCount || 3;
    const targetCompany = config?.company || company;
    const targetDiff = config?.difficulty;
    const targetTopic = config?.topic;

    const normalizedCompany = targetCompany.toLowerCase();
    const companyCodingQs = questions.filter(
      (q) => !!q.companies[targetCompany] || !!q.companies[normalizedCompany]
    );
    const pool = companyCodingQs.length > 0 ? companyCodingQs : questions;

    let filteredCoding = [...pool];
    if (targetDiff && targetDiff !== 'All' && targetDiff !== 'All Difficulties') {
      const match = filteredCoding.filter((q) => q.difficulty.toLowerCase() === targetDiff.toLowerCase());
      if (match.length > 0) filteredCoding = match;
    }
    if (targetTopic && targetTopic !== 'All Topics' && targetTopic !== 'All') {
      const keywords = targetTopic.toLowerCase().split(',').map((s) => s.trim());
      const match = filteredCoding.filter((q) =>
        keywords.some((kw) => q.topics.some((t) => t.toLowerCase().includes(kw)))
      );
      if (match.length > 0) filteredCoding = match;
    }

    // Shuffle pool
    const shuffledCoding = [...filteredCoding].sort(() => 0.5 - Math.random());
    const behavioralPool = getBehavioralQuestions(targetCompany);
    const shuffledBehavioral = [...behavioralPool].sort(() => 0.5 - Math.random());

    const pickedItems: MockItem[] = [];

    if (interviewType === 'Coding') {
      const count = Math.min(targetCount, shuffledCoding.length || 1);
      for (let i = 0; i < count; i++) {
        if (shuffledCoding[i]) {
          pickedItems.push({
            id: shuffledCoding[i].id,
            type: 'coding',
            codingQuestion: shuffledCoding[i],
          });
        }
      }
    } else if (interviewType === 'Behavioral') {
      const count = Math.min(targetCount, shuffledBehavioral.length || 1);
      for (let i = 0; i < count; i++) {
        if (shuffledBehavioral[i]) {
          pickedItems.push({
            id: shuffledBehavioral[i].id,
            type: 'behavioral',
            behavioralQuestion: shuffledBehavioral[i],
          });
        }
      }
    } else {
      // Mixed: split half coding, half behavioral
      const codingCount = Math.max(1, Math.floor(targetCount / 2));
      const behCount = Math.max(1, targetCount - codingCount);
      for (let i = 0; i < codingCount && i < shuffledCoding.length; i++) {
        pickedItems.push({
          id: shuffledCoding[i].id,
          type: 'coding',
          codingQuestion: shuffledCoding[i],
        });
      }
      for (let i = 0; i < behCount && i < shuffledBehavioral.length; i++) {
        pickedItems.push({
          id: shuffledBehavioral[i].id,
          type: 'behavioral',
          behavioralQuestion: shuffledBehavioral[i],
        });
      }
    }

    if (pickedItems.length === 0 && questions.length > 0) {
      pickedItems.push({
        id: questions[0].id,
        type: 'coding',
        codingQuestion: questions[0],
      });
    }

    // Calculate duration based on questions count
    let durationMins = 45;
    if (pickedItems.length === 1) durationMins = 30;
    else if (pickedItems.length === 2) durationMins = 45;
    else if (pickedItems.length === 3) durationMins = 60;
    else durationMins = Math.min(90, pickedItems.length * 20);

    const secs = durationMins * 60;
    setItems(pickedItems);
    setActiveIndex(0);
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);
    setIsFinished(false);
  };

  useEffect(() => {
    setupInterviewItems();
  }, [company, config]);

  // Load description for active coding question
  const activeItem = items[activeIndex];
  useEffect(() => {
    const activeCodingQ = activeItem?.codingQuestion;
    if (!activeCodingQ) {
      setDescriptionData(null);
      return;
    }
    let isMounted = true;
    const loadDesc = async () => {
      try {
        setIsLoadingDescription(true);
        let data: QuestionDescription | null = null;
        try {
          const res = await fetch(`/descriptions/${activeCodingQ.id}.json`);
          if (res.ok) {
            const parsed = await res.json();
            if (parsed && parsed.content) data = parsed;
          }
        } catch {}

        if (!data || !data.content) {
          try {
            const res = await fetch(`/api/judge/problem/${activeCodingQ.id}`);
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
  }, [activeItem?.codingQuestion?.id]);

  // Timer Tick
  useEffect(() => {
    if (isRunning && !isFinished) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            sounds.playTimerAlert();
            handleFinishSession();
            return 0;
          }
          if (prev === 5 * 60) {
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

  const toggleTechChecklist = (qId: string | number, key: string) => {
    sounds.playClick();
    setTechChecklist((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [key]: !prev[qId]?.[key],
      },
    }));
  };

  const toggleBehChecklist = (bId: string, key: string) => {
    sounds.playClick();
    setBehChecklist((prev) => ({
      ...prev,
      [bId]: {
        ...prev[bId],
        [key]: !prev[bId]?.[key],
      },
    }));
  };

  const updateStarField = (
    bId: string,
    field: 'situation' | 'task' | 'action' | 'result',
    val: string
  ) => {
    setStarNotes((prev) => ({
      ...prev,
      [bId]: {
        situation: prev[bId]?.situation || '',
        task: prev[bId]?.task || '',
        action: prev[bId]?.action || '',
        result: prev[bId]?.result || '',
        [field]: val,
      },
    }));
  };

  const handleMarkCodingSolved = (qId: string | number) => {
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

  const computeSessionScore = (): number => {
    if (items.length === 0) return 0;
    let totalScore = 0;

    items.forEach((item) => {
      if (item.type === 'coding' && item.codingQuestion) {
        const isSolved = solvedInSession.has(item.codingQuestion.id);
        const checks = Object.values(techChecklist[item.codingQuestion.id] || {}).filter(Boolean).length;
        const solveScore = isSolved ? 70 : 0;
        const rubricScore = (checks / 6) * 30;
        totalScore += solveScore + rubricScore;
      } else if (item.type === 'behavioral' && item.behavioralQuestion) {
        const star = starNotes[item.behavioralQuestion.id] || { situation: '', task: '', action: '', result: '' };
        let starPoints = 0;
        if (star.situation.trim().length > 10) starPoints += 15;
        if (star.task.trim().length > 10) starPoints += 15;
        if (star.action.trim().length > 15) starPoints += 25;
        if (star.result.trim().length > 15) starPoints += 20;
        const behChecks = Object.values(behChecklist[item.behavioralQuestion.id] || {}).filter(Boolean).length;
        const rubricPoints = (behChecks / 4) * 25;
        totalScore += starPoints + rubricPoints;
      }
    });

    const averageScore = Math.min(100, Math.round(totalScore / items.length));
    return averageScore;
  };

  const handleFinishSession = async () => {
    setIsRunning(false);
    const score = computeSessionScore();
    setCalculatedScore(score);
    setIsFinished(true);

    sounds.playSuccess();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const elapsedSecs = totalSeconds - secondsRemaining;
    const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60));
    const targetComp = config?.company || companyMeta?.name || company;

    const sessionData = {
      id: 'mock_' + Date.now(),
      company: targetComp,
      role: 'SWE Candidate',
      type: config?.type || 'Coding',
      difficulty: config?.difficulty || 'Medium',
      score,
      durationMinutes: elapsedMins,
      solvedCount: solvedInSession.size,
      totalQuestions: items.length,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
    };

    saveMockInterview(sessionData);

    // Save to Neon DB if authenticated
    if (isAuthenticated && user?.id && user.id !== 'guest') {
      try {
        setIsSavingSession(true);
        await mockApi.recordSession({
          company: targetComp,
          role: 'SWE Candidate',
          type: config?.type || 'Coding',
          difficulty: config?.difficulty || 'Medium',
          score,
          durationMinutes: elapsedMins,
          solvedCount: solvedInSession.size,
          totalQuestions: items.length,
          feedback: `Scored ${score}% in ${elapsedMins} mins simulation with ${solvedInSession.size}/${items.length} questions completed.`,
          questionsData: items.map((it) => ({
            id: it.id,
            title: it.codingQuestion?.title || it.behavioralQuestion?.title || 'Question',
            difficulty: it.codingQuestion?.difficulty || 'Medium',
            solved: it.type === 'coding' ? solvedInSession.has(it.id) : true,
            timeSpentSeconds: Math.round(elapsedSecs / items.length),
          })),
        });
      } catch (err) {
        console.warn('Failed to persist mock session to Neon DB:', err);
      } finally {
        setIsSavingSession(false);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  const codingItemsCount = items.filter((it) => it.type === 'coding').length;
  const targetCompany = config?.company || companyMeta?.name || company;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-7xl h-[95vh] flex flex-col bg-[#0B0F14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-[#0E1217] border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-sans">
                  {targetCompany} Mock Interview
                </h2>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  {config?.type || 'Coding'}
                </span>
                {config?.difficulty && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                    {config.difficulty}
                  </span>
                )}
              </div>
              <p className="text-xs text-textSecondary hidden sm:block">
                Timed simulation with authentic {targetCompany} standards & rubric evaluation
              </p>
            </div>
          </div>

          {/* Center Timer Controls */}
          <div className="flex items-center gap-2 sm:gap-3 bg-[#080B0F] px-3 py-1.5 rounded-xl border border-white/[0.08]">
            <Clock className="w-4 h-4 text-primary" />
            <span
              className={`text-lg sm:text-xl font-bold font-mono tracking-wider ${
                secondsRemaining < 300
                  ? 'text-rose-400 animate-pulse'
                  : secondsRemaining < 900
                  ? 'text-amber-400'
                  : 'text-primary'
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
              onClick={handleFinishSession}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-purple-600 text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Finish Session</span>
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
              secondsRemaining < 300
                ? 'bg-rose-500'
                : secondsRemaining < 900
                ? 'bg-amber-400'
                : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Selector Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0E1217]/80 border-b border-white/[0.06] overflow-x-auto select-none">
          {items.map((item, idx) => {
            const isSolved = item.type === 'coding' && item.codingQuestion ? solvedInSession.has(item.codingQuestion.id) : false;
            const title = item.codingQuestion?.title || item.behavioralQuestion?.title || `Item ${idx + 1}`;
            return (
              <button
                key={item.id}
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
                {item.type === 'coding' ? (
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>Q{idx + 1}: {title}</span>
                {item.type === 'coding' && item.codingQuestion && (
                  <DifficultyBadge difficulty={item.codingQuestion.difficulty} />
                )}
                {isSolved && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Body Layout */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeItem?.type === 'coding' && activeItem.codingQuestion ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
              {/* Left Column: Problem details & Rubric Checklist (5 cols) */}
              <div className="lg:col-span-5 h-full overflow-y-auto p-4 space-y-4 border-r border-white/[0.08] bg-[#0E1217]/40">
                <div className="p-4 rounded-xl bg-[#12161E] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-textMuted">
                      Problem {activeIndex + 1} of {items.length} • LeetCode #{activeItem.codingQuestion.id}
                    </span>
                    <DifficultyBadge difficulty={activeItem.codingQuestion.difficulty} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {activeItem.codingQuestion.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeItem.codingQuestion.topics.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-white/[0.04] text-textSecondary border border-white/[0.06]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={activeItem.codingQuestion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      <span>View on LeetCode</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {solvedInSession.has(activeItem.codingQuestion.id) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solved in Session</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkCodingSolved(activeItem.codingQuestion!.id)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer hover:underline"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark as Solved</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Problem Description Snippet */}
                {descriptionData?.content ? (
                  <div className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] space-y-2 text-xs text-zinc-300 leading-relaxed max-h-72 overflow-y-auto">
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
                      <p>Loading authentic problem statement...</p>
                    ) : (
                      <p>
                        Refer to the LeetCode link above for full problem statement and constraints. Write and verify your solution on the live editor.
                      </p>
                    )}
                  </div>
                )}

                {/* Live Technical Evaluation Rubric */}
                <div className="p-4 rounded-xl bg-[#12161E]/60 border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>Technical Rubric Checklist</span>
                    </h4>
                    <span className="text-[11px] font-mono text-textMuted">
                      {Object.values(techChecklist[activeItem.codingQuestion.id] || {}).filter(Boolean).length}/6 Checked
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {[
                      { id: 'clarify', label: '1. Asked clarifying questions & input boundaries' },
                      { id: 'bruteForce', label: '2. Stated naive brute-force baseline' },
                      { id: 'optimal', label: '3. Formulated optimal algorithm & data structures' },
                      { id: 'complexities', label: '4. Stated Big-O Time and Space upfront' },
                      { id: 'edgeCases', label: '5. Analyzed null, empty, or overflow edge cases' },
                      { id: 'dryRun', label: '6. Traced an execution dry run before submitting' },
                    ].map(({ id, label }) => {
                      const isChecked = !!techChecklist[activeItem.codingQuestion!.id]?.[id];
                      return (
                        <button
                          key={id}
                          onClick={() => toggleTechChecklist(activeItem.codingQuestion!.id, id)}
                          className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                              : 'bg-[#12161E] border-white/[0.06] text-textSecondary hover:text-white'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-primary border-primary text-black' : 'border-zinc-600'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Code Editor & Runner (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col min-h-0 bg-[#080B0F]">
                <CodeEditorRunner
                  question={activeItem.codingQuestion}
                  descriptionData={descriptionData}
                  onSolved={() => handleMarkCodingSolved(activeItem.codingQuestion!.id)}
                />
              </div>
            </div>
          ) : activeItem?.type === 'behavioral' && activeItem.behavioralQuestion ? (
            /* Behavioral STAR Workspace */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
              {/* Question Header */}
              <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 text-xs font-semibold">
                      {activeItem.behavioralQuestion.category}
                    </span>
                    <span className="text-xs text-textMuted font-mono">
                      {activeItem.behavioralQuestion.company} Standard
                    </span>
                  </div>
                  <span className="text-xs font-mono text-textMuted">
                    Prompt {activeIndex + 1} of {items.length}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {activeItem.behavioralQuestion.prompt}
                </h3>

                {/* Interviewer Tips */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs text-textSecondary">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>What Top Evaluators Look For:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300">
                    {activeItem.behavioralQuestion.interviewerTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* STAR Framework Input Boxes */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>STAR Framework Draft & Talking Points</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Situation */}
                  <div className="p-4 rounded-xl bg-[#0E1217] border border-white/[0.08] space-y-2">
                    <label className="text-xs font-bold text-primary flex items-center justify-between">
                      <span>S — Situation</span>
                      <span className="text-[11px] text-textMuted font-normal">Context & Problem</span>
                    </label>
                    <p className="text-[11px] text-textSecondary italic">
                      {activeItem.behavioralQuestion.frameworkGuide.situation}
                    </p>
                    <textarea
                      rows={3}
                      value={starNotes[activeItem.behavioralQuestion.id]?.situation || ''}
                      onChange={(e) =>
                        updateStarField(activeItem.behavioralQuestion!.id, 'situation', e.target.value)
                      }
                      placeholder="Outline the business context, urgency, and background stakes..."
                      className="w-full p-2.5 rounded-lg bg-[#12161E] border border-white/[0.06] text-xs text-white placeholder-textMuted focus:outline-none focus:border-primary/50 resize-y"
                    />
                  </div>

                  {/* Task */}
                  <div className="p-4 rounded-xl bg-[#0E1217] border border-white/[0.08] space-y-2">
                    <label className="text-xs font-bold text-cyan-400 flex items-center justify-between">
                      <span>T — Task</span>
                      <span className="text-[11px] text-textMuted font-normal">Your Responsibility</span>
                    </label>
                    <p className="text-[11px] text-textSecondary italic">
                      {activeItem.behavioralQuestion.frameworkGuide.task}
                    </p>
                    <textarea
                      rows={3}
                      value={starNotes[activeItem.behavioralQuestion.id]?.task || ''}
                      onChange={(e) =>
                        updateStarField(activeItem.behavioralQuestion!.id, 'task', e.target.value)
                      }
                      placeholder="What was your specific charter, goal, or technical obstacle?"
                      className="w-full p-2.5 rounded-lg bg-[#12161E] border border-white/[0.06] text-xs text-white placeholder-textMuted focus:outline-none focus:border-cyan-400/50 resize-y"
                    />
                  </div>

                  {/* Action */}
                  <div className="p-4 rounded-xl bg-[#0E1217] border border-white/[0.08] space-y-2">
                    <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                      <span>A — Action</span>
                      <span className="text-[11px] text-textMuted font-normal">Concrete Engineering Steps</span>
                    </label>
                    <p className="text-[11px] text-textSecondary italic">
                      {activeItem.behavioralQuestion.frameworkGuide.action}
                    </p>
                    <textarea
                      rows={4}
                      value={starNotes[activeItem.behavioralQuestion.id]?.action || ''}
                      onChange={(e) =>
                        updateStarField(activeItem.behavioralQuestion!.id, 'action', e.target.value)
                      }
                      placeholder="Detail your decisions, technical trade-offs, and how you led or executed..."
                      className="w-full p-2.5 rounded-lg bg-[#12161E] border border-white/[0.06] text-xs text-white placeholder-textMuted focus:outline-none focus:border-emerald-400/50 resize-y"
                    />
                  </div>

                  {/* Result */}
                  <div className="p-4 rounded-xl bg-[#0E1217] border border-white/[0.08] space-y-2">
                    <label className="text-xs font-bold text-amber-400 flex items-center justify-between">
                      <span>R — Result</span>
                      <span className="text-[11px] text-textMuted font-normal">Impact & Metrics</span>
                    </label>
                    <p className="text-[11px] text-textSecondary italic">
                      {activeItem.behavioralQuestion.frameworkGuide.result}
                    </p>
                    <textarea
                      rows={4}
                      value={starNotes[activeItem.behavioralQuestion.id]?.result || ''}
                      onChange={(e) =>
                        updateStarField(activeItem.behavioralQuestion!.id, 'result', e.target.value)
                      }
                      placeholder="Quantify results: % latency reduction, zero regressions, team learnings..."
                      className="w-full p-2.5 rounded-lg bg-[#12161E] border border-white/[0.06] text-xs text-white placeholder-textMuted focus:outline-none focus:border-amber-400/50 resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Behavioral Rubric Checklist */}
              <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08] space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Delivery & Communication Self-Evaluation</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'succinct', label: 'Delivered initial high-level overview in under 60 seconds' },
                    { id: 'iVsWe', label: 'Focused on "I" (my direct contribution) without hiding behind "we"' },
                    { id: 'metrics', label: 'Quantified outcome with specific engineering or business metrics' },
                    { id: 'learning', label: 'Concluded with systemic lessons and how it informed future projects' },
                  ].map(({ id, label }) => {
                    const isChecked = !!behChecklist[activeItem.behavioralQuestion!.id]?.[id];
                    return (
                      <button
                        key={id}
                        onClick={() => toggleBehChecklist(activeItem.behavioralQuestion!.id, id)}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-medium'
                            : 'bg-[#12161E] border-white/[0.06] text-textSecondary hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-zinc-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-textSecondary">
              <p>No questions selected for this session.</p>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3 bg-[#0E1217] border-t border-white/[0.08] flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs text-textSecondary">
            <span>
              Question {activeIndex + 1} of {items.length}
            </span>
            {codingItemsCount > 0 && (
              <span className="text-textMuted">
                • Solved: {solvedInSession.size}/{codingItemsCount}
              </span>
            )}
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
            {activeIndex < items.length - 1 ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveIndex((prev) => Math.min(items.length - 1, prev + 1));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-purple-600 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinishSession}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit Interview</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scorecard Modal on Completion */}
      {isFinished && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-[#0E1217] border border-white/[0.1] rounded-2xl p-6 sm:p-7 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto text-primary">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-textSecondary">
                Simulation Completed
              </span>
              <h3 className="text-2xl font-bold text-white font-sans">
                {targetCompany} Mock Interview Scorecard
              </h3>
              <p className="text-xs text-textSecondary">
                Evaluation generated from testcase execution, problem solving, and rubric adherence.
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="py-4 bg-[#12161E] rounded-xl border border-white/[0.06] space-y-2">
              <div className="text-5xl font-black font-mono text-primary">
                {calculatedScore}%
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/[0.05]">
                {calculatedScore >= 85 ? (
                  <span className="text-emerald-400">Strong Hire</span>
                ) : calculatedScore >= 70 ? (
                  <span className="text-primary">Hire</span>
                ) : calculatedScore >= 50 ? (
                  <span className="text-amber-400">Lean Hire</span>
                ) : (
                  <span className="text-rose-400">Needs More Practice</span>
                )}
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-textMuted">Duration</p>
                <p className="font-bold text-white mt-0.5">
                  {Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60))}m
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-textMuted">Solved</p>
                <p className="font-bold text-white mt-0.5">
                  {solvedInSession.size}/{items.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-textMuted">Saved To</p>
                <p className="font-bold text-emerald-400 mt-0.5">
                  {isAuthenticated ? 'Cloud DB' : 'Local'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-primary hover:bg-purple-600 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              Return to Interview Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewModal;
