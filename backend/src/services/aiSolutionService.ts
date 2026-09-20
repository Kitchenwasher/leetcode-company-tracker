import { ENV } from '../config/env.js';

export interface AiApproachPayload {
  id: string;
  name: string;
  tag: 'Brute Force' | 'Better' | 'Optimal' | 'Alternative';
  intuition: string;
  theory: string;
  cppCode?: string;
  code?: {
    cpp?: string;
    python?: string;
    java?: string;
    typescript?: string;
  };
  timeComplexity: {
    complexity: string;
    explanation: string;
  };
  spaceComplexity: {
    complexity: string;
    explanation: string;
  };
  dryRunExample?: {
    input: string;
    steps: string[];
    output: string;
  };
  edgeCases?: string[];
}

export interface AiSolutionPayload {
  questionId: number;
  title: string;
  difficulty: string;
  corePattern: string;
  interviewTips: string[];
  approaches: AiApproachPayload[];
}

export class AiSolutionService {
  static async generateSolution(params: {
    id: number;
    title: string;
    difficulty: string;
    topics: string[];
  }): Promise<AiSolutionPayload> {
    const { id, title, difficulty, topics } = params;

    const systemPrompt = `You are a Principal Software Engineer at Google and Meta.
Your task is to write a production-grade LeetCode solution editorial for the problem.
You MUST output a valid raw JSON object. Do NOT include markdown text outside the JSON object.

Format strictly as:
{
  "corePattern": "Algorithmic Pattern Name",
  "interviewTips": ["clarifying question 1", "trade-off 2", "edge-case tip 3"],
  "approaches": [
    {
      "id": "brute-force",
      "name": "Approach 1: Brute Force",
      "tag": "Brute Force",
      "intuition": "first principles intuition...",
      "theory": "theoretical reasoning...",
      "code": {
        "python": "class Solution:\\n    def ...",
        "cpp": "class Solution {\\npublic:\\n    ...\\n};",
        "java": "class Solution {\\n    public ...\\n}"
      },
      "timeComplexity": { "complexity": "O(...)", "explanation": "..." },
      "spaceComplexity": { "complexity": "O(...)", "explanation": "..." },
      "dryRunExample": { "input": "...", "steps": ["step 1", "step 2"], "output": "..." },
      "edgeCases": ["case 1", "case 2"]
    },
    {
      "id": "optimal",
      "name": "Approach 2: Optimal ...",
      "tag": "Optimal",
      "intuition": "...",
      "theory": "...",
      "code": {
        "python": "class Solution:\\n    def ...",
        "cpp": "class Solution {\\npublic:\\n    ...\\n};",
        "java": "class Solution {\\n    public ...\\n}"
      },
      "timeComplexity": { "complexity": "O(...)", "explanation": "..." },
      "spaceComplexity": { "complexity": "O(...)", "explanation": "..." },
      "dryRunExample": { "input": "...", "steps": ["step 1", "step 2"], "output": "..." },
      "edgeCases": ["case 1", "case 2"]
    }
  ]
    Be direct, structured, and focused in your reasoning so the complete JSON editorial finishes cleanly.`;

    const userPrompt = `Generate a multi-approach editorial for Problem #${id}: "${title}" (${difficulty}) [Topics: ${topics.join(', ')}]. Provide working Python 3, C++, and Java code for each approach.`;

    const endpoint = `${ENV.MUSE_API_URL.replace(/\/+$/, '')}/chat/completions`;

    let data: any = null;
    let lastError: any = null;

    // Retry loop with exponential backoff for network or transient errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ENV.MUSE_API_KEY}`,
          },
          body: JSON.stringify({
            model: ENV.MUSE_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 12000,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Meta Muse API returned HTTP ${response.status}: ${errText}`);
        }

        data = (await response.json()) as any;
        if (data?.choices?.[0]?.message?.content) {
          break; // Succeeded
        } else if (data?.choices?.[0]?.finish_reason === 'length') {
          throw new Error(`Meta Muse token length exceeded (usage: ${JSON.stringify(data?.usage || {})})`);
        }
      } catch (err: any) {
        lastError = err;
        if (attempt < 3) {
          const backoff = attempt * 3000;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    if (!data) {
      throw lastError || new Error('Failed to obtain response from Meta Muse API after 3 attempts.');
    }

    const choice = data?.choices?.[0];
    const rawContent = choice?.message?.content;

    if (!rawContent) {
      const reason = choice?.finish_reason || 'unknown';
      const usage = JSON.stringify(data?.usage || {});
      throw new Error(`Meta Muse API returned an empty completion response (finish_reason: ${reason}, usage: ${usage}).`);
    }

    // Extract JSON object boundary
    let parsed: any;
    const startIdx = rawContent.indexOf('{');
    const endIdx = rawContent.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonSub = rawContent.substring(startIdx, endIdx + 1);
      try {
        parsed = JSON.parse(jsonSub);
      } catch {
        // Fallback sanitize trailing commas if needed
        const sanitized = jsonSub.replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(sanitized);
      }
    } else {
      throw new Error('No valid JSON object found in Meta Muse response.');
    }

    // Normalize approaches and ensure backward-compatible cppCode
    const rawApproaches = parsed.approaches || parsed.solutions || [];
    const formattedApproaches: AiApproachPayload[] = rawApproaches.map((app: any, idx: number) => {
      let cpp = '';
      let python = '';
      let java = '';

      if (typeof app.code === 'string') {
        if (app.code.includes('def ') || app.code.includes('class Solution:\n')) {
          python = app.code;
        } else if (app.code.includes('public class') || (app.code.includes('class Solution {') && app.code.includes('public '))) {
          java = app.code;
        } else {
          cpp = app.code;
        }
      } else if (typeof app.code === 'object' && app.code !== null) {
        cpp = app.code.cpp || app.cppCode || '';
        python = app.code.python || app.code.python3 || '';
        java = app.code.java || '';
      } else if (app.cppCode) {
        cpp = app.cppCode;
      }

      const timeComp = typeof app.timeComplexity === 'object' && app.timeComplexity !== null
        ? app.timeComplexity
        : {
            complexity: app.time_complexity || app.timeComplexity || 'O(N)',
            explanation: app.time_complexity_explanation || 'Derivation from problem operations.',
          };

      const spaceComp = typeof app.spaceComplexity === 'object' && app.spaceComplexity !== null
        ? app.spaceComplexity
        : {
            complexity: app.space_complexity || app.spaceComplexity || 'O(1)',
            explanation: app.space_complexity_explanation || 'Auxiliary memory allocated.',
          };

      const dryRun = app.dryRunExample || (app.test_cases && app.test_cases[0] ? {
        input: app.test_cases[0].input || '',
        steps: [app.test_cases[0].explanation || 'Evaluate test case input'],
        output: String(app.test_cases[0].output || ''),
      } : undefined);

      return {
        id: String(app.id || `approach-${idx + 1}`),
        name: app.name || (idx === 0 ? 'Approach 1: Baseline' : `Approach ${idx + 1}: Optimal`),
        tag: app.tag || (idx === (rawApproaches.length - 1) ? 'Optimal' : 'Brute Force'),
        intuition: app.intuition || '',
        theory: app.theory || app.pros || '',
        cppCode: cpp || python || java || '// Implementation',
        code: {
          cpp: cpp || (python ? `// C++ implementation\n// See Python 3 tab` : ''),
          python: python || (cpp ? `# Python implementation\n# See C++ tab` : ''),
          java: java || '',
        },
        timeComplexity: timeComp,
        spaceComplexity: spaceComp,
        dryRunExample: dryRun,
        edgeCases: app.edgeCases || app.edge_cases || ['Empty or single-element inputs.', 'Boundary integer limits.'],
      };
    });

    return {
      questionId: id,
      title: parsed.title || title,
      difficulty: parsed.difficulty || difficulty,
      corePattern: parsed.corePattern || parsed.core_pattern || 'Algorithmic Pattern & Invariant',
      interviewTips: parsed.interviewTips || parsed.interview_tips || [
        'Clarify constraints and edge cases upfront.',
        'Discuss Time and Space trade-offs before writing code.',
      ],
      approaches: formattedApproaches,
    };
  }
}
