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
    <div className="relative font-mono" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[2px] bg-surface hover:bg-surfaceElevated border border-border hover:border-borderActive transition-all text-left shadow-sm group"
        title="Select Target Company"
      >
        <CompanyLogo companyId={selectedCompanyId} size="sm" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono text-primary leading-tight">
              [{selectedCompany.name.toUpperCase()}]
            </span>
            <ChevronDown className={`w-3 h-3 text-textMuted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <span className="text-[10px] text-textMuted font-mono leading-tight">
            {selectedCompany.totalQuestions} Qs
            {selectedCompany.thirtyDaysCount > 0 && (
              <span className="ml-1 text-medium inline-flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                {selectedCompany.thirtyDaysCount} (30d)
              </span>
            )}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 max-w-[90vw] terminal-panel shadow-2xl z-50 overflow-hidden animate-scale-in">
          {/* Header & Search */}
          <div className="p-2.5 border-b border-border bg-surface">
            <div className="relative">
              <span className="text-primary font-mono font-bold text-xs absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                &gt;
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search 659 companies..."
                className="w-full pl-6 pr-6 py-1.5 text-xs bg-surfaceElevated border border-border rounded-[2px] text-textPrimary placeholder-textMuted font-mono focus:outline-hidden focus:border-borderActive"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-textMuted hover:text-textPrimary"
                >
                  [x]
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-[2px] whitespace-nowrap transition-colors ${
                    activeTier === tier
                      ? 'bg-primary text-black font-bold shadow-terminal-glow'
                      : 'bg-surfaceElevated text-textMuted hover:text-primary'
                  }`}
                >
                  [{tier.toUpperCase()}]
                </button>
              ))}
            </div>
          </div>

          {/* Companies List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60 p-1">
            {filteredCompanies.length === 0 ? (
              <div className="py-8 text-center text-xs text-textMuted font-mono">
                <Building2 className="w-6 h-6 mx-auto text-textMuted mb-2 opacity-50" />
                &gt; No companies found matching "{search}"
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-left transition-colors font-mono ${
                      isSelected
                        ? 'bg-surfaceElevated border border-borderActive text-primary font-bold'
                        : 'hover:bg-surfaceElevated text-textSecondary hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CompanyLogo companyId={c.id} size="sm" />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">[{c.name}]</span>
                          {c.tier !== 'Other' && (
                            <span className="text-[10px] px-1 py-0.2 bg-surface text-textMuted rounded-[1px] border border-border">
                              {c.tier}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-textMuted flex items-center gap-2 font-mono">
                          <span>{c.totalQuestions} questions</span>
                          {c.thirtyDaysCount > 0 && (
                            <span className="text-medium flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" />
                              {c.thirtyDaysCount} (30d)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer stats */}
          <div className="p-2 border-t border-border bg-surface text-[10px] text-textMuted font-mono flex items-center justify-between px-2.5">
            <span>SHOWING: {filteredCompanies.length}/{Object.keys(companies).length}</span>
            <span className="text-primary">[DATABASE: ACTIVE]</span>
          </div>
        </div>
      )}
    </div>
  );
};
