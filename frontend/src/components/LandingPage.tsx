import React from 'react';
import {
  Briefcase,
  Clock,
  BrainCircuit,
  Timer,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Check,
  ChevronRight,
  ArrowRight,
  Building2,
  Search,
  Zap,
  BarChart3,
  Users,
  Code2,
  Terminal,
  FileCheck2,
  TrendingUp,
  RotateCcw,
  Rocket,
  Award,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/sound';
import EvilEye from './ui/EvilEye';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();

  const handleLaunch = () => {
    sounds.playClick();
    if (isAuthenticated) {
      onGetStarted();
    } else {
      setShowAuthModal(true);
    }
  };
  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col font-sans selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080B0F]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-tight font-sans">Cheat Code</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                BETA
              </span>
            </div>
            <span className="text-xs text-textMuted hidden sm:inline">• Technical Interview Platform</span>
          </div>

          {/* Center Nav Anchors */}
          <nav className="hidden md:flex items-center gap-7 text-xs text-textSecondary font-medium">
            <a href="#hero" className="hover:text-primary transition-colors">Overview</a>
            <a href="#features" className="hover:text-primary transition-colors">Why Cheat Code</a>
            <a href="#companies" className="hover:text-primary transition-colors">Companies</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">Pipeline</a>
            <a href="#cta" className="hover:text-primary transition-colors">Get Started</a>
          </nav>

          {/* Right Action Links */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <a
              href="https://github.com/Kitchenwasher/leetcode-company-tracker"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-textSecondary hover:text-white transition-colors flex items-center gap-1.5 font-medium"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            {isAuthenticated ? (
              <button
                onClick={handleLaunch}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <span>Enter Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onSignIn();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white hover:text-primary transition-colors cursor-pointer hidden sm:block font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={handleLaunch}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span>Launch Platform</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Fixed GPU-Accelerated Background Canvas with EvilEye */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <EvilEye
          eyeColor="#7C3AED"
          intensity={1.5}
          pupilSize={0.6}
          irisWidth={0.25}
          glowIntensity={0.35}
          scale={0.8}
          noiseScale={1.0}
          pupilFollow={1.0}
          flameSpeed={1.0}
          backgroundColor="#000000"
        />
      </div>

      {/* Main Narrative Canvas */}
      <main className="flex-1 relative z-10 py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12">
          
          {/* SECTION 1: HERO & PRODUCT OVERVIEW (MacBook Window Frame) */}
          <section
            id="hero"
            className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080B0F]/40 relative overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-between"
          >
            {/* macOS Window Title Bar */}
            <div className="w-full px-5 sm:px-8 py-3.5 sm:py-4 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center justify-between gap-3 relative z-10 select-none">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* macOS Traffic Lights */}
                <div className="flex items-center gap-2 group cursor-pointer" title="macOS Window Controls">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/70 shadow-[0_0_8px_rgba(255,95,86,0.35)] flex items-center justify-center text-[8px] text-black/70 font-bold transition-transform group-hover:scale-105">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">✕</span>
                  </span>
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/70 shadow-[0_0_8px_rgba(255,189,46,0.35)] flex items-center justify-center text-[8px] text-black/70 font-bold transition-transform group-hover:scale-105">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">−</span>
                  </span>
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/70 shadow-[0_0_8px_rgba(39,201,63,0.35)] flex items-center justify-center text-[7px] text-black/70 font-bold transition-transform group-hover:scale-105">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity leading-none">＋</span>
                  </span>
                </div>

                <span className="w-px h-3.5 bg-white/15 hidden sm:inline-block" />

                <span className="text-xs font-semibold text-primary tracking-wider uppercase font-mono">
                  Intelligent Interview Preparation
                </span>
              </div>

              <span className="text-xs text-textSecondary italic hidden sm:inline-block">
                From Preparation to Opportunity ↗
              </span>
            </div>

            {/* Inner Content Area */}
            <div className="p-6 sm:p-10 lg:p-12 pt-6 sm:pt-8 flex flex-col justify-between flex-1 relative z-10">
              {/* Internal 2-Column Hero */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column: Headline, Description & CTAs */}
              <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] font-sans">
                  Know what <br />
                  they ask. <br />
                  <span className="text-primary tracking-normal">Be ready when it counts.</span>
                </h1>

                <p className="text-sm sm:text-base text-textSecondary leading-relaxed max-w-xl font-sans">
                  Track verified, company-tagged coding questions, see recency trends, practice with spaced repetition, and simulate timed mock interviews — all in one modern SaaS workspace.
                </p>

                {/* Dual CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleLaunch}
                    className="px-6 py-3.5 rounded-xl bg-primary hover:bg-purple-600 text-white text-sm font-semibold tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer font-sans"
                  >
                    <span>{isAuthenticated ? 'Enter Dashboard' : 'Get Started'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <a
                    href="https://github.com/Kitchenwasher/leetcode-company-tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white hover:text-primary text-sm font-semibold transition-colors flex items-center gap-2 font-sans"
                  >
                    <GithubIcon className="w-4 h-4 text-primary" />
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5 text-textMuted" />
                  </a>
                </div>

                {/* Small Verified Caption */}
                <div className="text-xs text-textMuted tracking-wider uppercase pt-1 font-medium">
                  Real Questions • Real Patterns • Real Progress
                </div>
              </div>

              {/* Right Column: 3D TECH INTELLIGENCE ILLUSTRATION */}
              <div className="lg:col-span-6 xl:col-span-5 w-full flex items-center justify-center">
                <div className="relative w-full max-w-xl mx-auto flex items-center justify-center group">
                  {/* Ambient Purple Glow */}
                  <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-3xl pointer-events-none -z-10" />
                  <img
                    src="/images/landing/hero-illustration.webp"
                    alt="Cheat Code Technical Interview Platform"
                    className="w-full h-auto object-contain drop-shadow-[0_25px_60px_rgba(168,85,247,0.40)] select-none transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>
              </div>
            </div>

            {/* 3 Feature Callouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/[0.06] mt-8 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Search className="w-4 h-4 text-primary" />
                  <span>Company Insights</span>
                </div>
                <p className="text-xs text-textSecondary leading-normal">
                  See patterns and focus on what really matters.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Smarter Practice</span>
                </div>
                <p className="text-xs text-textSecondary leading-normal">
                  Spaced repetition and active retention tracking.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span>Real Interview Mode</span>
                </div>
                <p className="text-xs text-textSecondary leading-normal">
                  Timed mocks, company sets, and telemetry.
                </p>
              </div>
            </div>
          </div>
        </section>

          {/* SECTION 2: WHY CHEAT CODE? */}
          <section
            id="features"
            className="rounded-2xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md relative overflow-hidden p-6 sm:p-10 lg:p-12 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                  Why Cheat Code?
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary tracking-wider uppercase">
                  Discipline Creates Opportunities
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold font-sans text-white leading-snug">
                Built for serious <span className="text-primary">problem solvers.</span>
              </h2>
              <p className="text-xs sm:text-sm text-textSecondary max-w-2xl mt-2 font-sans">
                Everything you need to systematically prepare for technical interviews at top engineering companies.
              </p>
            </div>

            {/* 4 Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 mt-4">
              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm space-y-2 hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Company-wise Questions</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Curated and verified questions from 659+ companies.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm space-y-2 hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Recency Tracking</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Focus on what's being asked in current interview loops.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm space-y-2 hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <span>Spaced Repetition</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Remember core algorithmic patterns when you need them.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm space-y-2 hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Timer className="w-4 h-4 text-primary" />
                  <span>Mock Interviews</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Simulate real interviews with live countdown timers.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: TRUSTED BY QUESTIONS FROM TOP COMPANIES */}
          <section
            id="companies"
            className="rounded-2xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                  Verified Company Intelligence
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-white mt-1">
                  Questions Mapped Directly to <span className="text-primary">Top Tech Teams</span>
                </h2>
              </div>
              <span className="text-xs text-textSecondary italic hidden sm:inline-block self-end">
                Real interview questions indexed from verified public sources.
              </span>
            </div>

            <div className="w-full flex justify-center py-3">
              <img
                src="/images/landing/companies-trusted.png"
                alt="Trusted by questions from top companies: Google, Amazon, Microsoft, Meta, Uber, Adobe, Apple, Netflix, Flipkart"
                className="max-w-4xl w-full h-auto rounded-xl border border-white/[0.08] shadow-2xl object-contain"
              />
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-textSecondary italic text-center sm:text-left">
                "Built in the open, for developers preparing the hard way — one verified question at a time."
              </span>
              <span className="text-primary shrink-0 font-semibold">
                — Bismeet &amp; Abhinav Sharma, Maintainers
              </span>
            </div>
          </section>

          {/* SECTION 4: HOW IT WORKS PIPELINE */}
          <section
            id="how-it-works"
            className="rounded-2xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                  How It Works
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-sans text-white mt-1">
                  Your journey from questions to{' '}
                  <span className="text-primary">opportunities</span>
                </h2>
              </div>
              <span className="text-xs text-textSecondary italic hidden md:inline-block self-end">
                Same Questions. Smarter Preparation. Better Results.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex flex-col justify-between space-y-3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>Index Companies</span>
                  </h4>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                    We index verified questions from public interview reports across 659+ tech firms.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex flex-col justify-between space-y-3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-primary" />
                    <span>Parse &amp; Verify</span>
                  </h4>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                    Clean, tag, and verify questions with metadata (company, topic, date).
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex flex-col justify-between space-y-3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span>Track &amp; Analyze</span>
                  </h4>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                    Identify patterns, frequency trends, and recency across companies.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex flex-col justify-between space-y-3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    <span>Practice Smarter</span>
                  </h4>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                    Use spaced repetition and take mock interviews with real constraints.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm flex flex-col justify-between space-y-3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  5
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5 text-primary" />
                    <span>Get Offer Ready</span>
                  </h4>
                  <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                    Build confidence and crack your next top tier technical opportunity.
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Footer */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-semibold text-textMuted tracking-wider uppercase mb-2">
                <span className="text-purple-400">Collect</span>
                <span>Process</span>
                <span>Analyze</span>
                <span>Practice</span>
                <span className="text-purple-400">Succeed</span>
              </div>
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden flex items-center">
                <div className="w-full h-full bg-gradient-to-r from-[#7C3AED] via-purple-500 to-indigo-400 shadow-[0_0_12px_rgba(124,58,237,0.6)]" />
              </div>
            </div>
          </section>

          {/* SECTION 5: FINAL CTA */}
          <section
            id="cta"
            className="rounded-2xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md shadow-2xl p-6 sm:p-10 lg:p-12 relative overflow-hidden min-h-[380px] flex flex-col justify-between"
          >
            <div className="max-w-2xl">
              <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                Ready to Start?
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold font-sans text-white leading-tight mt-2">
                Turn questions into <span className="text-primary">opportunities.</span>
              </h2>
              <p className="text-xs sm:text-sm text-textSecondary mt-3 leading-relaxed font-sans">
                Join the developer community. Track, practice, and get one step closer to your target role. Zero paywalls, community-driven, built for developers.
              </p>
            </div>

            <div className="space-y-6 pt-6">
              <div>
                <button
                  onClick={handleLaunch}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-purple-600 text-white text-sm sm:text-base font-semibold tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <span>{isAuthenticated ? 'Enter Dashboard' : 'Launch Cheat Code'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 4 Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.08] text-xs text-textSecondary">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Open source</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <span>Community driven</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>Built for devs</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#080B0F]/60 backdrop-blur-md py-8 px-4 sm:px-6 relative z-10 text-xs text-textMuted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-center md:text-left">
            <span className="text-white font-bold">Cheat Code</span>
            <span>•</span>
            <span>659 Companies • 3,399 Questions</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-textSecondary">Contributors: Abhinav Sharma &amp; Bismeet</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://github.com/Kitchenwasher/leetcode-company-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textSecondary hover:text-primary transition-colors"
            >
              Repository
            </a>
            <span>•</span>
            <button
              onClick={handleLaunch}
              className="text-textSecondary hover:text-primary transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
