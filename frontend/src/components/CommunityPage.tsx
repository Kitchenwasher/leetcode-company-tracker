import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Trophy,
  Flame,
  Sparkles,
  Building2,
  FileText,
  Loader2
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { communityApi, CommunityStats, LeaderboardUser } from '../api/communityApi';
import { AdBanner } from './AdBanner';

const INTERVIEW_EXPERIENCES = [
  {
    id: '1',
    company: 'Google',
    role: 'Software Engineer (L4)',
    rounds: 4,
    date: 'Verified Format',
    source: 'Interview Loop Analysis',
    preview: 'Round 1 focuses on Course Schedule II / Graph Traversal. Round 2 tests distributed LRU Cache and memory eviction strategies under high write contention.',
    tags: ['Graph', 'Topological Sort', 'System Design'],
    badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    id: '2',
    company: 'Meta',
    role: 'Production / Full Stack Engineer (E4)',
    rounds: 3,
    date: 'Verified Format',
    source: 'Interview Loop Analysis',
    preview: 'Coding 1 covers Valid Parentheses and Subarray Sum Equals K. Implementation speed, clean invariants, and zero compilation bugs are heavily weighted.',
    tags: ['Hash Table', 'Prefix Sum', 'Two Pointers'],
    badgeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  },
  {
    id: '3',
    company: 'Amazon',
    role: 'SDE II',
    rounds: 5,
    date: 'Verified Format',
    source: 'Interview Loop Analysis',
    preview: 'Emphasis on Customer Obsession and Deliver Results alongside BFS shortest paths (Word Ladder) and modular Object-Oriented Design (File Search API).',
    tags: ['BFS', 'OOD', 'Leadership Principles'],
    badgeColor: 'text-primary bg-primary/10 border-primary/30',
  },
];

export const CommunityPage: React.FC = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [s, l] = await Promise.all([
          communityApi.getStats(),
          communityApi.getLeaderboard(),
        ]);
        if (isMounted) {
          setStats(s);
          setLeaderboard(l);
        }
      } catch (err) {
        console.error('Failed to load community metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Community &amp; Benchmarks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-sans">
            Cheat Code Developer Community
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
            Live metrics from our database, verified company interview breakdowns, and platform rankings.
          </p>
        </div>

      </div>

      {/* Top Banner Ad (Free Tier only) */}
      <AdBanner format="horizontal" variant="jetbrains" slotId="community-top-banner" className="my-2" />

      {/* Row 1: Real Community Platform Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Registered Engineers</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">
            {stats ? stats.activeEngineers.toLocaleString() : (
              <span className="text-zinc-600 text-lg">...</span>
            )}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">Live platform accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Verified Questions</p>
          <p className="text-2xl font-bold text-primary font-mono mt-1">
            {stats ? stats.verifiedQuestions.toLocaleString() : '3,399'}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">Company-tagged questions</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Solutions Solved</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {stats ? stats.solutionsSolved.toLocaleString() : '0'}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">Logged across community</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Companies Indexed</p>
          <p className="text-2xl font-bold text-blue-400 font-mono mt-1">
            {stats ? stats.companiesIndexed.toLocaleString() : '659'}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">FAANG &amp; tech companies</p>
        </div>
      </div>

      {/* Row 2: Interview Formats (8 cols) + Real Leaderboard (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 2: Interview Formats (8 cols) */}
        <div className="lg:col-span-8 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-white">Verified Company Interview Loops</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">Curated Breakdowns</span>
          </div>

          <div className="space-y-3.5">
            {INTERVIEW_EXPERIENCES.map((exp) => (
              <div
                key={exp.id}
                className="p-5 rounded-xl bg-[#12161E]/60 border border-white/[0.06] hover:border-white/20 transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                      {exp.company}
                    </span>
                    <span className="text-xs text-textSecondary">• {exp.role}</span>
                  </div>
                  <span className="text-xs text-textMuted font-mono">{exp.date}</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {exp.preview}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {exp.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[11px] bg-white/[0.04] text-textSecondary border border-white/[0.06]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <span className="text-xs text-textMuted font-mono">{exp.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Real Database Leaderboard (4 cols) */}
        <div className="lg:col-span-4 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-white">Top Contributors</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">Cloud Sync Live</span>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-textMuted">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">Loading rankings...</span>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {leaderboard.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      u.rank === 1 ? 'bg-primary text-black' : 'bg-white/[0.05] text-white'
                    }`}>
                      {u.rank}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white truncate max-w-[130px]">
                        {u.name || 'Engineer'}
                      </p>
                      <p className="text-[11px] text-textMuted">{u.badge}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-white font-mono">{u.solved} solved</span>
                    <p className="text-[10px] text-primary flex items-center gap-0.5 justify-end">
                      <Flame className="w-3 h-3 fill-primary" />
                      <span>{u.streak}d streak</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-textSecondary space-y-1">
              <p className="text-white font-medium">No rankings yet</p>
              <p>Be the first engineer to solve questions and claim #1 rank!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
