import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { EmailService } from '../services/emailService.js';

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  const isProd = ENV.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, targetCompany = 'google' } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const verificationToken = randomUUID();

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          targetCompany,
          verificationToken,
          emailVerified: false,
          tier: 'free',
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          tier: true,
          targetCompany: true,
          targetDate: true,
          dailyTarget: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Send verification email in background
      EmailService.sendWelcomeVerification(user.email, user.name, verificationToken, user.id);

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        message: 'Account created successfully. A verification email has been dispatched.',
        user,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        message: 'Logged in successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          tier: user.tier,
          targetCompany: user.targetCompany,
          targetDate: user.targetDate,
          dailyTarget: user.dailyTarget,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!token) {
        res.status(401).json({ error: 'Refresh token not found.' });
        return;
      }

      const payload = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          tier: true,
          targetCompany: true,
          targetDate: true,
          dailyTarget: true,
          emailVerified: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: 'User no longer exists.' });
        return;
      }

      const newAccessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);
      setRefreshTokenCookie(res, newRefreshToken);
      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, user });
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    const isProd = ENV.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out successfully.' });
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          tier: true,
          targetCompany: true,
          targetDate: true,
          dailyTarget: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { name, targetCompany, targetDate, dailyTarget, avatarUrl } = req.body;

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ? name.trim() : undefined,
          targetCompany: targetCompany || undefined,
          targetDate: targetDate !== undefined ? targetDate : undefined,
          dailyTarget: dailyTarget !== undefined ? Number(dailyTarget) : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          tier: true,
          targetCompany: true,
          targetDate: true,
          dailyTarget: true,
          emailVerified: true,
        },
      });

      res.json({ user: updated, message: 'Profile updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = (req.query.token as string) || req.body?.token;

      if (!token) {
        res.status(400).json({ error: 'Verification token is required.' });
        return;
      }

      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired verification token.' });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
        },
      });

      res.json({ message: 'Email verified successfully! Your account is now active.' });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      // Always return 200 to prevent user enumeration
      if (!user) {
        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        return;
      }

      const resetToken = randomUUID();
      const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires,
        },
      });

      EmailService.sendPasswordReset(user.email, user.name, resetToken, user.id);

      res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'Token and a password of at least 6 characters are required.' });
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) {
        res.status(400).json({ error: 'Invalid or expired password reset token.' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
      next(err);
    }
  }
}
