import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  ListChecks, 
  BrainCircuit, 
  Timer, 
  LineChart, 
  Settings,
  Search
} from 'lucide-react';

// Static illustrative preview for marketing purposes — not the live app.
export const DeviceMockup: React.FC = () => {
  // 5 verified questions directly from leetcode_company_data.json
  const recentQuestions = [
    { id: 42, title: 'Trapping Rain Water', company: 'Google', time: '12 days ago', badge: 'G' },
    { id: 146, title: 'LRU Cache', company: 'Amazon', time: '18 days ago', badge: 'a' },
    { id: 76, title: 'Minimum Window Substring', company: 'Microsoft', time: '1 month ago', badge: '::' },
    { id: 23, title: 'Merge k Sorted Lists', company: 'Meta', time: '1 month ago', badge: 'f' },
    { id: 133, title: 'Clone Graph', company: 'Uber', time: '2 months ago', badge: 'U' },
  ];

  // 30-day activity density grid pattern (7 rows x 16 cols)
  const heatmapDensities = [
    [0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 0, 2, 1, 3, 2, 1],
    [1, 0, 3, 2, 1, 0, 2, 1, 0, 3, 2, 1, 0, 2, 3, 2],
    [0, 2, 1, 3, 0, 2, 1, 3, 2, 0, 1, 3, 2, 1, 0, 3],
    [2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 1, 0, 3, 2, 1, 2],
    [1, 0, 2, 1, 3, 0, 2, 1, 0, 2, 3, 1, 2, 0, 3, 1],
    [0, 1, 3, 0, 1, 2, 3, 0, 1, 2, 0, 3, 1, 2, 0, 2],
    [2, 0, 1, 2, 0, 3, 1, 2, 3, 1, 2, 0, 1, 3, 2, 3],
  ];

  const getHeatClass = (val: number) => {
    switch (val) {
      case 3:
        return 'bg-primary shadow-[0_0_4px_rgba(255,255,0,0.4)]';
      case 2:
        return 'bg-primaryDim/80';
      case 1:
        return 'bg-primaryDim/40';
      default:
        return 'bg-surfaceElevated border border-border/40';
    }
  };

  return (
    <div className="relative w-full mx-auto select-none font-mono">
      {/* Laptop Screen Bezel */}
      <div className="relative rounded-t-xl sm:rounded-t-2xl border border-border bg-[#0d0d0d] shadow-2xl p-2 sm:p-3 overflow-hidden">
        {/* Screen Top Bar / Bezel Notch / Camera */}
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] text-textMuted border-b border-border/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-border" />
            <span className="w-2 h-2 rounded-full bg-border" />
            <span className="w-2 h-2 rounded-full bg-border" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-[2px] bg-background border border-border text-[10px] text-textSecondary">
            <Search className="w-2.5 h-2.5 text-textMuted" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">cheatcode.sys // dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-bold text-[9px]">[ONLINE]</span>
          </div>
        </div>

        {/* Dashboard Content Interior */}
        <div className="bg-background rounded-lg border border-border/50 p-2 sm:p-4 text-textPrimary flex flex-col md:flex-row gap-3 min-h-[300px] sm:min-h-[360px]">
          {/* Mini Sidebar Nav */}
          <div className="hidden md:flex flex-col justify-between w-40 border-r border-border/60 pr-3 shrink-0">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-border/40">
                <span className="text-primary font-bold text-xs tracking-wider">&gt; CHEAT_CODE</span>
                <span className="text-[8px] font-bold px-1 py-0.2 bg-primary text-black rounded-[2px]">[PRO]</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] bg-primary text-black font-bold">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] text-textSecondary hover:text-primary">
                  <Building2 className="w-3.5 h-3.5 text-textMuted" />
                  <span>Companies</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] text-textSecondary hover:text-primary">
                  <ListChecks className="w-3.5 h-3.5 text-textMuted" />
                  <span>Questions</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] text-textSecondary hover:text-primary">
                  <BrainCircuit className="w-3.5 h-3.5 text-textMuted" />
                  <span>Practice</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] text-textSecondary hover:text-primary">
                  <Timer className="w-3.5 h-3.5 text-textMuted" />
                  <span>Mock Interview</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] text-textSecondary hover:text-primary">
                  <LineChart className="w-3.5 h-3.5 text-textMuted" />
                  <span>Progress</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-textMuted border-t border-border/40 pt-2">
              <Settings className="w-3 h-3" />
              <span>Settings</span>
            </div>
          </div>

          {/* Main Dashboard Panel */}
          <div className="flex-1 space-y-3 min-w-0">
            {/* Header Greeting */}
            <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-textPrimary flex items-center gap-1.5">
                  <span>Good to see you, Developer!</span>
                  <span className="text-sm">👋</span>
                </h3>
                <p className="text-[10px] text-textMuted font-mono">Keep going. Consistency compounds.</p>
              </div>
              <div className="px-2 py-0.5 rounded-[2px] bg-surfaceElevated border border-border text-[9px] text-primary font-bold">
                PRO_SESSION
              </div>
            </div>

            {/* 4 Verified Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-[2px] bg-surface border border-border">
                <div className="text-sm sm:text-base font-bold text-primary font-pixel">659</div>
                <div className="text-[9px] text-textSecondary font-semibold">Companies</div>
              </div>
              <div className="p-2 rounded-[2px] bg-surface border border-border">
                <div className="text-sm sm:text-base font-bold text-primary font-pixel">3,399</div>
                <div className="text-[9px] text-textSecondary font-semibold">Verified Qs</div>
              </div>
              <div className="p-2 rounded-[2px] bg-surface border border-border">
                <div className="text-sm sm:text-base font-bold text-primary font-pixel">5</div>
                <div className="text-[9px] text-textSecondary font-semibold">Recency Windows</div>
              </div>
              <div className="p-2 rounded-[2px] bg-surface border border-border">
                <div className="text-sm sm:text-base font-bold text-primary font-pixel">100%</div>
                <div className="text-[9px] text-textSecondary font-semibold">Community Open</div>
              </div>
            </div>

            {/* Split View: Recent Questions & Activity Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              {/* Recent Questions Table */}
              <div className="lg:col-span-7 p-2 sm:p-2.5 rounded-[2px] bg-surface border border-border space-y-1.5">
                <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wider flex items-center justify-between">
                  <span>&gt; RECENT_QUESTIONS</span>
                  <span className="text-[9px] text-textMuted">VERIFIED</span>
                </div>
                <div className="space-y-1">
                  {recentQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between text-[10px] p-1 rounded-[2px] bg-background/60 hover:bg-background border border-border/40 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 shrink-0 rounded-[2px] bg-surfaceElevated border border-border text-[9px] font-bold text-primary flex items-center justify-center">
                          {q.badge}
                        </span>
                        <span className="text-textPrimary font-semibold truncate max-w-[130px] sm:max-w-[170px]">
                          {q.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[9px] text-textMuted">
                        <span className="hidden sm:inline text-textSecondary">{q.company}</span>
                        <span>{q.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Heatmap Grid */}
              <div className="lg:col-span-5 p-2 sm:p-2.5 rounded-[2px] bg-surface border border-border flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-textSecondary uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>&gt; ACTIVITY (30_DAYS)</span>
                    <span className="text-[9px] text-primary font-bold">STREAK: 12d</span>
                  </div>
                  <div className="flex justify-center overflow-x-auto py-1">
                    <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                      {heatmapDensities.map((row, rIdx) =>
                        row.map((val, cIdx) => (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`w-2 h-2 rounded-[1px] ${getHeatClass(val)}`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/40 text-center text-[9px]">
                  <div>
                    <div className="font-bold text-primary">52</div>
                    <div className="text-textMuted text-[8px]">Questions</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary">12</div>
                    <div className="text-textMuted text-[8px]">Days Streak</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary">3h 24m</div>
                    <div className="text-textMuted text-[8px]">This Week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Laptop Keyboard Base & Hinge */}
      <div className="relative mx-auto w-full max-w-[96%] h-3 sm:h-4 bg-[#141414] rounded-b-xl sm:rounded-b-2xl border-x border-b border-border shadow-xl flex items-center justify-center">
        <div className="w-16 sm:w-24 h-1 rounded-full bg-[#2a2a2a]" />
      </div>
      {/* Laptop Shadow Beneath */}
      <div className="w-4/5 mx-auto h-2 bg-primary/5 blur-md rounded-full mt-1" />
    </div>
  );
};

export default DeviceMockup;
