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
    <div className="flex flex-col gap-2.5 font-mono">
      {/* Top Row: Curated Lists & Search & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Curated List Selector */}
        <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-[2px] overflow-x-auto no-scrollbar">
          <button
            onClick={() => onChange({ curatedList: 'all' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] transition-colors ${
              state.curatedList === 'all'
                ? 'bg-primary text-black shadow-terminal-glow'
                : 'text-textSecondary hover:text-primary hover:bg-surfaceElevated'
            }`}
          >
            [ALL_QUESTIONS]
          </button>
          <button
            onClick={() => onChange({ curatedList: 'sprint30' })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-[2px] transition-colors ${
              state.curatedList === 'sprint30'
                ? 'bg-primary text-black shadow-terminal-glow'
                : 'text-textSecondary hover:text-primaryDim hover:bg-surfaceElevated'
            }`}
          >
            <Sparkles className="w-3 h-3 text-medium" />
            [TOP_30_SPRINT]
          </button>
          <button
            onClick={() => onChange({ curatedList: 'blind75' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] transition-colors ${
              state.curatedList === 'blind75'
                ? 'bg-primary text-black shadow-terminal-glow'
                : 'text-textSecondary hover:text-primary hover:bg-surfaceElevated'
            }`}
          >
            [BLIND_75]
          </button>
          <button
            onClick={() => onChange({ curatedList: 'neetcode150' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] transition-colors ${
              state.curatedList === 'neetcode150'
                ? 'bg-primary text-black shadow-terminal-glow'
                : 'text-textSecondary hover:text-primary hover:bg-surfaceElevated'
            }`}
          >
            [NEETCODE_150]
          </button>
          <button
            onClick={() => onChange({ curatedList: 'striver180' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] transition-colors ${
              state.curatedList === 'striver180'
                ? 'bg-primary text-black shadow-terminal-glow'
                : 'text-textSecondary hover:text-primaryDim hover:bg-surfaceElevated'
            }`}
          >
            [STRIVER_180]
          </button>
          <button
            onClick={() => onChange({ curatedList: 'grind169' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] transition-colors ${
              state.curatedList === 'grind169'
                ? 'bg-primary text-black shadow-terminal-glow'
                : 'text-textSecondary hover:text-primary hover:bg-surfaceElevated'
            }`}
          >
            [GRIND_169]
          </button>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative w-full">
            <span className="text-primary font-mono font-bold text-xs absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              &gt;
            </span>
            <input
              type="text"
              value={state.searchQuery}
              onChange={(e) => onChange({ searchQuery: e.target.value })}
              placeholder="filter query (ID, title, keyword)..."
              className="w-full pl-6 pr-10 py-1.5 text-xs bg-surface border border-border rounded-[2px] text-textPrimary placeholder-textMuted font-mono focus:outline-hidden focus:border-borderActive"
            />
            {state.searchQuery ? (
              <button
                onClick={() => onChange({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-textMuted hover:text-textPrimary"
              >
                [x]
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.2 text-[10px] font-mono text-textMuted bg-surfaceElevated border border-border rounded-[2px] pointer-events-none">
                /
              </kbd>
            )}
          </div>

          <div className="flex items-center bg-surface border border-border p-0.5 rounded-[2px] shrink-0">
            <button
              onClick={() => onChange({ viewMode: 'table' })}
              className={`p-1.5 rounded-[2px] transition-colors ${
                state.viewMode === 'table' ? 'bg-primary text-black font-bold' : 'text-textMuted hover:text-primary'
              }`}
              title="Table View [TBL]"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChange({ viewMode: 'card' })}
              className={`p-1.5 rounded-[2px] transition-colors ${
                state.viewMode === 'card' ? 'bg-primary text-black font-bold' : 'text-textMuted hover:text-primary'
              }`}
              title="Card Grid View [CRD]"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Status Tabs, Difficulty Pills, Topic Dropdown, and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onChange({ selectedStatus: 'all' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] border transition-colors whitespace-nowrap ${
              state.selectedStatus === 'all'
                ? 'bg-surfaceElevated text-primary border-borderActive'
                : 'border-transparent text-textMuted hover:text-primary hover:bg-surface'
            }`}
          >
            [ALL: {statusCounts.total}]
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'todo' })}
            className={`px-2.5 py-1 text-xs font-bold rounded-[2px] border transition-colors whitespace-nowrap ${
              state.selectedStatus === 'todo'
                ? 'bg-surfaceElevated text-primary border-borderActive'
                : 'border-transparent text-textMuted hover:text-primary hover:bg-surface'
            }`}
          >
            [TODO: {statusCounts.todo}]
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'in-progress' })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-[2px] border transition-colors whitespace-nowrap ${
              state.selectedStatus === 'in-progress'
                ? 'bg-surfaceElevated text-primary border-borderActive'
                : 'border-transparent text-textMuted hover:text-primary hover:bg-surface'
            }`}
          >
            <Clock className="w-3 h-3 text-primary" />
            [WIP: {statusCounts.inProgress}]
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'solved' })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-[2px] border transition-colors whitespace-nowrap ${
              state.selectedStatus === 'solved'
                ? 'bg-surfaceElevated text-easy border-easy'
                : 'border-transparent text-textMuted hover:text-easy hover:bg-surface'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-easy" />
            [SOLVED: {statusCounts.solved}]
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'due-review' })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-[2px] border transition-colors whitespace-nowrap ${
              state.selectedStatus === 'due-review'
                ? 'bg-surfaceElevated text-medium border-medium'
                : 'border-transparent text-textMuted hover:text-primaryDim hover:bg-surface'
            }`}
          >
            <RotateCcw className="w-3 h-3 text-medium" />
            [REVIEW: {statusCounts.dueReview}]
          </button>
          <button
            onClick={() => onChange({ selectedStatus: 'favorite' })}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-[2px] border transition-colors whitespace-nowrap ${
              state.selectedStatus === 'favorite'
                ? 'bg-surfaceElevated text-medium border-medium'
                : 'border-transparent text-textMuted hover:text-primaryDim hover:bg-surface'
            }`}
          >
            <Star className="w-3 h-3 text-medium fill-medium" />
            [STARRED: {statusCounts.starred}]
          </button>
        </div>

        {/* Right Controls: Difficulty Pills, Topic Filter, Sort */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Difficulty filter */}
          <div className="flex items-center bg-surface border border-border p-0.5 rounded-[2px]">
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
              const isSelected = state.selectedDifficulty === diff;
              const colorClass =
                diff === 'Easy'
                  ? 'hover:text-easy'
                  : diff === 'Medium'
                  ? 'hover:text-primaryDim'
                  : diff === 'Hard'
                  ? 'hover:text-primaryDim'
                  : 'hover:text-textPrimary';

              const activeClass =
                diff === 'Easy'
                  ? 'bg-easy/20 text-easy border border-easy/40 font-bold'
                  : diff === 'Medium'
                  ? 'bg-medium/20 text-medium border border-medium/40 font-bold'
                  : diff === 'Hard'
                  ? 'bg-hard/20 text-hard border border-hard/40 font-bold'
                  : 'bg-primary text-black font-bold';

              return (
                <button
                  key={diff}
                  onClick={() => onChange({ selectedDifficulty: diff })}
                  className={`px-2 py-0.5 text-xs font-mono rounded-[2px] transition-all ${
                    isSelected ? activeClass : `text-textMuted ${colorClass}`
                  }`}
                >
                  {diff === 'all' ? '[ALL]' : `[${diff.toUpperCase()}]`}
                </button>
              );
            })}
          </div>

          {/* Topics dropdown */}
          <select
            value={state.selectedTopic}
            onChange={(e) => onChange({ selectedTopic: e.target.value })}
            className="px-2 py-1 text-xs bg-surface border border-border rounded-[2px] text-textSecondary font-mono focus:outline-hidden focus:border-primary"
          >
            <option value="all">&gt; ALL_TOPICS</option>
            {topicsList.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 bg-surface border border-border px-2 py-1 rounded-[2px]">
            <SlidersHorizontal className="w-3 h-3 text-textMuted" />
            <select
              value={`${state.sortBy}-${state.sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [UserStoreState['sortBy'], 'asc' | 'desc'];
                onChange({ sortBy: by, sortOrder: order });
              }}
              className="bg-transparent text-xs text-textSecondary font-mono focus:outline-hidden cursor-pointer"
            >
              <option value="frequency-desc">SORT: Freq (High → Low)</option>
              <option value="frequency-asc">SORT: Freq (Low → High)</option>
              <option value="acceptance-desc">SORT: Acc (High → Low)</option>
              <option value="acceptance-asc">SORT: Acc (Low → High)</option>
              <option value="id-asc">SORT: ID (1 → N)</option>
              <option value="id-desc">SORT: ID (N → 1)</option>
              <option value="title-asc">SORT: Title (A → Z)</option>
              <option value="difficulty-asc">SORT: Diff (Easy → Hard)</option>
              <option value="difficulty-desc">SORT: Diff (Hard → Easy)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
