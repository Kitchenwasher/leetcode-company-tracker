import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import {
  X, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2,
  ArrowRight, Globe, Code2, LogIn, UserPlus, AlertCircle, Info
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface AuthModalProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const {
    showAuthModal,
    setShowAuthModal,
    login,
    signup,
    loginWithGoogle,
    authError,
    setAuthError,
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetCompany, setTargetCompany] = useState('google');
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isGithubConfigured, setIsGithubConfigured] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Fetch public OAuth configurations on mount
  useEffect(() => {
    if (!showAuthModal) return;

    authApi.getOAuthConfig()
      .then((cfg) => {
        setGoogleClientId(cfg.googleClientId);
        setIsGithubConfigured(cfg.githubConfigured);
      })
      .catch(() => {
        // Fallback to vite env if available
        const viteGoogleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (viteGoogleId) setGoogleClientId(viteGoogleId);
      });
  }, [showAuthModal]);

  // Load Google Identity Services SDK
  useEffect(() => {
    if (!showAuthModal || !googleClientId) return;

    const loadGsi = () => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        return;
      }

      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initializeGoogleSignIn();
        document.body.appendChild(script);
      } else {
        existingScript.onload = () => initializeGoogleSignIn();
      }
    };

    const initializeGoogleSignIn = () => {
      try {
        if (!window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setIsSubmitting(true);
              setLocalError(null);
              try {
                await loginWithGoogle(response.credential);
                sounds.playSuccess();
                setShowAuthModal(false);
                onSuccess?.();
              } catch (err: any) {
                setLocalError(err.message || 'Google authentication failed.');
              } finally {
                setIsSubmitting(false);
              }
            }
          },
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'filled_black',
            size: 'medium',
            text: 'continue_with',
            shape: 'rectangular',
            width: 180,
          });
        }
      } catch (err) {
        console.error('Failed to init Google Identity Services:', err);
      }
    };

    loadGsi();
  }, [showAuthModal, googleClientId]);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (tab === 'signup' && !name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'signin') {
        await login(email.trim(), password);
      } else {
        await signup(
          name.trim(),
          email.trim(),
          password,
          targetCompany,
          leetcodeUsername.trim() || undefined
        );
      }
      sounds.playSuccess();
      setShowAuthModal(false);
      onSuccess?.();
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleManualClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setInfoMessage(
        'Google OAuth: Add your GOOGLE_CLIENT_ID to backend/.env to enable 1-click Google Sign-In with Neon DB.'
      );
    }
  };

  const handleGithubClick = () => {
    if (isGithubConfigured) {
      // Redirect to GitHub OAuth
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID || ''}&scope=user:email`;
    } else {
      setInfoMessage(
        'GitHub OAuth: Setup ready! Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env when ready to enable.'
      );
    }
  };

  const displayError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-md terminal-panel shadow-2xl overflow-hidden border border-border">
        {/* Terminal Header */}
        <div className="p-3 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-bold text-primary text-xs uppercase tracking-wider">
              &gt; AUTH_TERMINAL.sys (Neon DB)
            </h3>
          </div>
          <button
            onClick={() => {
              setLocalError(null);
              setAuthError(null);
              setShowAuthModal(false);
            }}
            className="px-2 py-0.5 rounded-[2px] bg-surfaceElevated hover:bg-border text-textMuted hover:text-primary text-xs font-mono cursor-pointer"
          >
            [ESC]
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-base font-bold text-primary uppercase tracking-wide">
              &gt; {tab === 'signin' ? 'AUTHENTICATE_SESSION' : 'REGISTER_NEW_OPERATOR'}
            </h2>
            <p className="text-[11px] text-textMuted mt-1">
              Live Neon PostgreSQL account persistence & progress synchronization
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-[2px] bg-surface p-1 border border-border mb-4">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setLocalError(null);
                setAuthError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-1 text-xs font-bold rounded-[2px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              onClick={() => {
                setTab('signup');
                setLocalError(null);
                setAuthError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-1 text-xs font-bold rounded-[2px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'signup'
                  ? 'bg-primary text-black shadow-terminal-glow'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              [ REGISTER ]
            </button>
          </div>

          {/* Error Message Display */}
          {displayError && (
            <div className="mb-3 p-2.5 rounded-[2px] bg-error/15 border border-error/40 text-error text-xs font-mono font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>&gt; ERROR: {displayError}</span>
            </div>
          )}

          {/* Info Message Display */}
          {infoMessage && (
            <div className="mb-3 p-2.5 rounded-[2px] bg-primary/10 border border-primary/30 text-primary text-xs font-mono flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>&gt; {infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">
                  &gt; OPERATOR_NAME
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive focus:ring-1 focus:ring-borderActive"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">
                &gt; EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@domain.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive focus:ring-1 focus:ring-borderActive"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-textMuted uppercase">
                  &gt; PASSWORD {tab === 'signup' && '(MIN 8 CHARS)'}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-12 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive focus:ring-1 focus:ring-borderActive font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[10px] font-mono text-textMuted hover:text-primary cursor-pointer"
                >
                  {showPassword ? '[HIDE]' : '[SHOW]'}
                </button>
              </div>
            </div>

            {tab === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">
                      &gt; TARGET_COMPANY
                    </label>
                    <select
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary focus:outline-none focus:border-borderActive cursor-pointer"
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

                  <div>
                    <label className="block text-[11px] font-bold text-textMuted uppercase mb-1">
                      &gt; LEETCODE_ID (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={leetcodeUsername}
                      onChange={(e) => setLeetcodeUsername(e.target.value)}
                      placeholder="username"
                      className="w-full px-2.5 py-1.5 bg-background border border-border rounded-[2px] text-xs text-textPrimary placeholder-textMuted focus:outline-none focus:border-borderActive"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2 px-4 rounded-[2px] bg-primary hover:bg-primaryHover text-black text-xs font-bold font-mono shadow-terminal-glow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? '[ PROCESSING... ]' : tab === 'signin' ? '[ EXECUTE_LOGIN ]' : '[ EXECUTE_REGISTRATION ]'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Social Authentication Bridges */}
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

          <div className="space-y-2">
            {/* Google Sign-In Button */}
            <div className="flex flex-col items-center justify-center">
              {googleClientId ? (
                <div ref={googleButtonRef} className="w-full flex justify-center min-h-[38px]" />
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleManualClick}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[2px] bg-surfaceElevated hover:bg-border border border-border hover:border-primaryDim text-xs font-bold font-mono text-textPrimary hover:text-primary transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-medium" />
                  <span>[ SIGN_IN_WITH_GOOGLE ]</span>
                </button>
              )}
            </div>

            {/* GitHub Button (Architecture Ready) */}
            <button
              type="button"
              onClick={handleGithubClick}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[2px] bg-surfaceElevated hover:bg-border border border-border hover:border-primaryDim text-xs font-bold font-mono text-textSecondary hover:text-white transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-textPrimary" />
              <span>[ GITHUB_OAUTH ]</span>
              {!isGithubConfigured && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-surface border border-border text-textMuted">
                  SOON
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
