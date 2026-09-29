import { Question } from '../types';

export const DSA_ACRONYMS: Record<string, string[]> = {
  dp: ['dynamic programming', 'memoization'],
  lru: ['lru cache', 'least recently used'],
  lfu: ['lfu cache', 'least frequently used'],
  lcs: ['longest common subsequence', 'longest continuous'],
  lis: ['longest increasing subsequence'],
  bfs: ['breadth-first search', 'breadth first'],
  dfs: ['depth-first search', 'depth first'],
  mst: ['minimum spanning tree', 'kruskal', 'prim'],
  dijkstra: ['shortest path', 'graph'],
  trie: ['trie', 'prefix tree'],
  bst: ['binary search tree'],
  kth: ['kth largest', 'kth smallest', 'top k'],
  topo: ['topological sort', 'topological'],
  sliding: ['sliding window'],
  window: ['sliding window'],
  pointers: ['two pointers'],
  pointer: ['two pointers'],
  heap: ['heap (priority queue)', 'priority queue', 'heap'],
  pq: ['heap (priority queue)', 'priority queue'],
  stack: ['stack', 'monotonic stack'],
};

/**
 * Intelligent filter matching for a question against a search query
 */
export function matchIntelligentSearch(q: Question, rawQuery: string): boolean {
  if (!rawQuery) return true;
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  // 1. Direct ID match (e.g., "42", "#42", "q42")
  const numericMatch = query.replace(/^#|^q\s*|^no\s*/i, '').trim();
  if (numericMatch && /^\d+$/.test(numericMatch)) {
    if (String(q.id) === numericMatch) return true;
  }

  const titleLower = (q.title || '').toLowerCase();
  const idStr = String(q.id);

  // 2. Exact match in title or ID substring
  if (titleLower.includes(query) || idStr.includes(query)) {
    return true;
  }

  // 3. Exact Acronym mapping check
  if (DSA_ACRONYMS[query]) {
    const expansions = DSA_ACRONYMS[query];
    for (const exp of expansions) {
      if (titleLower.includes(exp)) return true;
      if (q.topics?.some((t) => t.toLowerCase().includes(exp))) return true;
    }
  }

  // 4. Tokenized search: Every word typed in the query must match Title, Topics, Difficulty, or Companies
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const qTopics = (q.topics || []).map((t) => t.toLowerCase());
  const qCompanies = Object.keys(q.companies || {}).map((c) => c.toLowerCase());
  const qDiff = (q.difficulty || '').toLowerCase();

  const allTokensMatch = tokens.every((tok) => {
    // If token is a known DSA acronym
    const expansions = DSA_ACRONYMS[tok];
    if (expansions) {
      if (
        expansions.some(
          (exp) => titleLower.includes(exp) || qTopics.some((t) => t.includes(exp))
        )
      ) {
        return true;
      }
    }

    if (idStr.includes(tok)) return true;
    if (titleLower.includes(tok)) return true;
    if (qTopics.some((t) => t.includes(tok))) return true;
    if (qCompanies.some((c) => c.includes(tok))) return true;
    if (qDiff === tok) return true;

    return false;
  });

  return allTokensMatch;
}

/**
 * Score calculation for sorting search results by relevance
 */
export function scoreIntelligentSearch(q: Question, rawQuery: string): number {
  if (!rawQuery) return 0;
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 0;

  let score = 0;
  const idStr = String(q.id);
  const titleLower = (q.title || '').toLowerCase();

  const numericMatch = query.replace(/^#|^q\s*|^no\s*/i, '').trim();
  if (numericMatch && idStr === numericMatch) {
    return 1000;
  }

  if (titleLower === query) score += 500;
  else if (titleLower.startsWith(query)) score += 300;
  else if (titleLower.includes(query)) score += 150;

  const tokens = query.split(/\s+/).filter(Boolean);
  const qTopics = (q.topics || []).map((t) => t.toLowerCase());

  tokens.forEach((tok) => {
    if (titleLower.includes(tok)) score += 40;
    if (qTopics.some((t) => t.includes(tok))) score += 20;
  });

  return score;
}
