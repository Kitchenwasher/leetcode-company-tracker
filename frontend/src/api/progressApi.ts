import { api } from './client';
import { UserProgressItem, ProblemStatus } from '../types';

export const progressApi = {
  getProgress: async (): Promise<Record<string, UserProgressItem>> => {
    const res = await api.get<Record<string, UserProgressItem>>('/progress');
    return res.data;
  },

  updateQuestionProgress: async (
    questionId: number | string,
    patch: Partial<UserProgressItem>
  ): Promise<UserProgressItem> => {
    const res = await api.put<UserProgressItem>(`/progress/${questionId}`, patch);
    return res.data;
  },

  batchUpdateProgress: async (
    questionIds: (number | string)[],
    status: ProblemStatus = 'solved'
  ): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/progress/batch', {
      questionIds,
      status,
    });
    return res.data;
  },

  getStats: async (): Promise<{
    totalSolved: number;
    breakdown: { easy: number; medium: number; hard: number };
    todaySolved: number;
    activityLog: Record<string, number>;
  }> => {
    const res = await api.get('/progress/stats/summary');
    return res.data;
  },
};
