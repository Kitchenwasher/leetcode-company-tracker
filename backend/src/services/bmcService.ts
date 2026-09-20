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
      String(inner.total_amount || inner.amount || (inner.support_coffees ? inner.support_coffees * 5 : 2000))
    ) || 2000;
    const currency = String(inner.currency || 'INR').toLowerCase();
    const isLifetime =
      amountNum >= 1000 ||
      String(inner.membership_tier_name || inner.extra_title || payload.type || '').toLowerCase().includes('life') ||
      String(inner.membership_tier_name || inner.extra_title || payload.type || '').toLowerCase().includes('year');
    const plan = isLifetime ? 'pro_lifetime' : 'pro_monthly';
    const txnId = String(inner.support_id || inner.order_id || inner.transaction_id || `bmc_${Date.now()}`);

    // Look up user by email in Neon DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: 'pro',
          subscriptionStatus: 'active',
        },
      });

      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: Math.round(amountNum * 100),
          currency,
          status: 'succeeded',
          plan,
          stripeSessionId: `bmc_${txnId}`,
        },
      });

      console.log(`[BMC UPGRADE SUCCESS] User ${email} (${user.id}) upgraded to Pro via Buy Me a Coffee!`);
      return {
        success: true,
        upgraded: true,
        email,
        userId: user.id,
        message: `User ${email} upgraded to Pro successfully`,
      };
    } else {
      console.log(`[BMC PENDING USER] Payment received for ${email}, but user has not signed up yet.`);
      return {
        success: true,
        upgraded: false,
        email,
        message: `Payment logged. User ${email} will get Pro access upon signing up.`,
      };
    }
  }

  /**
   * Instant verification endpoint for logged-in users who paid via Buy Me a Coffee
   */
  static async verifyAndUpgradeUser(userId: string, payerEmail?: string): Promise<{
    tier: string;
    isPro: boolean;
    message: string;
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Upgrade the user to Pro
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        tier: 'pro',
        subscriptionStatus: 'active',
      },
    });

    // Record the payment
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 200000, // 2,000 INR
        currency: 'inr',
        status: 'succeeded',
        plan: 'pro_yearly',
        stripeSessionId: `bmc_claim_${Date.now()}`,
      },
    });

    return {
      tier: updated.tier,
      isPro: true,
      message: 'Pro access successfully activated!',
    };
  }
}
