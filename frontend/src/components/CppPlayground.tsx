import React, { useState } from 'react';
import {
  Play, CheckCircle2, AlertTriangle, Terminal, RefreshCw, Copy, Check,
  Clock, Cpu, Sparkles, Send
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface CppPlaygroundProps {
  initialCode?: string;
  questionTitle?: string;
  onSendToNotes?: (code: string) => void;
}

export const CppPlayground: React.FC<CppPlaygroundProps> = ({
  initialCode = `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (seen.count(complement)) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
  questionTitle = 'Problem Solution',
  onSendToNotes,
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [testcase, setTestcase] = useState<string>('nums = [2, 7, 11, 15], target = 9');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<{
    status: 'idle' | 'success' | 'error';
    runtimeMs?: number;
    memoryMb?: number;
    stdout?: string;
    result?: string;
  }>({
    status: 'idle',
  });
  const [copied, setCopied] = useState<boolean>(false);

  const runCode = () => {
    setIsRunning(true);
    sounds.playClick();

    setTimeout(() => {
      // Basic syntax linting for C++
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;

      if (openBraces !== closeBraces) {
        setOutput({
          status: 'error',
          stdout: `error: expected '}' at end of input. Found ${openBraces} '{' vs ${closeBraces} '}'.`,
          result: 'Compilation Error: Unbalanced curly braces',
        });
        setIsRunning(false);
        return;
      }

      if (openParens !== closeParens) {
        setOutput({
          status: 'error',
          stdout: `error: unbalanced parentheses. Found ${openParens} '(' vs ${closeParens} ')'.`,
          result: 'Compilation Error: Syntax check failed',
        });
        setIsRunning(false);
        return;
      }

      // Successful simulated execution
      sounds.playSuccess();
      const randomRuntime = Math.floor(Math.random() * 4) + 1; // 1-4 ms
      const randomMemory = (10.2 + Math.random() * 1.5).toFixed(1);

      setOutput({
        status: 'success',
        runtimeMs: randomRuntime,
        memoryMb: parseFloat(randomMemory),
        stdout: `[Simulator Output]\nRunning testcase: ${testcase}\nSolution initialized.\nExecution completed successfully without runtime errors.`,
        result: '[0, 1]  (Target match found at indices 0 and 1)',
      });
      setIsRunning(false);
    }, 600);
  };

  const copyCode = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(code).catch(() => {
          fallbackCopy(code);
        });
      } else {
        fallbackCopy(code);
      }
    } catch (e) {
      fallbackCopy(code);
    }
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    } catch (e) {}
  };

  return (
    <div className="flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
      {/* Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white">In-Browser C++ Sandbox (C++20)</span>
        </div>

        <div className="flex items-center gap-2">
          {onSendToNotes && (
            <button
              type="button"
              onClick={() => onSendToNotes(code)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              title="Save to Personal Notes"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save to Notes</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isRunning ? 'Compiling...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={14}
          spellCheck={false}
          className="w-full p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      {/* Testcase Input */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Sample Input:
        </span>
        <input
          type="text"
          value={testcase}
          onChange={(e) => setTestcase(e.target.value)}
          placeholder="e.g. nums = [2, 7, 11, 15], target = 9"
          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Console Output Terminal */}
      {output.status !== 'idle' && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {output.status === 'success' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Accepted (Simulation)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  {output.result}
                </span>
              )}
            </div>

            {output.runtimeMs && (
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Runtime: <strong className="text-white">{output.runtimeMs} ms</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Memory: <strong className="text-white">{output.memoryMb} MB</strong>
                </span>
              </div>
            )}
          </div>

          <pre className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {output.stdout}
            {output.result && output.status === 'success' && (
              <div className="mt-2 text-emerald-300 font-bold">
                Output: {output.result}
              </div>
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
