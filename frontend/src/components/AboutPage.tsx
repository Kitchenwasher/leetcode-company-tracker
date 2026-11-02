import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Brain,
  ShieldCheck,
  Target,
  Sparkles,
  Award,
  Globe2,
  Code2,
  BookOpen,
  Mail,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07090E] text-white font-sans selection:bg-purple-600/30 selection:text-purple-200">
      {/* Top Navigation */}
      <header className="border-b border-white/[0.08] bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-tight">Cheat Code</span>
          <span className="text-zinc-600">•</span>
          <span className="text-xs text-primary font-mono uppercase">About Us</span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors cursor-pointer"
        >
          Home
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        {/* Title Header */}
        <section className="space-y-4 border-b border-white/[0.08] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
            <Users className="w-3.5 h-3.5" />
            <span>Mission &amp; Publisher Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            About Cheat Code
          </h1>
          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
            An independent educational platform empowering software engineers, computer science students, and tech professionals to master technical interviews through data-backed question tracking and spaced repetition.
          </p>
        </section>

        {/* Founding Team & Transparency */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            <span>Founders &amp; Editorial Team</span>
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            Cheat Code was built and is actively maintained by <strong>Abhinav Sharma</strong> and <strong>Bismeet</strong>. Having navigated the demanding technical interview processes of top technology firms, our team experienced firsthand the friction of unstructured problem solving, outdated question banks, and forgetting previously solved algorithms.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">Abhinav Sharma</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Co-Founder &amp; Engineering Lead. Specializes in distributed systems, full-stack architecture, and technical interview algorithms.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Bismeet</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Co-Founder &amp; Product Architect. Dedicated to human-centric developer UX, active recall workflows, and educational data design.
              </p>
            </div>
          </div>
        </section>

        {/* Educational Philosophy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span>Our Educational Philosophy</span>
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            Rote memorization fails in real coding interviews. Modern engineering interviews test deep problem-solving intuition, time-space complexity optimization, and communication under pressure. Cheat Code is engineered around proven cognitive science principles:
          </p>
          <ul className="space-y-3 text-zinc-300 text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Active Recall &amp; Spaced Repetition (SRS):</strong> Automated review intervals (1 day, 3 days, 7 days, 30 days) to prevent memory decay and lock in data structure invariants.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Company-Specific Pattern Recognition:</strong> Tracking question frequency across 659 top technology companies (FAANG, Big Tech, FinTech, and Unicorns) so developers focus on high-yield patterns.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Simulated Mock Environment:</strong> Timed 25-minute and 45-minute countdown constraints to condition candidates to interview stress and articulate time complexity \(O(N)\) and space complexity \(O(1)\).
              </span>
            </li>
          </ul>
        </section>

        {/* Content Curation & Methodology */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Content Curation &amp; Editorial Standards</span>
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            Our catalog is continuously indexed from publicly reported candidate experiences, interview debriefs, and community feedback. Every question topic is categorized into standard algorithmic paradigms:
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              'Arrays & Hashing',
              'Two Pointers',
              'Sliding Window',
              'Stack & Queues',
              'Binary Search',
              'Linked Lists',
              'Trees & Binary Trees',
              'Tries',
              'Backtracking',
              'Graphs & BFS/DFS',
              'Dynamic Programming',
              'Greedy Algorithms',
              'Bit Manipulation',
              'Math & Geometry'
            ].map((topic) => (
              <span
                key={topic}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300"
              >
                {topic}
              </span>
            ))}
          </div>
        </section>

        {/* Legal & Trademark Disclaimer */}
        <section className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
              Independent Educational Platform &amp; Trademark Notice
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <strong>LeetCode</strong> is a registered trademark of LeetCode LLC. Company names, logos, and trademarks (such as Google, Meta, Apple, Amazon, Microsoft, Netflix, and others) are the property of their respective trademark holders. Cheat Code is an independent educational tool created by independent developers and is <strong>not affiliated with, endorsed by, sponsored by, or directly connected to LeetCode LLC</strong> or any of the technology companies listed.
          </p>
        </section>

        {/* Contact Us Callout */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Have questions, feedback, or corrections?</h3>
            <p className="text-xs text-zinc-400">
              Our engineering team responds promptly to all inquiries and curriculum suggestions.
            </p>
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Our Team</span>
          </button>
        </section>

        {/* Footer Navigation */}
        <footer className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
          <p>© 2026 Cheat Code. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AboutPage;
