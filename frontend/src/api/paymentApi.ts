import { api } from './client';

export interface PlanInfo {
  id: string;
  name: string;
  amountCents: number;
  currency: string;
  interval?: 'month' | 'year';
  description?: string;
  badge?: string;
  features?: string[];
  firstYearAmountCents?: number;
  renewalAmountCents?: number;
}

export interface BMCOffering {
  id: string;
  name: string;
  price: string;
  amount: number;
  description: string;
  paymentUrl: string;
}

export const paymentApi = {
  getPlans: async (): Promise<{
    plans: PlanInfo[];
    bmcCreatorPage?: string;
    currency?: string;
    offerings?: {
      annual: BMCOffering;
      monthly: BMCOffering;
    };
  }> => {
    const res = await api.get('/payments/plans');
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
    bmcCreatorPage?: string;
  }> => {
    const res = await api.get('/payments/status');
    return res.data;
  },

  verifyBMC: async (payerEmail?: string): Promise<{
    tier: string;
    isPro: boolean;
    message: string;
  }> => {
    const res = await api.post('/payments/bmc-verify', { payerEmail });
    return res.data;
  },
};
