import nodemailer from 'nodemailer';
import { ENV } from './env.js';

export const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_SECURE,
  auth: ENV.SMTP_USER && ENV.SMTP_PASS ? {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  } : undefined,
  tls: {
    rejectUnauthorized: false, // Useful for self-signed certificates in local setups
  },
});

export const checkMailerHealth = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log(`[MAILER] Connected to SMTP server at ${ENV.SMTP_HOST}:${ENV.SMTP_PORT}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[MAILER] SMTP verification failed (${msg}). Mailer will operate in Console Preview mode.`);
    return false;
  }
};
