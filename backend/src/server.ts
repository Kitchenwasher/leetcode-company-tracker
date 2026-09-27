import dns from 'dns';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';

// Configure reliable DNS servers (Google + Cloudflare) to ensure resilient connection to cloud Neon PostgreSQL
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Gracefully fallback to OS default resolver
}

import { prisma } from './config/db.js';
import { checkMailerHealth } from './config/mailer.js';
import { PaymentController } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
const allowedOrigins = [
  ENV.FRONTEND_URL,
  'https://cheat-code.in',
  'https://www.cheat-code.in',
  'http://cheat-code.in',
  'http://www.cheat-code.in',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

const isOriginAllowed = (origin: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow all cheat-code.in domains and subdomains
  if (/^https?:\/\/([a-zA-Z0-9-]+\.)*cheat-code\.in(:\d+)?$/.test(origin)) return true;
  // Allow all Vercel deployment preview / prod URLs
  if (origin.endsWith('.vercel.app')) return true;
  // Allow any localhost / 127.0.0.1 on any port (3000, 4173, 5173, 8080, etc.)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Allow local private network IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }

      // In production, reject unauthorized origins cleanly without crashing with 500
      if (ENV.NODE_ENV === 'production') {
        return callback(null, false);
      }

      return callback(null, true);
    },
    credentials: true,
  })
);

// Stripe webhook requires raw body BEFORE express.json() parser
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

// Buy Me a Coffee webhook requires raw body for HMAC-SHA256 signature verification
app.post(
  '/api/payments/bmc-webhook',
  express.raw({ type: '*/*' }),
  PaymentController.handleBMCWebhook
);

// Standard parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      service: 'leettracker-api',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: msg,
    });
  }
});

// Mount API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(ENV.PORT, async () => {
  console.log(`==================================================`);
  console.log(`🚀 LEETTRACKER PRO BACKEND RUNNING ON PORT ${ENV.PORT}`);
  console.log(`   Health Check: http://localhost:${ENV.PORT}/api/health`);
  console.log(`   Environment:  ${ENV.NODE_ENV}`);
  console.log(`   Database URL: ${ENV.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`==================================================`);

  // Verify mailer
  await checkMailerHealth();
});

export default app;
