import React, { useState, useEffect, useRef } from 'react';
import { Question, UserProgressItem, ProblemStatus, Difficulty } from '../types';
import { QuestionSolution, SolutionApproach } from '../types/solution';
import {
  X, ExternalLink, Star, CheckCircle2, Clock, RotateCcw, Award, Circle,
  Timer as TimerIcon, Play, Pause, Code2, FileText, Calendar,
  Copy, Check, Sparkles, AlertCircle, Building2, Eye, Edit3, Terminal,
  Lightbulb, BookOpen, ArrowRight, ShieldAlert, Cpu, Palette, Tag, Plus, Zap,
  Lock, Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { CodeEditorRunner } from './CodeEditorRunner';
import { useAuth } from '../context/AuthContext';

interface QuestionDetailModalProps {
  question: Question;
  progress?: UserProgressItem;
  companyId: string;
  onClose: () => void;
  onSaveProgress: (patch: Partial<UserProgressItem>) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question: q,
  progress: initialProgress = { questionId: q.id, status: 'todo', isFavorite: false },
  companyId,
  onClose,
  onSaveProgress,
}) => {
  const { isPro, setShowSubscriptionModal } = useAuth();
  const [status, setStatus] = useState<ProblemStatus>(initialProgress.status || 'todo');
  const [isFavorite, setIsFavorite] = useState<boolean>(!!initialProgress.isFavorite);
  const [notes, setNotes] = useState<string>(initialProgress.notes || '');
  const [notesView, setNotesView] = useState<'edit' | 'preview'>('edit');
  const [tags, setTags] = useState<string[]>(initialProgress.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(initialProgress.confidence || 0);
  const [personalDiff, setPersonalDiff] = useState<Difficulty | undefined>(initialProgress.personalDifficulty);
  const [activeTab, setActiveTab] = useState<'notes' | 'solution' | 'code' | 'whiteboard' | 'runner' | 'companies'>('solution');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSolutionCode, setCopiedSolutionCode] = useState(false);

  // Multi-approach C++ Solution state
  const [solutionData, setSolutionData] = useState<QuestionSolution | null>(null);
  const [selectedApproachIndex, setSelectedApproachIndex] = useState<number>(0);
  const [isLoadingSolution, setIsLoadingSolution] = useState<boolean>(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  // Code scratchpad
  const [codeLang, setCodeLang] = useState<string>(initialProgress.codeSnippet?.lang || 'cpp');
  const [codeText, setCodeText] = useState<string>(initialProgress.codeSnippet?.code || '');

  // Built-in Timer
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState<number>(25);
  const [timerSeconds, setTimerSeconds] = useState<number>(initialProgress.timeSpentSeconds || 0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Fetch C++ solution JSON on-demand
  useEffect(() => {
    let isMounted = true;
    const loadSolution = async () => {
      try {
        setIsLoadingSolution(true);
        setSolutionError(null);
        const res = await fetch(`/solutions/${q.id}.json`);
        if (!res.ok) {
          throw new Error('Solution not available for this question yet.');
        }
        const data: QuestionSolution = await res.json();
        if (isMounted) {
          setSolutionData(data);
          // Default to the optimal approach if available, or the first one
          const optimalIdx = data.approaches.findIndex((a) => a.tag === 'Optimal');
          setSelectedApproachIndex(optimalIdx !== -1 ? optimalIdx : 0);
          setIsLoadingSolution(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setSolutionError(err instanceof Error ? err.message : 'Error loading solution');
          setIsLoadingSolution(false);
        }
      }
    };

    loadSolution();
    return () => {
      isMounted = false;
    };
  }, [q.id]);

  // Auto-save debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      onSaveProgress({
        status,
        isFavorite,
        notes,
        confidence,
        personalDifficulty: personalDiff,
        codeSnippet: { lang: codeLang, code: codeText },
        timeSpentSeconds: timerSeconds,
        tags,
      });
    }, 350);
    return () => clearTimeout(handler);
  }, [status, isFavorite, notes, confidence, personalDiff, codeLang, codeText, timerSeconds, tags]);

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if ('preventDefault' in e) e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      sounds.playClick();
      setTags((prev) => [...prev, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    sounds.playClick();
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Timer Tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === 'countdown') {
            if (prev <= 1) {
              setIsTimerRunning(false);
              sounds.playTimerAlert();
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerMode]);

  // Format seconds to mm:ss
  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSetStatus = (newStatus: ProblemStatus) => {
    setStatus(newStatus);
    if (newStatus === 'solved' || newStatus === 'mastered') {
      sounds.playSuccess();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#FFFF00', '#FFF94D', '#B8B800'],
      });
      onSaveProgress({
        status: newStatus,
        lastSolvedAt: new Date().toISOString(),
        solveCount: (initialProgress.solveCount || 0) + 1,
      });
    } else {
      sounds.playClick();
      onSaveProgress({ status: newStatus });
    }
  };

  const handleScheduleReview = (days: number) => {
    sounds.playClick();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    onSaveProgress({
      nextReviewAt: targetDate.toISOString(),
      reviewIntervalDays: days,
      status: 'review',
    });
    setStatus('review');
  };

  const handleCopyCode = () => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopySolutionCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSolutionCode(true);
    setTimeout(() => setCopiedSolutionCode(false), 2000);
  };

  const handleSendToScratchpad = (cppCode: string) => {
    sounds.playClick();
    setCodeLang('cpp');
    setCodeText(cppCode);
    setActiveTab('code');
  };

  const handleInsertStarter = () => {
    sounds.playClick();
    const starters: Record<string, string> = {
      cpp: `// C++ Solution template for: ${q.title}\n#include <vector>\n#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Time: O(N), Space: O(1)\n    }\n};\n`,
      python: `# Definition and solution template for: ${q.title}\nclass Solution:\n    def solve(self, *args):\n        # Time: O(N), Space: O(1)\n        pass\n`,
      java: `// Solution template for: ${q.title}\nclass Solution {\n    public void solve() {\n        // Time: O(N), Space: O(1)\n    }\n}\n`,
      javascript: `/**\n * Solution template for: ${q.title}\n * Time: O(N), Space: O(1)\n */\nvar solve = function() {\n    \n};\n`,
    };
    setCodeText(starters[codeLang] || starters.cpp);
  };

  // Intercept Tab inside Code Editor
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      setCodeText(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Companies that ask this question
  const askingCompanies = Object.keys(q.companies);

  // Simple clean markdown parser for notes preview
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return <p className="text-slate-500 italic">No notes written yet. Switch to Edit to jot down intuition and complexities.</p>;
    }
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i}>{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i}>{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i}>{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc">{line.replace(/^[-*•]\s*/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i}>{line}</p>;
    });
  };

  const currentApproach: SolutionApproach | undefined = solutionData?.approaches[selectedApproachIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-surfaceElevated border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/90 bg-surface/60 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-textMuted">#{q.id}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  q.difficulty === 'Easy'
                    ? 'bg-easy/15 text-easy border border-easy/40'
                    : q.difficulty === 'Medium'
                    ? 'bg-medium/15 text-medium border border-medium/40'
                    : 'bg-hard/15 text-hard border border-hard/40'
                }`}
              >
                {q.difficulty}
              </span>
              <span className="text-xs font-mono text-textMuted">Acceptance: {q.acceptance}</span>

              {q.isBlind75 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/20 text-primary border border-borderActive/40">
                  Blind 75
                </span>
              )}
              {q.isGrind169 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surfaceElevated text-primary border border-border">
                  Grind 169
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {q.title}
            </h2>

            {/* Topic Badges */}
            <div className="flex flex-wrap gap-1 mt-0.5">
              {q.topics.map((t) => (
                <span key={t} className="px-2 py-0.5 text-[11px] rounded-md bg-surfaceElevated text-textSecondary border border-border/50 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Top Actions: Star, Open LeetCode, Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playClick();
                setIsFavorite(!isFavorite);
                onSaveProgress({ isFavorite: !isFavorite });
              }}
              className={`p-2 rounded-xl border border-border transition-colors ${
                isFavorite ? 'bg-primary/15 text-primary border-primary/40' : 'bg-slate-850 text-textMuted hover:text-textPrimary'
              }`}
              title={isFavorite ? 'Remove bookmark' : 'Bookmark question'}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>

            <a
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/15 hover:bg-primary/15 text-primary border border-primary/40 text-xs font-semibold transition-colors"
            >
              <span>Solve on LeetCode</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surfaceElevated/80 hover:bg-slate-700 text-textMuted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status & Self Assessment Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface/40 border border-border/80">
            {/* Status Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Status</label>
              <div className="flex flex-wrap gap-1">
                {(['todo', 'in-progress', 'solved', 'review', 'mastered'] as ProblemStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleSetStatus(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-all ${
                      status === st
                        ? st === 'solved'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : st === 'mastered'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : st === 'in-progress'
                          ? 'bg-primary text-white font-bold shadow-sm'
                          : st === 'review'
                          ? 'bg-medium text-white font-bold shadow-sm'
                          : 'bg-slate-700 text-white font-bold'
                        : 'bg-slate-850 text-textMuted hover:text-textPrimary'
                    }`}
                  >
                    {st.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Rating (1-5 stars) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">Confidence</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      sounds.playClick();
                      const val = confidence === star ? 0 : star;
                      setConfidence(val);
                      onSaveProgress({ confidence: val });
                    }}
                    className="p-1 hover:scale-110 transition-transform"
                    title={`${star} star confidence`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= confidence
                          ? 'text-primary fill-primary'
                          : 'text-slate-600 hover:text-textMuted'
                      }`}
                    />
                  </button>
                ))}
                {confidence > 0 && (
                  <span className="text-xs font-mono text-textMuted ml-1">({confidence}/5)</span>
                )}
              </div>
            </div>

            {/* Built-in Interview Timer */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-1">
                  <TimerIcon className="w-3.5 h-3.5 text-primary" />
                  Interview Timer
                </label>
                <button
                  onClick={() => {
                    const nextMode = timerMode === 'stopwatch' ? 'countdown' : 'stopwatch';
                    setTimerMode(nextMode);
                    if (nextMode === 'countdown') {
                      setTimerSeconds(countdownMinutes * 60);
                    } else {
                      setTimerSeconds(0);
                    }
                    setIsTimerRunning(false);
                  }}
                  className="text-[10px] text-primary hover:underline"
                >
                  {timerMode === 'stopwatch' ? 'Switch to Countdown' : 'Switch to Stopwatch'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="font-mono text-base font-bold text-textPrimary bg-surfaceElevated px-3 py-1 rounded-lg border border-border">
                  {formatTime(timerSeconds)}
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsTimerRunning(!isTimerRunning);
                  }}
                  className={`p-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-colors ${
                    isTimerRunning
                      ? 'bg-hard/15 text-hard border border-hard/40'
                      : 'bg-primary text-black font-bold hover:bg-primary'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isTimerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(timerMode === 'countdown' ? countdownMinutes * 60 : 0);
                  }}
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-textMuted hover:text-white"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Spaced Repetition (SRS) Quick Scheduler */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surfaceElevated border border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-semibold text-textPrimary">Spaced Repetition Review</span>
                {initialProgress.nextReviewAt ? (
                  <p className="text-[11px] text-primary">
                    Next due: {new Date(initialProgress.nextReviewAt).toLocaleDateString()} (every {initialProgress.reviewIntervalDays || 1}d)
                  </p>
                ) : (
                  <p className="text-[11px] text-textMuted">Schedule periodic revision to retain intuition</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleScheduleReview(1)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surfaceElevated hover:bg-primary text-textSecondary hover:text-white transition-colors"
              >
                Tomorrow (+1d)
              </button>
              <button
                onClick={() => handleScheduleReview(3)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surfaceElevated hover:bg-primary text-textSecondary hover:text-white transition-colors"
              >
                In 3 Days (+3d)
              </button>
              <button
                onClick={() => handleScheduleReview(7)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surfaceElevated hover:bg-primary text-textSecondary hover:text-white transition-colors"
              >
                In 1 Week (+7d)
              </button>
              <button
                onClick={() => handleScheduleReview(30)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surfaceElevated hover:bg-primary text-textSecondary hover:text-white transition-colors"
              >
                In 1 Month (+30d)
              </button>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <div className="border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('solution')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'solution'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textMuted hover:text-textPrimary'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                <span>C++ Solutions & Theory</span>
                {solutionData && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-primary/20 text-primary rounded font-mono">
                    {solutionData.approaches.length} ways
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'notes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textMuted hover:text-textPrimary'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Intuition & Notes
              </button>
              <button
                onClick={() => setActiveTab('runner')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'runner'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textMuted hover:text-textPrimary'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Editor & Runner</span>
              </button>
              <button
                onClick={() => {
                  if (!isPro) {
                    sounds.playTimerAlert();
                    setShowSubscriptionModal(true);
                    return;
                  }
                  setActiveTab('whiteboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'whiteboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textMuted hover:text-textPrimary'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span>Whiteboard Canvas</span>
                {!isPro && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Lock className="w-2.5 h-2.5" />
                    PRO
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('companies')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'companies'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textMuted hover:text-textPrimary'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Company Breakdown ({askingCompanies.length})
              </button>
            </div>

            {activeTab === 'notes' && (
              <div className="flex items-center bg-surfaceElevated/80 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setNotesView('edit')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    notesView === 'edit' ? 'bg-primary text-black font-bold' : 'text-textMuted hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => setNotesView('preview')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    notesView === 'preview' ? 'bg-primary text-black font-bold' : 'text-textMuted hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            )}
          </div>

          {/* TAB CONTENT: C++ MULTI-APPROACH SOLUTIONS & THEORY */}
          {activeTab === 'solution' && (
            <div className="space-y-4">
              {isLoadingSolution ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-textMuted">
                  <div className="w-7 h-7 border-2 border-borderActive border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Loading C++ solutions and theory...</span>
                </div>
              ) : solutionError || !solutionData ? (
                <div className="p-4 rounded-xl bg-surface/60 border border-border text-textMuted text-center py-8">
                  <Lightbulb className="w-8 h-8 mx-auto text-primary mb-2 opacity-60" />
                  <p className="text-sm font-medium text-textPrimary">Generating C++ solutions guide...</p>
                  <p className="text-xs text-textMuted mt-1">Please try refreshing or select another question.</p>
                </div>
              ) : (
                <>
                  {/* Core Pattern & Approach Switcher Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface/60 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/20 text-primary border border-borderActive/40">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-textMuted tracking-wider">Core Pattern</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{solutionData.corePattern}</h4>
                      </div>
                    </div>

                    {/* Approach Switcher Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {solutionData.approaches.map((app, idx) => {
                        const isSelected = idx === selectedApproachIndex;
                        return (
                          <button
                            key={app.id}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedApproachIndex(idx);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                              isSelected
                                ? 'bg-primary text-black font-bold shadow-md border border-primary'
                                : 'bg-slate-850 text-textMuted hover:text-textPrimary hover:bg-border border border-border/40'
                            }`}
                          >
                            <span>{app.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                app.tag === 'Optimal'
                                  ? 'bg-primary/15 text-primary'
                                  : app.tag === 'Better'
                                  ? 'bg-surfaceElevated text-primaryDim'
                                  : 'bg-slate-700 text-textSecondary'
                              }`}
                            >
                              {app.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {currentApproach && (
                    <div className="space-y-4">
                      {/* Theory & Intuition Panel */}
                      <div className="p-4 rounded-xl bg-surface/40 border border-border space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            Intuition & How to Think About It
                          </h4>
                          <p className="text-xs sm:text-sm text-textPrimary leading-relaxed">
                            {currentApproach.intuition}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-border/80">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Algorithmic Theory & Invariant Proof
                          </h4>
                          <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                            {currentApproach.theory}
                          </p>
                        </div>
                      </div>

                      {/* Complexity Analysis Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-surface/40 border border-border flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-textMuted font-semibold uppercase">Time Complexity</span>
                            <span className="font-mono text-sm font-bold text-primary bg-primary/15 px-2 py-0.5 rounded border border-primary/30">
                              {currentApproach.timeComplexity.complexity}
                            </span>
                          </div>
                          <p className="text-xs text-textSecondary">{currentApproach.timeComplexity.explanation}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-surface/40 border border-border flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-textMuted font-semibold uppercase">Space Complexity</span>
                            <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-borderActive/30">
                              {currentApproach.spaceComplexity.complexity}
                            </span>
                          </div>
                          <p className="text-xs text-textSecondary">{currentApproach.spaceComplexity.explanation}</p>
                        </div>
                      </div>

                      {/* C++ Code Implementation */}
                      <div className="rounded-2xl border border-border overflow-hidden bg-surface/90 shadow-xl">
                        <div className="p-3 bg-surface/90 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-primary">C++ (Google Style)</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-textMuted truncate">{currentApproach.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSendToScratchpad(currentApproach.cppCode)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/30 hover:bg-primary/50 border border-borderActive/40 text-xs font-mono text-primary hover:text-white transition-colors"
                              title="Send this code into your interactive Scratchpad"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                              Send to Scratchpad
                            </button>

                            <button
                              onClick={() => handleCopySolutionCode(currentApproach.cppCode)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated hover:bg-slate-700 text-xs font-mono text-textSecondary transition-colors"
                            >
                              {copiedSolutionCode ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedSolutionCode ? 'Copied' : 'Copy C++'}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 overflow-x-auto text-xs font-mono text-primary leading-relaxed bg-background">
                          <pre>{currentApproach.cppCode}</pre>
                        </div>
                      </div>

                      {/* Dry Run Example Trace (if available) */}
                      {currentApproach.dryRunExample && (
                        <div className="p-4 rounded-xl bg-surface/40 border border-border space-y-2">
                          <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                            🔍 Step-by-Step Example Walkthrough
                          </h4>
                          <div className="text-xs font-mono text-primary bg-surfaceElevated/80 p-2 rounded-lg border border-border">
                            Input: {currentApproach.dryRunExample.input}
                          </div>
                          <ul className="space-y-1 text-xs text-textSecondary">
                            {currentApproach.dryRunExample.steps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary shrink-0 font-mono">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="text-xs font-mono text-primary bg-surfaceElevated/80 p-2 rounded-lg border border-border">
                            Expected Output: {currentApproach.dryRunExample.output}
                          </div>
                        </div>
                      )}

                      {/* Edge Cases & C++ Traps */}
                      {currentApproach.edgeCases && currentApproach.edgeCases.length > 0 && (
                        <div className="p-4 rounded-xl bg-surface/40 border border-border space-y-2">
                          <h4 className="text-xs font-bold text-hard uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Edge Cases & C++ Interview Traps
                          </h4>
                          <ul className="space-y-1 text-xs text-textSecondary">
                            {currentApproach.edgeCases.map((ec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-hard shrink-0 font-mono">⚠️</span>
                                <span>{ec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Interview Tips */}
                      {solutionData.interviewTips && (
                        <div className="p-3.5 rounded-xl bg-surfaceElevated border border-border text-xs text-primary space-y-1">
                          <span className="font-bold text-white uppercase tracking-wider">🗣️ Interviewer Discussion Advice</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-textSecondary">
                            {solutionData.interviewTips.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB CONTENT 2: PERSONAL NOTES EDITOR */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Custom Tags Bar */}
              <div className="p-3 rounded-xl bg-surface/60 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-textMuted">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    Personal Tags
                  </span>
                  <span className="text-[11px] text-slate-500">e.g. revisit, dp-pattern, tricky-pointers</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated text-primary border border-borderActive/30 text-xs font-mono"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-primary hover:text-hard p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="+ Add tag (Enter)"
                      className="px-2.5 py-1 bg-surfaceElevated border border-border/60 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-borderActive"
                    />
                    {tagInput.trim() && (
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="p-1 rounded-lg bg-primary hover:bg-primary text-white text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {notesView === 'edit' ? (
                <>
                  <div className="flex items-center justify-between text-xs text-textMuted">
                    <span>Markdown supported (# Header, - bullet, `code`, Time/Space O(N))</span>
                    <span className="text-[11px] text-slate-500">Auto-saves continuously</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="💡 Write your notes here...&#10;• Approach: Two pointer with left/right initialized at bounds&#10;• Time Complexity: O(N)&#10;• Space Complexity: O(1)&#10;• Trap / Gotchas: Handle duplicate elements properly"
                    rows={8}
                    className="w-full p-3.5 rounded-xl bg-surface/80 border border-border text-textPrimary placeholder-slate-500 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary resize-y"
                  />
                </>
              ) : (
                <div className="p-4 rounded-xl bg-surface/70 border border-border min-h-[180px] notes-preview text-sm text-textSecondary">
                  {renderMarkdown(notes)}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 3: CODE SCRATCHPAD */}
          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  {['cpp', 'python', 'java', 'javascript'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg uppercase ${
                        codeLang === lang
                          ? 'bg-primary text-black font-bold'
                          : 'bg-surfaceElevated text-textMuted hover:text-textPrimary'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInsertStarter}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated hover:bg-slate-700 text-xs text-primary transition-colors"
                    title="Insert boilerplate solution signature"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Starter Template
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated hover:bg-slate-700 text-xs font-mono text-textSecondary transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>

              <textarea
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                placeholder={`// Optimal Solution in ${codeLang.toUpperCase()} (Press Tab to indent)\nclass Solution {\n    // Solution code...\n}`}
                rows={10}
                className="w-full p-3.5 rounded-xl bg-surface/90 border border-border text-primary placeholder-slate-600 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary resize-y leading-relaxed"
              />
            </div>
          )}

          {/* TAB CONTENT: WHITEBOARD CANVAS */}
          {activeTab === 'whiteboard' && (
            <div className="space-y-2">
              {isPro ? (
                <WhiteboardCanvas questionId={q.id} height={380} isActive={true} />
              ) : (
                <div className="p-8 rounded-2xl bg-surfaceElevated border border-border text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 mb-1">
                      <Lock className="w-3 h-3" />
                      PRO FEATURE
                    </div>
                    <h3 className="text-sm font-bold text-white">Whiteboard Diagram Canvas</h3>
                    <p className="text-xs text-textMuted max-w-sm mx-auto">
                      Diagram data structures, trace recursion trees, and sketch solutions directly alongside the problem with CheatCode Pro.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowSubscriptionModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Unlock with Pro</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: IN-BROWSER CODE EDITOR & RUNNER */}
          {activeTab === 'runner' && (
            <div className="h-[520px]">
              <CodeEditorRunner
                question={q}
                currentApproach={currentApproach}
                onSolved={() => handleSetStatus('solved')}
                onSendToNotes={(codeSnippet) => {
                  setNotes((prev) => prev + '\n\n```\n' + codeSnippet + '\n```');
                  setActiveTab('notes');
                  sounds.playSuccess();
                }}
              />
            </div>
          )}

          {/* TAB CONTENT 4: COMPANIES BREAKDOWN */}
          {activeTab === 'companies' && (
            <div className="space-y-3">
              <p className="text-xs text-textMuted">
                This question has been asked by <strong className="text-white">{askingCompanies.length}</strong> companies in recent interview rounds:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                {askingCompanies.map((c) => {
                  const freq = q.companies[c]?.all || q.companies[c]?.['thirty-days'] || 'Asked';
                  const isCurrent = c === companyId;
                  return (
                    <div
                      key={c}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                        isCurrent
                          ? 'bg-surfaceElevated border-borderActive/40 text-primary font-bold'
                          : 'bg-slate-850/50 border-border text-textSecondary'
                      }`}
                    >
                      <span className="capitalize truncate mr-1">{c.replace('-', ' ')}</span>
                      <span className="font-mono text-[10px] text-textMuted">{freq}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface/70 flex items-center justify-between px-5">
          <span className="text-xs text-slate-500">
            Last revised: {initialProgress.lastSolvedAt ? new Date(initialProgress.lastSolvedAt).toLocaleDateString() : 'Not yet solved'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
