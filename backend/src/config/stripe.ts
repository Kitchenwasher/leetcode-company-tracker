import Stripe from 'stripe';
import { ENV } from './env.js';

export const stripe = ENV.STRIPE_SECRET_KEY
  ? new Stripe(ENV.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })
  : null;

export const isStripeMockMode = ENV.STRIPE_MOCK_MODE || !ENV.STRIPE_SECRET_KEY;
