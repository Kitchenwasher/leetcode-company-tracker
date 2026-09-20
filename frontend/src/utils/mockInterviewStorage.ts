export interface CompletedMockSession {
  id: string;
  company: string;
  role: string;
  type: 'Coding' | 'Behavioral' | 'Mixed';
  difficulty?: string;
  score: number; // 0 to 100
  durationMinutes: number;
  solvedCount: number;
  totalQuestions: number;
  date: string;
  timestamp: number;
}

const STORAGE_KEY = 'cheatcode_mock_interviews';

export const getMockInterviews = (): CompletedMockSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load mock interviews from storage:', err);
    return [];
  }
};

export const saveMockInterview = (session: CompletedMockSession): void => {
  try {
    const existing = getMockInterviews();
    // Prepend new session
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save mock interview:', err);
  }
};

export const clearMockInterviews = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear mock interviews:', err);
  }
};
