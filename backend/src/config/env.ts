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

  // OAuth Credentials (Google & GitHub)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',

  // Buy Me a Coffee Gateway
  BMC_WEBHOOK_SECRET: process.env.BMC_WEBHOOK_SECRET || '105509fc00258be02142f120fa6311291af80ccc17357b69c9045f32ab2e1ef7680bc642676cbbfe',
  BMC_CREATOR_PAGE: process.env.BMC_CREATOR_PAGE || 'https://buymeacoffee.com/cheatcode69',

  // Meta Muse LLM (Contributor Tier)
  MUSE_API_KEY: process.env.MUSE_API_KEY || 'LLM_1611329520586286_g-veMmNkfLODJLJu3eUWqyCJEv4',
  MUSE_API_URL: process.env.MUSE_API_URL || 'https://api.meta.ai/v1',
  MUSE_MODEL: process.env.MUSE_MODEL || 'muse-spark-1.3-contributor',
};
