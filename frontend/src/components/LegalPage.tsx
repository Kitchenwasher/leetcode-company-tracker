import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, FileText, Lock, Eye, CheckCircle2 } from 'lucide-react';

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

        <button
          onClick={() => navigate('/')}
          className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors cursor-pointer"
        >
          Home
        </button>
      </header>

      {/* Main Document Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {type === 'privacy' ? (
          <article className="space-y-8">
            <div className="space-y-3 border-b border-white/[0.08] pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>GDPR &amp; AdSense Compliant</span>
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
                At <strong>Cheat Code</strong> ("we", "us", or "our"), accessible from our website, the privacy of our visitors and students is of paramount importance. This Privacy Policy document outlines the types of personal and technical information that is recorded and collected by Cheat Code, and how we use and protect it.
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

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>2. Information We Collect</span>
              </h2>
              <p>
                When you create an account or practice on Cheat Code, we collect the minimum necessary data to synchronize your progress:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
                <li>Account details (name, email address, hashed credentials, or OAuth token).</li>
                <li>Practice telemetry (solved questions, daily streaks, mock interview scores).</li>
                <li>Technical logs (browser type, timestamp, IP address for security & rate limiting).</li>
              </ul>

              <h2 className="text-xl font-bold text-white pt-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>3. How We Use Your Information</span>
              </h2>
              <p>
                The information we collect is used solely to provide, operate, and maintain our interview preparation features, analyze student usage patterns to index relevant interview questions, and prevent malicious access. We never sell your personal data to third parties.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                4. Contact Information
              </h2>
              <p>
                If you have questions about our Privacy Policy or wish to request data deletion, contact our administrative team at{' '}
                <span className="text-primary font-mono">support@cheatcode.dev</span>.
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
                1. Educational Use &amp; Helping Tool
              </h2>
              <p>
                Cheat Code is an educational and preparation tool designed to help students, developers, and engineers practice coding and prepare for technical interviews at technology companies. All question patterns are indexed from publicly reported interview candidate experiences.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                2. User Accounts &amp; Conduct
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree not to abuse, reverse engineer, or launch automated scraping against our application servers.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                3. Third-Party Services &amp; Advertising
              </h2>
              <p>
                Our platform displays third-party advertisements served by Google AdSense to support the free tier. We are not responsible for the content or products of external advertiser websites.
              </p>

              <h2 className="text-xl font-bold text-white pt-4">
                4. Contact &amp; Governance
              </h2>
              <p>
                For questions regarding these Terms, contact our team at{' '}
                <span className="text-primary font-mono">legal@cheatcode.dev</span>.
              </p>
            </section>
          </article>
        )}
      </main>
    </div>
  );
};

export default LegalPage;
