import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  Building2,
  Sparkles,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { CompanyMeta, Question } from '../types';
import { sounds } from '../utils/sound';
import { DifficultyBadge } from './ui/DifficultyBadge';
import { Button } from './ui/Button';
import { AdBanner } from './AdBanner';

interface CompaniesPageProps {
  companies: Record<string, CompanyMeta>;
  questions: Question[];
  onSelectCompany: (slug: string) => void;
}

const TOP_COMPANIES_MOCK = [
  {
    id: 'google',
    name: 'Google',
    badge: 'MAANG',
    type: 'Product Based',
    questionsCount: 120,
    popularTopics: ['Arrays', 'Trees', 'Graphs', 'DP'],
    difficulty: 'Medium',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    badge: 'MAANG',
    type: 'Product Based',
    questionsCount: 98,
    popularTopics: ['Arrays', 'Strings', 'DP', 'System Design'],
    difficulty: 'Medium',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    badge: 'Big Tech',
    type: 'Product Based',
    questionsCount: 76,
    popularTopics: ['Strings', 'Trees', 'Graphs', 'Design'],
    difficulty: 'Medium',
  },
  {
    id: 'meta',
    name: 'Meta',
    badge: 'MAANG',
    type: 'Product Based',
    questionsCount: 65,
    popularTopics: ['Graphs', 'DP', 'Trees', 'System Design'],
    difficulty: 'Hard',
  },
  {
    id: 'apple',
    name: 'Apple',
    badge: 'Big Tech',
    type: 'Product Based',
    questionsCount: 54,
    popularTopics: ['Arrays', 'DP', 'Design', 'OS'],
    difficulty: 'Hard',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    badge: 'MAANG',
    type: 'Product Based',
    questionsCount: 48,
    popularTopics: ['Graphs', 'Design', 'DP', 'Concurrency'],
    difficulty: 'Hard',
  },
  {
    id: 'adobe',
    name: 'Adobe',
    badge: 'Big Tech',
    type: 'Product Based',
    questionsCount: 42,
    popularTopics: ['Arrays', 'Strings', 'Trees', 'Design'],
    difficulty: 'Medium',
  },
  {
    id: 'uber',
    name: 'Uber',
    badge: 'Unicorn',
    type: 'Product Based',
    questionsCount: 38,
    popularTopics: ['Graphs', 'DP', 'System Design', 'Databases'],
    difficulty: 'Medium',
  },
];

const CATEGORIES = [
  'All Companies',
  'Product Based',
  'Service Based',
  'Startup',
  'MAANG',
  'Unicorn',
];

