import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Bell,
  ChevronDown,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { UserStoreState } from '../types';
import { sounds } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from './ErrorBoundary';

interface AppSidebarLayoutProps {
  children?: React.ReactNode;
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
  const { user, isAuthenticated, isPro, logout, setShowAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Close mobile sidebar and popovers on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserDropdown(false);
    setHoveredNav(null);
  }, [location.pathname]);

  const isOverview = location.pathname === '/dashboard' || location.pathname === '/overview';
  const isCompanies = location.pathname === '/companies';
  const isQuestions = location.pathname === '/questions' || location.pathname.startsWith('/company') || location.pathname.startsWith('/dashboard/company');
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
    <div className="min-h-screen bg-[#080B0F] text-[#F3F4F6] flex flex-col font-sans selection:bg-primary/25 selection:text-white">
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

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => sounds.playClick()}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>

            {/* User Profile Pill / Auth Button */}
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowAuthModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-purple-600 text-white font-semibold text-xs font-sans transition-colors cursor-pointer shadow-md shadow-primary/20"
              >
                Sign In
              </button>
            ) : (
              <div className="relative ml-1">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 pl-2 pr-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm font-sans">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-tight font-sans truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 leading-tight font-sans">
                      {isPro ? 'Pro Member' : 'Free Tier'}
                    </p>
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
                      <p className="font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => onOpenPlanner()}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span>Interview Planner</span>
                    </button>
                    <button
                      onClick={() => onOpenFlashcards()}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span>Spaced Repetition</span>
                    </button>
                    <button
                      onClick={() => onOpenLeetCodeSync()}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span>Sync LeetCode</span>
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.06] text-zinc-300 hover:text-white flex items-center justify-between border-t border-white/[0.08] mt-1 pt-2 cursor-pointer"
                    >
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={async () => {
                        sounds.playClick();
                        await logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 flex items-center gap-2 border-t border-white/[0.08] mt-1 pt-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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
          <div
            className="relative z-10 p-3 space-y-1 overflow-y-auto"
            onMouseLeave={() => setHoveredNav(null)}
          >
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.label}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={item.action}
                  onMouseEnter={() => setHoveredNav(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer relative group font-sans backdrop-blur-xs select-none ${
                    item.isActive
                      ? 'text-accent font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {/* Subtle Hover Pill (Aceternity style) */}
                  {hoveredNav === item.label && !item.isActive && (
                    <motion.div
                      layoutId="sidebar-hover-pill"
                      className="absolute inset-0 rounded-lg bg-white/[0.05] border border-white/[0.07] pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    />
                  )}

                  {/* Active Sliding Pill & Glow (Aceternity / ReactBits style) */}
                  {item.isActive && (
                    <>
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-lg bg-accent-subtle border border-accent/30 pointer-events-none"
                        style={{
                          boxShadow: '0 0 16px -2px color-mix(in srgb, var(--theme-accent, #A855F7) 22%, transparent)',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                        }}
                      />
                      <motion.div
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-accent pointer-events-none"
                        style={{
                          boxShadow: '0 0 10px var(--theme-accent, #A855F7)',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                        }}
                      />
                    </>
                  )}

                  <span className="relative z-10 flex items-center gap-3 w-full">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        item.isActive
                          ? 'text-accent scale-110'
                          : 'text-zinc-400 group-hover:text-zinc-200 group-hover:scale-105'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                </motion.button>
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
            backgroundImage: `linear-gradient(180deg, rgba(8, 11, 15, 0.75) 0%, rgba(8, 11, 15, 0.55) 45%, rgba(8, 11, 15, 0.85) 100%), url('/images/dashboard/space-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <ErrorBoundary>
                {children ?? <Outlet />}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppSidebarLayout;
