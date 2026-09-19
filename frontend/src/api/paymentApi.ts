import { api } from './client';

export interface PlanInfo {
  id: string;
  name: string;
  amountCents: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const paymentApi = {
  getPlans: async (): Promise<{ plans: PlanInfo[] }> => {
    const res = await api.get<{ plans: PlanInfo[] }>('/payments/plans');
    return res.data;
  },

  createCheckoutSession: async (planId: string): Promise<{ url: string; isMock: boolean }> => {
    const res = await api.post<{ url: string; isMock: boolean }>('/payments/create-checkout-session', { planId });
    return res.data;
  },

  createPortalSession: async (): Promise<{ url: string }> => {
    const res = await api.post<{ url: string }>('/payments/create-portal-session');
    return res.data;
  },

  getStatus: async (): Promise<{
    tier: string;
    isPro: boolean;
    subscriptionStatus: string;
    payments: any[];
  }> => {
    const res = await api.get('/payments/status');
    return res.data;
  },
};
