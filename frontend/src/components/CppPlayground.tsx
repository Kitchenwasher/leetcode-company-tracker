import React, { useState } from 'react';
import { Terminal, Copy, Check, Send, Code2 } from 'lucide-react';
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
  const [copied, setCopied] = useState<boolean>(false);

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
    <div className="flex flex-col rounded-[2px] bg-background border border-border overflow-hidden shadow-terminal font-mono">
      {/* Toolbar */}
      <div className="p-2.5 bg-surface border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
            &gt; C++_CODE_SCRATCHPAD.cpp
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSendToNotes && (
            <button
              type="button"
              onClick={() => onSendToNotes(code)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-surfaceElevated hover:bg-border text-textSecondary hover:text-primary border border-border text-xs font-semibold transition-colors cursor-pointer"
              title="Save scratchpad draft to personal notes"
            >
              <Send className="w-3.5 h-3.5" />
              <span>[ SAVE_TO_NOTES ]</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-surfaceElevated hover:bg-border text-textSecondary hover:text-primary border border-border text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '[ COPIED ]' : '[ COPY_CODE ]'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={16}
          spellCheck={false}
          className="w-full p-4 bg-background font-mono text-xs text-textPrimary leading-relaxed resize-y focus:outline-none focus:border-borderActive"
          placeholder="// Draft your C++ solution, test logic, or invariant notes here..."
        />
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-surface border-t border-border flex items-center justify-between text-[11px] text-textMuted font-mono">
        <div className="flex items-center gap-2">
          <Code2 className="w-3 h-3 text-primaryDim" />
          <span>SYNTAX_EDITOR // DRAFT_INVARIANTS_BEFORE_SUBMITTING</span>
        </div>
        <span>{code.split('\n').length} LINES</span>
      </div>
    </div>
  );
};
