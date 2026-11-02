import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  ShieldAlert,
  Send,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    sounds.playSuccess();
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    setFormSubmitted(true);
  };

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
          <span className="text-xs text-primary font-mono uppercase">Contact Us</span>
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
            <Mail className="w-3.5 h-3.5" />
            <span>Support &amp; Inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Contact Our Team
          </h1>
          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
            We value feedback, bug reports, and curriculum improvement proposals from our community. Reach out through our direct communication channels.
          </p>
        </section>

        {/* Contact Channel Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <button
                onClick={() => handleCopy('support@cheatcode.dev')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors p-1"
                title="Copy email"
              >
                {copied === 'support@cheatcode.dev' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <h3 className="text-lg font-semibold text-white">General &amp; Technical Support</h3>
            <p className="text-xs text-zinc-400">
              Assistance with account access, spaced repetition data, mock timers, and bug submissions.
            </p>
            <a
              href="mailto:support@cheatcode.dev"
              className="inline-block text-xs font-mono text-primary hover:underline font-semibold"
            >
              support@cheatcode.dev
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <button
                onClick={() => handleCopy('legal@cheatcode.dev')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors p-1"
                title="Copy email"
              >
                {copied === 'legal@cheatcode.dev' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <h3 className="text-lg font-semibold text-white">Legal, Privacy &amp; DMCA</h3>
            <p className="text-xs text-zinc-400">
              Inquiries regarding data rights, privacy preferences, terms of service, or copyright notices.
            </p>
            <a
              href="mailto:legal@cheatcode.dev"
              className="inline-block text-xs font-mono text-purple-400 hover:underline font-semibold"
            >
              legal@cheatcode.dev
            </a>
          </div>
        </section>

        {/* Operating Hours & Response SLA */}
        <section className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-4 text-xs text-zinc-400">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <span>
            <strong className="text-zinc-200">Response SLA:</strong> Our team reviews and replies to all support emails within <strong>24 to 48 business hours</strong> (Monday through Friday, excluding public holidays).
          </span>
        </section>

        {/* Interactive Contact Form */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Send Us a Direct Message</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Fill out the form below and we will get back to you directly via email.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-center space-y-3 py-10">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Message Received!</h3>
              <p className="text-xs text-zinc-300 max-w-md">
                Thank you for getting in touch. A member of our support team will review your message and reply to your provided email within 24–48 hours.
              </p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'general', message: '' });
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ada Lovelace"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F15] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Your Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ada@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F15] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Subject Category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F15] border border-white/10 text-white text-xs focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="general">General Inquiry &amp; Feedback</option>
                  <option value="bug">Bug Report / Data Discrepancy</option>
                  <option value="privacy">Privacy &amp; Data Deletion Request</option>
                  <option value="partnership">Partnership &amp; Academic Sponsorship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our engineering and educational team help you?"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F15] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-primary transition-colors resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </section>

        {/* Frequently Asked Questions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <h4 className="text-sm font-semibold text-white">How frequently is company interview data refreshed?</h4>
              <p className="text-xs text-zinc-400">
                Our frequency timeframes (30 Days Hot, 3 Months, 6 Months, 1 Year+) are updated continuously as new interview rounds and candidate experiences are compiled and verified.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <h4 className="text-sm font-semibold text-white">How does Cheat Code protect user data?</h4>
              <p className="text-xs text-zinc-400">
                We store user progress securely, provide full JSON data export and import options, and strictly adhere to GDPR, CCPA, and Google CMP privacy standards.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
          <p>© 2026 Cheat Code. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/about" className="hover:text-primary transition-colors">About Us</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ContactPage;
