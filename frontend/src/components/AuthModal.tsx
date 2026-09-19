import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Mail, Lock, User as UserIcon, Sparkles, ShieldCheck, CheckCircle2,
  ArrowRight, Globe, Code2, LogIn, UserPlus
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
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
      setShowAuthModal(false);
      onSuccess?.();
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
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-md terminal-panel shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="p-3 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-bold text-primary text-xs uppercase tracking-wider">
              &gt; AUTH_TERMINAL.sys
            </h3>
          </div>
          <button
            onClick={() => setShowAuthModal(false)}
            className="px-2 py-0.5 rounded-[2px] bg-surfaceElevated hover:bg-border text-textMuted hover:text-primary text-xs font-mono"
          >
            [ESC]
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-base font-bold text-primary uppercase tracking-wide">
              &gt; {tab === 'signin' ? 'AUTHENTICATE_SESSION' : 'REGISTER_NEW_OPERATOR'}
            </h2>
            <p className="text-[11px] text-textMuted mt-1">
              Sync problem states, interview simulations, and prep telemetry
            </p>
          </div>

          {/* Quick Demo Logins Banner */}
          <div className="mb-4 p-2.5 rounded-[2px] bg-surface border border-border">
            <div className="flex items-center justify-between text-[11px] font-bold text-textMuted uppercase mb-2">
              <span className="flex items-center gap-1.5 text-textSecondary">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                &gt; DEMO_ACCOUNTS (1-CLICK):
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('user_alex_pro')}
                className="flex items-center gap-2 p-2 rounded-[2px] bg-surfaceElevated hover:bg-border border border-border hover:border-primary text-left transition-all group"
              >
                <div className="w-6 h-6 rounded-[2px] bg-primary text-black flex items-center justify-center text-[10px] font-bold font-mono">
                  AC
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-textPrimary group-hover:text-primary truncate">
                    Alex Chen
                  </div>
                  <div className="text-[9px] text-primary font-bold uppercase tracking-wider">
                    [PRO_ACCOUNT]
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('user_sarah_free')}
                className="flex items-center gap-2 p-2 rounded-[2px] bg-surfaceElevated hover:bg-border border border-border hover:border-textMuted text-left transition-all group"
              >
                <div className="w-6 h-6 rounded-[2px] bg-border text-textSecondary flex items-center justify-center text-[10px] font-bold font-mono">
                  SL
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-textPrimary group-hover:text-textSecondary truncate">
                    Sarah Lin
                  </div>
                  <div className="text-[9px] text-textMuted font-bold uppercase tracking-wider">
                    [FREE_TIER]
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-[2px] bg-surface p-1 border border-border mb-4">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-1 text-xs font-bold rounded-[2px] transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signin'
                  ? 'bg-primary text-black shadow-terminal-glow'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              [ SIGN_IN ]
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-1 text-xs font-bold rounded-[2px] transition-all flex items-center justify-center gap-1.5 ${
                tab === 'signup'
                  ? 'bg-primary text-black shadow-terminal-glow'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              [ REGISTER ]
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2 rounded-[2px] bg-error/15 border border-error/40 text-error text-xs font-mono font-bold">
                &gt; ERROR: {error}
              </div>
            )}

            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">&gt; OPERATOR_NAME</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive focus:ring-1 focus:ring-borderActive"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">&gt; EMAIL_ADDRESS</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@company.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive focus:ring-1 focus:ring-borderActive"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-textMuted uppercase">&gt; PASSWORD</label>
                {tab === 'signin' && (
                  <span className="text-[10px] text-primaryDim hover:underline cursor-pointer">
                    [RECOVER]
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-12 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive focus:ring-1 focus:ring-borderActive"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[10px] font-mono text-textMuted hover:text-primary"
                >
                  {showPassword ? '[HIDE]' : '[SHOW]'}
                </button>
              </div>
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">&gt; TARGET_COMPANY</label>
                <select
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary focus:outline-none focus:border-borderActive"
                >
                  <option value="google">GOOGLE</option>
                  <option value="meta">META</option>
                  <option value="amazon">AMAZON</option>
                  <option value="microsoft">MICROSOFT</option>
                  <option value="apple">APPLE</option>
                  <option value="uber">UBER</option>
                  <option value="bloomberg">BLOOMBERG</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2 px-4 rounded-[2px] bg-primary hover:bg-primaryHover text-black text-xs font-bold font-mono shadow-terminal-glow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{tab === 'signin' ? '[ EXECUTE_LOGIN ]' : '[ EXECUTE_REGISTRATION ]'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Social Logins */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-surface px-2 text-textMuted font-mono">
                // OAUTH_BRIDGES
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                sounds.playSuccess();
                await login('google.user@gmail.com');
                setShowAuthModal(false);
                onSuccess?.();
              }}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-[2px] bg-surfaceElevated hover:bg-border border border-border hover:border-primaryDim text-xs font-bold font-mono text-textPrimary hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-medium" />
              <span>[ GOOGLE ]</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                sounds.playSuccess();
                await login('github.coder@github.com');
                setShowAuthModal(false);
                onSuccess?.();
              }}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-[2px] bg-surfaceElevated hover:bg-border border border-border hover:border-primaryDim text-xs font-bold font-mono text-textPrimary hover:text-primary transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-textPrimary" />
              <span>[ GITHUB ]</span>
            </button>
          </div>

          {/* Guest Explorer */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={loginAsGuest}
              className="text-xs text-textMuted hover:text-primary font-mono transition-colors"
            >
              &gt; CONTINUE_AS_GUEST_EXPLORER →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
