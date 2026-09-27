export type MockInterviewType = 'Coding' | 'Behavioral' | 'Mixed';

export interface CreateMockSessionInput {
  company: string;
  role?: string;
  type: MockInterviewType;
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
