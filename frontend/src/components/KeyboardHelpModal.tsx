import React from 'react';
import { X, Keyboard, Sparkles } from 'lucide-react';

interface KeyboardHelpModalProps {
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: '/', label: 'Focus global problem search' },
    { key: 'J / K', label: 'Navigate next / previous question' },
    { key: 'Space', label: 'Cycle question status (Todo → Solved)' },
    { key: 'B', label: 'Toggle bookmark star' },
    { key: 'R', label: 'Random problem roulette 🎲' },
    { key: 'T', label: 'Start interview practice timer' },
    { key: 'O', label: 'Open Company Overlap Finder' },
    { key: 'M', label: 'Launch Mock Interview session' },
    { key: 'A', label: 'Open Analytics & Activity Heatmap' },
    { key: '?', label: 'Open keyboard shortcuts guide' },
    { key: 'Esc', label: 'Close active modal / overlay' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-[#0E1217] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-white text-sm">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-xs text-textSecondary">{label}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#12161E] border border-white/[0.1] text-primary rounded-lg shadow-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.06] bg-[#0E1217] text-center">
          <span className="text-xs text-textMuted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] text-white font-mono text-[11px]">Esc</kbd> anytime to dismiss
          </span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardHelpModal;
