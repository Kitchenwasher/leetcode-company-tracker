import { Timeframe } from '../types';

/**
 * Timeframe recency permissions:
 * - 'thirty-days', 'three-months', 'six-months' are Pro-exclusive high-yield recency filters.
 * - 'all' (All Time) and 'more-than-six-months' (1 Year+) are free for all users.
 */
export const isTimeframePro = (timeframe: Timeframe): boolean => {
  return timeframe === 'thirty-days' || timeframe === 'three-months' || timeframe === 'six-months';
};

export const canAccessTimeframe = (timeframe: Timeframe, isPro: boolean): boolean => {
  if (isPro) return true;
  return !isTimeframePro(timeframe);
};

export const canUseAiGeneration = (isPro: boolean): boolean => {
  return isPro;
};

export const canAccessOverlapMatrix = (isPro: boolean): boolean => {
  return isPro;
};

export const canAccessPrepPlanner = (isPro: boolean): boolean => {
  return isPro;
};

export const canExportAnkiOrObsidian = (isPro: boolean): boolean => {
  return isPro;
};

export const shouldShowAds = (isPro: boolean): boolean => {
  return !isPro;
};

// Daily Mock Interview Quota (1 per day for Free, Unlimited for Pro)
const MOCK_STORAGE_KEY = 'cheatcode_daily_mock_records';

export const getRemainingDailyMocks = (userId: string, isPro: boolean): number => {
  if (isPro) return 999;
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`${MOCK_STORAGE_KEY}_${userId}`);
    if (!raw) return 1;
    const record = JSON.parse(raw);
    if (record.date !== today) return 1;
    return Math.max(0, 1 - (record.count || 0));
  } catch {
    return 1;
  }
};

export const recordMockInterviewTaken = (userId: string): void => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`${MOCK_STORAGE_KEY}_${userId}`);
    let count = 0;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        count = parsed.count || 0;
      }
    }
    localStorage.setItem(
      `${MOCK_STORAGE_KEY}_${userId}`,
      JSON.stringify({ date: today, count: count + 1 })
    );
  } catch {}
};
