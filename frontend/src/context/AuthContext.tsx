import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserTier } from '../types/auth';
import { authApi } from '../api/authApi';
import { paymentApi } from '../api/paymentApi';
import { api, getStoredAccessToken, setStoredAccessToken } from '../api/client';

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isPro: boolean;
  usersList: User[];
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string, targetCompany?: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  upgradeToPro: (planId?: string) => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user_alex_pro',
    name: 'Alex Chen',
    email: 'alex@faangprep.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tier: 'pro',
    leetcodeUsername: 'alex_faang',
    targetCompany: 'google',
    targetDate: '2026-10-15',
    dailyTarget: 4,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'user_sarah_free',
    name: 'Sarah Lin',
    email: 'sarah@coder.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    tier: 'free',
    leetcodeUsername: 'sarah_codes',
    targetCompany: 'meta',
    targetDate: '2026-11-01',
    dailyTarget: 2,
    createdAt: '2026-08-15T00:00:00.000Z',
  },
];

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Explorer',
  email: 'guest@leettracker.io',
  tier: 'free',
  leetcodeUsername: '',
  targetCompany: 'google',
  dailyTarget: 3,
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0] || GUEST_USER);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  // Restore session on initial mount
  useEffect(() => {
    const restoreSession = async () => {
      // 1. Try stored access token
      const token = getStoredAccessToken();
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.user) {
            setCurrentUser(res.user);
            return;
          }
        } catch {
          // Token expired or invalid, fall through to refresh
        }
      }

      // 2. Attempt silent refresh using HttpOnly cookie
      try {
        const { data } = await api.post<{ accessToken: string; user: User }>('/auth/refresh');
        if (data?.accessToken && data?.user) {
          setStoredAccessToken(data.accessToken);
          setCurrentUser(data.user);
          return;
        }
      } catch {
        // No active refresh session
      }

      // 3. Fallback for client-side demo account persistence
      const savedUserId = localStorage.getItem('srmcode_current_user_id');
      if (savedUserId) {
        const found = usersList.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        }
      }
    };
    restoreSession();
  }, [usersList]);

  // Persist current active user ID for client-side refresh resilience
  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      localStorage.setItem('srmcode_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('srmcode_current_user_id');
    }
  }, [currentUser]);

  const login = async (email: string, password: string = 'password123'): Promise<boolean> => {
    try {
      const res = await authApi.login(email, password);
      if (res?.user) {
        setCurrentUser(res.user);
        setShowAuthModal(false);
        return true;
      }
    } catch {
      // Fallback for client-side demo accounts
      const existing = usersList.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        setCurrentUser(existing);
        setShowAuthModal(false);
        return true;
      }
    }
    return false;
  };

  const signup = async (
    name: string,
    email: string,
    password: string = 'password123',
    targetCompany: string = 'google'
  ): Promise<boolean> => {
    try {
      const res = await authApi.register(name, email, password, targetCompany);
      if (res?.user) {
        setCurrentUser(res.user);
        setShowAuthModal(false);
        return true;
      }
    } catch {
      // Fallback creation
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: name.trim() || 'New Developer',
        email: email.trim().toLowerCase(),
        tier: 'free',
        targetCompany,
        dailyTarget: 3,
        createdAt: new Date().toISOString(),
      };
      setUsersList((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setShowAuthModal(false);
      return true;
    }
    return false;
  };

  const loginAsGuest = () => {
    localStorage.removeItem('srmcode_current_user_id');
    setStoredAccessToken(null);
    setCurrentUser(GUEST_USER);
    setShowAuthModal(false);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('srmcode_current_user_id');
    setStoredAccessToken(null);
    setCurrentUser(GUEST_USER);
  };

  const switchUser = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('srmcode_current_user_id', target.id);
      // Attempt backend login for demo accounts
      authApi.login(target.email, 'password123').catch(() => {});
    }
  };

  const upgradeToPro = async (planId: string = 'pro_monthly') => {
    try {
      const { url } = await paymentApi.createCheckoutSession(planId);
      if (url) {
        // If mock session, update user state directly
        if (url.includes('mock=')) {
          const updated: User = { ...currentUser, tier: 'pro' as UserTier };
          setCurrentUser(updated);
        } else {
          window.location.href = url;
        }
      }
    } catch {
      // Fallback local upgrade
      const updated: User = { ...currentUser, tier: 'pro' as UserTier };
      setCurrentUser(updated);
    }
    setShowSubscriptionModal(false);
  };

  const updateProfile = async (patch: Partial<User>) => {
    try {
      const res = await authApi.updateProfile(patch);
      if (res?.user) {
        setCurrentUser(res.user);
        return;
      }
    } catch {}
    // Fallback local update
    const updated: User = { ...currentUser, ...patch };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const isPro = currentUser.tier === 'pro' || currentUser.tier === 'enterprise';
  const isAuthenticated = currentUser.id !== 'guest';

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        isPro,
        usersList,
        login,
        signup,
        loginAsGuest,
        logout,
        switchUser,
        upgradeToPro,
        updateProfile,
        showAuthModal,
        setShowAuthModal,
        showSubscriptionModal,
        setShowSubscriptionModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
