export interface QuestionsFilterState {
  company?: string;
  difficulty?: string;
  topic?: string;
  status?: string;
  curated?: string;
  sort?: string;
  search?: string;
  page?: number;
}

const STORAGE_KEY = 'leettracker_questions_filters_v2';
const ROLL_ANIMATION_KEY = 'leettracker_roll_animation_enabled_v1';

export function getStoredQuestionFilters(): QuestionsFilterState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredQuestionFilters(filters: QuestionsFilterState): void {
  try {
    // Only store defined and non-default values to keep storage clean
    const cleaned: QuestionsFilterState = {};
    if (filters.company && filters.company !== 'all') cleaned.company = filters.company;
    if (filters.difficulty && filters.difficulty !== 'all') cleaned.difficulty = filters.difficulty;
    if (filters.topic && filters.topic !== 'all') cleaned.topic = filters.topic;
    if (filters.status && filters.status !== 'all') cleaned.status = filters.status;
    if (filters.curated && filters.curated !== 'all') cleaned.curated = filters.curated;
    if (filters.sort && filters.sort !== 'recent') cleaned.sort = filters.sort;
    if (filters.search && filters.search.trim()) cleaned.search = filters.search.trim();
    if (filters.page && filters.page > 1) cleaned.page = filters.page;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {}
}

export function clearStoredQuestionFilters(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getRollAnimationEnabled(): boolean {
  try {
    const raw = localStorage.getItem(ROLL_ANIMATION_KEY);
    return raw !== null ? raw === 'true' : true; // Default to true (enabled)
  } catch {
    return true;
  }
}

export function setRollAnimationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ROLL_ANIMATION_KEY, String(enabled));
  } catch {}
}
