import { transporter } from '../config/mailer.js';
import { ENV } from '../config/env.js';
import { prisma } from '../config/db.js';
import {
  EmailTemplateResult,
  getWelcomeVerificationEmail,
  getPasswordResetEmail,
  getSubscriptionReceiptEmail,
  getStreakReminderEmail,
} from '../templates/emails/index.js';

export class EmailService {
  /**
   * Generic sender with DB logging & console fallback
   */
  private static async send(
    to: string,
    templateResult: EmailTemplateResult,
    templateName: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: ENV.EMAIL_FROM,
        to,
        subject: templateResult.subject,
        text: templateResult.text,
        html: templateResult.html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SENT] To: ${to} | Subject: "${templateResult.subject}" | MessageId: ${info.messageId}`);

      // Log in database
      await prisma.emailLog.create({
        data: {
          userId,
          recipient: to,
          subject: templateResult.subject,
          template: templateName,
          status: 'sent',
        },
      }).catch((e) => console.warn('[EMAIL DB LOG ERROR]', e));

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[EMAIL DISPATCH FAILED] To: ${to} (${msg}). Falling back to console output:`);
      console.log('--------------------------------------------------');
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${templateResult.subject}`);
      console.log(templateResult.text);
      console.log('--------------------------------------------------');

      await prisma.emailLog.create({
        data: {
          userId,
          recipient: to,
          subject: templateResult.subject,
          template: templateName,
          status: 'failed',
          errorMessage: msg,
        },
      }).catch(() => {});

      return false;
    }
  }

  static async sendWelcomeVerification(
    to: string,
    name: string,
    token: string,
    userId?: string
  ): Promise<boolean> {
    const verifyUrl = `${ENV.FRONTEND_URL}/#/verify-email?token=${token}`;
    // Extract last 6 chars of token as short OTP
    const otpCode = token.slice(-6).toUpperCase();
    const template = getWelcomeVerificationEmail(name, verifyUrl, otpCode);
    return this.send(to, template, 'welcome-verification', userId);
  }

  static async sendPasswordReset(
    to: string,
    name: string,
    token: string,
    userId?: string
  ): Promise<boolean> {
    const resetUrl = `${ENV.FRONTEND_URL}/#/reset-password?token=${token}`;
    const template = getPasswordResetEmail(name, resetUrl);
    return this.send(to, template, 'password-reset', userId);
  }

  static async sendSubscriptionReceipt(
    to: string,
    name: string,
    planName: string,
    amount: string,
    userId?: string
  ): Promise<boolean> {
    const template = getSubscriptionReceiptEmail(name, planName, amount);
    return this.send(to, template, 'subscription-receipt', userId);
  }

  static async sendStreakReminder(
    to: string,
    name: string,
    streak: number,
    dailyGoal: number,
    remaining: number,
    userId?: string
  ): Promise<boolean> {
    const template = getStreakReminderEmail(name, streak, dailyGoal, remaining);
    return this.send(to, template, 'streak-reminder', userId);
  }
}
