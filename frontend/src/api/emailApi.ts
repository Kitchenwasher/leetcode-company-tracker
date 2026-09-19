import { api } from './client';

export const emailApi = {
  sendTestEmail: async (email: string): Promise<{ success: boolean; message: string; recipient: string }> => {
    const res = await api.post('/mail/test', { email });
    return res.data;
  },

  resendVerification: async (): Promise<{ message: string }> => {
    const res = await api.post('/mail/resend-verification');
    return res.data;
  },
};
