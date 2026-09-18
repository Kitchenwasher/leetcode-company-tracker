export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Timeframe = 'thirty-days' | 'three-months' | 'six-months' | 'more-than-six-months' | 'all';

export type ProblemStatus = 'todo' | 'in-progress' | 'solved' | 'review' | 'mastered';

export interface Question {
  id: number | string;
  title: string;
  url: string;
  difficulty: Difficulty;
  acceptance: string;
  topics: string[];
  isBlind75: boolean;
  isGrind169: boolean;
  companies: {
    [companyId: string]: {
      [timeframe: string]: string; // Frequency %
    };
  };
}

export interface CompanyMeta {
  id: string;
  name: string;
  tier: string;
  totalQuestions: number;
  thirtyDaysCount: number;
  threeMonthsCount: number;
  sixMonthsCount: number;
  allCount: number;
  diffCounts: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
}

export interface UserProgressItem {
  questionId: number | string;
  status: ProblemStatus;
  isFavorite: boolean;
  notes?: string;
  codeSnippet?: {
    lang: string;
    code: string;
  };
  confidence?: number; // 1 to 5
  personalDifficulty?: Difficulty;
  timeSpentSeconds?: number;
  solveCount?: number;
  lastSolvedAt?: string;
  nextReviewAt?: string;
  reviewIntervalDays?: number;
  tags?: string[];
}

export interface UserStoreState {
  progress: Record<string, UserProgressItem>;
  dailyGoal: number; // default 3
  activityLog: Record<string, number>; // date 'YYYY-MM-DD' -> count
  selectedCompany: string; // default 'google'
  selectedTimeframe: Timeframe;
  selectedDifficulty: 'all' | Difficulty;
  selectedStatus: 'all' | ProblemStatus | 'favorite' | 'due-review';
  selectedTopic: string;
  searchQuery: string;
  sortBy: 'frequency' | 'acceptance' | 'id' | 'title' | 'difficulty' | 'status';
  sortOrder: 'asc' | 'desc';
  curatedList: 'all' | 'blind75' | 'grind169' | 'sprint30';
  viewMode: 'table' | 'card';
  darkMode: boolean;
  soundEnabled: boolean;
}

export interface MockInterviewState {
  isActive: boolean;
  durationSeconds: number;
  elapsedSeconds: number;
  questions: Question[];
  currentQuestionIndex: number;
  company: string;
}
