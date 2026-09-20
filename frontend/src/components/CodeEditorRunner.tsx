import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Question } from '../types';
import { SolutionApproach, QuestionDescription } from '../types/solution';
import { judgeApi, JudgeExecutionResponse } from '../api/judgeApi';
import { extractTestCases, generateStarterCode, TestCase } from '../utils/starterCode';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  Play, Send, RotateCcw, Copy, Check, Terminal, Sparkles,
  CheckCircle2, XCircle, AlertTriangle, Clock, Cpu, Plus, FileCode2
} from 'lucide-react';

interface CodeEditorRunnerProps {
  question: Question;
  currentApproach?: SolutionApproach;
  descriptionData?: QuestionDescription | null;
  onSolved?: () => void;
  onSendToNotes?: (code: string) => void;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
}

type SupportedLanguage = 'cpp' | 'python' | 'java' | 'javascript';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  python: 'Python 3 (3.12)',
  cpp: 'C++ (GCC 13.2)',
  java: 'Java (JDK 21)',
  javascript: 'JavaScript (Node 20)',
};

export const CodeEditorRunner: React.FC<CodeEditorRunnerProps> = ({
  question: q,
  currentApproach,
  descriptionData,
  onSolved,
  onSendToNotes,
  initialCode,
  onCodeChange,
}) => {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('cheatcode_editor_lang') as SupportedLanguage) || 'python';
  });

  const [code, setCode] = useState<string>(() => {
    if (initialCode && initialCode.trim()) return initialCode;
    return generateStarterCode(language, currentApproach, q.title, descriptionData?.codeSnippets);
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [isSolutionLoaded, setIsSolutionLoaded] = useState<boolean>(false);

  // Testcases state
  const [testcases, setTestcases] = useState<TestCase[]>([]);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);

  // Bottom drawer state
  const [bottomTab, setBottomTab] = useState<'testcase' | 'result'>('testcase');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<JudgeExecutionResponse | null>(null);

  const editorRef = useRef<any>(null);
  const handleRunCodeRef = useRef<() => void>(() => {});
  const lastQuestionIdRef = useRef(q.id);
  const lastLanguageRef = useRef(language);

  // Initialize testcases when description data arrives
  useEffect(() => {
    const extracted = extractTestCases(descriptionData?.content, descriptionData?.exampleTestcases);
    setTestcases(extracted);
    setSelectedCaseIdx(0);
  }, [descriptionData, q.id]);

  // Generate clean starter template when question changes, language switches, or authentic snippets arrive
  useEffect(() => {
    const isNewQuestion = lastQuestionIdRef.current !== q.id;
    const isNewLanguage = lastLanguageRef.current !== language;
    lastQuestionIdRef.current = q.id;
    lastLanguageRef.current = language;

    if (isNewQuestion) {
      const newCode = (initialCode && initialCode.trim())
        ? initialCode
        : generateStarterCode(language, currentApproach, q.title, descriptionData?.codeSnippets);
      setCode(newCode);
      onCodeChange?.(newCode);
      setIsSolutionLoaded(false);
      setExecResult(null);
    } else if (isNewLanguage) {
      const starter = generateStarterCode(language, currentApproach, q.title, descriptionData?.codeSnippets);
      setCode(starter);
      onCodeChange?.(starter);
      setIsSolutionLoaded(false);
      setExecResult(null);
    } else if (!isSolutionLoaded) {
      // If code was currently an empty placeholder or generic stub, update when authentic snippet arrives
      const isStub = !code || code.includes('// Write your solution here') || code.includes('def solve(self') || code.includes('public int[] solve');
      if (isStub && (descriptionData?.codeSnippets?.length || currentApproach)) {
        const starter = generateStarterCode(language, currentApproach, q.title, descriptionData?.codeSnippets);
        setCode(starter);
        onCodeChange?.(starter);
      }
    }
  }, [language, q.id, descriptionData, currentApproach]);

  const updateCode = (newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  // VS Code Monaco Editor mount handler
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Bind Ctrl+Enter or Cmd+Enter to trigger Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCodeRef.current();
    });
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    sounds.playClick();
    setLanguage(newLang);
    localStorage.setItem('cheatcode_editor_lang', newLang);
  };

  const handleResetStarter = () => {
    sounds.playClick();
    const starter = generateStarterCode(language, currentApproach, q.title, descriptionData?.codeSnippets);
    updateCode(starter);
    setIsSolutionLoaded(false);
  };

  const handleLoadSolution = () => {
    sounds.playClick();
    const sol = (currentApproach?.code as Record<string, string | undefined>)?.[language] || (language === 'cpp' ? currentApproach?.cppCode : '');
    if (sol) {
      updateCode(sol);
      setIsSolutionLoaded(true);
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      sounds.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Run Code against sample testcases
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setBottomTab('result');
      sounds.playClick();

      const currentCode = editorRef.current?.getValue() ?? code;

      const payloadTestcases = testcases.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
      }));

      const res = await judgeApi.runCode({
        language,
        code: currentCode,
        testcases: payloadTestcases,
      });

      setExecResult(res);

      if (res.results && res.results.length > 0) {
        const firstFailIdx = res.results.findIndex((r) => !r.passed);
        setSelectedCaseIdx(firstFailIdx !== -1 ? firstFailIdx : 0);
      }

      if (res.status === 'Accepted') {
        sounds.playSuccess();
      }
    } catch (err: any) {
      setExecResult({
        status: 'Runtime Error',
        runtimeMs: 0,
        totalCases: testcases.length,
        passedCases: 0,
        results: [],
        stderr: err.message || 'Execution error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code against testcases and award problem solved status
  const handleSubmitCode = async () => {
    try {
      setIsSubmitting(true);
      setBottomTab('result');
      sounds.playClick();

      const currentCode = editorRef.current?.getValue() ?? code;

      const payloadTestcases = testcases.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
      }));

      const res = await judgeApi.submitCode({
        language,
        code: currentCode,
        testcases: payloadTestcases,
        questionId: q.id,
      });

      setExecResult(res);

      if (res.results && res.results.length > 0) {
        const firstFailIdx = res.results.findIndex((r) => !r.passed);
        setSelectedCaseIdx(firstFailIdx !== -1 ? firstFailIdx : 0);
      }

      if (res.status === 'Accepted') {
        sounds.playSuccess();
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.3 },
        });
        if (onSolved) {
          onSolved();
        }
      }
    } catch (err: any) {
      setExecResult({
        status: 'Runtime Error',
        runtimeMs: 0,
        totalCases: testcases.length,
        passedCases: 0,
        results: [],
        stderr: err.message || 'Submission error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomTestcase = () => {
    sounds.playClick();
    const newCase: TestCase = {
      id: testcases.length + 1,
      input: '// Custom input\n',
    };
    setTestcases((prev) => [...prev, newCase]);
    setSelectedCaseIdx(testcases.length);
  };

  const handleUpdateTestcaseInput = (val: string) => {
    setTestcases((prev) => {
      const next = [...prev];
      if (next[selectedCaseIdx]) {
        next[selectedCaseIdx] = { ...next[selectedCaseIdx], input: val };
      }
      return next;
    });
  };

  useEffect(() => {
    handleRunCodeRef.current = handleRunCode;
  });

  const currentTestcase = testcases[selectedCaseIdx];
  const currentResultItem = execResult?.results?.[selectedCaseIdx];

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-xl overflow-hidden shadow-2xl font-mono select-none">
      {/* ========================================================= */}
      {/* 1. TOP TOOLBAR: Language, Reset, Load Solution, Copy     */}
      {/* ========================================================= */}
      <div className="h-11 bg-surface border-b border-border px-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          {/* Language Selector Dropdown */}
          <div className="flex items-center bg-background rounded-lg p-0.5 border border-border">
            {(['python', 'cpp', 'java', 'javascript'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-primary text-black shadow-sm'
                    : 'text-textMuted hover:text-white'
                }`}
              >
                {lang === 'python' ? 'Python 3' : lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : 'JS'}
              </button>
            ))}
          </div>

          {isSolutionLoaded && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3" />
              Editorial Solution Loaded
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Load Editorial Solution Button */}
          {currentApproach && (
            <button
              onClick={handleLoadSolution}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surfaceElevated hover:bg-border text-textMuted hover:text-primary border border-border text-xs transition-colors cursor-pointer"
              title="Load verified editorial solution into editor to test"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">Load Solution</span>
            </button>
          )}

          {/* Reset to Starter Template Button */}
          <button
            onClick={handleResetStarter}
            className="p-1.5 rounded-lg bg-surfaceElevated hover:bg-border text-textMuted hover:text-white border border-border transition-colors cursor-pointer"
            title="Reset to clean starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surfaceElevated hover:bg-border text-textMuted hover:text-white border border-border text-xs transition-colors cursor-pointer"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN CODE EDITOR (VS Code Monaco Engine)             */}
      {/* ========================================================= */}
      <div className="flex-1 overflow-hidden relative bg-[#0D1117] min-h-[220px]">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(val) => updateCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "JetBrains Mono, Fira Code, Menlo, Monaco, Consolas, 'Courier New', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            suggestOnTriggerCharacters: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-textMuted text-xs font-mono gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading VS Code Editor...</span>
            </div>
          }
        />
      </div>

      {/* ========================================================= */}
      {/* 3. TESTCASE & TEST RESULT DRAWER                         */}
      {/* ========================================================= */}
      <div className="h-56 bg-surface border-t border-border flex flex-col shrink-0">
        {/* Drawer Header Tabs */}
        <div className="h-9 bg-surfaceElevated/60 border-b border-border px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setBottomTab('testcase');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                bottomTab === 'testcase'
                  ? 'bg-surface text-primary border border-border'
                  : 'text-textMuted hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Testcase</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setBottomTab('result');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                bottomTab === 'result'
                  ? 'bg-surface text-primary border border-border'
                  : 'text-textMuted hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Test Result</span>
              {execResult && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    execResult.status === 'Accepted' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
              )}
            </button>
          </div>

          <div className="text-[11px] text-textMuted font-mono">
            {isRunning ? 'Executing test harness...' : isSubmitting ? 'Evaluating submission...' : ''}
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          {/* TAB A: TESTCASES */}
          {bottomTab === 'testcase' && (
            <div className="space-y-3 h-full flex flex-col">
              {/* Case Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {testcases.map((tc, idx) => (
                  <button
                    key={tc.id || idx}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedCaseIdx(idx);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCaseIdx === idx
                        ? 'bg-primary text-black font-bold shadow-sm'
                        : 'bg-surfaceElevated hover:bg-border text-textMuted hover:text-white border border-border'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}

                <button
                  onClick={handleAddCustomTestcase}
                  className="p-1 rounded-lg bg-surfaceElevated hover:bg-border text-textMuted hover:text-white border border-border transition-colors cursor-pointer"
                  title="Add custom test case"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Case Input Textarea */}
              {currentTestcase && (
                <div className="flex-1 flex flex-col space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-textMuted">
                    <span>Input:</span>
                    {currentTestcase.expected && (
                      <span>Expected: <code className="text-primary">{currentTestcase.expected}</code></span>
                    )}
                  </div>
                  <textarea
                    value={currentTestcase.input}
                    onChange={(e) => handleUpdateTestcaseInput(e.target.value)}
                    className="flex-1 p-2.5 bg-background border border-border rounded-lg text-xs font-mono text-white resize-none focus:outline-none focus:border-primary"
                    placeholder="Enter testcase input..."
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB B: TEST RESULT */}
          {bottomTab === 'result' && (
            <div className="space-y-3">
              {/* Loading State */}
              {(isRunning || isSubmitting) && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-xs text-textMuted font-mono">
                    {isSubmitting ? 'Evaluating solution against judge...' : 'Running code on sample testcases...'}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isRunning && !isSubmitting && !execResult && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-textMuted">
                  <Terminal className="w-6 h-6 text-textMuted/40" />
                  <p className="text-xs">Click <strong>Run Code</strong> or <strong>Submit</strong> to evaluate your solution.</p>
                </div>
              )}

              {/* Result Banner & Metrics */}
              {!isRunning && !isSubmitting && execResult && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-surfaceElevated border border-border">
                    <div className="flex items-center gap-2">
                      {execResult.status === 'Accepted' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : execResult.status === 'Compile Error' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <div>
                        <span
                          className={`text-sm font-extrabold ${
                            execResult.status === 'Accepted'
                              ? 'text-emerald-400'
                              : execResult.status === 'Compile Error'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {execResult.status}
                        </span>
                        {execResult.totalCases > 0 && (
                          <span className="text-xs text-textMuted ml-2">
                            ({execResult.passedCases} / {execResult.totalCases} testcases passed)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-textMuted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {execResult.runtimeMs} ms
                      </span>
                      {execResult.memoryMb && (
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-primary" />
                          {execResult.memoryMb} MB
                        </span>
                      )}
                      {execResult.beatsPercentile && (
                        <span className="text-emerald-400 font-bold">
                          Beats {execResult.beatsPercentile}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compile Error Output */}
                  {execResult.compileError && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono whitespace-pre-wrap">
                      <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Compilation Error</span>
                      </div>
                      {execResult.compileError}
                    </div>
                  )}

                  {/* Stderr / Runtime Error Output */}
                  {execResult.stderr && !execResult.compileError && execResult.status !== 'Accepted' && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono whitespace-pre-wrap">
                      <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Runtime / Execution Error</span>
                      </div>
                      {execResult.stderr}
                    </div>
                  )}

                  {/* Stdout Logs */}
                  {execResult.stdout && (
                    <div className="p-2.5 bg-background border border-border rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Stdout:</span>
                      <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {execResult.stdout}
                      </pre>
                    </div>
                  )}

                  {/* Testcase Breakdown */}
                  {execResult.results && execResult.results.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {execResult.results.map((r, idx) => (
                          <button
                            key={r.caseIndex || idx}
                            onClick={() => setSelectedCaseIdx(idx)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                              selectedCaseIdx === idx
                                ? r.passed
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-sm'
                                  : 'bg-rose-500/20 border-rose-500 text-white font-bold shadow-sm'
                                : r.passed
                                ? 'bg-surfaceElevated border-border text-textMuted hover:text-white'
                                : 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                r.passed ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <span>Case {idx + 1}</span>
                            <span className={`text-[10px] ml-0.5 ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ({r.passed ? 'Passed' : 'Failed'})
                            </span>
                          </button>
                        ))}
                      </div>

                      {currentResultItem && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
                          <div className="p-2.5 bg-background border border-border rounded-lg">
                            <span className="text-[10px] text-textMuted block font-sans mb-1">Input</span>
                            <span className="text-slate-300 whitespace-pre-wrap break-all">{currentResultItem.input}</span>
                          </div>
                          <div className="p-2.5 bg-background border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-textMuted font-sans">Output</span>
                              <span className={`text-[10px] font-bold ${currentResultItem.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {currentResultItem.passed ? 'Passed' : 'Wrong Answer'}
                              </span>
                            </div>
                            <span
                              className={`whitespace-pre-wrap font-bold break-all ${
                                currentResultItem.passed ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {currentResultItem.output || currentResultItem.error || 'void'}
                            </span>
                          </div>
                          <div className="p-2.5 bg-background border border-border rounded-lg">
                            <span className="text-[10px] text-textMuted block font-sans mb-1">Expected</span>
                            <span className="text-primary whitespace-pre-wrap break-all">{currentResultItem.expected || '—'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM ACTION FOOTER: Run Code & Submit               */}
      {/* ========================================================= */}
      <div className="h-12 bg-surface border-t border-border px-4 flex items-center justify-between shrink-0">
        <div className="text-[11px] text-textMuted font-mono hidden sm:block">
          Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-surfaceElevated border border-border text-textSecondary">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-surfaceElevated border border-border text-textSecondary">Enter</kbd> to Run
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surfaceElevated hover:bg-border text-textSecondary hover:text-white border border-border text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Run code against sample test cases (Ctrl+Enter)"
          >
            <Play className={`w-3.5 h-3.5 text-primary ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primaryHover text-black text-xs font-extrabold shadow-terminal-glow transition-all cursor-pointer disabled:opacity-50"
            title="Submit code against all test cases"
          >
            <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
