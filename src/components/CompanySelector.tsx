import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CompanyMeta } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { Search, ChevronDown, Check, Building2, Flame } from 'lucide-react';

interface CompanySelectorProps {
  companies: Record<string, CompanyMeta>;
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

const TIERS = [
  'All',
  'FAANG',
  'Big Tech',
  'FinTech & Quant',
  'Top Unicorns',
  'Popular (50+)',
];

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTier, setActiveTier] = useState('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = companies[selectedCompanyId] || {
    id: selectedCompanyId,
    name: selectedCompanyId.replace('-', ' ').toUpperCase(),
    tier: 'Other',
    totalQuestions: 0,
    thirtyDaysCount: 0,
    allCount: 0,
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCompanies = useMemo(() => {
    const list = Object.values(companies);
    return list.filter((c) => {
      const matchesTier = activeTier === 'All' || c.tier === activeTier;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);
      return matchesTier && matchesSearch;
    }).sort((a, b) => b.totalQuestions - a.totalQuestions);
  }, [companies, activeTier, search]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-left shadow-sm group"
        title="Select Target Company"
      >
        <CompanyLogo companyId={selectedCompanyId} size="sm" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors leading-tight">
              {selectedCompany.name}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className="text-[11px] text-slate-400 font-mono leading-tight">
            {selectedCompany.totalQuestions} questions
            {selectedCompany.thirtyDaysCount > 0 && (
              <span className="ml-1.5 text-amber-400 inline-flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {selectedCompany.thirtyDaysCount} in 30d
              </span>
            )}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 max-w-[90vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 659 companies..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTier === tier
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Companies List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 p-1">
            {filteredCompanies.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                No companies found matching "{search}"
              </div>
            ) : (
              filteredCompanies.map((c) => {
                const isSelected = c.id === selectedCompanyId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCompany(c.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 border border-indigo-500/30 text-white'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogo companyId={c.id} size="sm" />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{c.name}</span>
                          {c.tier !== 'Other' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md border border-slate-700/50">
                              {c.tier}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                          <span>{c.totalQuestions} questions</span>
                          {c.thirtyDaysCount > 0 && (
                            <span className="text-amber-400 font-sans flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" />
                              {c.thirtyDaysCount} (30d)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer stats */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between px-3">
            <span>Showing {filteredCompanies.length} of {Object.keys(companies).length} companies</span>
            <span className="text-indigo-400">Snapshot: July 2026</span>
          </div>
        </div>
      )}
    </div>
  );
};
