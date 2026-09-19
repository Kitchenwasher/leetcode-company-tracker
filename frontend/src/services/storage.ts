import { ProblemStatus, UserProgressItem, UserStoreState, Question } from '../types';

const STORAGE_KEY = 'leettracker_pro_user_data_v1';

export const DEFAULT_STATE: UserStoreState = {
  progress: {},
  dailyGoal: 3,
  activityLog: {},
  selectedCompany: 'google',
  selectedTimeframe: 'thirty-days',
  selectedDifficulty: 'all',
  selectedStatus: 'all',
  selectedTopic: 'all',
  searchQuery: '',
  sortBy: 'frequency',
  sortOrder: 'desc',
  curatedList: 'all',
  viewMode: 'table',
  darkMode: true,
  soundEnabled: true,
};

export const getTodayKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getUserStorageKey = (userId?: string): string => {
  if (!userId || userId === 'guest') return STORAGE_KEY;
  return `leettracker_user_${userId}_data_v1`;
};

export const loadStoredState = (userId?: string): UserStoreState => {
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      progress: parsed.progress || {},
      activityLog: parsed.activityLog || {},
    };
  } catch (e) {
    console.error('Failed to parse stored state:', e);
    return DEFAULT_STATE;
  }
};

export const saveStoredState = (state: UserStoreState, userId?: string) => {
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
};

// Spaced repetition interval calculator
export const getNextReviewDate = (currentIntervalDays: number = 1): { nextDate: string; nextInterval: number } => {
  // Common spaced repetition intervals: 1 -> 3 -> 7 -> 14 -> 30 -> 60
  const intervals = [1, 3, 7, 14, 30, 60];
  const currentIndex = intervals.findIndex(i => i >= currentIntervalDays);
  const nextInterval = currentIndex !== -1 && currentIndex < intervals.length - 1
    ? intervals[currentIndex + 1]
    : currentIntervalDays * 2;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + nextInterval);
  return {
    nextDate: targetDate.toISOString(),
    nextInterval,
  };
};

export const isDueForReview = (item?: UserProgressItem): boolean => {
  if (!item || !item.nextReviewAt) return false;
  const reviewTime = new Date(item.nextReviewAt).getTime();
  const now = new Date().getTime();
  return reviewTime <= now;
};

export const calculateStreaks = (activityLog: Record<string, number>): { currentStreak: number; longestStreak: number } => {
  const dates = Object.keys(activityLog)
    .filter(d => activityLog[d] > 0)
    .sort();

  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dateSet = new Set(dates);
  let currentStreak = 0;
  let longestStreak = 0;

  // Calculate current streak from today or yesterday
  const today = new Date();
  let checkDate = new Date(today);
  const todayStr = getTodayKey();

  if (!dateSet.has(todayStr)) {
    // Check if streak was active yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    if (dateSet.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let tempStreak = 0;
  if (dates.length > 0) {
    const sortedDateObjs = dates.map(d => new Date(d));
    tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < sortedDateObjs.length; i++) {
      const diffDays = Math.round((sortedDateObjs[i].getTime() - sortedDateObjs[i - 1].getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
};

// Export user data to JSON file
export const exportBackupJSON = (state: UserStoreState) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `leettracker_backup_${getTodayKey()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Export filtered questions to CSV
export const exportQuestionsCSV = (questions: Question[], progress: Record<string, UserProgressItem>, company: string) => {
  const headers = ['ID', 'Title', 'Difficulty', 'Acceptance %', 'Frequency %', 'Status', 'Starred', 'Notes', 'LeetCode URL'];
  const rows = questions.map(q => {
    const prog = progress[String(q.id)] || {};
    const freq = q.companies[company]?.all || q.companies[company]?.['thirty-days'] || '0.0%';
    const status = prog.status || 'todo';
    const starred = prog.isFavorite ? 'Yes' : 'No';
    const notes = (prog.notes || '').replace(/"/g, '""');
    return [
      q.id,
      `"${q.title}"`,
      q.difficulty,
      q.acceptance,
      freq,
      status,
      starred,
      `"${notes}"`,
      q.url,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `leetcode_${company}_${getTodayKey()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Generate realistic demo data for testing analytics & streaks immediately
export const generateDemoProgress = (questions: Question[]): { progress: Record<string, UserProgressItem>; activityLog: Record<string, number> } => {
  const progress: Record<string, UserProgressItem> = {};
  const activityLog: Record<string, number> = {};

  const sampleQuestions = questions.slice(0, 35);
  const now = new Date();

  // Create activity for last 14 days
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dStr = `${y}-${m}-${day}`;
    activityLog[dStr] = Math.floor(Math.random() * 4) + 1; // 1-4 solves per day
  }

  sampleQuestions.forEach((q, idx) => {
    let status: ProblemStatus = 'solved';
    if (idx % 7 === 0) status = 'mastered';
    else if (idx % 5 === 0) status = 'review';
    else if (idx % 4 === 0) status = 'in-progress';
    else status = 'solved';

    const lastSolved = new Date(now);
    lastSolved.setDate(lastSolved.getDate() - (idx % 12));

    const nextReview = new Date(lastSolved);
    nextReview.setDate(nextReview.getDate() + (idx % 2 === 0 ? -1 : 3)); // some due today

    progress[String(q.id)] = {
      questionId: q.id,
      status,
      isFavorite: idx % 3 === 0,
      notes: idx % 2 === 0 ? `Key intuition: Use hash map for $O(N)$ lookup. Watch out for edge cases with duplicates.` : '',
      confidence: (idx % 5) + 1,
      personalDifficulty: q.difficulty,
      timeSpentSeconds: 600 + (idx * 95),
      solveCount: (idx % 3) + 1,
      lastSolvedAt: lastSolved.toISOString(),
      nextReviewAt: nextReview.toISOString(),
      reviewIntervalDays: 3,
    };
  });

  return { progress, activityLog };
};

// Whiteboard diagram storage per user
export const getWhiteboardStorageKey = (userId?: string): string => {
  const uid = userId || 'guest';
  return `leettracker_whiteboard_${uid}_v1`;
};

export const loadWhiteboardDrawing = (questionId: string | number, userId?: string): string | null => {
  try {
    const key = getWhiteboardStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[String(questionId)] || null;
  } catch {
    return null;
  }
};

export const saveWhiteboardDrawing = (questionId: string | number, dataUrl: string, userId?: string) => {
  try {
    const key = getWhiteboardStorageKey(userId);
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    map[String(questionId)] = dataUrl;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save whiteboard drawing:', e);
  }
};

