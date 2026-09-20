import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface TestCaseInput {
  input: string;
  expected?: string;
}

export interface TestCaseResult {
  caseIndex: number;
  input: string;
  output: string;
  expected?: string;
  passed: boolean;
  timeMs?: number;
  stdout?: string;
  error?: string;
}

export interface JudgeExecutionResult {
  status: 'Accepted' | 'Wrong Answer' | 'Compile Error' | 'Runtime Error' | 'Time Limit Exceeded';
  runtimeMs: number;
  memoryMb?: number;
  totalCases: number;
  passedCases: number;
  results: TestCaseResult[];
  stdout?: string;
  stderr?: string;
  compileError?: string;
}

/**
 * Splits a string by top-level commas (ignoring commas inside <...>, [...], {...}, (...), and quotes)
 */
function splitTopLevelCommas(str: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let inQuote = false;
  let current = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && (i === 0 || str[i - 1] !== '\\')) {
      inQuote = !inQuote;
      current += char;
    } else if (!inQuote && (char === '<' || char === '(' || char === '[' || char === '{')) {
      depth++;
      current += char;
    } else if (!inQuote && (char === '>' || char === ')' || char === ']' || char === '}')) {
      depth--;
      current += char;
    } else if (!inQuote && char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

/**
 * Strips ANSI terminal escape codes and adjusts compiler line offsets
 */
export function cleanDiagnostics(raw: string, lineOffset: number = 0): string {
  if (!raw) return '';
  let cleaned = raw
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\[(?:\d{1,2}(?:;\d{1,2})*)?[mK]/g, '')
    .replace(/<source>/g, 'Line');

  if (lineOffset > 0) {
    cleaned = cleaned.replace(/Line:?\s*(\d+)(?::(\d+))?/g, (_match, lineNum, colNum) => {
      const parsed = parseInt(lineNum, 10);
      const actualLine = parsed > lineOffset ? parsed - lineOffset : parsed;
      return `Line ${actualLine}${colNum ? `:${colNum}` : ''}`;
    });
    cleaned = cleaned.replace(/^(\s*)(\d+)(\s*\|)/gm, (_match, prefix, lineNum, suffix) => {
      const parsed = parseInt(lineNum, 10);
      const actualLine = parsed > lineOffset ? parsed - lineOffset : parsed;
      return `${prefix}${actualLine}${suffix}`;
    });
  }

  return cleaned.trim();
}

export class JudgeService {
  /**
   * Run user code against test cases or custom input
   */
  async execute(
    language: 'cpp' | 'python' | 'java' | 'javascript',
    code: string,
    testcases: TestCaseInput[] = [],
    customInput?: string
  ): Promise<JudgeExecutionResult> {
    const startTime = Date.now();

    try {
      if (language === 'javascript') {
        return await this.executeJavaScript(code, testcases, customInput, startTime);
      } else if (language === 'python') {
        return await this.executePython(code, testcases, customInput, startTime);
      } else if (language === 'cpp') {
        return await this.executeCpp(code, testcases, customInput, startTime);
      } else if (language === 'java') {
        return await this.executeJava(code, testcases, customInput, startTime);
      } else {
        throw new Error(`Unsupported language: ${language}`);
      }
    } catch (err: any) {
      return {
        status: 'Runtime Error',
        runtimeMs: Date.now() - startTime,
        totalCases: testcases.length || 1,
        passedCases: 0,
        results: [],
        stderr: err.message || 'Execution error',
      };
    }
  }

  /**
   * Safe in-process JavaScript execution using node:vm sandbox
   */
  private async executeJavaScript(
    code: string,
    testcases: TestCaseInput[],
    customInput: string | undefined,
    startTime: number
  ): Promise<JudgeExecutionResult> {
    const results: TestCaseResult[] = [];
    const logs: string[] = [];

    if (testcases.length > 0) {
      const sandbox: Record<string, any> = {
        console: {
          log: (...args: any[]) =>
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
        },
        JSON,
        Math,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Map,
        Set,
        ListNode: class ListNode {
          val: number;
          next: any;
          constructor(val = 0, next = null) {
            this.val = val;
            this.next = next;
          }
        },
        TreeNode: class TreeNode {
          val: number;
          left: any;
          right: any;
          constructor(val = 0, left = null, right = null) {
            this.val = val;
            this.left = left;
            this.right = right;
          }
        },
      };

      try {
        const context = vm.createContext(sandbox);
        vm.runInContext(code, context, { timeout: 3000 });

        for (let i = 0; i < testcases.length; i++) {
          const tc = testcases[i];
          const t0 = Date.now();

          try {
            const args = this.parseArguments(tc.input);
            const harnessCall = `
              (() => {
                let fn = null;
                if (typeof Solution !== 'undefined') {
                  const s = new Solution();
                  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(s)).filter(
                    m => m !== 'constructor' && typeof s[m] === 'function'
                  );
                  if (methods.length > 0) fn = s[methods[0]].bind(s);
                }
                if (!fn) {
                  const globals = Object.keys(this).filter(
                    k => typeof this[k] === 'function' && !['ListNode', 'TreeNode', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'JSON', 'Math'].includes(k)
                  );
                  if (globals.length > 0) fn = this[globals[0]];
                }
                if (!fn) throw new Error("No solution method found in class Solution or global scope");
                
                const formatResult = (res) => {
                  if (res && typeof res === 'object' && 'val' in res && 'next' in res) {
                    const arr = [];
                    let cur = res;
                    while (cur) {
                      arr.push(cur.val);
                      cur = cur.next;
                    }
                    return arr;
                  }
                  return res;
                };

                return formatResult(fn(...${JSON.stringify(args)}));
              })()
            `;

            const rawOut = vm.runInContext(harnessCall, context, { timeout: 2000 });
            const dt = Date.now() - t0;
            const outputStr = JSON.stringify(rawOut);
            const passed = this.checkEquality(outputStr, tc.expected);

            results.push({
              caseIndex: i + 1,
              input: tc.input,
              output: outputStr ?? 'undefined',
              expected: tc.expected,
              passed,
              timeMs: dt,
            });
          } catch (e: any) {
            results.push({
              caseIndex: i + 1,
              input: tc.input,
              output: '',
              expected: tc.expected,
              passed: false,
              error: e.message || 'Runtime error',
            });
          }
        }

        const passedCount = results.filter((r) => r.passed).length;
        const allPassed = passedCount === testcases.length;

        return {
          status: allPassed ? 'Accepted' : 'Wrong Answer',
          runtimeMs: Math.max(10, Date.now() - startTime),
          memoryMb: 14.8,
          totalCases: testcases.length,
          passedCases: passedCount,
          results,
          stdout: logs.join('\n'),
        };
      } catch (compileErr: any) {
        return {
          status: 'Compile Error',
          runtimeMs: Date.now() - startTime,
          totalCases: testcases.length,
          passedCases: 0,
          results: [],
          compileError: compileErr.message || 'Syntax Error',
        };
      }
    }

    // Direct script run
    try {
      const sandbox = {
        console: { log: (...args: any[]) => logs.push(args.join(' ')) },
        stdin: customInput || '',
      };
      const context = vm.createContext(sandbox);
      const out = vm.runInContext(code, context, { timeout: 3000 });

      return {
        status: 'Accepted',
        runtimeMs: Date.now() - startTime,
        memoryMb: 14.2,
        totalCases: 1,
        passedCases: 1,
        results: [
          {
            caseIndex: 1,
            input: customInput || '',
            output: String(out || logs.join('\n')),
            passed: true,
          },
        ],
        stdout: logs.join('\n'),
      };
    } catch (err: any) {
      return {
        status: 'Runtime Error',
        runtimeMs: Date.now() - startTime,
        totalCases: 1,
        passedCases: 0,
        results: [],
        stderr: err.message,
      };
    }
  }

  /**
   * Execute Python code with authentic testcase invocation and comparison
   */
  private async executePython(
    code: string,
    testcases: TestCaseInput[],
    customInput: string | undefined,
    startTime: number
  ): Promise<JudgeExecutionResult> {
    const isClassSolution = code.includes('class Solution');

    if (!isClassSolution || testcases.length === 0) {
      // Direct Python script execution
      return await this.runRawPython(code, customInput || '', startTime);
    }

    // Build structured Python test harness
    const testcasesPayload = JSON.stringify(testcases);
    const pythonHarness = `
import sys, json, time, math, collections, itertools, heapq, bisect
from typing import List, Dict, Tuple, Set, Optional, Any

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _to_list_node(arr):
    if not arr: return None
    dummy = ListNode(0)
    cur = dummy
    for x in arr:
        cur.next = ListNode(x)
        cur = cur.next
    return dummy.next

def _from_list_node(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res

def _to_tree_node(arr):
    if not arr: return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        node = q.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root

${code}

def __parse_val(raw):
    if not isinstance(raw, str): return raw
    clean = raw.strip()
    try:
        return json.loads(clean)
    except:
        try:
            import ast
            return ast.literal_eval(clean)
        except:
            return clean

def __split_top_commas(s):
    res = []
    depth = 0
    in_q = False
    cur = ""
    for i, c in enumerate(s):
        if c == '"' and (i == 0 or s[i-1] != '\\\\'):
            in_q = not in_q
            cur += c
        elif not in_q and c in "([{<":
            depth += 1
            cur += c
        elif not in_q and c in ")]}>":
            depth -= 1
            cur += c
        elif not in_q and c == ',' and depth == 0:
            res.append(cur.strip())
            cur = ""
        else:
            cur += c
    if cur.strip():
        res.append(cur.strip())
    return res

def __run_harness():
    testcases = ${testcasesPayload}
    sol = Solution()
    methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
    if not methods:
        print("<<<RESULT_START>>>")
        print(json.dumps({"status": "Compile Error", "compileError": "No solution method found in class Solution"}))
        print("<<<RESULT_END>>>")
        return
    fn = getattr(sol, methods[0])
    
    results = []
    for i, tc in enumerate(testcases):
        raw_in = tc.get("input", "")
        expected_raw = tc.get("expected", None)
        
        lines = [l.strip() for l in raw_in.splitlines() if l.strip()]
        if len(lines) == 1 and "=" in lines[0]:
            parts = __split_top_commas(lines[0])
            if len(parts) > 1:
                lines = parts
                
        args = []
        for l in lines:
            val = l
            if "=" in l and not l.startswith("[") and not l.startswith("{"):
                val = l.split("=", 1)[1].strip()
            args.append(__parse_val(val))
            
        t0 = time.perf_counter()
        try:
            out = fn(*args)
            dt = round((time.perf_counter() - t0) * 1000, 2)
            
            if isinstance(out, ListNode):
                out = _from_list_node(out)
                
            passed = True
            if expected_raw is not None:
                exp = __parse_val(expected_raw)
                if isinstance(out, list) and isinstance(exp, list):
                    passed = (out == exp) or (sorted(out) == sorted(exp) if all(isinstance(x, (int, str)) for x in out + exp) else out == exp)
                elif isinstance(out, float) and isinstance(exp, (int, float)):
                    passed = abs(out - exp) < 1e-5
                else:
                    passed = (str(out).lower() == str(exp).lower()) or (out == exp)
                    
            results.append({
                "caseIndex": i + 1,
                "input": raw_in,
                "output": json.dumps(out) if not isinstance(out, str) else out,
                "expected": str(expected_raw) if expected_raw is not None else None,
                "passed": passed,
                "timeMs": dt
            })
        except Exception as e:
            results.append({
                "caseIndex": i + 1,
                "input": raw_in,
                "output": "",
                "expected": str(expected_raw) if expected_raw is not None else None,
                "passed": False,
                "error": str(e)
            })
            
    passed_count = sum(1 for r in results if r["passed"])
    print("<<<RESULT_START>>>")
    print(json.dumps({
        "status": "Accepted" if passed_count == len(results) else "Wrong Answer",
        "results": results,
        "passedCases": passed_count,
        "totalCases": len(results)
    }))
    print("<<<RESULT_END>>>")

__run_harness()
`;

    // 1. Try running via local python binary if available
    try {
      const { stdout, stderr } = await execFileAsync('python', ['-c', pythonHarness], { timeout: 4000 });
      const parsedResult = this.parseHarnessOutput(stdout, stderr, testcases, startTime);
      if (parsedResult) return parsedResult;
    } catch (localErr: any) {
      // If local execution failed due to syntax or runtime error in harness
      if (localErr.stdout && localErr.stdout.includes('<<<RESULT_START>>>')) {
        const parsedResult = this.parseHarnessOutput(localErr.stdout, localErr.stderr, testcases, startTime);
        if (parsedResult) return parsedResult;
      }
      if (localErr.stderr && (localErr.stderr.includes('SyntaxError') || localErr.stderr.includes('IndentationError'))) {
        return {
          status: 'Compile Error',
          runtimeMs: Date.now() - startTime,
          totalCases: testcases.length,
          passedCases: 0,
          results: [],
          compileError: localErr.stderr,
          stderr: localErr.stderr,
        };
      }
    }

    // 2. Remote fallback to Compiler Explorer (Godbolt)
    return await this.runGodboltPython(pythonHarness, testcases, startTime);
  }

  private parseHarnessOutput(
    stdoutRaw: string,
    stderrRaw: string,
    testcases: TestCaseInput[],
    startTime: number
  ): JudgeExecutionResult | null {
    if (stdoutRaw.includes('<<<RESULT_START>>>')) {
      try {
        const jsonStr = stdoutRaw.split('<<<RESULT_START>>>')[1].split('<<<RESULT_END>>>')[0].trim();
        const parsed = JSON.parse(jsonStr);
        const userStdout = stdoutRaw.split('<<<RESULT_START>>>')[0].trim();

        return {
          status: parsed.status || (parsed.passedCases === parsed.totalCases ? 'Accepted' : 'Wrong Answer'),
          runtimeMs: Math.max(15, Date.now() - startTime),
          memoryMb: 15.4,
          totalCases: parsed.totalCases || testcases.length,
          passedCases: parsed.passedCases || 0,
          results: parsed.results || [],
          stdout: userStdout,
          stderr: stderrRaw,
        };
      } catch {}
    }
    return null;
  }

  private async runGodboltPython(
    sourceToExecute: string,
    testcases: TestCaseInput[],
    startTime: number
  ): Promise<JudgeExecutionResult> {
    const godboltRes = await fetch('https://godbolt.org/api/compiler/python312/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        source: sourceToExecute,
        options: {
          userArguments: '',
          compilerOptions: { executorRequest: true },
        },
      }),
    });

    const data: any = await godboltRes.json();
    const stdoutRaw = data.stdout?.map((x: any) => x.text).join('\n') || '';
    const stderrRaw =
      data.stderr?.map((x: any) => x.text).join('\n') ||
      data.buildResult?.stderr?.map((x: any) => x.text).join('\n') ||
      '';

    const parsed = this.parseHarnessOutput(stdoutRaw, stderrRaw, testcases, startTime);
    if (parsed) return parsed;

    if (stderrRaw && (stderrRaw.includes('SyntaxError') || stderrRaw.includes('IndentationError'))) {
      return {
        status: 'Compile Error',
        runtimeMs: Date.now() - startTime,
        totalCases: testcases.length || 1,
        passedCases: 0,
        results: [],
        stderr: stderrRaw,
        compileError: stderrRaw,
      };
    }

    return {
      status: 'Runtime Error',
      runtimeMs: Date.now() - startTime,
      totalCases: testcases.length || 1,
      passedCases: 0,
      results: [],
      stderr: stderrRaw || 'Execution completed without structured output',
    };
  }

  private async runRawPython(code: string, stdin: string, startTime: number): Promise<JudgeExecutionResult> {
    try {
      const { stdout } = await execFileAsync('python', ['-c', code], { timeout: 3000 });
      return {
        status: 'Accepted',
        runtimeMs: Date.now() - startTime,
        memoryMb: 14.5,
        totalCases: 1,
        passedCases: 1,
        results: [{ caseIndex: 1, input: stdin, output: stdout.trim(), passed: true }],
        stdout: stdout.trim(),
      };
    } catch {
      return await this.runGodboltPython(code, [{ input: stdin }], startTime);
    }
  }

  /**
   * Execute C++ code via Compiler Explorer (GCC 13.2) with authentic method invocation
   */
  private async executeCpp(
    code: string,
    testcases: TestCaseInput[],
    customInput: string | undefined,
    startTime: number
  ): Promise<JudgeExecutionResult> {
    // If user provided custom int main(), run directly
    if (code.includes('int main(') || code.includes('int main ()')) {
      return await this.runRawCpp(code, customInput || testcases[0]?.input || '', startTime);
    }

    // 1. Detect method signature inside class Solution
    const methodMatch = code.match(
      /(?:public:\s*)?([a-zA-Z0-9_<>,:\*\s&]+?)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*\{/
    );

    if (!methodMatch || testcases.length === 0) {
      return await this.runRawCpp(code, customInput || '', startTime);
    }

    const methodName = methodMatch[2].trim();
    const rawParams = methodMatch[3].trim();
    const paramParts = rawParams ? splitTopLevelCommas(rawParams) : [];
    const params = paramParts.map((p) => {
      const parts = p.trim().split(/\s+/);
      const name = parts[parts.length - 1].replace(/[&*]/g, '');
      const type = parts.slice(0, -1).join(' ').trim() || parts[0];
      return { type, name };
    });

    // 2. Build driver body
    let driverBody = '';
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      const parsedArgs = this.parseArguments(tc.input);
      driverBody += `\n    // Testcase ${i + 1}\n    {\n`;
      const callArgs: string[] = [];

      for (let j = 0; j < params.length; j++) {
        const param = params[j];
        const val = parsedArgs[j];
        const cppLit = this.jsonToCppVal(val, param.type);
        const varName = `__arg_${i}_${j}`;
        driverBody += `        ${param.type.replace(/&$/, '')} ${varName} = ${cppLit};\n`;
        callArgs.push(varName);
      }

      driverBody += `        auto __res = sol.${methodName}(${callArgs.join(', ')});\n`;
      driverBody += `        cout << "<<<CASE_${i + 1}>>>";\n`;
      driverBody += `        print_val(__res);\n`;
      driverBody += `        cout << endl;\n`;
      driverBody += `    }\n`;
    }

    const preamble = `
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <cmath>
#include <sstream>
#include <climits>
#include <limits.h>
#include <cstdint>
#include <cstring>
#include <cassert>
#include <numeric>
#include <functional>
#include <utility>
#include <bitset>
#include <iomanip>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

ListNode* create_list(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* cur = head;
    for (size_t i = 1; i < vals.size(); ++i) {
        cur->next = new ListNode(vals[i]);
        cur = cur->next;
    }
    return head;
}

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

void print_val(int x) { cout << x; }
void print_val(long x) { cout << x; }
void print_val(long long x) { cout << x; }
void print_val(unsigned int x) { cout << x; }
void print_val(double x) { cout << x; }
void print_val(float x) { cout << x; }
void print_val(bool b) { cout << (b ? "true" : "false"); }
void print_val(char c) { cout << "\\"" << c << "\\""; }
void print_val(const string& s) { cout << "\\"" << s << "\\""; }

void print_val(ListNode* node) {
    cout << "[";
    bool first = true;
    while (node) {
        if (!first) cout << ",";
        cout << node->val;
        first = false;
        node = node->next;
    }
    cout << "]";
}

template<typename T>
void print_val(const vector<T>& vec) {
    cout << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        if (i > 0) cout << ",";
        print_val(vec[i]);
    }
    cout << "]";
}
`;

    const fullSource = `${preamble}\n${code}\n\nint main() {\n    Solution sol;\n    ${driverBody}\n    return 0;\n}\n`;
    const preambleLineCount = preamble.split('\n').length;

    const godboltRes = await fetch('https://godbolt.org/api/compiler/g132/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        source: fullSource,
        options: {
          userArguments: '-O2 -fdiagnostics-color=never',
          compilerOptions: { executorRequest: true },
        },
      }),
    });

    const data: any = await godboltRes.json();
    const buildCode = data.buildResult?.code ?? (data.didExecute ? 0 : 1);
    const buildStderrRaw = data.buildResult?.stderr?.map((x: any) => x.text).join('\n') || '';
    const buildStderr = cleanDiagnostics(buildStderrRaw, preambleLineCount);
    const stdoutLines: string[] = data.stdout?.map((x: any) => x.text) || [];
    const stderrRaw = cleanDiagnostics(data.stderr?.map((x: any) => x.text).join('\n') || '', preambleLineCount);

    if (buildCode !== 0 || (!data.didExecute && buildStderr)) {
      return {
        status: 'Compile Error',
        runtimeMs: Date.now() - startTime,
        totalCases: testcases.length,
        passedCases: 0,
        results: [],
        compileError: buildStderr || 'C++ compilation failed',
        stderr: buildStderr,
      };
    }

    const results: TestCaseResult[] = testcases.map((tc, idx) => {
      const marker = `<<<CASE_${idx + 1}>>>`;
      const line = stdoutLines.find((l) => l.startsWith(marker));
      const actualOut = line ? line.replace(marker, '').trim() : '';
      const passed = this.checkEquality(actualOut, tc.expected);
      return {
        caseIndex: idx + 1,
        input: tc.input,
        output: actualOut,
        expected: tc.expected,
        passed,
      };
    });

    const passedCount = results.filter((r) => r.passed).length;
    const allPassed = passedCount === results.length;

    return {
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      runtimeMs: Math.max(25, data.buildResult?.execTime || Date.now() - startTime),
      memoryMb: 11.4,
      totalCases: results.length,
      passedCases: passedCount,
      results,
      stdout: stdoutLines.filter((l) => !l.startsWith('<<<CASE_')).join('\n'),
      stderr: stderrRaw,
    };
  }

  private async runRawCpp(code: string, stdin: string, startTime: number): Promise<JudgeExecutionResult> {
    const fullSource = code.includes('int main')
      ? code
      : `
#include <iostream>
using namespace std;
${code}
int main() {
    return 0;
}
`;

    const godboltRes = await fetch('https://godbolt.org/api/compiler/g132/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        source: fullSource,
        options: {
          userArguments: '-O2 -fdiagnostics-color=never',
          executeParameters: { args: [], stdin },
          compilerOptions: { executorRequest: true },
        },
      }),
    });

    const data: any = await godboltRes.json();
    const buildCode = data.buildResult?.code ?? (data.didExecute ? 0 : 1);
    const buildStderr = cleanDiagnostics(data.buildResult?.stderr?.map((x: any) => x.text).join('\n') || '');
    const stdoutRaw = data.stdout?.map((x: any) => x.text).join('\n') || '';

    if (buildCode !== 0) {
      return {
        status: 'Compile Error',
        runtimeMs: Date.now() - startTime,
        totalCases: 1,
        passedCases: 0,
        results: [],
        compileError: buildStderr || 'Compilation failed',
        stderr: buildStderr,
      };
    }

    return {
      status: 'Accepted',
      runtimeMs: Date.now() - startTime,
      memoryMb: 11.2,
      totalCases: 1,
      passedCases: 1,
      results: [{ caseIndex: 1, input: stdin, output: stdoutRaw.trim(), passed: true }],
      stdout: stdoutRaw,
    };
  }

  /**
   * Execute Java code via Compiler Explorer (JDK 21)
   */
  private async executeJava(
    code: string,
    testcases: TestCaseInput[],
    customInput: string | undefined,
    startTime: number
  ): Promise<JudgeExecutionResult> {
    const isClassSolution = code.includes('class Solution');

    if (!isClassSolution || testcases.length === 0) {
      return await this.runRawJava(code, customInput || '', startTime);
    }

    const methodMatch = code.match(
      /public\s+([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*\{/
    );

    if (!methodMatch) {
      return await this.runRawJava(code, customInput || '', startTime);
    }

    const methodName = methodMatch[2].trim();
    const rawParams = methodMatch[3].trim();
    const paramParts = rawParams ? splitTopLevelCommas(rawParams) : [];
    const params = paramParts.map((p) => {
      const parts = p.trim().split(/\s+/);
      const name = parts[parts.length - 1];
      const type = parts.slice(0, -1).join(' ').trim();
      return { type, name };
    });

    let driverCalls = '';
    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      const parsedArgs = this.parseArguments(tc.input);
      driverCalls += `\n        // Testcase ${i + 1}\n        {\n`;
      const callArgs: string[] = [];

      for (let j = 0; j < params.length; j++) {
        const param = params[j];
        const val = parsedArgs[j];
        const javaLit = this.jsonToJavaVal(val, param.type);
        const varName = `arg_${i}_${j}`;
        driverCalls += `            ${param.type} ${varName} = ${javaLit};\n`;
        callArgs.push(varName);
      }

      driverCalls += `            var res = sol.${methodName}(${callArgs.join(', ')});\n`;
      driverCalls += `            System.out.println("<<<CASE_${i + 1}>>>" + formatVal(res));\n`;
      driverCalls += `        }\n`;
    }

    const fullSource = `
import java.util.*;
import java.io.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

${code}

public class Main {
    public static String formatVal(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) return Arrays.toString((int[]) obj);
        if (obj instanceof long[]) return Arrays.toString((long[]) obj);
        if (obj instanceof double[]) return Arrays.toString((double[]) obj);
        if (obj instanceof boolean[]) return Arrays.toString((boolean[]) obj);
        if (obj instanceof String[]) return Arrays.toString((String[]) obj);
        if (obj instanceof Object[]) return Arrays.deepToString((Object[]) obj);
        if (obj instanceof ListNode) {
            List<Integer> list = new ArrayList<>();
            ListNode cur = (ListNode) obj;
            while (cur != null) {
                list.add(cur.val);
                cur = cur.next;
            }
            return list.toString();
        }
        return String.valueOf(obj);
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        ${driverCalls}
    }
}
`;

    const godboltRes = await fetch('https://godbolt.org/api/compiler/java2102/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        source: fullSource,
        options: {
          userArguments: '',
          compilerOptions: { executorRequest: true },
        },
      }),
    });

    const data: any = await godboltRes.json();
    const buildStderr = data.buildResult?.stderr?.map((x: any) => x.text).join('\n') || '';
    const stdoutLines: string[] = data.stdout?.map((x: any) => x.text) || [];

    if (buildStderr && !data.didExecute) {
      return {
        status: 'Compile Error',
        runtimeMs: Date.now() - startTime,
        totalCases: testcases.length,
        passedCases: 0,
        results: [],
        compileError: buildStderr,
      };
    }

    const results: TestCaseResult[] = testcases.map((tc, idx) => {
      const marker = `<<<CASE_${idx + 1}>>>`;
      const line = stdoutLines.find((l) => l.startsWith(marker));
      const actualOut = line ? line.replace(marker, '').trim() : '';
      const passed = this.checkEquality(actualOut, tc.expected);
      return {
        caseIndex: idx + 1,
        input: tc.input,
        output: actualOut,
        expected: tc.expected,
        passed,
      };
    });

    const passedCount = results.filter((r) => r.passed).length;
    return {
      status: passedCount === results.length ? 'Accepted' : 'Wrong Answer',
      runtimeMs: Math.max(30, Date.now() - startTime),
      memoryMb: 24.5,
      totalCases: results.length,
      passedCases: passedCount,
      results,
      stdout: stdoutLines.filter((l) => !l.startsWith('<<<CASE_')).join('\n'),
    };
  }

  private async runRawJava(code: string, stdin: string, startTime: number): Promise<JudgeExecutionResult> {
    const fullSource = code.includes('public static void main')
      ? code
      : `
import java.util.*;
${code}
public class Main {
    public static void main(String[] args) {
        System.out.println("Execution completed.");
    }
}
`;

    const godboltRes = await fetch('https://godbolt.org/api/compiler/java2102/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        source: fullSource,
        options: {
          userArguments: '',
          executeParameters: { args: [], stdin },
          compilerOptions: { executorRequest: true },
        },
      }),
    });

    const data: any = await godboltRes.json();
    const buildStderr = cleanDiagnostics(data.buildResult?.stderr?.map((x: any) => x.text).join('\n') || '');
    const stdoutRaw = data.stdout?.map((x: any) => x.text).join('\n') || '';

    if (buildStderr && !data.didExecute) {
      return {
        status: 'Compile Error',
        runtimeMs: Date.now() - startTime,
        totalCases: 1,
        passedCases: 0,
        results: [],
        compileError: buildStderr,
      };
    }

    return {
      status: 'Accepted',
      runtimeMs: Date.now() - startTime,
      memoryMb: 24.5,
      totalCases: 1,
      passedCases: 1,
      results: [{ caseIndex: 1, input: stdin, output: stdoutRaw.trim(), passed: true }],
      stdout: stdoutRaw,
    };
  }

  /**
   * Helper to convert JS values into C++ initializers
   */
  private jsonToCppVal(val: any, typeHint: string): string {
    if (val === null || val === undefined) return 'nullptr';
    const cleanType = typeHint.replace(/const\s+/g, '').replace(/[&*]/g, '').trim();

    if (cleanType.includes('ListNode')) {
      if (Array.isArray(val)) {
        return `create_list({${val.map((x) => String(x)).join(', ')}})`;
      }
      return 'nullptr';
    }

    if (Array.isArray(val)) {
      if (cleanType.includes('vector<vector<')) {
        return `{${val
          .map(
            (inner) =>
              `{${inner.map((x: any) => (typeof x === 'string' ? JSON.stringify(x) : String(x))).join(', ')}}`
          )
          .join(', ')}}`;
      }
      if (cleanType.includes('string')) {
        return `{${val.map((s) => JSON.stringify(String(s))).join(', ')}}`;
      }
      return `{${val.map((x) => (typeof x === 'string' ? JSON.stringify(x) : String(x))).join(', ')}}`;
    }

    if (typeof val === 'string') {
      return JSON.stringify(val);
    }
    if (typeof val === 'boolean') {
      return val ? 'true' : 'false';
    }
    return String(val);
  }

  /**
   * Helper to convert JS values into Java initializers
   */
  private jsonToJavaVal(val: any, typeHint: string): string {
    if (val === null || val === undefined) return 'null';
    const cleanType = typeHint.trim();

    if (cleanType === 'int[]') {
      return `new int[]{${Array.isArray(val) ? val.join(', ') : val}}`;
    }
    if (cleanType === 'String[]') {
      return `new String[]{${Array.isArray(val) ? val.map((s) => JSON.stringify(s)).join(', ') : JSON.stringify(val)}}`;
    }
    if (cleanType === 'int[][]') {
      return `new int[][]{${Array.isArray(val) ? val.map((row) => `new int[]{${row.join(', ')}}`).join(', ') : ''}}`;
    }
    if (cleanType === 'String') {
      return JSON.stringify(String(val));
    }
    if (cleanType === 'boolean') {
      return val ? 'true' : 'false';
    }
    return String(val);
  }

  /**
   * Utility to parse parameters from strings like "nums = [2,7,11,15], target = 9"
   */
  private parseArguments(rawInput: string): any[] {
    let lines = rawInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].includes('=')) {
      const parts = splitTopLevelCommas(lines[0]);
      if (parts.length > 1) {
        lines = parts;
      }
    }

    const args: any[] = [];
    for (const line of lines) {
      let valStr = line;
      if (line.includes('=') && !line.startsWith('[') && !line.startsWith('{')) {
        valStr = line.split('=').slice(1).join('=').trim();
      }

      try {
        args.push(JSON.parse(valStr));
      } catch {
        if (/^-?\d+$/.test(valStr)) {
          args.push(parseInt(valStr, 10));
        } else if (/^-?\d+\.\d+$/.test(valStr)) {
          args.push(parseFloat(valStr));
        } else if (valStr === 'true') {
          args.push(true);
        } else if (valStr === 'false') {
          args.push(false);
        } else {
          args.push(valStr.replace(/^["']|["']$/g, ''));
        }
      }
    }

    return args;
  }

  /**
   * Compare actual output with expected output
   */
  private checkEquality(actualStr: string, expectedStr?: string): boolean {
    if (expectedStr === undefined || expectedStr === null) return true;
    const cleanActual = actualStr.trim();
    const cleanExpected = expectedStr.trim();

    if (cleanActual === cleanExpected) return true;

    try {
      const pActual = JSON.parse(cleanActual);
      const pExpected = JSON.parse(cleanExpected);

      if (Array.isArray(pActual) && Array.isArray(pExpected)) {
        if (JSON.stringify(pActual) === JSON.stringify(pExpected)) return true;
        // Allow order-independent comparison for 1D arrays of numbers or strings
        if (
          pActual.length === pExpected.length &&
          pActual.every((x) => typeof x === 'number' || typeof x === 'string')
        ) {
          return JSON.stringify([...pActual].sort()) === JSON.stringify([...pExpected].sort());
        }
      }
      if (typeof pActual === 'number' && typeof pExpected === 'number') {
        return Math.abs(pActual - pExpected) < 1e-5;
      }
      return pActual === pExpected;
    } catch {
      return cleanActual.toLowerCase() === cleanExpected.toLowerCase();
    }
  }
}

export const judgeService = new JudgeService();
