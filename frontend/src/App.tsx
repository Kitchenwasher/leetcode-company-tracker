import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Question, CompanyMeta, UserProgressItem, UserStoreState, ProblemStatus, Timeframe, Difficulty } from './types';
import companyMetaData from './data/company_meta.json';
import {
  loadStoredState, saveStoredState, getTodayKey, calculateStreaks,
  isDueForReview, generateDemoProgress
} from './services/storage';
import { progressApi } from './api/progressApi';
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
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppSidebarLayout } from './components/AppSidebarLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OverviewPage } from './components/OverviewPage';
import { QuestionsPage } from './components/QuestionsPage';
import { PracticePage } from './components/PracticePage';
import { MockInterviewPage } from './components/MockInterviewPage';
import { ProgressPage } from './components/ProgressPage';
import { CommunityPage } from './components/CommunityPage';
import { BookmarksPage } from './components/BookmarksPage';
import { CompaniesPage } from './components/CompaniesPage';
import { SettingsPage } from './components/SettingsPage';
import { SubscriptionSuccessPage } from './components/SubscriptionSuccessPage';
import { LegalPage } from './components/LegalPage';
import { SmoothScrollProvider } from './components/ui/SmoothScrollProvider';
import { ClickSpark } from './components/ui/ClickSpark';
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
    navigate(`/questions${store.selectedCompany ? `?company=${encodeURIComponent(store.selectedCompany.toLowerCase())}` : ''}`);
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
      key={activeProblemQuestion.id}
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
// Company Deep-Link Redirect Component (/company/:slug & /dashboard/company/:slug)
// ====================================================================
const CompanyRedirect: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  const target = companySlug
    ? `/questions?company=${encodeURIComponent(companySlug.toLowerCase())}${query ? `&${query}` : ''}`
    : `/questions${query ? `?${query}` : ''}`;
  return <Navigate to={target} replace />;
};

