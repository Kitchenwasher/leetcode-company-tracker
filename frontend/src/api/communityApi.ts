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

  getStoredLeaderboard: (): LeaderboardUser[] | null => {
    try {
      const raw = sessionStorage.getItem(LEADERBOARD_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
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
    const { data } = await api.get<CommunityStats>('/community/stats', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    try {
      sessionStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data));
    } catch {}
    return data;
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    const { data } = await api.get<LeaderboardUser[]>('/community/leaderboard', {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    try {
      sessionStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(data));
    } catch {}
    return data;
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
