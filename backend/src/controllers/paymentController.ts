import { Request, Response, NextFunction } from 'express';
import { StripeService, PLANS } from '../services/stripeService.js';
import { prisma } from '../config/db.js';

export class PaymentController {
  static async getPlans(_req: Request, res: Response): Promise<void> {
    res.json({ plans: Object.values(PLANS) });
  }

  static async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { planId = 'pro_monthly' } = req.body;
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
      });
    } catch (err) {
      next(err);
    }
  }
}
