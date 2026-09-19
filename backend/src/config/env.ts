import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'leettracker_super_secret_jwt_access_key_2026_x99',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'leettracker_super_secret_jwt_refresh_key_2026_z88',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // SMTP Email
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '1025', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'LeetTracker Pro <no-reply@leettracker.io>',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_key_leettracker',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_stripe_webhook_key',
  STRIPE_MOCK_MODE: process.env.STRIPE_MOCK_MODE !== 'false', // Default true for frictionless self-hosting
};
