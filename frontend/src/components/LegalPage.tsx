import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, FileText, Lock, Eye, CheckCircle2, AlertTriangle, Users, Mail } from 'lucide-react';
import { openGoogleConsentSettings } from '../utils/consent';

interface LegalPageProps {
  type: 'privacy' | 'terms';
}

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07090E] text-white font-sans selection:bg-purple-600/30 selection:text-purple-200">
      {/* Top Navbar */}
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
          <span className="text-xs text-primary font-mono uppercase">
            {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => navigate('/about')}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:inline-block"
          >
            About
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer hidden sm:inline-block"
          >
            Contact
          </button>
          <button
            onClick={() => navigate('/')}
            className="font-medium text-zinc-400 hover:text-primary transition-colors cursor-pointer"
          >
            Home
          </button>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {type === 'privacy' ? (
          <article className="space-y-8">
            <div className="space-y-3 border-b border-white/[0.08] pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>GDPR, CCPA &amp; Google AdSense Compliant</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                Last updated: September 2026 • Effective immediately
              </p>
            </div>

            <section className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
              <p>
                At <strong>Cheat Code</strong> ("we", "us", or "our"), accessible from our website, the privacy of our visitors and students is of paramount importance. This Privacy Policy document outlines the types of personal and technical information that is recorded and collected by Cheat Code, and how we use, protect, and process it in compliance with global standards including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA/CPRA).
              </p>

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <span>1. Google AdSense &amp; Third-Party Advertising Cookies</span>
              </h2>
              <p>
                We use <strong>Google AdSense</strong> to serve advertisements across our platform to keep verified company interview prep accessible to all students and engineers.
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
                <li>
                  <strong className="text-zinc-200">Third-party vendors</strong>, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites on the Internet.
                </li>
                <li>
                  Google's use of advertising cookies (such as the DoubleClick cookie) enables it and its partners to serve ads to our users based on their visit to Cheat Code and other sites across the Internet.
                </li>
                <li>
                  Users may opt out of personalized advertising at any time by visiting{' '}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Ads Settings
                  </a>
                  {' '}or by visiting{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    www.aboutads.info
                  </a>.
                </li>
              </ul>

              {/* EEA, UK & Switzerland Cookie Consent Management */}
              <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">EEA, UK &amp; Switzerland Cookie Consent</p>
                  <p className="text-[11px] text-zinc-400">
                    Review, modify, or revoke your advertising consent choices at any time via Google's certified CMP.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openGoogleConsentSettings}
                  className="px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Privacy &amp; Cookie Settings
                </button>
              </div>

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>2. Information We Collect</span>
              </h2>
              <p>
                When you create an account or practice on Cheat Code, we collect the minimum necessary data to synchronize your progress:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
                <li>Account details (name, email address, hashed credentials, or OAuth profile identifier).</li>
                <li>Practice telemetry (solved questions, daily streaks, spaced repetition review intervals, mock interview scores).</li>
                <li>Technical logs (browser type, timestamp, IP address for security rate limiting and fraud prevention).</li>
              </ul>

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>3. How We Use Your Information</span>
              </h2>
              <p>
                The information we collect is used solely to provide, operate, and maintain our interview preparation features, analyze user patterns to index relevant interview questions, and prevent malicious access. We never sell your personal data to third parties.
              </p>

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>4. GDPR &amp; CCPA Data Rights</span>
              </h2>
              <p>
                Under applicable global privacy laws, you possess the right to access, rectify, or request complete deletion of your personal account data at any time. To exercise these rights, please contact our privacy compliance team.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                5. Contact Information
              </h2>
              <p>
                If you have questions about our Privacy Policy or wish to request data deletion, contact our administrative team at{' '}
                <a href="mailto:support@cheatcode.dev" className="text-primary font-mono hover:underline">support@cheatcode.dev</a>{' '}
                or visit our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
              </p>
            </section>
          </article>
        ) : (
          <article className="space-y-8">
            <div className="space-y-3 border-b border-white/[0.08] pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
                <FileText className="w-3.5 h-3.5" />
                <span>User Agreement</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Terms of Service
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                Last updated: September 2026 • Version 2.4
              </p>
            </div>

            <section className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
              <p>
                Welcome to <strong>Cheat Code</strong>. By accessing or using our website, applications, or verified interview question tracker, you agree to be bound by these Terms of Service.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                1. Educational Purpose &amp; Platform Mission
              </h2>
              <p>
                Cheat Code is an educational and preparation platform designed to help students, developers, and engineers practice coding and prepare for technical interviews at technology companies. All question patterns and topic categories are compiled and categorized from publicly reported candidate experiences to assist in algorithmic mastery.
              </p>

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>2. Trademark &amp; Fair Use Disclaimer</span>
              </h2>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-zinc-300 space-y-2">
                <p>
                  <strong>LeetCode</strong> is a registered trademark of LeetCode LLC. Company names, logos, and trademarks (including Google, Meta, Amazon, Apple, Microsoft, Netflix, and others) are the property of their respective trademark owners.
                </p>
                <p>
                  Cheat Code is an independent preparation platform created by independent developers and is <strong>not endorsed by, directly affiliated with, maintained, authorized, or sponsored by LeetCode LLC</strong> or any of the technology companies listed on the platform. All references are made strictly for identification and fair-use educational guidance.
                </p>
              </div>

              <h2 className="text-xl font-bold text-white pt-4">
                3. User Accounts &amp; Conduct
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree not to abuse, reverse engineer, or launch automated scraping against our application servers.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                4. Third-Party Services &amp; Advertising
              </h2>
              <p>
                Our platform displays third-party advertisements served by Google AdSense to support the free tier. We are not responsible for the content, privacy practices, or products of external advertiser websites.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                5. Contact &amp; Governance
              </h2>
              <p>
                For questions regarding these Terms, contact our team at{' '}
                <a href="mailto:legal@cheatcode.dev" className="text-primary font-mono hover:underline">legal@cheatcode.dev</a>{' '}
                or visit our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
              </p>
            </section>
          </article>
        )}

        {/* Footer Navigation */}
        <footer className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
          <p>© 2026 Cheat Code. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/about" className="hover:text-primary transition-colors">About Us</a>
            <span>•</span>
            <a href="/contact" className="hover:text-primary transition-colors">Contact</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LegalPage;
