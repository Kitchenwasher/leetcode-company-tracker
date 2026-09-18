import React, { useState, useMemo } from 'react';
import { Question, CompanyMeta, ProblemStatus, UserProgressItem } from '../types';
import { X, Layers, Check, ExternalLink, ArrowRight, Star } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { sounds } from '../utils/sound';

interface CompanyOverlapModalProps {
  questions: Question[];
  companies: Record<string, CompanyMeta>;
  progress: Record<string, UserProgressItem>;
  onClose: () => void;
  onSelectQuestion: (q: Question) => void;
}

const POPULAR_COMPANIES = [
  'google', 'meta', 'amazon', 'microsoft', 'apple', 'netflix', 'uber', 'bloomberg', 'tiktok', 'goldman-sachs'
];

export const CompanyOverlapModal: React.FC<CompanyOverlapModalProps> = ({
  questions,
  companies,
  progress,
  onClose,
  onSelectQuestion,
}) => {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['google', 'meta']);
  const [minMatchCount, setMinMatchCount] = useState<number>(2);

  const toggleCompany = (cId: string) => {
    sounds.playClick();
    if (selectedCompanies.includes(cId)) {
      if (selectedCompanies.length > 2) {
        setSelectedCompanies(selectedCompanies.filter((c) => c !== cId));
      }
    } else {
      setSelectedCompanies([...selectedCompanies, cId]);
    }
  };

  const overlappingQuestions = useMemo(() => {
    if (selectedCompanies.length < 2) return [];

    return questions
      .map((q) => {
        const matches = selectedCompanies.filter((c) => !!q.companies[c]);
        return {
          question: q,
          matchCount: matches.length,
          matches,
        };
      })
      .filter((item) => item.matchCount >= Math.min(minMatchCount, selectedCompanies.length))
      .sort((a, b) => b.matchCount - a.matchCount);
  }, [questions, selectedCompanies, minMatchCount]);

  const diffCounts = useMemo(() => {
    let easy = 0, med = 0, hard = 0;
    overlappingQuestions.forEach((item) => {
      if (item.question.difficulty === 'Easy') easy++;
      else if (item.question.difficulty === 'Medium') med++;
      else if (item.question.difficulty === 'Hard') hard++;
    });
    return { easy, med, hard };
  }, [overlappingQuestions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Company Overlap Matrix</h2>
              <p className="text-xs text-slate-400">
                Discover high-yield interview questions shared across multiple dream companies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Target Company Selector Chips */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Target Companies to Intersect (Selected: {selectedCompanies.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_COMPANIES.map((cId) => {
                const isSelected = selectedCompanies.includes(cId);
                const meta = companies[cId];
                return (
                  <button
                    key={cId}
                    onClick={() => toggleCompany(cId)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/40'
                        : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/40'
                    }`}
                  >
                    <CompanyLogo companyId={cId} size="sm" />
                    <span>{meta?.name || cId}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overlap Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-medium">Overlapping Questions</span>
              <p className="text-2xl font-bold font-mono text-indigo-400">{overlappingQuestions.length}</p>
            </div>
            <div>
              <span className="text-xs text-emerald-400 font-medium">Easy Problems</span>
              <p className="text-xl font-bold font-mono text-emerald-400">{diffCounts.easy}</p>
            </div>
            <div>
              <span className="text-xs text-amber-400 font-medium">Medium Problems</span>
              <p className="text-xl font-bold font-mono text-amber-400">{diffCounts.med}</p>
            </div>
            <div>
              <span className="text-xs text-rose-400 font-medium">Hard Problems</span>
              <p className="text-xl font-bold font-mono text-rose-400">{diffCounts.hard}</p>
            </div>
          </div>

          {/* Questions Result List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Matching Problems ({overlappingQuestions.length})
            </h3>

            <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
              {overlappingQuestions.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No overlapping questions found with the selected criteria.
                </div>
              ) : (
                overlappingQuestions.slice(0, 50).map(({ question: q, matchCount, matches }) => {
                  const prog = progress[String(q.id)];
                  const isSolved = prog?.status === 'solved' || prog?.status === 'mastered';

                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        onSelectQuestion(q);
                        onClose();
                      }}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-slate-400">#{q.id}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={`#/problem/${q.id}`}
                              onClick={(e) => {
                                if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                  e.preventDefault();
                                  onSelectQuestion(q);
                                  onClose();
                                }
                              }}
                              className="font-semibold text-slate-200 group-hover:text-indigo-300 hover:underline transition-colors truncate text-sm"
                            >
                              {q.title}
                            </a>
                            {isSolved && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-300 rounded border border-emerald-500/30">
                                Solved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                                q.difficulty === 'Easy'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : q.difficulty === 'Medium'
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <div className="flex items-center gap-1">
                              {matches.map((m) => (
                                <span
                                  key={m}
                                  className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700/50 capitalize"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-1 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/40">
                          {matchCount}/{selectedCompanies.length} match
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between px-5">
          <span className="text-xs text-slate-400">
            Tip: Prioritize solving questions with 3+ company overlap for maximum interview coverage.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
