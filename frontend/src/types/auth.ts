export type UserTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  tier: UserTier;
  subscriptionStatus?: string | null;
  plan?: string | null;
  daysRemaining?: number | null;
  leetcodeUsername?: string;
  targetCompany?: string;
  targetDate?: string;
  createdAt: string;
  dailyTarget?: number;
  emailVerified?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceLifetime: number;
  badge?: string;
  features: string[];
}

export interface WhiteboardDrawing {
  questionId: string | number;
  dataUrl: string;
  updatedAt: string;
}
