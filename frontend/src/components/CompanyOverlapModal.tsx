import React, { useState, useMemo } from 'react';
import { Question, CompanyMeta, ProblemStatus, UserProgressItem } from '../types';
import { X, Layers, Check, ExternalLink, ArrowRight, Star, Crown, Sparkles, Lock } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { sounds } from '../utils/sound';
import { useAuth } from '../context/AuthContext';

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
  const { isPro, setShowSubscriptionModal } = useAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col terminal-panel shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-primary tracking-wide uppercase">
                &gt; COMPANY_OVERLAP_MATRIX.sh
              </h2>
              <p className="text-[11px] text-textMuted">
                Discover high-yield interview questions shared across multiple target companies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-[2px] bg-surfaceElevated hover:bg-border text-textMuted hover:text-primary text-xs font-mono"
          >
            [ESC]
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Target Company Selector Chips */}
          <div>
            <label className="text-[11px] font-bold text-textMuted uppercase tracking-wider block mb-2">
              &gt; SELECT_TARGET_COMPANIES (SELECTED: {selectedCompanies.length})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_COMPANIES.map((cId) => {
                const isSelected = selectedCompanies.includes(cId);
                const meta = companies[cId];
                return (
                  <button
                    key={cId}
                    onClick={() => toggleCompany(cId)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-surfaceElevated text-primary border-borderActive shadow-terminal-glow'
                        : 'bg-surface text-textMuted hover:text-primary hover:border-primaryDim border border-border'
                    }`}
                  >
                    <CompanyLogo companyId={cId} size="sm" />
                    <span>[{meta?.name || cId}]</span>
                    {isSelected && <Check className="w-3 h-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overlap Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-[2px] bg-surface border border-border">
            <div>
              <span className="text-[10px] text-textMuted font-bold uppercase">&gt; OVERLAPPING_QS</span>
              <p className="text-2xl font-bold font-mono text-primary">{overlappingQuestions.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-easy font-bold uppercase">&gt; EASY_PROBLEMS</span>
              <p className="text-xl font-bold font-mono text-easy">{diffCounts.easy}</p>
            </div>
            <div>
              <span className="text-[10px] text-medium font-bold uppercase">&gt; MEDIUM_PROBLEMS</span>
              <p className="text-xl font-bold font-mono text-medium">{diffCounts.med}</p>
            </div>
            <div>
              <span className="text-[10px] text-hard font-bold uppercase">&gt; HARD_PROBLEMS</span>
              <p className="text-xl font-bold font-mono text-hard">{diffCounts.hard}</p>
            </div>
          </div>

          {/* Questions Result List */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
              &gt; MATCHING_PROBLEMS ({overlappingQuestions.length})
            </h3>

            <div className="divide-y divide-border border border-border rounded-[2px] overflow-hidden bg-surface">
              {overlappingQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs text-textMuted">
                  &gt; No overlapping questions found with the selected company criteria.
                </div>
              ) : (
                (isPro ? overlappingQuestions.slice(0, 50) : overlappingQuestions.slice(0, 1)).map(({ question: q, matchCount, matches }) => {
                  const prog = progress[String(q.id)];
                  const isSolved = prog?.status === 'solved' || prog?.status === 'mastered';

                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        onSelectQuestion(q);
                        onClose();
                      }}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-surfaceElevated transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-textMuted">#{q.id}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/problem/${q.id}`}
                              onClick={(e) => {
                                if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                                  e.preventDefault();
                                  onSelectQuestion(q);
                                  onClose();
                                }
                              }}
                              className="font-bold text-textPrimary group-hover:text-primary hover:text-primary hover:underline transition-colors truncate text-xs"
                            >
                              {q.title}
                            </a>
                            {isSolved && (
                              <span className="text-[10px] px-1 py-0.2 bg-surfaceElevated text-easy rounded-[1px] border border-easy/40 font-mono">
                                [SOLVED]
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 font-mono">
                            <span
                              className={`text-[10px] font-bold ${
                                q.difficulty === 'Easy'
                                  ? 'text-easy'
                                  : q.difficulty === 'Medium'
                                  ? 'text-medium'
                                  : 'text-hard'
                              }`}
                            >
                              [{q.difficulty.toUpperCase()}]
                            </span>
                            <span className="text-xs text-textMuted">•</span>
                            <div className="flex items-center gap-1">
                              {matches.map((m) => (
                                <span
                                  key={m}
                                  className="text-[10px] px-1.5 py-0.2 bg-surfaceElevated text-textMuted rounded-[1px] border border-border capitalize"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-surfaceElevated text-primary rounded-[2px] border border-primary/40">
                          [{matchCount}/{selectedCompanies.length}_MATCH]
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-textMuted group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
              {!isPro && overlappingQuestions.length > 1 && (
                <div className="p-6 bg-[#0E1217] border-t border-amber-400/20 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-400/10">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-extrabold uppercase mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Pro Intelligence</span>
                    </div>
                    <h4 className="text-sm font-bold text-white font-sans">
                      +{overlappingQuestions.length - 1} More Overlapping Questions Locked
                    </h4>
                    <p className="text-xs text-textMuted font-sans mt-1 leading-relaxed">
                      Upgrade to Pro to unlock the full multi-company overlap matrix and prioritize questions asked simultaneously by your target companies.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playMastered();
                      setShowSubscriptionModal(true);
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs font-sans tracking-wide shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Unlock All Overlaps with Pro &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface flex items-center justify-between px-4">
          <span className="text-[11px] text-textMuted">
            &gt; TIP: Questions with 3+ overlaps maximize interview prep coverage.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-[2px] bg-primary hover:bg-primaryHover text-black text-xs font-bold font-mono"
          >
            [ CLOSE_SESSION ]
          </button>
        </div>
      </div>
    </div>
  );
};
