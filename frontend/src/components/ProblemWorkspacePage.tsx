import React, { useState, useEffect, useRef } from 'react';
import { Question, UserProgressItem, ProblemStatus, Difficulty } from '../types';
import { QuestionSolution, SolutionApproach } from '../types/solution';
import { questionsApi } from '../api/questionsApi';
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

  // Solution data & Multi-Language support
  const [solutionData, setSolutionData] = useState<QuestionSolution | null>(null);
  const [selectedApproachIndex, setSelectedApproachIndex] = useState<number>(0);
  const [isLoadingSolution, setIsLoadingSolution] = useState<boolean>(false);
  const [copiedSolutionCode, setCopiedSolutionCode] = useState<boolean>(false);
  const [solutionLanguage, setSolutionLanguage] = useState<'python' | 'cpp' | 'java'>(() => {
    return (localStorage.getItem('cheatcode_preferred_lang') as 'python' | 'cpp' | 'java') || 'python';
  });
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

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

  // Load multi-approach solutions with automatic AI fallback
  useEffect(() => {
    let isMounted = true;
    const loadSolution = async () => {
      try {
        setIsLoadingSolution(true);
        let data: QuestionSolution | null = null;

        // 1. Try pre-baked static solution
        try {
          const res = await fetch(`/solutions/${q.id}.json`);
          if (res.ok) {
            data = await res.json();
          }
        } catch {}

        // 2. If not found or empty approaches, fallback to backend API (or AI generation)
        if (!data || !data.approaches || data.approaches.length === 0) {
          try {
            data = await questionsApi.getSolution(q.id);
          } catch {}
        }

        if (isMounted) {
          if (data && data.approaches && data.approaches.length > 0) {
            setSolutionData(data);
            const optimalIdx = data.approaches.findIndex((a) => a.tag === 'Optimal');
            setSelectedApproachIndex(optimalIdx !== -1 ? optimalIdx : 0);
          } else {
            setSolutionData(null);
          }
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

  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      sounds.playClick();
      const freshSolution = await questionsApi.generateAiSolution(q.id);
      if (freshSolution && freshSolution.approaches && freshSolution.approaches.length > 0) {
        setSolutionData(freshSolution);
        const optimalIdx = freshSolution.approaches.findIndex((a) => a.tag === 'Optimal');
        setSelectedApproachIndex(optimalIdx !== -1 ? optimalIdx : 0);
      }
    } catch (err) {
      console.error('Failed to generate AI solution:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getActiveApproachCode = (app?: SolutionApproach): string => {
    if (!app) return '// No code available';
    if (app.code) {
      if (solutionLanguage === 'python' && app.code.python) return app.code.python;
      if (solutionLanguage === 'cpp' && app.code.cpp) return app.code.cpp;
      if (solutionLanguage === 'java' && app.code.java) return app.code.java;
      const firstAvailable = Object.values(app.code).find((c) => Boolean(c));
      if (firstAvailable) return firstAvailable;
    }
    return app.cppCode || '// Code implementation';
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
        <p className="text-textMuted italic text-xs">
          No notes recorded yet. Write your personal invariants, edge cases, or trade-offs here.
        </p>
      );
    }
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-base font-bold text-white mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold text-primary mb-1.5">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-semibold text-primaryDim mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc text-xs text-textSecondary leading-relaxed">{line.replace(/^[-*]\s*/, '')}</li>;
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-xs text-textSecondary leading-relaxed">{line}</p>;
    });
  };

  const currentApproach: SolutionApproach | undefined = solutionData?.approaches[selectedApproachIndex];
  const askingCompanies = Object.keys(q.companies);
  const companyFreq = q.companies[companyId]?.all || q.companies[companyId]?.['thirty-days'] || 'Asked';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-textPrimary overflow-hidden select-none">
      {/* ========================================================= */}
      {/* TOP CONTROL BAR (LeetCode Style Header)                  */}
      {/* ========================================================= */}
      <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Back Button & Problem Info & Prev/Next */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surfaceElevated hover:bg-border border border-border text-textSecondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Back to Questions List"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problem List</span>
          </button>

          <div className="h-5 w-px bg-surfaceElevated hidden sm:block" />

          {/* Prev / Next Problem Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevQuestion && onNavigateToProblem(prevQuestion.id)}
              disabled={!prevQuestion}
              className="p-1.5 rounded-lg bg-surfaceElevated hover:bg-border border border-border text-textMuted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={prevQuestion ? `Previous: #${prevQuestion.id} ${prevQuestion.title}` : 'First Question'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextQuestion && onNavigateToProblem(nextQuestion.id)}
              disabled={!nextQuestion}
              className="p-1.5 rounded-lg bg-surfaceElevated hover:bg-border border border-border text-textMuted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={nextQuestion ? `Next: #${nextQuestion.id} ${nextQuestion.title}` : 'Last Question'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Problem Title & ID & Difficulty */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-mono text-xs font-extrabold text-primary shrink-0">
              #{q.id}
            </span>
            <h1 className="text-sm font-extrabold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {q.title}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                q.difficulty === 'Easy'
                  ? 'bg-easy/10 text-easy border-easy/40'
                  : q.difficulty === 'Medium'
                  ? 'bg-medium/10 text-medium border-medium/40'
                  : 'bg-hard/10 text-hard border-hard/40'
              }`}
            >
              {q.difficulty}
            </span>

            <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-md bg-surfaceElevated text-textMuted border border-border font-mono">
              {companyFreq}
            </span>
          </div>
        </div>

        {/* Right: Status Selector, Timer, Solve on LC, Star, Actions */}
        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center bg-surfaceElevated rounded-xl p-0.5 border border-border">
            {(['todo', 'in-progress', 'solved', 'review', 'mastered'] as ProblemStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleSetStatus(st)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all ${
                  status === st
                    ? st === 'solved' ? 'bg-primary text-black font-bold shadow-terminal-glow' : st === 'mastered' ? 'bg-primary text-black font-bold shadow-terminal-glow' : st === 'in-progress' ? 'bg-medium text-black font-bold' : st === 'review' ? 'bg-hard text-black font-bold' : 'bg-surfaceElevated text-textPrimary'
                    : 'text-textMuted hover:text-textPrimary'
                }`}
              >
                {st.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Stopwatch Timer */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surfaceElevated border border-border text-textSecondary font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{formatTime(timerSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-white"
              title={isTimerRunning ? 'Pause timer' : 'Start stopwatch'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3 text-primary" /> : <Play className="w-3 h-3 text-primary" />}
            </button>
          </div>

          {/* Favorite Star */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsFavorite(!isFavorite);
              onSaveProgress({ isFavorite: !isFavorite });
            }}
            className={`p-2 rounded-xl border border-border transition-colors ${
              isFavorite ? 'bg-primary/15 text-primary border border-primary/40' : 'bg-surfaceElevated text-textMuted hover:text-textPrimary'
            }`}
            title={isFavorite ? 'Remove bookmark' : 'Bookmark question'}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-primary' : ''}`} />
          </button>

          {/* External LeetCode Button */}
          <a
            href={q.url || `https://leetcode.com/problems/${q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 text-xs font-semibold transition-colors"
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
        <div className="w-full md:w-1/2 flex flex-col border-r border-border/80 bg-surface/60 overflow-hidden">
          {/* Left Pane Navigation Header */}
          <div className="h-10 border-b border-border bg-surface/90 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setLeftTab('theory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'theory' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                <span>C++ Solutions & Theory</span>
                {solutionData && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primaryHover font-mono">
                    {solutionData.approaches.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLeftTab('notes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'notes' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes & Tags</span>
                {tags.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surfaceElevated text-textSecondary font-mono">
                    {tags.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLeftTab('srs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'srs' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Spaced Repetition</span>
              </button>

              <button
                onClick={() => setLeftTab('companies')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  leftTab === 'companies' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
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
                {/* Core Pattern Pill & AI Action */}
                {solutionData && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surfaceElevated border border-border">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary">
                        Pattern: {solutionData.corePattern}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateWithAi}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                        title="Generate or refresh solution using Meta Muse AI"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingAi ? 'Meta AI Generating...' : '✨ Ask Meta AI'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty / Loading State for Editorial */}
                {(!solutionData || isLoadingSolution || isGeneratingAi) && (
                  <div className="p-8 rounded-2xl bg-surfaceElevated border border-border flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Sparkles className={`w-6 h-6 ${isLoadingSolution || isGeneratingAi ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h3 className="text-sm font-bold text-white">
                        {isGeneratingAi
                          ? 'Generating FAANG-Grade Editorial with Meta Muse...'
                          : isLoadingSolution
                          ? 'Retrieving Problem Solution...'
                          : 'No Pre-Baked Solution Available'}
                      </h3>
                      <p className="text-xs text-textMuted leading-relaxed">
                        {isGeneratingAi
                          ? 'Meta Muse Spark 1.3 is formulating multi-approach algorithms, complexity derivations, and multi-language code...'
                          : isLoadingSolution
                          ? 'Checking database and static solutions...'
                          : 'Generate an instant, gold-standard multi-approach editorial with C++, Python, and Java code.'}
                      </p>
                    </div>
                    {!isLoadingSolution && (
                      <button
                        onClick={handleGenerateWithAi}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primaryHover text-black font-bold text-xs shadow-terminal-glow transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingAi ? 'Generating...' : '✨ Generate with Meta Muse AI'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Approach Switcher Buttons */}
                {solutionData && solutionData.approaches && solutionData.approaches.length > 0 && !isGeneratingAi && (
                  <div className="flex flex-wrap gap-2">
                    {solutionData.approaches.map((app, idx) => (
                      <button
                        key={app.id || idx}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedApproachIndex(idx);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                          selectedApproachIndex === idx
                            ? 'bg-primary text-black font-bold shadow-md border border-primary'
                            : 'bg-surfaceElevated hover:bg-border border border-border text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        <span>{app.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            app.tag === 'Optimal'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : app.tag === 'Better'
                              ? 'bg-primaryHover/20 text-primaryHover border border-primaryHover/30'
                              : 'bg-primaryDim/15 text-primaryDim border border-primaryDim/30'
                          }`}
                        >
                          {app.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Approach Deep Dive */}
                {currentApproach && !isGeneratingAi && (
                  <div className="space-y-4">
                    {/* Complexity Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-surfaceElevated border border-border">
                        <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">
                          Time Complexity
                        </span>
                        <span className="font-mono text-sm font-bold text-primary">
                          {currentApproach.timeComplexity.complexity}
                        </span>
                        <p className="text-[11px] text-textMuted mt-0.5">
                          {currentApproach.timeComplexity.explanation}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-surfaceElevated border border-border">
                        <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">
                          Space Complexity
                        </span>
                        <span className="font-mono text-sm font-bold text-primary">
                          {currentApproach.spaceComplexity.complexity}
                        </span>
                        <p className="text-[11px] text-textMuted mt-0.5">
                          {currentApproach.spaceComplexity.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Intuition & Theory */}
                    <div className="p-4 rounded-xl bg-surfaceElevated border border-border space-y-2">
                      <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        Intuition & Invariant Proof
                      </h4>
                      <p className="text-xs text-textSecondary leading-relaxed">
                        {currentApproach.intuition}
                      </p>
                      {currentApproach.theory && (
                        <div className="pt-2 border-t border-border text-xs text-primary leading-relaxed">
                          <strong>Theoretical Justification: </strong>
                          {currentApproach.theory}
                        </div>
                      )}
                    </div>

                    {/* Multi-Language Code Display */}
                    <div className="rounded-xl bg-surfaceElevated border border-border overflow-hidden">
                      <div className="p-3 bg-surfaceElevated border-b border-border flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-textSecondary font-mono flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-primary" />
                            Implementation
                          </span>

                          {/* Language Switcher Tabs */}
                          <div className="flex items-center bg-background p-0.5 rounded-lg border border-border">
                            {(['python', 'cpp', 'java'] as const).map((lang) => {
                              const hasLang = Boolean(currentApproach.code?.[lang] || (lang === 'cpp' && currentApproach.cppCode));
                              return (
                                <button
                                  key={lang}
                                  onClick={() => {
                                    sounds.playClick();
                                    setSolutionLanguage(lang);
                                    localStorage.setItem('cheatcode_preferred_lang', lang);
                                  }}
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                    solutionLanguage === lang
                                      ? 'bg-primary text-black font-bold shadow-sm'
                                      : hasLang
                                      ? 'text-textMuted hover:text-textPrimary'
                                      : 'text-textMuted/40 hover:text-textMuted'
                                  }`}
                                >
                                  {lang === 'python' ? 'Python 3' : lang === 'cpp' ? 'C++' : 'Java'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopySolutionCode(getActiveApproachCode(currentApproach))}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-slate-700 text-textSecondary text-xs transition-colors cursor-pointer"
                        >
                          {copiedSolutionCode ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSolutionCode ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-primary overflow-x-auto leading-relaxed max-h-80">
                        <code>{getActiveApproachCode(currentApproach)}</code>
                      </pre>
                    </div>

                    {/* Step-by-Step Example Walkthrough */}
                    {currentApproach.dryRunExample && (
                      <div className="p-4 rounded-xl bg-surfaceElevated border border-border space-y-2">
                        <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                          🔍 Step-by-Step Dry Run Example
                        </h4>
                        <div className="text-xs font-mono text-primary bg-surface p-2 rounded-lg border border-border">
                          Input: {currentApproach.dryRunExample.input}
                        </div>
                        <ul className="space-y-1 text-xs text-textSecondary">
                          {currentApproach.dryRunExample.steps.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary shrink-0 font-mono">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-xs font-mono text-primary bg-surface p-2 rounded-lg border border-border">
                          Expected Output: {currentApproach.dryRunExample.output}
                        </div>
                      </div>
                    )}

                    {/* Edge Cases & Traps */}
                    {currentApproach.edgeCases && currentApproach.edgeCases.length > 0 && (
                      <div className="p-4 rounded-xl bg-surfaceElevated border border-border space-y-2">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Edge Cases & Interview Traps
                        </h4>
                        <ul className="space-y-1 text-xs text-textSecondary">
                          {currentApproach.edgeCases.map((ec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary shrink-0 font-mono">⚠️</span>
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
                <div className="p-3 rounded-xl bg-surfaceElevated border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-textMuted">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      Personal Tags
                    </span>
                    <span className="text-[11px] text-textMuted">e.g. revisit, dp-pattern, tricky-pointers</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated text-primary border border-primary/40 text-xs font-mono"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-primary hover:text-error p-0.5 cursor-pointer"
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
                        className="px-2.5 py-1 bg-surface border border-border rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-borderActive"
                      />
                      {tagInput.trim() && (
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="p-1 rounded-lg bg-primary hover:bg-primary text-white text-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Markdown Notes Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-textMuted">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNotesView('edit')}
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          notesView === 'edit' ? 'bg-primary text-black font-bold' : 'text-textMuted hover:text-white'
                        }`}
                      >
                        Edit Markdown
                      </button>
                      <button
                        onClick={() => setNotesView('preview')}
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          notesView === 'preview' ? 'bg-primary text-black font-bold' : 'text-textMuted hover:text-white'
                        }`}
                      >
                        Preview Formatted
                      </button>
                    </div>
                    <span className="text-[11px] text-textMuted">Auto-saves continuously</span>
                  </div>

                  {notesView === 'edit' ? (
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="💡 Write your notes here...&#10;• Approach: Two pointer with left/right initialized at bounds&#10;• Time Complexity: O(N)&#10;• Space Complexity: O(1)&#10;• Trap / Gotchas: Handle duplicate elements properly"
                      rows={14}
                      className="w-full p-4 rounded-xl bg-surfaceElevated border border-border text-textPrimary placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y leading-relaxed"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-surfaceElevated border border-border min-h-[280px] notes-preview space-y-2">
                      {renderMarkdown(notes)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SPACED REPETITION (SRS) */}
            {leftTab === 'srs' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surfaceElevated border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Spaced Repetition Review Schedule
                    </h4>
                  </div>
                  <p className="text-xs text-textMuted leading-relaxed">
                    Retain algorithmic problem-solving intuition through mathematically scheduled intervals.
                  </p>

                  <div className="p-3 rounded-lg bg-surface border border-border text-xs font-mono text-textSecondary">
                    {initialProgress.nextReviewAt ? (
                      <span className="text-primary">
                        Next Due: <strong>{new Date(initialProgress.nextReviewAt).toLocaleDateString()}</strong> (Interval: {initialProgress.reviewIntervalDays || 1} days)
                      </span>
                    ) : (
                      <span className="text-textMuted">No review scheduled yet.</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => handleScheduleReview(1)}
                      className="p-2 rounded-xl bg-surface hover:bg-primary text-textSecondary hover:text-white text-xs font-semibold border border-border transition-colors"
                    >
                      Tomorrow (+1d)
                    </button>
                    <button
                      onClick={() => handleScheduleReview(3)}
                      className="p-2 rounded-xl bg-surface hover:bg-primary text-textSecondary hover:text-white text-xs font-semibold border border-border transition-colors"
                    >
                      In 3 Days (+3d)
                    </button>
                    <button
                      onClick={() => handleScheduleReview(7)}
                      className="p-2 rounded-xl bg-surface hover:bg-primary text-textSecondary hover:text-white text-xs font-semibold border border-border transition-colors"
                    >
                      In 1 Week (+7d)
                    </button>
                    <button
                      onClick={() => handleScheduleReview(30)}
                      className="p-2 rounded-xl bg-surface hover:bg-primary text-textSecondary hover:text-white text-xs font-semibold border border-border transition-colors"
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
                <p className="text-xs text-textMuted">
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
                            ? 'bg-surfaceElevated border-primary/40 text-primary font-bold'
                            : 'bg-surfaceElevated border-border text-textSecondary'
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
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE (50%): In-Browser IDE Runner & Whiteboard     */}
        {/* ========================================================= */}
        <div className="w-full md:w-1/2 flex flex-col bg-background overflow-hidden">
          {/* Right Pane Navigation Header */}
          <div className="h-10 border-b border-border bg-surface/90 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightTab('runner')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rightTab === 'runner' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>C++ Code Scratchpad</span>
              </button>

              <button
                onClick={() => setRightTab('whiteboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rightTab === 'whiteboard' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span>Whiteboard Canvas</span>
              </button>

              <button
                onClick={() => setRightTab('scratchpad')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rightTab === 'scratchpad' ? 'bg-primary text-black font-bold shadow-terminal-glow' : 'text-textMuted hover:text-white'
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
                            ? 'bg-primary text-black font-bold'
                            : 'bg-surfaceElevated text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyScratchpadCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated hover:bg-border text-xs font-mono text-textSecondary transition-colors"
                  >
                    {copiedScratchpadCode ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScratchpadCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <textarea
                  value={codeText}
                  onChange={(e) => setCodeText(e.target.value)}
                  placeholder={`// Scratchpad in ${codeLang.toUpperCase()}\nclass Solution {\n    // Type code here...\n}`}
                  rows={20}
                  className="w-full p-4 rounded-xl bg-surface border border-border text-primary placeholder-textMuted text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
