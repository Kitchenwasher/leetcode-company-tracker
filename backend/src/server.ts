import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
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
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in self-hosted dev
      }
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
