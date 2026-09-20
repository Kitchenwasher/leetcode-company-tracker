import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserTier } from '../types/auth';
import { authApi } from '../api/authApi';
import { paymentApi } from '../api/paymentApi';
import {
  api,
  getStoredAccessToken,
  setStoredAccessToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  getStoredUserProfile,
  setStoredUserProfile,
  isTokenValid,
} from '../api/client';

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
  // Fast Path (Industry Standard Optimistic Boot):
  // If a valid unexpired token and cached user profile exist in localStorage,
  // boot immediately into authenticated state with 0ms delay and no loading flash.
  const initialToken = getStoredAccessToken();
  const cachedUser = getStoredUserProfile<User>();
  const hasValidSession = Boolean(
    initialToken &&
    isTokenValid(initialToken) &&
    cachedUser &&
    cachedUser.id &&
    cachedUser.id !== 'guest'
  );

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (hasValidSession && cachedUser) {
      return cachedUser;
    }
    return GUEST_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasValidSession);

  // Loading is only true if we have stored credentials that need asynchronous resolution (e.g. refresh flow),
  // NEVER for already-cached valid sessions or unauthenticated guests!
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (hasValidSession) return false;
    const hasAnyToken = Boolean(initialToken || getStoredRefreshToken());
    return hasAnyToken;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Stale-While-Revalidate (SWR): Silently revalidate credentials against Neon DB in the background
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const token = getStoredAccessToken();

        // 1. If access token is valid, verify against Neon DB in the background
        if (token && isTokenValid(token)) {
          try {
            const res = await authApi.getMe();
            if (res?.user && isMounted) {
              setCurrentUser(res.user);
              setStoredUserProfile(res.user);
              setIsAuthenticated(true);
              return;
            }
          } catch {
            // Token rejected by backend or user deleted in DB -> fall through to refresh
          }
        }

        // 2. Attempt silent refresh using refresh token or cookie
        const refreshToken = getStoredRefreshToken();
        if (refreshToken || token) {
          try {
            const { data } = await api.post<{ accessToken: string; user: User; refreshToken?: string }>('/auth/refresh', {
              refreshToken: refreshToken || undefined,
            });
            if (data?.accessToken && data?.user && isMounted) {
              setStoredAccessToken(data.accessToken);
              if (data.refreshToken) {
                setStoredRefreshToken(data.refreshToken);
              }
              setStoredUserProfile(data.user);
              setCurrentUser(data.user);
              setIsAuthenticated(true);
              return;
            }
          } catch {
            // Refresh failed or revoked
          }
        }

        // Clean unauthenticated guest state
        if (isMounted) {
          setStoredAccessToken(null);
          setStoredRefreshToken(null);
          setStoredUserProfile(null);
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

  const formatAuthErrorMessage = (err: any, fallback: string): string => {
    if (err.response?.data?.error) return err.response.data.error;
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return 'Database connection timed out during cold start. Please retry in a moment.';
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Cannot connect to backend server. Please verify your connection.';
    }
    return err.message || fallback;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      if (res?.user) {
        setStoredUserProfile(res.user);
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = formatAuthErrorMessage(err, 'Invalid email or password.');
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
        setStoredUserProfile(res.user);
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
        setStoredUserProfile(res.user);
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
        setStoredUserProfile(res.user);
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
    setStoredUserProfile(null);
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
    setStoredUserProfile(null);
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
          setStoredUserProfile(updated);
          setCurrentUser(updated);
        } else {
          window.location.href = url;
        }
      }
    } catch {
      // Fallback local update
      const updated: User = { ...currentUser, tier: 'pro' as UserTier };
      setStoredUserProfile(updated);
      setCurrentUser(updated);
    }
    setShowSubscriptionModal(false);
  };

  const updateProfile = async (patch: Partial<User>) => {
    if (isAuthenticated) {
      try {
        const res = await authApi.updateProfile(patch);
        if (res?.user) {
          setStoredUserProfile(res.user);
          setCurrentUser(res.user);
          return;
        }
      } catch (err) {
        console.error('Failed to sync profile update to Neon DB:', err);
      }
    }
    // Optimistic / fallback update
    const updated = { ...currentUser, ...patch };
    setStoredUserProfile(updated);
    setCurrentUser(updated);
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
