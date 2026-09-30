import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface QuestionDatasetItem {
  id: number;
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptance: string;
  topics: string[];
  isBlind75?: boolean;
  isGrind169?: boolean;
  isNeetCode150?: boolean;
  isStriver180?: boolean;
  companies?: Record<string, any>;
}

// In-memory indexed dictionary for 0ms lookup
let questionsMap: Map<number, QuestionDatasetItem> | null = null;

function loadQuestionsMap(): Map<number, QuestionDatasetItem> {
  if (questionsMap) return questionsMap;

  questionsMap = new Map();

  const candidatePaths = [
    path.resolve(process.cwd(), 'data/leetcode_company_data.json'),
    path.resolve(process.cwd(), 'src/data/leetcode_company_data.json'),
    path.resolve(__dirname, '../data/leetcode_company_data.json'),
    path.resolve(__dirname, '../../data/leetcode_company_data.json'),
    path.resolve(process.cwd(), '../frontend/public/data/leetcode_company_data.json'),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
        for (const item of list) {
          const numId = parseInt(String(item.id), 10);
          if (!isNaN(numId)) {
            questionsMap.set(numId, item);
          }
        }
        console.log(`[questionDataService] Loaded ${questionsMap.size} questions from ${filePath}`);
        break;
      }
    } catch (err) {
      console.warn(`[questionDataService] Failed to load dataset from ${filePath}:`, err);
    }
  }

  return questionsMap;
}

export const questionDataService = {
  getQuestionMeta(id: number): QuestionDatasetItem | null {
    const map = loadQuestionsMap();
    return map.get(id) || null;
  },

  resolveSlug(id: number, url?: string, title?: string): string {
    if (url) {
      const parts = url.replace(/\/+$/, '').split('/');
      const last = parts[parts.length - 1];
      if (last && last !== 'problems') {
        return last.toLowerCase().trim();
      }
    }

    const meta = this.getQuestionMeta(id);
    if (meta?.url) {
      const parts = meta.url.replace(/\/+$/, '').split('/');
      const last = parts[parts.length - 1];
      if (last && last !== 'problems') {
        return last.toLowerCase().trim();
      }
    }

    const candidateTitle = title || meta?.title;
    if (candidateTitle) {
      return candidateTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    return '';
  },

  async fetchLeetCodeGraphQL(titleSlug: string): Promise<any | null> {
    try {
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://leetcode.com',
          'Origin': 'https://leetcode.com',
        },
        body: JSON.stringify({
          query: `query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              title
              content
              difficulty
              exampleTestcaseList
              topicTags { name }
              codeSnippets {
                lang
                langSlug
                code
              }
            }
          }`,
          variables: { titleSlug },
        }),
      });

      if (!res.ok) {
        console.warn(`[LeetCode GraphQL] HTTP ${res.status} for '${titleSlug}'`);
        return null;
      }

      const data = (await res.json()) as any;
      return data?.data?.question || null;
    } catch (err) {
      console.warn(`[LeetCode GraphQL] Fetch error for '${titleSlug}':`, err);
      return null;
    }
  },
};
