import React from 'react';
import { Difficulty, ProblemStatus, UserStoreState } from '../types';
import { Search, SlidersHorizontal, Star, CheckCircle2, Clock, RotateCcw, LayoutGrid, List, Sparkles } from 'lucide-react';

interface FilterBarProps {
  state: UserStoreState;
  onChange: (patch: Partial<UserStoreState>) => void;
  statusCounts: {
    total: number;
    todo: number;
    inProgress: number;
    solved: number;
    dueReview: number;
    starred: number;
  };
  topicsList: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  state,
  onChange,
  statusCounts,
  topicsList,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Top Row: Curated Lists & Search & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Curated List Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => onChange({ curatedList: 'all' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              state.curatedList === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Questions
          </button>
          <button
            onClick={() => onChange({ curatedList: 'sprint30' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              state.curatedList === 'sprint30'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Top 30 Sprint
          </button>
          <button
            onClick={() => onChange({ curatedList: 'blind75' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              state.curatedList === 'blind75'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            Blind 75
          </button>
          <button
            onClick={() => onChange({ curatedList: 'neetcode150' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              state.curatedList === 'neetcode150'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            NeetCode 150
          </button>
          <button
            onClick={() => onChange({ curatedList: 'striver180' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              state.curatedList === 'striver180'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Striver 180
          </button>
          <button
            onClick={() => onChange({ curatedList: 'grind169' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              state.curatedList === 'grind169'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            Grind 169
          </button>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={state.searchQuery}
              onChange={(e) => onChange({ searchQuery: e.target.value })}
              placeholder="Search by ID, title, or keyword (Press '/' to focus)..."
              className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            {state.searchQuery ? (
              <button
                onClick={() => onChange({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-xs pointer-events-none">
                /
              </kbd>
            )}
          </div>

          <div className="flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => onChange({ viewMode: 'table' })}
              className={`p-1.5 rounded-lg transition-colors ${
                state.viewMode === 'table' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange({ viewMode: 'card' })}
              className={`p-1.5 rounded-lg transition-colors ${
                state.viewMode === 'card' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Status Tabs, Difficulty Pills, Topic Dropdown, and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onChange({ selectedStatus: 'all' })}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              state.selectedStatus === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All ({statusCounts.total})
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'todo' })}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              state.selectedStatus === 'todo'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Todo ({statusCounts.todo})
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'in-progress' })}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              state.selectedStatus === 'in-progress'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            <Clock className="w-3 h-3 text-blue-400" />
            In Progress ({statusCounts.inProgress})
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'solved' })}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              state.selectedStatus === 'solved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Solved ({statusCounts.solved})
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'due-review' })}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              state.selectedStatus === 'due-review'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            Due Review
            {statusCounts.dueReview > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono font-bold">
                {statusCounts.dueReview}
              </span>
            )}
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'favorite' })}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              state.selectedStatus === 'favorite'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold'
                : 'text-slate-400 hover:text-yellow-300'
            }`}
          >
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            Starred ({statusCounts.starred})
          </button>
        </div>

        {/* Right Controls: Difficulty Pills, Topic Filter, Sort */}
        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {/* Difficulty filter */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 p-0.5 rounded-xl">
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
              const isSelected = state.selectedDifficulty === diff;
              const colorClass =
                diff === 'Easy'
                  ? 'hover:text-emerald-400'
                  : diff === 'Medium'
                  ? 'hover:text-amber-400'
                  : diff === 'Hard'
                  ? 'hover:text-rose-400'
                  : 'hover:text-slate-200';

              const activeClass =
                diff === 'Easy'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : diff === 'Medium'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : diff === 'Hard'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-white';

              return (
                <button
                  key={diff}
                  onClick={() => onChange({ selectedDifficulty: diff })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                    isSelected ? activeClass : `text-slate-400 ${colorClass}`
                  }`}
                >
                  {diff === 'all' ? 'All Diff' : diff}
                </button>
              );
            })}
          </div>

          {/* Topics dropdown */}
          <select
            value={state.selectedTopic}
            onChange={(e) => onChange({ selectedTopic: e.target.value })}
            className="px-2.5 py-1 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Topics</option>
            {topicsList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-xl">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <select
              value={`${state.sortBy}-${state.sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [UserStoreState['sortBy'], 'asc' | 'desc'];
                onChange({ sortBy: by, sortOrder: order });
              }}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="frequency-desc">Freq (High to Low)</option>
              <option value="frequency-asc">Freq (Low to High)</option>
              <option value="acceptance-desc">Acceptance (High to Low)</option>
              <option value="acceptance-asc">Acceptance (Low to High)</option>
              <option value="id-asc">LeetCode ID (1 → N)</option>
              <option value="id-desc">LeetCode ID (N → 1)</option>
              <option value="title-asc">Title (A → Z)</option>
              <option value="difficulty-asc">Difficulty (Easy → Hard)</option>
              <option value="difficulty-desc">Difficulty (Hard → Easy)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
