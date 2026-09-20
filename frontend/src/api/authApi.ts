import { api, setStoredAccessToken, setStoredRefreshToken } from './client';
import { User } from '../types/auth';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  message?: string;
}

export interface OAuthConfig {
  googleClientId: string | null;
  githubConfigured: boolean;
}

export const authApi = {
  login: async (email: string, password?: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    if (res.data?.accessToken) {
      setStoredAccessToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      setStoredRefreshToken(res.data.refreshToken);
    }
    return res.data;
  },

  register: async (
    name: string,
    email: string,
    password?: string,
    targetCompany: string = 'google',
    leetcodeUsername?: string
  ): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      targetCompany,
      leetcodeUsername,
    });
    if (res.data?.accessToken) {
      setStoredAccessToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      setStoredRefreshToken(res.data.refreshToken);
    }
    return res.data;
  },

  googleAuth: async (credential?: string, code?: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/google', { credential, code });
    if (res.data?.accessToken) {
      setStoredAccessToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      setStoredRefreshToken(res.data.refreshToken);
    }
    return res.data;
  },

  githubAuth: async (code: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/github', { code });
    if (res.data?.accessToken) {
      setStoredAccessToken(res.data.accessToken);
    }
    if (res.data?.refreshToken) {
      setStoredRefreshToken(res.data.refreshToken);
    }
    return res.data;
  },

  getOAuthConfig: async (): Promise<OAuthConfig> => {
    const res = await api.get<OAuthConfig>('/auth/oauth-config');
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setStoredAccessToken(null);
      setStoredRefreshToken(null);
    }
  },

  updateProfile: async (patch: Partial<User>): Promise<{ user: User; message?: string }> => {
    const res = await api.put<{ user: User; message?: string }>('/auth/profile', patch);
    return res.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const res = await api.get<{ message: string }>(`/auth/verify-email?token=${token}`);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return res.data;
  },
};
