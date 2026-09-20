import { api } from './client';

export interface CommunityStats {
  activeEngineers: number;
  solutionsSolved: number;
  companiesIndexed: number;
  verifiedQuestions: number;
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

export const communityApi = {
  getStats: async (): Promise<CommunityStats> => {
    const { data } = await api.get<CommunityStats>('/community/stats');
    return data;
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    const { data } = await api.get<LeaderboardUser[]>('/community/leaderboard');
    return data;
  },
};
