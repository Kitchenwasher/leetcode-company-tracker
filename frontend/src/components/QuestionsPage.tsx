import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Star,
  CheckCircle2,
  Clock,
  RotateCcw,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Code2,
  Building2,
  BookOpen,
  ArrowUpDown,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Question, CompanyMeta, UserStoreState, ProblemStatus, Difficulty } from '../types';
import { isQuestionInTrack } from '../data/curatedLists';
import { sounds } from '../utils/sound';
import { DifficultyBadge } from './ui/DifficultyBadge';
import { Button } from './ui/Button';
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

const TOP_COMPANIES = [
  { id: 'all', name: 'All Companies' },
  { id: 'google', name: 'Google' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'meta', name: 'Meta' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'apple', name: 'Apple' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'uber', name: 'Uber' },
];

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

    // Graph paradigm: Graph Theory, BFS, DFS, Union-Find
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

    // Tree paradigm: Tree, Binary Tree, Binary Search Tree
    if (s === 'tree' || s === 'trees') {
      return t.includes('tree');
    }

    // Dynamic Programming paradigm: Dynamic Programming, Memoization
    if (s === 'dynamic programming' || s === 'dp') {
      return t.includes('dynamic programming') || t.includes('memoization');
    }

    // Array / Arrays & Hashing
    if (s === 'array' || s === 'arrays') {
      return t.includes('array');
    }

    // String / Strings
    if (s === 'string' || s === 'strings') {
      return t.includes('string');
    }

    // Hash Table / Hash Map / Arrays & Hashing
    if (s === 'hash table' || s === 'hash map' || s === 'hashing') {
      return t.includes('hash');
    }

    // Stack
    if (s === 'stack') {
      return t.includes('stack');
    }

    // Queue
    if (s === 'queue') {
      return t.includes('queue');
    }

    // Heap / Priority Queue
    if (s === 'heap' || s.includes('priority queue')) {
      return t.includes('heap') || t.includes('priority queue');
    }

    // Linked List
    if (s === 'linked list') {
      return t.includes('linked list');
    }

    // Math & Geometry
    if (s === 'math') {
      return (
        t.includes('math') ||
        t.includes('geometry') ||
        t.includes('combinatorics') ||
        t.includes('number theory')
      );
    }

    // Binary Search
    if (s === 'binary search') {
      return t.includes('binary search');
    }

    // Two Pointers
    if (s === 'two pointers') {
      return t.includes('two pointer') || t.includes('two-pointer');
    }

    // Sliding Window
    if (s === 'sliding window') {
      return t.includes('sliding window');
    }

    // Greedy
    if (s === 'greedy') {
      return t.includes('greedy');
    }

    // Backtracking
    if (s === 'backtracking') {
      return t.includes('backtracking');
    }

    // Bit Manipulation
    if (s === 'bit manipulation' || s === 'bit') {
      return t.includes('bit');
    }

    // General substring match
    return t.includes(s) || s.includes(t);
  });
}

