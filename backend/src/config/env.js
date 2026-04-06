const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const env = {
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://autopay_user:autopay_secret_2024@localhost:5432/autopay_nigeria',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://:autopay_redis_2024@localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Interswitch Quickteller v5
  interswitch: {
    clientId: process.env.INTERSWITCH_CLIENT_ID || '',
    clientSecret: process.env.INTERSWITCH_CLIENT_SECRET || '',
    baseUrl: process.env.INTERSWITCH_BASE_URL || 'https://qa.interswitchng.com',
    terminalId: process.env.INTERSWITCH_TERMINAL_ID || '',
    paymentItemId: process.env.INTERSWITCH_PAYMENT_ITEM_ID || '',
    mockMode: process.env.INTERSWITCH_MOCK_MODE === 'true',
    // Source account for TransferFunds
    sourceAccountNumber: process.env.INTERSWITCH_SOURCE_ACCOUNT_NUMBER || '',
    sourceAccountName: process.env.INTERSWITCH_SOURCE_ACCOUNT_NAME || '',
    sourceBankCode: process.env.INTERSWITCH_SOURCE_BANK_CODE || '',
  },

  // SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@autopaynigeria.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'AutoPay Nigeria',
  },

  // Termii
  termii: {
    apiKey: process.env.TERMII_API_KEY || '',
    senderId: process.env.TERMII_SENDER_ID || 'AutoPay',
    baseUrl: process.env.TERMII_BASE_URL || 'https://api.ng.termii.com',
  },

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32chars-here!',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
};

// Validate critical env vars in production
if (env.nodeEnv === 'production') {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'REDIS_URL', 'ENCRYPTION_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = env;
