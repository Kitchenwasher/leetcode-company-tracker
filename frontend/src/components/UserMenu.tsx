import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon, Crown, LogOut, Settings, RefreshCw, ChevronDown,
  Sparkles, ShieldCheck, Target, Calendar, CheckCircle2, UserPlus, LogIn,
  LayoutDashboard
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
  const navigate = useNavigate();
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] bg-primary hover:bg-primaryHover text-black text-xs font-mono font-bold shadow-terminal-glow transition-all cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>[SIGN_IN]</span>
      </button>
    );
  }

  return (
    <div className="relative font-mono" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          sounds.playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-[2px] bg-surface hover:bg-surfaceElevated border border-border text-textPrimary transition-all cursor-pointer shadow-xs group"
      >
        {/* Avatar */}
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-[2px] object-cover ring-1 ring-border"
            />
          ) : (
            <div className="w-6 h-6 rounded-[2px] bg-surfaceElevated border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary font-mono">
              {getInitials(user.name)}
            </div>
          )}

          {isPro && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-[1px] bg-medium flex items-center justify-center text-black" title="Pro Account">
              <Crown className="w-2 h-2 fill-black" />
            </div>
          )}
        </div>

        {/* Name and Tier */}
        <div className="hidden xl:flex flex-col text-left font-mono">
          <span className="text-xs font-bold text-textPrimary leading-tight truncate max-w-[90px]">
            {user.name}
          </span>
          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
            {isPro ? '[PRO]' : '[FREE]'}
          </span>
        </div>

        <ChevronDown className={`w-3 h-3 text-textMuted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-[2px] terminal-panel shadow-2xl py-1 z-50 animate-fadeIn divide-y divide-border">
          {/* User Info Header */}
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-textPrimary truncate">{user.name}</span>
              {isPro ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-[1px] bg-surface text-medium border border-medium/40 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  PRO
                </span>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSubscriptionModal(true);
                  }}
                  className="text-[10px] font-bold px-1.5 py-0.2 rounded-[1px] bg-primary text-black cursor-pointer"
                >
                  [UPGRADE]
                </button>
              )}
            </div>
            <div className="text-[11px] text-textMuted truncate mt-0.5">&gt; {user.email}</div>

            {user.targetCompany && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px] text-textSecondary">
                <span className="flex items-center gap-1 text-textMuted">
                  <Target className="w-3 h-3 text-primary" />
                  Target:
                </span>
                <span className="font-bold text-primary capitalize">[{user.targetCompany}]</span>
              </div>
            )}
          </div>

          {/* Quick SaaS Tool Links */}
          <div className="p-1 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                sounds.playClick();
                navigate('/overview');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-primary font-bold hover:bg-surfaceElevated transition-colors text-left"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
              <span>&gt; Overview Dashboard</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                sounds.playClick();
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-textSecondary hover:text-primary hover:bg-surfaceElevated transition-colors text-left"
            >
              <Settings className="w-3.5 h-3.5 text-textMuted" />
              <span>&gt; Account Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPlanner();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated transition-colors text-left"
            >
              <Calendar className="w-3.5 h-3.5 text-medium" />
              <span>&gt; Prep Planner</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFlashcards();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated transition-colors text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>&gt; Anki Flashcards</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenLeetCodeSync();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated transition-colors text-left"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>&gt; Sync Profile</span>
            </button>
          </div>

          {/* Switch Accounts Submenu */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-bold text-textMuted uppercase tracking-wider">
              &gt; SWITCH_USER
            </div>
            {usersList.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  sounds.playClick();
                  switchUser(u.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded-[2px] text-xs font-mono transition-colors ${
                  u.id === user.id
                    ? 'bg-surfaceElevated text-primary font-bold border border-primary/30'
                    : 'text-textMuted hover:text-textPrimary hover:bg-surfaceElevated'
                }`}
              >
                <span className="truncate">{u.name}</span>
                <span className="text-[10px] uppercase font-mono text-textMuted">
                  [{u.tier}]
                </span>
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-1">
            <button
              onClick={() => {
                sounds.playClick();
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-error hover:bg-surfaceElevated transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>&gt; LOGOUT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
