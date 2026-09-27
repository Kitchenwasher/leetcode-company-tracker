import { api } from './client';

export interface CreateMockSessionInput {
  company: string;
  role?: string;
  type: 'Coding' | 'Behavioral' | 'Mixed';
  difficulty?: string;
  score: number;
  durationMinutes: number;
  solvedCount: number;
  totalQuestions: number;
  feedback?: string;
  questionsData?: {
    id: number | string;
    title: string;
    difficulty?: string;
    solved?: boolean;
    timeSpentSeconds?: number;
  }[];
}

export interface MockSessionResponse {
  id: string;
  userId: string;
  company: string;
  role: string;
  type: string;
  difficulty?: string | null;
  score: number;
  durationMinutes: number;
  solvedCount: number;
  totalQuestions: number;
  feedback?: string | null;
  questionsData: any[];
  date: string;
  createdAt: string;
}

export const mockApi = {
  getSessions: async (): Promise<MockSessionResponse[]> => {
    const res = await api.get<MockSessionResponse[]>('/mock/sessions');
    return res.data;
  },

  recordSession: async (data: CreateMockSessionInput): Promise<MockSessionResponse> => {
    const res = await api.post<MockSessionResponse>('/mock/sessions', data);
    return res.data;
  },
};
