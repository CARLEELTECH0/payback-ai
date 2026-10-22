const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const db = require('./config/database');
const { createRedisConnection } = require('./config/redis');
const { initializeQueues } = require('./queues/setup');
const { initializeAutopayQueue } = require('./queues/autopay.queue');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const billerRoutes = require('./modules/payment/biller.routes');
const autopayRoutes = require('./modules/autopay/autopay.routes');
const paybackRoutes = require('./modules/payback/payback.routes');

const app = express();

// ============================================
// Global Middleware
// ============================================
app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));
app.use(apiLimiter);

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AutoPay Nigeria API is running',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/billers', billerRoutes);
app.use('/api/autopay', autopayRoutes);
app.use('/api/payback', paybackRoutes);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================
// Error Handler
// ============================================
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Server will start anyway but DB operations will fail.');
    }

    // Connect Redis (optional — queues/caching won't work without it)
    let redisAvailable = false;
    try {
      const redis = createRedisConnection();
      // Quick connection test
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 3000);
        redis.once('connect', () => { clearTimeout(timeout); resolve(); });
        redis.once('error', () => { clearTimeout(timeout); reject(new Error('Redis unavailable')); });
      });
      redisAvailable = true;
      logger.info('Redis connected successfully');
    } catch (redisError) {
      logger.warn('Redis not available — queues and caching disabled. Start Redis or Docker to enable.', { error: redisError.message });
    }

    // Initialize BullMQ queues (only if Redis is available)
    if (redisAvailable) {
      try {
        const { initializeTransactionQueue } = require('./queues/transaction.queue');
        const { initializeTransactionWorker } = require('./queues/transaction.worker');
        initializeQueues();
        initializeAutopayQueue();
        initializeTransactionQueue();
        initializeTransactionWorker();
        logger.info('BullMQ queues initialized');
      } catch (queueError) {
        logger.warn('Queue initialization failed. Background jobs will not work.', { error: queueError.message });
      }
    }

    // Start Express server
    app.listen(env.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║     🚀 AutoPay Nigeria API Server Started        ║
╠══════════════════════════════════════════════════╣
║  Port:        ${String(env.port).padEnd(34)}║
║  Environment: ${String(env.nodeEnv).padEnd(34)}║
║  Interswitch: ${String(env.interswitch.mockMode ? 'MOCK MODE' : 'LIVE (QA)').padEnd(34)}║
║  Base URL:    ${String(env.interswitch.baseUrl).padEnd(34)}║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await db.pool.end();
  process.exit(0);
});

startServer();

module.exports = app;
