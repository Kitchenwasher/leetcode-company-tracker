import { api, setStoredAccessToken } from './client';
import { User } from '../types/auth';

export interface AuthResponse {
  user: User;
  accessToken: string;
  message?: string;
}

export const authApi = {
  login: async (email: string, password?: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setStoredAccessToken(res.data.accessToken);
    return res.data;
  },

  register: async (
    name: string,
    email: string,
    password?: string,
    targetCompany: string = 'google'
  ): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      targetCompany,
    });
    setStoredAccessToken(res.data.accessToken);
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
    }
  },

  updateProfile: async (patch: Partial<User>): Promise<{ user: User }> => {
    const res = await api.put<{ user: User }>('/auth/profile', patch);
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
