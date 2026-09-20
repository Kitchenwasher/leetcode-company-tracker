import { SolutionApproach } from '../types/solution';

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
        expected: cleanHtmlText(match[2])
      });
    }

    // 2. Check pre format if no example blocks found
    if (cases.length === 0) {
      const preRegex = /<strong>Input:<\/strong>\s*([\s\S]*?)\n<strong>Output:<\/strong>\s*([\s\S]*?)(?:\n<strong>Explanation:<\/strong>|\n<\/pre>|<\/pre>)/gi;
      while ((match = preRegex.exec(htmlContent)) !== null) {
        cases.push({
          id: cases.length + 1,
          input: cleanHtmlText(match[1]),
          expected: cleanHtmlText(match[2])
        });
      }
    }
  }

  // Fallback to raw example testcases from LeetCode GraphQL
  if (cases.length === 0 && rawCases && rawCases.length > 0) {
    rawCases.forEach((tc, idx) => {
      cases.push({
        id: idx + 1,
        input: tc.trim()
      });
    });
  }

  // Default fallback if problem has no parsed cases
  if (cases.length === 0) {
    cases.push({
      id: 1,
      input: '[2,7,11,15]\n9',
      expected: '[0,1]'
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
 * Generates clean starter boilerplate (function signature) without pre-solved answers
 */
export function generateStarterCode(
  language: 'cpp' | 'python' | 'java' | 'javascript',
  approach?: SolutionApproach,
  title?: string
): string {
  const code = (approach?.code as Record<string, string | undefined>)?.[language] || (language === 'cpp' ? approach?.cppCode : '');

  if (language === 'python') {
    if (code) {
      // Find 'def method_name(self, ...):'
      const defMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?:/);
      if (defMatch) {
        return `class Solution:\n    ${defMatch[0]}\n        # Write your code here\n        pass\n`;
      }
    }
    const cleanTitle = (title || 'problem').replace(/[^a-zA-Z0-9]/g, '');
    const fnName = cleanTitle ? cleanTitle.charAt(0).toLowerCase() + cleanTitle.slice(1) : 'solve';
    return `class Solution:\n    def ${fnName}(self, *args):\n        # Write your code here\n        pass\n`;
  }

  if (language === 'cpp') {
    if (code) {
      // Find method signature inside class Solution
      const methodMatch = code.match(/(?:public:\s*)?([a-zA-Z0-9_<>\s:*&]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/);
      if (methodMatch) {
        const retType = methodMatch[1].replace(/public:\s*/, '').trim();
        const fnName = methodMatch[2].trim();
        const params = methodMatch[3].trim();
        return `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    ${retType} ${fnName}(${params}) {\n        // Write your code here\n        \n    }\n};\n`;
      }
    }
    return `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    // Write your solution here\n    \n};\n`;
  }

  if (language === 'java') {
    if (code) {
      const methodMatch = code.match(/public\s+([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/);
      if (methodMatch) {
        return `class Solution {\n    public ${methodMatch[1].trim()} ${methodMatch[2].trim()}(${methodMatch[3].trim()}) {\n        // Write your code here\n        \n    }\n}\n`;
      }
    }
    return `class Solution {\n    // Write your solution here\n    \n}\n`;
  }

  if (language === 'javascript') {
    if (code) {
      const fnMatch = code.match(/(?:var|let|const|function)\s+([a-zA-Z0-9_]+)/);
      if (fnMatch) {
        return `/**\n * @return {any}\n */\nvar ${fnMatch[1]} = function(...args) {\n    // Write your code here\n    \n};\n`;
      }
    }
    const cleanTitle = (title || 'problem').replace(/[^a-zA-Z0-9]/g, '');
    const fnName = cleanTitle ? cleanTitle.charAt(0).toLowerCase() + cleanTitle.slice(1) : 'solve';
    return `/**\n * @return {any}\n */\nvar ${fnName} = function(...args) {\n    // Write your code here\n    \n};\n`;
  }

  return '// Write your code here\n';
}
