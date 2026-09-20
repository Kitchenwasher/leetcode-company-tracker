import { SolutionApproach, CodeSnippet } from '../types/solution';

export interface TestCase {
  id: number;
  input: string;
  expected?: string;
}

/**
 * Extracts sample test cases from description HTML or exampleTestcases array
 */
export function extractTestCases(htmlContent?: string, rawCases?: string[]): TestCase[] {
  const cases: TestCase[] = [];

  if (htmlContent) {
    // 1. Check example-block format
    const blockRegex = /<strong>Input:<\/strong>\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?<\/p>\s*<p><strong>Output:<\/strong>\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?<\/p>/gi;
    let match;
    while ((match = blockRegex.exec(htmlContent)) !== null) {
      cases.push({
        id: cases.length + 1,
        input: cleanHtmlText(match[1]),
        expected: cleanHtmlText(match[2]),
      });
    }

    // 2. Check pre format if no example blocks found
    if (cases.length === 0) {
      const preRegex = /<strong>Input:<\/strong>\s*([\s\S]*?)\s*<strong>Output:<\/strong>\s*([\s\S]*?)(?:\s*<strong>Explanation:<\/strong>|\s*<\/pre>)/gi;
      while ((match = preRegex.exec(htmlContent)) !== null) {
        cases.push({
          id: cases.length + 1,
          input: cleanHtmlText(match[1]),
          expected: cleanHtmlText(match[2]),
        });
      }
    }
  }

  // If rawCases (e.g. from LeetCode GraphQL exampleTestcases) are available:
  if (rawCases && rawCases.length > 0) {
    if (cases.length === 0) {
      rawCases.forEach((tc, idx) => {
        cases.push({
          id: idx + 1,
          input: tc.trim(),
        });
      });
    } else {
      // If we extracted cases with expected outputs, prefer rawCases clean formatting for input if counts match
      for (let i = 0; i < Math.min(cases.length, rawCases.length); i++) {
        if (!cases[i].input || cases[i].input.includes('<')) {
          cases[i].input = rawCases[i].trim();
        }
      }
    }
  }

  // Default fallback if problem has no parsed cases
  if (cases.length === 0) {
    cases.push({
      id: 1,
      input: '[2,7,11,15]\n9',
      expected: '[0,1]',
    });
  }

  return cases;
}

function cleanHtmlText(str: string): string {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Generates authentic starter boilerplate (function signature) without pre-solved answers
 */
export function generateStarterCode(
  language: 'cpp' | 'python' | 'java' | 'javascript',
  approach?: SolutionApproach,
  title?: string,
  codeSnippets?: CodeSnippet[]
): string {
  // Priority 1: Use authentic LeetCode code snippet if available
  if (codeSnippets && codeSnippets.length > 0) {
    const slugMap: Record<string, string[]> = {
      cpp: ['cpp', 'c++'],
      python: ['python3', 'python'],
      java: ['java'],
      javascript: ['javascript', 'js'],
    };
    const targetSlugs = slugMap[language] || [language];
    const match = codeSnippets.find((s) => targetSlugs.includes(s.langSlug.toLowerCase()));

    if (match && match.code && match.code.trim()) {
      let snippetCode = match.code.trim();
      // Ensure standard C++ headers and using namespace std are included for compilation
      if (language === 'cpp' && !snippetCode.includes('#include')) {
        snippetCode = `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <unordered_set>\n#include <algorithm>\n#include <iostream>\n\nusing namespace std;\n\n${snippetCode}\n`;
      }
      return snippetCode;
    }
  }

  // Priority 2: Extract function signature from editorial solution
  const code =
    (approach?.code as Record<string, string | undefined>)?.[language] ||
    (language === 'cpp' ? approach?.cppCode : '');

  if (language === 'python') {
    if (code) {
      // Find 'def method_name(self, ...):'
      const defMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*(?:->\s*[^:]+)?:/);
      if (defMatch) {
        return `from typing import List, Dict, Tuple, Set, Optional\n\nclass Solution:\n    ${defMatch[0]}\n        # Write your code here\n        pass\n`;
      }
    }
    const cleanTitle = (title || 'problem').replace(/[^a-zA-Z0-9]/g, '');
    const fnName = cleanTitle ? cleanTitle.charAt(0).toLowerCase() + cleanTitle.slice(1) : 'solve';
    return `from typing import List, Optional\n\nclass Solution:\n    def ${fnName}(self, *args):\n        # Write your code here\n        pass\n`;
  }

  if (language === 'cpp') {
    if (code) {
      // Find method signature inside class Solution
      const methodMatch = code.match(
        /(?:public:\s*)?([a-zA-Z0-9_<>,:\*\s&]+?)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*\{/
      );
      if (methodMatch) {
        const retType = methodMatch[1].replace(/public:\s*/, '').trim();
        const fnName = methodMatch[2].trim();
        const params = methodMatch[3].trim();
        return `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <unordered_set>\n#include <algorithm>\n#include <iostream>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    ${retType} ${fnName}(${params}) {\n        // Write your code here\n        \n    }\n};\n`;
      }
    }
    const cleanTitle = (title || 'problem').replace(/[^a-zA-Z0-9]/g, '');
    const fnName = cleanTitle ? cleanTitle.charAt(0).toLowerCase() + cleanTitle.slice(1) : 'solve';
    return `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\n#include <iostream>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ${fnName}(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};\n`;
  }

  if (language === 'java') {
    if (code) {
      const methodMatch = code.match(
        /public\s+([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*\{/
      );
      if (methodMatch) {
        return `import java.util.*;\n\nclass Solution {\n    public ${methodMatch[1].trim()} ${methodMatch[2].trim()}(${methodMatch[3].trim()}) {\n        // Write your code here\n        \n    }\n}\n`;
      }
    }
    return `import java.util.*;\n\nclass Solution {\n    public int[] solve(int[] nums) {\n        // Write your code here\n        return new int[]{};\n    }\n}\n`;
  }

  if (language === 'javascript') {
    if (code) {
      const fnMatch = code.match(/(?:var|let|const|function)\s+([a-zA-Z0-9_]+)/);
      if (fnMatch) {
        return `/**\n * @param {...any} args\n * @return {any}\n */\nvar ${fnMatch[1]} = function(...args) {\n    // Write your code here\n    \n};\n`;
      }
    }
    const cleanTitle = (title || 'problem').replace(/[^a-zA-Z0-9]/g, '');
    const fnName = cleanTitle ? cleanTitle.charAt(0).toLowerCase() + cleanTitle.slice(1) : 'solve';
    return `/**\n * @param {...any} args\n * @return {any}\n */\nvar ${fnName} = function(...args) {\n    // Write your code here\n    \n};\n`;
  }

  return '// Write your code here\n';
}
