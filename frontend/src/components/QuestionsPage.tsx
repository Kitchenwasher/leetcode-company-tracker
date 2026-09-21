import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Star,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Building2,
  BookOpen,
  ArrowUpDown,
  Flame,
  ExternalLink,
  MoreVertical,
  Check,
  RotateCcw,
  Sparkles,
  Copy,
  Tag,
  BarChart2,
  Code2,
} from 'lucide-react';
import { Question, CompanyMeta, UserStoreState, ProblemStatus, Difficulty } from '../types';
import { isQuestionInTrack } from '../data/curatedLists';
import { sounds } from '../utils/sound';
import CompanyLogo, { CompanyLogoStack, getCompanyDisplayName } from './CompanyLogo';
import GlideSelect, { GlideSelectOption } from './ui/GlideSelect';
import { AdBanner } from './AdBanner';

interface QuestionsPageProps {
  questions: Question[];
  companies: Record<string, CompanyMeta>;
  store: UserStoreState;
  onUpdateStatus: (id: number | string, status: ProblemStatus) => void;
  onToggleFavorite: (id: number | string) => void;
  onNavigateToProblem: (id: number | string) => void;
  onSelectCompany?: (companyId: string) => void;
}

export const TOP_ALGORITHMS = [
  'Dynamic Programming',
  'Array',
  'String',
  'Hash Table',
  'Tree',
  'Graph',
  'Binary Search',
  'Two Pointers',
  'Greedy',
  'Stack',
  'Heap (Priority Queue)',
  'Sliding Window',
  'Backtracking',
  'Linked List',
  'Bit Manipulation',
  'Math',
];



export function matchesTopicFilter(selected: string, qTopics: string[]): boolean {
  if (!selected || selected === 'all') return true;
  if (!qTopics || qTopics.length === 0) return false;

  const s = selected.toLowerCase().trim();

  return qTopics.some((topic) => {
    const t = topic.toLowerCase().trim();
    if (t === s) return true;

    if (s === 'graph' || s === 'graphs') {
      return (
        t.includes('graph') ||
        t.includes('depth-first search') ||
        t.includes('breadth-first search') ||
        t.includes('union-find') ||
        t.includes('topological sort') ||
        t.includes('shortest path')
      );
    }

    if (s === 'tree' || s === 'trees') {
      return t.includes('tree');
    }

    if (s === 'dynamic programming' || s === 'dp') {
      return t.includes('dynamic programming') || t.includes('memoization');
    }

    if (s === 'array' || s === 'arrays') {
      return t.includes('array');
    }

    if (s === 'string' || s === 'strings') {
      return t.includes('string');
    }

    if (s === 'hash table' || s === 'hash map' || s === 'hashing') {
      return t.includes('hash');
    }

    if (s === 'stack') return t.includes('stack');
    if (s === 'queue') return t.includes('queue');
    if (s === 'heap' || s.includes('priority queue')) return t.includes('heap') || t.includes('priority queue');
    if (s === 'linked list') return t.includes('linked list');
    if (s === 'math') return t.includes('math') || t.includes('geometry');
    if (s === 'binary search') return t.includes('binary search');
    if (s === 'two pointers') return t.includes('two pointer') || t.includes('two-pointer');
    if (s === 'sliding window') return t.includes('sliding window');
    if (s === 'greedy') return t.includes('greedy');
    if (s === 'backtracking') return t.includes('backtracking');
    if (s === 'bit manipulation' || s === 'bit') return t.includes('bit');

    return t.includes(s) || s.includes(t);
  });
}

export const getRowStatusTheme = (st: ProblemStatus) => {
  switch (st) {
    case 'solved':
    case 'mastered':
      return {
        accentColor: '#10b981',
        textColor: '#34d399',
        surfaceColor: 'rgba(16, 185, 129, 0.12)',
        highlightColor: '#133526',
      };
    case 'in-progress':
      return {
        accentColor: '#3b82f6',
        textColor: '#60a5fa',
        surfaceColor: 'rgba(59, 130, 246, 0.12)',
        highlightColor: '#172554',
      };
    case 'review':
      return {
        accentColor: '#a855f7',
        textColor: '#c084fc',
        surfaceColor: 'rgba(168, 85, 247, 0.12)',
        highlightColor: '#261538',
      };
    default:
      return {
        accentColor: '#71717a',
        textColor: '#a1a1aa',
        surfaceColor: 'rgba(255, 255, 255, 0.04)',
        highlightColor: '#1c202a',
      };
  }
};

