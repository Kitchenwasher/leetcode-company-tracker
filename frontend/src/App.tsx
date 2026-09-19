import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Question, CompanyMeta, UserProgressItem, UserStoreState, ProblemStatus, Timeframe, Difficulty } from './types';
import companyMetaData from './data/company_meta.json';
import {
  loadStoredState, saveStoredState, getTodayKey, calculateStreaks,
  isDueForReview, generateDemoProgress
} from './services/storage';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PrepPlannerModal } from './components/PrepPlannerModal';
import { FlashcardModal } from './components/FlashcardModal';
import { LeetCodeSyncModal } from './components/LeetCodeSyncModal';
import { isQuestionInTrack } from './data/curatedLists';
import { sounds } from './utils/sound';
import { Navbar } from './components/Navbar';
import { TimeframeTabs } from './components/TimeframeTabs';
import { FilterBar } from './components/FilterBar';
import { QuestionTable } from './components/QuestionTable';
import { QuestionCard } from './components/QuestionCard';
import { ProblemWorkspacePage } from './components/ProblemWorkspacePage';
import { QuestionDetailModal } from './components/QuestionDetailModal';
import { CompanyOverlapModal } from './components/CompanyOverlapModal';
import { MockInterviewModal } from './components/MockInterviewModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { CompanyLogo } from './components/CompanyLogo';
import { LandingPage } from './components/LandingPage';
import { AppSidebarLayout } from './components/AppSidebarLayout';
import { OverviewPage } from './components/OverviewPage';
import { QuestionsPage } from './components/QuestionsPage';
import { PracticePage } from './components/PracticePage';
import { MockInterviewPage } from './components/MockInterviewPage';
import { ProgressPage } from './components/ProgressPage';
import { CommunityPage } from './components/CommunityPage';
import { BookmarksPage } from './components/BookmarksPage';
import { CompaniesPage } from './components/CompaniesPage';
import { SettingsPage } from './components/SettingsPage';
import {
  Flame, ChevronLeft, ChevronRight, AlertCircle, Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

const companiesDict: Record<string, CompanyMeta> = companyMetaData as unknown as Record<string, CompanyMeta>;

const TOP_FAANG_PILLS = [
  'google', 'meta', 'amazon', 'microsoft', 'apple', 'netflix', 'uber', 'bloomberg'
];

// ====================================================================
// Problem Workspace Route View (/problem/:problemId)
// ====================================================================
interface ProblemRouteViewProps {
  allQuestions: Question[];
  isLoading: boolean;
  store: UserStoreState;
  onSaveProgressPatch: (questionId: number | string, patch: Partial<UserProgressItem>) => void;
}

const ProblemRouteView: React.FC<ProblemRouteViewProps> = ({
  allQuestions,
  isLoading,
  store,
  onSaveProgressPatch,
}) => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const activeProblemQuestion = useMemo(() => {
    if (!problemId) return null;
    return allQuestions.find((q) => String(q.id) === String(problemId)) || null;
  }, [problemId, allQuestions]);

  const handleBack = useCallback(() => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/dashboard/company/${store.selectedCompany || 'google'}`);
    }
  }, [navigate, store.selectedCompany]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-textSecondary min-h-[60vh] font-mono">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">&gt; Loading problem workspace #{problemId}...</span>
      </div>
    );
  }

  if (!activeProblemQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-textSecondary min-h-[70vh] space-y-4 font-mono">
        <div className="p-3 bg-surfaceElevated border border-hard/40 rounded-[2px] text-hard shadow-xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-textPrimary tracking-tight">&gt; Problem #{problemId} Not Found</h2>
        <p className="text-xs text-textMuted max-w-md">
          Unable to locate problem in the indexed dataset of 3,399 interview questions.
        </p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-primary hover:bg-primaryHover text-black text-xs font-bold rounded-[2px] transition-all cursor-pointer"
        >
          [ &larr; RETURN_TO_PROBLEM_LIST ]
        </button>
      </div>
    );
  }

  return (
    <ProblemWorkspacePage
      question={activeProblemQuestion}
      allQuestions={allQuestions}
      progress={store.progress[String(activeProblemQuestion.id)] || { questionId: activeProblemQuestion.id, status: 'todo', isFavorite: false }}
      companyId={store.selectedCompany || 'google'}
      onBack={handleBack}
      onNavigateToProblem={(nextId) => navigate(`/problem/${nextId}`)}
      onSaveProgress={(patch) => onSaveProgressPatch(activeProblemQuestion.id, patch)}
    />
  );
};

// ====================================================================
// Dashboard Route View (/dashboard and /dashboard/company/:companySlug)
// ====================================================================
interface DashboardViewProps {
  allQuestions: Question[];
  isLoading: boolean;
  error: string | null;
  store: UserStoreState;
  updateStore: (patch: Partial<UserStoreState>) => void;
  handleUpdateStatus: (id: number | string, status: ProblemStatus) => void;
  handleToggleFavorite: (id: number | string) => void;
  handleRandomRoulette: (pool: Question[]) => void;
  setShowOverlapModal: (v: boolean) => void;
  setShowMockModal: (v: boolean) => void;
  setShowAnalyticsModal: (v: boolean) => void;
  setShowShortcutsModal: (v: boolean) => void;
  setShowPlannerModal: (v: boolean) => void;
  setShowFlashcardModal: (v: boolean) => void;
  setShowLeetCodeSyncModal: (v: boolean) => void;
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  setHotkeysQuestions: (qs: Question[]) => void;
  onNavigateOverview?: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  allQuestions,
  isLoading,
  error,
  store,
  updateStore,
  handleUpdateStatus,
  handleToggleFavorite,
  handleRandomRoulette,
  setShowOverlapModal,
  setShowMockModal,
  setShowAnalyticsModal,
  setShowShortcutsModal,
  setShowPlannerModal,
  setShowFlashcardModal,
  setShowLeetCodeSyncModal,
  focusedIndex,
  setFocusedIndex,
  setHotkeysQuestions,
  onNavigateOverview,
}) => {
  const { companySlug } = useParams<{ companySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Active target company: URL slug has precedence
  const activeCompany = useMemo(() => {
    if (companySlug && companiesDict[companySlug]) {
      return companySlug;
    }
    return store.selectedCompany || 'google';
  }, [companySlug, store.selectedCompany]);

  // Sync activeCompany into store state
  useEffect(() => {
    if (activeCompany && store.selectedCompany !== activeCompany) {
      updateStore({ selectedCompany: activeCompany });
    }
  }, [activeCompany, store.selectedCompany, updateStore]);

  // Read filter state from searchParams
  const selectedTimeframe = (searchParams.get('timeframe') as Timeframe) || 'all';
  const selectedDifficulty = (searchParams.get('difficulty') as Difficulty | 'all') || 'all';
  const selectedStatus = (searchParams.get('status') as ProblemStatus | 'favorite' | 'due-review' | 'all') || 'all';
  const selectedTopic = searchParams.get('topic') || 'all';
  const curatedList = (searchParams.get('curated') || 'all') as UserStoreState['curatedList'];
  const sortBy = (searchParams.get('sort') as 'frequency' | 'acceptance' | 'id' | 'title' | 'difficulty' | 'status') || 'frequency';
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 50;

  // Helper to update URL searchParams (with { replace: true })
  const updateFilters = useCallback((patch: Record<string, string | number | undefined | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 'all' || (key === 'page' && val === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    // Reset page to 1 unless the page itself is being changed
    if (!('page' in patch)) {
      next.delete('page');
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle switching target company
  const handleSelectCompany = useCallback((cId: string) => {
    sounds.playClick();
    updateStore({ selectedCompany: cId });
    navigate(`/dashboard/company/${cId}${location.search}`);
  }, [navigate, location.search, updateStore]);

  // All distinct topics extracted from questions
  const topicsList = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => q.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allQuestions]);

  // Status counts for current company & timeframe
  const statusCounts = useMemo(() => {
    const company = activeCompany;
    const tf = selectedTimeframe;
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
  }, [allQuestions, activeCompany, selectedTimeframe, store.progress]);

  // Filtered & Sorted Questions
  const filteredQuestions = useMemo(() => {
    const company = activeCompany;
    const tf = selectedTimeframe;
    const query = searchQuery.toLowerCase().trim();

    return allQuestions.filter((q) => {
      // 1. Company filter
      const compData = q.companies[company];
      if (!compData) return false;

      // 2. Timeframe filter
      if (tf !== 'all' && !compData[tf]) return false;

      // 3. Curated list filter
      if (curatedList === 'blind75' && !isQuestionInTrack(q.id, 'blind75')) return false;
      if (curatedList === 'neetcode150' && !isQuestionInTrack(q.id, 'neetcode150')) return false;
      if (curatedList === 'striver180' && !isQuestionInTrack(q.id, 'striver180')) return false;
      if (curatedList === 'grind169' && !q.isGrind169) return false;

      // Tag filter
      if (store.selectedTag) {
        const itemProg = store.progress[String(q.id)];
        if (!itemProg?.tags?.includes(store.selectedTag)) return false;
      }

      // 4. Difficulty filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // 5. Topic filter
      if (selectedTopic !== 'all' && !q.topics.includes(selectedTopic)) {
        return false;
      }

      // 6. Status filter
      const p = store.progress[String(q.id)];
      const st = p?.status || 'todo';
      if (selectedStatus === 'favorite' && !p?.isFavorite) return false;
      if (selectedStatus === 'due-review' && !isDueForReview(p)) return false;
      if (
        selectedStatus !== 'all' &&
        selectedStatus !== 'favorite' &&
        selectedStatus !== 'due-review' &&
        st !== selectedStatus
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
      const getFreq = (item: Question) => {
        const str = item.companies[company]?.[tf] || item.companies[company]?.all || '0.0%';
        return parseFloat(str.replace('%', '')) || 0;
      };

      const getAcc = (item: Question) => {
        return parseFloat(item.acceptance.replace('%', '')) || 0;
      };

      let comparison = 0;
      switch (sortBy) {
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
          const rank: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
          comparison = rank[a.difficulty] - rank[b.difficulty];
          break;
        }
        case 'status': {
          const rank: Record<string, number> = { todo: 1, 'in-progress': 2, review: 3, solved: 4, mastered: 5 };
          const sa = store.progress[String(a.id)]?.status || 'todo';
          const sb = store.progress[String(b.id)]?.status || 'todo';
          comparison = rank[sa] - rank[sb];
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [allQuestions, activeCompany, selectedTimeframe, curatedList, store.selectedTag, store.progress, selectedDifficulty, selectedTopic, selectedStatus, searchQuery, sortBy, sortOrder]);

  const displayQuestions = useMemo(() => {
    if (curatedList === 'sprint30') {
      return filteredQuestions.slice(0, 30);
    }
    return filteredQuestions;
  }, [filteredQuestions, curatedList]);

  // Paginated Questions
  const totalPages = Math.ceil(displayQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayQuestions.slice(start, start + pageSize);
  }, [displayQuestions, currentPage, pageSize]);

  // Synchronize paginated questions for keyboard shortcuts in App
  useEffect(() => {
    setHotkeysQuestions(paginatedQuestions);
  }, [paginatedQuestions, setHotkeysQuestions]);

  // Reset focusedIndex when filter or page changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [activeCompany, selectedTimeframe, selectedDifficulty, selectedStatus, selectedTopic, curatedList, sortBy, sortOrder, searchQuery, currentPage, setFocusedIndex]);

  // Today solved count & streaks
  const todaySolvedCount = useMemo(() => {
    const today = getTodayKey();
    return store.activityLog[today] || 0;
  }, [store.activityLog]);

  const totalSolvedCount = useMemo(() => {
    return Object.values(store.progress).filter(
      (p) => p.status === 'solved' || p.status === 'mastered'
    ).length;
  }, [store.progress]);

  const { currentStreak } = useMemo(() => calculateStreaks(store.activityLog), [store.activityLog]);
  const activeCompanyMeta = companiesDict[activeCompany];

  // Bridge store shape to FilterBar
  const effectiveFilterState: UserStoreState = useMemo(() => ({
    ...store,
    selectedCompany: activeCompany,
    selectedTimeframe,
    selectedDifficulty,
    selectedStatus,
    selectedTopic,
    curatedList,
    sortBy,
    sortOrder,
    searchQuery,
  }), [store, activeCompany, selectedTimeframe, selectedDifficulty, selectedStatus, selectedTopic, curatedList, sortBy, sortOrder, searchQuery]);

  const handleFilterChange = useCallback((patch: Partial<UserStoreState>) => {
    if (patch.selectedCompany && patch.selectedCompany !== activeCompany) {
      handleSelectCompany(patch.selectedCompany);
      return;
    }

    const filterPatch: Record<string, string | number | undefined | null> = {};
    if (patch.selectedTimeframe !== undefined) filterPatch.timeframe = patch.selectedTimeframe;
    if (patch.selectedDifficulty !== undefined) filterPatch.difficulty = patch.selectedDifficulty;
    if (patch.selectedStatus !== undefined) filterPatch.status = patch.selectedStatus;
    if (patch.selectedTopic !== undefined) filterPatch.topic = patch.selectedTopic;
    if (patch.curatedList !== undefined) filterPatch.curated = patch.curatedList;
    if (patch.sortBy !== undefined) filterPatch.sort = patch.sortBy;
    if (patch.sortOrder !== undefined) filterPatch.order = patch.sortOrder;
    if (patch.searchQuery !== undefined) filterPatch.search = patch.searchQuery;

    const storePatch: Partial<UserStoreState> = {};
    if (patch.viewMode !== undefined) storePatch.viewMode = patch.viewMode;
    if (patch.soundEnabled !== undefined) storePatch.soundEnabled = patch.soundEnabled;
    if (patch.dailyGoal !== undefined) storePatch.dailyGoal = patch.dailyGoal;
    if (Object.keys(storePatch).length > 0) {
      updateStore(storePatch);
    }

    if (Object.keys(filterPatch).length > 0) {
      updateFilters(filterPatch);
    }
  }, [activeCompany, handleSelectCompany, updateFilters, updateStore]);

  const handleOpenProblem = (q: Question | number | string) => {
    const qId = typeof q === 'object' ? q.id : q;
    navigate(`/problem/${qId}`);
  };

  return (
    <>
      {/* Top Navbar */}
      <Navbar
        companies={companiesDict}
        selectedCompanyId={activeCompany}
        onSelectCompany={handleSelectCompany}
        state={effectiveFilterState}
        onUpdateState={handleFilterChange}
        filteredQuestions={filteredQuestions}
        totalSolved={totalSolvedCount}
        currentStreak={currentStreak}
        onOpenOverlap={() => setShowOverlapModal(true)}
        onOpenMock={() => setShowMockModal(true)}
        onOpenAnalytics={() => setShowAnalyticsModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onRandomRoulette={() => handleRandomRoulette(filteredQuestions)}
        onOpenPlanner={() => setShowPlannerModal(true)}
        onOpenFlashcards={() => setShowFlashcardModal(true)}
        onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
        onGoHome={() => {
          if (isAuthenticated) {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }}
        onNavigateOverview={onNavigateOverview}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Company Header Banner */}
        <div className="terminal-panel p-5 relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col gap-4 font-mono">
            {/* Top row: Company details + Timeframe selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <CompanyLogo companyId={activeCompany} size="lg" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-wider text-primary uppercase">
                      &gt; {activeCompanyMeta?.name?.toUpperCase() || activeCompany.toUpperCase()}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-surfaceElevated text-primaryDim border border-primaryDim/40 font-bold">
                      [{activeCompanyMeta?.tier || 'TECH'}]
                    </span>
                    {activeCompanyMeta?.thirtyDaysCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-[2px] bg-surfaceElevated text-medium border border-medium/40">
                        <Flame className="w-3.5 h-3.5 text-medium" />
                        [{activeCompanyMeta.thirtyDaysCount} HOT IN 30D]
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-textMuted mt-1 font-mono">
                    Verified interview dataset curated for {activeCompanyMeta?.name || activeCompany}.
                  </p>

                  {/* Company stats pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono">
                    <span className="text-textSecondary">
                      [TOTAL: <strong className="text-primary">{activeCompanyMeta?.totalQuestions || 0}</strong>]
                    </span>
                    <span className="text-easy">
                      [EASY: {activeCompanyMeta?.diffCounts?.Easy || 0}]
                    </span>
                    <span className="text-medium">
                      [MED: {activeCompanyMeta?.diffCounts?.Medium || 0}]
                    </span>
                    <span className="text-hard">
                      [HARD: {activeCompanyMeta?.diffCounts?.Hard || 0}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeframe selector tabs */}
              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">
                  &gt; RECENCY_TIMEFRAME
                </span>
                <TimeframeTabs
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={(tf) => updateFilters({ timeframe: tf })}
                  companyMeta={activeCompanyMeta}
                />
              </div>
            </div>

            {/* Quick Switch Pills for Top Companies & Daily Goal Tracker */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Quick switch company buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-textMuted mr-1 font-bold hidden lg:inline">&gt; JUMP:</span>
                {TOP_FAANG_PILLS.map((cId) => {
                  const isCur = activeCompany === cId;
                  const cMeta = companiesDict[cId];
                  return (
                    <button
                      key={cId}
                      onClick={() => handleSelectCompany(cId)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] font-mono text-xs font-bold transition-all border ${
                        isCur
                          ? 'bg-primary text-black border-borderActive shadow-terminal-glow'
                          : 'bg-surface text-textSecondary border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      <CompanyLogo companyId={cId} size="sm" />
                      <span>[{cMeta?.name || cId}]</span>
                    </button>
                  );
                })}
              </div>

              {/* Today's Goal Progress */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-surface border border-border shrink-0 font-mono">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-textSecondary">
                  GOAL: <strong className="text-primary">{todaySolvedCount}</strong>/<span className="text-primaryDim">{store.dailyGoal}</span>
                </span>
                <div className="w-14 h-1 bg-surfaceElevated border border-border overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (todaySolvedCount / store.dailyGoal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <FilterBar
          state={effectiveFilterState}
          onChange={handleFilterChange}
          statusCounts={statusCounts}
          topicsList={topicsList}
        />

        {/* Problem List or Grid View */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-textSecondary gap-3 font-mono">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">&gt; Loading question index...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-error/15 border border-error/40 rounded-[2px] text-error text-center font-mono text-xs">
            [ERROR: {error}]
          </div>
        ) : (
          <>
            {store.viewMode === 'table' ? (
              <QuestionTable
                questions={paginatedQuestions}
                progress={store.progress}
                selectedCompany={activeCompany}
                selectedTimeframe={selectedTimeframe}
                focusedIndex={focusedIndex}
                onUpdateStatus={handleUpdateStatus}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetail={handleOpenProblem}
                onStartTimer={handleOpenProblem}
                onSelectRow={setFocusedIndex}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    progress={store.progress[String(q.id)]}
                    selectedCompany={activeCompany}
                    selectedTimeframe={selectedTimeframe}
                    isFocused={idx === focusedIndex}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetail={handleOpenProblem}
                    onStartTimer={handleOpenProblem}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {displayQuestions.length > pageSize && (
              <div className="flex items-center justify-between py-3 border-t border-border px-2 text-xs font-mono">
                <span className="text-textMuted">
                  Showing <strong className="text-primary">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-primary">
                    {Math.min(currentPage * pageSize, displayQuestions.length)}
                  </strong>{' '}
                  of <strong className="text-primary">{displayQuestions.length}</strong> problems
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-[2px] bg-surface border border-border text-textSecondary hover:text-primary hover:border-primaryDim disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    [ PREV ]
                  </button>

                  <span className="px-2.5 py-1 font-mono text-textPrimary bg-surface border border-border rounded-[2px]">
                    PAGE <span className="text-primary font-bold">{currentPage}</span>/{totalPages}
                  </span>

                  <button
                    onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-[2px] bg-surface border border-border text-textSecondary hover:text-primary hover:border-primaryDim disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    [ NEXT ]
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-surface py-5 px-4 sm:px-6 text-center text-xs font-mono text-textMuted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">&gt; CHEAT_CODE</span>
            <span>•</span>
            <span>659 Companies • 3,399 Questions</span>
            <span>•</span>
            <span className="text-textSecondary">SNAPSHOT: 2026</span>
          </div>
          <div className="flex items-center gap-3 text-textSecondary">
            <button onClick={() => setShowShortcutsModal(true)} className="hover:text-primary transition-colors cursor-pointer">
              [HOTKEYS (?)]
            </button>
            <span>•</span>
            <a
              href="https://github.com/Kitchenwasher/leetcode-company-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              [GITHUB_REPO]
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

// ====================================================================
// Root App Component with React Router
// ====================================================================
export const App: React.FC = () => {
  const { user, showAuthModal, setShowAuthModal, setShowSubscriptionModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [store, setStore] = useState<UserStoreState>(() => loadStoredState(user?.id));
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keyboard navigation focused row & active questions list for hotkeys
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [hotkeysQuestions, setHotkeysQuestions] = useState<Question[]>([]);

  // Active Modals
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState<boolean>(false);
  const [showMockModal, setShowMockModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showPlannerModal, setShowPlannerModal] = useState<boolean>(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState<boolean>(false);
  const [showLeetCodeSyncModal, setShowLeetCodeSyncModal] = useState<boolean>(false);

  useEffect(() => {
    (window as any).__openAuthModal = () => setShowAuthModal(true);
    (window as any).__openSubscriptionModal = () => setShowSubscriptionModal(true);
    (window as any).__openShortcutsModal = () => setShowShortcutsModal(true);
  }, [setShowAuthModal, setShowSubscriptionModal]);

  // Reload store when user changes
  useEffect(() => {
    if (user?.id) {
      setStore(loadStoredState(user.id));
    }
  }, [user?.id]);

  // Save to user-scoped local storage whenever store changes
  useEffect(() => {
    if (user?.id) {
      saveStoredState(store, user.id);
    }
  }, [store, user?.id]);

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

  const handleBatchUpdateStatus = useCallback((questionIds: (number | string)[], newStatus: ProblemStatus) => {
    setStore((prev) => {
      const nextProg = { ...prev.progress };
      const now = new Date().toISOString();
      questionIds.forEach((qid) => {
        const idStr = String(qid);
        nextProg[idStr] = {
          ...(nextProg[idStr] || { questionId: qid, isFavorite: false }),
          status: newStatus,
          lastSolvedAt: now,
        };
      });
      return { ...prev, progress: nextProg };
    });
  }, []);

  // Random Roulette
  const handleRandomRoulette = (pool: Question[]) => {
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];
    sounds.playSuccess();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFFF00', '#FFF94D', '#B8B800'],
    });
    navigate(`/problem/${chosen.id}`);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // Handle Escape
      if (e.key === 'Escape') {
        if (location.pathname.startsWith('/problem/')) {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate(`/dashboard/company/${store.selectedCompany || 'google'}`);
          }
          return;
        }
        setDetailQuestion(null);
        setShowOverlapModal(false);
        setShowMockModal(false);
        setShowAnalyticsModal(false);
        setShowShortcutsModal(false);
        return;
      }

      // In problem workspace or if modal open, do not trigger background list hotkeys
      if (
        location.pathname.startsWith('/problem/') ||
        detailQuestion ||
        showOverlapModal ||
        showMockModal ||
        showAnalyticsModal ||
        showShortcutsModal
      ) {
        return;
      }

      // Only on dashboard routes
      if (!location.pathname.startsWith('/dashboard')) {
        return;
      }

      if (e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(hotkeysQuestions.length - 1, prev + 1));
        return;
      }

      if (e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const activeQ = hotkeysQuestions[focusedIndex];
        if (activeQ) {
          navigate(`/problem/${activeQ.id}`);
        }
        return;
      }

      if (e.key === ' ' || e.key === 'x') {
        e.preventDefault();
        const activeQ = hotkeysQuestions[focusedIndex];
        if (activeQ) {
          const current = store.progress[String(activeQ.id)]?.status || 'todo';
          const nextMap: Record<ProblemStatus, ProblemStatus> = {
            todo: 'in-progress',
            'in-progress': 'solved',
            solved: 'review',
            review: 'mastered',
            mastered: 'todo',
          };
          const nextSt = nextMap[current];
          handleUpdateStatus(activeQ.id, nextSt);
          if (nextSt === 'solved' || nextSt === 'mastered') {
            sounds.playSuccess();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#FFFF00', '#FFF94D', '#B8B800'],
            });
          } else {
            sounds.playClick();
          }
        }
        return;
      }

      if (e.key === 'b') {
        e.preventDefault();
        const activeQ = hotkeysQuestions[focusedIndex];
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
        handleRandomRoulette(hotkeysQuestions);
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
  }, [location.pathname, hotkeysQuestions, focusedIndex, detailQuestion, showOverlapModal, showMockModal, showAnalyticsModal, showShortcutsModal, store.progress, store.selectedCompany, navigate, handleToggleFavorite, handleUpdateStatus]);

  const handleImportBackup = useCallback((imported: UserStoreState) => {
    setStore(imported);
    saveStoredState(imported);
  }, []);

  const handleResetProgress = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      progress: {},
      activityLog: {},
    }));
    sounds.playClick();
  }, []);

  const activeCompanyMeta = companiesDict[store.selectedCompany || 'google'];

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col font-mono selection:bg-primary/30 selection:text-primary bg-ambient-grid transition-colors">
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <LandingPage
              onGetStarted={() => {
                sounds.playClick();
                navigate('/dashboard');
              }}
              onSignIn={() => {
                sounds.playClick();
                setShowAuthModal(true);
              }}
            />
          }
        />

        {/* Dashboard / Overview Home Page */}
        <Route
          path="/dashboard"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate(`/dashboard/company/${store.selectedCompany || 'google'}`)}
            >
              <OverviewPage
                questions={allQuestions}
                companies={companiesDict}
                store={store}
                onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
                onNavigateToCompany={(slug: string) => {
                  navigate(`/questions?company=${slug}`);
                }}
                onNavigateToQuestions={() => navigate('/questions')}
                onOpenMockModal={() => setShowMockModal(true)}
              />
            </AppSidebarLayout>
          }
        />

        {/* Overview Alias */}
        <Route path="/overview" element={<Navigate to="/dashboard" replace />} />

        {/* Unified Questions Explorer */}
        <Route
          path="/questions"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => {
                const searchInput = document.querySelector('input[placeholder*="Search by ID"]') as HTMLInputElement;
                if (searchInput) searchInput.focus();
              }}
            >
              <QuestionsPage
                questions={allQuestions}
                companies={companiesDict}
                store={store}
                onUpdateStatus={handleUpdateStatus}
                onToggleFavorite={handleToggleFavorite}
                onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
              />
            </AppSidebarLayout>
          }
        />

        {/* Companies Directory Page */}
        <Route
          path="/companies"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate('/questions')}
            >
              <CompaniesPage
                companies={companiesDict}
                questions={allQuestions}
                onSelectCompany={(slug) => {
                  setStore((prev) => ({ ...prev, selectedCompany: slug }));
                  navigate(`/dashboard/company/${slug}`);
                }}
              />
            </AppSidebarLayout>
          }
        />

        {/* Practice Page */}
        <Route
          path="/practice"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate('/questions')}
            >
              <PracticePage
                questions={allQuestions}
                store={store}
                onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
              />
            </AppSidebarLayout>
          }
        />

        {/* Mock Interview Page */}
        <Route
          path="/mock-interview"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate('/questions')}
            >
              <MockInterviewPage
                questions={allQuestions}
                companies={companiesDict}
                store={store}
                onOpenMockModal={() => setShowMockModal(true)}
              />
            </AppSidebarLayout>
          }
        />

        {/* Progress Page */}
        <Route
          path="/progress"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate('/questions')}
            >
              <ProgressPage
                questions={allQuestions}
                store={store}
              />
            </AppSidebarLayout>
          }
        />

        {/* Community Page */}
        <Route
          path="/community"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate('/questions')}
            >
              <CommunityPage />
            </AppSidebarLayout>
          }
        />

        {/* Bookmarks Page */}
        <Route
          path="/bookmarks"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate('/questions')}
            >
              <BookmarksPage
                questions={allQuestions}
                store={store}
                onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
                onToggleFavorite={handleToggleFavorite}
                onUpdateStatus={handleUpdateStatus}
              />
            </AppSidebarLayout>
          }
        />

        {/* Settings Page */}
        <Route
          path="/settings"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => navigate(`/dashboard/company/${store.selectedCompany || 'google'}`)}
            >
              <SettingsPage
                store={store}
                questions={allQuestions}
                onImportBackup={handleImportBackup}
                onResetProgress={handleResetProgress}
              />
            </AppSidebarLayout>
          }
        />

        <Route
          path="/dashboard/company/:companySlug"
          element={
            <AppSidebarLayout
              store={store}
              onOpenMockModal={() => setShowMockModal(true)}
              onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
              onOpenPlanner={() => setShowPlannerModal(true)}
              onOpenFlashcards={() => setShowFlashcardModal(true)}
              onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
              onSearchFocus={() => {
                const searchInput = document.querySelector('input[placeholder*="filter query"]') as HTMLInputElement;
                if (searchInput) searchInput.focus();
              }}
              hideTopBar={true}
            >
              <DashboardView
                allQuestions={allQuestions}
                isLoading={isLoading}
                error={error}
                store={store}
                updateStore={updateStore}
                handleUpdateStatus={handleUpdateStatus}
                handleToggleFavorite={handleToggleFavorite}
                handleRandomRoulette={handleRandomRoulette}
                setShowOverlapModal={setShowOverlapModal}
                setShowMockModal={setShowMockModal}
                setShowAnalyticsModal={setShowAnalyticsModal}
                setShowShortcutsModal={setShowShortcutsModal}
                setShowPlannerModal={setShowPlannerModal}
                setShowFlashcardModal={setShowFlashcardModal}
                setShowLeetCodeSyncModal={setShowLeetCodeSyncModal}
                focusedIndex={focusedIndex}
                setFocusedIndex={setFocusedIndex}
                setHotkeysQuestions={setHotkeysQuestions}
                onNavigateOverview={() => navigate('/overview')}
              />
            </AppSidebarLayout>
          }
        />

        {/* Dedicated Problem Workspace */}
        <Route
          path="/problem/:problemId"
          element={
            <ProblemRouteView
              allQuestions={allQuestions}
              isLoading={isLoading}
              store={store}
              onSaveProgressPatch={handleSaveProgressPatch}
            />
          }
        />

        {/* Catch-all redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      {detailQuestion && (
        <QuestionDetailModal
          question={detailQuestion}
          progress={store.progress[String(detailQuestion.id)]}
          companyId={store.selectedCompany}
          onClose={() => setDetailQuestion(null)}
          onSaveProgress={(patch) => handleSaveProgressPatch(detailQuestion.id, patch)}
        />
      )}

      {showOverlapModal && (
        <CompanyOverlapModal
          questions={allQuestions}
          companies={companiesDict}
          progress={store.progress}
          onClose={() => setShowOverlapModal(false)}
          onSelectQuestion={(q) => navigate(`/problem/${q.id}`)}
        />
      )}

      {showMockModal && (
        <MockInterviewModal
          company={store.selectedCompany}
          companyMeta={activeCompanyMeta}
          questions={allQuestions}
          onClose={() => setShowMockModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {showAnalyticsModal && (
        <AnalyticsModal
          state={store}
          questions={allQuestions}
          companies={companiesDict}
          onClose={() => setShowAnalyticsModal(false)}
          onImportBackup={handleImportBackup}
          onLoadDemoData={() => {
            const demo = generateDemoProgress(allQuestions);
            setStore((prev) => ({
              ...prev,
              progress: { ...prev.progress, ...demo.progress },
              activityLog: { ...prev.activityLog, ...demo.activityLog },
            }));
            sounds.playSuccess();
          }}
          onResetProgress={handleResetProgress}
        />
      )}

      {showShortcutsModal && (
        <KeyboardHelpModal onClose={() => setShowShortcutsModal(false)} />
      )}

      <AuthModal onSuccess={() => navigate('/overview')} />
      <SubscriptionModal />

      <PrepPlannerModal
        isOpen={showPlannerModal}
        onClose={() => setShowPlannerModal(false)}
        companies={companiesDict}
        allQuestions={allQuestions}
        progress={store.progress}
        onSelectCompany={(cId) => {
          updateStore({ selectedCompany: cId });
          navigate(`/dashboard/company/${cId}`);
        }}
      />

      <FlashcardModal
        isOpen={showFlashcardModal}
        onClose={() => setShowFlashcardModal(false)}
        questions={allQuestions}
        progress={store.progress}
        onUpdateStatus={handleUpdateStatus}
      />

      <LeetCodeSyncModal
        isOpen={showLeetCodeSyncModal}
        onClose={() => setShowLeetCodeSyncModal(false)}
        allQuestions={allQuestions}
        onBatchUpdateStatus={handleBatchUpdateStatus}
      />
    </div>
  );
};
