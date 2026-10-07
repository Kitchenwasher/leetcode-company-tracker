import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Trophy,
  Flame,
  Sparkles,
  Building2,
  FileText,
  Loader2,
  Plus,
  Search,
  ThumbsUp,
  MessageCircle,
  Briefcase,
  HelpCircle,
  DollarSign,
  ChevronDown,
  Send,
  CheckCircle2
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { communityApi, CommunityStats, LeaderboardUser, CommunityPost, CommunityComment, DEFAULT_LEADERBOARD } from '../api/communityApi';
import { AdBanner } from './AdBanner';
import { CreatePostModal } from './CreatePostModal';
import { useAuth } from '../context/AuthContext';

export const CommunityPage: React.FC = () => {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  
  // Instant Fast SWR Initializers: Load immediately from sessionStorage or default fallback so 0ms loading flash
  const [stats, setStats] = useState<CommunityStats | null>(() => communityApi.getStoredStats());
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => communityApi.getStoredLeaderboard());
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const cached = communityApi.getStoredPosts('all:all::hot');
    return cached ? cached.posts : [];
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [postsLoading, setPostsLoading] = useState<boolean>(() => !communityApi.getStoredPosts('all:all::hot'));

  const [activeTab, setActiveTab] = useState<'all' | 'interview_experience' | 'question_help' | 'compensation' | 'leaderboard'>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Active expanded comments thread
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommunityComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const displayLeaderboard = leaderboard && leaderboard.length > 0 ? leaderboard : DEFAULT_LEADERBOARD;

  // Load KPI Stats & Leaderboard (silently revalidates in background with independent resilience)
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.allSettled([
          communityApi.getStats(),
          communityApi.getLeaderboard(),
        ]);
        if (isMounted) {
          if (statsRes.status === 'fulfilled' && statsRes.value) {
            setStats(statsRes.value);
          }
          if (leaderboardRes.status === 'fulfilled' && Array.isArray(leaderboardRes.value) && leaderboardRes.value.length > 0) {
            setLeaderboard(leaderboardRes.value);
          }
        }
      } catch (err) {
        console.error('Failed to load community metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Posts when active tab, company, or search changes
  useEffect(() => {
    if (activeTab === 'leaderboard') return;

    setPostsLoading(true);

    let isMounted = true;
    const fetchPosts = async () => {
      try {
        const res = await communityApi.getPosts({
          category: activeTab === 'all' ? undefined : activeTab,
          company: selectedCompany === 'all' ? undefined : selectedCompany,
          search: searchQuery.trim() || undefined,
          sortBy: 'hot',
        });
        if (isMounted) {
          setPosts(res.posts || []);
        }
      } catch (err) {
        console.error('Failed to load community posts:', err);
      } finally {
        if (isMounted) setPostsLoading(false);
      }
    };

    const timeout = setTimeout(fetchPosts, searchQuery ? 300 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [activeTab, selectedCompany, searchQuery]);

  const handleToggleUpvote = async (postId: string) => {
    sounds.playClick();
    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const nextUpvoted = !p.hasUpvoted;
            return {
              ...p,
              hasUpvoted: nextUpvoted,
              upvotesCount: nextUpvoted ? p.upvotesCount + 1 : Math.max(0, p.upvotesCount - 1),
            };
          }
          return p;
        })
      );

      const res = await communityApi.toggleUpvote(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, hasUpvoted: res.upvoted, upvotesCount: res.upvotesCount } : p))
      );
    } catch (err) {
      console.error('Failed to toggle upvote:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    sounds.playClick();
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);
    if (!commentsMap[postId]) {
      try {
        const fullPost = await communityApi.getPostById(postId);
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: fullPost.comments || [],
        }));
      } catch (err) {
        console.error('Failed to load post comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || text.length < 2) return;

    try {
      setSubmittingComment(postId);
      sounds.playClick();
      const newComment = await communityApi.addComment(postId, text);
      sounds.playSuccess();

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

      // Increment comment count in post card
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
      );
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(null);
    }
  };

  const handlePostCreated = (newPost: CommunityPost) => {
    sounds.playSuccess();
    setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
    if (activeTab !== 'all' && activeTab !== newPost.category) {
      setActiveTab(newPost.category as any);
    }
    if (selectedCompany !== 'all' && newPost.companyId && selectedCompany !== newPost.companyId) {
      setSelectedCompany('all');
    }
    setStats((prev) => (prev ? { ...prev, communityPosts: (prev.communityPosts || 0) + 1 } : null));
  };

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
            Live technical interview discussions, verified company interview breakdowns, and algorithmic insights.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 cursor-pointer shrink-0 font-sans"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion / Share Experience</span>
        </button>
      </div>

      {/* Top Banner Ad (Free Tier only) */}
      <AdBanner format="horizontal" variant="jetbrains" slotId="community-top-banner" className="my-2" />

      {/* Row 1: Real Community Platform Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E1217] border border-white/[0.08]">
          <p className="text-xs text-textMuted uppercase font-medium">Registered Engineers</p>
          <p className="text-2xl font-bold text-white font-mono mt-1">
            {stats ? stats.activeEngineers.toLocaleString() : '1,280'}
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

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-3 select-none">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Discussions', icon: MessageSquare },
            { id: 'interview_experience', label: 'Interview Loops', icon: Briefcase },
            { id: 'question_help', label: 'Problem Help', icon: HelpCircle },
            { id: 'compensation', label: 'Offers & Compensation', icon: DollarSign },
            { id: 'leaderboard', label: 'Top Contributors', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 font-sans ${
                  isActive
                    ? 'bg-primary text-black shadow-md shadow-primary/20'
                    : 'bg-[#0E1217] border border-white/[0.08] text-textSecondary hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Company Filter */}
        {activeTab !== 'leaderboard' && (
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions..."
                className="w-full bg-[#0E1217] border border-white/[0.08] focus:border-primary rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-textMuted focus:outline-none"
              />
            </div>

            {/* Company Filter Dropdown */}
            <select
              value={selectedCompany}
              onChange={(e) => {
                sounds.playClick();
                setSelectedCompany(e.target.value);
              }}
              className="bg-[#0E1217] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Companies</option>
              <option value="google">Google</option>
              <option value="meta">Meta</option>
              <option value="amazon">Amazon</option>
              <option value="microsoft">Microsoft</option>
              <option value="apple">Apple</option>
              <option value="netflix">Netflix</option>
              <option value="uber">Uber</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'leaderboard' ? (
        /* Leaderboard Full View */
        <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-white">Top 10 Global Leaderboard</h2>
            </div>
            <span className="text-xs text-textMuted font-mono">Live Ranking</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {displayLeaderboard.map((u) => (
              <div key={u.id} className="py-4 flex items-center justify-between hover:bg-white/[0.01] px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono ${
                    u.rank === 1
                      ? 'bg-primary text-black shadow-lg shadow-primary/30 ring-2 ring-primary/50'
                      : u.rank === 2
                      ? 'bg-zinc-300 text-black font-extrabold'
                      : u.rank === 3
                      ? 'bg-amber-600 text-white font-extrabold'
                      : 'bg-white/[0.06] text-white'
                  }`}>
                    {u.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {u.name || 'Anonymous Engineer'}
                      </p>
                      {u.tier === 'pro' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-textMuted">{u.badge}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white font-mono">{u.solved} Solved</span>
                  <p className="text-xs text-primary flex items-center gap-1 justify-end mt-0.5">
                    <Flame className="w-3.5 h-3.5 fill-primary" />
                    <span>{u.streak}d Streak</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Discussions & Posts Feed (8 cols) + Leaderboard Widget (4 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Posts Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {postsLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-textMuted bg-[#0E1217] rounded-2xl border border-white/[0.08]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Loading community discussions...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-[#0E1217] rounded-2xl border border-white/[0.08]">
                <MessageSquare className="w-8 h-8 text-textMuted mx-auto" />
                <p className="text-sm font-semibold text-white">No discussions found</p>
                <p className="text-xs text-textSecondary max-w-sm mx-auto">
                  Be the first engineer to share an interview experience or ask a question for this topic!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-purple-600 transition-colors cursor-pointer"
                >
                  Create First Discussion
                </button>
              </div>
            ) : (
              posts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                const comments = commentsMap[post.id] || [];

                return (
                  <div
                    key={post.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[#0E1217] border border-white/[0.08] hover:border-white/15 transition-all space-y-4"
                  >
                    {/* Post Author & Metadata Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs uppercase font-mono">
                          {post.authorName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">
                              {post.authorName}
                            </span>
                            {post.authorTier === 'pro' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[9px] font-bold">
                                PRO
                              </span>
                            )}
                            {post.companyId && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/[0.04] text-textSecondary border border-white/[0.06]">
                                {post.companyId}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-textMuted font-mono">
                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] text-textSecondary border border-white/[0.06] capitalize">
                        {post.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Post Title & Content */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm sm:text-base text-white hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleToggleComments(post.id)}
                      >
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] bg-white/[0.03] text-textSecondary border border-white/[0.05]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Bar: Upvote & Comment Button */}
                    <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Upvote Button */}
                        <button
                          onClick={() => handleToggleUpvote(post.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            post.hasUpvoted
                              ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/20'
                              : 'bg-white/[0.03] border-white/[0.06] text-textSecondary hover:text-white hover:border-white/15'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${post.hasUpvoted ? 'fill-primary' : ''}`} />
                          <span className="font-mono">{post.upvotesCount}</span>
                        </button>

                        {/* Comment Button */}
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 text-textSecondary hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="font-mono">{post.commentsCount}</span>
                          <span className="hidden sm:inline">Comments</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="text-xs font-medium text-textMuted hover:text-primary transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Hide Discussion' : 'Join Discussion &rarr;'}
                      </button>
                    </div>

                    {/* Expandable Comments Drawer */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-white/[0.06] space-y-4 animate-fade-in">
                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments.length === 0 ? (
                            <p className="text-xs text-textMuted italic py-2">
                              No comments yet. Be the first to share your perspective!
                            </p>
                          ) : (
                            comments.map((c) => (
                              <div key={c.id} className="p-3 rounded-xl bg-[#12161E]/70 border border-white/[0.05] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-white">{c.authorName}</span>
                                    {c.authorTier === 'pro' && (
                                      <span className="px-1 py-0.1 rounded bg-amber-400/10 text-amber-300 text-[8px] font-bold">
                                        PRO
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-textMuted font-mono">
                                    {new Date(c.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{c.content}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Comment Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            placeholder="Write an insightful response..."
                            className="flex-1 bg-[#12161E] border border-white/[0.08] focus:border-primary rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none placeholder:text-textMuted"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={submittingComment === post.id}
                            className="px-4 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
                          >
                            {submittingComment === post.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Reply</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Rail: Top Contributors Leaderboard Card (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-white">Top Contributors</h2>
                </div>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="text-xs text-textMuted hover:text-white font-mono hover:underline cursor-pointer"
                >
                  View All &rarr;
                </button>
              </div>

              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-textMuted">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-xs">Loading rankings...</span>
                </div>
              ) : displayLeaderboard.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {displayLeaderboard.slice(0, 5).map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                          u.rank === 1 ? 'bg-primary text-black' : 'bg-white/[0.05] text-white'
                        }`}>
                          {u.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                              {u.name || 'Engineer'}
                            </p>
                            {u.tier === 'pro' && (
                              <span className="px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-bold">
                                PRO
                              </span>
                            )}
                          </div>
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
                  <p>Solve questions and claim #1 rank!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default CommunityPage;
