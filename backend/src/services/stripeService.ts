import { stripe, isStripeMockMode } from '../config/stripe.js';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { EmailService } from './emailService.js';

export interface PlanConfig {
  id: string;
  name: string;
  amountCents: number; // in smallest currency unit (paise for inr)
  currency: string;
  interval?: 'month' | 'year';
  firstYearAmountCents?: number;
  renewalAmountCents?: number;
  description: string;
  badge?: string;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Access Pass',
    amountCents: 200000, // ₹2,000 in paise
    currency: 'inr',
    description: 'Pay once, own forever. Full lifetime access with zero recurring fees.',
    badge: 'Best Value • Pay Once, Own Forever',
    features: [
      'Lifetime access to all 3,399 verified questions',
      'One-time payment of ₹2,000 with zero recurring fees',
      'High-frequency company question sorting for 659 companies',
      'Unlimited timed mock interview simulations & rubrics forever',
      'Spaced repetition memory queue & mastery retention',
      'Multi-language verified editorial solutions (C++, Python, Java)',
      'All future features and roadmap updates included',
    ],
  },
  monthly: {
    id: 'monthly',
    name: '1-Month Pro Membership',
    amountCents: 29900, // ₹299 in paise
    currency: 'inr',
    interval: 'month',
    description: '₹299 billed monthly. Full platform access with complete flexibility.',
    badge: 'Flexible Monthly',
    features: [
      'Full access to all 3,399 verified questions',
      'Billed monthly at ₹299/month',
      'Company interview frequency trends for 659 companies',
      'Unlimited timed mock interview simulations',
      'Spaced repetition memory queue & mastery retention',
      'Multi-language verified editorial solutions',
      'Cancel anytime with 1 click',
    ],
  },
};

// Aliases for backwards compatibility
PLANS.annual_special = PLANS.lifetime;
PLANS.pro_yearly = PLANS.lifetime;
PLANS.pro_lifetime = PLANS.lifetime;
PLANS.pro_monthly = PLANS.monthly;

export class StripeService {
  static async createCheckoutSession(userId: string, planId: string): Promise<{ url: string; isMock: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const plan = PLANS[planId] || PLANS.annual_special;

    // Self-Hosting / Sandbox Mock Mode
    if (isStripeMockMode || !stripe) {
      console.log(`[STRIPE GATEWAY] Running in mock/sandbox mode for ${user.email} -> ${plan.name}`);
      
      // Upgrade user in Neon database
      await prisma.user.update({
        where: { id: userId },
        data: {
          tier: 'pro',
          subscriptionStatus: 'active',
          stripeSubscriptionId: `mock_sub_${Date.now()}`,
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

      // Format currency receipt
      const formattedPrice = plan.currency === 'inr'
        ? `₹${(plan.amountCents / 100).toLocaleString('en-IN')}`
        : `$${(plan.amountCents / 100).toFixed(2)}`;

      // Send email confirmation
      try {
        await EmailService.sendSubscriptionReceipt(
          user.email,
          user.name,
          plan.name,
          formattedPrice,
          user.id
        );
      } catch (e) {
        console.warn('[EMAIL WARNING] Could not send mock receipt email:', e);
      }

      return {
        url: `${ENV.FRONTEND_URL}/#/subscription-success?session_id=mock_${Date.now()}&plan=${plan.id}`,
        isMock: true,
      };
    }

    // Real Stripe Checkout Session
    const sessionParams: any = {
      payment_method_types: ['card'],
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
              name: `Cheat Code Pro - ${plan.name}`,
              description: plan.description,
              metadata: {
                planId: plan.id,
              },
            },
            unit_amount: plan.amountCents,
            recurring: plan.interval ? { interval: plan.interval } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${ENV.FRONTEND_URL}/#/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancel_url: `${ENV.FRONTEND_URL}/#/settings?canceled=true`,
    };

    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) throw new Error('Failed to create Stripe checkout session');
    return { url: session.url, isMock: false };
  }

  static async createCustomerPortalSession(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId || !stripe) {
      return `${ENV.FRONTEND_URL}/#/settings`;
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${ENV.FRONTEND_URL}/#/settings`,
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
        const planId = session.metadata?.planId || 'annual_special';

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

          const paidAmount = session.amount_total || (PLANS[planId]?.amountCents ?? 200000);
          const paidCurrency = session.currency || 'inr';

          await prisma.payment.create({
            data: {
              userId,
              stripeSessionId: session.id,
              amount: paidAmount,
              currency: paidCurrency,
              status: 'succeeded',
              plan: planId,
            },
          });

          const formattedPrice = paidCurrency === 'inr'
            ? `₹${(paidAmount / 100).toLocaleString('en-IN')}`
            : `$${(paidAmount / 100).toFixed(2)}`;

          try {
            await EmailService.sendSubscriptionReceipt(
              user.email,
              user.name,
              PLANS[planId]?.name || 'Cheat Code Pro',
              formattedPrice,
              user.id
            );
          } catch (e) {
            console.warn('[EMAIL WARNING] Could not send receipt email:', e);
          }
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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              tier: 'pro',
              subscriptionStatus: 'active',
            },
          });
          console.log(`[STRIPE WEBHOOK] Recurring payment succeeded for customer ${customerId}`);
        }
        break;
      }
    }
  }
}
