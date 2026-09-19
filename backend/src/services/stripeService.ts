import { stripe, isStripeMockMode } from '../config/stripe.js';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { EmailService } from './emailService.js';

export interface PlanConfig {
  id: string;
  name: string;
  amountCents: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const PLANS: Record<string, PlanConfig> = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Candidate (Monthly)',
    amountCents: 900, // $9.00
    currency: 'usd',
    interval: 'month',
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Candidate (Annual Pass)',
    amountCents: 4900, // $49.00
    currency: 'usd',
    interval: 'year',
  },
  pro_lifetime: {
    id: 'pro_lifetime',
    name: 'Pro Candidate (Lifetime Access)',
    amountCents: 7900, // $79.00
    currency: 'usd',
  },
};

export class StripeService {
  static async createCheckoutSession(userId: string, planId: string): Promise<{ url: string; isMock: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const plan = PLANS[planId] || PLANS.pro_monthly;

    // Self-Hosting / Sandbox Mock Mode
    if (isStripeMockMode || !stripe) {
      console.log(`[PAYMENT MOCK] Instant upgrade for user ${user.email} to ${plan.name}`);
      
      // Upgrade user
      await prisma.user.update({
        where: { id: userId },
        data: {
          tier: 'pro',
          subscriptionStatus: 'active',
        },
      });

      // Record payment
      await prisma.payment.create({
        data: {
          userId,
          stripeSessionId: `mock_session_${Date.now()}`,
          amount: plan.amountCents,
          currency: plan.currency,
          status: 'succeeded',
          plan: plan.id,
        },
      });

      // Send email confirmation
      await EmailService.sendSubscriptionReceipt(
        user.email,
        user.name,
        plan.name,
        `$${(plan.amountCents / 100).toFixed(2)}`,
        user.id
      );

      return {
        url: `${ENV.FRONTEND_URL}/#/subscription-success?session_id=mock_${Date.now()}&plan=${plan.id}`,
        isMock: true,
      };
    }

    // Real Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `LeetTracker Pro - ${plan.name}`,
              description: 'Full access to 659 companies, C++ solutions, unlimited mocks, and whiteboard.',
            },
            unit_amount: plan.amountCents,
            recurring: plan.interval ? { interval: plan.interval } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: plan.interval ? 'subscription' : 'payment',
      success_url: `${ENV.FRONTEND_URL}/#/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancel_url: `${ENV.FRONTEND_URL}/#/pricing?canceled=true`,
    });

    if (!session.url) throw new Error('Failed to create Stripe checkout session');
    return { url: session.url, isMock: false };
  }

  static async createCustomerPortalSession(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      // In mock mode or if customer has no Stripe ID, return frontend subscription page
      return `${ENV.FRONTEND_URL}/#/pricing`;
    }

    if (!stripe) return `${ENV.FRONTEND_URL}/#/pricing`;

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${ENV.FRONTEND_URL}/#/`,
    });

    return portal.url;
  }

  static async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!stripe) return;

    const event = stripe.webhooks.constructEvent(rawBody, signature, ENV.STRIPE_WEBHOOK_SECRET);
    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId || 'pro_monthly';

        if (userId) {
          const user = await prisma.user.update({
            where: { id: userId },
            data: {
              tier: 'pro',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            },
          });

          await prisma.payment.create({
            data: {
              userId,
              stripeSessionId: session.id,
              amount: session.amount_total || 900,
              currency: session.currency || 'usd',
              status: 'succeeded',
              plan: planId,
            },
          });

          await EmailService.sendSubscriptionReceipt(
            user.email,
            user.name,
            PLANS[planId]?.name || 'Pro Candidate',
            `$${((session.amount_total || 900) / 100).toFixed(2)}`,
            user.id
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              tier: 'free',
              subscriptionStatus: 'canceled',
            },
          });
          console.log(`[STRIPE WEBHOOK] Subscription cancelled for customer ${customerId}`);
        }
        break;
      }
    }
  }
}
