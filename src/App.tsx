import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Question, CompanyMeta, UserProgressItem, UserStoreState, ProblemStatus } from './types';
import companyMetaData from './data/company_meta.json';
import {
  loadStoredState, saveStoredState, getTodayKey, calculateStreaks,
  isDueForReview, generateDemoProgress
} from './services/storage';
import { sounds } from './utils/sound';
import { Navbar } from './components/Navbar';
import { TimeframeTabs } from './components/TimeframeTabs';
import { FilterBar } from './components/FilterBar';
import { QuestionTable } from './components/QuestionTable';
import { QuestionCard } from './components/QuestionCard';
import { QuestionDetailModal } from './components/QuestionDetailModal';
import { CompanyOverlapModal } from './components/CompanyOverlapModal';
import { MockInterviewModal } from './components/MockInterviewModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { CompanyLogo } from './components/CompanyLogo';
import {
  Flame, Sparkles, ChevronLeft, ChevronRight, Layers, Clock, AlertCircle,
  TrendingUp, CheckCircle2, Bookmark, Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

const companiesDict: Record<string, CompanyMeta> = companyMetaData as unknown as Record<string, CompanyMeta>;

const TOP_FAANG_PILLS = [
  'google', 'meta', 'amazon', 'microsoft', 'apple', 'netflix', 'uber', 'bloomberg'
];

export const App: React.FC = () => {
  const [store, setStore] = useState<UserStoreState>(() => loadStoredState());
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keyboard navigation focused row
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Active Modals
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState<boolean>(false);
  const [showMockModal, setShowMockModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Save to local storage whenever store changes
  useEffect(() => {
    saveStoredState(store);
  }, [store]);

  // Load complete questions dataset asynchronously
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/data/leetcode_company_data.json');
        if (!res.ok) {
          throw new Error(`Failed to load questions dataset: ${res.statusText}`);
        }
        const data = await res.json();
        setAllQuestions(data.questions || []);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error('Error fetching question data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update store helper
  const updateStore = useCallback((patch: Partial<UserStoreState>) => {
    setStore((prev) => ({ ...prev, ...patch }));
  }, []);

  // Reset page and focusedIndex on filter changes
  useEffect(() => {
    setCurrentPage(1);
    setFocusedIndex(0);
  }, [
    store.selectedCompany,
    store.selectedTimeframe,
    store.selectedDifficulty,
    store.selectedStatus,
    store.selectedTopic,
    store.searchQuery,
    store.curatedList,
    store.sortBy,
    store.sortOrder,
  ]);

  // All distinct topics extracted from questions
  const topicsList = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => q.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allQuestions]);

  // Status counts for current company & timeframe
  const statusCounts = useMemo(() => {
    const company = store.selectedCompany;
    const tf = store.selectedTimeframe;
    const companyQuestions = allQuestions.filter((q) => {
      if (!q.companies[company]) return false;
      if (tf !== 'all' && !q.companies[company][tf]) return false;
      return true;
    });

    let todo = 0, inProgress = 0, solved = 0, dueReview = 0, starred = 0;
    companyQuestions.forEach((q) => {
      const p = store.progress[String(q.id)];
      const st = p?.status || 'todo';
      if (p?.isFavorite) starred++;
      if (isDueForReview(p)) dueReview++;

      if (st === 'solved' || st === 'mastered') solved++;
      else if (st === 'in-progress') inProgress++;
      else todo++;
    });

    return {
      total: companyQuestions.length,
      todo,
      inProgress,
      solved,
      dueReview,
      starred,
    };
  }, [allQuestions, store.selectedCompany, store.selectedTimeframe, store.progress]);

  // Filtered & Sorted Questions
  const filteredQuestions = useMemo(() => {
    const company = store.selectedCompany;
    const tf = store.selectedTimeframe;
    const query = store.searchQuery.toLowerCase().trim();

    return allQuestions.filter((q) => {
      // 1. Company filter
      const compData = q.companies[company];
      if (!compData) return false;

      // 2. Timeframe filter
      if (tf !== 'all' && !compData[tf]) return false;

      // 3. Curated list filter
      if (store.curatedList === 'blind75' && !q.isBlind75) return false;
      if (store.curatedList === 'grind169' && !q.isGrind169) return false;

      // 4. Difficulty filter
      if (store.selectedDifficulty !== 'all' && q.difficulty !== store.selectedDifficulty) {
        return false;
      }

      // 5. Topic filter
      if (store.selectedTopic !== 'all' && !q.topics.includes(store.selectedTopic)) {
        return false;
      }

      // 6. Status filter
      const p = store.progress[String(q.id)];
      const st = p?.status || 'todo';
      if (store.selectedStatus === 'favorite' && !p?.isFavorite) return false;
      if (store.selectedStatus === 'due-review' && !isDueForReview(p)) return false;
      if (
        store.selectedStatus !== 'all' &&
        store.selectedStatus !== 'favorite' &&
        store.selectedStatus !== 'due-review' &&
        st !== store.selectedStatus
      ) {
        return false;
      }

      // 7. Search query filter
      if (query) {
        const matchesId = String(q.id) === query || String(q.id).includes(query);
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesTopic = q.topics.some((t) => t.toLowerCase().includes(query));
        if (!matchesId && !matchesTitle && !matchesTopic) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      const getFreq = (item: Question) => {
        const str = item.companies[company]?.[tf] || item.companies[company]?.all || '0.0%';
        return parseFloat(str.replace('%', '')) || 0;
      };

      const getAcc = (item: Question) => {
        return parseFloat(item.acceptance.replace('%', '')) || 0;
      };

      let comparison = 0;
      switch (store.sortBy) {
        case 'frequency':
          comparison = getFreq(a) - getFreq(b);
          break;
        case 'acceptance':
          comparison = getAcc(a) - getAcc(b);
          break;
        case 'id':
          comparison = Number(a.id) - Number(b.id);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'difficulty': {
          const rank = { Easy: 1, Medium: 2, Hard: 3 };
          comparison = rank[a.difficulty] - rank[b.difficulty];
          break;
        }
        case 'status': {
          const rank = { todo: 1, 'in-progress': 2, review: 3, solved: 4, mastered: 5 };
          const sa = store.progress[String(a.id)]?.status || 'todo';
          const sb = store.progress[String(b.id)]?.status || 'todo';
          comparison = rank[sa] - rank[sb];
          break;
        }
        default:
          comparison = 0;
      }

      return store.sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [allQuestions, store]);

  // If Top 30 Sprint is selected, slice top 30 by frequency
  const displayQuestions = useMemo(() => {
    if (store.curatedList === 'sprint30') {
      return filteredQuestions.slice(0, 30);
    }
    return filteredQuestions;
  }, [filteredQuestions, store.curatedList]);

  // Paginated Questions
  const totalPages = Math.ceil(displayQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayQuestions.slice(start, start + pageSize);
  }, [displayQuestions, currentPage, pageSize]);

  // Progress Update Handlers
  const handleUpdateStatus = (qId: number | string, newStatus: ProblemStatus) => {
    const idStr = String(qId);
    const prevItem = store.progress[idStr] || {
      questionId: qId,
      status: 'todo',
      isFavorite: false,
    };

    const isNowSolved = newStatus === 'solved' || newStatus === 'mastered';
    const wasAlreadySolved = prevItem.status === 'solved' || prevItem.status === 'mastered';

    const todayStr = getTodayKey();
    const updatedActivity = { ...store.activityLog };
    if (isNowSolved && !wasAlreadySolved) {
      updatedActivity[todayStr] = (updatedActivity[todayStr] || 0) + 1;
    }

    setStore((prev) => ({
      ...prev,
      activityLog: updatedActivity,
      progress: {
        ...prev.progress,
        [idStr]: {
          ...prevItem,
          status: newStatus,
          lastSolvedAt: isNowSolved ? new Date().toISOString() : prevItem.lastSolvedAt,
          solveCount: isNowSolved ? (prevItem.solveCount || 0) + 1 : prevItem.solveCount,
        },
      },
    }));
  };

  const handleToggleFavorite = (qId: number | string) => {
    const idStr = String(qId);
    const prevItem = store.progress[idStr] || {
      questionId: qId,
      status: 'todo',
      isFavorite: false,
    };

    setStore((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        [idStr]: {
          ...prevItem,
          isFavorite: !prevItem.isFavorite,
        },
      },
    }));
  };

  const handleSaveProgressPatch = (qId: number | string, patch: Partial<UserProgressItem>) => {
    const idStr = String(qId);
    const prevItem = store.progress[idStr] || {
      questionId: qId,
      status: 'todo',
      isFavorite: false,
    };

    setStore((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        [idStr]: {
          ...prevItem,
          ...patch,
        },
      },
    }));
  };

  // Random Roulette
  const handleRandomRoulette = () => {
    if (filteredQuestions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    const chosen = filteredQuestions[randomIndex];
    setDetailQuestion(chosen);
    sounds.playSuccess();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#EC4899', '#F59E0B'],
    });
  };

  // Keyboard Shortcuts Listener with J/K Navigation & Quick Toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        setDetailQuestion(null);
        setShowOverlapModal(false);
        setShowMockModal(false);
        setShowAnalyticsModal(false);
        setShowShortcutsModal(false);
        return;
      }

      // If a modal is open, let user close it, don't execute background shortcuts
      if (detailQuestion || showOverlapModal || showMockModal || showAnalyticsModal || showShortcutsModal) {
        return;
      }

      if (e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(paginatedQuestions.length - 1, prev + 1));
        return;
      }

      if (e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const activeQ = paginatedQuestions[focusedIndex];
        if (activeQ) {
          setDetailQuestion(activeQ);
        }
        return;
      }

      if (e.key === ' ' || e.key === 'x') {
        e.preventDefault();
        const activeQ = paginatedQuestions[focusedIndex];
        if (activeQ) {
          const current = store.progress[String(activeQ.id)]?.status || 'todo';
          const nextMap: Record<ProblemStatus, ProblemStatus> = {
            'todo': 'in-progress',
            'in-progress': 'solved',
            'solved': 'review',
            'review': 'mastered',
            'mastered': 'todo',
          };
          const nextSt = nextMap[current];
          handleUpdateStatus(activeQ.id, nextSt);
          if (nextSt === 'solved' || nextSt === 'mastered') {
            sounds.playSuccess();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#10B981', '#3B82F6', '#F59E0B'],
            });
          } else {
            sounds.playClick();
          }
        }
        return;
      }

      if (e.key === 'b') {
        e.preventDefault();
        const activeQ = paginatedQuestions[focusedIndex];
        if (activeQ) {
          sounds.playClick();
          handleToggleFavorite(activeQ.id);
        }
        return;
      }

      if (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search by ID"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      if (e.key === 'r') {
        e.preventDefault();
        handleRandomRoulette();
        return;
      }

      if (e.key === 'o') {
        e.preventDefault();
        setShowOverlapModal(true);
        return;
      }

      if (e.key === 'm') {
        e.preventDefault();
        setShowMockModal(true);
        return;
      }

      if (e.key === 'a') {
        e.preventDefault();
        setShowAnalyticsModal(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedQuestions, focusedIndex, detailQuestion, showOverlapModal, showMockModal, showAnalyticsModal, showShortcutsModal, store.progress]);

  // Overall Solved count
  const totalSolvedCount = useMemo(() => {
    return Object.values(store.progress).filter(
      (p) => p.status === 'solved' || p.status === 'mastered'
    ).length;
  }, [store.progress]);

  // Today solved count
  const todaySolvedCount = useMemo(() => {
    const today = getTodayKey();
    return store.activityLog[today] || 0;
  }, [store.activityLog]);

  const { currentStreak } = useMemo(() => calculateStreaks(store.activityLog), [store.activityLog]);
  const activeCompanyMeta = companiesDict[store.selectedCompany];

  return (
    <div className="min-h-screen bg-[#080d1a] dark:bg-[#080d1a] bg-slate-50 text-slate-100 dark:text-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500/30 bg-ambient-grid transition-colors">
      {/* Top Navbar */}
      <Navbar
        companies={companiesDict}
        selectedCompanyId={store.selectedCompany}
        onSelectCompany={(cId) => updateStore({ selectedCompany: cId })}
        state={store}
        onUpdateState={updateStore}
        filteredQuestions={filteredQuestions}
        totalSolved={totalSolvedCount}
        currentStreak={currentStreak}
        onOpenOverlap={() => setShowOverlapModal(true)}
        onOpenMock={() => setShowMockModal(true)}
        onOpenAnalytics={() => setShowAnalyticsModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onRandomRoulette={handleRandomRoulette}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Company Header Banner */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Top row: Company details + Timeframe selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <CompanyLogo companyId={store.selectedCompany} size="xl" className="shadow-lg mt-0.5" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {activeCompanyMeta?.name || store.selectedCompany}
                    </h1>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {activeCompanyMeta?.tier || 'Tech'}
                    </span>
                    {activeCompanyMeta?.thirtyDaysCount > 0 && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        {activeCompanyMeta.thirtyDaysCount} Hot in 30 Days
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Track and solve verified LeetCode interview questions curated for {activeCompanyMeta?.name || store.selectedCompany}.
                  </p>

                  {/* Company stats pills */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs font-mono">
                    <span className="text-slate-300">
                      <strong className="text-white">{activeCompanyMeta?.totalQuestions || 0}</strong> total
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400">
                      {activeCompanyMeta?.diffCounts?.Easy || 0} Easy
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400">
                      {activeCompanyMeta?.diffCounts?.Medium || 0} Medium
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-400">
                      {activeCompanyMeta?.diffCounts?.Hard || 0} Hard
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeframe selector tabs */}
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recency Timeframe
                </span>
                <TimeframeTabs
                  selectedTimeframe={store.selectedTimeframe}
                  onSelectTimeframe={(tf) => updateStore({ selectedTimeframe: tf })}
                  companyMeta={activeCompanyMeta}
                />
              </div>
            </div>

            {/* Quick Switch Pills for Top Companies & Daily Goal Tracker */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Quick switch company buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-slate-400 mr-1 font-medium hidden lg:inline">Quick Jump:</span>
                {TOP_FAANG_PILLS.map((cId) => {
                  const isCur = store.selectedCompany === cId;
                  const cMeta = companiesDict[cId];
                  return (
                    <button
                      key={cId}
                      onClick={() => {
                        sounds.playClick();
                        updateStore({ selectedCompany: cId });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isCur
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <CompanyLogo companyId={cId} size="sm" />
                      <span className="capitalize">{cMeta?.name || cId}</span>
                    </button>
                  );
                })}
              </div>

              {/* Today's Goal Progress */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 shrink-0">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300">
                  Daily Goal: <strong className="text-white">{todaySolvedCount}</strong> / {store.dailyGoal} solved
                </span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (todaySolvedCount / store.dailyGoal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <FilterBar
          state={store}
          onChange={updateStore}
          statusCounts={statusCounts}
          topicsList={topicsList}
        />

        {/* Keyboard navigation helper hint */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-300">j</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-300">k</kbd> to navigate, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-300">Space</kbd> to solve, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-300">Enter</kbd> to open.</span>
          </div>
          <button onClick={() => setShowShortcutsModal(true)} className="hover:text-slate-200 underline">
            View all shortcuts (?)
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Indexing 3,399 interview questions across 659 companies...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Error: {error}</span>
          </div>
        )}

        {/* Question Content: Table or Grid */}
        {!isLoading && !error && (
          <>
            {store.viewMode === 'table' ? (
              <QuestionTable
                questions={paginatedQuestions}
                progress={store.progress}
                selectedCompany={store.selectedCompany}
                selectedTimeframe={store.selectedTimeframe}
                focusedIndex={focusedIndex}
                onUpdateStatus={handleUpdateStatus}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetail={(q) => setDetailQuestion(q)}
                onStartTimer={(q) => setDetailQuestion(q)}
                onSelectRow={(idx) => setFocusedIndex(idx)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    progress={store.progress[String(q.id)]}
                    selectedCompany={store.selectedCompany}
                    selectedTimeframe={store.selectedTimeframe}
                    isFocused={idx === focusedIndex}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetail={(targetQ) => setDetailQuestion(targetQ)}
                    onStartTimer={(targetQ) => setDetailQuestion(targetQ)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {displayQuestions.length > pageSize && (
              <div className="flex items-center justify-between py-4 border-t border-slate-800/80 px-2 text-xs">
                <span className="text-slate-400">
                  Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-white">
                    {Math.min(currentPage * pageSize, displayQuestions.length)}
                  </strong>{' '}
                  of <strong className="text-white">{displayQuestions.length}</strong> problems
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      setFocusedIndex(0);
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-xl">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      setFocusedIndex(0);
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">LeetTracker Pro</span>
            <span>•</span>
            <span>659 Companies • 3,399 Verified Questions</span>
            <span>•</span>
            <span className="text-indigo-400">Snapshot: July 2026</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <button onClick={() => setShowShortcutsModal(true)} className="hover:text-white transition-colors">
              Hotkeys (?)
            </button>
            <span>•</span>
            <a
              href="https://github.com/snehasishroy/leetcode-companywise-interview-questions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub Source Repo
            </a>
          </div>
        </div>
      </footer>

      {/* Question Workspace Modal */}
      {detailQuestion && (
        <QuestionDetailModal
          question={detailQuestion}
          progress={store.progress[String(detailQuestion.id)]}
          companyId={store.selectedCompany}
          onClose={() => setDetailQuestion(null)}
          onSaveProgress={(patch) => handleSaveProgressPatch(detailQuestion.id, patch)}
        />
      )}

      {/* Company Overlap Matrix Modal */}
      {showOverlapModal && (
        <CompanyOverlapModal
          questions={allQuestions}
          companies={companiesDict}
          progress={store.progress}
          onClose={() => setShowOverlapModal(false)}
          onSelectQuestion={(q) => setDetailQuestion(q)}
        />
      )}

      {/* Mock Interview Simulation Modal */}
      {showMockModal && (
        <MockInterviewModal
          company={store.selectedCompany}
          companyMeta={activeCompanyMeta}
          questions={allQuestions}
          onClose={() => setShowMockModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Analytics & Heatmap Modal */}
      {showAnalyticsModal && (
        <AnalyticsModal
          state={store}
          questions={allQuestions}
          companies={companiesDict}
          onClose={() => setShowAnalyticsModal(false)}
          onImportBackup={(imported) => {
            setStore(imported);
            saveStoredState(imported);
          }}
          onLoadDemoData={() => {
            const demo = generateDemoProgress(allQuestions);
            setStore((prev) => ({
              ...prev,
              progress: { ...prev.progress, ...demo.progress },
              activityLog: { ...prev.activityLog, ...demo.activityLog },
            }));
            sounds.playSuccess();
          }}
          onResetProgress={() => {
            setStore((prev) => ({
              ...prev,
              progress: {},
              activityLog: {},
            }));
            sounds.playClick();
          }}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <KeyboardHelpModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
};
