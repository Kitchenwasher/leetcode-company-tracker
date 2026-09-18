import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserTier } from '../types/auth';

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
  upgradeToPro: () => void;
  updateProfile: (patch: Partial<User>) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
}

const SAAS_USERS_KEY = 'leettracker_saas_registered_users_v1';
const CURRENT_USER_ID_KEY = 'leettracker_saas_active_user_id_v1';

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
  }
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
  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const raw = localStorage.getItem(SAAS_USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const activeId = localStorage.getItem(CURRENT_USER_ID_KEY);
      if (activeId) {
        const found = usersList.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Error loading current user:', e);
    }
    return usersList[0] || GUEST_USER;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  // Sync users list to local storage
  useEffect(() => {
    try {
      localStorage.setItem(SAAS_USERS_KEY, JSON.stringify(usersList));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }, [usersList]);

  // Sync active user id
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_USER_ID_KEY, currentUser.id);
    } catch (e) {
      console.error('Error saving active user ID:', e);
    }
  }, [currentUser]);

  const login = async (email: string, _password?: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    const existing = usersList.find(u => u.email.toLowerCase() === trimmed);
    if (existing) {
      setCurrentUser(existing);
      setShowAuthModal(false);
      return true;
    }
    // If not found, auto-create account for seamless SaaS onboarding
    const namePart = trimmed.split('@')[0];
    const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: capitalizedName,
      email: trimmed,
      tier: 'free',
      targetCompany: 'google',
      dailyTarget: 3,
      createdAt: new Date().toISOString(),
    };
    setUsersList(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setShowAuthModal(false);
    return true;
  };

  const signup = async (name: string, email: string, _password?: string, targetCompany: string = 'google'): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    const existing = usersList.find(u => u.email.toLowerCase() === trimmed);
    if (existing) {
      setCurrentUser(existing);
      setShowAuthModal(false);
      return true;
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim() || 'New Developer',
      email: trimmed,
      tier: 'free',
      targetCompany,
      dailyTarget: 3,
      createdAt: new Date().toISOString(),
    };
    setUsersList(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setShowAuthModal(false);
    return true;
  };

  const loginAsGuest = () => {
    setCurrentUser(GUEST_USER);
    setShowAuthModal(false);
  };

  const logout = () => {
    setCurrentUser(GUEST_USER);
  };

  const switchUser = (userId: string) => {
    const target = usersList.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const upgradeToPro = () => {
    const updated: User = { ...currentUser, tier: 'pro' as UserTier };
    setCurrentUser(updated);
    setUsersList(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    setShowSubscriptionModal(false);
  };

  const updateProfile = (patch: Partial<User>) => {
    const updated: User = { ...currentUser, ...patch };
    setCurrentUser(updated);
    setUsersList(prev => prev.map(u => (u.id === updated.id ? updated : u)));
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
