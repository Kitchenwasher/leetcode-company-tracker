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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, targetCompany = 'google', leetcodeUsername } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

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
          targetCompany: targetCompany.trim(),
          leetcodeUsername: leetcodeUsername ? String(leetcodeUsername).trim() : null,
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
          leetcodeUsername: true,
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

      if (!user.passwordHash) {
        res.status(400).json({
          error: 'This account was registered using Google Sign-In. Please sign in with Google.',
        });
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
          leetcodeUsername: user.leetcodeUsername,
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

  /**
   * Google OAuth: Verifies Google credential (ID token) or authorization code and upserts user in Neon DB
   */
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { credential, code } = req.body;

      if (!credential && !code) {
        res.status(400).json({ error: 'Google credential or authorization code is required.' });
        return;
      }

      let googleUser: {
        sub: string;
        email: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
      } | null = null;

      if (credential) {
        // 1. Verify token directly via Google OAuth tokeninfo endpoint
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (!googleRes.ok) {
          res.status(401).json({ error: 'Invalid or expired Google authentication token.' });
          return;
        }
        const tokenInfo = (await googleRes.json()) as any;
        if (!tokenInfo.email || !tokenInfo.sub) {
          res.status(401).json({ error: 'Invalid Google token payload.' });
          return;
        }
        googleUser = {
          sub: tokenInfo.sub,
          email: tokenInfo.email.toLowerCase().trim(),
          name: tokenInfo.name || tokenInfo.email.split('@')[0],
          picture: tokenInfo.picture,
          email_verified: tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true,
        };
      } else if (code) {
        // OAuth authorization code flow
        if (!ENV.GOOGLE_CLIENT_ID || !ENV.GOOGLE_CLIENT_SECRET) {
          res.status(500).json({ error: 'Google OAuth server credentials not configured.' });
          return;
        }
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: ENV.GOOGLE_CLIENT_ID,
            client_secret: ENV.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${ENV.FRONTEND_URL}/auth/google/callback`,
            grant_type: 'authorization_code',
          }),
        });
        if (!tokenResponse.ok) {
          res.status(401).json({ error: 'Failed to exchange Google authorization code.' });
          return;
        }
        const tokens = (await tokenResponse.json()) as any;
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!userRes.ok) {
          res.status(401).json({ error: 'Failed to fetch user profile from Google.' });
          return;
        }
        const profile = (await userRes.json()) as any;
        googleUser = {
          sub: profile.sub,
          email: profile.email.toLowerCase().trim(),
          name: profile.name || profile.email.split('@')[0],
          picture: profile.picture,
          email_verified: profile.email_verified,
        };
      }

      if (!googleUser) {
        res.status(400).json({ error: 'Failed to parse Google user data.' });
        return;
      }

      // Check if user exists by googleId or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleUser.sub },
            { email: googleUser.email },
          ],
        },
      });

      if (user) {
        // Link googleId if needed & update avatar if not set
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleUser.sub,
            emailVerified: true,
            avatarUrl: user.avatarUrl || googleUser.picture || undefined,
            name: user.name || googleUser.name || 'Developer',
          },
        });
      } else {
        // Create new user in Neon PostgreSQL
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.sub,
            name: googleUser.name || 'Developer',
            avatarUrl: googleUser.picture || null,
            tier: 'free',
            targetCompany: 'google',
            dailyTarget: 3,
            emailVerified: true,
          },
        });
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        message: 'Signed in with Google successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          tier: user.tier,
          targetCompany: user.targetCompany,
          targetDate: user.targetDate,
          dailyTarget: user.dailyTarget,
          leetcodeUsername: user.leetcodeUsername,
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

  /**
   * GitHub OAuth Architecture: Exchanging auth code for user and upserting in Neon DB
   */
  static async githubAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) {
        res.status(400).json({ error: 'GitHub authorization code is required.' });
        return;
      }

      if (!ENV.GITHUB_CLIENT_ID || !ENV.GITHUB_CLIENT_SECRET) {
        res.status(501).json({
          error: 'GitHub OAuth is not configured on the server yet. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env',
        });
        return;
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: ENV.GITHUB_CLIENT_ID,
          client_secret: ENV.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = (await tokenRes.json()) as any;
      if (!tokenData.access_token) {
        res.status(401).json({ error: 'Failed to retrieve GitHub access token.' });
        return;
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'LeetTracker-Auth',
        },
      });
      const ghUser = (await userRes.json()) as any;

      let email = ghUser.email;
      if (!email) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'LeetTracker-Auth',
          },
        });
        const emails = (await emailRes.json()) as any;
        const primary = Array.isArray(emails) ? emails.find((e: any) => e.primary && e.verified) : null;
        email = primary?.email || `${ghUser.id}+github@leettracker.io`;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const githubId = String(ghUser.id);

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { githubId },
            { email: normalizedEmail },
          ],
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: user.githubId || githubId,
            emailVerified: true,
            avatarUrl: user.avatarUrl || ghUser.avatar_url || undefined,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            githubId,
            name: ghUser.name || ghUser.login || 'GitHub Developer',
            avatarUrl: ghUser.avatar_url || null,
            tier: 'free',
            targetCompany: 'google',
            dailyTarget: 3,
            emailVerified: true,
          },
        });
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        message: 'Signed in with GitHub successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          tier: user.tier,
          targetCompany: user.targetCompany,
          targetDate: user.targetDate,
          dailyTarget: user.dailyTarget,
          leetcodeUsername: user.leetcodeUsername,
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

  /**
   * Returns public OAuth configuration to frontend
   */
  static getOAuthConfig(_req: Request, res: Response): void {
    res.json({
      googleClientId: ENV.GOOGLE_CLIENT_ID || null,
      githubConfigured: !!(ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET),
    });
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
          leetcodeUsername: true,
          emailVerified: true,
          createdAt: true,
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
          leetcodeUsername: true,
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

      const { name, targetCompany, targetDate, dailyTarget, avatarUrl, leetcodeUsername } = req.body;

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: name ? name.trim() : undefined,
          targetCompany: targetCompany ? targetCompany.trim() : undefined,
          targetDate: targetDate !== undefined ? targetDate : undefined,
          dailyTarget: dailyTarget !== undefined ? Number(dailyTarget) : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
          leetcodeUsername: leetcodeUsername !== undefined
            ? (leetcodeUsername ? String(leetcodeUsername).trim() : null)
            : undefined,
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
          leetcodeUsername: true,
          emailVerified: true,
          createdAt: true,
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

      if (!token || !newPassword || newPassword.length < 8) {
        res.status(400).json({ error: 'Token and a password of at least 8 characters are required.' });
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
