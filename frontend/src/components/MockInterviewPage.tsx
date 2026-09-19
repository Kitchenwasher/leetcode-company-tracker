import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  FileText,
  Check,
  ChevronDown,
  TrendingUp,
  Play,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Question, CompanyMeta, UserStoreState } from '../types';
import { sounds } from '../utils/sound';

interface MockInterviewPageProps {
  questions: Question[];
  companies: Record<string, CompanyMeta>;
  store: UserStoreState;
  onOpenMockModal: () => void;
}

export const MockInterviewPage: React.FC<MockInterviewPageProps> = ({
  questions,
  companies,
  store,
  onOpenMockModal,
}) => {
  const [activeTab, setActiveTab] = useState<'start' | 'past' | 'performance' | 'tips'>('start');
  const [interviewType, setInterviewType] = useState<'coding' | 'behavioral' | 'mixed'>('coding');

  // Form selections
  const [selectedCompany, setSelectedCompany] = useState<string>('Google');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');
  const [selectedQuestionsCount, setSelectedQuestionsCount] = useState<string>('5 Questions');
  const [selectedTopic, setSelectedTopic] = useState<string>('Arrays, Trees');

  // Dropdown open states
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [diffDropdownOpen, setDiffDropdownOpen] = useState(false);
  const [countDropdownOpen, setCountDropdownOpen] = useState(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  const closeAllDropdowns = () => {
    setCompanyDropdownOpen(false);
    setDiffDropdownOpen(false);
    setCountDropdownOpen(false);
    setTopicDropdownOpen(false);
  };

  const renderCompanyLogo = (company: string, sizeClass = "w-4 h-4") => {
    switch (company.toLowerCase()) {
      case 'google':
        return (
          <svg className={`${sizeClass} shrink-0`} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        );
      case 'amazon':
        return (
          <div className={`${sizeClass} rounded bg-[#FF9900] text-black font-bold text-[11px] flex items-center justify-center shrink-0 leading-none`}>
            a
          </div>
        );
      case 'microsoft':
        return (
          <div className={`${sizeClass} grid grid-cols-2 gap-0.5 shrink-0`}>
            <div className="bg-[#F25022] rounded-[1px]" />
            <div className="bg-[#7FBA00] rounded-[1px]" />
            <div className="bg-[#00A4EF] rounded-[1px]" />
            <div className="bg-[#FFB900] rounded-[1px]" />
          </div>
        );
      case 'meta':
        return (
          <svg className={`${sizeClass} shrink-0`} viewBox="0 0 24 24" fill="none">
            <path d="M6.9 7.2C4.1 7.2 2 9.4 2 12.1c0 3 2.3 5.2 5.3 5.2 2.1 0 3.6-1.1 4.7-2.8 1.1 1.7 2.6 2.8 4.7 2.8 3 0 5.3-2.2 5.3-5.2 0-2.7-2.1-4.9-4.9-4.9-2.1 0-3.6 1.1-4.7 2.8-1.1-1.7-2.6-2.8-4.7-2.8zm-.1 2.2c1.4 0 2.5.9 3.2 2.3-.7 1.4-1.8 2.3-3.2 2.3-1.7 0-2.9-1.2-2.9-2.8 0-1.5 1.2-2.8 2.9-2.8zm10.4 0c1.7 0 2.9 1.3 2.9 2.8 0 1.6-1.2 2.8-2.9 2.8-1.4 0-2.5-.9-3.2-2.3.7-1.4 1.8-2.3 3.2-2.3z" fill="#0081FB" />
          </svg>
        );
      case 'apple':
        return (
          <svg className={`${sizeClass} shrink-0 text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.71 1 .08 2.04-.45 2.58-1.2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleSelectTemplate = (companyName: string, type: 'coding' | 'behavioral' | 'mixed', qCount: string) => {
    sounds.playClick();
    setSelectedCompany(companyName);
    setInterviewType(type);
    setSelectedQuestionsCount(qCount);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-white font-sans" onClick={closeAllDropdowns}>
      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1 pb-1">
        {/* Subtle planetary crescent glow in top right */}
        <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none select-none overflow-hidden opacity-30">
          <img
            src="/images/dashboard/moon-quote.jpg"
            alt="Celestial horizon"
            className="w-full h-full object-cover object-[68%_18%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080B0F] via-[#080B0F]/60 to-transparent" />
        </div>

        {/* Left: Title & Subtitle */}
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Mock Interview Simulator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-sans">
            Simulate. Learn. Improve.
          </h1>
          <p className="text-sm text-textSecondary">
            Realistic interviews. Instant feedback. Real algorithmic growth.
          </p>
        </div>

        {/* Right: Header Quote Block */}
        <div className="relative z-10 text-left md:text-right">
          <p className="text-xs sm:text-sm text-zinc-300 italic tracking-wide leading-relaxed font-sans">
            &ldquo;Practice today,<br />
            confidence tomorrow.&rdquo;
          </p>
          <div className="w-8 h-0.5 bg-primary mt-2.5 md:ml-auto rounded-full" />
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-6 border-b border-white/[0.08] text-sm font-medium px-1 select-none overflow-x-auto">
        {[
          { id: 'start', label: 'Start Interview' },
          { id: 'past', label: 'Past Interviews' },
          { id: 'performance', label: 'Performance' },
          { id: 'tips', label: 'Tips & Resources' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sounds.playClick();
              setActiveTab(tab.id as any);
            }}
            className={`pb-3 font-medium relative transition-colors cursor-pointer shrink-0 text-xs sm:text-sm ${
              activeTab === tab.id ? 'text-primary font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Past Interviews */}
      {activeTab === 'past' && (
        <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Completed Mock Sessions</h2>
            <span className="text-xs text-textMuted font-mono">12 Recorded</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {[
              { company: 'Google', role: 'SWE L4', type: 'Mixed', score: '78%', duration: '42m', date: 'Sep 18, 2026' },
              { company: 'Meta', role: 'Production Eng', type: 'Coding', score: '85%', duration: '38m', date: 'Sep 15, 2026' },
              { company: 'Amazon', role: 'SDE II', type: 'Mixed', score: '62%', duration: '45m', date: 'Sep 12, 2026' },
              { company: 'Microsoft', role: 'Software Engineer', type: 'Behavioral', score: '90%', duration: '30m', date: 'Sep 09, 2026' },
            ].map((s, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  {renderCompanyLogo(s.company, 'w-5 h-5')}
                  <div>
                    <p className="text-sm font-semibold text-white">{s.company} • {s.role}</p>
                    <p className="text-xs text-textMuted">{s.type} Session • {s.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary font-mono">{s.score}</span>
                  <p className="text-[11px] text-textMuted font-mono">{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Performance */}
      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-5 space-y-2">
            <p className="text-xs text-textMuted">Average Problem Solving Speed</p>
            <p className="text-2xl font-bold text-white font-mono">18.4 mins</p>
            <p className="text-xs text-emerald-400">4.2 mins faster than median candidate</p>
          </div>
          <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-5 space-y-2">
            <p className="text-xs text-textMuted">Clean Code & Complexity Pass</p>
            <p className="text-2xl font-bold text-primary font-mono">82%</p>
            <p className="text-xs text-textSecondary">Dry-run & edge case coverage</p>
          </div>
          <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-5 space-y-2">
            <p className="text-xs text-textMuted">STAR Behavioral Eloquence</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">88%</p>
            <p className="text-xs text-textSecondary">High clarity, quantified outcomes</p>
          </div>
        </div>
      )}

      {/* Tab: Tips & Resources */}
      {activeTab === 'tips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Award className="w-4 h-4" />
              <span>The 5-Step Coding Framework</span>
            </div>
            <ul className="text-xs text-textSecondary space-y-2 leading-relaxed">
              <li>1. <strong>Clarify:</strong> Ask 2–3 boundary conditions (empty arrays, duplicates, sign of integers).</li>
              <li>2. <strong>Brute-force first:</strong> State the naive solution ($O(N^2)$) in 30 seconds to establish baseline.</li>
              <li>3. <strong>Optimize:</strong> Identify the bottleneck (hash map, two pointers, prefix sums, binary search).</li>
              <li>4. <strong>Clean Implementation:</strong> Use descriptive variable names and modular helper functions.</li>
              <li>5. <strong>Dry Run:</strong> Trace with an example test case before clicking submit or declaring done.</li>
            </ul>
          </div>
          <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Behavioral STAR Method Checklist</span>
            </div>
            <ul className="text-xs text-textSecondary space-y-2 leading-relaxed">
              <li>• <strong>Situation:</strong> Set the context and business impact in 2 sentences.</li>
              <li>• <strong>Task:</strong> State your specific personal responsibility.</li>
              <li>• <strong>Action:</strong> Detail what YOU did, trade-offs made, and how you led.</li>
              <li>• <strong>Result:</strong> Quantify metrics (latency reduced by 40%, \$50K saved).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Grid: Left 8-Columns (Form + Quick Templates) | Right 4-Columns (Stats, Recents, Mountain Quote) */}
      {activeTab === 'start' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Interview Configurator Card */}
            <div className="bg-[#0E1217] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6">
              {/* Section 1: Select Interview Type */}
              <div className="space-y-2.5">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white font-sans">
                    1. Select Interview Type
                  </h2>
                  <p className="text-xs text-textSecondary mt-0.5">
                    Choose the mode that fits your preparation goal.
                  </p>
                </div>

                {/* 3 Type Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {/* 1. Coding Interview */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      setInterviewType('coding');
                    }}
                    className={`p-4 sm:p-5 rounded-xl transition-all cursor-pointer relative group flex flex-col justify-between min-h-[135px] ${
                      interviewType === 'coding'
                        ? 'bg-[#12161E] border-2 border-primary shadow-lg shadow-primary/10'
                        : 'bg-[#12161E]/60 border border-white/[0.07] hover:border-white/20 hover:bg-[#12161E]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-bold text-primary text-base leading-none">
                        &lt;/&gt;
                      </span>
                      {interviewType === 'coding' ? (
                        <div className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-600 group-hover:border-zinc-400 transition-colors" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-xs sm:text-sm font-sans">
                        Coding Technical
                      </h3>
                      <p className="text-[11px] text-textSecondary mt-1 leading-relaxed">
                        Solve verified problems on a live editor. Get real-time feedback.
                      </p>
                    </div>
                  </div>

                  {/* 2. Behavioral Interview */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      setInterviewType('behavioral');
                    }}
                    className={`p-4 sm:p-5 rounded-xl transition-all cursor-pointer relative group flex flex-col justify-between min-h-[135px] ${
                      interviewType === 'behavioral'
                        ? 'bg-[#12161E] border-2 border-primary shadow-lg shadow-primary/10'
                        : 'bg-[#12161E]/60 border border-white/[0.07] hover:border-white/20 hover:bg-[#12161E]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        <circle cx="8.5" cy="11.5" r="0.75" fill="currentColor" />
                        <circle cx="12" cy="11.5" r="0.75" fill="currentColor" />
                        <circle cx="15.5" cy="11.5" r="0.75" fill="currentColor" />
                      </svg>
                      {interviewType === 'behavioral' ? (
                        <div className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-600 group-hover:border-zinc-400 transition-colors" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-xs sm:text-sm font-sans">
                        Behavioral Interview
                      </h3>
                      <p className="text-[11px] text-textSecondary mt-1 leading-relaxed">
                        Practice common behavioral prompts with the STAR framework.
                      </p>
                    </div>
                  </div>

                  {/* 3. Mixed Interview */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      setInterviewType('mixed');
                    }}
                    className={`p-4 sm:p-5 rounded-xl transition-all cursor-pointer relative group flex flex-col justify-between min-h-[135px] ${
                      interviewType === 'mixed'
                        ? 'bg-[#12161E] border-2 border-primary shadow-lg shadow-primary/10'
                        : 'bg-[#12161E]/60 border border-white/[0.07] hover:border-white/20 hover:bg-[#12161E]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="14" y2="17" />
                      </svg>
                      {interviewType === 'mixed' ? (
                        <div className="w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-600 group-hover:border-zinc-400 transition-colors" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-white text-xs sm:text-sm font-sans">
                        Mixed Full-Loop
                      </h3>
                      <p className="text-[11px] text-textSecondary mt-1 leading-relaxed">
                        Comprehensive round combining algorithms and culture fit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Configure Your Interview */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-white font-sans">
                    2. Configure Your Interview
                  </h2>
                  <p className="text-xs text-textSecondary mt-0.5">
                    Customize your target company, difficulty profile, and problem quota.
                  </p>
                </div>

                {/* 4 Select Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Company (Optional) */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs text-textSecondary font-medium block">
                      Target Company
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        const state = !companyDropdownOpen;
                        closeAllDropdowns();
                        setCompanyDropdownOpen(state);
                      }}
                      className="w-full bg-[#12161E] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {renderCompanyLogo(selectedCompany)}
                        <span className="font-semibold text-white">{selectedCompany}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {companyDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B24] border border-white/[0.1] rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                        {['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber'].map((comp) => (
                          <div
                            key={comp}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedCompany(comp);
                              setCompanyDropdownOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg text-xs hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer text-zinc-200 hover:text-white"
                          >
                            {renderCompanyLogo(comp)}
                            <span>{comp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Difficulty */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs text-textSecondary font-medium block">
                      Difficulty Level
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        const state = !diffDropdownOpen;
                        closeAllDropdowns();
                        setDiffDropdownOpen(state);
                      }}
                      className="w-full bg-[#12161E] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedDifficulty === 'Easy'
                            ? 'bg-emerald-400'
                            : selectedDifficulty === 'Hard'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`} />
                        <span className="font-semibold text-white">{selectedDifficulty}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {diffDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B24] border border-white/[0.1] rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                        {['Easy', 'Medium', 'Hard'].map((diff) => (
                          <div
                            key={diff}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedDifficulty(diff);
                              setDiffDropdownOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg text-xs hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer text-zinc-200 hover:text-white"
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              diff === 'Easy' ? 'bg-emerald-400' : diff === 'Hard' ? 'bg-rose-400' : 'bg-amber-400'
                            }`} />
                            <span>{diff}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Number of Questions */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs text-textSecondary font-medium block">
                      Problem Quota
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        const state = !countDropdownOpen;
                        closeAllDropdowns();
                        setCountDropdownOpen(state);
                      }}
                      className="w-full bg-[#12161E] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-white">{selectedQuestionsCount}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {countDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B24] border border-white/[0.1] rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                        {['3 Questions', '5 Questions', '10 Questions', '15 Questions'].map((cnt) => (
                          <div
                            key={cnt}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedQuestionsCount(cnt);
                              setCountDropdownOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg text-xs hover:bg-white/[0.06] cursor-pointer text-zinc-200 hover:text-white"
                          >
                            {cnt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Focus Topics (Optional) */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs text-textSecondary font-medium block">
                      Topic Focus
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        const state = !topicDropdownOpen;
                        closeAllDropdowns();
                        setTopicDropdownOpen(state);
                      }}
                      className="w-full bg-[#12161E] border border-white/[0.08] hover:border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-white truncate">{selectedTopic}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                    </button>

                    {topicDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B24] border border-white/[0.1] rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                        {['Arrays, Trees', 'Dynamic Programming', 'Graphs & BFS/DFS', 'Two Pointers', 'System Design', 'All Topics'].map((top) => (
                          <div
                            key={top}
                            onClick={() => {
                              sounds.playClick();
                              setSelectedTopic(top);
                              setTopicDropdownOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg text-xs hover:bg-white/[0.06] cursor-pointer text-zinc-200 hover:text-white truncate"
                          >
                            {top}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Mock Interview Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      onOpenMockModal();
                    }}
                    className="w-full bg-primary hover:bg-[#D4ED00] text-black font-bold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer font-sans"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start Mock Interview</span>
                  </button>
                  <p className="text-xs text-textMuted text-center mt-2 font-sans">
                    Simulate real-world conditions. Timed countdown begins when launched.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Templates Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white font-sans">Popular Target Templates</h2>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenMockModal();
                  }}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 5 Template Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {[
                  { company: 'Google', title: 'Google SWE', qs: '5 Qs', type: 'mixed', logo: 'google' },
                  { company: 'Amazon', title: 'Amazon SDE', qs: '5 Qs', type: 'coding', logo: 'amazon' },
                  { company: 'Microsoft', title: 'Microsoft', qs: '5 Qs', type: 'mixed', logo: 'microsoft' },
                  { company: 'Meta', title: 'Meta SWE', qs: '5 Qs', type: 'coding', logo: 'meta' },
                  { company: 'Apple', title: 'Apple', qs: '5 Qs', type: 'mixed', logo: 'apple' },
                ].map((tmpl) => (
                  <div
                    key={tmpl.title}
                    onClick={() => handleSelectTemplate(tmpl.company, tmpl.type as any, '5 Questions')}
                    className="p-4 rounded-xl bg-[#0E1217] border border-white/[0.08] hover:border-primary/50 hover:bg-[#12161E] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {renderCompanyLogo(tmpl.logo, 'w-6 h-6')}
                      <h3 className="font-semibold text-white text-xs mt-3 group-hover:text-primary transition-colors font-sans">
                        {tmpl.title}
                      </h3>
                      <p className="text-[11px] text-textSecondary mt-0.5 font-mono">
                        {tmpl.qs} • {tmpl.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 Columns */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Your Interview Stats */}
            <div className="bg-[#0E1217] border border-white/[0.08] rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-3.5 text-primary">
                    <div className="w-1 h-1.5 bg-primary rounded-xs" />
                    <div className="w-1 h-3.5 bg-primary rounded-xs" />
                    <div className="w-1 h-2 bg-primary rounded-xs" />
                  </div>
                  <h2 className="text-sm font-semibold text-white font-sans">Your Interview Stats</h2>
                </div>
                <button
                  onClick={() => sounds.playClick()}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 4 Stat rows */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white font-mono leading-none">12</p>
                    <p className="text-xs text-textSecondary mt-0.5">Interviews Taken</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white font-mono leading-none">8</p>
                    <p className="text-xs text-textSecondary mt-0.5">Completed</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white font-mono leading-none">67%</p>
                    <p className="text-xs text-textSecondary mt-0.5">Average Score</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white font-mono leading-none">3h 24m</p>
                    <p className="text-xs text-textSecondary mt-0.5">Total Practice Time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Interviews */}
            <div className="bg-[#0E1217] border border-white/[0.08] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-white font-sans">Recent Interviews</h2>
                </div>
                <button
                  onClick={() => sounds.playClick()}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer font-sans"
                >
                  <span>History</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* List of 4 recent interviews */}
              <div className="space-y-2">
                {[
                  { company: 'Google', mode: 'Coding', diff: 'Medium', date: 'Sep 14, 2026' },
                  { company: 'Microsoft', mode: 'Behavioral', diff: '', date: 'Sep 12, 2026' },
                  { company: 'Amazon', mode: 'Mixed', diff: 'Hard', date: 'Sep 10, 2026' },
                  { company: 'Meta', mode: 'Coding', diff: 'Medium', date: 'Sep 8, 2026' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      sounds.playClick();
                      onOpenMockModal();
                    }}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/15 hover:bg-white/[0.05] transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {renderCompanyLogo(item.company)}
                      <div>
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-primary transition-colors font-sans">
                          {item.company}
                        </p>
                        <p className="text-[11px] text-textSecondary mt-0.5">
                          {item.mode} {item.diff ? `• ${item.diff}` : ''}
                        </p>
                        <p className="text-[10px] text-textMuted mt-0.5 font-mono">
                          {item.date}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Inspirational Mountain Quote Card */}
            <div className="rounded-xl overflow-hidden relative border border-white/[0.08] min-h-[170px] flex flex-col justify-between p-5 bg-[#0E1217]">
              {/* Background Mountain Image */}
              <img
                src="/images/dashboard/mountain-quote.jpg"
                alt="Night mountain peaks"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none opacity-60"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60 pointer-events-none" />

              {/* Quote Content */}
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <p className="text-white text-xs sm:text-sm font-medium tracking-wide leading-relaxed font-sans">
                    &ldquo;Most great developers<br />
                    were once bad at interviews.<br />
                    They just didn&apos;t stop.&rdquo;
                  </p>
                  <div className="w-8 h-0.5 bg-primary my-2.5 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewPage;
