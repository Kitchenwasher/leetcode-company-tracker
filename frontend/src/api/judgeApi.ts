import { api } from './client';

export interface TestCaseItem {
  input: string;
  expected?: string;
}

export interface TestCaseResultItem {
  caseIndex: number;
  input: string;
  output: string;
  expected?: string;
  passed: boolean;
  timeMs?: number;
  stdout?: string;
  error?: string;
}

export interface JudgeExecutionResponse {
  status: 'Accepted' | 'Wrong Answer' | 'Compile Error' | 'Runtime Error' | 'Time Limit Exceeded';
  runtimeMs: number;
  memoryMb?: number;
  totalCases: number;
  passedCases: number;
  results: TestCaseResultItem[];
  stdout?: string;
  stderr?: string;
  compileError?: string;
  beatsPercentile?: number;
}

export const judgeApi = {
  runCode: async (payload: {
    language: 'cpp' | 'python' | 'java' | 'javascript';
    code: string;
    testcases?: TestCaseItem[];
    customInput?: string;
  }): Promise<JudgeExecutionResponse> => {
    const res = await api.post('/judge/run', payload);
    return res.data;
  },

  submitCode: async (payload: {
    language: 'cpp' | 'python' | 'java' | 'javascript';
    code: string;
    testcases?: TestCaseItem[];
    questionId?: number | string;
  }): Promise<JudgeExecutionResponse> => {
    const res = await api.post('/judge/submit', payload);
    return res.data;
  },
};
