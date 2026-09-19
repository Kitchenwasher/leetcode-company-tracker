import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileText,
  SlidersHorizontal,
  Users,
  TrendingUp,
  Shield,
  Bookmark,
  Settings,
  Search,
  Menu,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Sparkles,
  Palette,
} from 'lucide-react';
import { UserStoreState } from '../types';
import { sounds } from '../utils/sound';
import { QuickThemePopover } from './ThemeToolkit';

interface AppSidebarLayoutProps {
  children: React.ReactNode;
  store: UserStoreState;
  onOpenMockModal: () => void;
  onOpenAnalyticsModal: () => void;
  onOpenPlanner: () => void;
  onOpenFlashcards: () => void;
  onOpenLeetCodeSync: () => void;
  onSearchFocus?: () => void;
  hideTopBar?: boolean;
}

export const AppSidebarLayout: React.FC<AppSidebarLayoutProps> = ({
  children,
  store,
  onOpenMockModal,
  onOpenAnalyticsModal,
  onOpenPlanner,
  onOpenFlashcards,
  onOpenLeetCodeSync,
  onSearchFocus,
  hideTopBar = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeToolkit, setShowThemeToolkit] = useState(false);

  // Close mobile sidebar and popovers on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowThemeToolkit(false);
    setShowUserDropdown(false);
  }, [location.pathname]);

  const isOverview = location.pathname === '/dashboard' || location.pathname === '/overview';
  const isCompanies = location.pathname === '/companies';
  const isQuestions = location.pathname === '/questions' || location.pathname.startsWith('/dashboard/company');
  const isPractice = location.pathname === '/practice';
  const isMockInterview = location.pathname === '/mock-interview';
  const isProgress = location.pathname === '/progress';
  const isCommunity = location.pathname === '/community';
  const isBookmarks = location.pathname === '/bookmarks';
  const isSettings = location.pathname === '/settings';

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      action: () => {
        sounds.playClick();
        navigate('/dashboard');
      },
      isActive: isOverview,
    },
    {
      label: 'Companies',
      icon: Building2,
      action: () => {
        sounds.playClick();
        navigate('/companies');
      },
      isActive: isCompanies,
    },
    {
      label: 'Questions',
      icon: FileText,
      action: () => {
        sounds.playClick();
        navigate('/questions');
      },
      isActive: isQuestions,
    },
    {
      label: 'Practice',
      icon: SlidersHorizontal,
      action: () => {
        sounds.playClick();
        navigate('/practice');
      },
      isActive: isPractice,
    },
    {
      label: 'Mock Interview',
      icon: Users,
      action: () => {
        sounds.playClick();
        navigate('/mock-interview');
      },
      isActive: isMockInterview,
    },
    {
      label: 'Progress',
      icon: TrendingUp,
      action: () => {
        sounds.playClick();
        navigate('/progress');
      },
      isActive: isProgress,
    },
    {
      label: 'Community',
      icon: Shield,
      action: () => {
        sounds.playClick();
        navigate('/community');
      },
      isActive: isCommunity,
    },
    {
      label: 'Bookmarks',
      icon: Bookmark,
      action: () => {
        sounds.playClick();
        navigate('/bookmarks');
      },
      isActive: isBookmarks,
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => {
        sounds.playClick();
        navigate('/settings');
      },
      isActive: isSettings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B0F] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#E5FF00]/20 selection:text-[#E5FF00]">
      {/* Top Bar Header */}
      {!hideTopBar && (
        <header className="sticky top-0 z-40 w-full h-16 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between select-none">
          {/* Left: Brand + Beta Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                navigate('/dashboard');
              }}
              className="flex items-center text-left cursor-pointer group"
            >
              <span className="text-accent font-mono font-bold text-base mr-1.5">&gt;</span>
              <span className="text-white font-sans font-bold text-base tracking-tight group-hover:text-accent transition-colors">
                CHEAT_CODE
              </span>
              <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-[10px] font-semibold tracking-wide bg-accent-subtle text-accent border border-accent-subtle">
                BETA
              </span>
            </button>
          </div>

          {/* Center: Search Bar with Ctrl+K shortcut */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <button
              onClick={() => {
                sounds.playClick();
                if (onSearchFocus) {
                  onSearchFocus();
                } else {
                  navigate('/questions');
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#11141A] border border-white/[0.08] text-xs text-zinc-400 hover:border-white/20 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate font-sans">
                <Search className="w-4 h-4 text-zinc-500 group-hover:text-accent transition-colors shrink-0" />
                <span className="truncate">Search questions, companies, topics...</span>
              </div>
              <kbd className="inline-block px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-zinc-400 shrink-0">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Theme Toggles, Notifications, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => sounds.playClick()}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              title="Theme light"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => sounds.playClick()}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              title="Theme dark"
            >
              <Moon className="w-4 h-4" />
            </button>

            {/* Quick Accent Color Toolkit Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowThemeToolkit(!showThemeToolkit);
                }}
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showThemeToolkit ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
                title="Accent Color Toolkit"
              >
                <Palette className="w-4 h-4 text-accent" />
                <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              </button>

              <QuickThemePopover
                isOpen={showThemeToolkit}
                onClose={() => setShowThemeToolkit(false)}
                onNavigateToSettings={() => navigate('/settings')}
              />
            </div>

            <button
              onClick={() => sounds.playClick()}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>

            {/* User Profile Pill */}
            <div className="relative ml-1">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 pl-2 pr-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  N
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight font-sans">Nitish Kumar</p>
                  <p className="text-[10px] text-zinc-400 leading-tight font-sans">Pro Member</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#11141A] border border-white/[0.1] rounded-xl shadow-2xl p-2 z-50 animate-fadeIn font-sans text-xs"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                    <p className="font-semibold text-white">Nitish Kumar</p>
                    <p className="text-[11px] text-zinc-400 font-mono">nitish@cheatcode.dev</p>
                  </div>
                  <button
                    onClick={() => onOpenPlanner()}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between"
                  >
                    <span>Interview Planner</span>
                  </button>
                  <button
                    onClick={() => onOpenFlashcards()}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between"
                  >
                    <span>Spaced Repetition</span>
                  </button>
                  <button
                    onClick={() => onOpenLeetCodeSync()}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between"
                  >
                    <span>Sync LeetCode</span>
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between border-t border-white/[0.08] mt-1 pt-2"
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-accent" />
                      <span>Theme Color Toolkit</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between"
                  >
                    <span>Settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed top-16 bottom-0 left-0 z-40 w-60 border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-hidden bg-[#09090b] ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          {/* Full-Height Background Astronaut on Moon Image (Mirrored & Positioned to match original) */}
          <img
            src="/images/dashboard/astronaut-sidebar.jpg"
            alt="Astronaut on lunar surface"
            className="absolute inset-0 w-full h-full object-cover object-[62%_bottom] -scale-x-100 select-none pointer-events-none opacity-90"
          />

          {/* Gradients: Strong contrast at top for navigation icons, soft in mid/bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/95 via-[#09090b]/65 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/30 pointer-events-none" />

          {/* Nav Items Container */}
          <div className="relative z-10 p-3 space-y-1 overflow-y-auto">
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer relative group font-sans backdrop-blur-xs ${
                    item.isActive
                      ? 'bg-accent-subtle text-accent font-semibold border-l-2 border-accent'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      item.isActive ? 'text-accent' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Compact Status Card */}
          <div className="relative z-10 p-3 border-t border-white/[0.06] mt-auto">
            <div className="rounded-xl bg-[#11141A]/85 backdrop-blur-md border border-white/[0.08] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-medium text-emerald-400">ONLINE</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">v2.4</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white font-sans flex items-center gap-1">
                  <span>Cheat Code Pro</span>
                  <Sparkles className="w-3 h-3 text-accent" />
                </p>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  659 Companies • 3,399 Questions
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main
          className="flex-1 lg:pl-60 min-w-0 relative bg-[#080B0F] min-h-[calc(100vh-4rem)]"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8, 11, 15, 0.70) 0%, rgba(8, 11, 15, 0.50) 45%, rgba(8, 11, 15, 0.85) 100%), url('/images/dashboard/space-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppSidebarLayout;