export const QuestionsPage: React.FC<QuestionsPageProps> = ({
  questions,
  companies,
  store,
  onUpdateStatus,
  onToggleFavorite,
  onNavigateToProblem,
  onSelectCompany,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active filters from URL search params
  const rawCompany = searchParams.get('company');
  const selectedCompany = rawCompany ? rawCompany.toLowerCase() : 'all';
  const selectedDifficulty = (searchParams.get('difficulty') as Difficulty | 'all') || 'all';
  const selectedTopic = searchParams.get('topic') || 'all';
  const selectedStatus = (searchParams.get('status') as ProblemStatus | 'favorite' | 'due-review' | 'all') || 'all';
  const curatedList = (searchParams.get('curated') || 'all') as UserStoreState['curatedList'];
  const sortBy = (searchParams.get('sort') as string) || 'recent';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 25;

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(curatedList !== 'all');
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | number | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = () => {
      setActiveMenuId(null);
      setActiveStatusMenuId(null);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const updateFilters = useCallback(
    (patch: Record<string, string | number | undefined | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, val]) => {
            if (
              val === undefined ||
              val === null ||
              val === '' ||
              val === 'all' ||
              (key === 'sort' && val === 'recent') ||
              (key === 'page' && val === 1)
            ) {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          });
          if (!('page' in patch)) {
            next.delete('page');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );



  // Topics list
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => q.topics?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [questions]);

  // Companies list
  const allCompaniesList = useMemo(() => {
    return Object.values(companies).sort((a, b) => (b.totalQuestions || 0) - (a.totalQuestions || 0));
  }, [companies]);

  // Filtered & sorted questions
  const filteredQuestions = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();

    return questions
      .filter((q) => {
        // 1. Company filter
        if (selectedCompany !== 'all') {
          const compKey = selectedCompany.toLowerCase();
          if (!q.companies[compKey] && !q.companies[selectedCompany]) return false;
        }

        // 2. Difficulty filter
        if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
          return false;
        }

        // 3. Topic filter
        if (selectedTopic !== 'all') {
          if (!matchesTopicFilter(selectedTopic, q.topics)) return false;
        }

        // 4. Curated lists
        if (curatedList === 'blind75' && !isQuestionInTrack(q.id, 'blind75')) return false;
        if (curatedList === 'neetcode150' && !isQuestionInTrack(q.id, 'neetcode150')) return false;
        if (curatedList === 'striver180' && !isQuestionInTrack(q.id, 'striver180')) return false;
        if (curatedList === 'sprint30' && !isQuestionInTrack(q.id, 'sprint30')) return false;
        if (curatedList === 'grind169' && !q.isGrind169) return false;

        // 5. Status filter
        const p = store.progress[String(q.id)];
        const st = p?.status || 'todo';
        if (selectedStatus === 'favorite' && !p?.isFavorite) return false;
        if (selectedStatus === 'due-review' && p?.status !== 'review') return false;
        if (
          selectedStatus !== 'all' &&
          selectedStatus !== 'favorite' &&
          selectedStatus !== 'due-review' &&
          st !== selectedStatus
        ) {
          return false;
        }

        // 6. Search query (fallback if query param in URL)
        if (rawQuery) {
          const matchesId = String(q.id) === rawQuery || String(q.id).includes(rawQuery);
          const matchesTitle = (q.title || '').toLowerCase().includes(rawQuery);
          if (!matchesId && !matchesTitle) return false;
        }

        return true;
      })
      .sort((a, b) => {

        const getFreq = (item: Question) => {
          if (selectedCompany !== 'all') {
            const compKey = selectedCompany.toLowerCase();
            const compObj = (item.companies && (item.companies[compKey] || item.companies[selectedCompany])) || {};
            const str =
              compObj.all ||
              compObj['thirty-days'] ||
              compObj['three-months'] ||
              compObj['six-months'] ||
              '0.0%';
            return parseFloat(String(str).replace('%', '')) || 0;
          }
          return Object.keys(item.companies || {}).length;
        };

        const getAcc = (item: Question) => {
          return parseFloat(String(item.acceptance || '0').replace('%', '')) || 0;
        };

        switch (sortBy) {
          case 'frequency':
            return getFreq(b) - getFreq(a);
          case 'acceptance':
            return getAcc(b) - getAcc(a);
          case 'id-asc':
            return (Number(a.id) || 0) - (Number(b.id) || 0);
          case 'id-desc':
            return (Number(b.id) || 0) - (Number(a.id) || 0);
          case 'title':
            return (a.title || '').localeCompare(b.title || '');
          case 'difficulty': {
            const rank: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
            return (rank[a.difficulty] || 2) - (rank[b.difficulty] || 2);
          }
          case 'recent':
          default:
            return (Number(a.id) || 0) - (Number(b.id) || 0);
        }
      });
  }, [
    questions,
    selectedCompany,
    selectedDifficulty,
    selectedTopic,
    curatedList,
    selectedStatus,
    searchQuery,
    sortBy,
    store.progress,
  ]);

  const totalCount = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, safePage, pageSize]);

  // Metrics
  const totalSolved = useMemo(() => {
    return Object.values(store.progress || {}).filter(
      (p) => p?.status === 'solved' || p?.status === 'mastered'
    ).length;
  }, [store.progress]);

  const percentSolved = Math.min(
    100,
    Math.round((totalSolved / Math.max(questions.length, 1)) * 100)
  );
  const remainingCount = Math.max(0, questions.length - totalSolved);

  // Dropdown Options for GlideSelect
  const companyGlideOptions: GlideSelectOption[] = useMemo(() => {
    const list: GlideSelectOption[] = [
      {
        value: 'all',
        label: 'All Companies',
        tag: `${allCompaniesList.length}`,
        searchText: 'All Companies',
      },
    ];
    const topTech = [
      'google',
      'amazon',
      'meta',
      'microsoft',
      'apple',
      'netflix',
      'uber',
      'adobe',
      'bloomberg',
      'tiktok',
      'oracle',
      'salesforce',
    ];

    topTech.forEach((id) => {
      list.push({
        value: id,
        label: (
          <span className="flex items-center gap-2 truncate">
            <CompanyLogo companyId={id} size="xs" showTooltip={false} />
            <span className="truncate">{getCompanyDisplayName(id)}</span>
          </span>
        ),
        tag: 'Top',
        searchText: getCompanyDisplayName(id),
      });
    });

    allCompaniesList
      .filter((c) => !topTech.includes(c.id.toLowerCase()))
      .forEach((c) => {
        list.push({
          value: c.id,
          label: (
            <span className="flex items-center gap-2 truncate">
              <CompanyLogo companyId={c.id} size="xs" showTooltip={false} />
              <span className="truncate">{c.name || c.id}</span>
            </span>
          ),
          tag: c.totalQuestions ? `${c.totalQuestions}` : undefined,
          searchText: c.name || c.id,
        });
      });

    return list;
  }, [allCompaniesList]);

  const difficultyGlideOptions: GlideSelectOption[] = useMemo(() => {
    const easyCount = questions.filter((q) => q.difficulty === 'Easy').length;
    const medCount = questions.filter((q) => q.difficulty === 'Medium').length;
    const hardCount = questions.filter((q) => q.difficulty === 'Hard').length;
    return [
      { value: 'all', label: 'All Difficulty', tag: `${questions.length}`, searchText: 'All Difficulty' },
      {
        value: 'Easy',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Easy</span>
          </span>
        ),
        tag: `${easyCount}`,
        searchText: 'Easy',
      },
      {
        value: 'Medium',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>Medium</span>
          </span>
        ),
        tag: `${medCount}`,
        searchText: 'Medium',
      },
      {
        value: 'Hard',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>Hard</span>
          </span>
        ),
        tag: `${hardCount}`,
        searchText: 'Hard',
      },
    ];
  }, [questions]);

  const topicGlideOptions: GlideSelectOption[] = useMemo(() => {
    const list: GlideSelectOption[] = [
      { value: 'all', label: 'All Topics', tag: `${questions.length}`, searchText: 'All Topics' },
    ];

    TOP_ALGORITHMS.forEach((algo) => {
      const matchCount = questions.filter((q) => matchesTopicFilter(algo, q.topics)).length;
      list.push({
        value: algo,
        label: algo,
        tag: `${matchCount}`,
        searchText: algo,
      });
    });

    const algoSet = new Set(TOP_ALGORITHMS.map((a) => a.toLowerCase()));
    allTopics
      .filter((t) => !algoSet.has(t.toLowerCase()))
      .forEach((t) => {
        const count = questions.filter((q) => q.topics.some((item) => item.toLowerCase() === t.toLowerCase())).length;
        list.push({
          value: t,
          label: t,
          tag: `${count}`,
          searchText: t,
        });
      });

    return list;
  }, [allTopics, questions]);

  const statusGlideOptions: GlideSelectOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Status', tag: `${questions.length}`, searchText: 'All Status' },
      {
        value: 'todo',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
            <span>Todo</span>
          </span>
        ),
        tag: 'New',
        searchText: 'Todo',
      },
      {
        value: 'in-progress',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span>In Progress</span>
          </span>
        ),
        tag: 'WIP',
        searchText: 'In Progress',
      },
      {
        value: 'solved',
        label: (
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Solved</span>
          </span>
        ),
        tag: `${totalSolved}`,
        searchText: 'Solved',
      },
      {
        value: 'favorite',
        label: (
          <span className="flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <span>Starred</span>
          </span>
        ),
        tag: 'Fav',
        searchText: 'Starred Favorite',
      },
    ],
    [questions.length, totalSolved]
  );

  const sortGlideOptions: GlideSelectOption[] = useMemo(
    () => [
      { value: 'recent', label: 'Default (ID)', tag: 'Default', searchText: 'Default ID' },
      { value: 'frequency', label: 'Frequency: High → Low', tag: 'Hot', searchText: 'Frequency Hot' },
      { value: 'acceptance', label: 'Acceptance: High → Low', tag: 'Acc', searchText: 'Acceptance Rate' },
      { value: 'id-asc', label: 'ID: 1 → N', tag: '1-N', searchText: 'ID Ascending' },
      { value: 'id-desc', label: 'ID: N → 1', tag: 'N-1', searchText: 'ID Descending' },
      { value: 'difficulty', label: 'Difficulty: Easy → Hard', tag: 'Diff', searchText: 'Difficulty' },
      { value: 'title', label: 'Title: A → Z', tag: 'A-Z', searchText: 'Title A-Z' },
    ],
    []
  );

  const rowStatusOptions: GlideSelectOption[] = useMemo(
    () => [
      {
        value: 'todo',
        label: (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
            <span>Todo</span>
          </span>
        ),
        searchText: 'Todo',
      },
      {
        value: 'in-progress',
        label: (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span>In Progress</span>
          </span>
        ),
        searchText: 'In Progress',
      },
      {
        value: 'solved',
        label: (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Solved</span>
          </span>
        ),
        searchText: 'Solved',
      },
      {
        value: 'review',
        label: (
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <span>Review</span>
          </span>
        ),
        searchText: 'Review',
      },
    ],
    []
  );

  const curatedOptions = [
    { value: 'all', label: 'All Questions' },
    { value: 'sprint30', label: 'Top 30 Sprint' },
    { value: 'blind75', label: 'Blind 75' },
    { value: 'neetcode150', label: 'NeetCode 150' },
    { value: 'striver180', label: 'Striver 180' },
    { value: 'grind169', label: 'Grind 169' },
  ];

  // Active filter pills list
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];

    if (selectedCompany !== 'all') {
      list.push({
        key: 'company',
        label: `Company: ${getCompanyDisplayName(selectedCompany)}`,
        clear: () => updateFilters({ company: 'all' }),
      });
    }

    if (selectedDifficulty !== 'all') {
      list.push({
        key: 'difficulty',
        label: `Difficulty: ${selectedDifficulty}`,
        clear: () => updateFilters({ difficulty: 'all' }),
      });
    }

    if (selectedTopic !== 'all') {
      list.push({
        key: 'topic',
        label: `Topic: ${selectedTopic}`,
        clear: () => updateFilters({ topic: 'all' }),
      });
    }

    if (selectedStatus !== 'all') {
      list.push({
        key: 'status',
        label: `Status: ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`,
        clear: () => updateFilters({ status: 'all' }),
      });
    }

    if (curatedList !== 'all') {
      const cur = curatedOptions.find((c) => c.value === curatedList);
      list.push({
        key: 'curated',
        label: `List: ${cur?.label || curatedList}`,
        clear: () => updateFilters({ curated: 'all' }),
      });
    }

    if (sortBy !== 'recent') {
      const activeSort = sortGlideOptions.find((s) => s.value === sortBy);
      list.push({
        key: 'sort',
        label: `Sort: ${activeSort?.searchText || sortBy}`,
        clear: () => updateFilters({ sort: 'recent' }),
      });
    }

    return list;
  }, [selectedCompany, selectedDifficulty, selectedTopic, selectedStatus, curatedList, sortBy, sortGlideOptions, updateFilters]);

  const clearAllFilters = () => {
    sounds.playClick();
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Pagination calculation
  const getPaginationPages = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Handpicked iconic benchmark interview questions (only top classic problems get 🔥 Popular)
  const isPopularQuestion = (q: Question) => {
    const id = Number(q.id);
    return (
      id === 1 ||
      id === 4 ||
      id === 15 ||
      id === 21 ||
      id === 33 ||
      id === 42 ||
      id === 53 ||
      id === 56 ||
      id === 70 ||
      id === 121 ||
      id === 146 ||
      id === 200 ||
      id === 206 ||
      id === 215 ||
      id === 238 ||
      id === 300 ||
      id === 322
    );
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-[#F3F4F6] font-sans">
      {/* 1. Page Header matching reference */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
            PRACTICE &gt; QUESTIONS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Questions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Find and practice company-specific coding questions.
          </p>
        </div>

        {/* Atmospheric Slogan matching reference image */}
        <div className="hidden md:block text-right select-none">
          <p className="text-base font-bold text-zinc-400 leading-tight">
            Better Developers
          </p>
          <p className="text-base font-bold text-purple-400/90 leading-tight">
            Brighter Futures.
          </p>
        </div>
      </div>

      {/* 2. Top 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Questions */}
        <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight leading-none font-sans">
              {questions.length.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-sans">Total Questions</p>
          </div>
        </div>

        {/* Card 2: Solved */}
        <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight leading-none font-sans">
              {totalSolved.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-sans">Solved ({percentSolved}%)</p>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight leading-none font-sans">
              {remainingCount.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-sans">Remaining</p>
          </div>
        </div>

        {/* Card 4: Action CTA Card */}
        <div
          onClick={() => {
            sounds.playClick();
            navigate('/practice');
          }}
          className="rounded-xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] hover:border-primary/40 p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white font-sans group-hover:text-primary transition-colors leading-tight">
                Keep practicing!
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                Consistency beats everything.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>

      {/* Top Banner Ad (Free Tier only) */}
      <AdBanner format="horizontal" variant="aws" slotId="questions-top-banner" className="my-1" />

      {/* 3. Search and Filters Toolbar matching reference image */}
      <div className="space-y-3 relative z-30">
        <div className="bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 flex-wrap lg:flex-nowrap relative z-30">


          {/* Company Filter */}
          <GlideSelect
            options={companyGlideOptions}
            value={selectedCompany}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ company: val });
            }}
            icon={<Building2 className="w-3.5 h-3.5" />}
            size="md"
            menuWidth={250}
            radius={12}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedCompany !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Company Filter"
            searchable
            searchPlaceholder="Search companies..."
          />

          {/* Difficulty Filter */}
          <GlideSelect
            options={difficultyGlideOptions}
            value={selectedDifficulty}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ difficulty: val as Difficulty | 'all' });
            }}
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            size="md"
            menuWidth={160}
            radius={12}
            accentColor={
              selectedDifficulty === 'Easy' ? '#34D399' :
              selectedDifficulty === 'Medium' ? '#FBBF24' :
              selectedDifficulty === 'Hard' ? '#FB7185' : 'var(--theme-accent, #A855F7)'
            }
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedDifficulty !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Difficulty Filter"
          />

          {/* Topic Filter */}
          <GlideSelect
            options={topicGlideOptions}
            value={selectedTopic}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ topic: val });
            }}
            icon={<Tag className="w-3.5 h-3.5" />}
            size="md"
            menuWidth={240}
            radius={12}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedTopic !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Topic Filter"
            searchable
            searchPlaceholder="Search topics..."
          />

          {/* Status Filter */}
          <GlideSelect
            options={statusGlideOptions}
            value={selectedStatus}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ status: val as ProblemStatus | 'favorite' | 'due-review' | 'all' });
            }}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            size="md"
            menuWidth={170}
            radius={12}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedStatus !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Problem Status Filter"
          />

          {/* Sort Dropdown */}
          <GlideSelect
            options={sortGlideOptions}
            value={sortBy}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ sort: val });
            }}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            size="md"
            menuWidth={210}
            radius={12}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={sortBy !== 'recent' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Sort Questions"
          />

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowAdvancedFilters(!showAdvancedFilters);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none border shrink-0 ${
              showAdvancedFilters || curatedList !== 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-[#161B22] text-zinc-300 hover:text-white border-white/[0.08] hover:border-white/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Advanced Filters</span>
          </button>
        </div>

        {/* Expandable Advanced Curated Study Sheets Bar */}
        {showAdvancedFilters && (
          <div className="bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] rounded-xl p-3 flex items-center gap-2 flex-wrap animate-fadeIn">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 mr-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Curated Tracks:</span>
            </span>
            {curatedOptions.map((opt) => {
              const isActive = curatedList === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    sounds.playClick();
                    updateFilters({ curated: opt.value });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-[#161B22] text-zinc-400 hover:text-white border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Filter Chips Strip */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161B22] text-zinc-300 border border-white/[0.08]"
              >
                <span>{f.label}</span>
                <button
                  onClick={f.clear}
                  className="hover:text-white text-zinc-500 cursor-pointer transition-colors"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-primary hover:text-purple-300 font-semibold cursor-pointer transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 4. Questions Table matching the reference layout */}
      <div className="rounded-2xl bg-[#0D1117]/85 backdrop-blur-md border border-white/[0.08] overflow-hidden shadow-xl relative z-10">
        <div className="overflow-x-auto min-h-[440px]">
          <table className="w-full text-left border-collapse text-sm font-sans">
            <thead>
              <tr className="text-xs text-zinc-400 border-b border-white/[0.08] bg-white/[0.01]">
                <th className="py-3.5 px-4 w-14 font-mono text-zinc-400 font-semibold text-xs">#</th>
                <th className="py-3.5 px-4 font-semibold text-zinc-300 min-w-[260px]">Question</th>
                <th className="py-3.5 px-4 font-semibold text-zinc-300 w-28">Difficulty</th>
                <th className="py-3.5 px-4 font-semibold text-zinc-300 min-w-[180px]">Topics</th>
                <th className="py-3.5 px-4 font-semibold text-zinc-300 min-w-[180px]">Companies</th>
                <th className="py-3.5 px-4 font-semibold text-zinc-300 w-36">Status</th>
                <th className="py-3.5 px-4 font-semibold text-zinc-300 text-right w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginatedQuestions.map((q, idx) => {
                const p = store.progress[String(q.id)];
                const status = p?.status || 'todo';
                const rowTheme = getRowStatusTheme(status);
                const isFav = !!p?.isFavorite;
                const companyKeys = Object.keys(q.companies || {});
                const isPopular = isPopularQuestion(q);
                const rowNumber = (safePage - 1) * pageSize + idx + 1;

                return (
                  <tr
                    key={q.id}
                    onClick={() => {
                      sounds.playClick();
                      onNavigateToProblem(q.id);
                    }}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* Number */}
                    <td className="py-3.5 px-4 font-mono text-zinc-500 text-xs font-medium">{rowNumber}</td>

                    {/* Question Title + Metadata */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-white group-hover:text-primary transition-colors text-sm">
                          {q.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-500">#{q.id}</span>
                          {isPopular && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium">
                              <Flame className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                              <span>Popular</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Difficulty Badge */}
                    <td className="py-3.5 px-4">
                      {q.difficulty === 'Easy' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Easy
                        </span>
                      )}
                      {q.difficulty === 'Medium' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-800/40">
                          Medium
                        </span>
                      )}
                      {q.difficulty === 'Hard' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-800/40">
                          Hard
                        </span>
                      )}
                    </td>

                    {/* DSA Topics */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {q.topics.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              updateFilters({ topic: t });
                            }}
                            className="px-2.5 py-0.5 rounded-md text-xs bg-[#161B22] text-zinc-300 border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer"
                          >
                            {t}
                          </span>
                        ))}
                        {q.topics.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-[#161B22] border border-white/[0.06]">
                            +{q.topics.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Companies with REAL Logos */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <CompanyLogoStack
                        companies={companyKeys}
                        maxDisplay={3}
                        size="sm"
                        onSelectCompany={(comp) => {
                          sounds.playClick();
                          if (onSelectCompany) onSelectCompany(comp);
                          updateFilters({ company: comp });
                        }}
                      />
                    </td>

                    {/* Status Pill with interactive GlideSelect */}
                    <td
                      className="py-3.5 px-4 relative z-0 has-[[aria-expanded=true]]:z-30"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <GlideSelect
                        options={rowStatusOptions}
                        value={status === 'mastered' ? 'solved' : status}
                        onChange={(val) => {
                          sounds.playClick();
                          onUpdateStatus(q.id, val as ProblemStatus);
                        }}
                        showTags={false}
                        size="sm"
                        menuWidth={140}
                        radius={10}
                        accentColor={rowTheme.accentColor}
                        surfaceColor={rowTheme.surfaceColor}
                        highlightColor={rowTheme.highlightColor}
                        textColor={rowTheme.textColor}
                        className="shrink-0"
                        ariaLabel={`Status for ${q.title}`}
                      />
                    </td>

                    {/* Action: Solve Button + 3 Dots Options */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onNavigateToProblem(q.id);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-purple-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1 font-sans"
                        >
                          <span>Solve</span>
                          <span>&rarr;</span>
                        </button>

                        <button
                          onClick={() => {
                            sounds.playClick();
                            setActiveMenuId(activeMenuId === q.id ? null : q.id);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === q.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 p-1.5 bg-[#0D1117] border border-white/[0.12] rounded-xl shadow-2xl z-50 text-left animate-fadeIn">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                onToggleFavorite(q.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isFav ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'
                                }`}
                              />
                              <span>{isFav ? 'Remove Favorite' : 'Add to Favorites'}</span>
                            </button>

                            <a
                              href={q.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveMenuId(null)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Open on LeetCode</span>
                            </a>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/problem/${q.id}`);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/[0.06] text-zinc-200 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Copy Problem Link</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedQuestions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-400">
                    <p className="text-base font-semibold text-white">No questions matched your filters</p>
                    <p className="text-xs text-zinc-500 mt-1">Try clearing some filters or searching for another term.</p>
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 select-none">
        <div className="text-xs text-zinc-400 font-sans">
          Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalCount)} of{' '}
          {totalCount.toLocaleString()} questions
        </div>

        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          {/* Previous Button */}
          <button
            onClick={() => {
              sounds.playClick();
              updateFilters({ page: safePage - 1 });
            }}
            disabled={safePage <= 1}
            className="w-8 h-8 rounded-lg bg-[#11141A] border border-white/[0.08] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Numbered Page Buttons */}
          {getPaginationPages(safePage, totalPages).map((pageNum, i) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-zinc-500">
                  ...
                </span>
              );
            }

            const isPageActive = pageNum === safePage;
            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => {
                  sounds.playClick();
                  updateFilters({ page: pageNum });
                }}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  isPageActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-[#11141A] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => {
              sounds.playClick();
              updateFilters({ page: safePage + 1 });
            }}
            disabled={safePage >= totalPages}
            className="w-8 h-8 rounded-lg bg-[#11141A] border border-white/[0.08] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Ad Banner for Free Users */}
      <AdBanner slotId="questions-table-bottom" />
    </div>
  );
};

export default QuestionsPage;
