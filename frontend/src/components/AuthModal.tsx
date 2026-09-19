import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Mail, Lock, User as UserIcon, Sparkles, ShieldCheck, CheckCircle2,
  ArrowRight, Globe, Code2, LogIn, UserPlus
} from 'lucide-react';
import { sounds } from '../utils/sound';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, login, signup, loginAsGuest, usersList, switchUser } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetCompany, setTargetCompany] = useState('google');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (tab === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'signin') {
        await login(email, password);
      } else {
        await signup(name, email, password, targetCompany);
      }
      sounds.playSuccess();
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (userId: string) => {
    sounds.playSuccess();
    switchUser(userId);
    setShowAuthModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/40 overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-amber-500/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {tab === 'signin' ? 'Welcome Back to LeetTracker' : 'Create Your SaaS Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sync your progress, notes, whiteboard drawings, and interview roadmap
            </p>
          </div>

          {/* Quick Demo Logins Banner */}
          <div className="mb-5 p-3 rounded-xl bg-slate-950/70 border border-indigo-500/20">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Quick 1-Click Demo Accounts:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('user_alex_pro')}
                className="flex items-center gap-2 p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-left transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                  AC
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-white group-hover:text-indigo-300 truncate">
                    Alex Chen
                  </div>
                  <div className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider">
                    PRO Account
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('user_sarah_free')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/50 text-left transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                  SL
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-white group-hover:text-indigo-300 truncate">
                    Sarah Lin
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                    Free Account
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                {tab === 'signin' && (
                  <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">
                    Forgot?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[10px] text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Dream Company</label>
                <select
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="google">Google</option>
                  <option value="meta">Meta</option>
                  <option value="amazon">Amazon</option>
                  <option value="microsoft">Microsoft</option>
                  <option value="apple">Apple</option>
                  <option value="uber">Uber</option>
                  <option value="bloomberg">Bloomberg</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{tab === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-semibold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                sounds.playSuccess();
                login('google.user@gmail.com');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playSuccess();
                login('github.coder@github.com');
              }}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-white" />
              <span>GitHub</span>
            </button>
          </div>

          {/* Guest Explorer */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={loginAsGuest}
              className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors"
            >
              Continue as Guest Explorer →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