// ====================================================================
// Root App Component with React Router
// ====================================================================
export const App: React.FC = () => {
  const { user, isAuthenticated, showAuthModal, setShowAuthModal, setShowSubscriptionModal } = useAuth();
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

  // Sync progress and preferences from Neon DB when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id || user.id === 'guest') return;

    let isCancelled = false;

    const fetchServerData = async () => {
      try {
        const [serverProgress, stats] = await Promise.all([
          progressApi.getProgress().catch(() => ({})),
          progressApi.getStats().catch(() => null),
        ]);

        if (isCancelled) return;

        setStore((prev) => {
          const mergedProgress = { ...prev.progress, ...serverProgress };
          const mergedActivity = stats?.activityLog ? { ...prev.activityLog, ...stats.activityLog } : prev.activityLog;

          return {
            ...prev,
            progress: mergedProgress,
            activityLog: mergedActivity,
            dailyGoal: user.dailyTarget || prev.dailyGoal,
            selectedCompany: user.targetCompany || prev.selectedCompany,
          };
        });
      } catch (err) {
        console.warn('Failed to load user progress from Neon DB:', err);
      }
    };

    fetchServerData();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.dailyTarget, user?.targetCompany]);

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
    } else if (!isNowSolved && wasAlreadySolved && updatedActivity[todayStr]) {
      updatedActivity[todayStr] = Math.max(0, updatedActivity[todayStr] - 1);
    }

    const updatedItem = {
      ...prevItem,
      status: newStatus,
      lastSolvedAt: isNowSolved ? new Date().toISOString() : prevItem.lastSolvedAt,
      solveCount: isNowSolved ? (prevItem.solveCount || 0) + 1 : prevItem.solveCount,
    };

    setStore((prev) => ({
      ...prev,
      activityLog: updatedActivity,
      progress: {
        ...prev.progress,
        [idStr]: updatedItem,
      },
    }));

    // Persist to Neon DB if authenticated
    if (isAuthenticated && user?.id && user.id !== 'guest') {
      const qNum = parseInt(idStr, 10);
      if (!isNaN(qNum)) {
        progressApi.updateQuestionProgress(qNum, {
          status: newStatus,
          lastSolvedAt: updatedItem.lastSolvedAt,
          solveCount: updatedItem.solveCount,
        }).catch((err) => console.warn('Failed to sync question status to Neon DB:', err));
      }
    }
  };

  const handleToggleFavorite = (qId: number | string) => {
    const idStr = String(qId);
    const prevItem = store.progress[idStr] || {
      questionId: qId,
      status: 'todo',
      isFavorite: false,
    };

    const nextFavorite = !prevItem.isFavorite;

    setStore((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        [idStr]: {
          ...prevItem,
          isFavorite: nextFavorite,
        },
      },
    }));

    // Persist to Neon DB if authenticated
    if (isAuthenticated && user?.id && user.id !== 'guest') {
      const qNum = parseInt(idStr, 10);
      if (!isNaN(qNum)) {
        progressApi.updateQuestionProgress(qNum, {
          isFavorite: nextFavorite,
        }).catch((err) => console.warn('Failed to sync favorite to Neon DB:', err));
      }
    }
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

    // Persist to Neon DB if authenticated
    if (isAuthenticated && user?.id && user.id !== 'guest') {
      const qNum = parseInt(idStr, 10);
      if (!isNaN(qNum)) {
        progressApi.updateQuestionProgress(qNum, patch).catch((err) =>
          console.warn('Failed to sync progress patch to Neon DB:', err)
        );
      }
    }
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

    // Persist to Neon DB if authenticated
    if (isAuthenticated && user?.id && user.id !== 'guest') {
      progressApi.batchUpdateProgress(questionIds, newStatus).catch((err) =>
        console.warn('Failed to sync batch progress to Neon DB:', err)
      );
    }
  }, [isAuthenticated, user?.id]);

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
            navigate(`/questions${store.selectedCompany ? `?company=${encodeURIComponent(store.selectedCompany.toLowerCase())}` : ''}`);
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



      // Global Shortcuts Modal (?)
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      // List navigation hotkeys on dashboard / questions routes
      if (!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/questions')) {
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

  const handleSelectCompany = useCallback((slug: string) => {
    setStore((prev) => {
      if (prev.selectedCompany?.toLowerCase() === slug.toLowerCase()) return prev;
      return { ...prev, selectedCompany: slug };
    });
  }, []);

  const activeCompanyMeta = companiesDict[store.selectedCompany || 'google'];

  return (
    <SmoothScrollProvider>
      <ClickSpark />
      <div className="min-h-screen bg-background text-textPrimary flex flex-col font-mono selection:bg-primary/30 selection:text-primary bg-ambient-grid transition-colors">
        <Routes>
          {/* Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                onGetStarted={() => {
                  sounds.playClick();
                  if (isAuthenticated) {
                    navigate('/dashboard');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                onSignIn={() => {
                  sounds.playClick();
                  setShowAuthModal(true);
                }}
              />
            }
          />

          {/* Public Compliance Legal Pages (Required for Google AdSense) */}
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />

          {/* Persistent Protected App Layout with smoothly gliding sidebar navigation */}
          <Route
            element={
              <ProtectedRoute>
                <AppSidebarLayout
                  store={store}
                  onOpenMockModal={() => setShowMockModal(true)}
                  onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
                  onOpenPlanner={() => setShowPlannerModal(true)}
                  onOpenFlashcards={() => setShowFlashcardModal(true)}
                  onOpenLeetCodeSync={() => setShowLeetCodeSyncModal(true)}
                />
              </ProtectedRoute>
            }
          >
            {/* Dashboard / Overview */}
            <Route
              path="/dashboard"
              element={
                <OverviewPage
                  questions={allQuestions}
                  companies={companiesDict}
                  store={store}
                  onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
                  onNavigateToCompany={(slug: string) => {
                    navigate(`/questions?company=${encodeURIComponent(slug.toLowerCase())}`);
                  }}
                  onNavigateToQuestions={() => navigate('/questions')}
                  onOpenMockModal={() => setShowMockModal(true)}
                />
              }
            />

            {/* Overview Alias */}
            <Route path="/overview" element={<Navigate to="/dashboard" replace />} />

            {/* Unified Questions Explorer */}
            <Route
              path="/questions"
              element={
                <QuestionsPage
                  questions={allQuestions}
                  companies={companiesDict}
                  store={store}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleFavorite={handleToggleFavorite}
                  onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
                  onSelectCompany={handleSelectCompany}
                />
              }
            />

            {/* Companies Directory Page */}
            <Route
              path="/companies"
              element={
                <CompaniesPage
                  companies={companiesDict}
                  questions={allQuestions}
                  onSelectCompany={(slug) => {
                    handleSelectCompany(slug);
                    navigate(`/questions?company=${encodeURIComponent(slug.toLowerCase())}`);
                  }}
                />
              }
            />

            {/* Practice Page */}
            <Route
              path="/practice"
              element={
                <PracticePage
                  questions={allQuestions}
                  store={store}
                  onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
                />
              }
            />

            {/* Mock Interview Page */}
            <Route
              path="/mock-interview"
              element={
                <MockInterviewPage
                  questions={allQuestions}
                  companies={companiesDict}
                  store={store}
                  onOpenMockModal={() => setShowMockModal(true)}
                />
              }
            />

            {/* Progress Page */}
            <Route
              path="/progress"
              element={
                <ProgressPage
                  questions={allQuestions}
                  store={store}
                />
              }
            />

            {/* Community Page */}
            <Route path="/community" element={<CommunityPage />} />

            {/* Bookmarks Page */}
            <Route
              path="/bookmarks"
              element={
                <BookmarksPage
                  questions={allQuestions}
                  store={store}
                  onNavigateToProblem={(id) => navigate(`/problem/${id}`)}
                  onToggleFavorite={handleToggleFavorite}
                  onUpdateStatus={handleUpdateStatus}
                />
              }
            />

            {/* Settings Page */}
            <Route
              path="/settings"
              element={
                <SettingsPage
                  store={store}
                  questions={allQuestions}
                  onImportBackup={handleImportBackup}
                  onResetProgress={handleResetProgress}
                />
              }
            />
          </Route>

        {/* Company Redirects (auto-redirect to /questions?company=...) */}
        <Route path="/dashboard/company/:companySlug" element={<CompanyRedirect />} />
        <Route path="/company/:companySlug" element={<CompanyRedirect />} />
        <Route path="/dashboard/company" element={<Navigate to="/companies" replace />} />
        <Route path="/company" element={<Navigate to="/companies" replace />} />

        {/* Dedicated Problem Workspace */}
        <Route
          path="/problem/:problemId"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ProblemRouteView
                  allQuestions={allQuestions}
                  isLoading={isLoading}
                  store={store}
                  onSaveProgressPatch={handleSaveProgressPatch}
                />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Subscription Success Page */}
        <Route
          path="/subscription-success"
          element={
            <ProtectedRoute>
              <SubscriptionSuccessPage />
            </ProtectedRoute>
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

      <AuthModal onSuccess={() => navigate('/dashboard')} />
      <SubscriptionModal />

      <PrepPlannerModal
        isOpen={showPlannerModal}
        onClose={() => setShowPlannerModal(false)}
        companies={companiesDict}
        allQuestions={allQuestions}
        progress={store.progress}
        onSelectCompany={(cId) => {
          updateStore({ selectedCompany: cId });
          navigate(`/questions?company=${encodeURIComponent(cId.toLowerCase())}`);
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
    </SmoothScrollProvider>
  );
};
