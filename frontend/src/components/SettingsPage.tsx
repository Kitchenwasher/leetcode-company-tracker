import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Crown,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Target,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Code,
  ExternalLink
} from 'lucide-react';
import { Question, UserStoreState } from '../types';
import { useAuth } from '../context/AuthContext';
import { exportBackupJSON, exportQuestionsCSV } from '../services/storage';
import { sounds } from '../utils/sound';
import { paymentApi } from '../api/paymentApi';
import { ThemeToolkitCard } from './ThemeToolkit';

interface SettingsPageProps {
  store: UserStoreState;
  questions: Question[];
  onImportBackup: (imported: UserStoreState) => void;
  onResetProgress: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  store,
  questions,
  onImportBackup,
  onResetProgress,
}) => {
  const navigate = useNavigate();
  const { user, isPro, isAuthenticated, updateProfile, logout, setShowSubscriptionModal } = useAuth();

  const [name, setName] = useState(user.name || '');
  const [targetCompany, setTargetCompany] = useState(user.targetCompany || 'google');
  const [dailyTarget, setDailyTarget] = useState(user.dailyTarget || store.dailyGoal || 3);
  const [leetcodeUsername, setLeetcodeUsername] = useState(user.leetcodeUsername || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleOpenStripePortal = async () => {
    setIsOpeningPortal(true);
    sounds.playClick();
    try {
      const res = await paymentApi.createPortalSession();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('Failed to open Stripe portal:', err);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  useEffect(() => {
    setName(user.name || '');
    setTargetCompany(user.targetCompany || 'google');
    setDailyTarget(user.dailyTarget || store.dailyGoal || 3);
    setLeetcodeUsername(user.leetcodeUsername || '');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile({
        name,
        targetCompany,
        dailyTarget: Number(dailyTarget),
        leetcodeUsername: leetcodeUsername.trim() || undefined,
      });
      sounds.playSuccess();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.progress) {
          onImportBackup(parsed);
          sounds.playSuccess();
          alert('Progress snapshot successfully imported!');
        } else {
          alert('Invalid backup format: missing progress state.');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
      onResetProgress();
      sounds.playClick();
      alert('Progress has been reset.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 text-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-textSecondary tracking-wider uppercase">
            <Settings className="w-3 h-3 text-primary" />
            <span>Settings & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-sans">
            Account & Data Configuration
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Manage your developer profile, target interview companies, daily goals, and data backups.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>Profile configuration successfully saved!</span>
        </div>
      )}

      {/* Theme Accent Customization Toolkit */}
      <ThemeToolkitCard />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Profile & Account Settings (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Profile Form Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1217] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>User Profile</span>
              </span>
              <span className="text-xs font-mono text-textMuted uppercase">
                {isAuthenticated ? user.tier : 'Guest'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-textSecondary mb-1.5 font-medium">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12161E] border border-white/[0.08] focus:border-primary text-xs text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-textSecondary mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12161E]/50 border border-white/[0.05] text-xs text-textMuted cursor-not-allowed"
                />
                <span className="text-[11px] text-textMuted mt-1 block">
                  Email is linked to your authentication account.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textSecondary mb-1.5 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>Target Company</span>
                  </label>
                  <select
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12161E] border border-white/[0.08] focus:border-primary text-xs text-white outline-none transition-colors cursor-pointer capitalize"
                  >
                    <option value="google">Google</option>
                    <option value="meta">Meta</option>
                    <option value="amazon">Amazon</option>
                    <option value="microsoft">Microsoft</option>
                    <option value="uber">Uber</option>
                    <option value="apple">Apple</option>
                    <option value="netflix">Netflix</option>
                    <option value="bloomberg">Bloomberg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-textSecondary mb-1.5 font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span>Daily Goal (Questions)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12161E] border border-white/[0.08] focus:border-primary text-xs text-white outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-textSecondary mb-1.5 font-medium flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-primary" />
                  <span>LeetCode Profile Username (Synced to Neon DB)</span>
                </label>
                <input
                  type="text"
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="e.g. tour_guide"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12161E] border border-white/[0.08] focus:border-primary text-xs text-white outline-none transition-colors font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#D4ED00] text-black text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Tier & Subscription Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1217] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <span>Subscription &amp; Billing</span>
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isPro
                    ? 'bg-primary text-black'
                    : 'bg-white/[0.06] text-textSecondary border border-white/[0.08]'
                }`}
              >
                {isPro ? 'Pro Member' : 'Free Tier'}
              </span>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed">
              {isPro
                ? 'Your account has full Pro access to all 659 companies, unlimited mock interviews, and spaced repetition analytics.'
                : 'Free tier includes verified questions, company tagging, and local progress tracking.'}
            </p>

            {isPro ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  disabled={isOpeningPortal}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border border-white/[0.08]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <span>{isOpeningPortal ? 'Connecting to Stripe...' : 'Manage Subscription (Stripe Portal)'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-primary uppercase">Offer 1: Annual Special</span>
                    <p className="text-base font-bold text-white font-mono mt-0.5">₹2,000</p>
                    <p className="text-[11px] text-zinc-400">1st full year, then ₹299/mo</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Offer 2: Monthly</span>
                    <p className="text-base font-bold text-white font-mono mt-0.5">₹299</p>
                    <p className="text-[11px] text-zinc-400">per month, cancel anytime</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowSubscriptionModal(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-[#D4ED00] text-black text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer font-sans shadow-md shadow-primary/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro via Stripe</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Data Management & Backups (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Data Backup & Export Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1217] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <span>Backup &amp; Export</span>
              </span>
              <span className="text-xs text-textMuted font-mono">Private</span>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed">
              All progress is securely stored in your local browser. Export regular snapshots to protect your study streak.
            </p>

            <div className="space-y-3">
              {/* JSON Backup Download */}
              <button
                onClick={() => {
                  sounds.playClick();
                  exportBackupJSON(store);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#12161E] hover:bg-[#161B24] border border-white/[0.08] hover:border-primary/40 text-xs text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="font-semibold block text-white">Download JSON Backup</span>
                    <span className="text-[11px] text-textMuted">Save complete progress snapshot</span>
                  </div>
                </div>
              </button>

              {/* JSON Restore */}
              <label className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#12161E] hover:bg-[#161B24] border border-white/[0.08] hover:border-primary/40 text-xs text-white transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="font-semibold block text-white">Restore from JSON</span>
                    <span className="text-[11px] text-textMuted">Import previously saved snapshot</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              {/* CSV Export */}
              <button
                onClick={() => {
                  sounds.playClick();
                  exportQuestionsCSV(questions, store.progress, store.selectedCompany || 'google');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#12161E] hover:bg-[#161B24] border border-white/[0.08] hover:border-primary/40 text-xs text-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <span className="font-semibold block text-white">Export Questions CSV</span>
                    <span className="text-[11px] text-textMuted">Spreadsheet with notes &amp; status</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone: Reset & Sign Out */}
          <div className="rounded-2xl border border-rose-500/20 bg-[#0E1217] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/10 pb-3">
              <span className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Danger Zone</span>
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-xs text-rose-400 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">Reset All Progress Data</span>
                </div>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-xs text-textSecondary hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="font-semibold">Sign Out of Account</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
