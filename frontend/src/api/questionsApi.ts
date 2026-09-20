import { api } from './client';
import { Question } from '../types';
import { QuestionSolution } from '../types/solution';

export interface QuestionsQueryParams {
  company?: string;
  timeframe?: string;
  difficulty?: string;
  topic?: string;
  search?: string;
  track?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuestionsApiResponse {
  total: number;
  page: number;
  totalPages: number;
  questions: Question[];
}

export const questionsApi = {
  getQuestions: async (params: QuestionsQueryParams): Promise<QuestionsApiResponse> => {
    const res = await api.get<QuestionsApiResponse>('/questions', { params });
    return res.data;
  },

  getQuestion: async (id: number | string): Promise<Question> => {
    const res = await api.get<Question>(`/questions/${id}`);
    return res.data;
  },

  getDescription: async (id: number | string): Promise<any> => {
    const res = await api.get(`/questions/${id}/description`);
    return res.data;
  },

  getSolution: async (id: number | string, forceRegenerate: boolean = false): Promise<QuestionSolution> => {
    const res = await api.get<QuestionSolution>(`/questions/${id}/solution${forceRegenerate ? '?regenerate=true' : ''}`);
    return res.data;
  },

  generateAiSolution: async (id: number | string): Promise<QuestionSolution> => {
    const res = await api.post<QuestionSolution>(`/questions/${id}/ai-solution`);
    return res.data;
  },

  getCompanies: async (): Promise<Record<string, { totalQuestions: number; thirtyDaysCount: number }>> => {
    const res = await api.get('/questions/companies');
    return res.data;
  },
};
