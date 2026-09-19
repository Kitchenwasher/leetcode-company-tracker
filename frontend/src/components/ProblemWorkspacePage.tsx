import React, { useState, useEffect, useRef } from 'react';
import { Question, UserProgressItem, ProblemStatus, Difficulty } from '../types';
import { QuestionSolution, SolutionApproach } from '../types/solution';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { CppPlayground } from './CppPlayground';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Star, CheckCircle2,
  Clock, RotateCcw, Award, Circle, Code2, FileText, Calendar, Copy, Check,
  Sparkles, Building2, Terminal, Lightbulb, ShieldAlert, Tag, Plus, Zap,
  Palette, Play, Pause, RefreshCw, Send, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';

interface ProblemWorkspacePageProps {
  question: Question;
  allQuestions: Question[];
  progress?: UserProgressItem;
  companyId: string;
  onBack: () => void;
  onNavigateToProblem: (questionId: number | string) => void;
  onSaveProgress: (patch: Partial<UserProgressItem>) => void;
}

export const ProblemWorkspacePage: React.FC<ProblemWorkspacePageProps> = ({
  question: q,
  allQuestions,
  progress: initialProgress = { questionId: q.id, status: 'todo', isFavorite: false },
  companyId,
  onBack,
  onNavigateToProblem,
  onSaveProgress,
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ProblemStatus>(initialProgress.status || 'todo');
  const [isFavorite, setIsFavorite] = useState<boolean>(!!initialProgress.isFavorite);
  const [notes, setNotes] = useState<string>(initialProgress.notes || '');
  const [notesView, setNotesView] = useState<'edit' | 'preview'>('edit');
  const [tags, setTags] = useState<string[]>(initialProgress.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(initialProgress.confidence || 0);
  const [personalDiff, setPersonalDiff] = useState<Difficulty | undefined>(initialProgress.personalDifficulty);

  // Left & Right Tabs
  const [leftTab, setLeftTab] = useState<'theory' | 'notes' | 'srs' | 'companies'>('theory');
  const [rightTab, setRightTab] = useState<'runner' | 'whiteboard' | 'scratchpad'>('runner');

  // Solution data
  const [solutionData, setSolutionData] = useState<QuestionSolution | null>(null);
  const [selectedApproachIndex, setSelectedApproachIndex] = useState<number>(0);
  const [isLoadingSolution, setIsLoadingSolution] = useState<boolean>(false);
  const [copiedSolutionCode, setCopiedSolutionCode] = useState<boolean>(false);

  // Scratchpad state
  const [codeLang, setCodeLang] = useState<string>(initialProgress.codeSnippet?.lang || 'cpp');
  const [codeText, setCodeText] = useState<string>(initialProgress.codeSnippet?.code || '');
  const [copiedScratchpadCode, setCopiedScratchpadCode] = useState<boolean>(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(initialProgress.timeSpentSeconds || 0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Find index in company's questions list for prev/next navigation
  const currentIndex = allQuestions.findIndex((item) => String(item.id) === String(q.id));
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
  const nextQuestion = currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null;

  // Load C++ multi-approach solutions
  useEffect(() => {
    let isMounted = true;
    const loadSolution = async () => {
      try {
        setIsLoadingSolution(true);
        const res = await fetch(`/solutions/${q.id}.json`);
        if (!res.ok) throw new Error('Solution not available');
        const data: QuestionSolution = await res.json();
        if (isMounted) {
          setSolutionData(data);
          const optimalIdx = data.approaches.findIndex((a) => a.tag === 'Optimal');
          setSelectedApproachIndex(optimalIdx !== -1 ? optimalIdx : 0);
          setIsLoadingSolution(false);
        }
      } catch {
        if (isMounted) {
          setSolutionData(null);
          setIsLoadingSolution(false);
        }
      }
    };
    loadSolution();
    return () => {
      isMounted = false;
    };
  }, [q.id]);

  // Sync state when question changes
  useEffect(() => {
    setStatus(initialProgress.status || 'todo');
    setIsFavorite(!!initialProgress.isFavorite);
    setNotes(initialProgress.notes || '');
    setTags(initialProgress.tags || []);
    setConfidence(initialProgress.confidence || 0);
    setPersonalDiff(initialProgress.personalDifficulty);
    setCodeText(initialProgress.codeSnippet?.code || '');
    setTimerSeconds(initialProgress.timeSpentSeconds || 0);
  }, [q.id]);

  // Auto-save changes
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

  // Timer Tick
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

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
        particleCount: 70,
        spread: 70,
        origin: { y: 0.3 },
      });
    } else {
      sounds.playClick();
    }
    onSaveProgress({ status: newStatus });
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

  const copyToClipboard = (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    } catch (e) {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    } catch (e) {
      // Ignored in restricted headless environments
    }
  };

  const handleCopySolutionCode = (code: string) => {
    copyToClipboard(code);
    setCopiedSolutionCode(true);
    sounds.playClick();
    setTimeout(() => setCopiedSolutionCode(false), 2000);
  };

  const handleCopyScratchpadCode = () => {
    if (!codeText) return;
    copyToClipboard(codeText);
    setCopiedScratchpadCode(true);
    sounds.playClick();
    setTimeout(() => setCopiedScratchpadCode(false), 2000);
  };

  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return (
        <p className="text-slate-500 italic text-xs">
          No notes recorded yet. Write your personal invariants, edge cases, or trade-offs here.
        </p>
      );
    }
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-base font-bold text-white mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-indigo-300 mb-1.5">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-semibold text-amber-300 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc text-xs text-slate-300 leading-relaxed">{line.replace(/^[-*]\s*/, '')}</li>;
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-xs text-slate-300 leading-relaxed">{line}</p>;
    });
  };

  const currentApproach: SolutionApproach | undefined = solutionData?.approaches[selectedApproachIndex];
  const askingCompanies = Object.keys(q.companies);
  const companyFreq = q.companies[companyId]?.all || q.companies[companyId]?.['thirty-days'] || 'Asked';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080d1a] text-slate-100 overflow-hidden select-none">
      {/* ========================================================= */}
      {/* TOP CONTROL BAR (LeetCode Style Header)                  */}
      {/* ========================================================= */}
      <header className="h-14 bg-slate-950 border-b border-slate-800/90 px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Back Button & Problem Info & Prev/Next */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Back to Questions List"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problem List</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Prev / Next Problem Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevQuestion && onNavigateToProblem(prevQuestion.id)}
              disabled={!prevQuestion}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={prevQuestion ? `Previous: #${prevQuestion.id} ${prevQuestion.title}` : 'First Question'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextQuestion && onNavigateToProblem(nextQuestion.id)}
              disabled={!nextQuestion}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={nextQuestion ? `Next: #${nextQuestion.id} ${nextQuestion.title}` : 'Last Question'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Problem Title & ID & Difficulty */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-mono text-xs font-extrabold text-indigo-400 shrink-0">
              #{q.id}
            </span>
            <h1 className="text-sm font-extrabold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {q.title}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                q.difficulty === 'Easy'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : q.difficulty === 'Medium'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {q.difficulty}
            </span>

            <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-mono">
              {companyFreq}
            </span>
          </div>
        </div>

        {/* Right: Status Selector, Timer, Solve on LC, Star, Actions */}
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            {(['todo', 'in-progress', 'solved', 'review', 'mastered'] as ProblemStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleSetStatus(st)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all ${
                  status === st
                    ? st === 'solved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'mastered'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : st === 'in-progress'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : st === 'review'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Stopwatch Timer */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTime(timerSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-white"
              title={isTimerRunning ? 'Pause timer' : 'Start stopwatch'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            </button>
          </div>

          {/* Favorite Star */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsFavorite(!isFavorite);
              onSaveProgress({ isFavorite: !isFavorite });
            }}
            className={`p-2 rounded-xl border border-slate-800 transition-colors ${
              isFavorite ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
            title={isFavorite ? 'Remove bookmark' : 'Bookmark question'}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* External LeetCode Button */}
          <a
            href={q.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <span className="hidden sm:inline">LeetCode</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 50 / 50 DUAL-PANE BODY WORKSPACE                         */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT PANE (50%): Editorial, Multi-Approach Theory & Notes */}
        {/* ========================================================= */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-slate-800/80 bg-slate-950/60 overflow-hidden">
          {/* Left Pane Navigation Header */}
          <div className="h-10 border-b border-slate-800 bg-slate-900/90 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setLeftTab('theory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'theory' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>C++ Solutions & Theory</span>
                {solutionData && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-mono">
                    {solutionData.approaches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLeftTab('notes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'notes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes & Tags</span>
                {tags.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {tags.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLeftTab('srs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'srs' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spaced Repetition</span>
              </button>

              <button
                onClick={() => setLeftTab('companies')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'companies' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Companies ({askingCompanies.length})</span>
              </button>
            </div>
          </div>

          {/* Left Pane Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* TAB 1: C++ MULTI-APPROACH SOLUTIONS & THEORY */}
            {leftTab === 'theory' && (
              <div className="space-y-5">
                {/* Core Pattern Pill */}
                {solutionData && (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-300">
                        Pattern: {solutionData.corePattern}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Google C++ Style Guide Compliant
                    </span>
                  </div>
                )}

                {/* Approach Switcher Buttons */}
                {solutionData && solutionData.approaches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {solutionData.approaches.map((app, idx) => (
                      <button
                        key={app.id || idx}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedApproachIndex(idx);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                          selectedApproachIndex === idx
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{app.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            app.tag === 'Optimal'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : app.tag === 'Better'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {app.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Approach Deep Dive */}
                {currentApproach && (
                  <div className="space-y-4">
                    {/* Complexity Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Time Complexity
                        </span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {currentApproach.timeComplexity.complexity}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {currentApproach.timeComplexity.explanation}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Space Complexity
                        </span>
                        <span className="font-mono text-sm font-bold text-indigo-400">
                          {currentApproach.spaceComplexity.complexity}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {currentApproach.spaceComplexity.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Intuition & Theory */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Intuition & Invariant Proof
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentApproach.intuition}
                      </p>
                      {currentApproach.theory && (
                        <div className="pt-2 border-t border-slate-800 text-xs text-indigo-300 leading-relaxed">
                          <strong>Theoretical Justification: </strong>
                          {currentApproach.theory}
                        </div>
                      )}
                    </div>

                    {/* C++ Code Display */}
                    <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                          Production C++ Implementation
                        </span>
                        <button
                          onClick={() => handleCopySolutionCode(currentApproach.cppCode)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          {copiedSolutionCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSolutionCode ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-72">
                        <code>{currentApproach.cppCode}</code>
                      </pre>
                    </div>

                    {/* Step-by-Step Example Walkthrough */}
                    {currentApproach.dryRunExample && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          🔍 Step-by-Step Dry Run Example
                        </h4>
                        <div className="text-xs font-mono text-indigo-300 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          Input: {currentApproach.dryRunExample.input}
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {currentApproach.dryRunExample.steps.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-400 shrink-0 font-mono">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-xs font-mono text-emerald-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                          Expected Output: {currentApproach.dryRunExample.output}
                        </div>
                      </div>
                    )}

                    {/* Edge Cases & Traps */}
                    {currentApproach.edgeCases && currentApproach.edgeCases.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Edge Cases & Interview Traps
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {currentApproach.edgeCases.map((ec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-400 shrink-0 font-mono">⚠️</span>
                              <span>{ec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PERSONAL NOTES & TAGS */}
            {leftTab === 'notes' && (
              <div className="space-y-4">
                {/* Custom Tags Bar */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5 text-indigo-300">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      Personal Tags
                    </span>
                    <span className="text-[11px] text-slate-500">e.g. revisit, dp-pattern, tricky-pointers</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 text-xs font-mono"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-indigo-400 hover:text-rose-400 p-0.5 cursor-pointer"
                        >
                          ✕
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
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                      />
                      {tagInput.trim() && (
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Markdown Notes Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNotesView('edit')}
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          notesView === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Edit Markdown
                      </button>
                      <button
                        onClick={() => setNotesView('preview')}
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          notesView === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Preview Formatted
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500">Auto-saves continuously</span>
                  </div>

                  {notesView === 'edit' ? (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="💡 Write your notes here...&#10;• Approach: Two pointer with left/right initialized at bounds&#10;• Time Complexity: O(N)&#10;• Space Complexity: O(1)&#10;• Trap / Gotchas: Handle duplicate elements properly"
                      rows={14}
                      className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y leading-relaxed"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 min-h-[280px] notes-preview space-y-2">
                      {renderMarkdown(notes)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SPACED REPETITION (SRS) */}
            {leftTab === 'srs' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Spaced Repetition Review Schedule
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Retain algorithmic problem-solving intuition through mathematically scheduled intervals.
                  </p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                    {initialProgress.nextReviewAt ? (
                      <span className="text-indigo-300">
                        Next Due: <strong>{new Date(initialProgress.nextReviewAt).toLocaleDateString()}</strong> (Interval: {initialProgress.reviewIntervalDays || 1} days)
                      </span>
                    ) : (
                      <span className="text-slate-500">No review scheduled yet.</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => handleScheduleReview(1)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
                    >
                      Tomorrow (+1d)
                    </button>
                    <button
                      onClick={() => handleScheduleReview(3)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
                    >
                      In 3 Days (+3d)
                    </button>
                    <button
                      onClick={() => handleScheduleReview(7)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
                    >
                      In 1 Week (+7d)
                    </button>
                    <button
                      onClick={() => handleScheduleReview(30)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors"
                    >
                      In 1 Month (+30d)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COMPANY BREAKDOWN */}
            {leftTab === 'companies' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  This question has been asked by <strong className="text-white">{askingCompanies.length}</strong> companies in recent interview rounds:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-1">
                  {askingCompanies.map((c) => {
                    const freq = q.companies[c]?.all || q.companies[c]?.['thirty-days'] || 'Asked';
                    const isCurrent = c === companyId;
                    return (
                      <div
                        key={c}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isCurrent
                            ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="capitalize truncate mr-1">{c.replace('-', ' ')}</span>
                        <span className="font-mono text-[10px] text-slate-400">{freq}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE (50%): In-Browser IDE Runner & Whiteboard     */}
        {/* ========================================================= */}
        <div className="w-full md:w-1/2 flex flex-col bg-[#060913] overflow-hidden">
          {/* Right Pane Navigation Header */}
          <div className="h-10 border-b border-slate-800 bg-slate-900/90 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightTab('runner')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rightTab === 'runner' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>C++ Runner Sandbox</span>
              </button>

              <button
                onClick={() => setRightTab('whiteboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rightTab === 'whiteboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <span>Whiteboard Canvas</span>
              </button>

              <button
                onClick={() => setRightTab('scratchpad')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rightTab === 'scratchpad' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Scratchpad</span>
              </button>
            </div>
          </div>

          {/* Right Pane Active Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'runner' && (
              <CppPlayground
                initialCode={currentApproach?.cppCode || codeText || undefined}
                questionTitle={q.title}
                onSendToNotes={(code) => {
                  setNotes((prev) => prev + '\n\n```cpp\n' + code + '\n```');
                  setLeftTab('notes');
                  sounds.playSuccess();
                }}
              />
            )}

            {rightTab === 'whiteboard' && (
              <div className="h-full">
                <WhiteboardCanvas questionId={q.id} height={560} />
              </div>
            )}

            {rightTab === 'scratchpad' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {['cpp', 'python', 'java', 'javascript'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg uppercase ${
                          codeLang === lang
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyScratchpadCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
                  >
                    {copiedScratchpadCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScratchpadCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <textarea
                  value={codeText}
                  onChange={(e) => setCodeText(e.target.value)}
                  placeholder={`// Scratchpad in ${codeLang.toUpperCase()}\nclass Solution {\n    // Type code here...\n}`}
                  rows={20}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 placeholder-slate-600 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
