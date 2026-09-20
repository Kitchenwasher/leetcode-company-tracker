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
 * Infers authentic function parameters, return type, and method name from HTML description examples
 */
function inferSignatureFromContent(
  title?: string,
  htmlContent?: string
): {
  fnName: string;
  paramsCpp: string;
  paramsPy: string;
  paramsJava: string;
  paramsJs: string;
  retCpp: string;
  retPy: string;
  retJava: string;
} {
  // Clean camelCase title for fallback function name
  const words = (title || 'solve')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  let fnName = 'solve';
  if (words.length > 0) {
    fnName = words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }

  // Check if htmlContent specifies a method name inside code tags, e.g. <code>minNumberOperations</code>
  if (htmlContent) {
    const fnMatch = htmlContent.match(/<code>([a-z][a-zA-Z0-9_]{2,25})\s*\(/i);
    if (fnMatch && fnMatch[1] && !['int', 'vector', 'string', 'void', 'for', 'while'].includes(fnMatch[1].toLowerCase())) {
      fnName = fnMatch[1];
    }
  }

  // Parse sample input/output
  let inputStr = '';
  let outputStr = '';

  if (htmlContent) {
    const inMatch = htmlContent.match(/(?:<strong>Input:<\/strong>|Input:)\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?(?:<\/p>|<br|\n|<strong>Output)/i);
    if (inMatch) inputStr = cleanHtmlText(inMatch[1]);

    const outMatch = htmlContent.match(/(?:<strong>Output:<\/strong>|Output:)\s*(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?(?:<\/p>|<br|\n|<strong>Explanation|<\/pre>)/i);
    if (outMatch) outputStr = cleanHtmlText(outMatch[1]);
  }

  // Infer return type from output
  let retCpp = 'int';
  let retPy = 'int';
  let retJava = 'int';

  const cleanOut = outputStr.trim();
  if (/^\[\s*\[/.test(cleanOut)) {
    retCpp = 'vector<vector<int>>';
    retPy = 'List[List[int]]';
    retJava = 'int[][]';
  } else if (/^\[/.test(cleanOut)) {
    if (cleanOut.includes('"') || cleanOut.includes("'")) {
      retCpp = 'vector<string>';
      retPy = 'List[str]';
      retJava = 'String[]';
    } else {
      retCpp = 'vector<int>';
      retPy = 'List[int]';
      retJava = 'int[]';
    }
  } else if (/^(true|false)$/i.test(cleanOut)) {
    retCpp = 'bool';
    retPy = 'bool';
    retJava = 'boolean';
  } else if (/^"[^"]*"$|^'[^']*'$/.test(cleanOut)) {
    retCpp = 'string';
    retPy = 'str';
    retJava = 'String';
  } else if (/^-?\d+\.\d+$/.test(cleanOut)) {
    retCpp = 'double';
    retPy = 'float';
    retJava = 'double';
  } else if (/^-?\d+$/.test(cleanOut)) {
    retCpp = 'int';
    retPy = 'int';
    retJava = 'int';
  }

  // Infer parameters from input string
  const cppParams: string[] = [];
  const pyParams: string[] = [];
  const javaParams: string[] = [];
  const jsParams: string[] = [];

  if (inputStr) {
    const parts = inputStr.split(/,(?![^\[]*\])/).map(p => p.trim());
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx !== -1) {
        const pName = part.slice(0, eqIdx).trim().replace(/[^a-zA-Z0-9_]/g, '');
        const pVal = part.slice(eqIdx + 1).trim();

        if (pName) {
          jsParams.push(pName);

          if (/^\[\s*\[/.test(pVal)) {
            cppParams.push(`vector<vector<int>>& ${pName}`);
            pyParams.push(`${pName}: List[List[int]]`);
            javaParams.push(`int[][] ${pName}`);
          } else if (/^\[/.test(pVal)) {
            if (pName.toLowerCase().includes('head') || pName.toLowerCase().includes('node')) {
              cppParams.push(`ListNode* ${pName}`);
              pyParams.push(`${pName}: Optional[ListNode]`);
              javaParams.push(`ListNode ${pName}`);
            } else if (pVal.includes('"') || pVal.includes("'")) {
              cppParams.push(`vector<string>& ${pName}`);
              pyParams.push(`${pName}: List[str]`);
              javaParams.push(`String[] ${pName}`);
            } else {
              cppParams.push(`vector<int>& ${pName}`);
              pyParams.push(`${pName}: List[int]`);
              javaParams.push(`int[] ${pName}`);
            }
          } else if (/^"[^"]*"$|^'[^']*'$/.test(pVal)) {
            cppParams.push(`string ${pName}`);
            pyParams.push(`${pName}: str`);
            javaParams.push(`String ${pName}`);
          } else if (/^(true|false)$/i.test(pVal)) {
            cppParams.push(`bool ${pName}`);
            pyParams.push(`${pName}: bool`);
            javaParams.push(`boolean ${pName}`);
          } else if (/^-?\d+$/.test(pVal)) {
            cppParams.push(`int ${pName}`);
            pyParams.push(`${pName}: int`);
            javaParams.push(`int ${pName}`);
          } else {
            cppParams.push(`auto ${pName}`);
            pyParams.push(`${pName}`);
            javaParams.push(`Object ${pName}`);
          }
        }
      }
    }
  }

  // Defaults if parsing didn't find named parameters
  if (cppParams.length === 0) {
    const isArrayTopic = (title || '').toLowerCase().includes('array') || (title || '').toLowerCase().includes('subarrays') || (title || '').toLowerCase().includes('numbers');
    if (isArrayTopic) {
      cppParams.push('vector<int>& target');
      pyParams.push('target: List[int]');
      javaParams.push('int[] target');
      jsParams.push('target');
    } else {
      cppParams.push('vector<int>& nums');
      pyParams.push('nums: List[int]');
      javaParams.push('int[] nums');
      jsParams.push('nums');
    }
  }

  return {
    fnName,
    paramsCpp: cppParams.join(', '),
    paramsPy: pyParams.join(', '),
    paramsJava: javaParams.join(', '),
    paramsJs: jsParams.join(', '),
    retCpp,
    retPy,
    retJava,
  };
}

/**
 * Generates authentic starter boilerplate (function signature) without pre-solved answers
 */
export function generateStarterCode(
  language: 'cpp' | 'python' | 'java' | 'javascript',
  approach?: SolutionApproach,
  title?: string,
  codeSnippets?: CodeSnippet[],
  htmlContent?: string
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
      } else if (language === 'python' && !snippetCode.includes('from typing')) {
        snippetCode = `from typing import List, Optional, Dict, Tuple, Set\n\n${snippetCode}\n`;
      } else if (language === 'java' && !snippetCode.includes('import java.util')) {
        snippetCode = `import java.util.*;\n\n${snippetCode}\n`;
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
    const inf = inferSignatureFromContent(title, htmlContent);
    return `from typing import List, Optional, Dict, Tuple, Set\n\nclass Solution:\n    def ${inf.fnName}(self, ${inf.paramsPy}) -> ${inf.retPy}:\n        # Write your code here\n        pass\n`;
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
    const inf = inferSignatureFromContent(title, htmlContent);
    return `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <unordered_set>\n#include <algorithm>\n#include <iostream>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    ${inf.retCpp} ${inf.fnName}(${inf.paramsCpp}) {\n        // Write your code here\n        \n    }\n};\n`;
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
    const inf = inferSignatureFromContent(title, htmlContent);
    return `import java.util.*;\n\nclass Solution {\n    public ${inf.retJava} ${inf.fnName}(${inf.paramsJava}) {\n        // Write your code here\n        \n    }\n}\n`;
  }

  if (language === 'javascript') {
    if (code) {
      const fnMatch = code.match(/(?:var|let|const|function)\s+([a-zA-Z0-9_]+)/);
      if (fnMatch) {
        return `/**\n * @param {...any} args\n * @return {any}\n */\nvar ${fnMatch[1]} = function(...args) {\n    // Write your code here\n    \n};\n`;
      }
    }
    const inf = inferSignatureFromContent(title, htmlContent);
    return `/**\n * @param {${inf.paramsJs}}\n * @return {${inf.retCpp}}\n */\nvar ${inf.fnName} = function(${inf.paramsJs}) {\n    // Write your code here\n    \n};\n`;
  }

  return '// Write your code here\n';
}
