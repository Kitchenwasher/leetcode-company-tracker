import React, { useState } from 'react';
import {
  Shield,
  Users,
  MessageSquare,
  Award,
  Trophy,
  ExternalLink,
  Flame,
  Building2,
  BookOpen,
  ArrowRight,
  Heart,
  Share2,
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/sound';

const INTERVIEW_EXPERIENCES = [
  {
    id: '1',
    company: 'Google',
    role: 'Software Engineer (L4)',
    rounds: 4,
    date: '2 days ago',
    author: 'Alex C.',
    preview: 'Round 1 was a variation of Course Schedule II (Topological Sort). Round 2 focused on distributed LRU Cache eviction under memory pressure.',
    tags: ['Graph', 'System Design', 'Offer Accepted'],
    badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    id: '2',
    company: 'Meta',
    role: 'Full Stack Engineer (E4)',
    rounds: 3,
    date: '3 days ago',
    author: 'Priya R.',
    preview: 'Coding 1 was Valid Parentheses + Subarray Sum Equals K. Implementation speed and zero compile errors were heavily weighed.',
    tags: ['Hash Table', 'Prefix Sum', 'Offer Accepted'],
    badgeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  },
  {
    id: '3',
    company: 'Amazon',
    role: 'SDE II',
    rounds: 5,
    date: '5 days ago',
    author: 'Michael T.',
    preview: 'Heavy emphasis on Leadership Principles (Customer Obsession, Deliver Results). Technical rounds covered Word Ladder and File Search API.',
    tags: ['BFS', 'OOD', 'Offer Accepted'],
    badgeColor: 'text-[#E5FF00] bg-[#E5FF00]/10 border-[#E5FF00]/30',
  },
];

const LEADERBOARD = [
  { rank: 1, name: 'k_vasu', solved: 48, streak: 64, badge: 'Grandmaster' },
  { rank: 2, name: 'dev_nitish', solved: 42, streak: 52, badge: 'Master' },
  { rank: 3, name: 'sarah_algo', solved: 39, streak: 45, badge: 'Expert' },
  { rank: 4, name: 'dp_wizard', solved: 35, streak: 38, badge: 'Specialist' },
  { rank: 5, name: 'chen_code', solved: 31, streak: 30, badge: 'Specialist' },
];

export const CommunityPage: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('all');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Community Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-sans">
            Cheat Code Developer Community
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
            Real interview debriefs, algorithmic discussions, and peer study groups targeting Tier-1 tech companies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Kitchenwasher/leetcode-company-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#0E1217] border border-white/[0.08] hover:border-white/20 text-white hover:text-primary text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>

      {/* Row 1: Community Hero Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Active Engineers</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">12,450+</p>
          <p className="text-xs text-textSecondary mt-0.5">Practicing daily</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Interview Debriefs</p>
          <p className="text-2xl font-bold text-primary font-mono mt-1">850+</p>
          <p className="text-xs text-textSecondary mt-0.5">Verified candidate reports</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Solutions Posted</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">4,200+</p>
          <p className="text-xs text-textSecondary mt-0.5">Community explanations</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Study Circles</p>
          <p className="text-2xl font-bold text-blue-400 font-mono mt-1">36 Active</p>
          <p className="text-xs text-textSecondary mt-0.5">FAANG prep cohorts</p>
        </div>
      </div>

      {/* Row 2: Interview Experiences (8 cols) + Leaderboard (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 2: Interview Experiences (8 cols) */}
        <div className="lg:col-span-8 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-white">Recent Interview Experiences</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">Verified Reports</span>
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

                  <span className="text-xs text-textMuted font-mono">by {exp.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Leaderboard (4 cols) */}
        <div className="lg:col-span-4 bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-white">Top Contributors</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">Weekly</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {LEADERBOARD.map((user) => (
              <div key={user.rank} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    user.rank === 1 ? 'bg-primary text-black' : 'bg-white/[0.05] text-white'
                  }`}>
                    {user.rank}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[11px] text-textMuted">{user.badge}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-white font-mono">{user.solved} solved</span>
                  <p className="text-[10px] text-primary flex items-center gap-0.5 justify-end">
                    <Flame className="w-3 h-3 fill-primary" />
                    <span>{user.streak}d</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
