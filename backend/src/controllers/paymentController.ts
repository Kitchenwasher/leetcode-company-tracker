import { Request, Response, NextFunction } from 'express';
import { StripeService, PLANS } from '../services/stripeService.js';
import { BMCService } from '../services/bmcService.js';
import { ENV } from '../config/env.js';
import { prisma } from '../config/db.js';

export class PaymentController {
  static async getPlans(_req: Request, res: Response): Promise<void> {
    res.json({
      plans: [PLANS.lifetime, PLANS.monthly],
      bmcCreatorPage: ENV.BMC_CREATOR_PAGE,
      currency: 'INR',
      offerings: {
        lifetime: {
          id: 'lifetime',
          name: 'Lifetime Access Pass',
          price: '₹2,000',
          amount: 2000,
          description: 'One-time payment • Pay once, own forever • No recurring fees',
          paymentUrl: `${ENV.BMC_CREATOR_PAGE}`,
        },
        monthly: {
          id: 'monthly',
          name: '1-Month Pro Membership',
          price: '₹299/mo',
          amount: 299,
          description: 'Billed monthly • Cancel anytime',
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
      const result = await BMCService.verifyAndUpgradeUser(req.user.id, payerEmail);
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

      const subInfo = await BMCService.syncUserSubscription(req.user.id);

      const payments = await prisma.payment.findMany({
        where: {
          userId: req.user.id,
          NOT: { stripeSessionId: { startsWith: 'bmc_claim_' } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json({
        tier: subInfo.tier,
        isPro: subInfo.isPro,
        subscriptionStatus: subInfo.subscriptionStatus || 'none',
        plan: subInfo.plan,
        planType: subInfo.planType,
        expiresAt: subInfo.expiresAt,
        daysRemaining: subInfo.daysRemaining,
        payments,
        bmcCreatorPage: ENV.BMC_CREATOR_PAGE,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Redeem a VIP / Friend Pass promo code to get instant Pro Lifetime access for free
   */
  static async redeemVipCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Please provide a valid VIP promo code' });
        return;
      }

      const normalizedInput = code.trim().toUpperCase();
      const validCodes = (ENV.VIP_PROMO_CODES || '')
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      const isValid = validCodes.includes(normalizedInput);

      if (!isValid) {
        res.status(400).json({
          error: 'Invalid or expired VIP promo code. Please double-check with the admin.',
        });
        return;
      }

      // Upgrade user to Pro Lifetime
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          tier: 'pro',
          subscriptionStatus: 'lifetime',
        },
      });

      // Record a 0-amount succeeded lifetime payment so subscription sync remains permanent
      const paymentRef = `vip_gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await prisma.payment.create({
        data: {
          userId: req.user.id,
          payerEmail: updatedUser.email,
          amount: 0,
          currency: 'INR',
          status: 'succeeded',
          plan: 'pro_lifetime',
          stripeSessionId: paymentRef,
        },
      });

      res.json({
        success: true,
        message: '🎉 VIP Lifetime Pass activated! Welcome to CheatCode Pro.',
        tier: 'pro',
        isPro: true,
        subscriptionStatus: 'lifetime',
        plan: 'Lifetime Access Pass (VIP Friend)',
      });
    } catch (err) {
      next(err);
    }
  }
}