const renderCompanyLogo = (company: string) => {
  switch (company.toLowerCase()) {
    case 'google':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
      );
    case 'amazon':
      return (
        <div className="w-3.5 h-3.5 rounded bg-[#FF9900] text-black font-black text-[9px] flex items-center justify-center shrink-0">
          a
        </div>
      );
    case 'microsoft':
      return (
        <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 shrink-0">
          <div className="bg-[#F25022] rounded-[1px]" />
          <div className="bg-[#7FBA00] rounded-[1px]" />
          <div className="bg-[#00A4EF] rounded-[1px]" />
          <div className="bg-[#FFB900] rounded-[1px]" />
        </div>
      );
    case 'meta':
    case 'facebook':
      return (
        <svg className="w-3.5 h-3.5 shrink-0 text-[#0081FB]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      );
    case 'apple':
      return (
        <svg className="w-3.5 h-3.5 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
        </svg>
      );
    default:
      return (
        <span className="w-3.5 h-3.5 rounded bg-zinc-800 border border-white/10 text-[9px] font-sans flex items-center justify-center text-zinc-300">
          {company.charAt(0).toUpperCase()}
        </span>
      );
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

  // Active filters from URL search params with defaults
  const rawCompany = searchParams.get('company');
  const selectedCompany = rawCompany ? rawCompany.toLowerCase() : 'all';

  const selectedDifficulty = (searchParams.get('difficulty') as Difficulty | 'all') || 'all';
  const selectedTopic = searchParams.get('topic') || 'all';
  const selectedStatus = (searchParams.get('status') as ProblemStatus | 'favorite' | 'due-review' | 'all') || 'all';
  const curatedList = (searchParams.get('curated') || 'all') as UserStoreState['curatedList'];
  const sortBy = (searchParams.get('sort') as 'frequency' | 'acceptance' | 'id' | 'title' | 'difficulty') || 'frequency';
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const searchQuery = searchParams.get('search') || '';
  const viewMode = (searchParams.get('view') as 'table' | 'card') || 'table';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 50;

  // Helper to update search params safely without dependency on previous searchParams object
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

  // Distinct topics list from all questions
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => q.topics?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [questions]);

  // All companies list sorted by question count
  const allCompaniesList = useMemo(() => {
    return Object.values(companies).sort((a, b) => (b.totalQuestions || 0) - (a.totalQuestions || 0));
  }, [companies]);

  // Filtered & sorted questions
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

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

        // 3. Topic / DSA algorithm filter
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

        // 6. Search query
        if (query) {
          const matchesId = String(q.id) === query || String(q.id).includes(query);
          const matchesTitle = q.title.toLowerCase().includes(query);
          const matchesTopic = q.topics.some((t) => t.toLowerCase().includes(query));
          if (!matchesId && !matchesTitle && !matchesTopic) return false;
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
              compObj['more-than-six-months'] ||
              '0.0%';
            return parseFloat(String(str).replace('%', '')) || 0;
          }
          return Object.keys(item.companies || {}).length;
        };

        const getAcc = (item: Question) => {
          return parseFloat(String(item.acceptance || '0').replace('%', '')) || 0;
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
            comparison = (Number(a.id) || 0) - (Number(b.id) || 0);
            break;
          case 'title':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'difficulty': {
            const rank: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
            comparison = (rank[a.difficulty] || 2) - (rank[b.difficulty] || 2);
            break;
          }
          default:
            comparison = (Number(a.id) || 0) - (Number(b.id) || 0);
        }

        if (comparison !== 0) {
          return sortOrder === 'desc' ? -comparison : comparison;
        }

        // Stable secondary tie-breaker by problem ID ascending
        return (Number(a.id) || 0) - (Number(b.id) || 0);
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
    sortOrder,
    store.progress,
  ]);

  const totalCount = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, safePage, pageSize]);

  const easyCount = useMemo(() => filteredQuestions.filter((q) => q.difficulty === 'Easy').length, [filteredQuestions]);
  const medCount = useMemo(() => filteredQuestions.filter((q) => q.difficulty === 'Medium').length, [filteredQuestions]);
  const hardCount = useMemo(() => filteredQuestions.filter((q) => q.difficulty === 'Hard').length, [filteredQuestions]);

  const solvedCount = useMemo(() => {
    return filteredQuestions.filter((q) => {
      const st = store.progress[String(q.id)]?.status;
      return st === 'solved' || st === 'mastered';
    }).length;
  }, [filteredQuestions, store.progress]);

  // GlideSelect options
  const curatedGlideOptions = useMemo(() => [
    { value: 'all', label: 'All Sheets', tag: 'All', searchText: 'All Sheets' },
    { value: 'sprint30', label: 'Top 30 Sprint', tag: 'Sprint', searchText: 'Top 30 Sprint' },
    { value: 'blind75', label: 'Blind 75', tag: '75', searchText: 'Blind 75' },
    { value: 'neetcode150', label: 'NeetCode 150', tag: '150', searchText: 'NeetCode 150' },
    { value: 'striver180', label: 'Striver 180', tag: '180', searchText: 'Striver 180' },
    { value: 'grind169', label: 'Grind 169', tag: '169', searchText: 'Grind 169' },
  ], []);

  const TOP_TECH_IDS = useMemo(() => new Set(['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix', 'uber']), []);

  const companyGlideOptions = useMemo(() => {
    const list: GlideSelectOption[] = [
      {
        value: 'all',
        label: 'All Companies',
        tag: `${allCompaniesList.length}`,
        searchText: 'All Companies'
      }
    ];

    const topTech = [
      { id: 'google', name: 'Google' },
      { id: 'amazon', name: 'Amazon' },
      { id: 'meta', name: 'Meta' },
      { id: 'microsoft', name: 'Microsoft' },
      { id: 'apple', name: 'Apple' },
      { id: 'netflix', name: 'Netflix' },
      { id: 'uber', name: 'Uber' },
    ];

    topTech.forEach((c) => {
      list.push({
        value: c.id,
        label: (
          <span className="flex items-center gap-1.5 truncate">
            {renderCompanyLogo(c.id)}
            <span className="truncate">{c.name}</span>
          </span>
        ),
        tag: 'Top',
        searchText: c.name
      });
    });

    allCompaniesList
      .filter((c) => !TOP_TECH_IDS.has(c.id.toLowerCase()))
      .forEach((c) => {
        list.push({
          value: c.id,
          label: (
            <span className="flex items-center gap-1.5 truncate">
              {renderCompanyLogo(c.id)}
              <span className="truncate">{c.name}</span>
            </span>
          ),
          tag: `${c.totalQuestions}Q`,
          searchText: c.name
        });
      });

    if (selectedCompany !== 'all' && !list.some((it) => it.value.toLowerCase() === selectedCompany.toLowerCase())) {
      const cMeta = companies[selectedCompany.toLowerCase()] || companies[selectedCompany];
      const displayName = cMeta?.name || (selectedCompany.charAt(0).toUpperCase() + selectedCompany.slice(1));
      list.push({
        value: selectedCompany,
        label: (
          <span className="flex items-center gap-1.5 truncate">
            {renderCompanyLogo(selectedCompany)}
            <span className="truncate">{displayName}</span>
          </span>
        ),
        tag: cMeta ? `${cMeta.totalQuestions}Q` : 'Selected',
        searchText: displayName,
      });
    }

    return list;
  }, [allCompaniesList, TOP_TECH_IDS, selectedCompany, companies]);

  const topicGlideOptions = useMemo(() => {
    const list: GlideSelectOption[] = [
      { value: 'all', label: 'All Topics', tag: `${questions.length}`, searchText: 'All Topics' }
    ];

    TOP_ALGORITHMS.forEach((algo) => {
      const matchCount = questions.filter((q) => matchesTopicFilter(algo, q.topics)).length;
      list.push({
        value: algo,
        label: algo,
        tag: `${matchCount}`,
        searchText: algo
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
          searchText: t
        });
      });

    return list;
  }, [allTopics, questions]);

  const difficultyGlideOptions = useMemo(() => [
    { value: 'all', label: 'All Diff', tag: 'All', searchText: 'All Diff' },
    {
      value: 'Easy',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Easy</span>
        </span>
      ),
      tag: `${easyCount}`,
      searchText: 'Easy'
    },
    {
      value: 'Medium',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Medium</span>
        </span>
      ),
      tag: `${medCount}`,
      searchText: 'Medium'
    },
    {
      value: 'Hard',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Hard</span>
        </span>
      ),
      tag: `${hardCount}`,
      searchText: 'Hard'
    },
  ], [easyCount, medCount, hardCount]);

  const statusGlideOptions = useMemo(() => [
    { value: 'all', label: 'All Status', tag: `${totalCount}`, searchText: 'All Status' },
    {
      value: 'todo',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span>Todo</span>
        </span>
      ),
      tag: 'New',
      searchText: 'Todo'
    },
    {
      value: 'in-progress',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>In Progress</span>
        </span>
      ),
      tag: 'WIP',
      searchText: 'In Progress'
    },
    {
      value: 'solved',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Solved</span>
        </span>
      ),
      tag: `${solvedCount}`,
      searchText: 'Solved'
    },
    {
      value: 'due-review',
      label: (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Review</span>
        </span>
      ),
      tag: 'Spaced',
      searchText: 'Review'
    },
    {
      value: 'favorite',
      label: (
        <span className="flex items-center gap-1.5">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Starred</span>
        </span>
      ),
      tag: 'Saved',
      searchText: 'Starred'
    },
  ], [totalCount, solvedCount]);

  const sortGlideOptions = useMemo(() => [
    { value: 'frequency-desc', label: 'Freq: High → Low', tag: 'Popular', searchText: 'Frequency High' },
    { value: 'frequency-asc', label: 'Freq: Low → High', tag: 'Rare', searchText: 'Frequency Low' },
    { value: 'acceptance-desc', label: 'Acc: High → Low', tag: 'Easiest', searchText: 'Acceptance High' },
    { value: 'acceptance-asc', label: 'Acc: Low → High', tag: 'Hardest', searchText: 'Acceptance Low' },
    { value: 'id-asc', label: 'ID: 1 → N', tag: 'Index', searchText: 'ID Ascending' },
    { value: 'id-desc', label: 'ID: N → 1', tag: 'Latest', searchText: 'ID Descending' },
    { value: 'title-asc', label: 'Title: A → Z', tag: 'Alpha', searchText: 'Title A-Z' },
    { value: 'difficulty-asc', label: 'Diff: Easy → Hard', tag: 'Asc', searchText: 'Difficulty Easy' },
    { value: 'difficulty-desc', label: 'Diff: Hard → Easy', tag: 'Desc', searchText: 'Difficulty Hard' },
  ], []);

  const rowStatusOptions: GlideSelectOption[] = useMemo(() => [
    {
      value: 'todo',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span>Todo</span>
        </span>
      ),
      searchText: 'Todo'
    },
    {
      value: 'in-progress',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span>In Progress</span>
        </span>
      ),
      searchText: 'In Progress'
    },
    {
      value: 'solved',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>Solved</span>
        </span>
      ),
      searchText: 'Solved'
    },
    {
      value: 'review',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
          <span>Review</span>
        </span>
      ),
      searchText: 'Review'
    },
    {
      value: 'mastered',
      label: (
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span>Mastered</span>
        </span>
      ),
      searchText: 'Mastered'
    },
  ], []);

  const getRowStatusTheme = (st: ProblemStatus) => {
    switch (st) {
      case 'solved':
        return {
          accentColor: '#10b981',
          textColor: '#34d399',
          surfaceColor: 'rgba(16, 185, 129, 0.12)',
          highlightColor: '#133526',
        };
      case 'mastered':
        return {
          accentColor: '#06b6d4',
          textColor: '#22d3ee',
          surfaceColor: 'rgba(6, 182, 212, 0.12)',
          highlightColor: '#10333d',
        };
      case 'in-progress':
        return {
          accentColor: '#f59e0b',
          textColor: '#fbbf24',
          surfaceColor: 'rgba(245, 158, 11, 0.12)',
          highlightColor: '#2b2210',
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
          textColor: '#d1d5db',
          surfaceColor: '#11141A',
          highlightColor: '#1C222D',
        };
    }
  };

  const hasActiveFilters =
    selectedCompany !== 'all' ||
    selectedDifficulty !== 'all' ||
    selectedTopic !== 'all' ||
    selectedStatus !== 'all' ||
    curatedList !== 'all' ||
    searchQuery !== '';

  const clearAllFilters = () => {
    sounds.playClick();
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-[#F3F4F6] font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              EXPLORE QUESTIONS
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent-subtle text-[11px] font-semibold">
              {questions.length.toLocaleString()} Questions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Interview Questions
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Unified question tracker across 659 companies, curated lists, and core DSA algorithmic paradigms.
          </p>
        </div>

        {/* Quick KPI stats strip */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Matching</p>
            <p className="text-sm font-bold text-white font-mono">{totalCount.toLocaleString()}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium">Easy</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">{easyCount}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Medium</p>
            <p className="text-sm font-bold text-amber-400 font-mono">{medCount}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-rose-400 uppercase tracking-wider font-medium">Hard</p>
            <p className="text-sm font-bold text-rose-400 font-mono">{hardCount}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#0E1217] border border-white/[0.08] text-center">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Solved</p>
            <p className="text-sm font-bold text-accent font-mono">{solvedCount}</p>
          </div>
        </div>
      </div>

      {/* Top Banner Ad (Free Tier only) */}
      <AdBanner format="horizontal" variant="aws" slotId="questions-top-banner" className="my-2" />

      {/* Sleek Single-Line Filter Toolbar */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-xl p-2 sm:p-2.5 relative z-30">
        <div className="flex items-center gap-1.5 flex-wrap lg:flex-nowrap">
          {/* Search Input */}
          <div className="relative shrink-0 w-36 lg:w-44 xl:w-52">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Search ID, title, topic..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#11141A] border border-white/[0.08] focus:border-accent rounded-lg text-white placeholder-zinc-500 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Curated List GlideSelect */}
          <GlideSelect
            options={curatedGlideOptions}
            value={curatedList}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ curated: val });
            }}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            size="sm"
            menuWidth={180}
            radius={8}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={curatedList !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Curated Study Sheets"
          />

          {/* Company GlideSelect */}
          <GlideSelect
            options={companyGlideOptions}
            value={selectedCompany}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ company: val });
            }}
            icon={<Building2 className="w-3.5 h-3.5" />}
            size="sm"
            menuWidth={220}
            radius={8}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedCompany !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Company Filter"
          />

          {/* DSA Algorithm / Topic GlideSelect */}
          <GlideSelect
            options={topicGlideOptions}
            value={selectedTopic}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ topic: val });
            }}
            icon={<Code2 className="w-3.5 h-3.5" />}
            size="sm"
            menuWidth={210}
            radius={8}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedTopic !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Algorithm Paradigm / Topic Filter"
          />

          {/* Difficulty GlideSelect */}
          <GlideSelect
            options={difficultyGlideOptions}
            value={selectedDifficulty}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ difficulty: val as Difficulty | 'all' });
            }}
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            size="sm"
            menuWidth={135}
            radius={8}
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

          {/* Status GlideSelect */}
          <GlideSelect
            options={statusGlideOptions}
            value={selectedStatus}
            onChange={(val) => {
              sounds.playClick();
              updateFilters({ status: val as ProblemStatus | 'favorite' | 'due-review' | 'all' });
            }}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            size="sm"
            menuWidth={155}
            radius={8}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className={selectedStatus !== 'all' ? 'glide-select--active shrink-0' : 'shrink-0'}
            ariaLabel="Problem Status Filter"
          />

          {/* Sort GlideSelect */}
          <GlideSelect
            options={sortGlideOptions}
            value={`${sortBy}-${sortOrder}`}
            onChange={(val) => {
              sounds.playClick();
              const [by, order] = val.split('-') as [typeof sortBy, 'asc' | 'desc'];
              updateFilters({ sort: by, order });
            }}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            size="sm"
            menuWidth={195}
            radius={8}
            accentColor="var(--theme-accent, #A855F7)"
            surfaceColor="#11141A"
            highlightColor="#1C222D"
            textColor="#F3F4F6"
            className="shrink-0"
            ariaLabel="Sort Questions"
          />

          {/* Reset Filters Button (when active) */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-accent bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-all cursor-pointer shrink-0 ml-auto"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className={`flex items-center bg-[#11141A] border border-white/[0.08] p-0.5 rounded-lg shrink-0 ${!hasActiveFilters ? 'ml-auto' : ''}`}>
            <button
              onClick={() => {
                sounds.playClick();
                updateFilters({ view: 'table' });
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-accent text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                updateFilters({ view: 'card' });
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'card' ? 'bg-accent text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Questions List / Table */}
      {viewMode === 'table' ? (
        <div className="bg-[#0E1217] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="overflow-x-auto min-h-[420px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="py-3 px-4 w-12 font-mono text-xs">#</th>
                  <th className="py-3 px-4 font-medium">Question</th>
                  <th className="py-3 px-4 font-medium w-28">Difficulty</th>
                  <th className="py-3 px-4 font-medium">DSA Topics</th>
                  <th className="py-3 px-4 font-medium">
                    {selectedCompany !== 'all' ? 'Frequency' : 'Companies'}
                  </th>
                  <th className="py-3 px-4 font-medium w-24">Acceptance</th>
                  <th className="py-3 px-4 font-medium w-32">Status</th>
                  <th className="py-3 px-4 font-medium text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginatedQuestions.map((q) => {
                  const p = store.progress[String(q.id)];
                  const status = p?.status || 'todo';
                  const statusTheme = getRowStatusTheme(status as ProblemStatus);
                  const isFav = !!p?.isFavorite;
                  const companyKeys = Object.keys(q.companies || {});

                  return (
                    <tr
                      key={q.id}
                      onClick={() => {
                        sounds.playClick();
                        onNavigateToProblem(q.id);
                      }}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-zinc-500 text-xs">{q.id}</td>

                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200 group-hover:text-accent transition-colors">
                            {q.title}
                          </span>
                          {q.isBlind75 && (
                            <span className="px-1.5 py-0.2 rounded bg-accent-subtle text-accent text-[9px] font-mono font-medium border border-accent-subtle">
                              B75
                            </span>
                          )}
                          {q.isGrind169 && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-400/10 text-purple-400 text-[9px] font-mono font-medium border border-purple-400/25">
                              G169
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3.5 px-4">
                        <DifficultyBadge difficulty={q.difficulty} size="sm" />
                      </td>

                      {/* DSA Topics */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                          {q.topics.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playClick();
                                updateFilters({ topic: t });
                              }}
                              className="px-2 py-0.5 rounded text-xs bg-[#11141A] text-zinc-400 border border-white/[0.06] hover:text-white transition-colors"
                            >
                              {t}
                            </span>
                          ))}
                          {q.topics.length > 3 && (
                            <span className="text-[11px] text-zinc-500">
                              +{q.topics.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Companies / Frequency */}
                      <td className="py-3.5 px-4">
                        {selectedCompany !== 'all' ? (
                          (() => {
                            const compKey = selectedCompany.toLowerCase();
                            const compObj = q.companies[compKey] || q.companies[selectedCompany] || {};
                            const freqStr =
                              compObj.all ||
                              compObj['thirty-days'] ||
                              compObj['three-months'] ||
                              compObj['six-months'] ||
                              compObj['more-than-six-months'] ||
                              '0.0%';
                            const freqVal = parseFloat(freqStr.replace('%', '')) || 0;
                            const isHot = freqVal >= 75;
                            const compName = companies[compKey]?.name || selectedCompany;
                            return (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                                    isHot
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                                  }`}
                                  title={`${freqStr} interview frequency at ${compName}`}
                                >
                                  {isHot && <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                                  <span>{freqStr}</span>
                                </span>
                                {companyKeys.length > 1 && (
                                  <span
                                    className="text-[11px] text-zinc-500 font-sans"
                                    title={`Also asked by ${companyKeys.length - 1} other companies`}
                                  >
                                    +{companyKeys.length - 1} cos
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {companyKeys.slice(0, 3).map((comp) => (
                              <span
                                key={comp}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sounds.playClick();
                                  updateFilters({ company: comp });
                                }}
                                title={comp}
                                className="p-1 rounded-md bg-[#11141A] border border-white/[0.06] hover:border-white/20 transition-colors cursor-pointer"
                              >
                                {renderCompanyLogo(comp)}
                              </span>
                            ))}
                            {companyKeys.length > 3 && (
                              <span className="text-xs text-zinc-500 font-mono font-medium">
                                +{companyKeys.length - 3}
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-500 ml-1 font-mono hidden xl:inline">
                              ({companyKeys.length})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Acceptance */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs">
                        {q.acceptance}
                      </td>

                      {/* Status */}
                      <td
                        className="py-3.5 px-4 relative z-0 has-[[aria-expanded=true]]:z-30"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <GlideSelect
                            options={rowStatusOptions}
                            value={status}
                            onChange={(val) => {
                              sounds.playClick();
                              onUpdateStatus(q.id, val as ProblemStatus);
                            }}
                            showTags={false}
                            size="sm"
                            menuWidth={136}
                            radius={8}
                            accentColor={statusTheme.accentColor}
                            surfaceColor={statusTheme.surfaceColor}
                            highlightColor={statusTheme.highlightColor}
                            textColor={statusTheme.textColor}
                            className="shrink-0"
                            ariaLabel={`Status for ${q.title}`}
                          />

                          <button
                            onClick={() => {
                              sounds.playClick();
                              onToggleFavorite(q.id);
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-accent transition-colors"
                            title="Bookmark"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isFav ? 'text-accent fill-accent' : 'text-zinc-600 hover:text-zinc-400'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              onNavigateToProblem(q.id);
                            }}
                            className="px-3 py-1 rounded-lg bg-accent hover:opacity-90 text-black font-semibold text-xs transition-all cursor-pointer"
                          >
                            Solve &rarr;
                          </button>
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
                            title="Open on LeetCode"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedQuestions.map((q) => {
            const p = store.progress[String(q.id)];
            const status = p?.status || 'todo';
            const isFav = !!p?.isFavorite;
            const companyKeys = Object.keys(q.companies || {});

            return (
              <div
                key={q.id}
                onClick={() => {
                  sounds.playClick();
                  onNavigateToProblem(q.id);
                }}
                className="bg-[#0E1217] border border-white/[0.08] hover:border-white/20 rounded-xl p-5 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-500">#{q.id}</span>
                    <DifficultyBadge difficulty={q.difficulty} size="sm" />
                  </div>
                  <h3 className="font-semibold text-base text-zinc-100 group-hover:text-accent transition-colors mt-2">
                    {q.title}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                    {q.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-xs bg-[#11141A] text-zinc-400 border border-white/[0.06]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    {selectedCompany !== 'all' ? (
                      (() => {
                        const compKey = selectedCompany.toLowerCase();
                        const compObj = q.companies[compKey] || q.companies[selectedCompany] || {};
                        const freqStr =
                          compObj.all ||
                          compObj['thirty-days'] ||
                          compObj['three-months'] ||
                          compObj['six-months'] ||
                          '0.0%';
                        const freqVal = parseFloat(freqStr.replace('%', '')) || 0;
                        const isHot = freqVal >= 75;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                              isHot
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                            }`}
                          >
                            {isHot && <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            <span>{freqStr}</span>
                          </span>
                        );
                      })()
                    ) : (
                      companyKeys.slice(0, 3).map((comp) => (
                        <span key={comp} className="p-1 rounded bg-[#11141A] border border-white/[0.06]">
                          {renderCompanyLogo(comp)}
                        </span>
                      ))
                    )}
                    <span className="text-xs text-zinc-400 font-mono ml-1">
                      {q.acceptance}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onNavigateToProblem(q.id);
                    }}
                    className="px-3 py-1 rounded-lg bg-accent hover:opacity-90 text-black font-semibold text-xs transition-all"
                  >
                    Solve &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              updateFilters({ page: safePage - 1 });
            }}
            disabled={safePage <= 1}
            className="px-3 py-1.5 rounded-lg bg-[#0E1217] border border-white/[0.08] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-zinc-400 px-2 font-sans">
            Page <span className="font-semibold text-white">{safePage}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span>
          </span>

          <button
            onClick={() => {
              sounds.playClick();
              updateFilters({ page: safePage + 1 });
            }}
            disabled={safePage >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-[#0E1217] border border-white/[0.08] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-zinc-400 font-sans">
          Showing {(safePage - 1) * pageSize + 1}–
          {Math.min(safePage * pageSize, totalCount)} of {totalCount.toLocaleString()} questions
        </div>
      </div>

      {/* Sponsored Ad Banner for Free Users (100% Ad-Free for Pro) */}
      <AdBanner slotId="questions-table-bottom" />
    </div>
  );
};

export default QuestionsPage;
