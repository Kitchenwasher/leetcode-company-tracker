import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { EmailService } from '../services/emailService.js';
import { prisma } from '../config/db.js';

export class EmailController {
  static async sendTestEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email = 'test@example.com' } = req.body;
      const testToken = randomUUID();
      const success = await EmailService.sendWelcomeVerification(
        email,
        'Test Candidate',
        testToken,
        req.user?.id
      );

      res.json({
        success,
        recipient: email,
        message: success
          ? 'Test email dispatched successfully via SMTP.'
          : 'Failed to send via SMTP; email details printed to server console.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.emailVerified) {
        res.status(400).json({ error: 'Email is already verified.' });
        return;
      }

      const token = randomUUID();
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: token },
      });

      await EmailService.sendWelcomeVerification(user.email, user.name, token, user.id);

      res.json({ message: 'A fresh verification email has been sent.' });
    } catch (err) {
      next(err);
    }
  }
}
