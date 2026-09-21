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

const MacWindowBar: React.FC<{
  title: string;
  rightText?: string;
}> = ({ title, rightText }) => (
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
        {title}
      </span>
    </div>

    {rightText && (
      <span className="text-xs text-textSecondary italic hidden sm:inline-block font-sans">
        {rightText}
      </span>
    )}
  </div>
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
            <MacWindowBar
              title="Intelligent Interview Preparation"
              rightText="From Preparation to Opportunity ↗"
            />

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
                    href="#companies"
                    className="px-5 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white hover:text-primary text-sm font-semibold transition-colors flex items-center gap-2 font-sans"
                  >
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Explore Companies</span>
                    <ArrowRight className="w-3.5 h-3.5 text-textMuted" />
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

          {/* SECTION 2: WHY CHEAT CODE? (MacBook Window Frame) */}
          <section
            id="features"
            className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md relative overflow-hidden shadow-2xl flex flex-col justify-between"
          >
            <MacWindowBar
              title="Why Cheat Code? • Capabilities"
              rightText="Discipline Creates Opportunities ↗"
            />

            <div className="p-6 sm:p-10 lg:p-12 pt-6 sm:pt-8 flex flex-col justify-between flex-1 relative z-10">
              <div>
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
            </div>
          </section>

          {/* SECTION 3: TRUSTED BY QUESTIONS FROM TOP COMPANIES (MacBook Window Frame) */}
          <section
            id="companies"
            className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <MacWindowBar
              title="Verified Company Intelligence • 659+ Teams"
              rightText="Direct Question Mapping ↗"
            />

            <div className="p-6 sm:p-10 lg:p-12 pt-6 sm:pt-8 flex flex-col justify-between flex-1 relative z-10 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                    VERIFIED COMPANY INTELLIGENCE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-sans text-white mt-1">
                    Questions Mapped Directly to <span className="text-primary">Top Tech Teams</span>
                  </h2>
                </div>
                <span className="text-xs text-textSecondary italic hidden sm:inline-block self-end">
                  Real interview questions indexed from verified public sources.
                </span>
              </div>

              {/* Native Cyber Graphic Banner: Top Tech Company Logos and Names */}
              <div
                onClick={handleLaunch}
                className="group relative rounded-2xl border border-white/[0.12] bg-gradient-to-b from-[#0B0E14] via-[#090C12] to-[#06080C] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10"
              >
                {/* Cyber Grid Lines Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                {/* Subtle Ambient Radial Glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 blur-3xl pointer-events-none rounded-full" />

                <div className="relative z-10 space-y-8 sm:space-y-10">
                  {/* Terminal Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[#EAB308] font-mono text-xs sm:text-sm font-semibold tracking-wider">
                      <span>&gt;</span>
                      <span>TRUSTED BY QUESTIONS FROM TOP COMPANIES</span>
                    </div>
                    <h3 className="text-white font-mono font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-wider">
                      659+ COMPANIES INDEXED
                    </h3>
                  </div>

                  {/* Row 1: Google, amazon, Microsoft, Meta, Uber */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 items-center justify-items-center">
                    {/* Google */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center py-2">
                      <span className="font-sans font-bold text-2xl sm:text-3xl tracking-tight">
                        <span className="text-[#4285F4]">G</span>
                        <span className="text-[#EA4335]">o</span>
                        <span className="text-[#FBBC05]">o</span>
                        <span className="text-[#4285F4]">g</span>
                        <span className="text-[#34A853]">l</span>
                        <span className="text-[#EA4335]">e</span>
                      </span>
                    </div>

                    {/* Amazon */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex flex-col items-center justify-center py-2">
                      <span className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none font-sans">
                        amazon
                      </span>
                      <svg className="w-16 sm:w-20 h-3 text-[#FF9900] -mt-0.5" viewBox="0 0 100 22" fill="none">
                        <path
                          d="M8 8C35 22 75 22 92 8"
                          stroke="#FF9900"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M84 4L94 9L88 16Z"
                          fill="#FF9900"
                        />
                      </svg>
                    </div>

                    {/* Microsoft */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center gap-2.5 py-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 grid grid-cols-2 gap-0.5 shrink-0">
                        <div className="bg-[#F25022] rounded-[1px]" />
                        <div className="bg-[#7FBA00] rounded-[1px]" />
                        <div className="bg-[#00A4EF] rounded-[1px]" />
                        <div className="bg-[#FFB900] rounded-[1px]" />
                      </div>
                      <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight font-sans">
                        Microsoft
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center gap-2.5 py-2">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          fill="#0081FB"
                          d="M16.995 6C14.622 6 13.107 7.227 12 8.358C10.893 7.227 9.378 6 7.005 6C3.768 6 1 8.788 1 12.278C1 15.767 3.768 18.555 7.005 18.555C9.645 18.555 11.082 16.993 12 15.688C12.918 16.993 14.355 18.555 16.995 18.555C20.232 18.555 23 15.767 23 12.278C23 8.788 20.232 6 16.995 6ZM7.005 16.273C4.94 16.273 3.327 14.432 3.327 12.278C3.327 10.123 4.94 8.282 7.005 8.282C9.07 8.282 10.457 10.23 11.272 11.666C10.442 13.344 9.172 16.273 7.005 16.273ZM16.995 16.273C14.93 16.273 13.66 13.344 12.83 11.666C13.645 10.23 15.032 8.282 17.097 8.282C19.162 8.282 20.775 10.123 20.775 12.278C20.775 14.432 19.06 16.273 16.995 16.273Z"
                        />
                      </svg>
                      <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                        Meta
                      </span>
                    </div>

                    {/* Uber */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center py-2">
                      <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                        Uber
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Adobe, Apple, NETFLIX, Flipkart, Codeforces */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 items-center justify-items-center">
                    {/* Adobe */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center gap-2.5 py-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#ED2224]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.966 22h3.044L24 2H16.633l-2.667 7.027zm-3.932 0H6.99L0 2h7.367l2.667 7.027zM12 11.516l2.167 5.75H9.833z"/>
                      </svg>
                      <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                        Adobe
                      </span>
                    </div>

                    {/* Apple */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center gap-2.5 py-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white fill-current" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.85-11.75-14.43-6.52-10.4-11.5-22.37-14.94-35.91-3.44-13.55-5.16-26.06-5.16-37.53 0-14.54 3.73-26.69 11.2-36.46 7.47-9.76 16.89-14.73 28.26-14.92 5.06 0 10.46 1.34 16.2 4.02 5.74 2.68 9.61 4.07 11.61 4.17 1.83 0 5.86-1.46 12.09-4.39 6.23-2.92 11.67-4.24 16.32-3.95 12.39.78 22.3 5.48 29.74 14.1-10.88 6.64-16.17 15.76-15.86 27.35.31 9.4 3.99 17.29 11.04 23.68 7.05 6.39 15.34 10.02 24.87 10.89-2.22 6.94-4.87 14.1-7.94 21.46zM119.22 31.84c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.78-10.37 19.45-11.95.2 1.4.3 2.7.3 3.9 0 7.39-2.82 14.37-8.47 20.94-5.65 6.57-12.28 10.48-19.89 11.73-.2-1.3-.34-2.61-.34-3.95z"/>
                      </svg>
                      <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight font-sans">
                        Apple
                      </span>
                    </div>

                    {/* NETFLIX */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center py-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#E50914] tracking-widest uppercase font-sans">
                        NETFLIX
                      </span>
                    </div>

                    {/* Flipkart */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center gap-2.5 py-2">
                      <div className="w-6 h-7 sm:w-7 sm:h-8 rounded bg-white p-0.5 flex flex-col items-center justify-center relative shadow-sm shrink-0">
                        <div className="w-2.5 h-1 border-t-2 border-l-2 border-r-2 border-zinc-500 rounded-t-sm -mt-1 mb-0.5" />
                        <span className="text-[#2874F0] font-black text-sm sm:text-base italic leading-none font-sans">
                          f
                        </span>
                        <div className="absolute -bottom-0.5 right-0.5 flex gap-0.5">
                          <div className="w-1.5 h-0.5 bg-[#FFE500] rounded-full" />
                        </div>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans italic">
                        Flipkart
                      </span>
                    </div>

                    {/* Codeforces */}
                    <div className="transition-transform duration-200 hover:scale-105 select-none inline-flex items-center justify-center gap-2.5 py-2">
                      <div className="flex items-end gap-1 h-6 shrink-0">
                        <div className="w-1.5 h-3.5 bg-[#318CE7] rounded-sm" />
                        <div className="w-1.5 h-6 bg-[#FFD700] rounded-sm" />
                        <div className="w-1.5 h-4.5 bg-[#E53935] rounded-sm" />
                      </div>
                      <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight font-sans">
                        Codeforces
                      </span>
                    </div>
                  </div>

                  {/* Bottom Right "... and many more" */}
                  <div className="flex justify-end pt-2 pr-2">
                    <span className="text-xs sm:text-sm text-zinc-400 italic font-sans group-hover:text-primary transition-colors">
                      ... and many more
                    </span>
                  </div>
                </div>
              </div>

              {/* Creators Quote */}
              <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-textSecondary italic text-center sm:text-left">
                  "Built to help students and engineers crack technical interviews — one verified question at a time."
                </span>
                <span className="text-primary shrink-0 font-semibold">
                  — Bismeet &amp; Abhinav Sharma, Creators
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 4: HOW IT WORKS PIPELINE (MacBook Window Frame) */}
          <section
            id="how-it-works"
            className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <MacWindowBar
              title="How It Works • Preparation Pipeline"
              rightText="Same Questions. Smarter Preparation ↗"
            />

            <div className="p-6 sm:p-10 lg:p-12 pt-6 sm:pt-8 flex flex-col justify-between flex-1 relative z-10 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                    Execution Strategy
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-sans text-white mt-1">
                    Your journey from questions to{' '}
                    <span className="text-primary">opportunities</span>
                  </h2>
                </div>
                <span className="text-xs text-textSecondary italic hidden md:inline-block self-end">
                  5-Stage Continuous Feedback Loop
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
          </div>
        </section>

          {/* SECTION 5: FINAL CTA (MacBook Window Frame) */}
          <section
            id="cta"
            className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#080B0F]/40 backdrop-blur-md shadow-2xl relative overflow-hidden min-h-[380px] flex flex-col justify-between"
          >
            <MacWindowBar
              title="Get Started • Cheat Code Platform"
              rightText="Instant Access • Zero Paywalls ↗"
            />

            <div className="p-6 sm:p-10 lg:p-12 pt-6 sm:pt-8 flex flex-col justify-between flex-1 relative z-10">
              <div className="max-w-2xl">
                <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                  Ready to Start?
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold font-sans text-white leading-tight mt-2">
                  Turn questions into <span className="text-primary">opportunities.</span>
                </h2>
                <p className="text-xs sm:text-sm text-textSecondary mt-3 leading-relaxed font-sans">
                  Join the developer community. Track, practice, and get one step closer to your target role. Built for serious problem solvers.
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
                    <span>Curated Practice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span>Community driven</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span>Built for students</span>
                  </div>
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
            <span className="text-textSecondary">Created by Abhinav Sharma &amp; Bismeet</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={handleLaunch}
              className="text-textSecondary hover:text-primary transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <span>•</span>
            <a href="#companies" className="text-textSecondary hover:text-primary transition-colors">
              Companies
            </a>
            <span>•</span>
            <a href="#features" className="text-textSecondary hover:text-primary transition-colors">
              Features
            </a>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
