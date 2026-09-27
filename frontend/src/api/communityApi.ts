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
}

export const communityApi = {
  getStats: async (): Promise<CommunityStats> => {
    const { data } = await api.get<CommunityStats>('/community/stats');
    return data;
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    const { data } = await api.get<LeaderboardUser[]>('/community/leaderboard');
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
    const { data } = await api.get<PostsResponse>('/community/posts', { params });
    return data;
  },

  getPostById: async (id: string): Promise<CommunityPost> => {
    const { data } = await api.get<CommunityPost>(`/community/posts/${id}`);
    return data;
  },

  createPost: async (payload: CreatePostParams): Promise<CommunityPost> => {
    const { data } = await api.post<CommunityPost>('/community/posts', payload);
    return data;
  },

  addComment: async (postId: string, content: string): Promise<CommunityComment> => {
    const { data } = await api.post<CommunityComment>(`/community/posts/${postId}/comments`, { content });
    return data;
  },

  toggleUpvote: async (postId: string): Promise<{ upvoted: boolean; upvotesCount: number }> => {
    const { data } = await api.post<{ upvoted: boolean; upvotesCount: number }>(`/community/posts/${postId}/upvote`);
    return data;
  },
};
