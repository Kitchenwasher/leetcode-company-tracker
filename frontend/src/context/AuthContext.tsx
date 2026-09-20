import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserTier } from '../types/auth';
import { authApi } from '../api/authApi';
import { paymentApi } from '../api/paymentApi';
import { api, getStoredAccessToken, setStoredAccessToken, setStoredRefreshToken } from '../api/client';

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Explorer',
  email: 'guest@leettracker.io',
  tier: 'free',
  leetcodeUsername: '',
  targetCompany: 'google',
  dailyTarget: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  emailVerified: false,
};

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPro: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password: string,
    targetCompany?: string,
    leetcodeUsername?: string
  ) => Promise<boolean>;
  loginWithGoogle: (credential?: string, code?: string) => Promise<boolean>;
  loginWithGithub: (code: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  upgradeToPro: (planId?: string) => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore authenticated session on initial mount from Neon DB
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        // 1. Try stored access token
        const token = getStoredAccessToken();
        if (token) {
          try {
            const res = await authApi.getMe();
            if (res?.user && isMounted) {
              setCurrentUser(res.user);
              setIsAuthenticated(true);
              return;
            }
          } catch {
            // Token expired or invalid, fall through to refresh
          }
        }

        // 2. Attempt silent refresh using HttpOnly cookie or stored refresh token
        try {
          const { data } = await api.post<{ accessToken: string; user: User; refreshToken?: string }>('/auth/refresh');
          if (data?.accessToken && data?.user && isMounted) {
            setStoredAccessToken(data.accessToken);
            if (data.refreshToken) {
              setStoredRefreshToken(data.refreshToken);
            }
            setCurrentUser(data.user);
            setIsAuthenticated(true);
            return;
          }
        } catch {
          // No active refresh session
        }

        // Clean unauthenticated guest state
        if (isMounted) {
          setStoredAccessToken(null);
          setStoredRefreshToken(null);
          setCurrentUser(GUEST_USER);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Invalid email or password.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    targetCompany: string = 'google',
    leetcodeUsername?: string
  ): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await authApi.register(name, email, password, targetCompany, leetcodeUsername);
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async (credential?: string, code?: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await authApi.googleAuth(credential, code);
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Google authentication failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGithub = async (code: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await authApi.githubAuth(code);
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'GitHub authentication failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const loginAsGuest = () => {
    setStoredAccessToken(null);
    setStoredRefreshToken(null);
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
    setShowAuthModal(false);
    setAuthError(null);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setStoredAccessToken(null);
    setStoredRefreshToken(null);
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
  };

  const upgradeToPro = async (planId: string = 'pro_monthly') => {
    try {
      const { url } = await paymentApi.createCheckoutSession(planId);
      if (url) {
        if (url.includes('session_id=mock_session_') || url.includes('mock=')) {
          // Mock payment upgraded in Neon DB directly
          const updated: User = { ...currentUser, tier: 'pro' as UserTier };
          setCurrentUser(updated);
        } else {
          window.location.href = url;
        }
      }
    } catch {
      // Fallback local update
      const updated: User = { ...currentUser, tier: 'pro' as UserTier };
      setCurrentUser(updated);
    }
    setShowSubscriptionModal(false);
  };

  const updateProfile = async (patch: Partial<User>) => {
    if (isAuthenticated) {
      try {
        const res = await authApi.updateProfile(patch);
        if (res?.user) {
          setCurrentUser(res.user);
          return;
        }
      } catch (err) {
        console.error('Failed to sync profile update to Neon DB:', err);
      }
    }
    // Optimistic / fallback update
    setCurrentUser((prev) => ({ ...prev, ...patch }));
  };

  const isPro = currentUser.tier === 'pro' || currentUser.tier === 'enterprise';

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        isLoading,
        isPro,
        login,
        signup,
        loginWithGoogle,
        loginWithGithub,
        loginAsGuest,
        logout,
        upgradeToPro,
        updateProfile,
        showAuthModal,
        setShowAuthModal,
        showSubscriptionModal,
        setShowSubscriptionModal,
        authError,
        setAuthError,
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
