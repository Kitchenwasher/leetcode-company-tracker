import React, { useState } from 'react';
import { X, Send, Sparkles, MessageSquare, Briefcase, HelpCircle, DollarSign, Loader2 } from 'lucide-react';
import { sounds } from '../utils/sound';
import { communityApi, CommunityPost } from '../api/communityApi';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: (post: CommunityPost) => void;
}

const CATEGORIES = [
  { id: 'interview_experience', label: 'Interview Experience', icon: Briefcase },
  { id: 'question_help', label: 'Question Discussion', icon: HelpCircle },
  { id: 'general', label: 'General / Advice', icon: MessageSquare },
  { id: 'compensation', label: 'Compensation & Offers', icon: DollarSign },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const { isAuthenticated, user, setShowAuthModal } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'interview_experience' | 'question_help' | 'general' | 'compensation'>('general');
  const [companyId, setCompanyId] = useState('all');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Interview', 'Coding']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      sounds.playClick();
      const newPost = await communityApi.createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        companyId: (companyId && companyId !== 'all' && companyId !== 'general') ? companyId.toLowerCase() : undefined,
        tags,
        authorName: (!isAuthenticated && guestName.trim()) ? guestName.trim() : undefined,
      });

      sounds.playSuccess();
      onPostCreated(newPost);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-[#0E1217] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Community Discussion</h2>
              <p className="text-xs text-textSecondary mt-0.5">
                Share an interview breakdown, ask questions, or contribute study tips
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Author Attribution Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[11px]">
                {isAuthenticated ? (user.name?.charAt(0) || 'U') : 'G'}
              </div>
              <span className="text-zinc-300">
                Posting as: <strong className="text-white font-medium">{isAuthenticated ? user.name : (guestName.trim() || 'Community Engineer')}</strong>
              </span>
            </div>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <div className="space-y-1.5">
              <label className="text-xs text-textSecondary font-medium">Your Name / Handle (Optional)</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g., Alex Chen or Anonymous Dev"
                className="w-full bg-[#12161E] border border-white/[0.08] focus:border-primary rounded-xl px-4 py-2 text-xs text-white focus:outline-none placeholder:text-textMuted"
              />
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-textSecondary font-medium">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      sounds.playClick();
                      setCategory(c.id as any);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-primary font-semibold'
                        : 'bg-[#12161E] border-white/[0.06] text-textSecondary hover:text-white hover:border-white/15'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Company & Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-textSecondary font-medium">Related Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full bg-[#12161E] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">General / All Companies</option>
                <option value="google">Google</option>
                <option value="meta">Meta</option>
                <option value="amazon">Amazon</option>
                <option value="microsoft">Microsoft</option>
                <option value="apple">Apple</option>
                <option value="netflix">Netflix</option>
                <option value="uber">Uber</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs text-textSecondary font-medium">Post Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Google L4 Interview Loop (Passed) - Full Breakdown"
                className="w-full bg-[#12161E] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-textMuted"
                maxLength={120}
                required
              />
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-textSecondary font-medium">Discussion Content</label>
              <span className="text-[11px] text-textMuted">Markdown supported</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detail your rounds, algorithmic intuition, questions asked, or tips for other engineers..."
              rows={8}
              className="w-full bg-[#12161E] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-textMuted leading-relaxed resize-y font-mono"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs text-textSecondary font-medium">Tags (Max 5)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g., #Graph, #L4) and press enter"
                className="flex-1 bg-[#12161E] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/[0.04] text-textSecondary border border-white/[0.06]"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-textMuted hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Community</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
