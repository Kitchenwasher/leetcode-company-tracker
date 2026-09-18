import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon, Crown, LogOut, Settings, RefreshCw, ChevronDown,
  Sparkles, ShieldCheck, Target, Calendar, CheckCircle2, UserPlus, LogIn
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface UserMenuProps {
  onOpenPlanner: () => void;
  onOpenFlashcards: () => void;
  onOpenLeetCodeSync: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenPlanner,
  onOpenFlashcards,
  onOpenLeetCodeSync,
}) => {
  const {
    user,
    isAuthenticated,
    isPro,
    usersList,
    switchUser,
    logout,
    setShowAuthModal,
    setShowSubscriptionModal,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => {
          sounds.playClick();
          setShowAuthModal(true);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          sounds.playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all cursor-pointer shadow-xs group"
      >
        {/* Avatar */}
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {getInitials(user.name)}
            </div>
          )}

          {isPro && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 ring-1 ring-slate-900" title="Pro Account">
              <Crown className="w-2 h-2 fill-slate-950" />
            </div>
          )}
        </div>

        {/* Name and Tier */}
        <div className="hidden xl:flex flex-col text-left">
          <span className="text-xs font-bold text-white leading-tight truncate max-w-[90px]">
            {user.name}
          </span>
          <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">
            {isPro ? 'PRO Plan' : 'Free Tier'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/50 py-2 z-50 animate-fadeIn divide-y divide-slate-800/80">
          {/* User Info Header */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{user.name}</span>
              {isPro ? (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  PRO
                </span>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSubscriptionModal(true);
                  }}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/40 cursor-pointer"
                >
                  Upgrade
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>

            {user.targetCompany && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <Target className="w-3 h-3 text-indigo-400" />
                  Target:
                </span>
                <span className="font-semibold text-indigo-300 capitalize">{user.targetCompany}</span>
              </div>
            )}
          </div>

          {/* Quick SaaS Tool Links */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPlanner();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Company Prep Planner</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFlashcards();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Anki Flashcard Recall</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenLeetCodeSync();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync LeetCode Profile</span>
            </button>
          </div>

          {/* Switch Accounts Submenu */}
          <div className="p-1.5">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Switch Account
            </div>
            {usersList.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  sounds.playClick();
                  switchUser(u.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  u.id === user.id
                    ? 'bg-indigo-950/40 text-indigo-300 font-semibold border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{u.name}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {u.tier}
                </span>
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-1.5">
            <button
              onClick={() => {
                sounds.playClick();
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
