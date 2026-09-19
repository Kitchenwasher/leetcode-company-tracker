import React from 'react';
import { X, Keyboard, Sparkles } from 'lucide-react';

interface KeyboardHelpModalProps {
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: '/', label: 'Focus search bar' },
    { key: 'j / k', label: 'Navigate next / previous question' },
    { key: 'Space or x', label: 'Cycle question status (Todo → Solved)' },
    { key: 'b', label: 'Toggle favorite / bookmark' },
    { key: 'r', label: 'Random problem roulette 🎲' },
    { key: 't', label: 'Start interview practice timer' },
    { key: 'o', label: 'Open Company Overlap Finder' },
    { key: 'm', label: 'Launch Mock Interview session' },
    { key: 'a', label: 'Open Analytics & Activity Heatmap' },
    { key: '?', label: 'Open keyboard shortcuts guide' },
    { key: 'Esc', label: 'Close active modal / drawer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-850/50">
              <span className="text-xs text-slate-300">{label}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-indigo-300 rounded shadow-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-center">
          <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Designed for high-speed algorithmic practice
          </span>
        </div>
      </div>
    </div>
  );
};