export const CompaniesPage: React.FC<CompaniesPageProps> = ({
  companies,
  questions,
  onSelectCompany,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Companies');
  const [sortBy, setSortBy] = useState<'questions' | 'alpha' | 'hardest' | 'easiest'>('questions');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Render company logo
  const renderCompanyLogo = (companyId: string) => {
    switch (companyId.toLowerCase()) {
      case 'google':
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        );
      case 'amazon':
        return (
          <div className="w-5 h-5 rounded bg-[#FF9900] text-black font-black text-xs flex items-center justify-center shrink-0">
            a
          </div>
        );
      case 'microsoft':
        return (
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5 shrink-0">
            <div className="bg-[#F25022] rounded-[1px]" />
            <div className="bg-[#7FBA00] rounded-[1px]" />
            <div className="bg-[#00A4EF] rounded-[1px]" />
            <div className="bg-[#FFB900] rounded-[1px]" />
          </div>
        );
      case 'meta':
      case 'facebook':
        return (
          <svg className="w-5 h-5 shrink-0 text-[#0081FB]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-5 h-5 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
          </svg>
        );
      case 'netflix':
        return (
          <svg className="w-5 h-5 shrink-0 text-[#E50914]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 2h4.5l4.5 12.5V2H17v20h-4.5L8 9.5V22H4V2z"/>
          </svg>
        );
      case 'adobe':
        return (
          <svg className="w-5 h-5 shrink-0 text-[#ED2224]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.966 22h3.044L24 2H16.633l-2.667 7.027zm-3.932 0H6.99L0 2h7.367l2.667 7.027zM12 11.516l2.167 5.75H9.833z"/>
          </svg>
        );
      case 'uber':
        return (
          <span className="font-sans font-bold text-xs tracking-tight text-white shrink-0">
            Uber
          </span>
        );
      default:
        return (
          <div className="w-5 h-5 rounded bg-zinc-800 border border-white/10 text-accent font-mono font-bold text-xs flex items-center justify-center shrink-0">
            {companyId.charAt(0).toUpperCase()}
          </div>
        );
    }
  };

  // Build the full company list
  const allCompaniesList = useMemo(() => {
    const mockMap = new Map(TOP_COMPANIES_MOCK.map((m) => [m.id, m]));
    const list: typeof TOP_COMPANIES_MOCK = [];

    TOP_COMPANIES_MOCK.forEach((m) => {
      list.push(m);
    });

    Object.values(companies).forEach((c) => {
      if (!mockMap.has(c.id)) {
        const isMAANG = ['google', 'amazon', 'meta', 'apple', 'netflix'].includes(c.id);
        const isService = ['accenture', 'tcs', 'infosys', 'wipro', 'cognizant', 'capgemini', 'hcl'].includes(c.id);
        const isStartup = ['swiggy', 'zomato', 'cred', 'razorpay', 'zepto', 'blinkit', 'ola'].includes(c.id);
        const isUnicorn = ['uber', 'airbnb', 'stripe', 'byjus', 'meesho'].includes(c.id);

        let type = 'Product Based';
        if (isService) type = 'Service Based';
        else if (isStartup) type = 'Startup';
        else if (isUnicorn) type = 'Unicorn';

        const hard = c.diffCounts?.Hard || 0;
        const med = c.diffCounts?.Medium || 0;
        const easy = c.diffCounts?.Easy || 0;

        let diff = 'Medium';
        if (hard > med && hard > easy) {
          diff = 'Hard';
        } else if (easy > med && easy > hard) {
          diff = 'Easy';
        }

        list.push({
          id: c.id,
          name: c.name || c.id,
          badge: isMAANG ? 'MAANG' : '',
          type,
          questionsCount: c.totalQuestions || 0,
          popularTopics: ['Arrays', 'Strings', 'DP', 'Trees'],
          difficulty: diff,
        });
      }
    });

    return list;
  }, [companies]);

  // Filter and sort
  const filteredCompanies = useMemo(() => {
    let result = allCompaniesList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.popularTopics.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All Companies') {
      if (selectedCategory === 'MAANG') {
        result = result.filter((c) => c.badge === 'MAANG' || ['google', 'amazon', 'meta', 'apple', 'netflix'].includes(c.id));
      } else {
        result = result.filter((c) => c.type === selectedCategory);
      }
    }

    const sorted = [...result];
    if (sortBy === 'questions') {
      if (!searchQuery && selectedCategory === 'All Companies') {
        // preserve top 8 order
      } else {
        sorted.sort((a, b) => b.questionsCount - a.questionsCount);
      }
    } else if (sortBy === 'alpha') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'hardest') {
      sorted.sort((a, b) => (b.difficulty === 'Hard' ? 1 : 0) - (a.difficulty === 'Hard' ? 1 : 0));
    } else if (sortBy === 'easiest') {
      sorted.sort((a, b) => (b.difficulty === 'Easy' ? 1 : 0) - (a.difficulty === 'Easy' ? 1 : 0));
    }

    return sorted;
  }, [allCompaniesList, searchQuery, selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, currentPage, itemsPerPage]);

  const handleSelect = (slug: string) => {
    sounds.playClick();
    onSelectCompany(slug);
    navigate(`/questions?company=${encodeURIComponent(slug.toLowerCase())}`);
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-[#F3F4F6] font-sans">
      {/* Top Header: Title + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Companies Directory
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Browse 659 tech companies with verified, company-wise LeetCode interview question indexes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0E1217] border border-white/[0.08] text-xs">
            <span className="text-zinc-500">Indexed:</span>
            <span className="font-bold text-white font-mono">659 Companies</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/questions')}
          >
            All Questions &rarr;
          </Button>
        </div>
      </div>

      {/* Top Banner Ad (Free Tier only) */}
      <AdBanner format="horizontal" variant="aws" slotId="companies-top-banner" className="my-2" />

      {/* Search Bar + Filters Row */}
      <div className="space-y-4">
        {/* Search Input & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search companies (Google, Amazon, Meta...)"
              className="w-full pl-10 pr-4 py-2 bg-[#0E1217] border border-white/[0.08] focus:border-accent rounded-lg text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-400 font-sans">Sort by:</span>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="px-3 py-2 rounded-lg bg-[#0E1217] border border-white/[0.08] hover:border-white/20 text-xs text-white flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>
                {sortBy === 'questions' && 'Most Questions'}
                {sortBy === 'alpha' && 'Alphabetical (A-Z)'}
                {sortBy === 'hardest' && 'Hardest First'}
                {sortBy === 'easiest' && 'Easiest First'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {sortDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 bg-[#11141A] border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-30 text-xs font-sans"
                onClick={() => setSortDropdownOpen(false)}
              >
                <button
                  onClick={() => setSortBy('questions')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                >
                  Most Questions
                </button>
                <button
                  onClick={() => setSortBy('alpha')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                >
                  Alphabetical (A-Z)
                </button>
                <button
                  onClick={() => setSortBy('hardest')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                >
                  Hardest First
                </button>
                <button
                  onClick={() => setSortBy('easiest')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                >
                  Easiest First
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-accent text-black font-semibold shadow-sm'
                      : 'bg-[#0E1217] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-zinc-400 font-sans shrink-0 hidden sm:inline">
            {filteredCompanies.length} companies found
          </span>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-[#0E1217] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="text-xs text-zinc-400 border-b border-white/[0.06]">
                <th className="py-3 px-4 font-medium">COMPANY</th>
                <th className="py-3 px-4 font-medium">QUESTIONS</th>
                <th className="py-3 px-4 font-medium">POPULAR TOPICS</th>
                <th className="py-3 px-4 font-medium">DIFFICULTY</th>
                <th className="py-3 px-4 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginatedCompanies.map((comp) => (
                <tr
                  key={comp.id}
                  onClick={() => handleSelect(comp.id)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {renderCompanyLogo(comp.id)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                            {comp.name}
                          </span>
                          {comp.badge && (
                            <span className="bg-accent/10 text-accent border border-[#E5FF00]/30 text-[10px] px-2 py-0.2 rounded-full font-medium">
                              {comp.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{comp.type}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-sm font-medium text-zinc-200">
                    {comp.questionsCount}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {comp.popularTopics.map((topic) => (
                        <span
                          key={topic}
                          className="bg-[#141820] border border-white/[0.06] text-zinc-400 text-xs px-2.5 py-0.5 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <DifficultyBadge difficulty={comp.difficulty} size="sm" />
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(comp.id);
                      }}
                      className="w-8 h-8 rounded-lg bg-[#141820] border border-white/[0.08] hover:border-[#E5FF00]/40 hover:bg-accent/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all ml-auto cursor-pointer"
                      title={`Explore ${comp.name} questions`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sounds.playClick();
              setCurrentPage((prev) => Math.max(1, prev - 1));
            }}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg bg-[#0E1217] border border-white/[0.08] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {[1, 2, 3, 4, 5].map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-sans font-medium transition-colors cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-accent text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => {
              sounds.playClick();
              setCurrentPage((prev) => Math.min(totalPages, prev + 1));
            }}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg bg-[#0E1217] border border-white/[0.08] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-zinc-400 font-sans">
          Showing {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
