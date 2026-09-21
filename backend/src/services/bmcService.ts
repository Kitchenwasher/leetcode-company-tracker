import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { prisma } from '../config/db.js';

export interface BMCWebhookPayload {
  type?: string;
  event?: string;
  attempt?: number;
  response?: Record<string, any>;
  data?: Record<string, any>;
  supporter_email?: string;
  payer_email?: string;
  email?: string;
  [key: string]: any;
}

export interface VerificationResult {
  tier: string;
  isPro: boolean;
  plan?: string;
  planType?: 'monthly' | 'lifetime';
  expiresAt?: string | null;
  daysRemaining?: number | null;
  message: string;
}

export class BMCService {
  /**
   * Verifies the Buy Me a Coffee webhook HMAC-SHA256 signature
   */
  static verifySignature(rawBody: Buffer | string, signature?: string): boolean {
    if (!ENV.BMC_WEBHOOK_SECRET) {
      console.warn('[BMC WEBHOOK] No BMC_WEBHOOK_SECRET configured, skipping signature check.');
      return true;
    }

    if (!signature) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', ENV.BMC_WEBHOOK_SECRET);
      const digest = hmac.update(rawBody).digest('hex');

      // Constant-time comparison
      const sigBuf = Buffer.from(signature.trim(), 'utf8');
      const digestBuf = Buffer.from(digest.trim(), 'utf8');

      if (sigBuf.length !== digestBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuf, digestBuf);
    } catch (err) {
      console.error('[BMC SIGNATURE ERROR]', err);
      return false;
    }
  }

  /**
   * Processes a webhook payload from Buy Me a Coffee
   */
  static async handleWebhook(rawBody: Buffer | string, signature?: string): Promise<{
    success: boolean;
    upgraded: boolean;
    email?: string;
    userId?: string;
    message: string;
  }> {
    if (signature && ENV.BMC_WEBHOOK_SECRET) {
      const valid = this.verifySignature(rawBody, signature);
      if (!valid) {
        throw new Error('Invalid Buy Me a Coffee webhook signature');
      }
    }

    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    let payload: BMCWebhookPayload;
    try {
      payload = JSON.parse(bodyStr);
    } catch {
      throw new Error('Malformed JSON payload from BMC webhook');
    }

    console.log('[BMC WEBHOOK RECEIVED]:', JSON.stringify(payload, null, 2));

    const inner = payload.response || payload.data || payload;
    const email = (
      inner.supporter_email ||
      inner.support_email ||
      inner.payer_email ||
      inner.email ||
      payload.supporter_email ||
      payload.payer_email ||
      payload.email
    )?.toLowerCase().trim();

    if (!email) {
      return {
        success: true,
        upgraded: false,
        message: 'No supporter email in webhook payload (e.g. test ping or non-payment event)',
      };
    }

    const amountNum = parseFloat(
      String(inner.total_amount || inner.amount || (inner.support_coffees ? inner.support_coffees * 5 : 0))
    ) || 0;
    const currency = String(inner.currency || 'INR').toLowerCase();

    const tierName = String(
      inner.membership_tier_name ||
      inner.extra_title ||
      inner.tier_name ||
      payload.type ||
      payload.event ||
      ''
    ).toLowerCase();

    // Lifetime if amount >= 1000 INR (or >= $15) OR title contains life/year/annual/forever
    const isLifetime =
      amountNum >= 1000 ||
      (currency !== 'inr' && amountNum >= 15) ||
      tierName.includes('life') ||
      tierName.includes('year') ||
      tierName.includes('annual') ||
      tierName.includes('forever');

    const plan = isLifetime ? 'pro_lifetime' : 'pro_monthly';
    const subscriptionStatus = isLifetime ? 'lifetime' : 'active';
    const txnId = String(inner.support_id || inner.order_id || inner.transaction_id || inner.payment_id || Date.now());
    const stripeSessionId = `bmc_${txnId}`;

    // Deduplication: check if this payment was already recorded
    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId },
    });

    if (existingPayment) {
      console.log(`[BMC WEBHOOK] Payment ${stripeSessionId} already processed. Skipping duplicate.`);
      return {
        success: true,
        upgraded: true,
        email,
        userId: existingPayment.userId || undefined,
        message: 'Payment was already processed.',
      };
    }

    // Look up user by email in Neon DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: 'pro',
          subscriptionStatus,
        },
      });

      await prisma.payment.create({
        data: {
          userId: user.id,
          payerEmail: email,
          amount: Math.round((amountNum || (isLifetime ? 2000 : 299)) * 100),
          currency,
          status: 'succeeded',
          plan,
          stripeSessionId,
        },
      });

      console.log(`[BMC UPGRADE SUCCESS] User ${email} (${user.id}) upgraded to Pro (${plan}) via Buy Me a Coffee!`);
      return {
        success: true,
        upgraded: true,
        email,
        userId: user.id,
        message: `User ${email} upgraded to Pro (${plan}) successfully`,
      };
    } else {
      // User hasn't signed up yet or used an unlinked email: record payment with userId: null so it can be claimed
      await prisma.payment.create({
        data: {
          userId: null,
          payerEmail: email,
          amount: Math.round((amountNum || (isLifetime ? 2000 : 299)) * 100),
          currency,
          status: 'succeeded',
          plan,
          stripeSessionId,
        },
      });

      console.log(`[BMC PENDING USER] Payment logged for ${email}. Will auto-link upon signup or verification.`);
      return {
        success: true,
        upgraded: false,
        email,
        message: `Payment logged. User ${email} will get Pro access upon signing up or verifying.`,
      };
    }
  }

  /**
   * Secure verification endpoint for logged-in users who paid via Buy Me a Coffee.
   * STRICT: Only upgrades if a genuine, succeeded payment exists in the database.
   * Differentiates between 1-Month (pro_monthly, 30 days) and Lifetime (pro_lifetime, permanent).
   */
  static async verifyAndUpgradeUser(userId: string, payerEmailInput?: string): Promise<VerificationResult> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const userEmail = user.email.toLowerCase().trim();
    const payerEmail = payerEmailInput?.toLowerCase().trim();

    // 1. Look for an existing succeeded payment already linked to this user (excluding fake claims)
    let payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: 'succeeded',
        NOT: {
          stripeSessionId: {
            startsWith: 'bmc_claim_',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. If not linked, search unlinked payments matching user's email or provided payerEmail
    if (!payment) {
      const searchEmails = [userEmail];
      if (payerEmail && payerEmail !== userEmail) {
        searchEmails.push(payerEmail);
      }

      payment = await prisma.payment.findFirst({
        where: {
          userId: null,
          status: 'succeeded',
          payerEmail: {
            in: searchEmails,
          },
          NOT: {
            stripeSessionId: {
              startsWith: 'bmc_claim_',
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Link payment to this user if found
      if (payment) {
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: { userId: user.id },
        });
      }
    }

    // 3. If still NO payment found, STRICTLY REJECT. Do NOT upgrade user!
    if (!payment) {
      return {
        tier: user.tier,
        isPro: false,
        message: `No confirmed payment found for ${payerEmail && payerEmail !== userEmail ? `${payerEmail} or ${userEmail}` : userEmail}. If you just paid on Buy Me a Coffee, please wait 30-60 seconds for the webhook to reach our server, then try again.`,
      };
    }

    // 4. Determine plan type: Lifetime vs Monthly
    const isLifetime =
      payment.plan === 'pro_lifetime' ||
      payment.plan === 'pro_yearly' ||
      payment.plan === 'annual_special' ||
      payment.amount >= 100000;

    if (isLifetime) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: 'pro',
          subscriptionStatus: 'lifetime',
        },
      });

      return {
        tier: updated.tier,
        isPro: true,
        plan: 'Lifetime Access Pass',
        planType: 'lifetime',
        expiresAt: null,
        daysRemaining: null,
        message: '🎉 Lifetime Access Pass verified! You have permanent Pro access with zero recurring fees.',
      };
    }

    // Monthly Membership: Check 30-day expiration
    const purchaseDate = new Date(payment.createdAt);
    const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const expiresAt = new Date(purchaseDate.getTime() + durationMs);
    const now = Date.now();
    const isExpired = now > expiresAt.getTime();

    if (isExpired) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: 'free',
          subscriptionStatus: 'expired',
        },
      });

      return {
        tier: updated.tier,
        isPro: false,
        plan: '1-Month Pro Membership',
        planType: 'monthly',
        expiresAt: expiresAt.toISOString(),
        daysRemaining: 0,
        message: `Your 1-Month Pro Membership expired on ${expiresAt.toLocaleDateString()}. Please renew on Buy Me a Coffee to continue accessing Pro features.`,
      };
    }

    const daysRemaining = Math.max(1, Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)));
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: 'pro',
        subscriptionStatus: 'active',
      },
    });

    return {
      tier: updated.tier,
      isPro: true,
      plan: '1-Month Pro Membership',
      planType: 'monthly',
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
      message: `🎉 1-Month Pro Membership verified! Active for ${daysRemaining} more days (expires ${expiresAt.toLocaleDateString()}).`,
    };
  }

  /**
   * Synchronizes user's subscription status based on actual payments in DB.
   * Auto-links unlinked payments matching user's email.
   * Auto-downgrades expired monthly subscriptions.
   * Reverts unverified users to free tier.
   */
  static async syncUserSubscription(userId: string): Promise<{
    tier: string;
    subscriptionStatus: string | null;
    isPro: boolean;
    plan?: string;
    planType?: 'monthly' | 'lifetime';
    expiresAt?: string | null;
    daysRemaining?: number | null;
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { tier: 'free', subscriptionStatus: null, isPro: false };
    }

    const userEmail = user.email.toLowerCase().trim();

    // 1. Check for any unlinked payments matching user's email and link them
    const unlinkedPayment = await prisma.payment.findFirst({
      where: {
        userId: null,
        status: 'succeeded',
        payerEmail: userEmail,
        NOT: { stripeSessionId: { startsWith: 'bmc_claim_' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (unlinkedPayment) {
      await prisma.payment.update({
        where: { id: unlinkedPayment.id },
        data: { userId: user.id },
      });
    }

    // 2. Find latest valid succeeded payment for this user
    const payment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: 'succeeded',
        NOT: { stripeSessionId: { startsWith: 'bmc_claim_' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. If no payment exists:
    if (!payment) {
      if (user.tier !== 'free' || user.subscriptionStatus !== null) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: 'free', subscriptionStatus: null },
        });
      }
      return { tier: 'free', subscriptionStatus: null, isPro: false };
    }

    // 4. Lifetime payment
    const isLifetime =
      payment.plan === 'pro_lifetime' ||
      payment.plan === 'pro_yearly' ||
      payment.plan === 'annual_special' ||
      payment.amount >= 100000;

    if (isLifetime) {
      if (user.tier !== 'pro' || user.subscriptionStatus !== 'lifetime') {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: 'pro', subscriptionStatus: 'lifetime' },
        });
      }
      return {
        tier: 'pro',
        subscriptionStatus: 'lifetime',
        isPro: true,
        plan: 'Lifetime Access Pass',
        planType: 'lifetime',
        expiresAt: null,
        daysRemaining: null,
      };
    }

    // 5. Monthly payment: check 30-day expiration
    const purchaseDate = new Date(payment.createdAt);
    const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    const expiresAt = new Date(purchaseDate.getTime() + durationMs);
    const now = Date.now();
    const isExpired = now > expiresAt.getTime();

    if (isExpired) {
      if (user.tier !== 'free' || user.subscriptionStatus !== 'expired') {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: 'free', subscriptionStatus: 'expired' },
        });
      }
      return {
        tier: 'free',
        subscriptionStatus: 'expired',
        isPro: false,
        plan: '1-Month Pro Membership',
        planType: 'monthly',
        expiresAt: expiresAt.toISOString(),
        daysRemaining: 0,
      };
    }

    const daysRemaining = Math.max(1, Math.ceil((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)));
    if (user.tier !== 'pro' || user.subscriptionStatus !== 'active') {
      await prisma.user.update({
        where: { id: user.id },
        data: { tier: 'pro', subscriptionStatus: 'active' },
      });
    }

    return {
      tier: 'pro',
      subscriptionStatus: 'active',
      isPro: true,
      plan: '1-Month Pro Membership',
      planType: 'monthly',
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
    };
  }
}
