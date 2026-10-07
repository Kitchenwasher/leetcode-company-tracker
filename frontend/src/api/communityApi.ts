import { api } from './client';

export interface CommunityStats {
  activeEngineers: number;
  solutionsSolved: number;
  companiesIndexed: number;
  verifiedQuestions: number;
  communityPosts?: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  solved: number;
  streak: number;
  badge: string;
  tier: string;
  rank: number;
}

export type PostCategory = 'all' | 'interview_experience' | 'question_help' | 'general' | 'compensation';

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorTier: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorTier: string;
  title: string;
  content: string;
  category: string;
  companyId?: string | null;
  questionId?: number | null;
  tags: string[];
  upvotesCount: number;
  commentsCount: number;
  hasUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: CommunityComment[];
}

export interface PostsResponse {
  total: number;
  page: number;
  totalPages: number;
  posts: CommunityPost[];
}

export interface CreatePostParams {
  title: string;
  content: string;
  category: 'interview_experience' | 'question_help' | 'general' | 'compensation';
  companyId?: string;
  questionId?: number;
  tags?: string[];
  authorName?: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardUser[] = [
  {
    id: 'fd28c830-aebb-469a-ba38-e8f3edd5aa26',
    name: 'Abhinav sharma',
    solved: 25,
    streak: 11,
    badge: 'Expert',
    tier: 'pro',
    rank: 1,
  },
  {
    id: '4505a147-217f-497d-87b4-420c28320d32',
    name: 'NikkiKush14',
    solved: 10,
    streak: 9,
    badge: 'Specialist',
    tier: 'pro',
    rank: 2,
  },
  {
    id: 'bd73b881-ea50-4e06-8b12-0b7dd8cb27ac',
    name: 'Bismeet Singh',
    solved: 3,
    streak: 2,
    badge: 'Novice',
    tier: 'free',
    rank: 3,
  },
  {
    id: '0bed43c8-0d57-4d60-bca9-ed185ca07109',
    name: 'Bruce wayne',
    solved: 1,
    streak: 1,
    badge: 'Novice',
    tier: 'free',
    rank: 4,
  },
  {
    id: '466902a9-90aa-495f-9010-624138094048',
    name: 'Aditya_36',
    solved: 1,
    streak: 1,
    badge: 'Novice',
    tier: 'free',
    rank: 5,
  },
];

const STATS_STORAGE_KEY = 'leettracker_community_stats_v1';
const LEADERBOARD_STORAGE_KEY = 'leettracker_community_leaderboard_v1';

export const communityApi = {
  getStoredStats: (): CommunityStats | null => {
    try {
      const raw = sessionStorage.getItem(STATS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getStoredLeaderboard: (): LeaderboardUser[] => {
    try {
      const raw = sessionStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LEADERBOARD;
  },

  getStoredPosts: (_cacheKey: string): PostsResponse | null => {
    return null;
  },

  clearClientPostsCache: (): void => {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('leettracker_community_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}
  },

  getStats: async (): Promise<CommunityStats> => {
    try {
      const { data } = await api.get<CommunityStats>('/community/stats', {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      try {
        sessionStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data));
      } catch {}
      return data;
    } catch {
      return {
        activeEngineers: 6,
        solutionsSolved: 39,
        companiesIndexed: 659,
        verifiedQuestions: 3399,
        communityPosts: 0,
      };
    }
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    try {
      const { data } = await api.get<LeaderboardUser[]>('/community/leaderboard', {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (Array.isArray(data) && data.length > 0) {
        try {
          sessionStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('[communityApi] Failed to fetch live leaderboard, falling back:', err);
    }
    return communityApi.getStoredLeaderboard();
  },

  getPosts: async (params?: {
    category?: string;
    company?: string;
    search?: string;
    sortBy?: 'hot' | 'newest' | 'top';
    page?: number;
    limit?: number;
  }): Promise<PostsResponse> => {
    const { data } = await api.get<PostsResponse>('/community/posts', {
      params,
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    return data;
  },

  getPostById: async (id: string): Promise<CommunityPost> => {
    const { data } = await api.get<CommunityPost>(`/community/posts/${id}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    return data;
  },

  createPost: async (payload: CreatePostParams): Promise<CommunityPost> => {
    const { data } = await api.post<CommunityPost>('/community/posts', payload);
    communityApi.clearClientPostsCache();
    return data;
  },

  addComment: async (postId: string, content: string, authorName?: string): Promise<CommunityComment> => {
    const { data } = await api.post<CommunityComment>(`/community/posts/${postId}/comments`, { content, authorName });
    communityApi.clearClientPostsCache();
    return data;
  },

  toggleUpvote: async (postId: string): Promise<{ upvoted: boolean; upvotesCount: number }> => {
    const { data } = await api.post<{ upvoted: boolean; upvotesCount: number }>(`/community/posts/${postId}/upvote`);
    communityApi.clearClientPostsCache();
    return data;
  },
};
