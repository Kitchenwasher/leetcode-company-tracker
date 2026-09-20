import { Request, Response, NextFunction } from 'express';
import { StripeService, PLANS } from '../services/stripeService.js';
import { BMCService } from '../services/bmcService.js';
import { ENV } from '../config/env.js';
import { prisma } from '../config/db.js';

export class PaymentController {
  static async getPlans(_req: Request, res: Response): Promise<void> {
    res.json({
      plans: [PLANS.annual_special, PLANS.monthly],
      bmcCreatorPage: ENV.BMC_CREATOR_PAGE,
      currency: 'INR',
      offerings: {
        annual: {
          id: 'annual_special',
          name: '1-Year Full Access Pass',
          price: '₹2,000',
          amount: 2000,
          description: '₹2,000 for the first full year, then ₹299/mo',
          paymentUrl: `${ENV.BMC_CREATOR_PAGE}/e/1-year-cheatcode-pro`,
        },
        monthly: {
          id: 'monthly',
          name: 'Monthly Pro Membership',
          price: '₹299/mo',
          amount: 299,
          description: 'Cancel anytime',
          paymentUrl: `${ENV.BMC_CREATOR_PAGE}`,
        },
      },
    });
  }

  static async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { planId = 'annual_special' } = req.body;
      const session = await StripeService.createCheckoutSession(req.user.id, planId);
      res.json(session);
    } catch (err) {
      next(err);
    }
  }

  static async createPortalSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const url = await StripeService.createCustomerPortalSession(req.user.id);
      res.json({ url });
    } catch (err) {
      next(err);
    }
  }

  static async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    try {
      await StripeService.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[STRIPE WEBHOOK ERROR]', msg);
      res.status(400).send(`Webhook Error: ${msg}`);
    }
  }

  /**
   * Buy Me a Coffee Webhook Receiver
   */
  static async handleBMCWebhook(req: Request, res: Response): Promise<void> {
    const signature = (req.headers['x-signature-sha256'] || req.headers['x-signature']) as string | undefined;

    try {
      const result = await BMCService.handleWebhook(req.body, signature);
      res.status(200).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[BMC WEBHOOK ERROR]', msg);
      res.status(400).json({ error: msg });
    }
  }

  /**
   * Verify and activate Pro for a logged-in user who supported on Buy Me a Coffee
   */
  static async verifyBMCPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { payerEmail } = req.body;
      const result = await BMCService.verifyAndUpgradeUser(req.user.id, payerEmail || req.user.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSubscriptionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          tier: true,
          subscriptionStatus: true,
          stripeSubscriptionId: true,
        },
      });

      const payments = await prisma.payment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json({
        tier: user?.tier || 'free',
        isPro: user?.tier === 'pro' || user?.tier === 'enterprise',
        subscriptionStatus: user?.subscriptionStatus || 'none',
        payments,
        bmcCreatorPage: ENV.BMC_CREATOR_PAGE,
      });
    } catch (err) {
      next(err);
    }
  }
}

